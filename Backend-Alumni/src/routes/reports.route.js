const express = require("express");
const { Sequelize } = require("sequelize");
const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const Role = require("../models/Role");
const StaffRole = require("../models/StaffRole");
const Post = require("../models/Post");
const User = require("../models/User");

const router = express.Router();

// ✳️ ربط العلاقات لو مش معمول قبل كده
Post.belongsTo(User, { foreignKey: "author-id" });
User.hasMany(Post, { foreignKey: "author-id" });

router.get("/reports-stats", async (req, res) => {
  try {
    // 👩‍🎓 إجمالي وعدد حالات الخريجين
    const totalGraduates = await Graduate.count();
    const activeGraduates = await Graduate.count({ where: { status: "active" } });
    const inactiveGraduates = await Graduate.count({ where: { status: "inactive" } });

    const acceptedGraduates = await Graduate.count({ where: { "status-to-login": "accepted" } });
    const pendingGraduates = await Graduate.count({ where: { "status-to-login": "pending" } });
    const rejectedGraduates = await Graduate.count({ where: { "status-to-login": "rejected" } });

    // 👨‍🏫 إجمالي وعدد حالات أعضاء هيئة التدريس
    const totalStaff = await Staff.count();
    const activeStaff = await Staff.count({ where: { "status-to-login": "active" } });
    const inactiveStaff = await Staff.count({ where: { "status-to-login": "inactive" } });

    // 📢 عدد البوستات من كل نوع مستخدم
    const postsByGraduates = await Post.count({
      include: [{ model: User, where: { "user-type": "graduate" }, attributes: [] }],
    });

    const postsByStaff = await Post.count({
      include: [{ model: User, where: { "user-type": "staff" }, attributes: [] }],
    });

    // 🏫 عدد الخريجين في كل كلية
    const graduatesByFaculty = await Graduate.findAll({
      attributes: [
        "faculty",
        [Sequelize.fn("COUNT", Sequelize.col("faculty")), "count"],
      ],
      group: ["faculty"],
      raw: true,
    });

    // 🧑‍🏫 توزيع أعضاء هيئة التدريس حسب الـ Role
    const staffRoles = await StaffRole.findAll({
      include: [{ model: Role, attributes: ["role-name"] }],
      attributes: [
        "role_id",
        [Sequelize.fn("COUNT", Sequelize.col("role_id")), "count"],
      ],
      group: ["role_id", "Role.id"],
    });

    // 📊 نسبة التفاعل العامة
    const totalUsers = totalGraduates + totalStaff;
    const activeUsers = activeGraduates + activeStaff;
    const activePercentage =
      totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : "0.0";

    // ✅ الإحصائيات النهائية بنفس ترتيب الـ frontend المطلوب
    res.status(200).json({
      totalGraduates,
      activeGraduates,
      inactiveGraduates,
      acceptedGraduates,
      pendingGraduates,
      rejectedGraduates,
      totalStaff,
      activeStaff,
      inactiveStaff,
      postsByGraduates,
      postsByStaff,
      graduatesByFaculty,
      staffRoles,
      activePercentage,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
});

module.exports = router;
