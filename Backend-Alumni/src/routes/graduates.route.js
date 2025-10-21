const express = require("express");
const router = express.Router();
const graduateController = require("../controllers/graduates.controller");
const { protect } = require("../middleware/authMiddleware");
const { uploadFiles } = require("../middleware/uploadProfile");
// Get all graduates (public)
router.route("/").get(graduateController.getAllGraduates);

// Update graduate profile (protected)
router.put(
  "/profile",
  protect,
  uploadFiles, 
  graduateController.updateProfile
);

// admin يوافق على خريج
router.put("/approve/:id", protect, graduateController.approveGraduate);

//get active graduates(GradutesInPortal)
router.route("/approved").get(protect,graduateController.getGraduatesInPortal);
//get inactive(that requet join to portal "Pending")
router.route("/requested").get(protect,graduateController.getRequestedGraduates);
// Get graduate profile by ID (public)
router.route("/:id/profile").get(graduateController.getGraduateProfile);

// Get digital ID (protected)
router.route("/digital-id").get(protect, graduateController.getDigitalID);

// Update graduate status by ID (protected - ممكن تخليها admin only لو لزم)
router
  .route("/:id/status")
  .put(protect, graduateController.updateGraduateStatus);
router.get("/search", graduateController.searchGraduates);

module.exports = router;
