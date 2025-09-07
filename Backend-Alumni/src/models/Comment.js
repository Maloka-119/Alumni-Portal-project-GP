const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Post = require('./Post');
const User = require('./User');

const Comment = sequelize.define('Comment', {
  comment_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  content: { type: DataTypes.STRING },
  'post-id': { type: DataTypes.INTEGER, references: { model: Post, key: 'post_id' } },
  'author-id': { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
  'created-at': { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'Comment', timestamps: false });

Comment.belongsTo(Post, { foreignKey: 'post-id' });
Comment.belongsTo(User, { foreignKey: 'author-id' });

module.exports = Comment;
