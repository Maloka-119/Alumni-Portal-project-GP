const HttpStatusHelper = require("../utils/HttpStatuHelper");
const Post = require("../models/Post");
const PostImage = require("../models/PostImage");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const User = require("../models/User");

const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, content, description, groupId, inLanding } = req.body;

    const post = await Post.create({
      category,
      content,
      description,
      "author-id": userId,
      "group-id": groupId || null,
      "in-landing": inLanding || false,
    });

    if (req.files && req.files.length > 0) {
      const postImages = req.files.map((file) => ({
        "post-id": post.post_id,
        "image-url": file.location, // URL اللي جاي من S3
      }));
      await PostImage.bulkCreate(postImages);
    }

    return res
      .status(201)
      .json({ status: HttpStatusHelper.SUCCESS, data: post });
  } catch (err) {
    return res
      .status(500)
      .json({ status: HttpStatusHelper.ERROR, message: err.message });
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
