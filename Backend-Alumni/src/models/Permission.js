const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Permission = sequelize.define(
  "Permission",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
  },
  { tableName: "Permission", timestamps: false }
);

module.exports = Permission;
