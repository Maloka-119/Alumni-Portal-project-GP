const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Review = sequelize.define('Review', {
  review_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  content: { type: DataTypes.STRING },
  'user-id': { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
  'in-landing': { type: DataTypes.BOOLEAN }
}, { tableName: 'Review', timestamps: false });

Review.belongsTo(User, { foreignKey: 'user-id' });
module.exports = Review;
