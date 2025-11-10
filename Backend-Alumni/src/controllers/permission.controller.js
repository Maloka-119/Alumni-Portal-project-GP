const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");
const Role = require("../models/Role");

const getAllPermissions = async (req, res) => {
  try {
    console.log("🔹 Fetching all permissions...");

    const permissions = await Permission.findAll();

    console.log(`🔹 Total permissions fetched: ${permissions.length}`);
    permissions.forEach((p) => {
      console.log(
        `Permission: ${p.name}, can-view: ${p["can-view"]}, can-edit: ${p["can-edit"]}, can-delete: ${p["can-delete"]}, can-add: ${p["can-add"]}`
      );
    });

    return res.json({
      status: "success",
      message: "All permissions with their details fetched successfully",
      data: permissions,
    });
  } catch (error) {
    console.error("❌ Error fetching permissions:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch permissions",
      error: error.message,
    });
  }
};

module.exports = { getAllPermissions };
