// Import required security and validation libraries
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const validator = require("validator");
const sanitizeHtml = require("sanitize-html");
const { ipKeyGenerator } = require('express-rate-limit');


// Rate Limiting


// Limits login attempts to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Allow maximum 5 failed login attempts
  message: { error: "Too many login attempts, please try again after 5 minutes." },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable legacy headers
  keyGenerator: (req) => {
  return ipKeyGenerator(req);
}

,
  skipSuccessfulRequests: true, // Only count failed requests
});


// Limits general API requests from same IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time window: 15 minutes
  max: 100, // Max number of total requests per window per IP
  message: {
    error: "Too many requests from this IP, please try again later."
  }
});


// Helmet Security Headers


// Adds security-related HTTP headers to prevent common attacks
const helmetConfig = helmet({
  contentSecurityPolicy: {
    useDefaults: true, // Use Helmet default security policies
    directives: {
      defaultSrc: ["'self'"], // Allow only same origin for default content
      scriptSrc: ["'self'"], // Restrict scripts to same origin
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // Allow styles and Google Fonts
      imgSrc: ["'self'", "data:", "https:"], // Allow images from self, https, and data URIs
      fontSrc: ["'self'", "https://fonts.gstatic.com"], // Allow fonts from self and Google
      connectSrc: ["'self'", "http://localhost:3000"], // Allow API calls to backend only
      objectSrc: ["'none'"], // Block embedding objects
      frameSrc: ["'none'"] // Block iframes
    }
  },
  crossOriginEmbedderPolicy: false, // Disable COEP for compatibility
  crossOriginOpenerPolicy: true, // Enable COOP for isolation
  crossOriginResourcePolicy: { policy: "same-site" } // Restrict resource loading to same site
});


// Full Sanitization Against XSS


// Cleans all input fields to remove harmful scripts (XSS)
const sanitizeInput = (req, res, next) => {
  // Cleans a single value recursively
  const clean = (value) => {
    if (typeof value === "string") {
      const trimmed = validator.trim(value); // Remove spaces

      // Remove any HTML tags or attributes (strong XSS protection)
      return sanitizeHtml(trimmed, {
        allowedTags: [],
        allowedAttributes: {}
      });
    }

    // Clean each item in arrays
    if (Array.isArray(value)) {
      return value.map((v) => clean(v));
    }

    // Clean objects recursively
    if (typeof value === "object" && value !== null) {
      const obj = {};
      for (const key in value) obj[key] = clean(value[key]);
      return obj;
    }

    // Return value unchanged if not a string or object
    return value;
  };

  // Clean request body, query params, and route params
  req.body = clean(req.body);
  req.query = clean(req.query);
  req.params = clean(req.params);

  next(); // Pass control to next middleware
};


// Basic XSS Protection Headers


// Adds headers that block reflected XSS attacks
const xssProtection = (req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block"); // Enable XSS blocking mode
  res.setHeader("X-Content-Type-Options", "nosniff"); // Prevent MIME-type sniffing
  next();
};


// DoS Attack Detection (Logging only)


// Logs IP and route for monitoring suspicious traffic
const detectDoS = (req, res, next) => {
  console.log(`Request from IP: ${req.ip} → ${req.path}`);
  next();
};


// Data Validators


// Validates email format and length
const validateEmail = (email) => {
  return validator.isEmail(email) && validator.isLength(email, { max: 255 });
};

// Validates strong password requirements
const validatePassword = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 8, // Minimum length
    minLowercase: 1, // At least one lowercase letter
    minUppercase: 1, // At least one uppercase letter
    minNumbers: 1, // At least one number
    minSymbols: 1 // At least one special character
  });
};

// Validates Egyptian National ID (14 digits)
const validateNationalId = (nationalId) => {
  return validator.isNumeric(nationalId) && validator.isLength(nationalId, { min: 14, max: 14 });
};

// Validates phone number for any country
const validatePhoneNumber = (phoneNumber) => {
  return validator.isMobilePhone(phoneNumber, "any");
};


// Allowed Content Types


// Rejects requests with unsupported Content-Type headers
const validateContentType = (req, res, next) => {
  const allowed = ["application/json", "application/x-www-form-urlencoded", "multipart/form-data"];

  // Enforce for POST and PUT methods only
  if (["POST", "PUT"].includes(req.method)) {
    const type = req.headers["content-type"];
    if (!type || !allowed.some((t) => type.includes(t))) {
      return res.status(415).json({ error: "Unsupported Media Type" });
    }
  }

  next(); // Continue processing
};


module.exports = {
  authLimiter,
  generalLimiter,
  helmetConfig,
  hppProtection: hpp(),
  sanitizeInput,
  validateEmail,
  validatePassword,
  validateNationalId,
  validatePhoneNumber,
  xssProtection,
  detectDoS,
  validateContentType
};
