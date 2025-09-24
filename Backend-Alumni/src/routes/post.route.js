const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("../config/cloudinary"); // ملف إعدادات Cloudinary
const postController = require("../controllers/post.controller");

// إعداد التخزين على Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "posts", // كل الصور هتتحط في فولدر اسمه posts
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage: storage });

// رفع صور البوست (لحد 5 صور)
router.post(
  "/create-post",
  authMiddleware.protect,
  upload.array("images", 5), // images = اسم الحقل من الـ frontend
  postController.createPost
);

router.get("/", postController.getAllPosts);
router.get("/categories", postController.getCategories);
router.get("/admin", authMiddleware.protect, postController.getAdminPosts);

// Post details with comments and likes
router.get("/:postId", postController.getPostWithDetails);

// Like/Unlike post (staff only)
router.post("/:postId/like", authMiddleware.protect, postController.likePost);
router.delete("/:postId/like", authMiddleware.protect, postController.unlikePost);

// Comment on post (staff only)
router.post("/:postId/comments", authMiddleware.protect, postController.addComment);

// Edit/Delete comment (staff only - own comments)
router.put("/comments/:commentId", authMiddleware.protect, postController.editComment);
router.delete("/comments/:commentId", authMiddleware.protect, postController.deleteComment);

// Delete post (staff only - own posts and graduate posts)
router.delete("/:postId", authMiddleware.protect, postController.deletePost);

module.exports = router;
