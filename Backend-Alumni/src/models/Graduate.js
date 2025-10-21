const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const Invitation = require("./Invitation");
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
    "current-job": { type: DataTypes.STRING, allowNull: true },
    "cv-url": { type: DataTypes.STRING },
    faculty: { type: DataTypes.STRING },
    "profile-picture-url": { type: DataTypes.STRING },
    "graduation-year": { type: DataTypes.INTEGER },
    skills: { type: DataTypes.STRING },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    show_cv: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
 "status-to-login": { type: DataTypes.ENUM("active", "inactive","rejected") },
  },
  {
    tableName: "Graduate",
    timestamps: false,
  }
);

Graduate.belongsTo(User, { foreignKey: "graduate_id" });
User.hasOne(Graduate, { foreignKey: "graduate_id" });
// العلاقة بين Graduate والدعوات (عشان نقدر نعمل include)
Graduate.hasMany(Invitation, {
  foreignKey: "receiver_id",
  as: "pendingInvitation",
});
module.exports = Graduate;
