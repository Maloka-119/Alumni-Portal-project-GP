// routes/groupRoutes.js
const express = require("express");
const router = express.Router();
const groupController = require("../controllers/group.controller");
const authMiddleware = require("../middleware/authMiddleware"); // middleware للتحقق من التوكن

router.post("/groups", authMiddleware.protect, groupController.createGroup);
router.get("/groups", authMiddleware.protect, groupController.getGroups);

module.exports = router;
