
const express = require("express");
const router = express.Router();
const googleAuthController = require("../controllers/googleAuth.controller");


router.get("/", googleAuthController.loginWithGoogle);


router.get("/callback", googleAuthController.googleCallback);


router.get("/failed", googleAuthController.loginFailed);


router.get("/logout", googleAuthController.logout);

module.exports = router;