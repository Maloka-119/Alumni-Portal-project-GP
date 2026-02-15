const asyncHandler = require("express-async-handler");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const validator = require("validator");
const User = require("../models/User");
const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const generateToken = require("../utils/generateToken");
const aes = require("../utils/aes");
const {
  normalizeCollegeName,
  getCollegeNameByCode,
} = require("../services/facultiesService");
const { securityLogger } = require("../utils/logger");
const {
  validateEmail,
  validatePassword,
  validateNationalId,
  validatePhoneNumber,
  sanitizeInput,
} = require("../middleware/security");

// Import invitation controller
const {
  sendAutoGroupInvitation,
} = require("../controllers/invitation.controller");

// ======== Helper Functions ========

/**
 * Extract date of birth from Egyptian National ID (NID)
 * @param {string} nid - Egyptian National ID (14 digits)
 * @returns {string} Formatted date string (YYYY-MM-DD)
 * @throws {Error} If NID format is invalid
 */
function extractDOBFromEgyptianNID(nid) {
  const id = nid.trim();
  if (!validateNationalId(id)) throw new Error("Invalid NID format");

  const centuryDigit = id[0];
  let century;
  if (centuryDigit === "2") century = 1900;
  else if (centuryDigit === "3") century = 2000;
  else throw new Error("Unsupported century in NID");

  const yy = parseInt(id.substr(1, 2), 10);
  const mm = parseInt(id.substr(3, 2), 10);
  const dd = parseInt(id.substr(5, 2), 10);

  const date = new Date(Date.UTC(century + yy, mm - 1, dd));
  if (
    date.getUTCFullYear() !== century + yy ||
    date.getUTCMonth() !== mm - 1 ||
    date.getUTCDate() !== dd
  )
    throw new Error("Invalid birth date in NID");

  return `${century + yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(
    2,
    "0"
  )}`;
}

/**
 * Check if National ID is already registered
 * @param {string} nid - Egyptian National ID
 * @returns {Promise<boolean>} True if NID exists in database
 */
async function isNIDRegistered(nid) {
  const encryptedNid = aes.encryptNationalId(nid);
  const user = await User.findOne({ where: { "national-id": encryptedNid } });
  return !!user;
}

/**
 * Send password reset verification email via Gmail SMTP
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit verification code
 * @returns {Promise<Object>} Nodemailer send info
 * @throws {Error} If email sending fails
 */
