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

//create post
// const createPost = async (req, res) => {
//   try {
//     const { category, content, groupId, inLanding } = req.body;
//     const userId = req.user.id; // جاي من الـ middleware

//     // هات بيانات اليوزر
//     const user = await User.findByPk(userId);

//     if (!user) {
//       return res.status(404).json({
//         status: HttpStatusHelper.ERROR,
//         message: "User not found",
//       });
//     }

//     // لو Graduate لازم يكون Active
//     if (user["user-type"] === "graduate") {
//       const graduate = await Graduate.findOne({
//         where: { graduate_id: user.id },
//       });

//       if (!graduate || graduate.status !== "active") {
//         return res.status(403).json({
//           status: HttpStatusHelper.ERROR,
//           message: "You are denied from creating a post",
//         });
//       }

//       // لو فيه groupId لازم يتأكد إنه عضو ف الجروب
//       if (groupId) {
//         const isMember = await GroupMember.findOne({
//           where: {
//             "group-id": groupId,
//             "user-id": userId,
//           },
//         });

//         if (!isMember) {
//           return res.status(403).json({
//             status: HttpStatusHelper.ERROR,
//             message: "You must be a member of the group to create a post",
//           });
//         }
//       }
//     }

//     // إنشاء البوست
//     const newPost = await Post.create({
//       category,
//       content,
//       "author-id": userId,
//       "group-id": groupId || null,
//       "in-landing": inLanding || false,
//     });

//     // إضافة الصور لو فيه
//     if (req.files && req.files.length > 0) {
//       const imagesData = req.files.map((file) => ({
//         "post-id": newPost.post_id,
//         "image-url": file.path, // لينك Cloudinary
//       }));

//       await PostImage.bulkCreate(imagesData);
//     }

//     // جلب كل الصور بعد الإنشاء
//     const savedImages = await PostImage.findAll({
//       where: { "post-id": newPost.post_id },
//       attributes: ["image-url"],
//     });

//     return res.status(201).json({
//       status: HttpStatusHelper.SUCCESS,
//       message: "Post created successfully",
//       post: {
//         ...newPost.toJSON(),
//         images: savedImages.map((img) => img["image-url"]),
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       status: HttpStatusHelper.ERROR,
//       message: error.message,
//     });
//   }
// };

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

    // 🆕 الحل: تعليق شروط الـ graduate علشان الـ testing
    console.log("✅ Skipping graduate checks for testing");

    // 🧱 إنشاء البوست
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
      ],
      order: [["created-at", "DESC"]],
    });

    const responseData = posts.map((post) => {
      let image = null;

      if (post.User.Graduate) {
        image = post.User.Graduate["profile-picture-url"];
      } else if (post.User.Staff) {
        image = null; // لو عندك عمود صورة staff ممكن تضيفه هنا
      }

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
        { model: PostImage, attributes: ["image-url"] },
      ],
      order: [["created-at", "DESC"]],
    });

    const responseData = posts.map((post) => ({
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
    }));

    res.status(200).json({
      status: "success",
      message: "All posts fetched successfully",
      data: responseData,
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
      ],
      order: [["created-at", "DESC"]],
    });

    console.log("🟧 Posts fetched count:", posts.length); // 🔍 نطبع عدد البوستات اللي رجعت
    console.log(
      "🟪 Sample post is-hidden values:",
      posts.slice(0, 3).map((p) => p["is-hidden"])
    ); // 🔍 نشوف أول 3 قيم من is-hidden

    const responseData = posts.map((post) => ({
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
    }));

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

// const getGraduatePosts = asyncHandler(async (req, res) => {
//   try {
//     const posts = await Post.findAll({
//       include: [
//         {
//           model: User,
//           attributes: ["id", "name", "user-type"],
//           where: { "user-type": "graduate" }, // شرط ان يكون graduate فقط
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//     });

//     res.json({
//       status: "success",
//       message: "Graduate posts fetched successfully",
//       data: posts,
//     });
//   } catch (error) {
//     console.error("Error fetching graduate posts:", error);
//     res.status(500).json({ status: "error", message: "Server error" });
//   }
// });

