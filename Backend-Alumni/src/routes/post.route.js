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
// ⬇️⬇️⬇️ الـ routes المحددة لازم تكون قبل الـ dynamic routes ⬇️⬇️⬇️
router.post(
  "/create-post",
  authMiddleware.protect,
  upload.array("images", 5),
  postController.createPost
);

router.get(
  "/user-posts", // ⬅️ دي لازم تكون قبل "/:postId"
  authMiddleware.protect,
  postController.getAllPostsOfUsers
);

router.get("/my-posts", authMiddleware.protect, postController.getMyPosts);

router.get(
  "/my-graduate-posts",
  authMiddleware.protect,
  postController.getGraduatePosts
);

router.get(
  "/group/:groupId",
  authMiddleware.protect,
  postController.getGroupPosts
);

// ==================== ADMIN & STAFF ONLY ROUTES ====================
router.get("/", authMiddleware.protect, postController.getAllPosts);
router.get("/admin", authMiddleware.protect, postController.getAdminPosts);

// ==================== DYNAMIC ROUTES (تأتي في النهاية) ====================
// ⬇️⬇️⬇️ الـ dynamic routes لازم تكون في الآخر ⬇️⬇️⬇️
router.get("/:postId", postController.getPostWithDetails);

router.put(
  "/:postId/edit",
  authMiddleware.protect,
  upload.array("images", 5),
  postController.editPost
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

router.patch(
  "/:postId/landing",
  authMiddleware.protect,
  postController.toggleLandingStatus
);

router.delete("/:postId", authMiddleware.protect, postController.deletePost);

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
