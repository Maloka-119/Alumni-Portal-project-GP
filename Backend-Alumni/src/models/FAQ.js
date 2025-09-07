const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FAQ = sequelize.define('FAQ', {
  faq_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  question: { type: DataTypes.STRING },
  answer: { type: DataTypes.STRING }
}, { tableName: 'FAQ', timestamps: false });

module.exports = FAQ;
