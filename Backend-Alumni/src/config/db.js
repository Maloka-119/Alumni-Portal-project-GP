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
sequelize
  .authenticate()
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => console.error("❌ Error connecting to database:", err));

// مزامنة الجداول
sequelize
  .sync({ alter: true })
  .then(() => console.log("✅ All models synchronized with database"))
  .catch((err) => console.error("❌ Error syncing database:", err));

module.exports = sequelize;
