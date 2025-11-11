const HttpStatusHelper = require("../utils/HttpStatuHelper");
const Comment = require("../models/Comment");
const GroupMember = require("../models/GroupMember");
const Like = require("../models/Like");
const User = require("../models/User");
const Graduate = require("../models/Graduate");
const Post = require("../models/Post");
const PostImage = require("../models/PostImage");
const Staff = require("../models/Staff");
const { Op } = require("sequelize");
const moment = require("moment");

// Helper function to calculate likesCount and isLikedByYou for a post
const getPostLikeInfo = async (postId, userId = null) => {
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

  return { likesCount, isLikedByYou };
};

const createPost = async (req, res) => {
  console.log("🟢 ----- [createPost] START -----");

  try {
    console.log("📦 Headers Content-Type:", req.headers["content-type"]);
    console.log("👤 Auth User:", req.user ? req.user : "❌ req.user undefined");
    console.log("🧾 req.body:", req.body);
    console.log("📦 req.files:", req.files);

    const { category, content, groupId, inLanding, type } = req.body;
    const userId = req.user?.id;

    const finalCategory = category || type || "General";

    console.log("🔹 finalCategory:", finalCategory);
    console.log("🔹 content:", content);
    console.log("🔹 groupId:", groupId);
    console.log("🔹 inLanding:", inLanding);

    // 🟥 التحقق من المستخدم
    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "User not authenticated",
      });
    }

    const user = await User.findByPk(userId);
    console.log(
      "👤 Found User:",
      user ? `${user["first-name"]} (${user["user-type"]})` : "❌ Not Found"
    );

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // 🧩 تحقق من نوع المستخدم
    if (user["user-type"] === "graduate") {
      const graduate = await Graduate.findOne({
        where: { graduate_id: user.id },
      });

      if (!graduate) {
        return res.status(404).json({
          status: "fail",
          message: "Graduate record not found",
        });
      }

      // تحقق من الحالة
      if (graduate.status !== "active") {
        return res.status(403).json({
          status: "fail",
          message:
            "Your account is inactive, Please contact the Alumni Portal Team to activate your profile.",
        });
      }
    }

    //  إنشاء البوست
    console.log("🪄 Creating post...");
    const newPost = await Post.create({
      category: finalCategory,
      content: content || "",
      "author-id": userId,
      "group-id": groupId || null,
      "in-landing": inLanding || false,
    });

    console.log("✅ Post created with ID:", newPost.post_id);

    // 🖼️ رفع الصور
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      console.log(`🖼️ Found ${req.files.length} file(s) to attach`);

      try {
        const imagesData = req.files.map((file) => ({
          "post-id": newPost.post_id,
          "image-url": file.path || file.url || file.location || null,
        }));

        await PostImage.bulkCreate(imagesData);
        console.log("✅ Images saved to PostImage table");
      } catch (imgErr) {
        console.error("❌ Error saving images to DB:", imgErr);
      }
    }

    // 📥 استرجاع الصور بعد الحفظ
    const savedImages = await PostImage.findAll({
      where: { "post-id": newPost.post_id },
      attributes: ["image-url"],
    });

    console.log(
      "🖼️ Saved images in DB:",
      savedImages.map((img) => img["image-url"])
    );
    console.log("🟢 ----- [createPost] END SUCCESS -----");

    return res.status(201).json({
      status: "success",
      message: "Post created successfully",
      post: {
        ...newPost.toJSON(),
        images: savedImages.map((img) => img["image-url"]),
      },
    });
  } catch (error) {
    console.error("❌ [createPost] Error:", error);
    console.error("🟥 Stack:", error.stack);
    console.log("🟢 ----- [createPost] END ERROR -----");

    return res.status(500).json({
      status: "error",
      message: error.message || "Failed to create post",
    });
  }
};

