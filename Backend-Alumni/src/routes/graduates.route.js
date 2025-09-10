const express = require("express");
const router = express.Router();
const graduateController = require("../controllers/graduates.controller");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");

// إعداد S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// إعداد Multer للرفع على S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    key: (req, file, cb) => {
      cb(null, `profile-pictures/${Date.now()}-${file.originalname}`);
    }
  })
});

router.route("/profile")
  .put(authMiddleware, upload.single("profilePicture"), graduateController.updateProfile);

router.route("/:id/profile")
  .get(graduateController.getGraduateProfile);

router.route("/digital-id")
   .get(authMiddleware, graduateController.getDigitalID);
module.exports = router;
