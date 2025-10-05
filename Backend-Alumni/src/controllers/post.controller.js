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
const createPost = async (req, res) => {
  try {
    const { category, content, groupId, inLanding } = req.body;
    const userId = req.user.id; // جاي من الـ middleware

    // هات بيانات اليوزر
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: HttpStatusHelper.ERROR,
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
          status: HttpStatusHelper.ERROR,
          message: "You are denied from creating a post",
        });
      }

      // لو فيه groupId لازم يتأكد إنه عضو ف الجروب
      if (groupId) {
        const isMember = await GroupMember.findOne({
          where: {
            "group-id": groupId,
            "user-id": userId,
          },
        });

        if (!isMember) {
          return res.status(403).json({
            status: HttpStatusHelper.ERROR,
            message: "You must be a member of the group to create a post",
          });
        }
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

    // إضافة الصور لو فيه
    if (req.files && req.files.length > 0) {
      const imagesData = req.files.map((file) => ({
        "post-id": newPost.post_id,
        "image-url": file.path, // لينك Cloudinary
      }));

      await PostImage.bulkCreate(imagesData);
    }

    // جلب كل الصور بعد الإنشاء
    const savedImages = await PostImage.findAll({
      where: { "post-id": newPost.post_id },
      attributes: ["image-url"],
    });

    return res.status(201).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Post created successfully",
      post: {
        ...newPost.toJSON(),
        images: savedImages.map((img) => img["image-url"]),
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

//get all posts in specific group
const getGroupPosts = async (req, res) => {
  try {
    const { groupId } = req.params;

    const posts = await Post.findAll({
      where: { "group-id": groupId },
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
              attributes: ["status-to-login"], // مثال: ممكن تضيف أي عمود من staff
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
      };
    });

    res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Group posts fetched successfully",
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
    const posts = await Post.findAll({
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
              attributes: ["status-to-login"], // مثال: ممكن تضيف اي عمود من staff زي الوظيفة
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
        image = null; // ممكن تحط عمود صورة staff لو موجود
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
      };
    });

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
    const posts = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          where: { "user-type": "graduate" }, // ✅ شرط ان يكون Graduate فقط
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
          : null, // لو ملوش صورة
      },
      "group-id": post["group-id"],
      "in-landing": post["in-landing"],
    }));

    res.status(200).json({
      status: "success",
      message: "Graduate posts fetched successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch graduate posts: " + error.message,
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

const getGraduatePosts = async (req, res) => {
  try {
    // نتأكد إنه فعلاً Graduate
    if (!req.user || req.user["user-type"] !== "graduate") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized as a graduate",
        data: [],
      });
    }

    // نجيب البوستات اللي author-id بتاعها = id اليوزر اللي عامل لوجن
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
        // غيري من "username" إلى "author"
        id: post.User.id,
        "full-name": `${post.User["first-name"]} ${post.User["last-name"]}`,
        email: post.User.email,
        image: post.User.Graduate
          ? post.User.Graduate["profile-picture-url"]
          : null,
      },
      "group-id": post["group-id"],
      "in-landing": post["in-landing"],
      likes: post.likes || 0, // أضيفي
      shares: post.shares || 0, // أضيفي
      comments: post.comments || [], // أضيفي
    }));

    return res.status(200).json({
      status: "success",
      message: "Graduate posts fetched successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching graduate posts:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch graduate posts: " + error.message,
      data: [],
    });
  }
};

const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { category, content, groupId, inLanding, images, removeImages } =
      req.body;

    // تحقق إن المستخدم Admin
    if (!req.user || req.user["user-type"] !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Only admins can edit posts",
      });
    }

    // ندور على البوست
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // السماح للأدمن يعدل بوستاته فقط
    if (post["author-id"] !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "You can only edit your own posts",
      });
    }

    // تحديث بيانات البوست
    if (category !== undefined) post.category = category;
    if (content !== undefined) post.content = content;

    if (groupId !== undefined) {
      post["group-id"] = groupId === null ? null : groupId;
    }

    if (inLanding !== undefined) {
      post["in-landing"] = inLanding;
    }

    await post.save();

    // حذف صور محددة لو موجودة في removeImages
    if (removeImages && Array.isArray(removeImages)) {
      await PostImage.destroy({
        where: {
          "post-id": postId,
          "image-url": removeImages,
        },
      });
    }

    // إضافة صور جديدة لو موجودة
    if (images !== undefined) {
      const imagesArray = Array.isArray(images) ? images : [images];
      await Promise.all(
        imagesArray.map((url) =>
          PostImage.create({
            "post-id": postId,
            "image-url": url,
          })
        )
      );
    }

    // جلب كل الصور بعد التحديث
    const updatedImages = await PostImage.findAll({
      where: { "post-id": postId },
      attributes: ["image-url"],
    });

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Post updated successfully",
      post: {
        ...post.toJSON(),
        images: updatedImages.map((img) => img["image-url"]),
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

// module.exports = { getCategories };

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

    // 🔍 نجيب البوست
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
        data: [],
      });
    }

    // ✅ نخفي البوست
    post["is-hidden"] = true;
    await post.save();

    return res.status(200).json({
      status: "success",
      message: "Post hidden successfully",
      data: [
        {
          postId: post.post_id,
          content: post.content,
          isHidden: post["is-hidden"],
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
};
