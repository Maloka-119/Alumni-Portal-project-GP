//authMiddleware

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Staff = require('../models/Staff');

// Protect routes middleware
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findByPk(decoded.id);

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin middleware
const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user['user-type'] === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
});

// Admin only middleware (alias for admin)
const adminOnly = admin;

// Staff middleware
const staff = asyncHandler(async (req, res, next) => {
  if (req.user && req.user['user-type'] === 'staff') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as staff');
  }
});

// Staff only middleware (alias for staff)
const staffOnly = staff;

// Role-specific staff middleware
const staffTypeOnly = (staffType) => {
  return asyncHandler(async (req, res, next) => {
    const staff = await Staff.findOne({ where: { user: req.user.id } });
    
    if (staff && staff.staffType === staffType) {
      next();
    } else {
      res.status(403);
     throw new Error(`Not authorized as ${staffType} staff`);

    }
  });
};

// Graduate middleware
const graduateOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user['user-type'] === 'graduate') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a graduate');
  }
});

module.exports = { protect, admin, adminOnly, staff, staffOnly, staffTypeOnly, graduateOnly };