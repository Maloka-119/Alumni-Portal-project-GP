const express = require("express");
const router = express.Router();
const graduateController = require("../controllers/graduates.controller");
const { protect } = require("../middleware/authMiddleware");
const { uploadFiles } = require("../middleware/uploadProfile");

// Get all graduates (public)
router.route("/").get(graduateController.getAllGraduates);

// Update graduate profile (protected)
router.put("/profile", protect, uploadFiles, graduateController.updateProfile);

// GET CV
router.get("/:id/cv", graduateController.downloadCv);

// Routes للـ admin و staff فقط
router.put(
  "/approve/:id",
  protect,
  (req, res, next) => {
    if (
      req.user &&
      (req.user["user-type"] === "admin" || req.user["user-type"] === "staff")
    ) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Admins or staff only." });
    }
  },
  graduateController.approveGraduate
);

router.put(
  "/reject/:id",
  protect,
  (req, res, next) => {
    if (
      req.user &&
      (req.user["user-type"] === "admin" || req.user["user-type"] === "staff")
    ) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Admins or staff only." });
    }
  },
  graduateController.rejectGraduate
);

router.route("/approved").get(
  protect,
  (req, res, next) => {
    if (
      req.user &&
      (req.user["user-type"] === "admin" || req.user["user-type"] === "staff")
    ) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Admins or staff only." });
    }
  },
  graduateController.getGraduatesInPortal
);

router.route("/requested").get(
  protect,
  (req, res, next) => {
    if (
      req.user &&
      (req.user["user-type"] === "admin" || req.user["user-type"] === "staff")
    ) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Admins or staff only." });
    }
  },
  graduateController.getRequestedGraduates
);

// Get graduate profile by ID (public)
router.route("/:id/profile").get(graduateController.getGraduateProfile);

// Get digital ID (protected)
router.route("/digital-id").get(protect, graduateController.getDigitalID);

// Update graduate status by ID (لـ admin و staff فقط)
router.route("/:id/status").put(
  protect,
  (req, res, next) => {
    if (
      req.user &&
      (req.user["user-type"] === "admin" || req.user["user-type"] === "staff")
    ) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Admins or staff only." });
    }
  },
  graduateController.updateGraduateStatus
);

router.get("/search", graduateController.searchGraduates);
router.get(
  "/profile/:identifier",
  protect,
  graduateController.getGraduateProfileForUser
);

module.exports = router;
