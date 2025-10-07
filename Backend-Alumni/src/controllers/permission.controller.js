// src/controllers/permission.controller.js
const Permission = require("../models/Permission");

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
};
