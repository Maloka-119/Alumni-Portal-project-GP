const HttpStatusHelper = require("../utils/HttpStatuHelper");
const Comment = require("../models/Comment");6
const Like = require("../models/Like");
const User = require("../models/User");
const Graduate = require("../models/Graduate");
const Post = require("../models/Post");
const PostImage = require("../models/PostImage");
const createPost = async (req, res) => {
  try {
    const { category, content, groupId, inLanding } = req.body;
    const userId = req.user.id; // جاي من الـ middleware بتاع الـ auth

    // هات بيانات اليوزر من الداتابيز
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    // لو Graduate لازم يكون Active
    if (user["user-type"] === "Graduate" && !user.isActive) {
      return res.status(403).json({ status: "error", message: "Graduate is not active" });
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
      status: "success",
      message: "Post created successfully",
      post: newPost,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Something went wrong" });
  }
};



const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
      order: [["created-at", "DESC"]],
    });

    // تعديل الـ response عشان يبقى بالشكل المطلوب
    const responseData = posts.map((post) => ({
      post_id: post.post_id,
      category: post.category,
      content: post.content,
      description: post.description,
      "created-at": post["created-at"],
      author: {
        id: post.User.id,
        "full-name": `${post.User["first-name"]} ${post.User["last-name"]}`, // الحقل الجديد فقط
        email: post.User.email,
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

module.exports = {
  createPost,
  getAllPosts,
};
