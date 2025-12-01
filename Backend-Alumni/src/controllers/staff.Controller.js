// src/controllers/staff.controller.js
const Staff = require("../models/Staff");
const User = require("../models/User");
const HttpStatusHelper = require("../utils/HttpStatuHelper");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");
const checkStaffPermission = require("../utils/permissionChecker");

// 🔴 START OF LOGGER IMPORT - ADDED THIS
const { logger, securityLogger } = require("../utils/logger");
// 🔴 END OF LOGGER IMPORT

// get all staff with roles
const getAllStaff = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [getAllStaff] START -----", {
    timestamp: new Date().toISOString(),
    user: req.user
      ? { id: req.user.id, type: req.user["user-type"] }
      : "undefined",
  });
  // 🔴 END OF LOGGING

  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.debug("Getting all staff request", {
      userType: req.user?.["user-type"],
      userId: req.user?.id,
    });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!allowedUserTypes.includes(req.user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("ACCESS DENIED in getAllStaff", {
        userType: req.user["user-type"],
        allowedUserTypes,
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
        data: [],
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Staff management",
        "view"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("STAFF PERMISSION DENIED in getAllStaff", {
          userId: req.user.id,
          requiredPermission: "Staff management",
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "error",
          message: "Access denied. You don't have permission to view staff.",
          data: [],
        });
      }
      // 🔴 START OF LOGGING - ADDED THIS
      logger.info("Staff permission check passed", { userId: req.user.id });
      // 🔴 END OF LOGGING
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    const staff = await Staff.findAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "first-name",
            "last-name",
            "national-id",
            "email",
            "phone-number",
            "birth-date",
            "user-type",
          ],
        },
        {
          model: Role,
          attributes: ["role-name"],
          through: { attributes: [] },
        },
      ],
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Staff list fetched successfully", {
      staffCount: staff.length,
      userType: req.user["user-type"],
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [getAllStaff] END SUCCESS -----", {
      staffCount: staff.length,
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: "success",
      message: "All staff fetched successfully with roles",
      data: staff,
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [getAllStaff] Unexpected Error", {
      error: err.message,
      stack: err.stack.substring(0, 200),
      user: req.user
        ? { id: req.user.id, type: req.user["user-type"] }
        : "undefined",
    });
    // 🔴 END OF LOGGING

    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Error fetching staff with roles",
      data: [],
    });
  }
};

// suspend/activate staff
const updateStaffStatus = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [updateStaffStatus] START -----", {
    staffId: req.params.id,
    timestamp: new Date().toISOString(),
    user: req.user
      ? { id: req.user.id, type: req.user["user-type"] }
      : "undefined",
  });
  // 🔴 END OF LOGGING

  try {
    const { id } = req.params;
    const { status } = req.body;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.debug("Update staff status request", {
      staffId: id,
      newStatus: status,
      userType: req.user?.["user-type"],
    });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!allowedUserTypes.includes(req.user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("ACCESS DENIED in updateStaffStatus", {
        userType: req.user["user-type"],
        allowedUserTypes,
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
        data: null,
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Staff management",
        "edit"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("STAFF PERMISSION DENIED in updateStaffStatus", {
          userId: req.user.id,
          staffId: id,
          requiredPermission: "Staff management",
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "error",
          message:
            "Access denied. You don't have permission to update staff status.",
          data: null,
        });
      }
      // 🔴 START OF LOGGING - ADDED THIS
      logger.info("Staff permission check passed", { userId: req.user.id });
      // 🔴 END OF LOGGING
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    // validate
    if (!["active", "inactive"].includes(status)) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Invalid status value in updateStaffStatus", {
        staffId: id,
        status,
        validStatuses: ["active", "inactive"],
      });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: HttpStatusHelper.FAIL,
        message: "Invalid status value. Must be 'active' or 'inactive'.",
        data: null,
      });
    }

    // find staff
    const staff = await Staff.findByPk(id, { include: [{ model: User }] });

    if (!staff) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Staff not found in updateStaffStatus", { staffId: id });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Staff not found",
        data: null,
      });
    }

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Staff found, updating status", {
      staffId: id,
      staffName: `${staff.User["first-name"]} ${staff.User["last-name"]}`,
      oldStatus: staff["status-to-login"],
      newStatus: status,
    });
    // 🔴 END OF LOGGING

    // update status
    staff["status-to-login"] = status;
    await staff.save();

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Staff status updated successfully", {
      staffId: id,
      staffName: `${staff.User["first-name"]} ${staff.User["last-name"]}`,
      newStatus: status,
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [updateStaffStatus] END SUCCESS -----", {
      staffId: id,
      status,
    });
    // 🔴 END OF LOGGING

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: `Staff status updated to ${status} successfully`,
      data: {
        staffId: staff.staff_id,
        fullName: `${staff.User["first-name"]} ${staff.User["last-name"]}`,
        status: staff["status-to-login"],
      },
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [updateStaffStatus] Unexpected Error", {
      staffId: req.params.id,
      error: err.message,
      stack: err.stack.substring(0, 200),
      user: req.user
        ? { id: req.user.id, type: req.user["user-type"] }
        : "undefined",
    });
    // 🔴 END OF LOGGING

    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null,
    });
  }
};

