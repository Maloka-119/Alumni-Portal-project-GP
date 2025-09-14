const express = require("express");
const router = express.Router();
const graduateController = require("../controllers/graduates.controller");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadProfile");

router
  .route("/profile")
  .put(
    authMiddleware,
    upload.single("profilePicture"),
    graduateController.updateProfile
  );

router.route("/:id/profile").get(graduateController.getGraduateProfile);

router
  .route("/digital-id")
  .get(authMiddleware, graduateController.getDigitalID);

router.route("/:id/status").put(graduateController.updateGraduateStatus);

module.exports = router;
