const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Post = sequelize.define('Post', {
  post_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category: {
  type: DataTypes.ENUM(
    "Event",
    "Job opportunity",
    "News",
    "Internship",
    "Success story",
    "General"
  ),
  allowNull: false,
  defaultValue: "General",
}

,
  content: { type: DataTypes.TEXT },
  'created-at': { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  'author-id': { type: DataTypes.INTEGER },
  'group-id': { type: DataTypes.INTEGER },
  'in-landing': { type: DataTypes.BOOLEAN, defaultValue: false }

}, { tableName: 'Post', timestamps: false });

module.exports = Post;
