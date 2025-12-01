// src/config/db.js
const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

console.log("DATABASE_URL:", process.env.DATABASE_URL);

// إنشاء الاتصال بقاعدة البيانات
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

// تجربة الاتصال
// sequelize
//   .authenticate()
//   .then(() => console.log("Database connected successfully"))
//   .catch((err) => console.error("Error connecting to database:", err));

// Note: Database sync is handled in server.js to avoid duplicate sync calls
// and to have better error handling for constraint and ENUM errors

module.exports = sequelize;
