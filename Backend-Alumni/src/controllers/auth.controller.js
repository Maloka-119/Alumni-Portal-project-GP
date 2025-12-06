const asyncHandler = require("express-async-handler");
const axios = require("axios");
const User = require("../models/User");
const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const {
  normalizeCollegeName,
  getCollegeNameByCode,
} = require("../services/facultiesService");
const aes = require("../utils/aes");
const validator = require("validator");
const { securityLogger } = require("../utils/logger");
const {
  validateEmail,
  validatePassword,
  validateNationalId,
  validatePhoneNumber,
  sanitizeInput
} = require("../middleware/security");

// helper: يستخرج تاريخ الميلاد بصيغة "YYYY-MM-DD" أو يرمي خطأ لو الرقم غير صالح
function extractDOBFromEgyptianNID(nationalId) {
  const id = String(nationalId).trim();
  
  // التحقق من صحة الرقم القومي
  if (!validateNationalId(nationalId)) {
    throw new Error("Invalid national ID format (must be 14 digits).");
  }

  const centuryDigit = id[0];
  let century;
  if (centuryDigit === "2") century = 1900;
  else if (centuryDigit === "3") century = 2000;
  else if (centuryDigit === "4") century = 2100;
  else throw new Error("Unsupported century digit in national ID.");

  const yy = parseInt(id.substr(1, 2), 10);
  const mm = parseInt(id.substr(3, 2), 10);
  const dd = parseInt(id.substr(5, 2), 10);

  // التحقق من صحة الشهر واليوم
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    throw new Error("Invalid birth date in national ID.");
  }

  const year = century + yy;

  // Validate actual date
  const date = new Date(Date.UTC(year, mm - 1, dd));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== mm - 1 ||
    date.getUTCDate() !== dd
  ) {
    throw new Error("Invalid birth date extracted from national ID.");
  }

  return `${year.toString().padStart(4, "0")}-${String(mm).padStart(
    2,
    "0"
  )}-${String(dd).padStart(2, "0")}`;
}

