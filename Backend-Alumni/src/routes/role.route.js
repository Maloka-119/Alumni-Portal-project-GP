// src/routes/role.route.js
const express = require("express");
const router = express.Router();
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("../config/cloudinary"); // م
const authMiddleware = require("../middleware/authMiddleware");
const roleController = require("../controllers/role.controller");
// 🟢 إنشاء رول جديدة
router.post(
  "/create",
  authMiddleware.protect,
  roleController.createRoleWithPermissions
);

// 🟢 عرض كل الرولز مع البرميشنز
router.get(
  "/",
  authMiddleware.protect,
  roleController.getAllRolesWithPermissions
);
router.post(
  "/assign-role",
  authMiddleware.protect,
  roleController.assignRoleToStaff
);

module.exports = router;
