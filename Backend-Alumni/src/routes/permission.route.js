const express = require("express");
const router = express.Router();
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("../config/cloudinary"); // م
const authMiddleware = require("../middleware/authMiddleware");
const permissionController = require("../controllers/permission.controller");


router.get("/", permissionController.getAllPermissions);

module.exports = router;
