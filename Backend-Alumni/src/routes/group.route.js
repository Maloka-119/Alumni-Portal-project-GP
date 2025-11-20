// routes/groupRoutes.js
const express = require("express");
const router = express.Router();
const groupController = require("../controllers/group.controller");
const authMiddleware = require("../middleware/authMiddleware");
const uploadGroup = require("../middleware/uploadGroup");

// Routes للجميع (مع authentication)
router.get(
  "/groups",
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
  groupController.getGroups
);

router.get(
  "/:groupId/users",
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
  groupController.getGroupUsers
);

router.post("/groups/join", authMiddleware.protect, groupController.joinGroup);
router.delete(
  "/groups/leave/:groupId",
  authMiddleware.protect,
  groupController.leaveGroup
);
router.get(
  "/groups/my-groups",
  authMiddleware.protect,
  groupController.getMyGroups
);

// Routes للـ admin و staff فقط
router.get(
  "/groups/:groupId/available-graduates",
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
  groupController.getGraduatesForGroup
);

router.post(
  "/groups",
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
  uploadGroup.single("groupImage"),
  groupController.createGroup
);

router.put(
  "/groups/:groupId",
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
  uploadGroup.single("groupImage"),
  groupController.editGroup
);

router.delete(
  "/groups/:groupId",
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
  groupController.deleteGroup
);

router.get(
  "/groups/:groupId/members/count",
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
  groupController.getGroupMembersCount
);

module.exports = router;