// registerUser (Final Version with Input Limitations)
const registerUser = asyncHandler(async (req, res) => {

  // Sanitize inputs
 
  sanitizeInput(req, res, () => {});

  const { firstName, lastName, email, password, nationalId, phoneNumber } = req.body;


  // Validate required fields

  if (!firstName || !lastName || !email || !password || !nationalId) {
    res.status(400);
    throw new Error("All fields are required");
  }


  // Validate formats
  if (!validateEmail(email)) {
    res.status(400);
    throw new Error("Invalid email format");
  }

  if (!validatePassword(password)) {
    res.status(400);
    throw new Error(
      "Password must be at least 8 characters with uppercase, lowercase, number and symbol"
    );
  }

  if (!validateNationalId(nationalId)) {
    res.status(400);
    throw new Error("National ID must be 14 digits");
  }

  if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
    res.status(400);
    throw new Error("Invalid phone number");
  }


  // Input length limitations

  if (firstName.length > 50) {
    res.status(400);
    throw new Error("First name cannot exceed 50 characters");
  }

  if (lastName.length > 50) {
    res.status(400);
    throw new Error("Last name cannot exceed 50 characters");
  }

  if (password.length > 128) {
    res.status(400);
    throw new Error("Password cannot exceed 128 characters");
  }

  if (phoneNumber && phoneNumber.length > 15) {
    res.status(400);
    throw new Error("Phone number cannot exceed 15 digits");
  }

  if (email.length > 255) {
    res.status(400);
    throw new Error("Email cannot exceed 255 characters");
  }


  // Extract birth date from NID

  let birthDateFromNid;
  try {
    birthDateFromNid = extractDOBFromEgyptianNID(nationalId);
  } catch (error) {
    securityLogger.xssAttempt(req.ip, nationalId);
    res.status(400);
    throw new Error("Invalid national ID");
  }

  
  // Encrypt National ID

  const encryptedNationalId = aes.encryptNationalId(nationalId);

  
  // Check for duplicate National ID by decrypting existing records
  
  const allUsers = await User.findAll({ attributes: ["id", "national-id", "email"] });

  for (const u of allUsers) {
    const decryptedNID = aes.decryptNationalId(u["national-id"]);
    if (decryptedNID === nationalId) {
      securityLogger.failedLogin(req.ip, email, "National ID already registered");
      res.status(400);
      throw new Error("This national ID is already registered");
    }
  }

  
  // Check for duplicate email
  
  const userExists = await User.findOne({ where: { email } });
  if (userExists) {
    securityLogger.failedLogin(req.ip, email, "User already exists");
    res.status(400);
    throw new Error("User already exists with this email");
  }


  // Detect user type from external APIs
 
  let externalData = null;
  let userType = null;
  let statusToLogin = "accepted";

  // STAFF API
  try {
    const { data } = await axios.get(
      `${process.env.STAFF_API_URL}?nationalId=${encodeURIComponent(nationalId)}`,
      { timeout: 10000 }
    );
    const departmentField = data?.department || data?.Department || data?.DEPARTMENT;

    if (departmentField) {
      externalData = data;
      userType = "staff";
      statusToLogin = "inactive";
    }
  } catch (err) {
    console.log("Staff API error:", err.message);
  }

  // GRADUATE API
  if (!userType) {
    try {
      const { data } = await axios.get(
        `${process.env.GRADUATE_API_URL}?nationalId=${encodeURIComponent(nationalId)}`,
        { timeout: 10000 }
      );
      externalData = data;

      const facultyField =
        data?.faculty || data?.Faculty || data?.FACULTY || data?.facultyName;

      if (facultyField) {
        userType = "graduate";
        statusToLogin = "accepted";
      } else {
        userType = "graduate";
        statusToLogin = "pending";
      }
    } catch (err) {
      console.log("Graduate API error:", err.message);
      userType = "graduate";
      statusToLogin = "pending";
    }
  }

  if (!userType) {
    securityLogger.failedLogin(req.ip, email, "National ID not recognized");
    res.status(400);
    throw new Error("National ID not recognized in records");
  }

  // Hash password

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

 
  // Create User Record
  
  const user = await User.create({
    "first-name": validator.escape(firstName),
    "last-name": validator.escape(lastName),
    email: validator.normalizeEmail(email),
    phoneNumber: phoneNumber ? validator.escape(phoneNumber) : null,
    "hashed-password": hashedPassword,
    "birth-date": birthDateFromNid,
    "user-type": userType,
    "national-id": encryptedNationalId,
  });


  // Create Graduate or Staff Record
 
  if (userType === "graduate") {
    const facultyName =
      externalData?.faculty ||
      externalData?.Faculty ||
      externalData?.FACULTY ||
      externalData?.facultyName ||
      null;

    const facultyCode = facultyName ? normalizeCollegeName(facultyName) : null;

    await Graduate.create({
      graduate_id: user.id,
      faculty_code: facultyCode,
      "graduation-year":
        externalData?.["graduation-year"] ||
        externalData?.graduationYear ||
        externalData?.GraduationYear ||
        null,
      "status-to-login": statusToLogin,
    });

    try {
      const { sendAutoGroupInvitation } = require("./invitation.controller");
      await sendAutoGroupInvitation(user.id);
    } catch (error) {
      console.error("Auto invitation failed:", error);
    }
  }

  if (userType === "staff") {
    await Staff.create({
      staff_id: user.id,
      "status-to-login": statusToLogin,
    });
  }

  securityLogger.registration(req.ip, email, userType, statusToLogin);

  // Send response with token

  res.status(201).json({
    id: user.id,
    email: user.email,
    userType,
    token: generateToken(user.id),
  });
});

