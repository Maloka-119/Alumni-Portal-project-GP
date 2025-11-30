const Graduate = require("../models/Graduate");
const User = require("../models/User");
const Friendship = require("../models/Friendship");
const Post = require("../models/Post");
const PostImage = require("../models/PostImage");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const GroupMember = require("../models/GroupMember");
const { Op } = require("sequelize");
const HttpStatusHelper = require("../utils/HttpStatuHelper");
const checkStaffPermission = require("../utils/permissionChecker");
const cloudinary = require("../config/cloudinary");
const axios = require("axios");
const { normalizeCollegeName, getCollegeNameByCode } = require("../services/facultiesService");
const { generateQRToken, verifyQRToken } = require("../utils/qrTokenService");
const QRCode = require("qrcode");
const aes =require("../utils/aes");

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
      attributes: { exclude: ["faculty"] },
    });

    const lang = req.headers["accept-language"] || req.user?.language || "ar";

    const graduatesWithFaculty = graduates.map(g => ({
      ...g.toJSON(),
      faculty: getCollegeNameByCode(g.faculty_code, lang)
    }));

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "All graduates fetched successfully",
      data: graduatesWithFaculty,
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

// Get active graduates (GraduatesInPortal) - Admin & Staff only
const getGraduatesInPortal = async (req, res) => {
  try {
    const allowedUserTypes = ["admin", "staff"];
    if (!allowedUserTypes.includes(req.user["user-type"])) {
      return res.status(403).json({
        status: HttpStatusHelper.ERROR,
        message: "Access denied.",
        data: [],
      });
    }

    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Graduate management",
        "view"
      );
      if (!hasPermission) {
        return res.status(403).json({
          status: HttpStatusHelper.ERROR,
          message:
            "Access denied. You don't have permission to view graduates.",
          data: [],
        });
      }
    }

    const lang = req.headers["accept-language"] || req.user.language || "ar";

    const graduates = await Graduate.findAll({
      where: { "status-to-login": "accepted" },
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
      attributes: { exclude: ["faculty"] },
    });

