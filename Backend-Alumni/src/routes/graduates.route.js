const express = require("express");
const router = express.Router();
const graduateController = require("../controllers/graduates.controller");
const authMiddleware = require("../middleware/authMiddleware");
router.route("/:id/profile")
  .get(graduateController.getGraduateProfile);

router.route("/profile")
  .put(authMiddleware, graduateController.updateProfile);

router.route("/digital-id")
   .get(authMiddleware, graduateController.getDigitalID);
module.exports = router;
