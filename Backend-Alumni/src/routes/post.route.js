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
router.get("/user-posts", postController.getAllPostsOfUsers);
router.get("/categories", postController.getCategories);
router.get("/admin", authMiddleware.protect, postController.getAdminPosts);
// route جديد مخصوص للفانكشن الجديدة
router.get(
  "/my-graduate-posts",
  authMiddleware.protect,
  postController.getGraduatePosts
);

module.exports = router;
