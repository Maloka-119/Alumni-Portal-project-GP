const Post = require("./Post");
const User = require("./User");
const Comment = require("./Comment");
const Like = require("./Like");
const Notification = require("./Notification");
const Role = require("./Role");
const Permission = require("./Permission");
const RolePermission = require("./RolePermission");
const Staff = require("./Staff");
const StaffRole = require("./StaffRole");

//  Post ↔ User
Post.belongsTo(User, { foreignKey: "author-id" });
User.hasMany(Post, { foreignKey: "author-id" });

//  Post ↔ Comment
Post.hasMany(Comment, { foreignKey: "post-id" });
Comment.belongsTo(Post, { foreignKey: "post-id" });

// Post ↔ Like
Post.hasMany(Like, { foreignKey: "post-id" });
Like.belongsTo(Post, { foreignKey: "post-id" });

//  Comment ↔ User
Comment.belongsTo(User, { foreignKey: "author-id" });
User.hasMany(Comment, { foreignKey: "author-id" });


Like.belongsTo(User, {
  foreignKey: "user-id", // غير من "author-id" إلى "user-id"
  targetKey: "id",
});
User.hasMany(Like, {
  foreignKey: "user-id", // غير من "author-id" إلى "user-id"
  sourceKey: "id",
});

//  User ↔ Notification
User.hasMany(Notification, {
  foreignKey: "receiver-id",
  as: "receivedNotifications",
});
User.hasMany(Notification, {
  foreignKey: "sender-id",
  as: "sentNotifications",
});

//  Role ↔ Permission (Many-to-Many through RolePermission)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "role_id",
  otherKey: "permission_id",
  // as: "Permissions",
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permission_id",
  otherKey: "role_id",
  // as: "Roles",
});

//  RolePermission Associations
RolePermission.belongsTo(Role, { foreignKey: "role_id" });
RolePermission.belongsTo(Permission, { foreignKey: "permission_id" });
Role.hasMany(RolePermission, { foreignKey: "role_id" });
Permission.hasMany(RolePermission, { foreignKey: "permission_id" });

//  StaffRole Associations
StaffRole.belongsTo(Staff, { foreignKey: "staff_id" });
StaffRole.belongsTo(Role, { foreignKey: "role_id" });
Staff.hasMany(StaffRole, { foreignKey: "staff_id" });
Role.hasMany(StaffRole, { foreignKey: "role_id" });

module.exports = {
  Post,
  User,
  Comment,
  Like,
  Notification,
  Role,
  Permission,
  RolePermission,
  Staff,
  StaffRole,
};
