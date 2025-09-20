const HttpStatusHelper = require("../utils/HttpStatuHelper");
const Comment = require("../models/Comment");
6;
const Like = require("../models/Like");
const User = require("../models/User");
const Graduate = require("../models/Graduate");
const Post = require("../models/Post");
const PostImage = require("../models/PostImage");

//create post
const createPost = async (req, res) => {
  try {
    const { category, content, groupId, inLanding } = req.body;
    const userId = req.user.id; // جاي من الـ middleware

    // هات بيانات اليوزر
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // لو Graduate لازم يكون Active
    if (user["user-type"] === "graduate") {
      const graduate = await Graduate.findOne({
        where: { graduate_id: user.id },
      });

      if (!graduate || graduate.status !== "active") {
        return res.status(403).json({
          status: "error",
          message: "Graduate is not active",
        });
      }
    }

    // إنشاء البوست
    const newPost = await Post.create({
      category,
      content,
      "author-id": userId,
      "group-id": groupId || null,
      "in-landing": inLanding || false,
    });

    return res.status(201).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

//get all posts
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
          include: [
            {
              model: Graduate,
              attributes: ["profile-picture-url"], // الصورة من جدول Graduate
            },
          ],
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
        image: post.User.Graduate
          ? post.User.Graduate["profile-picture-url"]
          : null, // لو staff أو ملوش صورة
      },
      "group-id": post["group-id"],
      "in-landing": post["in-landing"],
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
    // نتأكد إنه فعلاً Admin
    if (!req.user || req.user["user-type"] !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized as an admin",
      });
    }

    // نجيب البوستات اللي الـ author-id بتاعها = id الأدمن
    const posts = await Post.findAll({
      where: { "author-id": req.user.id },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
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
// module.exports = { getCategories };

module.exports = {
  createPost,
  getAllPosts,
  getCategories,
  getAdminPosts,
};
