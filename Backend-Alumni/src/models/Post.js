const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Group = require('./Group');

const Post = sequelize.define('Post', {
  post_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category: { type: DataTypes.STRING },
  content: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
  'created-at': { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  'author-id': { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
  'group-id': { type: DataTypes.INTEGER, references: { model: Group, key: 'id' } },
  'in-landing': { type: DataTypes.BOOLEAN, defaultValue: false }

}, { tableName: 'Post', timestamps: false });

Post.belongsTo(User, { foreignKey: 'author-id' });
Post.belongsTo(Group, { foreignKey: 'group-id' });

module.exports = Post;