const graduatesWithFaculty = graduates.map(g => {
  const obj = g.toJSON();

// ديكريبشن للـ National ID
  if (obj.User?.nationalId) {
    obj.User.nationalId = aes.decryptNationalId(obj.User.nationalId);
  }

  return {
    ...obj,
    faculty: getCollegeNameByCode(g.faculty_code, lang),
  };
});


    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "All graduates fetched successfully",
      data: graduatesWithFaculty,
    });
  } catch (err) {
    console.error("Error fetching graduates:", err);
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
    const allowedUserTypes = ["admin", "staff"];
    if (!allowedUserTypes.includes(req.user["user-type"])) {
      return res.status(403).json({
        status: HttpStatusHelper.ERROR,
        message: "Access denied.",
        data: [],
      });
    }

    if (req.user["user-type"] === "staff") {
      const hasGraduatePermission = await checkStaffPermission(
        req.user.id,
        "Graduate management",
        "view"
      );

      const hasRequestsPermission = await checkStaffPermission(
        req.user.id,
        "Others Requests management",
        "view"
      );

      if (!hasGraduatePermission && !hasRequestsPermission) {
        return res.status(403).json({
          status: HttpStatusHelper.ERROR,
          message:
            "Access denied. You don't have permission to view requested graduates.",
          data: [],
        });
      }
    }

    const lang = req.headers["accept-language"] || req.user.language || "ar";

    const graduates = await Graduate.findAll({
      where: { "status-to-login": "pending" },
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
      attributes: { exclude: ["faculty"] },
    });

   const graduatesWithFaculty = graduates.map(g => {
  const obj = g.toJSON();

// ديكريبشن للـ National ID
  if (obj.User?.nationalId) {
    obj.User.nationalId = aes.decryptNationalId(obj.User.nationalId);
  }

  return {
    ...obj,
    faculty: getCollegeNameByCode(g.faculty_code, lang),
  };
});

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "All graduates fetched successfully",
      data: graduatesWithFaculty,
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
    const allowedUserTypes = ["admin", "staff"];
    if (!allowedUserTypes.includes(req.user["user-type"])) {
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
      });
    }

    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Others Requests management",
        "edit"
      );

      if (!hasPermission) {
        return res.status(403).json({
          status: "error",
          message:
            "Access denied. You don't have permission to reject graduates.",
        });
      }
    }

    const graduateId = req.params.id;
    const graduate = await Graduate.findByPk(graduateId, {
      attributes: { exclude: ["faculty"] }
    });

    if (!graduate) {
      return res.status(404).json({
        status: "error",
        message: "Graduate not found",
      });
    }

    graduate["status-to-login"] = "rejected";
    await graduate.save();

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

    return res.status(200).json({
      status: "success",
      message: "Graduate request rejected successfully",
      data: {
        ...graduate.toJSON(),
        faculty: facultyName
      },
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
// Helper function to fetch student data from external API and format it
const fetchStudentDataFromExternal = async (nationalId) => {
  try {
    // Check if GRADUATE_API_URL is configured
    if (!process.env.GRADUATE_API_URL) {
      const error = new Error("GRADUATE_API_URL is not configured in environment variables");
      error.code = 'CONFIG_ERROR';
      throw error;
    }

    const response = await axios.get(
      `${process.env.GRADUATE_API_URL}?nationalId=${nationalId}`,
      { 
        timeout: 5000, // 5 seconds timeout
        validateStatus: function (status) {
          return status < 500; // Don't throw error for 4xx status codes
        }
      }
    );

    // Check if response is successful
    if (response.status === 200 && response.data) {
      return { data: response.data, error: null };
    } else if (response.status === 404) {
      const error = new Error(`Student not found in external system for nationalId: ${nationalId}`);
      error.code = 'NOT_FOUND';
      error.status = 404;
      return { data: null, error };
    } else {
      const error = new Error(`External API returned status ${response.status}`);
      error.code = 'API_ERROR';
      error.status = response.status;
      return { data: null, error };
    }
  } catch (error) {
    // More detailed error logging
    let errorMessage = "Failed to fetch student data from external system";
    let errorCode = 'EXTERNAL_API_ERROR';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = "External API is not running. Please start the external API service on port 5001";
      errorCode = 'CONNECTION_REFUSED';
      console.error("❌ External API connection refused. Is it running on port 5001?");
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = "External API request timed out. The service may be slow or unavailable";
      errorCode = 'TIMEOUT';
      console.error("❌ External API request timed out");
    } else if (error.code === 'CONFIG_ERROR') {
      errorMessage = error.message;
      errorCode = 'CONFIG_ERROR';
      console.error("❌ Configuration error:", error.message);
    } else if (error.response) {
      errorMessage = `External API error: ${error.response.status} - ${error.response.statusText}`;
      errorCode = 'API_ERROR';
      console.error(`❌ External API error: ${error.response.status} - ${error.response.statusText}`);
    } else {
      errorMessage = `Error fetching from external API: ${error.message}`;
      console.error("❌ Error fetching from external API:", error.message);
    }
    
    const apiError = new Error(errorMessage);
    apiError.code = errorCode;
    apiError.originalError = error;
    return { data: null, error: apiError };
  }
};

// Helper function to sanitize data - remove all IDs
const sanitizeDigitalIDData = (data) => {
  const sanitized = { ...data };
  // Remove all ID fields
  delete sanitized.nationalId;
  delete sanitized.national_id;
  delete sanitized.graduate_id;
  delete sanitized.graduateId;
  delete sanitized.student_id;
  delete sanitized.studentId;
  delete sanitized.id;
  delete sanitized.digitalID;
  return sanitized;
};

const getDigitalID = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: HttpStatusHelper.FAIL,
        message: "Not authorized or user not found",
        data: null,
      });
    }

    const userId = req.user.id;
    const graduate = await Graduate.findOne({
      where: { graduate_id: userId },
      include: [{ model: require("../models/User") }],
      attributes: { exclude: ["faculty"] }
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

    // Decrypt national ID before using it
    let nationalIdToUse = null;
    if (user["national-id"]) {
      const decrypted = aes.decryptNationalId(user["national-id"]);
      if (decrypted) {
        nationalIdToUse = decrypted;
      } else {
        // If decryption fails, try using the value as-is (might be unencrypted)
        const nationalIdStr = String(user["national-id"]).trim();
        if (/^\d{14}$/.test(nationalIdStr)) {
          nationalIdToUse = nationalIdStr;
        }
      }
    }

    if (!nationalIdToUse) {
      return res.status(400).json({
        status: HttpStatusHelper.ERROR,
        message: "National ID not found or could not be decrypted",
        data: null,
      });
    }

    // Fetch student data from external API (REQUIRED - no fallback to local DB)
    const { data: externalData, error: externalError } = await fetchStudentDataFromExternal(nationalIdToUse);
    
    if (externalError || !externalData) {
      // Return detailed error message
      const statusCode = externalError?.status || 500;
      const errorMessage = externalError?.message || "Failed to fetch student data from external system";
      
      return res.status(statusCode).json({
        status: HttpStatusHelper.ERROR,
        message: errorMessage,
        data: null,
        errorCode: externalError?.code || 'EXTERNAL_API_ERROR',
      });
    }

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    
    // Get faculty name from external data or use local code as fallback for faculty name only
    let facultyName;
    if (externalData.faculty || externalData.Faculty || externalData.FACULTY || externalData.facultyName) {
      facultyName = externalData.faculty || externalData.Faculty || externalData.FACULTY || externalData.facultyName;
    } else {
      facultyName = getCollegeNameByCode(graduate.faculty_code, lang);
    }

    // Get full name from external data if available, otherwise from User model
    let fullName;
    if (externalData.fullName || externalData["full-name"] || (externalData["first-name"] && externalData["last-name"])) {
      fullName = externalData.fullName || externalData["full-name"] || 
                 `${externalData["first-name"] || ""} ${externalData["last-name"] || ""}`.trim();
    } else {
      fullName = `${user["first-name"] || ""} ${user["last-name"] || ""}`.trim();
    }

    // Generate QR code
    const qrToken = generateQRToken(userId);
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5005";
    const verificationUrl = `${backendUrl}/alumni-portal/graduates/digital-id/verify/${qrToken}`;
    
    let qrCodeDataURL;
    try {
      qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        width: 300,
      });
    } catch (qrError) {
      console.error("Error generating QR code:", qrError);
      qrCodeDataURL = null;
    }

    // Decrypt national ID for response
    let decryptedNationalId = nationalIdToUse; // Already decrypted above

    // Build digital ID data - profile image from local DB, rest from external API
    const digitalID = {
      personalPicture: graduate["profile-picture-url"] || null, // From local DB only
      fullName: fullName,
      faculty: facultyName,
      department: externalData.department || externalData.Department || externalData.DEPARTMENT || null,
      graduationYear: externalData["graduation-year"] || externalData.graduationYear || externalData.GraduationYear || null,
      status: externalData.status || externalData.Status || "active",
      // Additional fields (as requested)
      nationalId: decryptedNationalId,
      graduationId: graduate.graduate_id,
      qr: qrCodeDataURL,
      // Add any other fields from external data (excluding IDs)
      ...sanitizeDigitalIDData(externalData),
    };

    // Ensure no duplicate IDs are included (but keep the ones we explicitly added)
    delete digitalID.national_id;
    delete digitalID.graduateId;
    delete digitalID.student_id;
    delete digitalID.studentId;
    delete digitalID.id;
    delete digitalID.digitalID;

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

