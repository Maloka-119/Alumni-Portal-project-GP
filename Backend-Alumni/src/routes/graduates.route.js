const express = require("express");
const router = express.Router();
const graduateController = require("../controllers/graduates.controller");

// Digital ID
router.get("/:id/digital-id", graduateController.getDigitalID);

// Graduate Profile
router.get("/:id/profile", graduateController.getGraduateProfile);

module.exports = router;
