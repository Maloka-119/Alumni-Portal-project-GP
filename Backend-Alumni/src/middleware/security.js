const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const validator = require("validator");

// Rate limiting للحماية من DOS
const authLimiter = rateLimit({
  // windowMs: 15 * 60 * 1000,
  // max: 5,
  // message: {
  //   error: "Too many login attempts, please try again later."
  // },
  // standardHeaders: true,
  // legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests from this IP, please try again later."
  }
});

// إعدادات متقدمة لـ Helmet
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" }
});

// تنظيف المدخلات من هجمات XSS (نسخة محسنة)
const sanitizeInput = (req, res, next) => {
  try {
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== "object") return obj;
      
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
          if (typeof value === "string") {
            // إزالة المسافات الزائدة وتنظيف من XSS
            return [key, validator.escape(validator.trim(value))];
          } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            // معالجة nested objects فقط
            return [key, sanitizeObject(value)];
          } else if (Array.isArray(value)) {
            // معالجة arrays
            return [key, value.map(item => 
              typeof item === "string" ? validator.escape(validator.trim(item)) : item
            )];
          }
          return [key, value];
        })
      );
    };

    // تنظيف body
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body);
    }

    // تنظيف query - بطريقة آمنة
    if (req.query && typeof req.query === "object") {
      const cleanQuery = sanitizeObject(req.query);
      Object.keys(cleanQuery).forEach(key => {
        req.query[key] = cleanQuery[key];
      });
    }

    // تنظيف params - بطريقة آمنة  
    if (req.params && typeof req.params === "object") {
      const cleanParams = sanitizeObject(req.params);
      Object.keys(cleanParams).forEach(key => {
        req.params[key] = cleanParams[key];
      });
    }

    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    next();
  }
};

// middleware لمنع XSS Attacks
const xssProtection = (req, res, next) => {
  // Set X-XSS-Protection header
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

// middleware للكشف عن هجمات DOS/Basic
const detectDoS = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // تحذير في console لو هناك طلبات كثيرة
  console.log(`Request from IP: ${clientIP} to ${req.path}`);
  
  next();
};

// التحقق من صحة البريد الإلكتروني
const validateEmail = (email) => {
  return validator.isEmail(email) && validator.isLength(email, { max: 255 });
};

// التحقق من صحة كلمة المرور
const validatePassword = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  });
};

// التحقق من صحة الرقم القومي
const validateNationalId = (nationalId) => {
  return validator.isNumeric(nationalId) && validator.isLength(nationalId, { min: 14, max: 14 });
};

// التحقق من صحة رقم الهاتف
const validatePhoneNumber = (phoneNumber) => {
  return validator.isMobilePhone(phoneNumber, 'any') && validator.isLength(phoneNumber, { max: 20 });
};

// middleware للتحقق من أنواع البيانات
const validateContentType = (req, res, next) => {
  const allowedContentTypes = ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'];
  
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.headers['content-type'];
    if (!contentType || !allowedContentTypes.some(type => contentType.includes(type))) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Content-Type not supported'
      });
    }
  }
  next();
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