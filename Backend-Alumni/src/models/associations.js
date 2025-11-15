const Post = require("./Post");
const User = require("./User");
const Comment = require("./Comment");
const Like = require("./Like");
const Notification = require("./Notification");

// 🟢 Post ↔ User
Post.belongsTo(User, { foreignKey: "author-id" });
User.hasMany(Post, { foreignKey: "author-id" });

// 🟢 Post ↔ Comment
Post.hasMany(Comment, { foreignKey: "post-id" });
Comment.belongsTo(Post, { foreignKey: "post-id" });

// 🟢 Post ↔ Like
Post.hasMany(Like, { foreignKey: "post-id" });
Like.belongsTo(Post, { foreignKey: "post-id" });

// 🟢 Comment ↔ User
Comment.belongsTo(User, { foreignKey: "author-id" });
User.hasMany(Comment, { foreignKey: "author-id" });

// 🟢 Like ↔ User - التصحيح هنا
Like.belongsTo(User, {
  foreignKey: "user-id", // غير من "author-id" إلى "user-id"
  targetKey: "id",
});
User.hasMany(Like, {
  foreignKey: "user-id", // غير من "author-id" إلى "user-id"
  sourceKey: "id",
});

// 🟢 User ↔ Notification
User.hasMany(Notification, {
  foreignKey: "receiver-id",
  as: "receivedNotifications",
});
User.hasMany(Notification, {
  foreignKey: "sender-id",
  as: "sentNotifications",
});

module.exports = {
  Post,
  User,
  Comment,
  Like,
  Notification,
};
