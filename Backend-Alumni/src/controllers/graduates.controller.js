const Graduate = require("../models/Graduate");
const User = require("../models/User");
const HttpStatusHelper = require("../utils/HttpStatuHelper");

//get all graduates
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
      status: HttpStatusHelper.ERROR,
      message: "Error fetching graduates",
      data: [],
    });
  }
};

// Get active graduates (GraduatesInPortal) - Admin only
const getGraduatesInPortal = async (req, res) => {
  try {
    // التحقق إن المستخدم Admin
    if (req.user["user-type"] !== "admin") {
      return res.status(403).json({
        status: HttpStatusHelper.ERROR,
        message: "Access denied. Admins only.",
        data: [],
      });
    }

    const graduates = await Graduate.findAll({
      where: { "status-to-login": "active" },
      include: {
        model: User,
        attributes: [
          "id",
          ["first-name", "firstName"],
          ["last-name", "lastName"],
          ["national-id", "nationalId"],
          "email",
          ["phone-number", "phoneNumber"],
          ["birth-date", "birthDate"],
          ["user-type", "userType"],
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
      status: HttpStatusHelper.ERROR,
      message: "Error fetching graduates",
      data: [],
    });
  }
};

// Get inactive graduates (requested to join) - Admin only
const getRequestedGraduates = async (req, res) => {
  try {
    // التحقق إن المستخدم Admin
    if (req.user["user-type"] !== "admin") {
      return res.status(403).json({
        status: HttpStatusHelper.ERROR,
        message: "Access denied. Admins only.",
        data: [],
      });
    }

    const graduates = await Graduate.findAll({
      where: { "status-to-login": "inactive" },
      include: {
        model: User,
        attributes: [
          "id",
          ["first-name", "firstName"],
          ["last-name", "lastName"],
          ["national-id", "nationalId"],
          "email",
          ["phone-number", "phoneNumber"],
          ["birth-date", "birthDate"],
          ["user-type", "userType"],
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
      status: HttpStatusHelper.ERROR,
      message: "Error fetching graduates",
      data: [],
    });
  }
};

//reject graduate by admin
const rejectGraduate = async (req, res) => {
  try {
    // تأكيد إن المستخدم Admin
    if (req.user['user-type'] !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin only",
      });
    }

    const graduateId = req.params.id;

    // جلب الخريج من قاعدة البيانات
    const graduate = await Graduate.findByPk(graduateId);

    if (!graduate) {
      return res.status(404).json({
        status: "error",
        message: "Graduate not found",
      });
    }

    // تحديث الحالة إلى "rejected"
    graduate["status-to-login"] = "rejected"; 
    await graduate.save();

    return res.status(200).json({
      status: "success",
      message: "Graduate request rejected successfully",
      data: graduate,
    });
  } catch (error) {
    console.error(" Error rejecting graduate:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to reject graduate request",
      error: error.message,
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

//Approve Graduate by admin
const approveGraduate = async (req, res) => {
  try {
    const { id } = req.params; // graduate_id

    // تأكيد إن اللي بينفذ هو admin
    if (!req.user || req.user["user-type"] !== "admin") {
      return res.status(403).json({
        message: "Access denied: Only admin can approve graduates.",
      });
    }

    // نبحث عن الخريج
    const graduate = await Graduate.findOne({ where: { graduate_id: id } });

    if (!graduate) {
      return res.status(404).json({ message: "Graduate not found." });
    }

    // تحديث الحالة
    graduate["status-to-login"] = "active";
    await graduate.save();

    return res.status(200).json({
      message: "Graduate approved successfully.",
      graduateId: id,
      newStatus: graduate["status-to-login"],
    });
  } catch (error) {
    console.error("Error approving graduate:", error.message);
    return res.status(500).json({
      message: "Server error while approving graduate.",
      error: error.message,
    });
  }
};



// GET Graduate Profile
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

    // 🔹 هل اللي طالب البروفايل هو نفسه صاحبه؟
    const isOwner = req.user && req.user.id === graduate.graduate_id;

    // 🔹 بناء بيانات البروفايل
    const graduateProfile = {
      profilePicture: graduate["profile-picture-url"],
      fullName: `${user["first-name"]} ${user["last-name"]}`,
      faculty: graduate.faculty,
      graduationYear: graduate["graduation-year"],
      bio: graduate.bio,
      skills: graduate.skills,
      currentJob: graduate["current-job"],

      // 🔹 إعدادات الخصوصية لازم ترجع دايمًا
      showCV: graduate.show_cv,
      showLinkedIn: graduate.show_linkedin,
      showPhone: user.show_phone,
    };

    // 🔹 نضيف الـ CV لو المالك أو الخصوصية مفعلة
    if (isOwner || graduate.show_cv === true) {
      graduateProfile.CV = graduate["cv-url"];
    }

    // 🔹 نضيف اللينكدإن لو المالك أو الخصوصية مفعلة
    if (isOwner || graduate.show_linkedin === true) {
      graduateProfile.linkedlnLink = graduate["linkedln-link"];
    }

    // 🔹 نضيف رقم التليفون لو المالك أو الخصوصية مفعلة
    if (isOwner || user.show_phone === true) {
      graduateProfile.phoneNumber = user.phoneNumber;
    }

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate Profile fetched successfully",
      data: graduateProfile,
    });
  } catch (err) {
    console.error("Error in getGraduateProfile:", err);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const graduate = await Graduate.findByPk(req.user.id, {
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

    // 🔹 تحديث بيانات User
    const userFields = ["firstName", "lastName", "phoneNumber"];
    userFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "firstName") user["first-name"] = req.body[field];
        else if (field === "lastName") user["last-name"] = req.body[field];
        else if (field === "phoneNumber") user.phoneNumber = req.body[field];
      }
    });

    // 🔹 تحديث بيانات Graduate
    const graduateFields = [
      { bodyKey: "bio", dbKey: "bio" },
      { bodyKey: "skills", dbKey: "skills" },
      { bodyKey: "currentJob", dbKey: "current-job" },
      { bodyKey: "faculty", dbKey: "faculty" },
      { bodyKey: "graduationYear", dbKey: "graduation-year" },
      { bodyKey: "linkedlnLink", dbKey: "linkedln-link" },
    ];

    graduateFields.forEach(({ bodyKey, dbKey }) => {
      if (req.body[bodyKey] !== undefined) {
        graduate[dbKey] = req.body[bodyKey];
      }
    });

    // 🔹 تحديث إعدادات الخصوصية الجديدة
    if (req.body.showCV !== undefined) graduate.show_cv = req.body.showCV;
    if (req.body.showLinkedIn !== undefined)
      graduate.show_linkedin = req.body.showLinkedIn;
    if (req.body.showPhone !== undefined) user.show_phone = req.body.showPhone;

    // 🔹 رفع صورة البروفايل
    if (req.files?.profilePicture?.[0]) {
      const profilePic = req.files.profilePicture[0];
      graduate["profile-picture-url"] = profilePic.path || profilePic.url;
    }

    // 🔹 رفع CV
    if (req.files?.cv?.[0]) {
      const cvFile = req.files.cv[0];
      graduate["cv-url"] = cvFile.path || cvFile.url;
    }

    await user.save();
    await graduate.save();

    // ✅ صاحب البروفايل يشوف كل حاجة دايمًا
    const isOwner = true;

    // 🔹 نفس شكل الداتا اللي بترجع من getGraduateProfile
    const graduateProfile = {
      profilePicture: graduate["profile-picture-url"],
      fullName: `${user["first-name"]} ${user["last-name"]}`,
      faculty: graduate.faculty,
      graduationYear: graduate["graduation-year"],
      bio: graduate.bio,
      skills: graduate.skills,
      currentJob: graduate["current-job"],

      // 🔹 إعدادات الخصوصية
      showCV: graduate.show_cv,
      showLinkedIn: graduate.show_linkedin,
      showPhone: user.show_phone,

      // 🔹 البيانات اللي ممكن تبان حسب الخصوصية (بس هنا المالك يشوف الكل)
      CV: graduate["cv-url"],
      linkedlnLink: graduate["linkedln-link"],
      phoneNumber: user.phoneNumber,
    };

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate profile updated successfully",
      data: graduateProfile,
    });
  } catch (err) {
    console.error("Error in updateProfile:", err);
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

const searchGraduates = async (req, res) => {
  try {
    const { faculty, "graduation-year": graduationYear } = req.query;

    const whereClause = {};
    if (faculty) whereClause.faculty = faculty;
    if (graduationYear) whereClause["graduation-year"] = graduationYear; // 👈 لازم بنفس الاسم اللي في المودل

    const graduates = await Graduate.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
    });

    res.json({
      status: "success",
      data: graduates,
    });
  } catch (error) {
    console.error("Error searching graduates:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to search graduates",
      error: error.message,
    });
  }
};

module.exports = {
  getAllGraduates,
  getGraduatesInPortal,
  getRequestedGraduates,
  getDigitalID,
  getGraduateProfile,
  updateProfile,
  updateGraduateStatus,
  searchGraduates,
  approveGraduate,
  rejectGraduate
};
