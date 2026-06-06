const winston = require("winston");
const fs = require("fs");
const path = require("path");


const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}


const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);


const logger = winston.createLogger({
  level: "info",
  format: logFormat,
  defaultMeta: { service: "alumni-portal" },
  transports: [
  
    new winston.transports.File({ 
      filename: path.join(logsDir, "error.log"), 
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
  
    new winston.transports.File({ 
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880,
      maxFiles: 5
    }),
    // لوجات الأمان
    new winston.transports.File({ 
      filename: path.join(logsDir, "security.log"),
      level: "warn",
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});


if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}


const securityLogger = {
  // Add this method
  warn: (message, meta = {}) => {
    logger.warn(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  failedLogin: (ip, email, reason = "Invalid credentials") => {
    logger.warn("Failed login attempt", { 
      ip, 
      email: email.substring(0, 3) + "***", 
      reason,
      timestamp: new Date().toISOString()
    });
  },

  successfulLogin: (ip, email, userType) => {
    logger.info("Successful login", { 
      ip, 
      email: email.substring(0, 3) + "***",
      userType,
      timestamp: new Date().toISOString()
    });
  },

  registration: (ip, email, userType, status) => {
    logger.info("User registration", { 
      ip, 
      email: email.substring(0, 3) + "***",
      userType,
      status,
      timestamp: new Date().toISOString()
    });
  },

  passwordResetRequest: (ip, email) => {
    logger.info("Password reset requested", { 
      ip, 
      email: email.substring(0, 3) + "***",
      timestamp: new Date().toISOString()
    });
  },

  passwordResetSuccess: (ip, email) => {
    logger.info("Password reset successful", { 
      ip, 
      email: email.substring(0, 3) + "***",
      timestamp: new Date().toISOString()
    });
  },

  sqlInjectionAttempt: (ip, query) => {
    logger.error("SQL injection attempt detected", { 
      ip, 
      query: query.substring(0, 100), 
      timestamp: new Date().toISOString()
    });
  },

  xssAttempt: (ip, input) => {
    logger.error("XSS attempt detected", { 
      ip, 
      input: input.substring(0, 100),
      timestamp: new Date().toISOString()
    });
  },

  dosAttack: (ip) => {
    logger.error("Possible DOS attack detected", { 
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = { logger, securityLogger };