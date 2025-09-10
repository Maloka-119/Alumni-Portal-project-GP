const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Staff = sequelize.define(
  "Staff",
  {
    staff_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: User,
        key: "id",
      },
    },
    "status-to-login": { type: DataTypes.ENUM("active", "inactive") },
  },
  {
    tableName: "Staff",
    timestamps: false,
  }
);

Staff.belongsTo(User, { foreignKey: "staff_id" });

module.exports = Staff;
