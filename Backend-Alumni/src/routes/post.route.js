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

// جلب كل البوستات
router.get("/", authMiddleware.protect, postController.getAllPosts);

// جلب كل البوستات الخاصة بالمستخدمين (موجودة في الكود الأول)
router.get("/user-posts", postController.getAllPostsOfUsers);

// جلب تصنيفات البوستات
router.get("/categories", postController.getCategories);

router.get("/admin", postController.getAdminPosts);

// جلب بوستات الخريجين (موجودة في الكود الأول)

router.get(
  "/my-graduate-posts",
  authMiddleware.protect,
  postController.getGraduatePosts
);

// تعديل بوست
router.put(
  "/:postId/edit",
  authMiddleware.protect,
  upload.array("images", 5),
  postController.editPost
);

//get posts in specific group
router.get("/:groupId", authMiddleware.protect, postController.getGroupPosts);

// جلب تفاصيل بوست مع التعليقات واللايكات
router.get("/:postId", postController.getPostWithDetails);

// لايك / إلغاء لايك على بوست
router.post("/:postId/like", authMiddleware.protect, postController.likePost);
router.delete(
  "/:postId/like",
  authMiddleware.protect,
  postController.unlikePost
);

// إضافة تعليق على بوست)
router.post(
  "/:postId/comments",
  authMiddleware.protect,
  postController.addComment
);

// تعديل / حذف تعليق
router.put(
  "/comments/:commentId",
  authMiddleware.protect,
  postController.editComment
);
router.delete(
  "/comments/:commentId",
  authMiddleware.protect,
  postController.deleteComment
);

// حذف بوست
router.delete("/:postId", authMiddleware.protect, postController.deletePost);

router.put(
  "/:postId/hide",
  authMiddleware.protect,
  postController.hideNegativePost
);
router.put(
  "/:postId/unhide",
  authMiddleware.protect,
  postController.unhidePost
);

module.exports = router;
