const HttpStatusHelper = require("../utils/HttpStatuHelper");
const Comment = require("../models/Comment");
const GroupMember = require("../models/GroupMember");
const Like = require("../models/Like");
const User = require("../models/User");
const Graduate = require("../models/Graduate");
const Post = require("../models/Post");
const PostImage = require("../models/PostImage");
const Staff = require("../models/Staff");
const Friendship = require("../models/Friendship");
const checkStaffPermission = require("../utils/permissionChecker");
const { isContentBad } = require("../utils/moderation"); 

// 🔴 START OF LOGGER IMPORT - ADDED THIS
const { logger, securityLogger } = require("../utils/logger");
// 🔴 END OF LOGGER IMPORT

const { Op } = require("sequelize");
const moment = require("moment");
const {
  notifyPostLiked,
  notifyPostCommented,
  notifyCommentReplied,
  notifyCommentEdited,
  notifyCommentDeleted,
} = require("../services/notificationService");

// Helper function to calculate likesCount and isLikedByYou for a post
const getPostLikeInfo = async (postId, userId = null) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.debug("Calculating post like info", { postId, userId });
    // 🔴 END OF LOGGING

    const likesCount = await Like.count({
      where: { "post-id": postId },
    });

    let isLikedByYou = false;
    if (userId) {
      const userLike = await Like.findOne({
        where: {
          "post-id": postId,
          "user-id": userId,
        },
      });
      isLikedByYou = !!userLike;
    }

    // 🔴 START OF LOGGING - ADDED THIS
    logger.debug("Post like info calculated", {
      postId,
      userId,
      likesCount,
      isLikedByYou,
    });
    // 🔴 END OF LOGGING

    return { likesCount, isLikedByYou };
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error in getPostLikeInfo", {
      postId,
      userId,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING
    throw error;
  }
};
const createPost = async (req, res) => {
  logger.info("🟢 ----- [createPost] START -----", {
    timestamp: new Date().toISOString(),
    user: req.user
      ? { id: req.user.id, type: req.user["user-type"] }
      : "undefined",
  });

  try {
    logger.debug("Request details", {
      contentType: req.headers["content-type"],
      authHeader: req.headers["authorization"] ? "Present" : "Missing",
      user: req.user,
      body: req.body,
      filesCount: req.files ? req.files.length : 0,
    });

    const { category, content, groupId, inLanding, type, postAsAdmin } = req.body;
    const userId = req.user?.id;

    if (!req.user) {
      logger.warn("CRITICAL: req.user is UNDEFINED in createPost");
      return res.status(403).json({ status: "fail", message: "User not authenticated" });
    }

    const allowedUserTypes = ["admin", "staff", "graduate"];
    const userType = req.user["user-type"];

    if (!userId || !allowedUserTypes.includes(userType)) {
      logger.warn("ACCESS DENIED in createPost", { userId: !!userId, userType, allowedTypes: allowedUserTypes });
      return res.status(403).json({ status: "fail", message: "Access denied. Invalid user type or missing user ID." });
    }

    logger.info("User type check passed", { userId, userType });

    if (userType === "staff") {
      const hasPermission = await checkStaffPermission(userId, "Community Post's management", "add");
      if (!hasPermission) {
        logger.warn("STAFF PERMISSION DENIED in createPost", { userId });
        return res.status(403).json({ status: "fail", message: "Access denied. You don't have permission to create posts." });
      }
      logger.info("Staff permission check passed", { userId });
    }

    if (userType === "graduate") {
      const graduate = await Graduate.findOne({ where: { graduate_id: userId } });
      if (!graduate) {
        logger.error("GRADUATE RECORD NOT FOUND in createPost", { userId });
        return res.status(404).json({ status: "fail", message: "Graduate record not found" });
      }
      if (graduate.status !== "active") {
        logger.warn("GRADUATE ACCOUNT INACTIVE in createPost", { userId, currentStatus: graduate.status });
        return res.status(403).json({
          status: "fail",
          message: "Your account is inactive, Please contact the Alumni Portal Team to activate your profile.",
        });
      }
      logger.info("Graduate status check passed", { userId, status: graduate.status });
    }

    // 🛑 AI Moderation: التحقق من المحتوى قبل الحفظ
    const flagged = await isContentBad(content);
    if (flagged) {
      logger.warn("Post content flagged by AI moderation", { userId, content: content?.substring(0, 100) });
      return res.status(400).json({
        status: "fail",
        message: "Your post contains inappropriate content and cannot be published.",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      logger.error("USER NOT FOUND IN DATABASE in createPost", { userId });
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    let authorId = userId;
    if (postAsAdmin && user["user-type"] === "staff") {
      const adminUser = await User.findOne({ where: { "user-type": "admin" }, attributes: ["id"] });
      if (adminUser) {
        authorId = adminUser.id;
        logger.info("Staff posting as Admin", { staffId: userId, adminId: authorId });
      } else {
        logger.warn("No admin user found, posting as staff", { userId });
      }
    }

    logger.info("Creating post", { authorId, category: category || type || "General", contentLength: content?.length || 0, groupId, inLanding });

    const newPost = await Post.create({
      category: category || type || "General",
      content: content || "",
      "author-id": authorId,
      "group-id": groupId || null,
      "in-landing": inLanding || false,
    });

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      logger.info(`Processing ${req.files.length} file(s) for post`, { postId: newPost.post_id });
      const imagesData = req.files.map((file) => ({
        "post-id": newPost.post_id,
        "image-url": file.path || file.url || file.location || null,
      }));
      await PostImage.bulkCreate(imagesData);
      logger.info("Images saved to PostImage table", { postId: newPost.post_id, imagesCount: imagesData.length });
    }

    logger.info("🟢 ----- [createPost] END SUCCESS -----", { postId: newPost.post_id });

    return res.status(201).json({ status: "success", message: "Post created successfully", post: newPost });
  } catch (error) {
    logger.error("❌ [createPost] Unexpected Error", { error: error.message, stack: error.stack, user: req.user ? { id: req.user.id, type: req.user["user-type"] } : "undefined" });
    return res.status(500).json({ status: "error", message: error.message || "Failed to create post" });
  }
};

const getGroupPosts = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [getGroupPosts] START -----", {
    groupId: req.params.groupId,
    userId: req.user?.id,
    userType: req.user?.["user-type"],
  });
  // 🔴 END OF LOGGING

  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Getting group posts", { groupId, userId });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("ACCESS DENIED in getGroupPosts", {
        userType: req.user ? req.user["user-type"] : "undefined",
        groupId,
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
        data: [],
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Community Post's management",
        "view"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("STAFF PERMISSION DENIED in getGroupPosts", {
          userId: req.user.id,
          groupId,
          requiredPermission: "Community Post's management",
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "error",
          message:
            "Access denied. You don't have permission to view group posts.",
          data: [],
        });
      }
    }

    const posts = await Post.findAll({
      where: {
        "group-id": groupId,
        "is-hidden": false,
      },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          include: [
            {
              model: Graduate,
              attributes: ["profile-picture-url"],
            },
            {
              model: Staff,
              attributes: ["status-to-login"],
            },
          ],
        },
        {
          model: PostImage,
          attributes: ["image-url"],
        },
        {
          model: Like,
          attributes: ["like_id", "user-id"],
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name"],
            },
          ],
        },
        {
          model: Comment,
          attributes: [
            "comment_id",
            "content",
            "created-at",
            "edited",
            "author-id",
          ],
          include: [
            {
              model: User,
              attributes: [
                "id",
                "first-name",
                "last-name",
                "email",
                "user-type",
              ],
              include: [
                {
                  model: Graduate,
                  as: "Graduate",
                  attributes: ["profile-picture-url"],
                },
              ],
            },
          ],
          order: [["created-at", "DESC"]],
        },
      ],
      order: [["created-at", "DESC"]],
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Group posts fetched successfully", {
      groupId,
      postsCount: posts.length,
      userId,
    });
    // 🔴 END OF LOGGING

    const currentUserId = req.user?.id || null;

    const responseData = posts.map((post) => {
      let image = null;

      if (post.User.Graduate) {
        image = post.User.Graduate["profile-picture-url"];
      } else if (post.User.Staff) {
        image = null;
      }

      const likesCount = post.Likes ? post.Likes.length : 0;
      const isLikedByYou = currentUserId
        ? post.Likes?.some((like) => like["user-id"] === currentUserId) || false
        : false;

      return {
        post_id: post.post_id,
        category: post.category,
        content: post.content,
        description: post.description,
        "created-at": post["created-at"],
        author: {
          id: post.User.id,
          "full-name": `${post.User["first-name"]} ${post.User["last-name"]}`,
          email: post.User.email,
          type: post.User["user-type"],
          image: image,
        },
        "group-id": post["group-id"],
        "in-landing": post["in-landing"],
        "is-hidden": post["is-hidden"],
        images: post.PostImages
          ? post.PostImages.map((img) => img["image-url"])
          : [],
        likesCount: likesCount,
        isLikedByYou: isLikedByYou,
        likes: post.Likes
          ? post.Likes.map((like) => ({
              like_id: like.like_id,
              user: {
                id: like.User?.id || "unknown",
                "full-name":
                  `${like.User?.["first-name"] || ""} ${
                    like.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
              },
            }))
          : [],
        comments_count: post.Comments ? post.Comments.length : 0,
        comments: post.Comments
          ? post.Comments.map((comment) => ({
              comment_id: comment.comment_id,
              content: comment.content,
              "created-at": comment["created-at"],
              time_since: moment(comment["created-at"]).fromNow(),
              edited: comment.edited,
              author: {
                id: comment.User?.id || "unknown",
                "full-name":
                  `${comment.User?.["first-name"] || ""} ${
                    comment.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                email: comment.User?.email || "unknown",
                "user-type": comment.User?.["user-type"] || "unknown",
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
      };
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [getGroupPosts] END SUCCESS -----", {
      groupId,
      postsCount: responseData.length,
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Visible group posts fetched successfully",
      data: responseData,
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [getGroupPosts] Error", {
      groupId: req.params.groupId,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: "Failed to fetch group posts: " + error.message,
      data: [],
    });
  }
};

const getAllPostsOfUsers = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [getAllPostsOfUsers] START -----", {
    userId: req.user?.id,
    userType: req.user?.["user-type"],
    page: req.query.page,
    limit: req.query.limit,
  });
  // 🔴 END OF LOGGING

  try {
    const user = req.user;
    const isAdmin = user && user["user-type"] === "admin";
    const isStaff = user && user["user-type"] === "staff";
    const isGraduate = user && user["user-type"] === "graduate";

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Getting all posts of users", {
      userId: user?.id,
      userType: user?.["user-type"],
      page,
      limit,
    });
    // 🔴 END OF LOGGING

    let whereCondition = {};

    if (isAdmin) {
      whereCondition = {};
    } else if (isStaff) {
      whereCondition = { "is-hidden": false };
    } else if (isGraduate) {
      const friendships = await Friendship.findAll({
        where: {
          [Op.or]: [
            { sender_id: user.id, status: "accepted" },
            { receiver_id: user.id, status: "accepted" },
          ],
        },
      });

      const friendIds = friendships.map((friendship) =>
        friendship.sender_id === user.id
          ? friendship.receiver_id
          : friendship.sender_id
      );

      friendIds.push(user.id);

      const adminAndStaffUsers = await User.findAll({
        where: {
          [Op.or]: [{ "user-type": "admin" }, { "user-type": "staff" }],
        },
        attributes: ["id"],
      });

      const adminAndStaffIds = adminAndStaffUsers.map((user) => user.id);
      const allAuthorIds = [...friendIds, ...adminAndStaffIds];

      whereCondition = {
        "is-hidden": false,
        "author-id": { [Op.in]: allAuthorIds },
      };
    } else {
      whereCondition = { "is-hidden": false };
    }

    const posts = await Post.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          include: [
            { model: Graduate, attributes: ["profile-picture-url"] },
            { model: Staff, attributes: ["status-to-login"] },
          ],
        },
        {
          model: PostImage,
          attributes: ["image-url"],
        },
        {
          model: Like,
          attributes: ["like_id", "user-id"],
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name"],
            },
          ],
        },
        {
          model: Comment,
          attributes: [
            "comment_id",
            "content",
            "created-at",
            "edited",
            "author-id",
          ],
          include: [
            {
              model: User,
              attributes: [
                "id",
                "first-name",
                "last-name",
                "email",
                "user-type",
              ],
              include: [
                {
                  model: Graduate,
                  as: "Graduate",
                  attributes: ["profile-picture-url"],
                },
              ],
            },
          ],
          order: [["created-at", "DESC"]],
        },
      ],
      order: [["created-at", "DESC"]],
      limit: limit,
      offset: offset,
    });

    const totalPosts = await Post.count({ where: whereCondition });
    const totalPages = Math.ceil(totalPosts / limit);
    const hasMore = page < totalPages;

    const currentUserId = req.user?.id || null;

    const responseData = posts.map((post) => {
      const likesCount = post.Likes ? post.Likes.length : 0;
      const isLikedByYou = currentUserId
        ? post.Likes?.some((like) => like["user-id"] === currentUserId) || false
        : false;

      return {
        post_id: post.post_id,
        category: post.category,
        content: post.content,
        description: post.description,
        "created-at": post["created-at"],
        author: {
          id: post.User.id,
          "full-name": `${post.User["first-name"]} ${post.User["last-name"]}`,
          email: post.User.email,
          type: post.User["user-type"],
          image: post.User.Graduate
            ? post.User.Graduate["profile-picture-url"]
            : null,
        },
        "group-id": post["group-id"],
        "in-landing": post["in-landing"],
        images: post.PostImages
          ? post.PostImages.map((img) => img["image-url"])
          : [],
        "is-hidden": post["is-hidden"],
        likesCount: likesCount,
        isLikedByYou: isLikedByYou,
        likes: post.Likes
          ? post.Likes.map((like) => ({
              like_id: like.like_id,
              user: {
                id: like.User?.id || "unknown",
                "full-name":
                  `${like.User?.["first-name"] || ""} ${
                    like.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
              },
            }))
          : [],
        comments_count: post.Comments ? post.Comments.length : 0,
        comments: post.Comments
          ? post.Comments.map((comment) => ({
              comment_id: comment.comment_id,
              content: comment.content,
              "created-at": comment["created-at"],
              time_since: moment(comment["created-at"]).fromNow(),
              edited: comment.edited,
              author: {
                id: comment.User?.id || "unknown",
                "full-name":
                  `${comment.User?.["first-name"] || ""} ${
                    comment.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                email: comment.User?.email || "unknown",
                "user-type": comment.User?.["user-type"] || "unknown",
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
      };
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("All posts fetched successfully", {
      totalPosts,
      returnedPosts: posts.length,
      page,
      totalPages,
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [getAllPostsOfUsers] END SUCCESS -----", {
      totalPosts,
      returnedPosts: responseData.length,
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: "success",
      message: "All posts fetched successfully",
      data: responseData,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalPosts: totalPosts,
        hasMore: hasMore,
        limit: limit,
      },
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [getAllPostsOfUsers] Error", {
      error: error.message,
      stack: error.stack.substring(0, 200),
      user: req.user
        ? { id: req.user.id, type: req.user["user-type"] }
        : "undefined",
    });
    // 🔴 END OF LOGGING

    res.status(500).json({
      status: "error",
      message: "Failed to fetch posts: " + error.message,
      data: [],
    });
  }
};

const getAllPosts = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [getAllPosts] START -----", {
    userId: req.user?.id,
    userType: req.user?.["user-type"],
  });
  // 🔴 END OF LOGGING

  try {
    const user = req.user;
    const isAdmin = user && user["user-type"] === "admin";
    const isStaff = user && user["user-type"] === "staff";

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Getting all posts", {
      userId: user?.id,
      userType: user?.["user-type"],
      isAdmin,
      isStaff,
    });
    // 🔴 END OF LOGGING

    // ✅ التحقق من الصلاحية للـ Staff
    if (isStaff) {
      const hasPermission = await checkStaffPermission(
        user.id,
        "Graduates posts management",
        "view"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("STAFF PERMISSION DENIED in getAllPosts", {
          userId: user.id,
          requiredPermission: "Graduates posts management",
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "error",
          message:
            "Access denied. You don't have permission to view graduates posts.",
          data: [],
        });
      }
    }

    const whereCondition = isAdmin || isStaff ? {} : { "is-hidden": false };

    const posts = await Post.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          where: { "user-type": "graduate" },
          include: [{ model: Graduate, attributes: ["profile-picture-url"] }],
        },
        {
          model: PostImage,
          attributes: ["image-url"],
        },
        {
          model: Like,
          attributes: ["like_id", "user-id"],
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name"],
            },
          ],
        },
        {
          model: Comment,
          attributes: [
            "comment_id",
            "content",
            "created-at",
            "edited",
            "author-id",
          ],
          include: [
            {
              model: User,
              attributes: [
                "id",
                "first-name",
                "last-name",
                "email",
                "user-type",
              ],
              include: [
                {
                  model: Graduate,
                  as: "Graduate",
                  attributes: ["profile-picture-url"],
                },
              ],
            },
          ],
          order: [["created-at", "DESC"]],
        },
      ],
      order: [["created-at", "DESC"]],
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Posts fetched successfully", {
      postsCount: posts.length,
      whereCondition,
    });
    // 🔴 END OF LOGGING

    const currentUserId = req.user?.id || null;

    const responseData = posts.map((post) => {
      const likesCount = post.Likes ? post.Likes.length : 0;
      const isLikedByYou = currentUserId
        ? post.Likes?.some((like) => like["user-id"] === currentUserId) || false
        : false;

      return {
        post_id: post.post_id,
        category: post.category,
        content: post.content,
        description: post.description,
        "created-at": post["created-at"],
        author: {
          id: post.User.id,
          "full-name": `${post.User["first-name"]} ${post.User["last-name"]}`,
          email: post.User.email,
          image: post.User.Graduate
            ? post.User.Graduate["profile-picture-url"]
            : null,
        },
        "group-id": post["group-id"],
        "in-landing": post["in-landing"],
        images: post.PostImages
          ? post.PostImages.map((img) => img["image-url"])
          : [],
        "is-hidden": post["is-hidden"],
        likesCount: likesCount,
        isLikedByYou: isLikedByYou,
        likes: post.Likes
          ? post.Likes.map((like) => ({
              like_id: like.like_id,
              user: {
                id: like.User?.id || "unknown",
                "full-name":
                  `${like.User?.["first-name"] || ""} ${
                    like.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
              },
            }))
          : [],
        comments_count: post.Comments ? post.Comments.length : 0,
        comments: post.Comments
          ? post.Comments.map((comment) => ({
              comment_id: comment.comment_id,
              content: comment.content,
              "created-at": comment["created-at"],
              time_since: moment(comment["created-at"]).fromNow(),
              edited: comment.edited,
              author: {
                id: comment.User?.id || "unknown",
                "full-name":
                  `${comment.User?.["first-name"] || ""} ${
                    comment.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                email: comment.User?.email || "unknown",
                "user-type": comment.User?.["user-type"] || "unknown",
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
      };
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [getAllPosts] END SUCCESS -----", {
      postsCount: responseData.length,
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: "success",
      message: "Posts fetched successfully",
      data: responseData,
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [getAllPosts] Error", {
      error: error.message,
      stack: error.stack.substring(0, 200),
      user: req.user
        ? { id: req.user.id, type: req.user["user-type"] }
        : "undefined",
    });
    // 🔴 END OF LOGGING

    res.status(500).json({
      status: "error",
      message: "Failed to fetch posts: " + error.message,
      data: [],
    });
  }
};

const hideNegativePost = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [hideNegativePost] START -----", {
    postId: req.params.postId,
    userId: req.user?.id,
    userType: req.user?.["user-type"],
  });
  // 🔴 END OF LOGGING

  try {
    const user = req.user;
    const { postId } = req.params;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Attempting to hide post", {
      postId,
      userId: user?.id,
      userType: user?.["user-type"],
    });
    // 🔴 END OF LOGGING

    // ✅ التعديل هنا: لازم يكون Admin أو Staff
    if (
      !user ||
      (user["user-type"] !== "admin" && user["user-type"] !== "staff")
    ) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("UNAUTHORIZED hide post attempt", {
        postId,
        userId: user?.id,
        userType: user?.["user-type"],
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "fail",
        message: "Only admins and staff can hide posts",
        data: [],
      });
    }

    // ✅ التحقق من الصلاحية للـ Staff
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "Graduates posts management",
        "edit"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("STAFF PERMISSION DENIED for hide post", {
          userId: user.id,
          postId,
          requiredPermission: "Graduates posts management",
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "fail",
          message:
            "Access denied. You don't have permission to hide graduates posts.",
          data: [],
        });
      }
    }

    // 🔍 تأكد أن البوست موجود
    const post = await Post.findByPk(postId);
    if (!post) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Post not found for hiding", { postId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
        data: [],
      });
    }

    // ✅ نحدث العمود يدويًا في قاعدة البيانات
    await Post.update({ "is-hidden": true }, { where: { post_id: postId } });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Post hidden successfully", {
      postId,
      userId: user.id,
      userType: user["user-type"],
      postContent: post.content.substring(0, 100),
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [hideNegativePost] END SUCCESS -----", { postId });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: "success",
      message: "Post hidden successfully",
      data: [
        {
          postId: post.post_id,
          content: post.content,
          isHidden: true,
        },
      ],
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [hideNegativePost] Error", {
      postId: req.params.postId,
      error: err.message,
      stack: err.stack.substring(0, 200),
      user: req.user
        ? { id: req.user.id, type: req.user["user-type"] }
        : "undefined",
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

