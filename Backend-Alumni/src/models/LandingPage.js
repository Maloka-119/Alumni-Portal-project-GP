const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LandingPage = sequelize.define('LandingPage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING }
}, { tableName: 'LandingPage', timestamps: false });

module.exports = LandingPage;
