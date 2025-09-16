const asyncHandler = require("express-async-handler");
const axios = require("axios");
const User = require("../models/User");
const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const generateToken = require("../utils/generateToken");
// @desc    Register user automatically as graduate or staff
// @route   POST /alumni-portal/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, nationalId, phoneNumber, birthDate } = req.body;

  let externalData;
  let userType;

  // 1️⃣ تحقق من Graduate API باستخدام الرقم القومي فقط
  try {
    const gradResponse = await axios.get(
      `${process.env.GRADUATE_API_URL}?nationalId=${nationalId}`
    );
    externalData = gradResponse.data;

    if (externalData && externalData.faculty) { // بدل college
      userType = "graduate";
    }
  } catch (err) {
    // إذا لم نجد في Graduate API، نكمل للتحقق في Staff API
  }

  // 2️⃣ إذا لم يكن خريج، تحقق من Staff API
  if (!userType) {
    try {
      const staffResponse = await axios.get(
        `${process.env.STAFF_API_URL}?nationalId=${nationalId}`
      );
      externalData = staffResponse.data;

      if (externalData && externalData.department) {
        userType = "staff";
      }
    } catch (err) {
      // إذا لم نجد، نترك userType undefined
    }
  }

  // 3️⃣ إذا لم نجد userType، ارفض التسجيل
  if (!userType) {
    res.status(400);
    throw new Error(
      "Registration failed: National ID not recognized in Helwan University records."
    );
  }

  // 4️⃣ تحقق إذا البريد موجود مسبقًا
  const userExists = await User.findOne({ where: { email } });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // 5️⃣ تشفير الباسورد
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 6️⃣ حفظ البيانات في جدول User
  const user = await User.create({
    "first-name": firstName,
    "last-name": lastName,
    email,
    "phone-number": phoneNumber,
    "hashed-password": hashedPassword,
    "birth-date": birthDate,
    "user-type": userType,
    "national-id": nationalId,
  });

  // 7️⃣ حفظ بيانات إضافية في Graduate أو Staff
  if (userType === "graduate") {
    await Graduate.create({
      graduate_id: user.id,
      faculty: externalData.faculty, // بدل college
      "graduation-year": externalData["graduation-year"], // بدل graduationYear
    });
  } else if (userType === "staff") {
    await Staff.create({
      staff_id: user.id,
      "status-to-login": "inactive", // inactive حتى يتم الموافقة
    });
  }

  // 8️⃣ رجع الرد للـ frontend
  res.status(201).json({
    id: user.id,
    email: user.email,
    userType: userType,
    token: generateToken(user.id),
  });
});



// const registerUser = asyncHandler(async (req, res) => {
//   const { firstName, lastName, email, password, nationalId, phoneNumber, birthDate } = req.body;

//   let externalData;
//   let userType;

//   // Check Graduate API
//   try {
//     const gradResponse = await axios.get(`${process.env.GRADUATE_API_URL}?nationalId=${nationalId}`);
//     externalData = gradResponse.data;
//     if (externalData && externalData.college) {
//       userType = "graduate";
//     }
//   } catch (err) {
//     // ignore, maybe not a graduate
//   }

//   // If not graduate, check Staff API
//   if (!userType) {
//     try {
//       const staffResponse = await axios.get(`${process.env.STAFF_API_URL}?nationalId=${nationalId}`);
//       externalData = staffResponse.data;
//       if (externalData && externalData.department) {
//         userType = "staff";
//       }
//     } catch (err) {
//       // ignore, maybe not staff
//     }
//   }

//   // If still no userType, reject registration
//   if (!userType) {
//     res.status(400);
//     throw new Error("Registration failed: National ID not recognized in Helwan University records.");
//   }

//   // Check if user already exists
//   const userExists = await User.findOne({ where: { email } });
//   if (userExists) {
//     res.status(400);
//     throw new Error("User already exists");
//   }

//   // Hash password
//   const salt = await bcrypt.genSalt(10);
//   const hashedPassword = await bcrypt.hash(password, salt);

//   // Save in User table
//   const user = await User.create({
//     "first-name": firstName,
//     "last-name": lastName,
//     email,
//     "phone-number": phoneNumber,
//     "hashed-password": hashedPassword,
//     "birth-date": birthDate,
//     "user-type": userType,
//     "national-id": nationalId,
//   });

//   // Save in Graduate OR Staff table
//   if (userType === "graduate") {
//     await Graduate.create({
//       graduate_id: user.id,
//       faculty: externalData.college,
//       "graduation-year": externalData.graduationYear,
//     });
//   } else if (userType === "staff") {
//     await Staff.create({
//       staff_id: user.id,
//       "status-to-login": "inactive", // always inactive until admin approval
//     });
//   }

//   res.status(201).json({
//     id: user.id,
//     email: user.email,
//     userType: userType,
//     token: generateToken(user.id),
//   });
// });






// @desc    Login user
// @route   POST /alumni-portal/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // نجيب اليوزر
  const user = await User.findOne({ where: { email } });

  if (user && (await bcrypt.compare(password, user["hashed-password"]))) {
    // لو ستاف نتأكد من الحالة بتاعته
    if (user["user-type"] === "staff") {
      const staff = await Staff.findOne({ where: { staff_id: user.id } });

      if (!staff) {
        res.status(403);
        throw new Error("Staff record not found. Please contact admin.");
      }

      if (staff["status-to-login"] === "inactive") {
        res.status(403);
        throw new Error("Your staff account is not active. Please contact admin.");
      }
    }

    // لو كل حاجة تمام
    res.json({
      id: user.id,
      email: user.email,
      userType: user["user-type"],
      token: generateToken(user.id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});
// @desc    Forgot password (placeholder)
// @route   POST /alumni-portal/forgot-password
// @access  Public
// ---------- FORGOT PASSWORD ----------
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Generate reset token (valid for 15 minutes)
  const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  // Create reset link
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Send email using nodemailer
  const transporter = nodemailer.createTransport({
    service: "gmail", // ممكن تغيريها لو عندك SMTP تاني
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Alumni Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password (valid for 15 minutes):</p>
      <a href="${resetLink}">${resetLink}</a>
    `,
  };

  await transporter.sendMail(mailOptions);

  res.json({ message: "Password reset link sent to your email" });
});

// ---------- RESET PASSWORD ----------
// @desc    Reset user password using reset token
// @route   POST /alumni-portal/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400);
    throw new Error("Token and new password are required");
  }

  // verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(400);
    throw new Error("Invalid or expired token");
  }

  // get user
  const user = await User.findByPk(decoded.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user["hashed-password"] = hashedPassword;
  await user.save();

  res.json({ message: "Password reset successfully" });
});



// Profile
// @desc    Get logged-in user profile
// @route   GET /alumni-portal/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password"); // من غير الباسورد

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});
// @desc    Update logged-in user profile
// @route   PUT /alumni-portal/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // تحديث البيانات (هنخليها اختيارية)
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;

  if (req.body.password) {
    user.password = req.body.password; // هيعمل Hash في الـ pre-save hook بالـ model
  }

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    message: "Profile updated successfully",
  });
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
  resetPassword,
  getUserProfile,
  updateUserProfile,
  logoutUser,
};

