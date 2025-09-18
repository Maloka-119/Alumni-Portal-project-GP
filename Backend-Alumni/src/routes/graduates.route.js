const express = require("express");
const router = express.Router();
const graduateController = require("../controllers/graduates.controller");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadProfile");

// Update graduate profile (protected)
router.put(
  "/profile",
  protect,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "cv", maxCount: 1 }
  ]),
  graduateController.updateProfile
);


// Get all graduates (public)
router.route("/").get(graduateController.getAllGraduates);

// Get graduate profile by ID (public)
router.route("/:id/profile").get(graduateController.getGraduateProfile);

// Get digital ID (protected)
router.route("/digital-id").get(protect, graduateController.getDigitalID);

// Update graduate status by ID (protected - ممكن تخليها admin only لو لزم)
router.route("/:id/status").put(protect, graduateController.updateGraduateStatus);


module.exports = router;
