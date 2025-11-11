const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Notification = sequelize.define('Notification', {
  notification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  receiverId: { 
    type: DataTypes.INTEGER, 
    field: 'receiver-id',
    references: { model: User, key: 'id' },
    allowNull: false
  },
  senderId: { 
    type: DataTypes.INTEGER, 
    field: 'sender-id',
    references: { model: User, key: 'id' },
    allowNull: true // null for system notifications
  },
  type: { 
    type: DataTypes.ENUM(
      'add_user',
      'accept_request',
      'added_to_group',
      'like',
      'comment',
      'reply',
      'edit_comment',
      'delete_comment',
      'message',
      'announcement',
      'role_update'
    ),
    allowNull: false
  },
  message: { 
    type: DataTypes.STRING,
    allowNull: false
  },
  isRead: { 
    type: DataTypes.BOOLEAN, 
    field: 'is-read',
    defaultValue: false
  },
  createdAt: { 
    type: DataTypes.DATE, 
    field: 'created-at',
    defaultValue: DataTypes.NOW
  }
}, { 
  tableName: 'Notification', 
  timestamps: false 
});

// Associations
Notification.belongsTo(User, { foreignKey: 'receiver-id', as: 'receiver' });
Notification.belongsTo(User, { foreignKey: 'sender-id', as: 'sender' });

module.exports = Notification;
