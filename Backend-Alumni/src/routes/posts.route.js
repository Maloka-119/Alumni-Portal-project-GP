const express=require('express');
const router=express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const postController = require("../controllers/postController");

router.post("/", authMiddleware, postController.createPost);