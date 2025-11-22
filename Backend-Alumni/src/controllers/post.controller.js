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

// const createPost = async (req, res) => {
//   console.log("🟢 ----- [createPost] START -----");

//   try {
//     console.log("📦 Headers Content-Type:", req.headers["content-type"]);
//     console.log("👤 Auth User:", req.user ? req.user : "❌ req.user undefined");
//     console.log("🧾 req.body:", req.body);
//     console.log("📦 req.files:", req.files);

//     const { category, content, groupId, inLanding, type } = req.body;
//     const userId = req.user?.id;

//     const finalCategory = category || type || "General";

//     console.log("🔹 finalCategory:", finalCategory);
//     console.log("🔹 content:", content);
//     console.log("🔹 groupId:", groupId);
//     console.log("🔹 inLanding:", inLanding);

//     // 🟥 التحقق من المستخدم
//     if (!userId) {
//       return res.status(401).json({
//         status: "fail",
//         message: "User not authenticated",
//       });
//     }

//     const user = await User.findByPk(userId);
//     console.log(
//       "👤 Found User:",
//       user ? `${user["first-name"]} (${user["user-type"]})` : "❌ Not Found"
//     );

//     if (!user) {
//       return res.status(404).json({
//         status: "error",
//         message: "User not found",
//       });
//     }

//     // 🧩 تحقق من نوع المستخدم
//     if (user["user-type"] === "graduate") {
//       const graduate = await Graduate.findOne({
//         where: { graduate_id: user.id },
//       });

//       if (!graduate) {
//         return res.status(404).json({
//           status: "fail",
//           message: "Graduate record not found",
//         });
//       }

//       // تحقق من الحالة
//       if (graduate.status !== "active") {
//         return res.status(403).json({
//           status: "fail",
//           message:
//             "Your account is inactive, Please contact the Alumni Portal Team to activate your profile.",
//         });
//       }
//     }

//     //  إنشاء البوست
//     console.log("🪄 Creating post...");
//     const newPost = await Post.create({
//       category: finalCategory,
//       content: content || "",
//       "author-id": userId,
//       "group-id": groupId || null,
//       "in-landing": inLanding || false,
//     });

//     console.log("✅ Post created with ID:", newPost.post_id);

//     // 🖼️ رفع الصور
//     if (req.files && Array.isArray(req.files) && req.files.length > 0) {
//       console.log(`🖼️ Found ${req.files.length} file(s) to attach`);

//       try {
//         const imagesData = req.files.map((file) => ({
//           "post-id": newPost.post_id,
//           "image-url": file.path || file.url || file.location || null,
//         }));

//         await PostImage.bulkCreate(imagesData);
//         console.log("✅ Images saved to PostImage table");
//       } catch (imgErr) {
//         console.error("❌ Error saving images to DB:", imgErr);
//       }
//     }

//     // 📥 استرجاع الصور بعد الحفظ
//     const savedImages = await PostImage.findAll({
//       where: { "post-id": newPost.post_id },
//       attributes: ["image-url"],
//     });

//     console.log(
//       "🖼️ Saved images in DB:",
//       savedImages.map((img) => img["image-url"])
//     );
//     console.log("🟢 ----- [createPost] END SUCCESS -----");

//     return res.status(201).json({
//       status: "success",
//       message: "Post created successfully",
//       post: {
//         ...newPost.toJSON(),
//         images: savedImages.map((img) => img["image-url"]),
//       },
//     });
//   } catch (error) {
//     console.error("❌ [createPost] Error:", error);
//     console.error("🟥 Stack:", error.stack);
//     console.log("🟢 ----- [createPost] END ERROR -----");

//     return res.status(500).json({
//       status: "error",
//       message: error.message || "Failed to create post",
//     });
//   }
// };

//get all posts in specific group