// Generate QR code for Digital ID
const generateDigitalIDQR = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: HttpStatusHelper.FAIL,
        message: "Not authorized or user not found",
        data: null,
      });
    }

    const userId = req.user.id;
    const graduate = await Graduate.findOne({
      where: { graduate_id: userId },
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    // Generate temporary QR token
    const qrToken = generateQRToken(userId);
    
    // Create verification URL
    // For "Backend Only" implementation, default to backend API endpoint
    // If FRONTEND_URL is set and QR_USE_FRONTEND=true, point to frontend page instead
    const useFrontend = process.env.QR_USE_FRONTEND === "true" && process.env.FRONTEND_URL;
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5005";
    
    let verificationUrl;
    if (useFrontend) {
      // Point to frontend page that will call backend API
      const frontendUrl = process.env.FRONTEND_URL;
      verificationUrl = `${frontendUrl}/digital-id/verify/${qrToken}`;
    } else {
      // Point directly to backend API endpoint (default for Backend Only)
      verificationUrl = `${backendUrl}/alumni-portal/graduates/digital-id/verify/${qrToken}`;
    }

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 1,
      width: 300,
    });

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "QR code generated successfully",
      data: {
        qrCode: qrCodeDataURL,
        verificationUrl: verificationUrl,
        expiresIn: 300, // 5 minutes in seconds
      },
    });
  } catch (err) {
    console.error("generateDigitalIDQR error:", err.message);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: err.message,
      data: null,
    });
  }
};

