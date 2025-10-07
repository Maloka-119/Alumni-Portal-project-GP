// src/routes/role.route.js
const express = require("express");
const router = express.Router();
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("../config/cloudinary"); // م
const authMiddleware = require("../middleware/authMiddleware");
const roleController = require("../controllers/role.controller");
// 🟢 إنشاء رول جديدة
router.post("/create", roleController.createRole);
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

router.get("/employees-by-role", roleController.viewEmployeesByRole);

router.put(
  "/update/:roleId",
  authMiddleware.protect,
  roleController.updateRole
);

module.exports = router;
