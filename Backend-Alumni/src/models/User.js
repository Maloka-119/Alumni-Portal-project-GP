const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "first-name": { type: DataTypes.STRING },
    "last-name": { type: DataTypes.STRING },
    "national-id": { type: DataTypes.STRING, unique: true },
    email: { type: DataTypes.STRING, unique: true },
    phoneNumber: { type: DataTypes.STRING, field: "phone-number" },
    "hashed-password": { type: DataTypes.STRING },
    "birth-date": { type: DataTypes.DATE },
    "user-type": { type: DataTypes.ENUM("graduate", "staff", "admin") },
    "verification-code": { type: DataTypes.STRING, allowNull: true },
    "verification-code-expires": { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "User",
    timestamps: false,
  }
);

module.exports = User;
