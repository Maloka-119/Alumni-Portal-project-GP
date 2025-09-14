const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profiles", 
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const uploadProfile = multer({ storage: storage });

module.exports = uploadProfile;