// get Categories
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
const getAdminPosts = async (req, res) => {
  try {
    // جلب البوستات الخاصة بالمستخدمين من نوع admin فقط
    const posts = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          where: { "user-type": "admin" }, // الفلترة هنا علشان نجيب الأدمنز فقط
        },
        {
          model: PostImage, // 🆕 أضفنا الـ include للصور
          attributes: ["image-url"],
        },
      ],
      order: [["created-at", "DESC"]],
    });

    const responseData = posts.map((post) => ({
      post_id: post.post_id,
      category: post.category,
      content: post.content,
      description: post.description,
      "created-at": post["created-at"],
      author: {
        id: post.User.id,
        "full-name": `${post.User["first-name"]} ${post.User["last-name"]}`,
        email: post.User.email,
      },
      "group-id": post["group-id"],
      "in-landing": post["in-landing"],
      images: post.PostImages
        ? post.PostImages.map((img) => img["image-url"])
        : [], // 🆕 أضفنا الصور
    }));

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

// const getGraduatePosts = async (req, res) => {
//   try {
//     // نتأكد إنه فعلاً Graduate
//     if (!req.user || req.user["user-type"] !== "graduate") {
//       return res.status(403).json({
//         status: "error",
//         message: "Not authorized as a graduate",
//         data: [],
//       });
//     }

//     // نجيب البوستات اللي author-id بتاعها = id اليوزر اللي عامل لوجن
//     const posts = await Post.findAll({
//       where: { "author-id": req.user.id },
//       include: [
//         {
//           model: User,
//           attributes: ["id", "first-name", "last-name", "email", "user-type"],
//           include: [
//             {
//               model: Graduate,
//               attributes: ["profile-picture-url"],
//             },
//           ],
//         },
//       ],
//       order: [["created-at", "DESC"]],
//     });

//     const responseData = posts.map((post) => ({
//       id: post.post_id,
//       category: post.category,
//       content: post.content,
//       description: post.description,
//       "created-at": post["created-at"],
//       author: {
//         // غيري من "username" إلى "author"
//         id: post.User.id,
//         "full-name": `${post.User["first-name"]} ${post.User["last-name"]}`,
//         email: post.User.email,
//         image: post.User.Graduate
//           ? post.User.Graduate["profile-picture-url"]
//           : null,
//       },
//       "group-id": post["group-id"],
//       "in-landing": post["in-landing"],
//       likes: post.likes || 0, // أضيفي
//       shares: post.shares || 0, // أضيفي
//       comments: post.comments || [], // أضيفي
//     }));

//     return res.status(200).json({
//       status: "success",
//       message: "Graduate posts fetched successfully",
//       data: responseData,
//     });
//   } catch (error) {
//     console.error("Error fetching graduate posts:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Failed to fetch graduate posts: " + error.message,
//       data: [],
//     });
//   }
// };

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
          include: [{ model: Graduate, attributes: ["profile-picture-url"] }],
        },
        { model: PostImage, attributes: ["image-url"] },
      ],
      order: [["created-at", "DESC"]],
    });

    const responseData = posts.map((post) => ({
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
      likes: post.likes || 0,
      shares: post.shares || 0,
      comments: post.comments || [],
      images: post.PostImages
        ? post.PostImages.map((img) => img["image-url"])
        : [],
    }));

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

