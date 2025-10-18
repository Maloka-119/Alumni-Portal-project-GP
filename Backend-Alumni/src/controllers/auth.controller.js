const asyncHandler = require("express-async-handler");
const axios = require("axios");
const User = require("../models/User");
const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// @desc    Register user automatically as graduate or staff
// @route   POST /alumni-portal/register
// @access  Public
// helper: يستخرج تاريخ الميلاد بصيغة "YYYY-MM-DD" أو يرمي خطأ لو الرقم غير صالح
function extractDOBFromEgyptianNID(nationalId) {
  const id = String(nationalId).trim();
  if (!/^\d{14}$/.test(id)) {
    throw new Error("Invalid national ID format (must be 14 digits).");
  }

  const centuryDigit = id[0];
  let century;
  if (centuryDigit === '2') century = 1900;
  else if (centuryDigit === '3') century = 2000;
  else if (centuryDigit === '4') century = 2100; // احتياطي لو احتجت
  else throw new Error("Unsupported century digit in national ID.");

  const yy = parseInt(id.substr(1, 2), 10);
  const mm = parseInt(id.substr(3, 2), 10);
  const dd = parseInt(id.substr(5, 2), 10);

  const year = century + yy;

  // Validate actual date (handles حالات زي 2021-02-30)
  const date = new Date(Date.UTC(year, mm - 1, dd));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== mm - 1 ||
    date.getUTCDate() !== dd
  ) {
    throw new Error("Invalid birth date extracted from national ID.");
  }

  // إرجاع بصيغة ISO بدون الوقت
  return `${year.toString().padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

// registerUser بعد التعديل
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, nationalId, phoneNumber /*, birthDate */ } = req.body;

  // نحاول نطلع تاريخ الميلاد من الرقم القومي
  let birthDateFromNid;
  try {
    birthDateFromNid = extractDOBFromEgyptianNID(nationalId);
  } catch (err) {
    res.status(400);
    throw new Error("Invalid national ID: " + err.message);
  }

  let externalData;
  let userType;

  // تحقق من Graduate API باستخدام الرقم القومي فقط
  try {
    const gradResponse = await axios.get(
      `${process.env.GRADUATE_API_URL}?nationalId=${nationalId}`
    );
    console.log("Graduate API response:", gradResponse.data);
    externalData = gradResponse.data;
    if (externalData && externalData.faculty) {
      userType = "graduate";
    }
  } catch (err) {
    console.log("Graduate API error:", err.message);
  }

  // إذا لم يكن خريج، تحقق من Staff API
  if (!userType) {
    try {
      const staffResponse = await axios.get(
        `${process.env.STAFF_API_URL}?nationalId=${nationalId}`
      );
      console.log("Staff API response:", staffResponse.data);
      externalData = staffResponse.data;
      if (externalData && externalData.department) {
        userType = "staff";
      }
    } catch (err) {
      console.log("Staff API error:", err.message);
    }
  }

  // إذا لم نجد userType، ارفض التسجيل
  if (!userType) {
    res.status(400);
    throw new Error(
      "Registration failed: National ID not recognized in Helwan University records."
    );
  }

  // تحقق إذا البريد موجود مسبقًا
  const userExists = await User.findOne({ where: { email } });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // تشفير الباسورد
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // حفظ البيانات في جدول User --- نستخدم birthDateFromNid بدل الحقل المرسل
  const user = await User.create({
    "first-name": firstName,
    "last-name": lastName,
    email,
    phoneNumber: phoneNumber,
    "hashed-password": hashedPassword,
    "birth-date": birthDateFromNid, // <-- هنا
    "user-type": userType,
    "national-id": nationalId,
  });

  // حفظ بيانات إضافية في Graduate أو Staff
  if (userType === "graduate") {
    await Graduate.create({
      graduate_id: user.id,
      faculty: externalData.faculty,
      "graduation-year": externalData["graduation-year"],
    });
  } else if (userType === "staff") {
    await Staff.create({
      staff_id: user.id,
      "status-to-login": "inactive",
    });
  }

  // رجع الرد للـ frontend
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

//   // تحقق من Graduate API باستخدام الرقم القومي فقط
//   try {
//     const gradResponse = await axios.get(
//       `${process.env.GRADUATE_API_URL}?nationalId=${nationalId}`
//     );
//      console.log("Graduate API response:", gradResponse.data);
//     externalData = gradResponse.data;
//  console.log("Graduate API response:", externalData);
//     if (externalData && externalData.faculty) { 
//       userType = "graduate";
//     }
//     console.log(gradResponse);
//   } catch (err) {
//     console.log("Graduate API error:", err.message);
//   }

//   // إذا لم يكن خريج، تحقق من Staff API
//   if (!userType) {
//     try {
//       const staffResponse = await axios.get(
//         `${process.env.STAFF_API_URL}?nationalId=${nationalId}`
//       );
//       console.log("Staff API response:", staffResponse.data);
//       externalData = staffResponse.data;
// console.log("Staff API response:", externalData);

//       if (externalData && externalData.department) {
//         userType = "staff";
//       }
//     } catch (err) {
//         console.log("Staff API error:", err.message);
//     }
//   }

//   // إذا لم نجد userType، ارفض التسجيل
//   if (!userType) {
//     res.status(400);
//     throw new Error(
//       "Registration failed: National ID not recognized in Helwan University records."
//     );
//   }

//   // تحقق إذا البريد موجود مسبقًا
//   const userExists = await User.findOne({ where: { email } });
//   if (userExists) {
//     res.status(400);
//     throw new Error("User already exists");
//   }

//   // تشفير الباسورد
//   const salt = await bcrypt.genSalt(10);
//   const hashedPassword = await bcrypt.hash(password, salt);

//   // حفظ البيانات في جدول User
//   const user = await User.create({
//     "first-name": firstName,
//     "last-name": lastName,
//     email,
//     phoneNumber: phoneNumber,
//     "hashed-password": hashedPassword,
//     "birth-date": birthDate,
//     "user-type": userType,
//     "national-id": nationalId,
//   });

//   // حفظ بيانات إضافية في Graduate أو Staff
//   if (userType === "graduate") {
//     await Graduate.create({
//       graduate_id: user.id,
//       faculty: externalData.faculty, // بدل college
//       "graduation-year": externalData["graduation-year"], // بدل graduationYear
//     });
//   } else if (userType === "staff") {
//     await Staff.create({
//       staff_id: user.id,
//       "status-to-login": "inactive", // inactive حتى يتم الموافقة
//     });
//   }

//   // رجع الرد للـ frontend
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

  // هيكون كود من6 ارقام
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 15د دقيقه وينتهي
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 15);

  // هيحفظ الكود ووقت الانتهاء في اليوزر
  user['verification-code'] = verificationCode;
  user['verification-code-expires'] = expirationTime;
  await user.save();

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

  res.json({ message: "Verification code sent to your email" });
});

// ---------- VERIFY CODE ----------
// @desc    Verify the verification code
// @route   POST /alumni-portal/verify-code
// @access  Public
const verifyCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400);
    throw new Error("Email and verification code are required");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // هيتحقق من الكود ووقت الانتهاء
  if (!user['verification-code'] || !user['verification-code-expires']) {
    res.status(400);
    throw new Error("No verification code found. Please request a new one.");
  }

  if (new Date() > user['verification-code-expires']) {
    res.status(400);
    throw new Error("Verification code has expired. Please request a new one.");
  }

  if (user['verification-code'] !== code) {
    res.status(400);
    throw new Error("Invalid verification code");
  }

  res.json({ message: "Verification code is valid" });
});

// ---------- RESET PASSWORD ----------
// @desc    Reset user password using verification code
// @route   POST /alumni-portal/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    res.status(400);
    throw new Error("Email, verification code, and new password are required");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if code exists and is not expired
  if (!user['verification-code'] || !user['verification-code-expires']) {
    res.status(400);
    throw new Error("No verification code found. Please request a new one.");
  }

  if (new Date() > user['verification-code-expires']) {
    res.status(400);
    throw new Error("Verification code has expired. Please request a new one.");
  }

  if (user['verification-code'] !== code) {
    res.status(400);
    throw new Error("Invalid verification code");
  }

  // hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password and clear verification code
  user["hashed-password"] = hashedPassword;
  user['verification-code'] = null;
  user['verification-code-expires'] = null;
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
  verifyCode,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  logoutUser,
};

