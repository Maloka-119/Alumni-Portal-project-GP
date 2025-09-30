// src/routes/staff.route.js
const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staff.Controller");
const authMiddleware = require("../middleware/authMiddleware");

// GET /alumni-portal/staff/profile (staff can access their own profile)
router.get("/profile", authMiddleware.protect, staffController.getStaffProfile);

// PUT /alumni-portal/staff/:id/status
router.put("/:id/status", staffController.updateStaffStatus);

router.route("/")
      .get(staffController.getAllStaff)
module.exports = router;