const unhidePost = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [unhidePost] START -----", {
    postId: req.params.postId,
    userId: req.user?.id,
    userType: req.user?.["user-type"],
  });
  // 🔴 END OF LOGGING

  try {
    const user = req.user;
    const { postId } = req.params;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Attempting to unhide post", {
      postId,
      userId: user?.id,
      userType: user?.["user-type"],
    });
    // 🔴 END OF LOGGING

    // ✅ التعديل هنا: لازم يكون Admin أو Staff
    if (
      !user ||
      (user["user-type"] !== "admin" && user["user-type"] !== "staff")
    ) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("UNAUTHORIZED unhide post attempt", {
        postId,
        userId: user?.id,
        userType: user?.["user-type"],
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "fail",
        message: "Only admins and staff can unhide posts",
        data: [],
      });
    }

    // ✅ التحقق من الصلاحية للـ Staff
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "Graduates posts management",
        "edit"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("STAFF PERMISSION DENIED for unhide post", {
          userId: user.id,
          postId,
          requiredPermission: "Graduates posts management",
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "fail",
          message:
            "Access denied. You don't have permission to unhide graduates posts.",
          data: [],
        });
      }
    }

    // 🔍 تأكد أن البوست موجود
    const post = await Post.findByPk(postId);
    if (!post) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Post not found for unhiding", { postId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
        data: [],
      });
    }

    // ✅ نحدث العمود يدويًا
    await Post.update({ "is-hidden": false }, { where: { post_id: postId } });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Post unhidden successfully", {
      postId,
      userId: user.id,
      userType: user["user-type"],
      postContent: post.content.substring(0, 100),
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [unhidePost] END SUCCESS -----", { postId });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: "success",
      message: "Post unhidden successfully",
      data: [
        {
          postId: post.post_id,
          content: post.content,
          isHidden: false,
        },
      ],
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [unhidePost] Error", {
      postId: req.params.postId,
      error: err.message,
      stack: err.stack.substring(0, 200),
      user: req.user
        ? { id: req.user.id, type: req.user["user-type"] }
        : "undefined",
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

