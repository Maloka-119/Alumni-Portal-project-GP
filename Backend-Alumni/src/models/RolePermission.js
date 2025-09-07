const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Role = require('./Role');
const Permission = require('./Permission');

const RolePermission = sequelize.define('RolePermission', {
  role_id: { type: DataTypes.INTEGER, references: { model: Role, key: 'id' } },
  permission_id: { type: DataTypes.INTEGER, references: { model: Permission, key: 'id' } }
}, { tableName: 'RolePermission', timestamps: false });

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id' });

module.exports = RolePermission;
