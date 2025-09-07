const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Staff = require('./Staff');
const Role = require('./Role');

const StaffRole = sequelize.define('StaffRole', {
  staff_id: { type: DataTypes.INTEGER, references: { model: Staff, key: 'staff_id' } },
  role_id: { type: DataTypes.INTEGER, references: { model: Role, key: 'id' } }
}, { tableName: 'StaffRole', timestamps: false });

Staff.belongsToMany(Role, { through: StaffRole, foreignKey: 'staff_id' });
Role.belongsToMany(Staff, { through: StaffRole, foreignKey: 'role_id' });

module.exports = StaffRole;