const getAdminPosts = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [getAdminPosts] START -----", {
    userId: req.user?.id,
    userType: req.user?.["user-type"],
  });
  // 🔴 END OF LOGGING

  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Getting admin posts", {
      userId: req.user?.id,
      userType: req.user?.["user-type"],
    });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم - كل اليوزر types
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("ACCESS DENIED in getAdminPosts", {
        userType: req.user ? req.user["user-type"] : "undefined",
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
        data: [],
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Portal posts management",
        "view"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("STAFF PERMISSION DENIED in getAdminPosts", {
          userId: req.user.id,
          requiredPermission: "Portal posts management",
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "error",
          message:
            "Access denied. You don't have permission to view portal posts.",
          data: [],
        });
      }
    }

    // 4. لو admin أو graduate أو staff مع صلاحية → اتركه يكمل
    const posts = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          where: {
            "user-type": {
              [Op.in]: ["admin", "staff"],
            },
          },
        },
        {
          model: PostImage,
          attributes: ["image-url"],
        },
        {
          model: Like,
          attributes: ["like_id", "user-id"],
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name", "user-type"],
            },
          ],
        },
        {
          model: Comment,
          attributes: [
            "comment_id",
            "content",
            "created-at",
            "edited",
            "author-id",
          ],
          include: [
            {
              model: User,
              attributes: [
                "id",
                "first-name",
                "last-name",
                "email",
                "user-type",
              ],
              include: [
                {
                  model: Graduate,
                  as: "Graduate",
                  attributes: ["profile-picture-url"],
                },
              ],
            },
          ],
          order: [["created-at", "DESC"]],
        },
      ],
      order: [["created-at", "DESC"]],
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Admin posts fetched successfully", {
      postsCount: posts.length,
    });
    // 🔴 END OF LOGGING

    const currentUserId = req.user?.id || null;

    const responseData = posts.map((post) => {
      const likesCount = post.Likes ? post.Likes.length : 0;
      const isLikedByYou = currentUserId
        ? post.Likes?.some((like) => like["user-id"] === currentUserId) || false
        : false;

      return {
        post_id: post.post_id,
        category: post.category,
        content: post.content,
        description: post.description,
        "created-at": post["created-at"],
        author: {
          id: post.User?.id || "unknown",
          "full-name":
            `${post.User?.["first-name"] || ""} ${
              post.User?.["last-name"] || ""
            }`.trim() || "Unknown User",
          email: post.User?.email || "unknown",
          type: post.User?.["user-type"] || "unknown",
        },
        "group-id": post["group-id"],
        images: post.PostImages
          ? post.PostImages.map((img) => img["image-url"])
          : [],
        likesCount: likesCount,
        isLikedByYou: isLikedByYou,
        likes: post.Likes
          ? post.Likes.map((like) => ({
              like_id: like.like_id,
              user: {
                id: like.User?.id || "unknown",
                "full-name":
                  `${like.User?.["first-name"] || ""} ${
                    like.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                "user-type": like.User?.["user-type"] || "unknown",
              },
            }))
          : [],
        comments_count: post.Comments ? post.Comments.length : 0,
        comments: post.Comments
          ? post.Comments.map((comment) => ({
              comment_id: comment.comment_id,
              content: comment.content,
              "created-at": comment["created-at"],
              time_since: moment(comment["created-at"]).fromNow(),
              edited: comment.edited,
              author: {
                id: comment.User?.id || "unknown",
                "full-name":
                  `${comment.User?.["first-name"] || ""} ${
                    comment.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                email: comment.User?.email || "unknown",
                "user-type": comment.User?.["user-type"] || "unknown",
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
        "in-landing": post["in-landing"] || false,
      };
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [getAdminPosts] END SUCCESS -----", {
      postsCount: responseData.length,
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: "success",
      message: "Admin and staff posts fetched successfully",
      data: responseData,
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [getAdminPosts] Error", {
      error: error.message,
      stack: error.stack.substring(0, 200),
      user: req.user
        ? { id: req.user.id, type: req.user["user-type"] }
        : "undefined",
    });
    // 🔴 END OF LOGGING

    res.status(500).json({
      status: "error",
      message: "Failed to fetch admin and staff posts",
      data: [],
    });
  }
};

const getGraduatePosts = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [getGraduatePosts] START -----", {
    userId: req.user?.id,
    userType: req.user?.["user-type"],
  });
  // 🔴 END OF LOGGING

  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Getting graduate posts", { userId: req.user?.id });
    // 🔴 END OF LOGGING

    if (!req.user || req.user["user-type"] !== "graduate") {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("UNAUTHORIZED access to graduate posts", {
        userType: req.user ? req.user["user-type"] : "undefined",
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "Not authorized as a graduate",
        data: [],
      });
    }

    const posts = await Post.findAll({
      where: { "author-id": req.user.id },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          include: [
            {
              model: Graduate,
              attributes: ["profile-picture-url"],
            },
          ],
        },
        {
          model: PostImage,
          attributes: ["image-url"],
        },
        {
          model: Like,
          attributes: ["like_id", "user-id"],
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name", "user-type"],
            },
          ],
        },
        {
          model: Comment,
          attributes: [
            "comment_id",
            "content",
            "created-at",
            "edited",
            "author-id",
          ],
          include: [
            {
              model: User,
              attributes: [
                "id",
                "first-name",
                "last-name",
                "email",
                "user-type",
              ],
              include: [
                {
                  model: Graduate,
                  as: "Graduate",
                  attributes: ["profile-picture-url"],
                },
              ],
            },
          ],
          order: [["created-at", "DESC"]],
        },
      ],
      order: [["created-at", "DESC"]],
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Graduate posts fetched successfully", {
      userId: req.user.id,
      postsCount: posts.length,
    });
    // 🔴 END OF LOGGING

    const currentUserId = req.user?.id || null;

    const responseData = posts.map((post) => {
      const likesCount = post.Likes ? post.Likes.length : 0;
      const isLikedByYou = currentUserId
        ? post.Likes?.some((like) => like["user-id"] === currentUserId) || false
        : false;

      return {
        id: post.post_id,
        category: post.category,
        content: post.content,
        description: post.description,
        "created-at": post["created-at"],
        author: {
          id: post.User.id,
          "full-name": `${post.User["first-name"]} ${post.User["last-name"]}`,
          email: post.User.email,
          "user-type": post.User["user-type"],
          image: post.User.Graduate
            ? post.User.Graduate["profile-picture-url"]
            : null,
        },
        "group-id": post["group-id"],
        "in-landing": post["in-landing"],
        "is-hidden": post["is-hidden"],
        images: post.PostImages
          ? post.PostImages.map((img) => img["image-url"])
          : [],
        likesCount: likesCount,
        isLikedByYou: isLikedByYou,
        likes: post.Likes
          ? post.Likes.map((like) => ({
              like_id: like.like_id,
              user: {
                id: like.User?.id || "unknown",
                "full-name":
                  `${like.User?.["first-name"] || ""} ${
                    like.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                "user-type": like.User?.["user-type"] || "unknown",
              },
            }))
          : [],
        comments_count: post.Comments ? post.Comments.length : 0,
        comments: post.Comments
          ? post.Comments.map((comment) => ({
              comment_id: comment.comment_id,
              content: comment.content,
              "created-at": comment["created-at"],
              time_since: moment(comment["created-at"]).fromNow(),
              edited: comment.edited,
              author: {
                id: comment.User?.id || "unknown",
                "full-name":
                  `${comment.User?.["first-name"] || ""} ${
                    comment.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                email: comment.User?.email || "unknown",
                "user-type": comment.User?.["user-type"] || "unknown",
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
      };
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [getGraduatePosts] END SUCCESS -----", {
      postsCount: responseData.length,
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: "success",
      message: "Graduate posts fetched successfully",
      data: responseData,
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [getGraduatePosts] Error", {
      error: error.message,
      stack: error.stack.substring(0, 200),
      userId: req.user?.id,
    });
    // 🔴 END OF LOGGING

    res.status(500).json({
      status: "error",
      message: "Failed to fetch graduate posts: " + error.message,
      data: [],
    });
  }
};

const getMyPosts = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [getMyPosts] START -----", {
    userId: req.user?.id,
    userType: req.user?.["user-type"],
  });
  // 🔴 END OF LOGGING

  try {
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Getting user's own posts", { userId });
    // 🔴 END OF LOGGING

    const posts = await Post.findAll({
      where: { "author-id": userId },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          include: [
            {
              model: Graduate,
              attributes: ["profile-picture-url"],
            },
            {
              model: Staff,
              attributes: ["status-to-login"],
            },
          ],
        },
        {
          model: PostImage,
          attributes: ["image-url"],
        },
        {
          model: Like,
          attributes: ["like_id", "author-id", "user-id"],
        },
      ],
      order: [["created-at", "DESC"]],
    });

    const responseData = posts.map((post) => {
      const likesCount = post.Likes ? post.Likes.length : 0;
      const isLikedByYou =
        post.Likes?.some((like) => like["user-id"] === userId) || false;

      return {
        post_id: post.post_id,
        category: post.category,
        content: post.content,
        description: post.description,
        "created-at": post["created-at"],
        author: {
          id: post.User.id,
          "full-name": `${post.User["first-name"]} ${post.User["last-name"]}`,
          email: post.User.email,
          type: post.User["user-type"],
          image: post.User.Graduate
            ? post.User.Graduate["profile-picture-url"]
            : null,
        },
        "group-id": post["group-id"],
        "in-landing": post["in-landing"],
        "is-hidden": post["is-hidden"],
        images: post.PostImages
          ? post.PostImages.map((img) => img["image-url"])
          : [],
        likesCount: likesCount,
        isLikedByYou: isLikedByYou,
      };
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("User posts fetched successfully", {
      userId,
      postsCount: posts.length,
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [getMyPosts] END SUCCESS -----", {
      postsCount: responseData.length,
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: "success",
      message: "User posts fetched successfully",
      data: responseData,
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [getMyPosts] Error", {
      error: error.message,
      stack: error.stack.substring(0, 200),
      userId: req.user?.id,
    });
    // 🔴 END OF LOGGING

    res.status(500).json({
      status: "error",
      message: "Failed to fetch user posts: " + error.message,
      data: [],
    });
  }
};

