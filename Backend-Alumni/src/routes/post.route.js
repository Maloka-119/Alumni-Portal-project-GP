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
  authMiddleware,
  upload.array("images", 5), // images = اسم الحقل من الـ frontend
  postController.createPost
);

// router.get("/", postController.getAllPosts);

// router.post(
//   "/",
//   authMiddleware,
//   upload.array("images", 5), // images هو اسم الحقل اللي هتبعته من الـ frontend
//   postController.createPost
// );
router.get("/", postController.getMyPosts);

module.exports = router;