// Verify QR token and return Digital ID data
const verifyDigitalIDQR = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        status: HttpStatusHelper.FAIL,
        message: "Token is required",
        data: null,
      });
    }

    // Verify token
    const decoded = verifyQRToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        status: HttpStatusHelper.FAIL,
        message: "Invalid or expired token",
        data: null,
      });
    }

    const userId = decoded.userId;

    // Get graduate and user data
    const graduate = await Graduate.findOne({
      where: { graduate_id: userId },
      include: [{ model: require("../models/User") }],
      attributes: { exclude: ["faculty"] }
    });

    if (!graduate || !graduate.User) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    const user = graduate.User;

    // Decrypt national ID before using it
    let nationalIdToUse = null;
    if (user["national-id"]) {
      const decrypted = aes.decryptNationalId(user["national-id"]);
      if (decrypted) {
        nationalIdToUse = decrypted;
      } else {
        // If decryption fails, try using the value as-is (might be unencrypted)
        const nationalIdStr = String(user["national-id"]).trim();
        if (/^\d{14}$/.test(nationalIdStr)) {
          nationalIdToUse = nationalIdStr;
        }
      }
    }

    if (!nationalIdToUse) {
      return res.status(400).json({
        status: HttpStatusHelper.ERROR,
        message: "National ID not found or could not be decrypted",
        data: null,
      });
    }

    // Fetch student data from external API (REQUIRED - no fallback to local DB)
    const { data: externalData, error: externalError } = await fetchStudentDataFromExternal(nationalIdToUse);
    
    if (externalError || !externalData) {
      // Return detailed error message
      const statusCode = externalError?.status || 500;
      const errorMessage = externalError?.message || "Failed to fetch student data from external system";
      
      return res.status(statusCode).json({
        status: HttpStatusHelper.ERROR,
        message: errorMessage,
        data: null,
        errorCode: externalError?.code || 'EXTERNAL_API_ERROR',
      });
    }

    const lang = req.headers["accept-language"] || "ar";
    
    // Get faculty name from external data or use local code as fallback for faculty name only
    let facultyName;
    if (externalData.faculty || externalData.Faculty || externalData.FACULTY || externalData.facultyName) {
      facultyName = externalData.faculty || externalData.Faculty || externalData.FACULTY || externalData.facultyName;
    } else {
      facultyName = getCollegeNameByCode(graduate.faculty_code, lang);
    }

    // Get full name from external data if available, otherwise from User model
    let fullName;
    if (externalData.fullName || externalData["full-name"] || (externalData["first-name"] && externalData["last-name"])) {
      fullName = externalData.fullName || externalData["full-name"] || 
                 `${externalData["first-name"] || ""} ${externalData["last-name"] || ""}`.trim();
    } else {
      fullName = `${user["first-name"] || ""} ${user["last-name"] || ""}`.trim();
    }

    // Generate QR code
    const qrToken = generateQRToken(userId);
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5005";
    const verificationUrl = `${backendUrl}/alumni-portal/graduates/digital-id/verify/${qrToken}`;
    
    let qrCodeDataURL;
    try {
      qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        width: 300,
      });
    } catch (qrError) {
      console.error("Error generating QR code:", qrError);
      qrCodeDataURL = null;
    }

    // Decrypt national ID for response
    let decryptedNationalId = nationalIdToUse; // Already decrypted above

    // Build digital ID data - profile image from local DB, rest from external API
    const digitalID = {
      personalPicture: graduate["profile-picture-url"] || null, // From local DB only
      fullName: fullName,
      faculty: facultyName,
      department: externalData.department || externalData.Department || externalData.DEPARTMENT || null,
      graduationYear: externalData["graduation-year"] || externalData.graduationYear || externalData.GraduationYear || null,
      status: externalData.status || externalData.Status || "active",
      // Additional fields (as requested)
      nationalId: decryptedNationalId,
      graduationId: graduate.graduate_id,
      qr: qrCodeDataURL,
      // Add any other fields from external data (excluding IDs)
      ...sanitizeDigitalIDData(externalData),
    };

    // Ensure no duplicate IDs are included (but keep the ones we explicitly added)
    delete digitalID.national_id;
    delete digitalID.graduateId;
    delete digitalID.student_id;
    delete digitalID.studentId;
    delete digitalID.id;
    delete digitalID.digitalID;

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Digital ID verified successfully",
      data: digitalID,
    });
  } catch (err) {
    console.error("verifyDigitalIDQR error:", err.message);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: err.message,
      data: null,
    });
  }
};