const editPost = async (req, res) => {
  logger.info("🟢 ----- [editPost] START -----", {
    postId: req.params.postId,
    userId: req.user?.id,
    userType: req.user?.["user-type"],
  });

  try {
    const { postId } = req.params;
    const { category, type, content, link, groupId, inLanding, removeImages } = req.body;

    logger.info("Editing post", {
      postId,
      userId: req.user?.id,
      hasContent: !!content,
      contentLength: content?.length || 0,
      hasCategory: !!category,
      hasType: !!type,
      removeImagesCount: removeImages?.length || 0,
    });

    const post = await Post.findByPk(postId, { include: [{ model: PostImage, attributes: ["image-url"] }] });
    if (!post) {
      logger.warn("Post not found for editing", { postId });
      return res.status(404).json({ status: "error", message: "Post not found" });
    }

    // حفظ المحتوى القديم
    const oldContent = post.content;
    const oldCategory = post.category;
    const oldImages = post.PostImages.map((img) => img["image-url"]);

    // 🛑 AI Moderation: تحقق من المحتوى الجديد قبل الحفظ
    if (content !== undefined) {
      const flagged = await isContentBad(content);
      if (flagged) {
        logger.warn("Edited content flagged by AI moderation", { postId, userId: req.user?.id, content: content?.substring(0, 100) });
        return res.status(400).json({
          status: "fail",
          message: "Edited content contains inappropriate material and cannot be saved.",
        });
      }
      post.content = content;
    }

    if (category !== undefined) post.category = category;
    if (type !== undefined) post.category = type; // لو type معمول له override
    if (link !== undefined) post.link = link;
    if (groupId !== undefined) post["group-id"] = groupId === null ? null : groupId;
    if (inLanding !== undefined) post["in-landing"] = inLanding;

    await post.save();

    if (removeImages && Array.isArray(removeImages) && removeImages.length > 0) {
      logger.info("Removing images from post", { postId, imagesToRemove: removeImages });
      await PostImage.destroy({ where: { "post-id": postId, "image-url": removeImages } });
    }

    if (req.files && req.files.length > 0) {
      logger.info("Adding new images to post", { postId, newImagesCount: req.files.length });
      const uploadedImages = req.files.map((file) => ({ "post-id": postId, "image-url": file.path || file.url || file.location }));
      await PostImage.bulkCreate(uploadedImages);
    }

    const updatedPost = await Post.findByPk(postId, { include: [{ model: PostImage, attributes: ["image-url"] }] });
    const newContent = updatedPost.content;
    const newCategory = updatedPost.category;
    const newImages = updatedPost.PostImages.map((img) => img["image-url"]);
    const imagesChanged = JSON.stringify(oldImages) !== JSON.stringify(newImages);

    logger.info("Post updated details", { postId, oldContent: oldContent?.substring(0, 100), newContent: newContent?.substring(0, 100), oldCategory, newCategory, oldImagesCount: oldImages.length, newImagesCount: newImages.length, imagesChanged });
    logger.info("🟢 ----- [editPost] END SUCCESS -----", { postId });

    return res.status(200).json({ status: "success", message: "Post updated successfully", data: { postId, oldContent, newContent, oldCategory, newCategory, oldImages, newImages, imagesChanged } });
  } catch (error) {
    logger.error("❌ [editPost] Error", { postId: req.params.postId, error: error.message, stack: error.stack.substring(0, 200) });
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const likePost = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [likePost] START -----", {
    postId: req.params.postId,
    userId: req.user?.id,
  });
  // 🔴 END OF LOGGING

  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Like post attempt", { postId, userId });
    // 🔴 END OF LOGGING

    // تحقق من وجود البوست
    const post = await Post.findByPk(postId);
    if (!post) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Post not found for like", { postId, userId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // تحقق لو المستخدم عمل Like قبل كده
    const existingLike = await Like.findOne({
      where: {
        "post-id": postId,
        "user-id": userId,
      },
    });

    if (existingLike) {
      // لو موجود، نحذفه (unlike)
      await existingLike.destroy();
      // 🔴 START OF LOGGING - ADDED THIS
      logger.info("Like removed successfully", { postId, userId });
      // 🔴 END OF LOGGING

      // 🔴 START OF LOGGING - ADDED THIS
      logger.info("🟢 ----- [likePost] END SUCCESS (Unlike) -----", {
        postId,
        userId,
      });
      // 🔴 END OF LOGGING

      return res.json({
        status: HttpStatusHelper.SUCCESS,
        message: "Like removed successfully",
      });
    }

    // إنشاء Like جديد
    const newLike = await Like.create({
      "post-id": postId,
      "user-id": userId,
    });

    // إنشاء إشعار لصاحب البوست لو مش هو
    if (post["author-id"] !== userId) {
      await notifyPostLiked(post["author-id"], userId, postId);
    }

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Post liked successfully", {
      postId,
      userId,
      likeId: newLike.like_id,
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [likePost] END SUCCESS (Like) -----", {
      postId,
      userId,
      likeId: newLike.like_id,
    });
    // 🔴 END OF LOGGING

    return res.status(201).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Post liked successfully",
      like: newLike,
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [likePost] Error", {
      postId: req.params.postId,
      userId: req.user.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