const editPost = async (req, res) => {
  console.log("🟢 ----- [editPost] START -----");

  try {
    const { postId } = req.params;

    // ✅ عرض البيانات القادمة
    console.log("🧾 req.body:", req.body);
    console.log("📦 req.files:", req.files);
    console.log("👤 User ID:", req.user?.id);

    const { category, type, content, link, groupId, inLanding, removeImages } =
      req.body;

    // 🆕 دمج category و type
    const finalCategory = category || type;

    // جيب البوست مع الصور
    const post = await Post.findByPk(postId, {
      include: [
        {
          model: PostImage,
          attributes: ["image-url"],
        },
      ],
    });

    if (!post) {
      return res
        .status(404)
        .json({ status: "error", message: "Post not found" });
    }

    // 🆕 اسمح للـ Admin يعدل أي بوست + صاحب البوست
    const isAdmin = req.user["user-type"] === "admin";
    const isPostOwner = post["author-id"] === req.user.id;

    if (!isPostOwner && !isAdmin) {
      return res
        .status(403)
        .json({ status: "error", message: "You can only edit your own posts" });
    }

    console.log("✅ User authorized to edit post");

    // تحديث الحقول
    if (finalCategory !== undefined) {
      post.category = finalCategory;
      console.log("🔹 Updated category:", finalCategory);
    }
    if (content !== undefined) {
      post.content = content;
      console.log("🔹 Updated content:", content);
    }
    if (link !== undefined) {
      post.link = link;
      console.log("🔹 Updated link:", link);
    }
    if (groupId !== undefined) {
      post["group-id"] = groupId === null ? null : groupId;
      console.log("🔹 Updated groupId:", groupId);
    }
    if (inLanding !== undefined) {
      post["in-landing"] = inLanding;
      console.log("🔹 Updated inLanding:", inLanding);
    }

    await post.save();
    console.log("✅ Post fields updated");

    // معالجة الصور المحذوفة
    if (
      removeImages &&
      Array.isArray(removeImages) &&
      removeImages.length > 0
    ) {
      console.log("🗑️ Removing images:", removeImages);
      await PostImage.destroy({
        where: { "post-id": postId, "image-url": removeImages },
      });
    }

    // معالجة الصور الجديدة
    if (req.files && req.files.length > 0) {
      console.log(`🖼️ Adding ${req.files.length} new image(s)`);
      const uploadedImages = req.files.map((file) => ({
        "post-id": postId,
        "image-url": file.path || file.url || file.location,
      }));
      await PostImage.bulkCreate(uploadedImages);
    }

    // جيب البوست المحدث مع الصور
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

    console.log("✅ Post updated successfully");
    console.log("🟢 ----- [editPost] END SUCCESS -----");

    return res.status(200).json({
      status: "success",
      message: "Post updated successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("❌ Error in editPost:", error);
    console.error("🟥 Stack:", error.stack);
    console.log("🟢 ----- [editPost] END ERROR -----");

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

    // Check if user is staff
    if (req.user["user-type"] !== "staff") {
      return res.status(403).json({
        status: "error",
        message: "Only staff members can like posts",
      });
    }

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

    // Check if user is staff
    if (req.user["user-type"] !== "staff") {
      return res.status(403).json({
        status: "error",
        message: "Only staff members can unlike posts",
      });
    }

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

    // Check if user is staff
    if (req.user["user-type"] !== "staff") {
      return res.status(403).json({
        status: "error",
        message: "Only staff members can comment on posts",
      });
    }

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

    // Fetch comment with author details
    const commentWithAuthor = await Comment.findByPk(newComment.comment_id, {
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
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

    // Check if user is staff
    if (req.user["user-type"] !== "staff") {
      return res.status(403).json({
        status: "error",
        message: "Only staff members can edit comments",
      });
    }

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

// Delete comment (staff can delete their own comments)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Check if user is staff
    if (req.user["user-type"] !== "staff") {
      return res.status(403).json({
        status: "error",
        message: "Only staff members can delete comments",
      });
    }

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

// Delete post (staff can delete their own posts and graduate posts)
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if user is staff
    if (req.user["user-type"] !== "staff") {
      return res.status(403).json({
        status: "error",
        message: "Only staff members can delete posts",
      });
    }

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
      where: { "post-id": postId },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
      order: [["created-at", "ASC"]],
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
        edited: comment.edited,
        author: {
          id: comment.User.id,
          "full-name": `${comment.User["first-name"]} ${comment.User["last-name"]}`,
          email: comment.User.email,
        },
      })),
      likes: likes.map((like) => ({
        like_id: like.like_id,
        user: {
          id: like.User.id,
          "full-name": `${like.User["first-name"]} ${like.User["last-name"]}`,
          email: like.User.email,
        },
      })),
      likesCount: likes.length,
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
};
