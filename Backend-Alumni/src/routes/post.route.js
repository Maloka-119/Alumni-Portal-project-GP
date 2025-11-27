const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const postController = require("../controllers/post.controller");

// إعداد التخزين على Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "posts",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage: storage });

// ==================== PUBLIC ROUTES ====================
router.get("/categories", postController.getCategories);
router.get("/landing", postController.getLandingPosts);
router.get("/comments/:commentId/replies", postController.getCommentReplies);

// ==================== AUTHENTICATED USERS ROUTES ====================
router.get(
  "/user-posts",
  authMiddleware.protect,
  postController.getAllPostsOfUsers
);
router.get("/my-posts", authMiddleware.protect, postController.getMyPosts);
router.get(
  "/my-graduate-posts",
  authMiddleware.protect,
  postController.getGraduatePosts
);
router.post("/:postId/like", authMiddleware.protect, postController.likePost);
router.delete(
  "/:postId/like",
  authMiddleware.protect,
  postController.unlikePost
);
router.post(
  "/:postId/comments",
  authMiddleware.protect,
  postController.addComment
);

// ==================== ADMIN & STAFF ONLY ROUTES ====================
// ⬇️⬇️⬇️ الـ routes المحددة لازم تكون قبل الـ dynamic routes ⬇️⬇️⬇️
router.get(
  "/admin",
  authMiddleware.protect,
  (req, res, next) => {
    if (
      req.user &&
      (req.user["user-type"] === "admin" ||
        req.user["user-type"] === "staff" ||
        req.user["user-type"] === "graduate")
    ) {
      next();
    } else {
      return res.status(403).json({ message: "Access denied." });
    }
  },
  postController.getAdminPosts
);

router.get(
  "/",
  authMiddleware.protect,
  (req, res, next) => {
    if (
      req.user &&
      (req.user["user-type"] === "admin" || req.user["user-type"] === "staff")
    ) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Admins or staff only." });
    }
  },
  postController.getAllPosts
);

router.post(
  "/create-post",
  authMiddleware.protect,
  (req, res, next) => {
    if (
      req.user &&
      (req.user["user-type"] === "admin" ||
        req.user["user-type"] === "staff" ||
        req.user["user-type"] === "graduate") // ⭐ أضف هذا السطر
    ) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Admins, staff or graduates only." });
    }
  },
  upload.array("images", 5),
  postController.createPost
);

router.get(
  "/group/:groupId",
  authMiddleware.protect,
  (req, res, next) => {
    if (
      req.user &&
      (req.user["user-type"] === "admin" || req.user["user-type"] === "staff")
    ) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Admins or staff only." });
    }
  },
  postController.getGroupPosts
);

// ==================== DYNAMIC ROUTES (تأتي في النهاية) ====================
// ⬇️⬇️⬇️ الـ dynamic routes لازم تكون في الآخر ⬇️⬇️⬇️
router.get("/:postId", postController.getPostWithDetails);

// ==================== ROUTES المعدلة ====================
router.patch(
  "/:postId/landing",
  authMiddleware.protect,
  postController.toggleLandingStatus
);
router.put(
  "/:postId/edit",
  authMiddleware.protect,
  upload.array("images", 5),
  postController.editPost
);
router.delete("/:postId", authMiddleware.protect, postController.deletePost);
// ==================== نهاية الـ ROUTES المعدلة ====================

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

// ==================== COMMENT ROUTES ====================
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
router.post(
  "/comments/:commentId/reply",
  authMiddleware.protect,
  postController.addReply
);
router.put(
  "/comments/:commentId/reply",
  authMiddleware.protect,
  postController.editReply
);
router.delete(
  "/comments/:commentId/reply",
  authMiddleware.protect,
  postController.deleteReply
);

module.exports = router;
