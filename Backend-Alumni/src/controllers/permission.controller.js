const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");
const Role = require("../models/Role");

// 🔴 START OF LOGGER IMPORT - ADDED THIS
const { logger, securityLogger } = require("../utils/logger");
// 🔴 END OF LOGGER IMPORT

const getAllPermissions = async (req, res) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Get all permissions request initiated", {
      userId: req.user?.id,
      userType: req.user?.["user-type"],
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    console.log("🔹 Fetching all permissions...");

    const permissions = await Permission.findAll();

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Permissions retrieved successfully", {
      userId: req.user?.id,
      userType: req.user?.["user-type"],
      permissionsCount: permissions.length,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    console.log(`🔹 Total permissions fetched: ${permissions.length}`);

    // Log detailed permission info for debugging (console only)
    permissions.forEach((p) => {
      console.log(
        `Permission: ${p.name}, can-view: ${p["can-view"]}, can-edit: ${p["can-edit"]}, can-delete: ${p["can-delete"]}, can-add: ${p["can-add"]}`
      );
    });

    // 🔴 START OF LOGGING - ADDED THIS
    // Log permission summary for security monitoring
    const permissionSummary = permissions.map((p) => ({
      name: p.name,
      canView: p["can-view"],
      canEdit: p["can-edit"],
      canDelete: p["can-delete"],
      canAdd: p["can-add"],
    }));

    logger.debug("Permissions details", {
      userId: req.user?.id,
      permissionsSummary: permissionSummary,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    return res.json({
      status: "success",
      message: "All permissions with their details fetched successfully",
      data: permissions,
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error fetching permissions", {
      userId: req.user?.id,
      userType: req.user?.["user-type"],
      error: error.message,
      stack: error.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    console.error("❌ Error fetching permissions:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch permissions",
      error: error.message,
    });
  }
};

module.exports = { getAllPermissions };
