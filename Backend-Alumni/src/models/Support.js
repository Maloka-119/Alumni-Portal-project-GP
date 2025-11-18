const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Support = sequelize.define(
  "Support",
  {
    support_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    category: {
      type: DataTypes.ENUM("Complaint", "Suggestion"),
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    details: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    graduate_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    tableName: "Support",
    timestamps: false,
  }
);

// العلاقة مع User (الخريج)
Support.belongsTo(User, { foreignKey: "graduate_id" });
User.hasMany(Support, { foreignKey: "graduate_id" });

module.exports = Support;
