const xss = require('xss-clean');
const validator = require('validator');

// تنظيف البيانات من هجمات XSS
const xssClean = xss();

// وسيط للتحقق من المدخلات وتنظيفها
const sanitizeInput = (req, res, next) => {
  // تنظيف query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = validator.escape(validator.trim(req.query[key]));
      }
    });
  }

  // تنظيف body parameters
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validator.escape(validator.trim(req.body[key]));
      }
    });
  }

  // تنظيف params
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = validator.escape(validator.trim(req.params[key]));
      }
    });
  }

  next();
};

// التحقق من محتوى JSON
const validateJson = (req, res, next) => {
  if (req.is('application/json')) {
    try {
      JSON.parse(JSON.stringify(req.body));
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }
  } else {
    next();
  }
};

module.exports = {
  xssClean,
  sanitizeInput,
  validateJson
};