// get staff profile (staff can only access their own profile)
const getStaffProfile = async (req, res) => {
  // 🔴 START OF LOGGING - ADDED THIS
  logger.info("🟢 ----- [getStaffProfile] START -----", {
    timestamp: new Date().toISOString(),
    user: req.user
      ? { id: req.user.id, type: req.user["user-type"] }
      : "undefined",
  });
  // 🔴 END OF LOGGING

  try {
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.debug("Get staff profile request", {
      userId,
      userType: req.user["user-type"],
    });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!allowedUserTypes.includes(req.user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("ACCESS DENIED in getStaffProfile", {
        userType: req.user["user-type"],
        allowedUserTypes,
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
      });
    }

    // 3. لو staff → يتأكد إنه بيسأل على بروفايله الشخصي فقط (من غير صلاحية)
    if (req.user["user-type"] === "staff") {
      // Staff مش محتاج صلاحية علشان يشوف بروفايله
      // بس يتأكد إنه بيسأل على بروفايله هو فقط
      // (الكود الحالي بيشوف بروفايله هو لأن userId = req.user.id)
      // 🔴 START OF LOGGING - ADDED THIS
      logger.info("Staff accessing own profile (no permission needed)", {
        userId,
      });
      // 🔴 END OF LOGGING
    }
    // 4. لو admin → بيتحقق من الصلاحية علشان يشوف أي بروفايل
    else if (req.user["user-type"] === "admin") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Staff management",
        "view"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("ADMIN PERMISSION DENIED in getStaffProfile", {
          userId: req.user.id,
          requiredPermission: "Staff management",
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "error",
          message:
            "Access denied. You don't have permission to view staff profiles.",
        });
      }
      // 🔴 START OF LOGGING - ADDED THIS
      logger.info("Admin permission check passed", { userId: req.user.id });
      // 🔴 END OF LOGGING
    }

    // 5. لو admin مع صلاحية أو staff → اتركه يكمل
    // Find staff record with user details, roles, and permissions
    const staff = await Staff.findByPk(userId, {
      include: [
        {
          model: User,
          attributes: [
            "id",
            "first-name",
            "last-name",
            "national-id",
            "email",
            "phone-number",
            "birth-date",
            "user-type",
          ],
        },
        {
          model: Role,
          through: { attributes: [] },
          attributes: ["id", "role-name"],
          include: [
            {
              model: RolePermission,
              include: [
                {
                  model: Permission,
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!staff) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Staff profile not found", { userId });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Staff profile not found",
      });
    }

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Staff profile found", {
      userId,
      staffName: `${staff.User["first-name"]} ${staff.User["last-name"]}`,
      rolesCount: staff.Roles.length,
    });
    // 🔴 END OF LOGGING

    // Format the response data with roles and permissions
    const profileData = {
      fullName: `${staff.User["first-name"]} ${staff.User["last-name"]}`,
      nationalId: staff.User["national-id"],
      workId: staff.staff_id,
      email: staff.User.email,
      phoneNumber: staff.User["phone-number"],
      birthDate: staff.User["birth-date"],
      userType: staff.User["user-type"],
      status: staff["status-to-login"],
      roles: staff.Roles.map((role) => ({
        role_id: role.id,
        name: role["role-name"],
        permissions: role.RolePermissions.map((rp) => ({
          name: rp.Permission.name,
          "can-view": rp["can-view"] || false,
          "can-edit": rp["can-edit"] || false,
          "can-delete": rp["can-delete"] || false,
          "can-add": rp["can-add"] || false,
        })),
      })),
    };

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Staff profile data formatted successfully", {
      userId,
      rolesCount: profileData.roles.length,
      permissionsCount: profileData.roles.reduce(
        (sum, role) => sum + role.permissions.length,
        0
      ),
    });
    // 🔴 END OF LOGGING

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("🟢 ----- [getStaffProfile] END SUCCESS -----", { userId });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Staff profile retrieved successfully",
      data: profileData,
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("❌ [getStaffProfile] Unexpected Error", {
      error: error.message,
      stack: error.stack.substring(0, 200),
      user: req.user
        ? { id: req.user.id, type: req.user["user-type"] }
        : "undefined",
    });
    // 🔴 END OF LOGGING

    console.error("Error fetching staff profile:", error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: "Failed to fetch staff profile: " + error.message,
    });
  }
};

module.exports = { getAllStaff, updateStaffStatus, getStaffProfile };
