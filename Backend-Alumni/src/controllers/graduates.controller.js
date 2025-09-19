const Graduate = require("../models/Graduate");
const User = require("../models/User");
const HttpStatusHelper = require("../utils/HttpStatuHelper");

const getAllGraduates = async (req, res) => {
  try {
    const graduates = await Graduate.findAll({
      include: {
        model: User,
        attributes: [
          "id",
          "first-name",
          "last-name",
          "national-id",
          "email",
          "phone-number",
          "birth-date",
          "user-type",
        ],
      },
    });

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "All graduates fetched successfully",
      data: graduates,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status:HttpStatusHelper.ERROR,
      message: "Error fetching graduates",
      data: [],
    });
  }
};


//get digital id 
const getDigitalID = async (req, res) => {
  try {
    // تأكد إن req.user موجود
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: HttpStatusHelper.FAIL,
        message: "Not authorized or user not found",
        data: null,
      });
    }

    const userId = req.user.id;

    // جلب بيانات الـ Graduate مع الـ User المرتبط
    const graduate = await Graduate.findOne({
      where: { graduate_id: userId },
      include: [{ model: require("../models/User") }],
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    const user = graduate.User;

    if (!user) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "User details not found for this graduate",
        data: null,
      });
    }

    //  تجهيز البيانات النهائية للـ Digital ID
    const digitalID = {
      personalPicture: graduate["profile-picture-url"] || null,
      digitalID: graduate.graduate_id,
      fullName: `${user["first-name"] || ""} ${user["last-name"] || ""}`.trim(),
      faculty: graduate.faculty || null,
      nationalNumber: user["national-id"] || null,
      graduationYear: graduate["graduation-year"] || null,
    };

    //  إرجاع الاستجابة
    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate Digital ID fetched successfully",
      data: digitalID,
    });

  } catch (err) {
    console.error("getDigitalID error:", err.message);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null,
    });
  }
};

module.exports = { getDigitalID };



const getGraduateProfile = async (req, res) => {
  try {
    const graduate = await Graduate.findByPk(req.params.id, {
      include: [{ model: User }],
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    const user = graduate.User;

    const graduatePfrofile = {
      profilePicture: graduate["profile-picture-url"],
      fullName: `${user["first-name"]} ${user["last-name"]}`,
      faculty: graduate.faculty,
      graduationYear: graduate["graduation-year"],
      bio: graduate.bio,
      CV: graduate["cv-url"],
      skills: graduate.skills,
      currentJob: graduate["current-job"],
      linkedlnLink: graduate["linkedln-link"],
    };

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate Profile fetched successfully",
      data: graduatePfrofile,
    });
  } catch (err) {
    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null,
    });
  }
};




//updateProfile
const updateProfile = async (req, res) => {
  try {
    console.log("req.user:", req.user);
    console.log("req.user.id:", req.user?.id);

    const graduate = await Graduate.findByPk(req.user.id, {
      include: [{ model: User }],
    });

    if (!graduate) {
      console.log("Graduate not found for user id:", req.user.id);

      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    const user = graduate.User;
    const {
      firstName,
      lastName,
      bio,
      skills,
      currentJob,
      cvUrl,
      faculty,
      graduationYear,
      linkedlnLink,
    } = req.body;

    if (firstName !== undefined) user["first-name"] = firstName;
    if (lastName !== undefined) user["last-name"] = lastName;
    if (bio !== undefined) graduate.bio = bio;
    if (skills !== undefined) graduate.skills = skills;
    if (currentJob !== undefined) graduate["current-job"] = currentJob;
    if (cvUrl !== undefined) graduate["cv-url"] = cvUrl;
    if (faculty !== undefined) graduate.faculty = faculty;
    if (graduationYear !== undefined)
      graduate["graduation-year"] = graduationYear;
    if (linkedlnLink !== undefined) graduate["linkedln-link"] = linkedlnLink;

    // لو فيه صورة مرفوعة
  // رفع الملفات
if (req.files && req.files.profilePicture) {
  const result = await cloudinary.uploader.upload(
    req.files.profilePicture[0].path,
    { folder: "graduates/profile_pictures" }
  );
  graduate["profile-picture-url"] = result.secure_url;
}

if (req.files && req.files.cv) {
  const result = await cloudinary.uploader.upload(
    req.files.cv[0].path,
    { folder: "graduates/cvs", resource_type: "raw" }
  );
  graduate["cv-url"] = result.secure_url;
}


    // لو فيه CV مرفوع
    if (req.files && req.files.cv) {
      const result = await cloudinary.uploader.upload(
        req.files.cv[0].path,
        { folder: "graduates/cvs", resource_type: "raw" } // raw عشان PDF أو DOC
      );
      graduate["cv-url"] = result.secure_url;
    }
    await user.save();
    await graduate.save();

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate profile updated successfully",
      data: { graduate, user },
    });
  } catch (err) {
    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null,
    });
  }
};




// Activate / Inactivate Graduate
const updateGraduateStatus = async (req, res) => {
  try {
    const { id } = req.params; // graduate_id
    const { status } = req.body; // "active" or "inactive"

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        status: HttpStatusHelper.FAIL,
        message: "Invalid status value. Use 'active' or 'inactive'.",
        data: null,
      });
    }

    const graduate = await Graduate.findByPk(id, { include: [User] });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    graduate.status = status;
    await graduate.save();

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: `Graduate status updated to ${status} successfully`,
      data: {
        graduateId: graduate.graduate_id,
        fullName: `${graduate.User["first-name"]} ${graduate.User["last-name"]}`,
        status: graduate.status,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: err.message,
      data: null,
    });
  }
};
 

module.exports = {
  getDigitalID,
  getGraduateProfile,
  updateProfile,
  updateGraduateStatus,
  getAllGraduates
};
