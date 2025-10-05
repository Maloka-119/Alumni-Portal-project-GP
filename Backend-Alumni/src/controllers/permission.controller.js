// src/controllers/permission.controller.js
const Permission = require("../models/Permission");

const seedPermissions = async (req, res) => {
  try {
    const permissionsData = [
      {
        name: "manage_users",
        "can-view": true,
        "can-edit": true,
        "can-delete": true,
      },
      {
        name: "manage_posts",
        "can-view": true,
        "can-edit": true,
        "can-delete": true,
      },
      {
        name: "view_reports",
        "can-view": true,
        "can-edit": false,
        "can-delete": false,
      },
      {
        name: "handle_complaints",
        "can-view": true,
        "can-edit": true,
        "can-delete": false,
      },
      {
        name: "approve_graduates",
        "can-view": true,
        "can-edit": true,
        "can-delete": false,
      },
    ];

    // مسح الجدول قبل الإضافة (اختياري)
    await Permission.destroy({ where: {} });

    // إضافة البيانات
    await Permission.bulkCreate(permissionsData);

    res.status(201).json({
      status: "success",
      message: "Permissions seeded successfully!",
      data: permissionsData,
    });
  } catch (error) {
    console.error("Error seeding permissions:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to seed permissions",
      error: error.message,
    });
  }
};

const getAllPermissions = async (req, res) => {
  try {
    // ✅ نجيب كل الصلاحيات
    const permissions = await Permission.findAll({
      attributes: ["id", "name", "can-view", "can-edit", "can-delete"],
      order: [["id", "ASC"]],
    });

    if (!permissions || permissions.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No permissions found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "All permissions fetched successfully",
      data: permissions,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch permissions",
    });
  }
};

module.exports = {
  getAllPermissions,
  seedPermissions,
};