// Approve Graduate by admin
const approveGraduate = async (req, res) => {
  try {
    const { id } = req.params; 
    const { faculty, graduationYear } = req.body;

    const allowedUserTypes = ["admin", "staff"];
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Others Requests management",
        "edit"
      );
      if (!hasPermission) {
        return res.status(403).json({
          message: "Access denied. You don't have permission to approve graduates.",
        });
      }
    }

    if (!faculty || !graduationYear) {
      return res.status(400).json({ message: "Faculty and graduationYear are required." });
    }

    const facultyCode = normalizeCollegeName(faculty);
    if (!facultyCode) {
      return res.status(400).json({ message: "Invalid faculty name." });
    }

    const graduate = await Graduate.findOne({ 
      where: { graduate_id: id },
      attributes: { exclude: ["faculty"] }
    });
    if (!graduate) return res.status(404).json({ message: "Graduate not found." });

    graduate.faculty_code = facultyCode;
    graduate["graduation-year"] = graduationYear;
    graduate["status-to-login"] = "accepted";

    await graduate.save();

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(facultyCode, lang);

    return res.status(200).json({
      message: "Graduate approved successfully.",
      graduateId: id,
      facultyCode: facultyCode,
      facultyName: facultyName
    });
  } catch (error) {
    console.error("Error approving graduate:", error.message);
    return res.status(500).json({
      message: "Server error while approving graduate.",
      error: error.message,
    });
  }
};