// loginUser
const loginUser = asyncHandler(async (req, res) => {
  // تنظيف المدخلات
  sanitizeInput(req, res, () => {});

  const { email, password } = req.body;

  // التحقق من صحة المدخلات
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  if (!validateEmail(email)) {
    securityLogger.failedLogin(req.ip, email, "Invalid email format");
    res.status(400);
    throw new Error("Invalid email format");
  }

  // البحث عن المستخدم
  const user = await User.findOne({ where: { email } });

  if (user && (await bcrypt.compare(password, user["hashed-password"]))) {
    // تحقق من حالة staff
    if (user["user-type"] === "staff") {
      const staff = await Staff.findOne({ where: { staff_id: user.id } });

      if (!staff) {
        securityLogger.failedLogin(req.ip, email, "Staff record not found");
        res.status(403);
        throw new Error("Staff record not found. Please contact admin.");
      }

      if (staff["status-to-login"] !== "active") {
        securityLogger.failedLogin(req.ip, email, "Staff account not active");
        res.status(403);
        throw new Error(
          "Your staff account is not active, Please contact the Alumni Portal team for assistance."
        );
      }
    }

    // تحقق من حالة graduate
    if (user["user-type"] === "graduate") {
      const graduate = await Graduate.findOne({
        where: { graduate_id: user.id },
        attributes: { exclude: ["faculty"] },
      });

      if (!graduate) {
        securityLogger.failedLogin(req.ip, email, "Graduate record not found");
        res.status(403);
        throw new Error("Graduate record not found. Please contact admin.");
      }

      if (graduate["status-to-login"] !== "accepted") {
        securityLogger.failedLogin(req.ip, email, "Account pending approval");
        res.status(403);
        throw new Error(
          "Your account is pending approval, Please wait for confirmation from the Alumni Portal team"
        );
      }
    }

    securityLogger.successfulLogin(req.ip, email, user["user-type"]);

    res.json({
      id: user.id,
      email: user.email,
      userType: user["user-type"],
      token: generateToken(user.id),
    });
  } else {
    securityLogger.failedLogin(req.ip, email, "Invalid credentials");
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// forgotPassword
const forgotPassword = asyncHandler(async (req, res) => {
  // تنظيف المدخلات
  sanitizeInput(req, res, () => {});

  const { email } = req.body;

  if (!email || !validateEmail(email)) {
    res.status(400);
    throw new Error("Valid email is required");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    // لا نكشف أن البريد غير موجود لأسباب أمنية
    res.json({ message: "If the email exists, a verification code has been sent" });
    return;
  }

  // كود التحقق
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  // 15 دقيقة وينتهي
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 15);

  user["verification-code"] = verificationCode;
  user["verification-code-expires"] = expirationTime;
  await user.save();

  // إرسال البريد الإلكتروني
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Alumni Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your Alumni Portal account.</p>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
        </div>
        <p><strong>This code will expire in 15 minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">Helwan University Alumni Portal</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);

  securityLogger.passwordResetRequest(req.ip, email);

  res.json({ message: "If the email exists, a verification code has been sent" });
});

// verifyCode
const verifyCode = asyncHandler(async (req, res) => {
  // تنظيف المدخلات
  sanitizeInput(req, res, () => {});

  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400);
    throw new Error("Email and verification code are required");
  }

  if (!validateEmail(email)) {
    res.status(400);
    throw new Error("Invalid email format");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user["verification-code"] || !user["verification-code-expires"]) {
    res.status(400);
    throw new Error("No verification code found. Please request a new one.");
  }

  if (new Date() > user["verification-code-expires"]) {
    res.status(400);
    throw new Error("Verification code has expired. Please request a new one.");
  }

  if (user["verification-code"] !== code) {
    res.status(400);
    throw new Error("Invalid verification code");
  }

  res.json({ message: "Verification code is valid" });
});

// resetPassword
const resetPassword = asyncHandler(async (req, res) => {
  // تنظيف المدخلات
  sanitizeInput(req, res, () => {});

  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    res.status(400);
    throw new Error("Email, verification code, and new password are required");
  }

  if (!validateEmail(email)) {
    res.status(400);
    throw new Error("Invalid email format");
  }

  if (!validatePassword(newPassword)) {
    res.status(400);
    throw new Error("Password must be at least 8 characters with uppercase, lowercase, number and symbol");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user["verification-code"] || !user["verification-code-expires"]) {
    res.status(400);
    throw new Error("No verification code found. Please request a new one.");
  }

  if (new Date() > user["verification-code-expires"]) {
    res.status(400);
    throw new Error("Verification code has expired. Please request a new one.");
  }

  if (user["verification-code"] !== code) {
    res.status(400);
    throw new Error("Invalid verification code");
  }

  // hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user["hashed-password"] = hashedPassword;
  user["verification-code"] = null;
  user["verification-code-expires"] = null;
  await user.save();

  securityLogger.passwordResetSuccess(req.ip, email);

  res.json({ message: "Password reset successfully" });
});


