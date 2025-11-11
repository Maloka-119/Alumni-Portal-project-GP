const Post = require("./Post");
const User = require("./User");
const Comment = require("./Comment");
const Like = require("./Like");
const Notification = require("./Notification");

// العلاقات كلها في ملف واحد
Post.belongsTo(User, { foreignKey: "author-id" });
Post.hasMany(Comment, { foreignKey: "post-id" });
Post.hasMany(Like, { foreignKey: "post-id" });

Comment.belongsTo(Post, { foreignKey: "post-id" });
Comment.belongsTo(User, { foreignKey: "author-id" });

Like.belongsTo(Post, { foreignKey: "post-id" });
Like.belongsTo(User, { foreignKey: "author-id" });

User.hasMany(Post, { foreignKey: "author-id" });
User.hasMany(Comment, { foreignKey: "author-id" });
User.hasMany(Like, { foreignKey: "user-id" });
User.hasMany(Notification, { foreignKey: "receiver-id", as: "receivedNotifications" });
User.hasMany(Notification, { foreignKey: "sender-id", as: "sentNotifications" });
