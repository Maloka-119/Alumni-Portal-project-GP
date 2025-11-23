const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Group = sequelize.define(
  "Group",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "group-name": { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    "created-date": { type: DataTypes.DATE },
    "group-image": { type: DataTypes.STRING },
    // الحقول الجديدة
    // src/models/Group.js
    faculty_code: {
      type: DataTypes.STRING,
      allowNull: false, // غير لـ true مؤقتاً
    },
    graduation_year: {
      type: DataTypes.INTEGER,
      allowNull: false, // غير لـ true مؤقتاً
    },
  },
  { tableName: "Group", timestamps: false }
);

module.exports = Group;
