// src/routes/admin.route.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

// GET all users (graduates + staff)
router.get("/users", adminController.getAllUsers);

module.exports = router;