// GET Graduate Profile for admin
const getGraduateProfile = async (req, res) => {
  try {
    const graduate = await Graduate.findByPk(req.params.id, {
      include: [{ model: User }],
      attributes: { exclude: ["faculty"] },
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    const user = graduate.User;
    const isOwner = req.user && parseInt(req.user.id) === parseInt(graduate.graduate_id);

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

    const graduateProfile = {
      profilePicture: graduate["profile-picture-url"],
      fullName: `${user["first-name"]} ${user["last-name"]}`,
      faculty: facultyName,
      graduationYear: graduate["graduation-year"],
      bio: graduate.bio,
      skills: graduate.skills,
      currentJob: graduate["current-job"],
      showCV: graduate.show_cv,
      showLinkedIn: graduate.show_linkedin,
      showPhone: user.show_phone,
      CV: graduate["cv-url"],
      linkedlnLink: graduate["linkedln-link"],
      phoneNumber: user.phoneNumber,
    };

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

//update profile
const updateProfile = async (req, res) => {
  try {
    const graduate = await Graduate.findByPk(req.user.id, {
      include: [{ model: User }],
      attributes: { exclude: ["faculty"] },
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    const user = graduate.User;

    // تحديث بيانات User
    const userFields = ["firstName", "lastName", "phoneNumber"];
    userFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "firstName") user["first-name"] = req.body[field];
        else if (field === "lastName") user["last-name"] = req.body[field];
        else if (field === "phoneNumber") user.phoneNumber = req.body[field];
      }
    });

    // تحديث بيانات Graduate مع تحويل اسم الكلية إلى كود
    const graduateFields = [
      { bodyKey: "bio", dbKey: "bio" },
      { bodyKey: "skills", dbKey: "skills" },
      { bodyKey: "currentJob", dbKey: "current-job" },
      { bodyKey: "graduationYear", dbKey: "graduation-year" },
      { bodyKey: "linkedlnLink", dbKey: "linkedln-link" },
    ];

    graduateFields.forEach(({ bodyKey, dbKey }) => {
      if (req.body[bodyKey] !== undefined) {
        graduate[dbKey] = req.body[bodyKey];
      }
    });

    // تحديث faculty_code إذا تم إرسال faculty
    if (req.body.faculty !== undefined) {
      const facultyCode = normalizeCollegeName(req.body.faculty);
      if (facultyCode) {
        graduate.faculty_code = facultyCode;
      }
    }

    // تحديث إعدادات الخصوصية
    if (req.body.showCV !== undefined) graduate.show_cv = req.body.showCV;
    if (req.body.showLinkedIn !== undefined)
      graduate.show_linkedin = req.body.showLinkedIn;
    if (req.body.showPhone !== undefined) user.show_phone = req.body.showPhone;

    // معالجة صورة البروفايل
    if (req.files?.profilePicture?.[0]) {
      const profilePic = req.files.profilePicture[0];
      graduate["profile-picture-url"] = profilePic.path || profilePic.url;
      graduate["profile-picture-public-id"] =
        profilePic.filename || profilePic.public_id;
    }

    if (req.body.removeProfilePicture) {
      if (graduate["profile-picture-public-id"]) {
        try {
          await cloudinary.uploader.destroy(
            graduate["profile-picture-public-id"]
          );
        } catch (err) {
          console.warn("Failed to delete profile picture:", err.message);
        }
      }
      graduate["profile-picture-url"] = null;
      graduate["profile-picture-public-id"] = null;
    }

    // معالجة CV
    if (req.files?.cv?.[0]) {
      const cvFile = req.files.cv[0];
      if (graduate.cv_public_id) {
        try {
          await cloudinary.uploader.destroy(graduate.cv_public_id, {
            resource_type: "raw",
          });
        } catch (deleteErr) {
          console.warn("Failed to delete old CV:", deleteErr.message);
        }
      }

      graduate["cv-url"] = cvFile.path || cvFile.url;
      graduate.cv_public_id = cvFile.filename || cvFile.public_id;
    }

    if (req.body.removeCV) {
      if (graduate.cv_public_id) {
        try {
          await cloudinary.uploader.destroy(graduate.cv_public_id, {
            resource_type: "raw",
          });
        } catch (err) {
          console.warn("Failed to delete CV:", err.message);
        }
      }
      graduate["cv-url"] = null;
      graduate.cv_public_id = null;
    }

    await user.save();
    await graduate.save();

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

    const graduateProfile = {
      profilePicture: graduate["profile-picture-url"],
      fullName: `${user["first-name"]} ${user["last-name"]}`,
      faculty: facultyName,
      graduationYear: graduate["graduation-year"],
      bio: graduate.bio,
      skills: graduate.skills,
      currentJob: graduate["current-job"],
      showCV: graduate.show_cv,
      showLinkedIn: graduate.show_linkedin,
      showPhone: user.show_phone,
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

//download cv
const downloadCv = async (req, res) => {
  try {
    const graduateId = req.params.id;
    const graduate = await Graduate.findByPk(graduateId, {
      attributes: { exclude: ["faculty"] }
    });

    if (!graduate || !graduate["cv-url"]) {
      return res.status(404).json({
        status: "error",
        message: "CV not found",
        data: null,
      });
    }

    const signedUrl = cloudinary.url(graduate.cv_public_id, {
      resource_type: "auto",
      type: "authenticated",
      sign_url: true,
    });

    const response = await axios.get(signedUrl, { responseType: "stream" });
    
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${graduate["cv-url"].split("/").pop()}"`
    );
    res.setHeader("Content-Type", response.headers["content-type"]);

    response.data.pipe(res);
  } catch (err) {
    console.error("Error downloading CV:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      data: null,
    });
  }
};

// Activate / Inactivate Graduate
const updateGraduateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedUserTypes = ["admin", "staff"];
    if (!allowedUserTypes.includes(req.user["user-type"])) {
      return res.status(403).json({
        status: HttpStatusHelper.ERROR,
        message: "Access denied.",
        data: null,
      });
    }

    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Graduate management",
        "edit"
      );

      if (!hasPermission) {
        return res.status(403).json({
          status: HttpStatusHelper.ERROR,
          message:
            "Access denied. You don't have permission to update graduate status.",
          data: null,
        });
      }
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        status: HttpStatusHelper.FAIL,
        message: "Invalid status value. Use 'active' or 'inactive'.",
        data: null,
      });
    }

    const graduate = await Graduate.findByPk(id, { 
      include: [User],
      attributes: { exclude: ["faculty"] }
    });

    if (!graduate) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    graduate.status = status;
    await graduate.save();

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: `Graduate status updated to ${status} successfully`,
      data: {
        graduateId: graduate.graduate_id,
        fullName: `${graduate.User["first-name"]} ${graduate.User["last-name"]}`,
        faculty: facultyName,
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
    
    // البحث باستخدام faculty_code بدلاً من faculty
    if (faculty) {
      const facultyCode = normalizeCollegeName(faculty);
      if (facultyCode) {
        whereClause.faculty_code = facultyCode;
      }
    }
    
    if (graduationYear) whereClause["graduation-year"] = graduationYear;

    const graduates = await Graduate.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email"],
        },
      ],
      attributes: { exclude: ["faculty"] },
    });

    const lang = req.headers["accept-language"] || req.user?.language || "ar";
    
    const graduatesWithFaculty = graduates.map(g => ({
      ...g.toJSON(),
      faculty: getCollegeNameByCode(g.faculty_code, lang)
    }));

    res.json({
      status: "success",
      data: graduatesWithFaculty,
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

// Get public graduate profile (new endpoint)
// Returns: Full name, Faculty, Department, Graduation year, Image
const getPublicGraduateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const graduate = await Graduate.findByPk(id, {
      include: [{ model: User }],
      attributes: { exclude: ["faculty"] },
    });

    if (!graduate || !graduate.User) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    const user = graduate.User;

    // Try to decrypt national ID, if it fails, try using it as-is (might be unencrypted)
    let nationalIdToUse = null;
    if (user["national-id"]) {
      // Try to decrypt first
      const decrypted = aes.decryptNationalId(user["national-id"]);
      if (decrypted) {
        nationalIdToUse = decrypted;
      } else {
        // If decryption fails, try using the value as-is (might be unencrypted)
        // Check if it looks like a valid national ID (14 digits)
        const nationalIdStr = String(user["national-id"]).trim();
        if (/^\d{14}$/.test(nationalIdStr)) {
          nationalIdToUse = nationalIdStr;
        }
      }
    }

    // If still no valid national ID, use local data as fallback
    if (!nationalIdToUse) {
      const lang = req.headers["accept-language"] || "ar";
      const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);
      
      const publicProfile = {
        fullName: `${user["first-name"] || ""} ${user["last-name"] || ""}`.trim(),
        faculty: facultyName,
        department: null, // Not available from local DB
        graduationYear: graduate["graduation-year"] || null,
        image: graduate["profile-picture-url"] || null,
      };

      return res.json({
        status: HttpStatusHelper.SUCCESS,
        message: "Public graduate profile fetched successfully (using local data)",
        data: publicProfile,
      });
    }

    // Fetch student data from external API
    const { data: externalData, error: externalError } = await fetchStudentDataFromExternal(nationalIdToUse);
    
    if (externalError || !externalData) {
      const statusCode = externalError?.status || 500;
      const errorMessage = externalError?.message || "Failed to fetch student data from external system";
      
      return res.status(statusCode).json({
        status: HttpStatusHelper.ERROR,
        message: errorMessage,
        data: null,
        errorCode: externalError?.code || 'EXTERNAL_API_ERROR',
      });
    }

    const lang = req.headers["accept-language"] || "ar";
    
    // Get faculty name from external data
    let facultyName;
    if (externalData.faculty || externalData.Faculty || externalData.FACULTY || externalData.facultyName) {
      facultyName = externalData.faculty || externalData.Faculty || externalData.FACULTY || externalData.facultyName;
    } else {
      facultyName = getCollegeNameByCode(graduate.faculty_code, lang);
    }

    // Get full name from external data if available, otherwise from User model
    let fullName;
    if (externalData.fullName || externalData["full-name"] || (externalData["first-name"] && externalData["last-name"])) {
      fullName = externalData.fullName || externalData["full-name"] || 
                 `${externalData["first-name"] || ""} ${externalData["last-name"] || ""}`.trim();
    } else {
      fullName = `${user["first-name"] || ""} ${user["last-name"] || ""}`.trim();
    }

    // Build public profile data
    const publicProfile = {
      fullName: fullName,
      faculty: facultyName,
      department: externalData.department || externalData.Department || externalData.DEPARTMENT || null,
      graduationYear: externalData["graduation-year"] || externalData.graduationYear || externalData.GraduationYear || null,
      image: graduate["profile-picture-url"] || null, // From portal
    };

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Public graduate profile fetched successfully",
      data: publicProfile,
    });
  } catch (err) {
    console.error("getPublicGraduateProfile error:", err.message);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: err.message,
      data: null,
    });
  }
};

