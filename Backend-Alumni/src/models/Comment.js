const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Comment = sequelize.define(
  "Comment",
  {
    comment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    content: { type: DataTypes.STRING },
    "post-id": {
      type: DataTypes.INTEGER,
      references: { model: "Post", key: "post_id" }, 
    },
    "author-id": {
      type: DataTypes.INTEGER,
      references: { model: "User", key: "id" }, 
    },
      "parent-comment-id": {
      type: DataTypes.INTEGER,
      references: { model: "Comment", key: "comment_id" }, // Self-reference for replies
      allowNull: true, // null for top-level comments
    },  
    "created-at": { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    edited: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "Comment", timestamps: false }
);

module.exports = Comment;
