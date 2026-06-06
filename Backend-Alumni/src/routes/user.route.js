const express = require("express");
const router = express.Router(); 
const userController = require("../controllers/user.controller");

// // // GET all users (graduates + staff)
// // router.get("/", userController.getAllUsers);
router.get("/search", userController.searchUsers);
router.post("/add-to-group", userController.addUsersToGroup);

module.exports = router;