const unlikePost = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [unlikePost] START -----", {
    postId: req.params.postId,
    userId: req.user?.id,
  });
  // 🔴 END OF LOGGING

  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Unlike post attempt", { postId, userId });
    // 🔴 END OF LOGGING

    // البحث عن Like
    const like = await Like.findOne({
      where: {
        "post-id": postId,
        "user-id": userId,
      },
    });

    if (!like) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Like not found for unlike", { postId, userId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Like not found",
      });
    }

    // حذف الـ Like
    await like.destroy();

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Post unliked successfully", { postId, userId });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [unlikePost] END SUCCESS -----", { postId, userId });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Post unliked successfully",
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [unlikePost] Error", {
      postId: req.params.postId,
      userId: req.user.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

const addComment = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [addComment] START -----", {
    postId: req.params.postId,
    userId: req.user?.id,
  });
  // 🔴 END OF LOGGING

  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Add comment attempt", {
      postId,
      userId,
      contentLength: content?.length,
    });
    // 🔴 END OF LOGGING

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Post not found for comment", { postId, userId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Empty comment content", { postId, userId });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: "error",
        message: "Comment content is required",
      });
    }

    // Create new comment
    const newComment = await Comment.create({
      content: content.trim(),
      "post-id": postId,
      "author-id": userId,
    });

    const commentWithAuthor = await Comment.findByPk(newComment.comment_id, {
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
          include: [
            {
              model: Graduate,
              attributes: ["profile-picture-url"],
            },
          ],
        },
      ],
    });

    // Create notification for post author (if not commenting on own post)
    if (post["author-id"] !== userId) {
      await notifyPostCommented(
        post["author-id"],
        userId,
        postId,
        newComment.comment_id
      );
    }

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Comment added successfully", {
      postId,
      userId,
      commentId: newComment.comment_id,
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [addComment] END SUCCESS -----", {
      postId,
      userId,
      commentId: newComment.comment_id,
    });
    // 🔴 END OF LOGGING

    return res.status(201).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Comment added successfully",
      comment: {
        comment_id: commentWithAuthor.comment_id,
        content: commentWithAuthor.content,
        "created-at": commentWithAuthor["created-at"],
        edited: commentWithAuthor.edited,
        author: {
          id: commentWithAuthor.User.id,
          "full-name": `${commentWithAuthor.User["first-name"]} ${commentWithAuthor.User["last-name"]}`,
          email: commentWithAuthor.User.email,
          image: commentWithAuthor.User.Graduate
            ? commentWithAuthor.User.Graduate["profile-picture-url"]
            : null,
        },
      },
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [addComment] Error", {
      postId: req.params.postId,
      userId: req.user.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

