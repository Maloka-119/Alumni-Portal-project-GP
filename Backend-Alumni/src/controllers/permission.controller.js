const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");
const Role = require("../models/Role");
const { logger, securityLogger } = require("../utils/logger");

/**
 * Get all permissions with their details
 * @route GET /api/permissions
 * @access Private (Admin only)
 */
const getAllPermissions = async (req, res) => {
  try {
    // Log request initiation
    logger.info("Get all permissions request initiated", {
      userId: req.user?.id,
      userType: req.user?.["user-type"],
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

   

    const permissions = await Permission.findAll();

    // Log successful retrieval
    logger.info("Permissions retrieved successfully", {
      userId: req.user?.id,
      userType: req.user?.["user-type"],
      permissionsCount: permissions.length,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

   

    // Log detailed permission info for debugging (console only)
    permissions.forEach((p) => {

    });

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

    return res.json({
      status: "success",
      message: "All permissions with their details fetched successfully",
      data: permissions,
    });
  } catch (error) {
    // Log error
    logger.error("Error fetching permissions", {
      userId: req.user?.id,
      userType: req.user?.["user-type"],
      error: error.message,
      stack: error.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    console.error("❌ Error fetching permissions:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch permissions",
      error: error.message,
    });
  }
};

module.exports = { getAllPermissions };
