const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Notification = sequelize.define('Notification', {
  notification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  content: { type: DataTypes.STRING },
  'is-read': { type: DataTypes.BOOLEAN },
  'user-id': { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
  'created-at': { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'Notification', timestamps: false });

Notification.belongsTo(User, { foreignKey: 'user-id' });
module.exports = Notification;
