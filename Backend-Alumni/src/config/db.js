// src/config/db.js
const { Sequelize } = require("sequelize");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});


const modelsDir = path.join(__dirname, "../models");
fs.readdirSync(modelsDir).forEach((file) => {
  if (file.endsWith(".js")) {
    require(path.join(modelsDir, file))(sequelize);
  }
});


sequelize
  .sync({ alter: true })
  .then(() => console.log("All models synchronized with database"))
  .catch((err) => console.error("Error syncing database:", err));

module.exports = sequelize;