async function sendVerificationEmail(email, code) {
  // Enhanced Gmail configuration
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Should be Gmail App Password
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates if needed
    },
  });

  const mailOptions = {
    from: `"Alumni Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
        </div>
        <p><strong>This code will expire in 15 minutes.</strong></p>
        <p>If you didn't request this, ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">Helwan University Alumni Portal</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification code sent successfully to ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

// ======== Controller Functions ========

/**
 * Register a new user (graduate or staff)
 * @route POST /api/users/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
  sanitizeInput(req, res, () => {});
  const { firstName, lastName, email, password, nationalId, phoneNumber } =
    req.body;

  // --- Validation ---
  if (!firstName || !lastName || !email || !password || !nationalId) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (!validateEmail(email)) {
    return res
      .status(400)
      .json({ error: "Please enter a valid email address" });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({
      error:
        "Password is too weak. Minimum 8 characters, must include a number and a symbol",
    });
  }
  if (!validateNationalId(nationalId)) {
    return res.status(400).json({ error: "Invalid National ID" });
  }
  if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  // --- Check for duplicates ---
  if (await User.findOne({ where: { email } })) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const existingUsers = await User.findAll();
  for (const u of existingUsers) {
    const decryptedNID = aes.decryptNationalId(u["national-id"]);
    if (decryptedNID === nationalId) {
      return res.status(409).json({ error: "National ID already registered" });
    }
  }

  // --- Create user ---
  const birthDate = extractDOBFromEgyptianNID(nationalId);
  const hashedPassword = await bcrypt.hash(password, 10);
  const encryptedNID = aes.encryptNationalId(nationalId);

  let userType = "graduate",
    statusToLogin = "pending",
    externalData = null;

  try {
    const staffResp = await axios.get(
      `${process.env.STAFF_API_URL}?nationalId=${encodeURIComponent(
        nationalId
      )}`,
      { timeout: 8000 }
    );
    if (staffResp.data?.department) {
      userType = "staff";
      statusToLogin = "inactive";
      externalData = staffResp.data;
    }
  } catch {}

  if (userType === "graduate") {
    try {
      const gradResp = await axios.get(
        `${process.env.GRADUATE_API_URL}?nationalId=${encodeURIComponent(
          nationalId
        )}`,
        { timeout: 8000 }
      );
      if (gradResp.data?.faculty) {
        statusToLogin = "accepted";
        externalData = gradResp.data;
      }
    } catch {}
  }

  const user = await User.create({
    "first-name": validator.escape(firstName),
    "last-name": validator.escape(lastName),
    email: validator.normalizeEmail(email),
    "phone-number": phoneNumber ? validator.escape(phoneNumber) : null,
    "hashed-password": hashedPassword,
    "birth-date": birthDate,
    "user-type": userType,
    "national-id": encryptedNID,
  });

  if (userType === "graduate") {
    const facultyName = externalData?.faculty || null;
    const facultyCode = facultyName ? normalizeCollegeName(facultyName) : null;
    await Graduate.create({
      graduate_id: user.id,
      faculty_code: facultyCode,
      "graduation-year": externalData?.["graduation-year"] || null,
      "status-to-login": statusToLogin,
    });

    // Auto Group Invitation for new graduates
    (async () => {
      try {
        // Short delay to ensure database persistence
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Send automatic group invitation
        const invitationSent = await sendAutoGroupInvitation(user.id);

        if (invitationSent) {
          console.log(
            `✅ Auto invitation sent successfully for user ${user.id}`
          );
        } else {
          console.warn(`⚠️ Failed to send auto invitation for user ${user.id}`);
        }
      } catch (error) {
        console.error(
          `❌ Error in auto invitation for user ${user.id}:`,
          error.message
        );
      }
    })();
  }

  if (userType === "staff") {
    await Staff.create({ staff_id: user.id, "status-to-login": statusToLogin });
  }

  securityLogger.registration(req.ip, email, userType, statusToLogin);
  res.status(201).json({
    id: user.id,
    email: user.email,
    userType,
    token: generateToken(user.id),
  });
});

/**
 * Authenticate user and generate JWT token
 * @route POST /api/users/login
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
  sanitizeInput(req, res, () => {});
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email & password required" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const user = await User.findOne({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Check if user is OAuth-only (no password set)
  if (!user["hashed-password"]) {
    const authProvider = user["auth_provider"] || "OAuth";
    return res.status(401).json({
      error: `This account was created using ${authProvider} authentication. Please use the "${authProvider} Login" button to sign in.`,
      requiresOAuth: true,
      authProvider: authProvider,
    });
  }

  // Verify password for regular users
  if (!(await bcrypt.compare(password, user["hashed-password"]))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Check status for staff
  if (user["user-type"] === "staff") {
    const staff = await Staff.findOne({ where: { staff_id: user.id } });
    if (!staff || staff["status-to-login"] !== "active") {
      return res.status(403).json({ error: "Staff account not active" });
    }
  }

  // Check status for graduate
  if (user["user-type"] === "graduate") {
    const grad = await Graduate.findOne({ where: { graduate_id: user.id } });
    if (!grad || grad["status-to-login"] !== "accepted") {
      return res
        .status(403)
        .json({ error: "Graduate account pending approval" });
    }
  }

  securityLogger.successfulLogin(req.ip, email, user["user-type"]);
  res.json({
    id: user.id,
    email: user.email,
    userType: user["user-type"],
    token: generateToken(user.id),
  });
});

/**
 * Send password reset verification code to email
 * @route POST /api/users/forgot-password
 * @access Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  sanitizeInput(req, res, () => {});
  const { email } = req.body;
  if (!email || !validateEmail(email)) throw new Error("Valid email required");

  const user = await User.findOne({ where: { email } });
  if (!user)
    return res.json({ message: "If the email exists, verification code sent" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + 15);
  user["verification-code"] = code;
  user["verification-code-expires"] = expiration;
  await user.save();
  await sendVerificationEmail(email, code);

  securityLogger.passwordResetRequest(req.ip, email);
  res.json({ message: "If the email exists, verification code sent" });
});

/**
 * Verify password reset code
 * @route POST /api/users/verify-code
 * @access Public
 */
const verifyCode = asyncHandler(async (req, res) => {
  sanitizeInput(req, res, () => {});
  const { email, code } = req.body;
  if (!email || !code) throw new Error("Email & code required");
  if (!validateEmail(email)) throw new Error("Invalid email");

  const user = await User.findOne({ where: { email } });
  if (!user || !user["verification-code"] || !user["verification-code-expires"])
    throw new Error("Invalid or expired code");
  if (new Date() > user["verification-code-expires"])
    throw new Error("Code expired");
  if (user["verification-code"] !== code) throw new Error("Invalid code");

  res.json({ message: "Code is valid" });
});

/**
 * Reset user password with verification code
 * @route POST /api/users/reset-password
 * @access Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  sanitizeInput(req, res, () => {});
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword)
    throw new Error("Email, code & new password required");
  if (!validateEmail(email)) throw new Error("Invalid email");
  if (!validatePassword(newPassword)) throw new Error("Weak password");

  const user = await User.findOne({ where: { email } });
  if (!user || !user["verification-code"] || !user["verification-code-expires"])
    throw new Error("Invalid or expired code");
  if (new Date() > user["verification-code-expires"])
    throw new Error("Code expired");
  if (user["verification-code"] !== code) throw new Error("Invalid code");

  user["hashed-password"] = await bcrypt.hash(newPassword, 10);
  user["verification-code"] = null;
  user["verification-code-expires"] = null;
  await user.save();

  securityLogger.passwordResetSuccess(req.ip, email);
  res.json({ message: "Password reset successfully" });
});

/**
 * Get authenticated user profile with related data
 * @route GET /api/users/profile
 * @access Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["hashed-password"] },
  });
  if (!user) throw new Error("User not found");

  let profile = {
    id: user.id,
    "first-name": user["first-name"],
    "last-name": user["last-name"],
    email: user.email,
    "phone-number": user["phone-number"],
    "birth-date": user["birth-date"],
    "user-type": user["user-type"],
    "national-id": user["national-id"],
  };

  if (user["user-type"] === "graduate") {
    const grad = await Graduate.findOne({ where: { graduate_id: user.id } });
    if (grad) {
      const lang = req.headers["accept-language"] || "ar";
      profile.graduate = {
        faculty: getCollegeNameByCode(grad.faculty_code, lang),
        "graduation-year": grad["graduation-year"],
        bio: grad.bio,
        skills: grad.skills,
        "current-job": grad["current-job"],
        "status-to-login": grad["status-to-login"],
        "cv-url": grad["cv-url"],
        "linkedln-link": grad["linkedln-link"],
        "profile-picture-url": grad["profile-picture-url"],
      };
    }
  }
  if (user["user-type"] === "staff") {
    const staff = await Staff.findOne({ where: { staff_id: user.id } });
    if (staff) profile.staff = { "status-to-login": staff["status-to-login"] };
  }

  res.json(profile);
});

/**
 * Update authenticated user profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) throw new Error("User not found");

  sanitizeInput(req, res, () => {});
  const fields = ["first-name", "last-name", "email", "phone-number"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) user[f] = validator.escape(req.body[f]);
  });

  if (user["user-type"] === "graduate") {
    const grad = await Graduate.findOne({ where: { graduate_id: user.id } });
    if (grad) {
      if (req.body.faculty)
        grad.faculty_code = normalizeCollegeName(req.body.faculty);
      [
        "graduation-year",
        "bio",
        "skills",
        "current-job",
        "linkedln-link",
      ].forEach((f) => {
        if (req.body[f] !== undefined) grad[f] = req.body[f];
      });
      await grad.save();
    }
  }

  await user.save();
  res.json({ message: "Profile updated successfully" });
});

/**
 * Logout user by clearing JWT cookie
 * @route POST /api/users/logout
 * @access Private
 */
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.json({ message: "Logged out successfully" });
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
