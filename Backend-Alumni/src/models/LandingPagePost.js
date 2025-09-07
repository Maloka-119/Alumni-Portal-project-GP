const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const LandingPage = require('./LandingPage');
const Post = require('./Post');

const LandingPagePost = sequelize.define('LandingPagePost', {
  landing_id: { type: DataTypes.INTEGER, references: { model: LandingPage, key: 'id' } },
  post_id: { type: DataTypes.INTEGER, references: { model: Post, key: 'post_id' } }
}, { tableName: 'LandingPagePost', timestamps: false });

LandingPage.belongsToMany(Post, { through: LandingPagePost, foreignKey: 'landing_id' });
Post.belongsToMany(LandingPage, { through: LandingPagePost, foreignKey: 'post_id' });

module.exports = LandingPagePost;