//get all posts in specific group
const getGroupPosts = async (req, res) => {
  try {
    const { groupId } = req.params;

    const posts = await Post.findAll({
      where: {
        "group-id": groupId,
        "is-hidden": false, // ⬅️ فقط البوستات اللي مش معمولة هيدن
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
        // ⬇️⬇️⬇️ ضيف الـ Likes هنا ⬇️⬇️⬇️
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
        // ⬇️⬇️⬇️ ضيف الـ Comments هنا ⬇️⬇️⬇️
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
                  as: "Graduate", // مهم جدًا
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

    const currentUserId = req.user?.id || null;

    const responseData = posts.map((post) => {
      let image = null;

      if (post.User.Graduate) {
        image = post.User.Graduate["profile-picture-url"];
      } else if (post.User.Staff) {
        image = null; // لو عندك عمود صورة staff ممكن تضيفه هنا
      }

      // Calculate likesCount and isLikedByYou
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
        // ⬇️⬇️⬇️ ضيف الـ images ⬇️⬇️⬇️
        images: post.PostImages
          ? post.PostImages.map((img) => img["image-url"])
          : [],
        // ⬇️⬇️⬇️ ضيف الـ likes ⬇️⬇️⬇️
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
        // ⬇️⬇️⬇️ ضيف الـ comments ⬇️⬇️⬇️
        comments_count: post.Comments ? post.Comments.length : 0,
        comments: post.Comments
          ? post.Comments.map((comment) => ({
              comment_id: comment.comment_id,
              content: comment.content,
              "created-at": comment["created-at"],
              time_since: moment(comment["created-at"]).fromNow(), // الوقت بالإنجليزي
              edited: comment.edited,
              author: {
                id: comment.User?.id || "unknown",
                "full-name":
                  `${comment.User?.["first-name"] || ""} ${
                    comment.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                email: comment.User?.email || "unknown",
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
      };
    });

    res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Visible group posts fetched successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: "Failed to fetch group posts: " + error.message,
      data: [],
    });
  }
};

// get all posts
const getAllPostsOfUsers = async (req, res) => {
  try {
    const user = req.user;
    const isAdmin = user && user["user-type"] === "admin";

    // ⬇️⬇️⬇️ أول سطرين تضيفهم - جلب page و limit من query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereCondition = isAdmin ? {} : { "is-hidden": false };

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
      // ⬇️⬇️⬇️ ثاني سطرين تضيفهم - الـ limit والـ offset
      limit: limit,
      offset: offset,
    });

    // ⬇️⬇️⬇️ علشان تعرف إذا في المزيد من البيانات أو لا
    const totalPosts = await Post.count({ where: whereCondition });
    const totalPages = Math.ceil(totalPosts / limit);
    const hasMore = page < totalPages;

    const currentUserId = req.user?.id || null;

    const responseData = posts.map((post) => {
      // Calculate likesCount and isLikedByYou
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
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
      };
    });

    res.status(200).json({
      status: "success",
      message: "All posts fetched successfully",
      data: responseData,
      // ⬇️⬇️⬇️ أضف معلومات الـ pagination في الـ response
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalPosts: totalPosts,
        hasMore: hasMore,
        limit: limit,
      },
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch posts: " + error.message,
      data: [],
    });
  }
};
//بتجيب كل بوستات الخريجين بس
const getAllPosts = async (req, res) => {
  try {
    const user = req.user; // ⬅️ المستخدم الحالي (من التوكن)
    console.log("🟩 Current user from token:", user); // 🔍 نطبع بيانات المستخدم

    const isAdmin = user && user["user-type"] === "admin"; // ⬅️ نتحقق هل هو أدمن
    console.log("🟦 isAdmin:", isAdmin); // 🔍 نطبع هل هو أدمن ولا لا

    // ⬅️ الشرط الأساسي: لو أدمن يشوف الكل، لو مش أدمن يشوف غير المخفي فقط
    const whereCondition = isAdmin ? {} : { "is-hidden": false };
    console.log("🟨 whereCondition used:", whereCondition); // 🔍 نعرف الفلتر المستخدم فعلاً

    const posts = await Post.findAll({
      where: whereCondition, // ⬅️ نطبق الفلتر هنا
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
                  as: "Graduate", // مهم جدًا
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

    console.log("🟧 Posts fetched count:", posts.length); // 🔍 نطبع عدد البوستات اللي رجعت
    console.log(
      "🟪 Sample post is-hidden values:",
      posts.slice(0, 3).map((p) => p["is-hidden"])
    ); // 🔍 نشوف أول 3 قيم من is-hidden

    const currentUserId = req.user?.id || null;

    const responseData = posts.map((post) => {
      // Calculate likesCount and isLikedByYou
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
              time_since: moment(comment["created-at"]).fromNow(), // الوقت بالإنجليزي
              edited: comment.edited,
              author: {
                id: comment.User?.id || "unknown",
                "full-name":
                  `${comment.User?.["first-name"] || ""} ${
                    comment.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                email: comment.User?.email || "unknown",
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
      };
    });

    res.status(200).json({
      status: "success",
      message: "Posts fetched successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("❌ Error details:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch posts: " + error.message,
      data: [],
    });
  }
};
//بتجيب بوستات الادمن بس
const getAdminPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          where: { "user-type": "admin" },
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
                  as: "Graduate", // مهم جدًا
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

    const currentUserId = req.user?.id || null;

    const responseData = posts.map((post) => {
      // Calculate likesCount and isLikedByYou
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
              },
            }))
          : [],
        comments_count: post.Comments ? post.Comments.length : 0,
        comments: post.Comments
          ? post.Comments.map((comment) => ({
              comment_id: comment.comment_id,
              content: comment.content,
              "created-at": comment["created-at"],
              time_since: moment(comment["created-at"]).fromNow(), // الوقت بالإنجليزي
              edited: comment.edited,
              author: {
                id: comment.User?.id || "unknown",
                "full-name":
                  `${comment.User?.["first-name"] || ""} ${
                    comment.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                email: comment.User?.email || "unknown",
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
      };
    });

    res.status(200).json({
      status: "success",
      message: "Admin posts fetched successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching admin posts:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch admin posts",
      data: [],
    });
  }
};
//
const getGraduatePosts = async (req, res) => {
  try {
    if (!req.user || req.user["user-type"] !== "graduate") {
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
                  as: "Graduate", // مهم جدًا
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

    const currentUserId = req.user?.id || null;

    const responseData = posts.map((post) => {
      // Calculate likesCount and isLikedByYou
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
              },
            }))
          : [],
        comments_count: post.Comments ? post.Comments.length : 0,
        comments: post.Comments
          ? post.Comments.map((comment) => ({
              comment_id: comment.comment_id,
              content: comment.content,
              "created-at": comment["created-at"],
              time_since: moment(comment["created-at"]).fromNow(), // الوقت بالإنجليزي
              edited: comment.edited,
              author: {
                id: comment.User?.id || "unknown",
                "full-name":
                  `${comment.User?.["first-name"] || ""} ${
                    comment.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                email: comment.User?.email || "unknown",
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
      };
    });

    res.status(200).json({
      status: "success",
      message: "Graduate posts fetched successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching graduate posts:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch graduate posts: " + error.message,
      data: [],
    });
  }
};
// Get user's own posts
const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;

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
      // Calculate likesCount and isLikedByYou
      const likesCount = post.Likes ? post.Likes.length : 0;
      const isLikedByYou = post.Likes?.some(
        (like) => like["user-id"] === userId
      ) || false;

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

    res.status(200).json({
      status: "success",
      message: "User posts fetched successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch user posts: " + error.message,
      data: [],
    });
  }
};
//edit post
const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { category, type, content, link, groupId, inLanding, removeImages } =
      req.body;

    // تحديد الكاتيجوري النهائي
    const finalCategory = category || type;

    // الحصول على البوست من قاعدة البيانات
    const post = await Post.findByPk(postId, {
      include: [{ model: PostImage, attributes: ["image-url"] }],
    });

    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // السماح فقط لصاحب البوست بالتعديل (بغض النظر عن نوع المستخدم)
    const isPostOwner = post["author-id"] === req.user.id;
    if (!isPostOwner) {
      return res.status(403).json({
        status: "error",
        message: "You can only edit your own posts",
      });
    }

    // تحديث الحقول
    if (finalCategory !== undefined) post.category = finalCategory;
    if (content !== undefined) post.content = content;
    if (link !== undefined) post.link = link;
    if (groupId !== undefined)
      post["group-id"] = groupId === null ? null : groupId;
    if (inLanding !== undefined) post["in-landing"] = inLanding;

    await post.save();

    // حذف الصور المطلوبة
    if (
      removeImages &&
      Array.isArray(removeImages) &&
      removeImages.length > 0
    ) {
      await PostImage.destroy({
        where: { "post-id": postId, "image-url": removeImages },
      });
    }

    // إضافة صور جديدة (لو موجودة)
    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map((file) => ({
        "post-id": postId,
        "image-url": file.path || file.url || file.location,
      }));
      await PostImage.bulkCreate(uploadedImages);
    }

    // جلب البوست بعد التحديث
    const updatedPost = await Post.findByPk(postId, {
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
        },
        {
          model: PostImage,
          attributes: ["image-url"],
        },
      ],
    });

    const responseData = {
      ...updatedPost.toJSON(),
      images: updatedPost.PostImages
        ? updatedPost.PostImages.map((img) => img["image-url"])
        : [],
      author: {
        id: updatedPost.User.id,
        "full-name": `${updatedPost.User["first-name"]} ${updatedPost.User["last-name"]}`,
        email: updatedPost.User.email,
      },
    };

    return res.status(200).json({
      status: "success",
      message: "Post updated successfully",
      data: responseData,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Like a post
const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Any authenticated user can like posts

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Check if user already liked this post
    const existingLike = await Like.findOne({
      where: {
        "post-id": postId,
        "user-id": userId,
      },
    });

    if (existingLike) {
      return res.status(400).json({
        status: "error",
        message: "Post already liked by this user",
      });
    }

    // Create new like
    const newLike = await Like.create({
      "post-id": postId,
      "user-id": userId,
    });

    return res.status(201).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Post liked successfully",
      like: newLike,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

// Unlike a post
const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Any authenticated user can unlike posts

    // Find and delete the like
    const like = await Like.findOne({
      where: {
        "post-id": postId,
        "user-id": userId,
      },
    });

    if (!like) {
      return res.status(404).json({
        status: "error",
        message: "Like not found",
      });
    }

    await like.destroy();

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Post unliked successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

// Add comment to a post
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
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

    // ⬇️⬇️⬇️ التصحيح هنا - زود الـ Graduate include ⬇️⬇️⬇️
    const commentWithAuthor = await Comment.findByPk(newComment.comment_id, {
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
          include: [
            {
              model: Graduate,
              attributes: ["profile-picture-url"], // ⬅️ زود دي
            },
          ],
        },
      ],
    });

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
            : null, // ⬅️ وزود دي
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

