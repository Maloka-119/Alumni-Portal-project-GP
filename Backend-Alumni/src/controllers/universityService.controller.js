const UniversityService = require("../models/UniversityService");
const asyncHandler = require("express-async-handler");
const { Op } = require("sequelize");
const checkStaffPermission = require("../utils/permissionChecker");
const { logger } = require("../utils/logger");

// Helper to truncate long text in logs
const truncateText = (text, maxLength = 300) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// @desc    Get all active university services (Public + Graduates)
// @access  Public
const getAllServices = asyncHandler(async (req, res) => {
  logger.info("Fetching all active university services (public)", {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  const services = await UniversityService.findAll({
    where: { deletedAt: null },
    order: [["title", "ASC"]],
  });

  logger.info("Active university services retrieved", { count: services.length });

  res.status(200).json({
    success: true,
    count: services.length,
    data: services,
  });
});

// @desc    Get all services including soft-deleted ones (Admin panel)
// @access  Admin + Staff (with view permission)
// @middleware protect
const getAllServicesAdmin = asyncHandler(async (req, res) => {
  const user = req.user;

  logger.info("Fetching all university services (admin panel)", {
    userId: user.id,
    userType: user["user-type"],
  });

  // Staff needs explicit "view" permission
  if (user["user-type"] === "staff") {
    const hasPermission = await checkStaffPermission(
      user.id,
      "University Services",
      "view"
    );

    if (!hasPermission) {
      logger.warn("Staff denied access - missing view permission for University Services", {
        userId: user.id,
      });
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view university services.",
      });
    }
  }

  const services = await UniversityService.findAll({
    paranoid: false, // includes soft-deleted records
    order: [["title", "ASC"]],
  });

  logger.info("All university services retrieved (admin)", {
    userId: user.id,
    count: services.length,
    includesDeleted: services.some((s) => s.deletedAt !== null),
  });

  res.status(200).json({
    success: true,
    count: services.length,
    data: services,
  });
});

// @desc    Create a new university service
// @access  Admin + Staff (with add permission)
// @middleware protect
const createService = asyncHandler(async (req, res) => {
  const user = req.user;
  const { title, pref, details } = req.body;

  logger.info("Attempting to create new university service", {
    userId: user.id,
    userType: user["user-type"],
    title,
    pref,
  });

  // Permission check for staff
  if (user["user-type"] === "staff") {
    const hasPermission = await checkStaffPermission(
      user.id,
      "University Services",
      "add"
    );
    if (!hasPermission) {
      logger.warn("Staff denied - no add permission for University Services", {
        userId: user.id,
      });
      return res.status(403).json({
        success: false,
        message: "You do not have permission to add university services.",
      });
    }
  }

  // Validation
  if (!title || !pref) {
    return res.status(400).json({
      success: false,
      message: "Title and pref are required.",
    });
  }

  const existing = await UniversityService.findOne({ where: { pref } });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: "This pref is already in use.",
    });
  }

  const service = await UniversityService.create({
    title: title.trim(),
    pref: pref.trim(),
    details: details?.trim() || null,
  });

  logger.info("University service created successfully", {
    serviceId: service.id,
    userId: user.id,
    userType: user["user-type"],
    title: service.title,
    pref: service.pref,
    details: truncateText(service.details),
    full_details: service.details,
  });

  res.status(201).json({
    success: true,
    data: service,
  });
});

// @desc    Update an existing university service
// @access  Admin + Staff (with edit permission)
// @middleware protect
const updateService = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const { title, pref, details } = req.body;

  logger.info("Attempting to update university service", {
    serviceId: id,
    userId: user.id,
    userType: user["user-type"],
    title,
    pref,
  });

  if (user["user-type"] === "staff") {
    const hasPermission = await checkStaffPermission(
      user.id,
      "University Services",
      "edit"
    );
    if (!hasPermission) {
      logger.warn("Staff denied - no edit permission for University Services", {
        userId: user.id,
      });
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit university services.",
      });
    }
  }

  const service = await UniversityService.findByPk(id);
  if (!service) {
    logger.warn("University service not found", { serviceId: id });
    return res.status(404).json({
      success: false,
      message: "Service not found.",
    });
  }

  // Store old data for logging
  const oldData = {
    title: service.title,
    pref: service.pref,
    details: service.details,
  };



  // Update only provided fields
  if (title !== undefined) service.title = title.trim();
  if (pref !== undefined) {
    const exists = await UniversityService.findOne({
      where: { pref: pref.trim(), id: { [Op.ne]: id } },
    });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "This pref is already taken by another service.",
      });
    }
    service.pref = pref.trim();
  }
  if (details !== undefined) service.details = details.trim() || null;

  await service.save();

  logger.info("University service updated successfully", {
    serviceId: service.id,
    userId: user.id,
    userType: user["user-type"],
    changes: {
      title: oldData.title !== service.title,
      pref: oldData.pref !== service.pref,
      details: oldData.details !== service.details,
    },
    old: oldData,
    new: {
      title: service.title,
      pref: service.pref,
      details: truncateText(service.details),
      full_details: service.details,
    },
  });

  res.status(200).json({
    success: true,
    data: service,
  });
});

// @desc    Soft delete a university service
// @access  Admin + Staff (with delete permission)
// @middleware protect
const deleteService = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  logger.info("Attempting to soft delete university service", {
    serviceId: id,
    userId: user.id,
    userType: user["user-type"],
  });

  if (user["user-type"] === "staff") {
    const hasPermission = await checkStaffPermission(
      user.id,
      "University Services",
      "delete"
    );
    if (!hasPermission) {
      logger.warn("Staff denied - no delete permission for University Services", {
        userId: user.id,
      });
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete university services.",
      });
    }
  }

  const service = await UniversityService.findByPk(id);
  if (!service) {
    return res.status(404).json({
      success: false,
      message: "Service not found.",
    });
  }

  const deletedData = {
    id: service.id,
    title: service.title,
    pref: service.pref,
    details: service.details,
  };

  await service.destroy(); // Soft delete (paranoid mode)

  logger.info("University service soft deleted successfully", {
    ...deletedData,
    userId: user.id,
    userType: user["user-type"],
    details: truncateText(deletedData.details),
    full_details: deletedData.details,
  });

  res.status(200).json({
    success: true,
    message: "Service has been successfully soft deleted.",
  });
});

module.exports = {
  getAllServices,
  getAllServicesAdmin,
  createService,
  updateService,
  deleteService,
};