const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const LandingPage = require('./LandingPage');
const Review = require('./Review');

const LandingPageReview = sequelize.define('LandingPageReview', {
  landing_id: { type: DataTypes.INTEGER, references: { model: LandingPage, key: 'id' } },
  review_id: { type: DataTypes.INTEGER, references: { model: Review, key: 'review_id' } }
}, { tableName: 'LandingPageReview', timestamps: false });

LandingPage.belongsToMany(Review, { through: LandingPageReview, foreignKey: 'landing_id' });
Review.belongsToMany(LandingPage, { through: LandingPageReview, foreignKey: 'review_id' });

module.exports = LandingPageReview;