const createPost = async (req, res) => {
  console.log("🟢 ----- [createPost] START -----");

  try {
    console.log("📦 Headers Content-Type:", req.headers["content-type"]);
    console.log("👤 Auth User:", req.user ? req.user : "❌ req.user undefined");
    console.log("🧾 req.body:", req.body);
    console.log("📦 req.files:", req.files);

    const { category, content, groupId, inLanding, type, postAsAdmin } =
      req.body;
    const userId = req.user?.id;

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!userId || !allowedUserTypes.includes(req.user["user-type"])) {
      return res.status(403).json({
        status: "fail",
        message: "Access denied.",
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        userId,
        "Community Post's management",
        "add"
      );

      if (!hasPermission) {
        return res.status(403).json({
          status: "fail",
          message: "Access denied. You don't have permission to create posts.",
        });
      }
    }

    // 4. لو admin أو graduate أو staff مع صلاحية → اتركه يكمل
    const finalCategory = category || type || "General";

    console.log("🔹 finalCategory:", finalCategory);
    console.log("🔹 content:", content);
    console.log("🔹 groupId:", groupId);
    console.log("🔹 inLanding:", inLanding);
    console.log("🔹 postAsAdmin:", postAsAdmin);

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

    // ⬇️⬇️⬇️ التعديل هنا: تحديد author-id بناءً على الصلاحيات ⬇️⬇️⬇️
    let authorId = userId; // الافتراضي: اليوزر نفسه

    // لو Staff وعايز ينشئ بوست باسم الأدمن
    if (postAsAdmin && user["user-type"] === "staff") {
      // نجيب أول أدمن متاح
      const adminUser = await User.findOne({
        where: { "user-type": "admin" },
        attributes: ["id"],
      });

      if (adminUser) {
        authorId = adminUser.id;
        console.log("🔹 Posting as Admin, Author ID:", authorId);
      } else {
        console.log("⚠️ No admin user found, posting as staff");
      }
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

    // الباقي زي ما هو...
    // إنشاء البوست
    console.log("🪄 Creating post...");
    const newPost = await Post.create({
      category: finalCategory,
      content: content || "",
      "author-id": authorId,
      "group-id": groupId || null,
      "in-landing": inLanding || false,
    });

    console.log("✅ Post created with ID:", newPost.post_id);
    console.log("✅ Post author ID:", authorId);

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

    // جلب بيانات المؤلف النهائي للـ response
    const finalAuthor = await User.findByPk(authorId, {
      attributes: ["id", "first-name", "last-name", "user-type"],
    });

    return res.status(201).json({
      status: "success",
      message: "Post created successfully",
      post: {
        ...newPost.toJSON(),
        images: savedImages.map((img) => img["image-url"]),
        author: {
          id: finalAuthor.id,
          "full-name": `${finalAuthor["first-name"]} ${finalAuthor["last-name"]}`,
          type: finalAuthor["user-type"],
        },
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

const getGroupPosts = async (req, res) => {
  try {
    const { groupId } = req.params;

    // 1. تحديد اليوزر types المسموح لهم - كل اليوزر types
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
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
        return res.status(403).json({
          status: "error",
          message:
            "Access denied. You don't have permission to view group posts.",
          data: [],
        });
      }
    }

    // 4. لو admin أو graduate أو staff مع صلاحية → اتركه يكمل
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

    const currentUserId = req.user?.id || null;

    const responseData = posts.map((post) => {
      let image = null;

      if (post.User.Graduate) {
        image = post.User.Graduate["profile-picture-url"];
      } else if (post.User.Staff) {
        image = null;
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

// const getAllPostsOfUsers = async (req, res) => {
//   try {
//     const user = req.user;
//     const isAdmin = user && user["user-type"] === "admin";
//     const isStaff = user && user["user-type"] === "staff";
//     const isGraduate = user && user["user-type"] === "graduate";

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     let whereCondition = {};

//     if (isAdmin) {
//       // الأدمن يشوف كل البوستات
//       whereCondition = {};
//     } else if (isStaff) {
//       // الستاف يشوف البوستات الظاهرة فقط
//       whereCondition = { "is-hidden": false };
//     } else if (isGraduate) {
//       // الخريج يشوف: بوستاته + بوستات أصدقائه + كل بوستات الأدمن
//       const friendships = await Friendship.findAll({
//         where: {
//           [Op.or]: [
//             { sender_id: user.id, status: "accepted" },
//             { receiver_id: user.id, status: "accepted" },
//           ],
//         },
//       });

//       const friendIds = friendships.map((friendship) =>
//         friendship.sender_id === user.id
//           ? friendship.receiver_id
//           : friendship.sender_id
//       );

//       friendIds.push(user.id);

//       // نجيب كل مستخدمين الأدمن
//       const adminUsers = await User.findAll({
//         where: { "user-type": "admin" },
//         attributes: ["id"],
//       });

//       const adminIds = adminUsers.map((admin) => admin.id);

//       // ندمج IDs الأصدقاء + IDs الأدمن
//       const allAuthorIds = [...friendIds, ...adminIds];

//       whereCondition = {
//         "is-hidden": false,
//         "author-id": { [Op.in]: allAuthorIds },
//       };
//     } else {
//       whereCondition = { "is-hidden": false };
//     }

//     const posts = await Post.findAll({
//       where: whereCondition,
//       include: [
//         {
//           model: User,
//           attributes: ["id", "first-name", "last-name", "email", "user-type"],
//           include: [
//             { model: Graduate, attributes: ["profile-picture-url"] },
//             { model: Staff, attributes: ["status-to-login"] },
//           ],
//         },
//         {
//           model: PostImage,
//           attributes: ["image-url"],
//         },
//         {
//           model: Like,
//           attributes: ["like_id", "user-id"],
//           include: [
//             {
//               model: User,
//               attributes: ["id", "first-name", "last-name"],
//             },
//           ],
//         },
//         {
//           model: Comment,
//           attributes: [
//             "comment_id",
//             "content",
//             "created-at",
//             "edited",
//             "author-id",
//           ],
//           include: [
//             {
//               model: User,
//               attributes: [
//                 "id",
//                 "first-name",
//                 "last-name",
//                 "email",
//                 "user-type",
//               ],
//               include: [
//                 {
//                   model: Graduate,
//                   as: "Graduate",
//                   attributes: ["profile-picture-url"],
//                 },
//               ],
//             },
//           ],
//           order: [["created-at", "DESC"]],
//         },
//       ],
//       order: [["created-at", "DESC"]],
//       limit: limit,
//       offset: offset,
//     });

//     const totalPosts = await Post.count({ where: whereCondition });
//     const totalPages = Math.ceil(totalPosts / limit);
//     const hasMore = page < totalPages;

//     const currentUserId = req.user?.id || null;

//     const responseData = posts.map((post) => {
//       const likesCount = post.Likes ? post.Likes.length : 0;
//       const isLikedByYou = currentUserId
//         ? post.Likes?.some((like) => like["user-id"] === currentUserId) || false
//         : false;

//       return {
//         post_id: post.post_id,
//         category: post.category,
//         content: post.content,
//         description: post.description,
//         "created-at": post["created-at"],
//         author: {
//           id: post.User.id,
//           "full-name": `${post.User["first-name"]} ${post.User["last-name"]}`,
//           email: post.User.email,
//           type: post.User["user-type"],
//           image: post.User.Graduate
//             ? post.User.Graduate["profile-picture-url"]
//             : null,
//         },
//         "group-id": post["group-id"],
//         "in-landing": post["in-landing"],
//         images: post.PostImages
//           ? post.PostImages.map((img) => img["image-url"])
//           : [],
//         "is-hidden": post["is-hidden"],
//         likesCount: likesCount,
//         isLikedByYou: isLikedByYou,
//         likes: post.Likes
//           ? post.Likes.map((like) => ({
//               like_id: like.like_id,
//               user: {
//                 id: like.User?.id || "unknown",
//                 "full-name":
//                   `${like.User?.["first-name"] || ""} ${
//                     like.User?.["last-name"] || ""
//                   }`.trim() || "Unknown User",
//               },
//             }))
//           : [],
//         comments_count: post.Comments ? post.Comments.length : 0,
//         comments: post.Comments
//           ? post.Comments.map((comment) => ({
//               comment_id: comment.comment_id,
//               content: comment.content,
//               "created-at": comment["created-at"],
//               time_since: moment(comment["created-at"]).fromNow(),
//               edited: comment.edited,
//               author: {
//                 id: comment.User?.id || "unknown",
//                 "full-name":
//                   `${comment.User?.["first-name"] || ""} ${
//                     comment.User?.["last-name"] || ""
//                   }`.trim() || "Unknown User",
//                 email: comment.User?.email || "unknown",
//                 image: comment.User?.Graduate
//                   ? comment.User.Graduate["profile-picture-url"]
//                   : null,
//               },
//             }))
//           : [],
//       };
//     });

//     res.status(200).json({
//       status: "success",
//       message: "All posts fetched successfully",
//       data: responseData,
//       pagination: {
//         currentPage: page,
//         totalPages: totalPages,
//         totalPosts: totalPosts,
//         hasMore: hasMore,
//         limit: limit,
//       },
//     });
//   } catch (error) {
//     console.error("Error details:", error);
//     res.status(500).json({
//       status: "error",
//       message: "Failed to fetch posts: " + error.message,
//       data: [],
//     });
//   }
// };

//بتجيب كل بوستات الخريجين بس

const getAllPostsOfUsers = async (req, res) => {
  try {
    const user = req.user;
    const isAdmin = user && user["user-type"] === "admin";
    const isStaff = user && user["user-type"] === "staff";
    const isGraduate = user && user["user-type"] === "graduate";

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereCondition = {};

    if (isAdmin) {
      // الأدمن يشوف كل البوستات
      whereCondition = {};
    } else if (isStaff) {
      // الستاف يشوف البوستات الظاهرة فقط
      whereCondition = { "is-hidden": false };
    } else if (isGraduate) {
      // الخريج يشوف: بوستاته + بوستات أصدقائه + كل بوستات الأدمن + كل بوستات الستاف
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

      // نجيب كل مستخدمين الأدمن والستاف
      const adminAndStaffUsers = await User.findAll({
        where: {
          [Op.or]: [{ "user-type": "admin" }, { "user-type": "staff" }],
        },
        attributes: ["id"],
      });

      const adminAndStaffIds = adminAndStaffUsers.map((user) => user.id);

      // ندمج IDs الأصدقاء + IDs الأدمن والستاف
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
    console.error("Error details:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch posts: " + error.message,
      data: [],
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const user = req.user;
    console.log("🟩 Current user from token:", user);

    const isAdmin = user && user["user-type"] === "admin";
    const isStaff = user && user["user-type"] === "staff";

    console.log("🟦 isAdmin:", isAdmin);
    console.log("🟨 isStaff:", isStaff);

    // ✅ التحقق من الصلاحية للـ Staff
    if (isStaff) {
      const hasPermission = await checkStaffPermission(
        user.id,
        "Graduates posts management",
        "view"
      );

      if (!hasPermission) {
        return res.status(403).json({
          status: "error",
          message:
            "Access denied. You don't have permission to view graduates posts.",
          data: [],
        });
      }
    }

    // ⬅️ الشرط الجديد: Admin و Staff يشوفوا الكل
    const whereCondition = isAdmin || isStaff ? {} : { "is-hidden": false };
    console.log("🟨 whereCondition used:", whereCondition);

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

    console.log("🟧 Posts fetched count:", posts.length);
    console.log(
      "🟪 Sample post is-hidden values:",
      posts.slice(0, 3).map((p) => p["is-hidden"])
    );

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

const hideNegativePost = async (req, res) => {
  try {
    const user = req.user;
    const { postId } = req.params;

    // ✅ التعديل هنا: لازم يكون Admin أو Staff
    if (
      !user ||
      (user["user-type"] !== "admin" && user["user-type"] !== "staff")
    ) {
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

    // ✅ التعديل هنا: لازم يكون Admin أو Staff
    if (
      !user ||
      (user["user-type"] !== "admin" && user["user-type"] !== "staff")
    ) {
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

const getAdminPosts = async (req, res) => {
  try {
    // 1. تحديد اليوزر types المسموح لهم - كل اليوزر types
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
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
              [Op.in]: ["admin", "staff"], // ⬅️ التعديل هنا: نجيب الأدمن والستاف
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
              attributes: ["id", "first-name", "last-name", "user-type"], // ⬅️ إضافة user-type هنا
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
          type: post.User?.["user-type"] || "unknown", // ⬅️ بنضيف نوع اليوزر
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
                "user-type": like.User?.["user-type"] || "unknown", // ⬅️ إضافة user-type هنا
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
                "user-type": comment.User?.["user-type"] || "unknown", // ⬅️ إضافة user-type هنا
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
        "in-landing": post["in-landing"] || false,
      };
    });

    res.status(200).json({
      status: "success",
      message: "Admin and staff posts fetched successfully", // ⬅️ عدلنا الرسالة
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching admin and staff posts:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch admin and staff posts",
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
          "user-type": post.User["user-type"], // أضيف هنا
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
                "user-type": like.User?.["user-type"] || "unknown", // أضيف هنا
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
                "user-type": comment.User?.["user-type"] || "unknown", // أضيف هنا
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

// const editPost = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const { category, type, content, link, groupId, inLanding, removeImages } =
//       req.body;

//     // تحديد الكاتيجوري النهائي
//     const finalCategory = category || type;

//     // الحصول على البوست من قاعدة البيانات
//     const post = await Post.findByPk(postId, {
//       include: [
//         { model: PostImage, attributes: ["image-url"] },
//         {
//           model: User,
//           attributes: ["id", "user-type"], // ⬅️ بنجيب نوع اليوزر عشان نتحقق
//         },
//       ],
//     });

//     if (!post) {
//       return res.status(404).json({
//         status: "error",
//         message: "Post not found",
//       });
//     }

//     // ⬇️⬇️⬇️ التحقق الجديد: منع التعديل إذا البوست مخفي ⬇️⬇️⬇️
//     if (post["is-hidden"]) {
//       return res.status(403).json({
//         status: "error",
//         message: "Cannot edit a hidden post",
//       });
//     }

//     // ⬇️⬇️⬇️ التعديل هنا: السماح للـ Staff بالتعديل على بوستات الأدمن ⬇️⬇️⬇️
//     const isPostOwner = post["author-id"] === req.user.id;
//     const isStaffEditingAdminPost =
//       req.user["user-type"] === "staff" && post.User["user-type"] === "admin";

//     if (!isPostOwner && !isStaffEditingAdminPost) {
//       return res.status(403).json({
//         status: "error",
//         message: "You can only edit your own posts or admin posts (for staff)",
//       });
//     }

//     // تحديث الحقول
//     if (finalCategory !== undefined) post.category = finalCategory;
//     if (content !== undefined) post.content = content;
//     if (link !== undefined) post.link = link;
//     if (groupId !== undefined)
//       post["group-id"] = groupId === null ? null : groupId;
//     if (inLanding !== undefined) post["in-landing"] = inLanding;

//     await post.save();

//     // حذف الصور المطلوبة
//     if (
//       removeImages &&
//       Array.isArray(removeImages) &&
//       removeImages.length > 0
//     ) {
//       await PostImage.destroy({
//         where: { "post-id": postId, "image-url": removeImages },
//       });
//     }

//     // إضافة صور جديدة (لو موجودة)
//     if (req.files && req.files.length > 0) {
//       const uploadedImages = req.files.map((file) => ({
//         "post-id": postId,
//         "image-url": file.path || file.url || file.location,
//       }));
//       await PostImage.bulkCreate(uploadedImages);
//     }

//     // جلب البوست بعد التحديث
//     const updatedPost = await Post.findByPk(postId, {
//       include: [
//         {
//           model: User,
//           attributes: ["id", "first-name", "last-name", "email", "user-type"],
//         },
//         {
//           model: PostImage,
//           attributes: ["image-url"],
//         },
//       ],
//     });

//     const responseData = {
//       ...updatedPost.toJSON(),
//       images: updatedPost.PostImages
//         ? updatedPost.PostImages.map((img) => img["image-url"])
//         : [],
//       author: {
//         id: updatedPost.User.id,
//         "full-name": `${updatedPost.User["first-name"]} ${updatedPost.User["last-name"]}`,
//         email: updatedPost.User.email,
//       },
//     };

//     return res.status(200).json({
//       status: "success",
//       message: "Post updated successfully",
//       data: responseData,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: error.message,
//     });
//   }
// };

//edit post
const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { category, type, content, link, groupId, inLanding, removeImages } =
      req.body;

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
      });
    }

    // 3. لو staff → تحقق من الصلاحيات (Community أو Portal)
    if (req.user["user-type"] === "staff") {
      const hasCommunityPermission = await checkStaffPermission(
        req.user.id,
        "Community Post's management",
        "edit"
      );

      const hasPortalPermission = await checkStaffPermission(
        req.user.id,
        "Portal posts management",
        "edit"
      );

      // Staff هيقدر يعدل لو عنده أي من الصلاحيتين
      if (!hasCommunityPermission && !hasPortalPermission) {
        return res.status(403).json({
          status: "error",
          message: "Access denied. You don't have permission to edit posts.",
        });
      }
    }

    // 4. لو admin أو graduate أو staff مع صلاحية → اتركه يكمل
    // تحديد الكاتيجوري النهائي
    const finalCategory = category || type;

    // الحصول على البوست من قاعدة البيانات
    const post = await Post.findByPk(postId, {
      include: [
        { model: PostImage, attributes: ["image-url"] },
        {
          model: User,
          attributes: ["id", "user-type"],
        },
      ],
    });

    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // ⬇️⬇️⬇️ التحقق الجديد: منع التعديل إذا البوست مخفي ⬇️⬇️⬇️
    if (post["is-hidden"]) {
      return res.status(403).json({
        status: "error",
        message: "Cannot edit a hidden post",
      });
    }

    // ⬇️⬇️⬇️ التعديل هنا: السماح للـ Staff بالتعديل على بوستات الأدمن والادمن على بوستات الاستاف ⬇️⬇️⬇️
    const isPostOwner = post["author-id"] === req.user.id;
    const isStaffEditingAdminPost =
      req.user["user-type"] === "staff" && post.User["user-type"] === "admin";
    const isAdminEditingStaffPost =
      req.user["user-type"] === "admin" && post.User["user-type"] === "staff";

    if (!isPostOwner && !isStaffEditingAdminPost && !isAdminEditingStaffPost) {
      return res.status(403).json({
        status: "error",
        message:
          "You can only edit your own posts or admin posts (for staff) or staff posts (for admin)",
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
// Like a post (toggle)
const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // تحقق من وجود البوست
    const post = await Post.findByPk(postId);
    if (!post) {
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

    return res.status(201).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Post liked successfully",
      like: newLike,
    });
  } catch (error) {
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

    // البحث عن Like
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

    // حذف الـ Like
    await like.destroy();

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Post unliked successfully",
    });
  } catch (error) {
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

    // Create notification for post author (if not commenting on own post)
    if (post["author-id"] !== userId) {
      await notifyPostCommented(post["author-id"], userId, postId, newComment.comment_id);
    }

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

    // Get the post to notify the post author
    const post = await Post.findByPk(comment["post-id"]);
    if (post && post["author-id"] !== userId) {
      await notifyCommentEdited(post["author-id"], userId, post.post_id, commentId);
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

    // Get the post to notify the post author before deleting
    const post = await Post.findByPk(comment["post-id"]);
    const postId = post ? post.post_id : null;

    // Delete the comment
    await comment.destroy();

    // Create notification for post author (if not deleting own comment on own post)
    if (post && post["author-id"] !== userId && postId) {
      await notifyCommentDeleted(post["author-id"], userId, postId);
    }

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
// const deletePost = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user.id;

//     // Find the post
//     const post = await Post.findByPk(postId);
//     if (!post) {
//       return res.status(404).json({
//         status: "error",
//         message: "Post not found",
//       });
//     }

//     // ⬇️⬇️⬇️ التحقق الجديد: منع الحذف إذا البوست مخفي ⬇️⬇️⬇️
//     if (post["is-hidden"]) {
//       return res.status(403).json({
//         status: "error",
//         message: "Cannot delete a hidden post",
//       });
//     }

//     // Check if the post was created by the current staff member or by a graduate
//     const postAuthor = await User.findByPk(post["author-id"]);
//     if (!postAuthor) {
//       return res.status(404).json({
//         status: "error",
//         message: "Post author not found",
//       });
//     }

//     // ⬇️⬇️⬇️ التعديل هنا: السماح للـ Staff بحذف بوستات الأدمن ⬇️⬇️⬇️
//     const isOwnPost = post["author-id"] === userId;
//     const isGraduatePost = postAuthor["user-type"] === "graduate";
//     const isStaffDeletingAdminPost =
//       req.user["user-type"] === "staff" && postAuthor["user-type"] === "admin";

//     // Allow deleting if:
//     // 1) It's the user's own post, OR
//     // 2) It's a graduate's post, OR
//     // 3) Staff is deleting an admin's post
//     if (!isOwnPost && !isGraduatePost && !isStaffDeletingAdminPost) {
//       return res.status(403).json({
//         status: "error",
//         message:
//           "You can only delete your own posts, posts created by graduates, or admin posts (for staff)",
//       });
//     }

//     // Delete associated comments and likes first
//     await Comment.destroy({ where: { "post-id": postId } });
//     await Like.destroy({ where: { "post-id": postId } });

//     // Delete the post
//     await post.destroy();

//     return res.status(200).json({
//       status: HttpStatusHelper.SUCCESS,
//       message: "Post deleted successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       status: HttpStatusHelper.ERROR,
//       message: error.message,
//     });
//   }
// };

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!userId || !allowedUserTypes.includes(req.user["user-type"])) {
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
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // ⬇️⬇️⬇️ التحقق الجديد: منع الحذف إذا البوست مخفي ⬇️⬇️⬇️
    if (post["is-hidden"]) {
      return res.status(403).json({
        status: "error",
        message: "Cannot delete a hidden post",
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
        time_since: moment(comment["created-at"]).fromNow(), // الوقت منذ إنشاء الكومنت
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

    // Create notification for the parent comment author (if not replying to own comment)
    if (parentComment["author-id"] !== userId) {
      await notifyCommentReplied(parentComment["author-id"], userId, parentComment["post-id"], commentId, newReply.comment_id);
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

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
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
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // جلب صاحب البوست
    const author = await User.findByPk(post["author-id"]);
    if (!author) {
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
      return res.status(400).json({
        status: "error",
        message:
          "Only 'Success story' posts by graduates can appear on the landing page.",
      });
    }

    // تحديث الحالة
    post["in-landing"] = inLanding;
    await post.save();

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
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
      error: error.message,
    });
  }
};

// landing posts
const getLandingPosts = async (req, res) => {
  try {
    const currentUserId = req.user?.id || null;

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
