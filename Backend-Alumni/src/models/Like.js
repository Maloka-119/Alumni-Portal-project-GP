const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Post = require('./Post');
const User = require('./User');

const Like = sequelize.define('Like', {
  like_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  'post-id': { type: DataTypes.INTEGER, references: { model: Post, key: 'post_id' } },
  'user-id': { type: DataTypes.INTEGER, references: { model: User, key: 'id' } }
}, { tableName: 'Like', timestamps: false });

Like.belongsTo(Post, { foreignKey: 'post-id' });
Like.belongsTo(User, { foreignKey: 'user-id' });

module.exports = Like;