const editComment = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [editComment] START -----", {
    commentId: req.params.commentId,
    userId: req.user?.id,
  });
  // 🔴 END OF LOGGING

  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Edit comment attempt", { commentId, userId });
    // 🔴 END OF LOGGING

    // Find the comment
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Comment not found for editing", { commentId, userId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    // Check if user owns the comment
    if (comment["author-id"] !== userId) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("UNAUTHORIZED comment edit attempt", {
        commentId,
        userId,
        authorId: comment["author-id"],
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "You can only edit your own comments",
      });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Empty comment content for edit", { commentId, userId });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: "error",
        message: "Comment content is required",
      });
    }

    // Update comment
    comment.content = content.trim();
    comment.edited = true;
    await comment.save();

    // Get the post to notify the post author
    const post = await Post.findByPk(comment["post-id"]);
    if (post && post["author-id"] !== userId) {
      await notifyCommentEdited(
        post["author-id"],
        userId,
        post.post_id,
        commentId
      );
    }

    // Fetch updated comment with author details
    const updatedComment = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Comment updated successfully", { commentId, userId });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [editComment] END SUCCESS -----", {
      commentId,
      userId,
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Comment updated successfully",
      comment: {
        comment_id: updatedComment.comment_id,
        content: updatedComment.content,
        "created-at": updatedComment["created-at"],
        edited: updatedComment.edited,
        author: {
          id: updatedComment.User.id,
          "full-name": `${updatedComment.User["first-name"]} ${updatedComment.User["last-name"]}`,
          email: updatedComment.User.email,
        },
      },
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [editComment] Error", {
      commentId: req.params.commentId,
      userId: req.user.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

const deleteComment = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [deleteComment] START -----", {
    commentId: req.params.commentId,
    userId: req.user?.id,
  });
  // 🔴 END OF LOGGING

  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Delete comment attempt", { commentId, userId });
    // 🔴 END OF LOGGING

    // Find the comment
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Comment not found for deletion", { commentId, userId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    // Check if user owns the comment
    if (comment["author-id"] !== userId) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("UNAUTHORIZED comment deletion attempt", {
        commentId,
        userId,
        authorId: comment["author-id"],
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "You can only delete your own comments",
      });
    }

    // Get the post to notify the post author before deleting
    const post = await Post.findByPk(comment["post-id"]);
    const postId = post ? post.post_id : null;

    // Delete the comment
    await comment.destroy();

    // Create notification for post author (if not deleting own comment on own post)
    if (post && post["author-id"] !== userId && postId) {
      await notifyCommentDeleted(post["author-id"], userId, postId);
    }

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Comment deleted successfully", { commentId, userId, postId });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [deleteComment] END SUCCESS -----", {
      commentId,
      userId,
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [deleteComment] Error", {
      commentId: req.params.commentId,
      userId: req.user.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

const deletePost = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [deletePost] START -----", {
    postId: req.params.postId,
    userId: req.user?.id,
    userType: req.user?.["user-type"],
  });
  // 🔴 END OF LOGGING

  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Delete post attempt", {
      postId,
      userId,
      userType: req.user["user-type"],
    });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!userId || !allowedUserTypes.includes(req.user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("UNAUTHORIZED delete post attempt", {
        postId,
        userId,
        userType: req.user["user-type"],
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
      });
    }

    // 3. لو staff → تحقق من الصلاحيات (Community أو Portal)
    if (req.user["user-type"] === "staff") {
      const hasCommunityPermission = await checkStaffPermission(
        userId,
        "Community Post's management",
        "delete"
      );

      const hasPortalPermission = await checkStaffPermission(
        userId,
        "Portal posts management",
        "delete"
      );

      // Staff هيقدر يحذف لو عنده أي من الصلاحيتين
      if (!hasCommunityPermission && !hasPortalPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("STAFF PERMISSION DENIED for delete post", {
          userId,
          postId,
          hasCommunityPermission,
          hasPortalPermission,
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "error",
          message: "Access denied. You don't have permission to delete posts.",
        });
      }
    }

    // 4. لو admin أو graduate أو staff مع صلاحية → اتركه يكمل
    // Find the post
    const post = await Post.findByPk(postId);
    if (!post) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Post not found for deletion", { postId, userId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // ⬇️⬇️⬇️ التحقق الجديد: منع الحذف إذا البوست مخفي ⬇️⬇️⬇️
    if (post["is-hidden"]) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Attempt to delete hidden post", { postId, userId });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "Cannot delete a hidden post",
      });
    }

    // Check if the post was created by the current staff member or by a graduate
    const postAuthor = await User.findByPk(post["author-id"]);
    if (!postAuthor) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.error("Post author not found", {
        postId,
        authorId: post["author-id"],
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Post author not found",
      });
    }

    // ⬇️⬇️⬇️ التعديل هنا: السماح للـ Staff بحذف بوستات الأدمن والادمن بحذف بوستات الاستاف ⬇️⬇️⬇️
    const isOwnPost = post["author-id"] === userId;
    const isGraduatePost = postAuthor["user-type"] === "graduate";
    const isStaffDeletingAdminPost =
      req.user["user-type"] === "staff" && postAuthor["user-type"] === "admin";
    const isAdminDeletingStaffPost =
      req.user["user-type"] === "admin" && postAuthor["user-type"] === "staff";

    // Allow deleting if:
    // 1) It's the user's own post, OR
    // 2) It's a graduate's post, OR
    // 3) Staff is deleting an admin's post, OR
    // 4) Admin is deleting a staff's post
    if (
      !isOwnPost &&
      !isGraduatePost &&
      !isStaffDeletingAdminPost &&
      !isAdminDeletingStaffPost
    ) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("UNAUTHORIZED post deletion - permission issue", {
        postId,
        userId,
        userType: req.user["user-type"],
        authorId: post["author-id"],
        authorType: postAuthor["user-type"],
        isOwnPost,
        isGraduatePost,
        isStaffDeletingAdminPost,
        isAdminDeletingStaffPost,
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message:
          "You can only delete your own posts, posts created by graduates, or admin posts (for staff), or staff posts (for admin)",
      });
    }

    // Delete associated comments and likes first
    await Comment.destroy({ where: { "post-id": postId } });
    await Like.destroy({ where: { "post-id": postId } });

    // Delete the post
    await post.destroy();

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Post deleted successfully", {
      postId,
      userId,
      userType: req.user["user-type"],
      authorId: post["author-id"],
      authorType: postAuthor["user-type"],
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [deletePost] END SUCCESS -----", { postId, userId });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Post deleted successfully",
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [deletePost] Error", {
      postId: req.params.postId,
      userId: req.user.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