// get graduate profile for user
const getGraduateProfileForUser = async (req, res) => {
  try {
    const { identifier } = req.params;
    const currentUserId = req.user.id;

    let graduate;

    // البحث عن الخريج بالإيدي
    if (!isNaN(identifier)) {
      graduate = await Graduate.findByPk(identifier, {
        include: [{ model: User }],
        attributes: { exclude: ["faculty"] },
      });
    } else {
      // البحث بالإيميل
      const userByEmail = await User.findOne({
        where: { email: identifier },
        include: [{ model: Graduate }],
      });

      if (userByEmail) {
        graduate = userByEmail.Graduate;
      } else {
        // البحث بالاسم
        const usersByName = await User.findAll({
          where: {
            [Op.or]: [
              { "first-name": { [Op.like]: `%${identifier}%` } },
              { "last-name": { [Op.like]: `%${identifier}%` } },
            ],
          },
          include: [{ model: Graduate }],
        });

        for (let user of usersByName) {
          if (user.Graduate) {
            graduate = user.Graduate;
            break;
          }
        }
      }
    }

    if (!graduate || !graduate.User) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Graduate not found",
        data: null,
      });
    }

    // تحديد حالة الصداقة
    let friendshipStatus = "no_relation";

    const existingFriendshipRequest = await Friendship.findOne({
      where: {
        [Op.or]: [
          { sender_id: currentUserId, receiver_id: graduate.graduate_id },
          { sender_id: graduate.graduate_id, receiver_id: currentUserId },
        ],
        status: "pending",
      },
    });

    if (existingFriendshipRequest) {
      friendshipStatus =
        existingFriendshipRequest.sender_id === currentUserId
          ? "i_sent_request"
          : "he_sent_request";
    }

    const friendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { sender_id: currentUserId, receiver_id: graduate.graduate_id },
          { sender_id: graduate.graduate_id, receiver_id: currentUserId },
        ],
        status: "accepted",
      },
    });

    if (friendship) friendshipStatus = "friends";

    // جلب بوستات الخريج
    const posts = await Post.findAll({
      where: {
        "author-id": graduate.graduate_id,
        "is-hidden": false,
        "group-id": null,
      },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "user-type"],
          include: [{ model: Graduate, attributes: ["profile-picture-url"] }],
        },
        { model: PostImage, attributes: ["image-url"] },
        {
          model: Like,
          attributes: ["like_id", "user-id"],
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name", "user-type"],
              include: [
                { model: Graduate, attributes: ["profile-picture-url"] },
              ],
            },
          ],
        },
        {
          model: Comment,
          attributes: ["comment_id", "content", "created-at", "edited"],
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name", "user-type"],
              include: [
                { model: Graduate, attributes: ["profile-picture-url"] },
              ],
            },
          ],
          order: [["created-at", "ASC"]],
        },
      ],
      order: [["created-at", "DESC"]],
    });

    // تجهيز بيانات البوستات
    const postsData = posts.map((post) => {
      const authorUser = post.User;

      return {
        post_id: post.post_id,
        category: post.category,
        content: post.content,
        "created-at": post["created-at"],
        author: {
          id: authorUser?.id || "unknown",
          "full-name": `${authorUser?.["first-name"] || ""} ${
            authorUser?.["last-name"] || ""
          }`.trim(),
          "user-type": authorUser?.["user-type"] || "unknown",
          image: authorUser?.Graduate
            ? authorUser.Graduate["profile-picture-url"]
            : null,
        },
        images: post.PostImages
          ? post.PostImages.map((img) => img["image-url"])
          : [],
        likes: post.Likes
          ? post.Likes.map((like) => ({
              like_id: like.like_id,
              user: like.User
                ? {
                    id: like.User.id,
                    "full-name": `${like.User["first-name"] || ""} ${
                      like.User["last-name"] || ""
                    }`.trim(),
                    "user-type": like.User["user-type"] || "unknown",
                    image: like.User.Graduate
                      ? like.User.Graduate["profile-picture-url"]
                      : null,
                  }
                : null,
            }))
          : [],
        likes_count: post.Likes ? post.Likes.length : 0,
        comments: post.Comments
          ? post.Comments.map((comment) => ({
              comment_id: comment.comment_id,
              content: comment.content,
              "created-at": comment["created-at"],
              edited: comment.edited,
              author: {
                id: comment.User?.id || "unknown",
                "full-name":
                  `${comment.User?.["first-name"] || ""} ${
                    comment.User?.["last-name"] || ""
                  }`.trim() || "Unknown User",
                "user-type": comment.User?.["user-type"] || "unknown",
                image: comment.User?.Graduate
                  ? comment.User.Graduate["profile-picture-url"]
                  : null,
              },
            }))
          : [],
        comments_count: post.Comments ? post.Comments.length : 0,
      };
    });

    const userData = graduate.User;
    const isOwner = +currentUserId === +graduate.graduate_id;

    const lang = req.headers["accept-language"] || req.user.language || "ar";
    const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

    const profile = {
      profilePicture: graduate["profile-picture-url"],
      fullName: `${userData["first-name"]} ${userData["last-name"]}`,
      faculty: facultyName,
      graduationYear: graduate["graduation-year"],
      bio: graduate.bio,
      skills: graduate.skills,
      currentJob: graduate["current-job"],
      showCV: graduate.show_cv,
      showLinkedIn: graduate.show_linkedin,
      showPhone: userData.show_phone,
      friendshipStatus: isOwner ? "owner" : friendshipStatus,
      posts: postsData,
    };

    if (graduate.show_cv) profile.CV = graduate["cv-url"];
    if (graduate.show_linkedin)
      profile.linkedlnLink = graduate["linkedln-link"];
    if (userData.show_phone) profile.phoneNumber = userData.phoneNumber;

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: "Graduate Profile fetched successfully",
      data: profile,
    });
  } catch (err) {
    console.error("❌ خطأ في الفانكشن:", err);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: err.message,
      data: null,
    });
  }
};

module.exports = {
  getAllGraduates,
  getGraduatesInPortal,
  getRequestedGraduates,
  getDigitalID,
  generateDigitalIDQR,
  verifyDigitalIDQR,
  getGraduateProfile,
  getPublicGraduateProfile,
  updateProfile,
  updateGraduateStatus,
  searchGraduates,
  approveGraduate,
  rejectGraduate,
  getGraduateProfileForUser,
  downloadCv,
};