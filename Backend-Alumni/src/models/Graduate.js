const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Graduate = sequelize.define(
  "Graduate",
  {
    graduate_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: User,
        key: "id",
      },
    },
    bio: { type: DataTypes.STRING },
    "linkedln-link": { type: DataTypes.STRING },
    "current-job": { type: DataTypes.STRING, allowNull: true },
    "cv-url": { type: DataTypes.STRING },
    faculty: { type: DataTypes.STRING },
    "profile-picture-url": { type: DataTypes.STRING },
    "graduation-year": { type: DataTypes.INTEGER },
    skills: { type: DataTypes.STRING },
  },
  {
    tableName: "Graduate",
    timestamps: false,
  }
);

Graduate.belongsTo(User, { foreignKey: "graduate_id" });

module.exports = Graduate;