const getPostWithDetails = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [getPostWithDetails] START -----", {
    postId: req.params.postId,
    userId: req.user?.id,
  });
  // 🔴 END OF LOGGING

  try {
    const { postId } = req.params;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Getting post with details", { postId, userId: req.user?.id });
    // 🔴 END OF LOGGING

    // Get the post
    const post = await Post.findByPk(postId);
    if (!post) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Post not found for details", { postId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Get post author
    const author = await User.findByPk(post["author-id"], {
      include: [
        {
          model: Graduate,
          attributes: ["profile-picture-url"],
        },
      ],
    });

    // Get comments for this post
    const comments = await Comment.findAll({
      where: {
        "post-id": postId,
        "parent-comment-id": null, // Only top-level comments
      },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          include: [
            {
              model: Graduate,
              attributes: ["profile-picture-url"],
            },
          ],
        },
      ],
      order: [["created-at", "ASC"]],
    });

    // Get all replies for these comments
    const commentIds = comments.map((comment) => comment.comment_id);
    const replies = await Comment.findAll({
      where: {
        "post-id": postId,
        "parent-comment-id": { [Op.in]: commentIds },
      },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          include: [
            {
              model: Graduate,
              attributes: ["profile-picture-url"],
            },
          ],
        },
      ],
      order: [["created-at", "ASC"]],
    });

    // Group replies by parent comment
    const repliesByParent = {};
    replies.forEach((reply) => {
      const parentId = reply["parent-comment-id"];
      if (!repliesByParent[parentId]) {
        repliesByParent[parentId] = [];
      }
      repliesByParent[parentId].push(reply);
    });

    // Get likes for this post
    const likes = await Like.findAll({
      where: { "post-id": postId },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
    });

    // Calculate likesCount and isLikedByYou
    const currentUserId = req.user?.id || null;
    const likesCount = likes.length;
    const isLikedByYou = currentUserId
      ? likes.some((like) => like["user-id"] === currentUserId) || false
      : false;

    const responseData = {
      post_id: post.post_id,
      category: post.category,
      content: post.content,
      "created-at": post["created-at"],
      author: {
        id: author.id,
        "full-name": `${author["first-name"]} ${author["last-name"]}`,
        email: author.email,
        image: author.Graduate ? author.Graduate["profile-picture-url"] : null,
      },
      "group-id": post["group-id"],
      "in-landing": post["in-landing"],
      comments: comments.map((comment) => ({
        comment_id: comment.comment_id,
        content: comment.content,
        "created-at": comment["created-at"],
        time_since: moment(comment["created-at"]).fromNow(),
        edited: comment.edited,
        "parent-comment-id": comment["parent-comment-id"],
        author: {
          id: comment.User.id,
          "full-name": `${comment.User["first-name"]} ${comment.User["last-name"]}`,
          email: comment.User.email,
          "user-type": comment.User["user-type"] || "unknown",
          image:
            comment.User["user-type"] === "graduate" && comment.User.Graduate
              ? comment.User.Graduate["profile-picture-url"]
              : null,
        },
        replies: repliesByParent[comment.comment_id]
          ? repliesByParent[comment.comment_id].map((reply) => ({
              comment_id: reply.comment_id,
              content: reply.content,
              "created-at": reply["created-at"],
              edited: reply.edited,
              "parent-comment-id": reply["parent-comment-id"],
              author: {
                id: reply.User.id,
                "full-name": `${reply.User["first-name"]} ${reply.User["last-name"]}`,
                email: reply.User.email,
                "user-type": reply.User["user-type"] || "unknown",
              },
            }))
          : [],
      })),
      likes: likes.map((like) => ({
        like_id: like.like_id,
        user: {
          id: like.User.id,
          "full-name": `${like.User["first-name"]} ${like.User["last-name"]}`,
          email: like.User.email,
        },
      })),
      likesCount: likesCount,
      isLikedByYou: isLikedByYou,
    };

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Post details fetched successfully", { postId });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [getPostWithDetails] END SUCCESS -----", { postId });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: "success",
      message: "Post details fetched successfully",
      data: responseData,
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [getPostWithDetails] Error", {
      postId: req.params.postId,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    res.status(500).json({
      status: "error",
      message: "Failed to fetch post details: " + error.message,
      data: null,
    });
  }
};

const getCategories = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [getCategories] START -----", {
    userId: req.user?.id,
  });
  // 🔴 END OF LOGGING

  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Getting post categories", { userId: req.user?.id });
    // 🔴 END OF LOGGING

    // query مباشر من PostgreSQL علشان يجيب القيم بتاعت ENUM
    const query = `
      SELECT unnest(enum_range(NULL::"enum_Post_category")) AS category;
    `;
    const [results] = await Post.sequelize.query(query);

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Categories fetched successfully", {
      categoriesCount: results.length,
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [getCategories] END SUCCESS -----", {
      categoriesCount: results.length,
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "All categories fetched successfully",
      data: results.map((r) => r.category),
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [getCategories] Error", {
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: "Failed to fetch categories: " + error.message,
      data: [],
    });
  }
};

const addReply = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [addReply] START -----", {
    commentId: req.params.commentId,
    userId: req.user?.id,
  });
  // 🔴 END OF LOGGING

  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Add reply attempt", {
      commentId,
      userId,
      contentLength: content?.length,
    });
    // 🔴 END OF LOGGING

    // Check if parent comment exists
    const parentComment = await Comment.findByPk(commentId);
    if (!parentComment) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Parent comment not found for reply", { commentId, userId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Parent comment not found",
      });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Empty reply content", { commentId, userId });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: "error",
        message: "Reply content is required",
      });
    }

    // Create new reply
    const newReply = await Comment.create({
      content: content.trim(),
      "post-id": parentComment["post-id"],
      "author-id": userId,
      "parent-comment-id": commentId,
    });

    // Increment comments count for the post
    await Post.increment("comments-count", {
      where: { post_id: parentComment["post-id"] },
    });

    // Create notification for the parent comment author (if not replying to own comment)
    if (parentComment["author-id"] !== userId) {
      await notifyCommentReplied(
        parentComment["author-id"],
        userId,
        parentComment["post-id"],
        commentId,
        newReply.comment_id
      );
    }

    // Fetch reply with author details
    const replyWithAuthor = await Comment.findByPk(newReply.comment_id, {
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Reply added successfully", {
      commentId,
      userId,
      replyId: newReply.comment_id,
      postId: parentComment["post-id"],
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [addReply] END SUCCESS -----", {
      commentId,
      userId,
      replyId: newReply.comment_id,
    });
    // 🔴 END OF LOGGING

    return res.status(201).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Reply added successfully",
      reply: {
        comment_id: replyWithAuthor.comment_id,
        content: replyWithAuthor.content,
        "created-at": replyWithAuthor["created-at"],
        edited: replyWithAuthor.edited,
        "parent-comment-id": replyWithAuthor["parent-comment-id"],
        author: {
          id: replyWithAuthor.User.id,
          "full-name": `${replyWithAuthor.User["first-name"]} ${replyWithAuthor.User["last-name"]}`,
          email: replyWithAuthor.User.email,
        },
      },
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [addReply] Error", {
      commentId: req.params.commentId,
      userId: req.user.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