// Profile
// @desc    Get logged-in user profile
// @route   GET /alumni-portal/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["hashed-password"] },
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  let profileData = {
    id: user.id,
    "first-name": user["first-name"],
    "last-name": user["last-name"],
    email: user.email,
    "phone-number": user["phone-number"],
    "birth-date": user["birth-date"],
    "user-type": user["user-type"],
    "national-id": user["national-id"],
  };

  // إذا كان المستخدم خريجاً، نضيف بيانات الخريج
  if (user["user-type"] === "graduate") {
    const graduate = await Graduate.findOne({
      where: { graduate_id: user.id },
      attributes: { exclude: ["faculty"] },
    });

    if (graduate) {
      const lang = req.headers["accept-language"] || "ar";
      const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

      profileData = {
        ...profileData,
        graduate: {
          faculty: facultyName,
          "graduation-year": graduate["graduation-year"],
          "profile-picture-url": graduate["profile-picture-url"],
          bio: graduate.bio,
          skills: graduate.skills,
          "current-job": graduate["current-job"],
          "status-to-login": graduate["status-to-login"],
          "cv-url": graduate["cv-url"],
          "linkedln-link": graduate["linkedln-link"],
        },
      };
    }
  }

  // إذا كان المستخدم موظفاً، نضيف بيانات الموظف
  if (user["user-type"] === "staff") {
    const staff = await Staff.findOne({
      where: { staff_id: user.id },
    });

    if (staff) {
      profileData = {
        ...profileData,
        staff: {
          "status-to-login": staff["status-to-login"],
        },
      };
    }
  }

  res.status(200).json(profileData);
});

// @desc    Update logged-in user profile
// @route   PUT /alumni-portal/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // تحديث البيانات الأساسية
  if (req.body["first-name"] !== undefined) {
    user["first-name"] = req.body["first-name"];
  }
  if (req.body["last-name"] !== undefined) {
    user["last-name"] = req.body["last-name"];
  }
  if (req.body.email !== undefined) {
    user.email = req.body.email;
  }
  if (req.body["phone-number"] !== undefined) {
    user["phone-number"] = req.body["phone-number"];
  }

  // إذا كان المستخدم خريجاً، نحدث بيانات الخريج
  if (user["user-type"] === "graduate") {
    const graduate = await Graduate.findOne({
      where: { graduate_id: user.id },
      attributes: { exclude: ["faculty"] },
    });

    if (graduate) {
      // تحديث faculty_code إذا تم إرسال faculty
      if (req.body.faculty !== undefined) {
        const facultyCode = normalizeCollegeName(req.body.faculty);
        if (facultyCode) {
          graduate.faculty_code = facultyCode;
        }
      }

      if (req.body["graduation-year"] !== undefined) {
        graduate["graduation-year"] = req.body["graduation-year"];
      }
      if (req.body.bio !== undefined) {
        graduate.bio = req.body.bio;
      }
      if (req.body.skills !== undefined) {
        graduate.skills = req.body.skills;
      }
      if (req.body["current-job"] !== undefined) {
        graduate["current-job"] = req.body["current-job"];
      }
      if (req.body["linkedln-link"] !== undefined) {
        graduate["linkedln-link"] = req.body["linkedln-link"];
      }

      await graduate.save();
    }
  }

  await user.save();

  // جلب البيانات المحدثة مع اسم الكلية
  const updatedUser = await User.findByPk(req.user.id, {
    attributes: { exclude: ["hashed-password"] },
  });

  let responseData = {
    id: updatedUser.id,
    "first-name": updatedUser["first-name"],
    "last-name": updatedUser["last-name"],
    email: updatedUser.email,
    "phone-number": updatedUser["phone-number"],
    "user-type": updatedUser["user-type"],
    message: "Profile updated successfully",
  };

  // إذا كان خريجاً، نضيف بيانات الخريج المحدثة
  if (updatedUser["user-type"] === "graduate") {
    const graduate = await Graduate.findOne({
      where: { graduate_id: updatedUser.id },
      attributes: { exclude: ["faculty"] },
    });

    if (graduate) {
      const lang = req.headers["accept-language"] || "ar";
      const facultyName = getCollegeNameByCode(graduate.faculty_code, lang);

      responseData.graduate = {
        faculty: facultyName,
        "graduation-year": graduate["graduation-year"],
        bio: graduate.bio,
        skills: graduate.skills,
        "current-job": graduate["current-job"],
        "linkedln-link": graduate["linkedln-link"],
      };
    }
  }

  res.status(200).json(responseData);
});

// Logout

// @desc    Logout user
// @route   GET /alumni-portal/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  // هنلغي التوكن عن طريق مسحه من الكوكيز
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
});


module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  verifyCode,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  logoutUser,

};

