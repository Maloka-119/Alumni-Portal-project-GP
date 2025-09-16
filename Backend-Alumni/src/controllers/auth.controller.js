// authController.js
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Staff = require('../models/Staff');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, graduationYear, userType, nationalId, phoneNumber, birthDate } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ where: { email } });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    'first-name': firstName,
    'last-name': lastName,
    email,
    'hashed-password': hashedPassword,
    'user-type': userType || 'graduate', // Default to graduate if not specified
    'national-id': nationalId,
    'phone-number': phoneNumber,
    'birth-date': birthDate,
  });

  // If user is staff, create staff profile
  if (user['user-type'] === 'staff' && req.body.staffType) {
    await Staff.create({
      user: user.id,
      staffType: req.body.staffType,
      department: req.body.department,
      specialization: req.body.specialization || '',
      consultationAreas: req.body.consultationAreas || [],
      documentTypes: req.body.documentTypes || [],
      postCategories: req.body.postCategories || [],
    });
  }

  if (user) {
    res.status(201).json({
      id: user.id,
      name: `${user['first-name']} ${user['last-name']}`,
      firstName: user['first-name'],
      lastName: user['last-name'],
      email: user.email,
      userType: user['user-type'],
      nationalId: user['national-id'],
      phoneNumber: user['phone-number'],
      birthDate: user['birth-date'],
      token: generateToken(user.id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ where: { email } });

  // Check if user exists and password matches
  if (user && (await bcrypt.compare(password, user['hashed-password']))) {
    // Get additional data based on role
    let additionalData = {};

    if (user['user-type'] === 'staff') {
      const staffProfile = await Staff.findOne({ where: { user: user.id } });
      if (staffProfile) {
        additionalData = {
          staffType: staffProfile.staffType,
          department: staffProfile.department,
        };
      }
    }

    res.json({
      id: user.id,
      name: `${user['first-name']} ${user['last-name']}`,
      firstName: user['first-name'],
      lastName: user['last-name'],
      email: user.email,
      userType: user['user-type'],
      nationalId: user['national-id'],
      phoneNumber: user['phone-number'],
      birthDate: user['birth-date'],
      ...additionalData,
      token: generateToken(user.id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (user) {
    let additionalData = {};

    if (user['user-type'] === 'staff') {
      const staffProfile = await Staff.findOne({ where: { user: user.id } });
      if (staffProfile) {
        additionalData = {
          staffType: staffProfile.staffType,
          department: staffProfile.department,
          specialization: staffProfile.specialization,
        };
      }
    }

    res.json({
      id: user.id,
      name: `${user['first-name']} ${user['last-name']}`,
      firstName: user['first-name'],
      lastName: user['last-name'],
      email: user.email,
      userType: user['user-type'],
      nationalId: user['national-id'],
      phoneNumber: user['phone-number'],
      birthDate: user['birth-date'],
      ...additionalData,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (user) {
    user['first-name'] = req.body.firstName || user['first-name'];
    user['last-name'] = req.body.lastName || user['last-name'];
    user.email = req.body.email || user.email;
    user['national-id'] = req.body.nationalId || user['national-id'];
    user['phone-number'] = req.body.phoneNumber || user['phone-number'];
    user['birth-date'] = req.body.birthDate || user['birth-date'];

    // Only update password if provided
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user['hashed-password'] = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    // Update staff profile if applicable
    if (user['user-type'] === 'staff') {
      const staffProfile = await Staff.findOne({ where: { user: user.id } });

      if (staffProfile) {
        if (req.body.department) staffProfile.department = req.body.department;
        if (req.body.specialization) staffProfile.specialization = req.body.specialization;
        if (req.body.consultationAreas) staffProfile.consultationAreas = req.body.consultationAreas;
        if (req.body.documentTypes) staffProfile.documentTypes = req.body.documentTypes;
        if (req.body.postCategories) staffProfile.postCategories = req.body.postCategories;

        await staffProfile.save();
      }
    }

    res.json({
      id: updatedUser.id,
      name: `${updatedUser['first-name']} ${updatedUser['last-name']}`,
      firstName: updatedUser['first-name'],
      lastName: updatedUser['last-name'],
      email: updatedUser.email,
      userType: updatedUser['user-type'],
      nationalId: updatedUser['national-id'],
      phoneNumber: updatedUser['phone-number'],
      birthDate: updatedUser['birth-date'],
      token: generateToken(updatedUser.id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Forgot password - NOT AVAILABLE with simple model
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Password reset functionality not available with simple user model',
  });
});

// @desc    Reset password - NOT AVAILABLE with simple model
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Password reset functionality not available with simple user model',
  });
});

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  logoutUser,
};
