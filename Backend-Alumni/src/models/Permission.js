const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Permission = sequelize.define('Permission', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  'can-view': { type: DataTypes.BOOLEAN },
  'can-edit': { type: DataTypes.BOOLEAN },
  'can-delete': { type: DataTypes.BOOLEAN }
}, { tableName: 'Permission', timestamps: false });

module.exports = Permission;