// Edit comment
const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Any authenticated user can edit their own comments

    // Find the comment
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    // Check if user owns the comment
    if (comment["author-id"] !== userId) {
      return res.status(403).json({
        status: "error",
        message: "You can only edit your own comments",
      });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Comment content is required",
      });
    }

    // Update comment
    comment.content = content.trim();
    comment.edited = true;
    await comment.save();

    // Fetch updated comment with author details
    const updatedComment = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
    });

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
    console.error(error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

// Delete comment (users can delete their own comments)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Any authenticated user can delete their own comments

    // Find the comment
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    // Check if user owns the comment
    if (comment["author-id"] !== userId) {
      return res.status(403).json({
        status: "error",
        message: "You can only delete your own comments",
      });
    }

    // Delete the comment
    await comment.destroy();

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

// Delete post - Users can delete their own posts, Admins can delete any post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Find the post
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Check if the post was created by the current staff member or by a graduate
    const postAuthor = await User.findByPk(post["author-id"]);
    if (!postAuthor) {
      return res.status(404).json({
        status: "error",
        message: "Post author not found",
      });
    }

    // Allow deleting if: 1) It's the staff member's own post, OR 2) It's a graduate's post
    const isOwnPost = post["author-id"] === userId;
    const isGraduatePost = postAuthor["user-type"] === "graduate";

    if (!isOwnPost && !isGraduatePost) {
      return res.status(403).json({
        status: "error",
        message:
          "You can only delete your own posts or posts created by graduates",
      });
    }

    // Delete associated comments and likes first
    await Comment.destroy({ where: { "post-id": postId } });
    await Like.destroy({ where: { "post-id": postId } });

    // Delete the post
    await post.destroy();

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

// Get post with comments and likes
const getPostWithDetails = async (req, res) => {
  try {
    const { postId } = req.params;

    // Get the post
    const post = await Post.findByPk(postId);
    if (!post) {
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
        "parent-comment-id": null // Only top-level comments
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
    const commentIds = comments.map(comment => comment.comment_id);
    const replies = await Comment.findAll({
      where: { 
        "post-id": postId,
        "parent-comment-id": { [Op.in]: commentIds }
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
    replies.forEach(reply => {
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
        time_since: moment(comment["created-at"]).fromNow(), // الوقت منذ إنشاء الكومنت
        edited: comment.edited,
        "parent-comment-id": comment["parent-comment-id"],
        author: {
          id: comment.User.id,
          "full-name": `${comment.User["first-name"]} ${comment.User["last-name"]}`,
          email: comment.User.email,
          image:
            comment.User.user_type === "graduate" && comment.User.Graduate
              ? comment.User.Graduate["profile-picture-url"]
              : null,
        },
          replies: repliesByParent[comment.comment_id] ? repliesByParent[comment.comment_id].map((reply) => ({
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
        })) : [],
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

    res.status(200).json({
      status: "success",
      message: "Post details fetched successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching post details:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch post details: " + error.message,
      data: null,
    });
  }
};

const hideNegativePost = async (req, res) => {
  try {
    const user = req.user;
    const { postId } = req.params;

    // ✅ لازم يكون Admin
    if (!user || user["user-type"] !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Only admins can hide posts",
        data: [],
      });
    }

    // 🔍 تأكد أن البوست موجود
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
        data: [],
      });
    }

    // ✅ نحدث العمود يدويًا في قاعدة البيانات (بدون post.save)
    await Post.update({ "is-hidden": true }, { where: { post_id: postId } });

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
    console.error("Error in hideNegativePost:", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

const unhidePost = async (req, res) => {
  try {
    const user = req.user;
    const { postId } = req.params;

    // ✅ لازم يكون Admin
    if (!user || user["user-type"] !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Only admins can unhide posts",
        data: [],
      });
    }

    // 🔍 تأكد أن البوست موجود
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
        data: [],
      });
    }

    // ✅ نحدث العمود يدويًا
    await Post.update({ "is-hidden": false }, { where: { post_id: postId } });

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
    console.error("Error in unhidePost:", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

const getCategories = async (req, res) => {
  try {
    // query مباشر من PostgreSQL علشان يجيب القيم بتاعت ENUM
    const query = `
      SELECT unnest(enum_range(NULL::"enum_Post_category")) AS category;
    `;
    const [results] = await Post.sequelize.query(query);

    res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "All categories fetched successfully",
      data: results.map((r) => r.category),
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: "Failed to fetch categories: " + error.message,
      data: [],
    });
  }
};

// Reply to a comment
const addReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if parent comment exists
    const parentComment = await Comment.findByPk(commentId);
    if (!parentComment) {
      return res.status(404).json({
        status: "error",
        message: "Parent comment not found",
      });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
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

    // Fetch reply with author details
    const replyWithAuthor = await Comment.findByPk(newReply.comment_id, {
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
    });

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
    console.error(error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

// Edit a reply
const editReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Find the reply
    const reply = await Comment.findByPk(commentId);
    if (!reply) {
      return res.status(404).json({
        status: "error",
        message: "Reply not found",
      });
    }

    // Check if user owns the reply
    if (reply["author-id"] !== userId) {
      return res.status(403).json({
        status: "error",
        message: "You can only edit your own replies",
      });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
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
    console.error(error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

// Delete a reply
const deleteReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Find the reply
    const reply = await Comment.findByPk(commentId);
    if (!reply) {
      return res.status(404).json({
        status: "error",
        message: "Reply not found",
      });
    }

    // Check if user owns the reply
    if (reply["author-id"] !== userId) {
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

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

// Get replies for a specific comment
const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Check if parent comment exists
    const parentComment = await Comment.findByPk(commentId);
    if (!parentComment) {
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

    res.status(200).json({
      status: "success",
      message: "Comment replies fetched successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching comment replies:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch comment replies: " + error.message,
      data: [],
    });
  }
};


// set & delete in landong
const toggleLandingStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const { inLanding } = req.body; // true or false
    const adminId = req.user.id;

    // جلب بيانات الأدمن للتأكد إنه عنده الصلاحية
    const admin = await User.findByPk(adminId);
    if (!admin || (admin["user-type"] !== "admin" && admin["user-type"] !== "staff")) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // جلب البوست
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // جلب صاحب البوست
    const author = await User.findByPk(post["author-id"]);
    if (!author) return res.status(404).json({ message: "Author not found" });

    // شرط لو الكاتب خريج
    if (author["user-type"] === "graduate" && post.category !== "Success story" && inLanding === true) {
      return res.status(400).json({
        message: "Only 'Success story' posts by graduates can appear on the landing page.",
      });
    }

    // تحديث الحالة
    post["in-landing"] = inLanding;
    await post.save();

    res.status(200).json({
      message: `Post landing status updated successfully.`,
      data: post,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// landing posts
const getLandingPosts = async (req, res) => {
  try {
    const currentUserId = req.user?.id || null;

    // جلب جميع البوستات في اللاندينج وغير مخفية
    const posts = await Post.findAll({
      where: {
        "in-landing": true,
        "is-hidden": false,
      },
      include: [
        {
          model: Like,
          attributes: ["like_id", "author-id", "user-id"],
        },
      ],
      order: [["created-at", "DESC"]],
    });

    // جلب بيانات كل مؤلف (author) لكل بوست
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

        // Calculate likesCount and isLikedByYou
        const likesCount = post.Likes ? post.Likes.length : 0;
        const isLikedByYou = currentUserId
          ? post.Likes?.some((like) => like["user-id"] === currentUserId) || false
          : false;

        return {
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
          "is-hidden": post["is-hidden"],
          likesCount: likesCount,
          isLikedByYou: isLikedByYou,
        };
      })
    );

    res.status(200).json({
      status: "success",
      message: "Landing page posts fetched successfully",
      data: postsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching landing posts:", error);
    res.status(500).json({
      status: "error",
      message: "Server error while fetching landing posts",
      error,
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
  getLandingPosts
};
