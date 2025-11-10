const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Role = require("./Role");
const Permission = require("./Permission");

// تعريف جدول العلاقة
const RolePermission = sequelize.define(
  "RolePermission",
  {
    role_id: {
      type: DataTypes.INTEGER,
      references: { model: Role, key: "id" },
      allowNull: false,
    },
    permission_id: {
      type: DataTypes.INTEGER,
      references: { model: Permission, key: "id" },
      allowNull: false,
    },
    "can-view": { type: DataTypes.BOOLEAN, defaultValue: false },
    "can-edit": { type: DataTypes.BOOLEAN, defaultValue: false },
    "can-delete": { type: DataTypes.BOOLEAN, defaultValue: false },
    "can-add": { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "RolePermission", timestamps: false }
);

// علاقات M:N
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "role_id",
  otherKey: "permission_id",
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permission_id",
  otherKey: "role_id",
});

// علاقات 1:N للوصول للبيانات بسهولة
Role.hasMany(RolePermission, { foreignKey: "role_id" });
Permission.hasMany(RolePermission, { foreignKey: "permission_id" });
RolePermission.belongsTo(Role, { foreignKey: "role_id" });
RolePermission.belongsTo(Permission, { foreignKey: "permission_id" });

module.exports = RolePermission;
