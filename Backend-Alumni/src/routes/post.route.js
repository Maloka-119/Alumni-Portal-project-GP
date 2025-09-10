const express = require("express");
const router = express.Router();
// const authMiddleware = require("../middlewares/authMiddleware");
const postController = require("../controllers/post.controller");

// const multer = require('multer');
// const multerS3 = require('multer-s3');
// const s3 = require('../config/s3'); // ملف إعدادات AWS S3
// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_BUCKET_NAME,
//     acl: 'public-read',
//     key: (req, file, cb) => {
//       cb(null, Date.now().toString() + '-' + file.originalname);
//     }
//   })
// });

// router.post(
//   "/",
//   authMiddleware,
//   upload.array("images", 5), // images هو اسم الحقل اللي هتبعته من الـ frontend
//   postController.createPost
// );
router.get("/", postController.getAllPosts);

module.exports = router;