const editReply = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [editReply] START -----", {
    commentId: req.params.commentId,
    userId: req.user?.id,
  });
  // 🔴 END OF LOGGING

  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Edit reply attempt", { commentId, userId });
    // 🔴 END OF LOGGING

    // Find the reply
    const reply = await Comment.findByPk(commentId);
    if (!reply) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Reply not found for editing", { commentId, userId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Reply not found",
      });
    }

    // Check if user owns the reply
    if (reply["author-id"] !== userId) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("UNAUTHORIZED reply edit attempt", {
        commentId,
        userId,
        authorId: reply["author-id"],
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "You can only edit your own replies",
      });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Empty reply content for edit", { commentId, userId });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: "error",
        message: "Reply content is required",
      });
    }

    // Update reply
    reply.content = content.trim();
    reply.edited = true;
    await reply.save();

    // Fetch updated reply with author details
    const updatedReply = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Reply updated successfully", { commentId, userId });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [editReply] END SUCCESS -----", {
      commentId,
      userId,
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Reply updated successfully",
      reply: {
        comment_id: updatedReply.comment_id,
        content: updatedReply.content,
        "created-at": updatedReply["created-at"],
        edited: updatedReply.edited,
        "parent-comment-id": updatedReply["parent-comment-id"],
        author: {
          id: updatedReply.User.id,
          "full-name": `${updatedReply.User["first-name"]} ${updatedReply.User["last-name"]}`,
          email: updatedReply.User.email,
        },
      },
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [editReply] Error", {
      commentId: req.params.commentId,
      userId: req.user.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

const deleteReply = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [deleteReply] START -----", {
    commentId: req.params.commentId,
    userId: req.user?.id,
  });
  // 🔴 END OF LOGGING

  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Delete reply attempt", { commentId, userId });
    // 🔴 END OF LOGGING

    // Find the reply
    const reply = await Comment.findByPk(commentId);
    if (!reply) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Reply not found for deletion", { commentId, userId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Reply not found",
      });
    }

    // Check if user owns the reply
    if (reply["author-id"] !== userId) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("UNAUTHORIZED reply deletion attempt", {
        commentId,
        userId,
        authorId: reply["author-id"],
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "You can only delete your own replies",
      });
    }

    // Get the post ID before deleting the reply
    const postId = reply["post-id"];

    // Delete the reply
    await reply.destroy();

    // Decrement comments count for the post
    await Post.decrement("comments-count", {
      where: { post_id: postId },
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Reply deleted successfully", { commentId, userId, postId });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [deleteReply] END SUCCESS -----", {
      commentId,
      userId,
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [deleteReply] Error", {
      commentId: req.params.commentId,
      userId: req.user.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

const getCommentReplies = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [getCommentReplies] START -----", {
    commentId: req.params.commentId,
    userId: req.user?.id,
  });
  // 🔴 END OF LOGGING

  try {
    const { commentId } = req.params;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Getting comment replies", { commentId, userId: req.user?.id });
    // 🔴 END OF LOGGING

    // Check if parent comment exists
    const parentComment = await Comment.findByPk(commentId);
    if (!parentComment) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Parent comment not found for replies", { commentId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Parent comment not found",
      });
    }

    // Get all replies for this comment
    const replies = await Comment.findAll({
      where: { "parent-comment-id": commentId },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
      order: [["created-at", "ASC"]],
    });

    const responseData = replies.map((reply) => ({
      comment_id: reply.comment_id,
      content: reply.content,
      "created-at": reply["created-at"],
      edited: reply.edited,
      "parent-comment-id": reply["parent-comment-id"],
      author: {
        id: reply.User.id,
        "full-name": `${reply.User["first-name"]} ${reply.User["last-name"]}`,
        email: reply.User.email,
      },
    }));

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Comment replies fetched successfully", {
      commentId,
      repliesCount: replies.length,
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [getCommentReplies] END SUCCESS -----", {
      commentId,
      repliesCount: responseData.length,
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: "success",
      message: "Comment replies fetched successfully",
      data: responseData,
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [getCommentReplies] Error", {
      commentId: req.params.commentId,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    res.status(500).json({
      status: "error",
      message: "Failed to fetch comment replies: " + error.message,
      data: [],
    });
  }
};

const toggleLandingStatus = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [toggleLandingStatus] START -----", {
    postId: req.params.postId,
    userId: req.user?.id,
    userType: req.user?.["user-type"],
    inLanding: req.body.inLanding,
  });
  // 🔴 END OF LOGGING

  try {
    const { postId } = req.params;
    const { inLanding } = req.body; // true or false

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Toggle landing status attempt", {
      postId,
      inLanding,
      userId: req.user?.id,
      userType: req.user?.["user-type"],
    });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("UNAUTHORIZED toggle landing status attempt", {
        postId,
        userType: req.user ? req.user["user-type"] : "undefined",
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Portal posts management",
        "edit"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("STAFF PERMISSION DENIED for toggle landing status", {
          userId: req.user.id,
          postId,
          requiredPermission: "Portal posts management",
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "error",
          message:
            "Access denied. You don't have permission to manage landing posts.",
        });
      }
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    // جلب البوست
    const post = await Post.findByPk(postId);
    if (!post) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Post not found for landing status toggle", { postId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // جلب صاحب البوست
    const author = await User.findByPk(post["author-id"]);
    if (!author) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.error("Author not found for landing status toggle", {
        postId,
        authorId: post["author-id"],
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Author not found",
      });
    }

    // شرط لو الكاتب خريج
    if (
      author["user-type"] === "graduate" &&
      post.category !== "Success story" &&
      inLanding === true
    ) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Invalid landing page assignment for graduate", {
        postId,
        authorId: author.id,
        authorType: author["user-type"],
        category: post.category,
        requestedInLanding: inLanding,
      });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: "error",
        message:
          "Only 'Success story' posts by graduates can appear on the landing page.",
      });
    }

    // تحديث الحالة
    post["in-landing"] = inLanding;
    await post.save();

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Landing status updated successfully", {
      postId,
      inLanding,
      userId: req.user.id,
      userType: req.user["user-type"],
      authorId: author.id,
      authorType: author["user-type"],
      category: post.category,
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [toggleLandingStatus] END SUCCESS -----", {
      postId,
      inLanding,
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: "success",
      message: `Post landing status updated successfully.`,
      data: {
        post_id: post.post_id,
        "in-landing": post["in-landing"],
        category: post.category,
        author: {
          id: author.id,
          "user-type": author["user-type"],
        },
      },
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [toggleLandingStatus] Error", {
      postId: req.params.postId,
      userId: req.user?.id,
      error: error.message,
      stack: error.stack.substring(0, 200),
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
};

const getLandingPosts = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [getLandingPosts] START -----", {
    userId: req.user?.id,
  });
  // 🔴 END OF LOGGING

  try {
    const currentUserId = req.user?.id || null;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Getting landing posts", { currentUserId });
    // 🔴 END OF LOGGING

    // جلب جميع البوستات في اللاندينج وغير مخفية مع الصور
    const posts = await Post.findAll({
      where: {
        "in-landing": true,
        "is-hidden": false,
      },
      include: [
        {
          model: Like,
          attributes: ["like_id", "user-id", "post-id"],
        },
        {
          model: PostImage,
          attributes: ["post_image_id", "image-url"],
        },
      ],
      order: [["created-at", "DESC"]],
    });

    if (posts.length === 0) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.info("No landing posts found");
      // 🔴 END OF LOGGING
      return res.status(200).json({
        status: "success",
        message: "No posts found",
        data: [],
      });
    }

    // جلب بيانات كل مؤلف لكل بوست
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const author = await User.findByPk(post["author-id"], {
          include: [
            {
              model: Graduate,
              attributes: ["profile-picture-url"],
            },
          ],
        });

        const likesCount = post.Likes ? post.Likes.length : 0;
        const isLikedByYou = currentUserId
          ? post.Likes?.some((like) => like["user-id"] === currentUserId) ||
            false
          : false;

        return {
          post_id: post.post_id,
          category: post.category,
          content: post.content,
          "created-at": post["created-at"],
          images: post.PostImages
            ? post.PostImages.map((img) => img["image-url"])
            : [],
          author: author
            ? {
                id: author.id,
                "full-name": `${author["first-name"]} ${author["last-name"]}`,
                email: author.email,
                image: author.Graduate
                  ? author.Graduate["profile-picture-url"]
                  : null,
              }
            : {
                id: post["author-id"],
                "full-name": "Unknown Author",
                email: null,
                image: null,
              },
          "group-id": post["group-id"],
          "in-landing": post["in-landing"],
          "is-hidden": post["is-hidden"],
          likesCount,
          isLikedByYou,
        };
      })
    );

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Landing posts fetched successfully", {
      postsCount: postsWithDetails.length,
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [getLandingPosts] END SUCCESS -----", {
      postsCount: postsWithDetails.length,
    });
    // 🔴 END OF LOGGING

    res.status(200).json({
      status: "success",
      message: "Landing page posts fetched successfully",
      data: postsWithDetails,
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [getLandingPosts] Error", {
      error: error.message,
      stack: error.stack.substring(0, 200),
      userId: req.user?.id,
    });
    // 🔴 END OF LOGGING

    res.status(500).json({
      status: "error",
      message: "Server error while fetching landing posts",
      error: {
        name: error.name,
        message: error.message,
      },
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getCategories,
  getAdminPosts,
  getGraduatePosts,
  getAllPostsOfUsers,
  editPost,
  getGroupPosts,
  likePost,
  unlikePost,
  addComment,
  editComment,
  deleteComment,
  deletePost,
  getPostWithDetails,
  hideNegativePost,
  unhidePost,
  getMyPosts,
  addReply,
  editReply,
  deleteReply,
  getCommentReplies,
  toggleLandingStatus,
  getLandingPosts,
};
