// src/routes/staff.route.js
const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staff.Controller");

// PUT /alumni-portal/staff/:id/status
router.put("/:id/status", staffController.updateStaffStatus);

module.exports = router;
