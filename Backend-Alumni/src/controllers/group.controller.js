const Group = require("../models/Group");
const Staff = require("../models/Staff"); // للتأكد ان الي عامل العملية admin
const User = require("../models/User");
const Post = require("../models/Post");
const HttpStatusHelper = require("../utils/HttpStatuHelper");
const { Op } = require("sequelize");
const Graduate = require("../models/Graduate");
const GroupMember = require("../models/GroupMember");
const Invitation = require("../models/Invitation");
const checkStaffPermission = require("../utils/permissionChecker");
const { notifyAddedToGroup } = require("../services/notificationService");
const { getCollegeNameByCode } = require("../services/facultiesService"); // ⬅️ أضف هذا الاستيراد
const { normalizeCollegeName } = require("../services/facultiesService");

// 🔴 START OF LOGGER IMPORT - ADDED THIS
const { logger, securityLogger } = require("../utils/logger");
// 🔴 END OF LOGGER IMPORT

// getGraduatesForGroup اللي مسموحلهم تبعتلهم دعوه للجروب دا او معموله دعوه لسه متقبلتش
//available to invite
const getGraduatesForGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user.id;
    const currentUserType = req.user["user-type"];

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Get graduates for group invitation request initiated", {
      userId: currentUserId,
      userType: currentUserType,
      groupId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // تحقق إن المستخدم Admin أو Staff أو Graduate
    const isAllowedUser =
      currentUserType === "admin" ||
      currentUserType === "staff" ||
      currentUserType === "graduate";

    if (!isAllowedUser) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Unauthorized user type for group invitations", {
        userId: currentUserId,
        userType: currentUserType,
        groupId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        error: "Only admins, staff and graduates can invite others to groups.",
      });
    }

    // لو المستخدم خريج، تحقق إنه عضو في الجروب
    if (currentUserType === "graduate") {
      const isGroupMember = await GroupMember.findOne({
        where: {
          "group-id": groupId,
          "user-id": currentUserId,
        },
      });

      if (!isGroupMember) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("Graduate not a member of group for invitations", {
          userId: currentUserId,
          groupId,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          error: "You must be a member of the group to invite others.",
        });
      }
    }

    // IDs الأعضاء الموجودين في الجروب
    const groupMembers = await GroupMember.findAll({
      where: { "group-id": groupId },
      attributes: ["user-id"],
    });
    const memberIds = groupMembers.map((m) => m["user-id"]);

    // الدعوات اللي المستخدم الحالي بعتها وحالتها pending
    const userPendingInvitations = await Invitation.findAll({
      where: {
        group_id: groupId,
        sender_id: currentUserId,
        status: "pending",
      },
      attributes: ["id", "receiver_id"],
    });

    const pendingMap = {};
    userPendingInvitations.forEach((i) => {
      pendingMap[i.receiver_id] = i.id;
    });
    const pendingIds = Object.keys(pendingMap).map((id) => parseInt(id));

    // نجيب الخريجين اللي مش أعضاء وحالتهم accepted
    const graduates = await User.findAll({
      where: {
        "user-type": "graduate",
        id: {
          [Op.notIn]: memberIds,
          [Op.ne]: currentUserId, // منع المستخدم من دعوة نفسه
        },
      },
      include: [
        {
          model: Graduate,
          where: { "status-to-login": "accepted" },
          attributes: [
            "profile-picture-url",
            "faculty_code",
            "graduation-year",
          ],
          required: true,
        },
      ],
      attributes: ["id", "first-name", "last-name"],
    });

    // تحويل faculty_code إلى اسم الكلية
    const lang = req.headers["accept-language"] || req.user?.language || "ar";

    // نبني النتيجة المطلوبة
    const result = graduates.map((g) => {
      const facultyName = getCollegeNameByCode(g.Graduate?.faculty_code, lang);

      return {
        id: g.id,
        fullName: `${g["first-name"]} ${g["last-name"]}`,
        profilePicture: g.Graduate?.["profile-picture-url"] || null,
        faculty: facultyName,
        graduationYear: g.Graduate?.["graduation-year"] || null,
        invitationStatus: pendingIds.includes(g.id) ? "pending" : "not_invited",
        invitationId: pendingMap[g.id] || null,
      };
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Graduates for group invitation retrieved successfully", {
      userId: currentUserId,
      groupId,
      availableGraduatesCount: result.length,
      pendingInvitationsCount: pendingIds.length,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.status(200).json(result);
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error getting graduates for group invitation", {
      userId: req.user?.id,
      groupId: req.params.groupId,
      error: error.message,
      stack: error.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("Error in getGraduatesForGroup:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

//as an admin, i want to create group
const createGroup = async (req, res) => {
  try {
    const { groupName, description } = req.body;
    const user = req.user;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Create group request initiated", {
      userId: user?.id,
      userType: user?.["user-type"],
      groupName,
      hasDescription: !!description,
      hasFile: !!req.file,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    if (!groupName || !description) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Missing required fields for group creation", {
        userId: user?.id,
        hasGroupName: !!groupName,
        hasDescription: !!description,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: "fail",
        message: "Group name and description are required",
        data: [],
      });
    }

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Unauthorized access to create group", {
        userId: user?.id,
        userType: user?.["user-type"],
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "fail",
        message: "Access denied.",
        data: [],
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "Communities management",
        "add"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("Staff permission denied for creating group", {
          userId: user.id,
          permission: "Communities management",
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "fail",
          message: "Access denied. You don't have permission to create groups.",
          data: [],
        });
      }
    }

    // 4. استخراج faculty_code و graduation_year
    let faculty_code = groupName ? normalizeCollegeName(groupName) : groupName; // ⬅️ التعديل هنا
    let graduation_year = null;

    // استخراج السنة من description
    const yearMatch = description.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      graduation_year = parseInt(yearMatch[0]);
    } else {
      // إذا مفيش سنة في description، جرب نستخرج من groupName
      const yearMatchFromName = groupName.match(/\b(19|20)\d{2}\b/);
      if (yearMatchFromName) {
        graduation_year = parseInt(yearMatchFromName[0]);
      }
    }

    // 5. تحقق إذا فيه جروب موجود بنفس الكلية والسنة
    if (faculty_code && graduation_year) {
      const existingGroup = await Group.findOne({
        where: {
          faculty_code: faculty_code,
          graduation_year: graduation_year,
        },
      });

      if (existingGroup) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("Group already exists with same faculty and year", {
          userId: user.id,
          faculty_code,
          graduation_year,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
        // 🔴 END OF LOGGING
        return res.status(400).json({
          status: "fail",
          message: `Group already exists for ${faculty_code} - ${graduation_year}`,
          data: [],
        });
      }
    }

    // 6. معالجة الصورة
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path || req.file.url || req.file.location || null;
      // 🔴 START OF LOGGING - ADDED THIS
      logger.debug("Group image uploaded", {
        userId: user.id,
        hasImage: !!imageUrl,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
    }

    // 7. إنشاء الجروب
    const group = await Group.create({
      "group-name": groupName,
      description,
      "created-date": new Date(),
      "group-image": imageUrl,
      faculty_code: faculty_code,
      graduation_year: graduation_year || new Date().getFullYear(),
    });

    const memberCount = await GroupMember.count({
      where: { "group-id": group.id },
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Group created successfully", {
      userId: user.id,
      userType: user["user-type"],
      groupId: group.id,
      groupName: group["group-name"],
      faculty_code,
      graduation_year,
      memberCount,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    return res.status(201).json({
      status: "success",
      message: "Group created successfully",
      data: {
        id: group.id,
        groupName: group["group-name"],
        description: group.description,
        createdDate: group["created-date"],
        groupImage: group["group-image"],
        faculty_code: group.faculty_code,
        graduation_year: group.graduation_year,
        memberCount,
      },
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error creating group", {
      userId: req.user?.id,
      groupName: req.body.groupName,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("Error in createGroup:", err);
    return res.status(500).json({
      status: "error",
      message: "Failed to create group",
      error: err.message,
      data: [],
    });
  }
};

//as an admin & graduate ,i want to see all groups in community
const getGroups = async (req, res) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Get all groups request initiated", {
      userId: req.user?.id,
      userType: req.user?.["user-type"],
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم - كل اليوزر types
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Unauthorized access to view groups", {
        userId: req.user?.id,
        userType: req.user?.["user-type"],
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
        data: [],
      });
    }

    // 3. لو staff → يعدي مباشرة علشان يشوف الجروبات (من غير صلاحية)
    // علشان يقدر يدير الـ Communities لازم يشوفها أولاً

    // 4. لو admin أو graduate أو staff → اتركه يكمل
    // هات كل الجروبات
    const groups = await Group.findAll();

    // هات عدد الأعضاء لكل جروب
    const groupsWithCount = await Promise.all(
      groups.map(async (group) => {
        const membersCount = await GroupMember.count({
          where: { "group-id": group.id },
        });

        return {
          id: group.id,
          groupName: group["group-name"],
          description: group.description,
          createdDate: group["created-date"],
          groupImage: group["group-image"],
          membersCount,
        };
      })
    );

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("All groups retrieved successfully", {
      userId: req.user.id,
      userType: req.user["user-type"],
      groupsCount: groupsWithCount.length,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: "success",
      message: "Groups fetched successfully",
      data: groupsWithCount,
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error getting all groups", {
      userId: req.user?.id,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

//as an admin, i want to add person to group
const addUserToGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const user = req.user;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Add user to group request initiated", {
      adminUserId: user?.id,
      adminUserType: user?.["user-type"],
      targetUserId: userId,
      groupId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Unauthorized access to add user to group", {
        userId: user?.id,
        userType: user?.["user-type"],
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "fail",
        message: "Access denied.",
        data: [],
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "Community Members management",
        "add"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("Staff permission denied for adding user to group", {
          userId: user.id,
          permission: "Community Members management",
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "fail",
          message:
            "Access denied. You don't have permission to add users to groups.",
          data: [],
        });
      }
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    // تأكد إن الجروب موجود
    const group = await Group.findByPk(groupId);
    if (!group) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Group not found for adding user", {
        groupId,
        adminUserId: user.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "fail",
        message: "Group not found",
        data: [],
      });
    }

    // تأكد إن اليوزر موجود
    const member = await User.findByPk(userId);
    if (!member) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("User not found for adding to group", {
        targetUserId: userId,
        adminUserId: user.id,
        groupId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "fail",
        message: "User not found",
        data: [],
      });
    }

    // تأكد إنه مش موجود بالفعل في الجروب
    const existingMember = await GroupMember.findOne({
      where: { "group-id": groupId, "user-id": userId },
    });
    if (existingMember) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("User already member of group", {
        targetUserId: userId,
        groupId,
        adminUserId: user.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: "fail",
        message: "User already in this group",
        data: [],
      });
    }

    // أضف العضو للجروب
    await GroupMember.create({
      "group-id": groupId,
      "user-id": userId,
    });

    // Create notification for the user being added
    await notifyAddedToGroup(userId, user.id, group["group-name"], groupId);

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("User added to group successfully", {
      adminUserId: user.id,
      adminUserType: user["user-type"],
      targetUserId: userId,
      targetUserName: `${member["first-name"]} ${member["last-name"]}`,
      groupId,
      groupName: group["group-name"],
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    return res.status(201).json({
      status: "success",
      message: "User added to group successfully",
      data: [
        {
          groupId: group.id,
          groupName: group["group-name"],
          userId: member.id,
          userName: `${member["first-name"]} ${member["last-name"]}`,
        },
      ],
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error adding user to group", {
      userId: req.user?.id,
      targetUserId: req.body.userId,
      groupId: req.body.groupId,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

// controllers/group.controller.js
const editGroup = async (req, res) => {
  try {
    const user = req.user;
    const { groupId } = req.params;
    const { groupName, description, removeGroupImage } = req.body;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Edit group request initiated", {
      userId: user?.id,
      userType: user?.["user-type"],
      groupId,
      hasGroupName: !!groupName,
      hasDescription: !!description,
      removeGroupImage: !!removeGroupImage,
      hasFile: !!req.file,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Unauthorized access to edit group", {
        userId: user?.id,
        userType: user?.["user-type"],
        groupId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "fail",
        message: "Access denied.",
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "Communities management",
        "edit"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("Staff permission denied for editing group", {
          userId: user.id,
          permission: "Communities management",
          groupId,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "fail",
          message: "Access denied. You don't have permission to edit groups.",
        });
      }
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    const group = await Group.findByPk(groupId);
    if (!group) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Group not found for editing", {
        groupId,
        userId: user.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res
        .status(404)
        .json({ status: "fail", message: "Group not found" });
    }

    // 5. استخراج faculty_code و graduation_year من groupName و description
    let faculty_code = group.faculty_code;
    let graduation_year = group.graduation_year;

    // استخراج السنة من description
    if (description && description !== group.description) {
      const yearMatch = description.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        graduation_year = parseInt(yearMatch[0]);
      }
    }

    // استخراج اسم الكلية من groupName
    if (groupName && groupName !== group["group-name"]) {
      faculty_code = groupName ? normalizeCollegeName(groupName) : groupName; // ⬅️ التعديل هنا

      // إذا مفيش سنة في description، جرب نستخرج من groupName
      if (!graduation_year || graduation_year === group.graduation_year) {
        const yearMatchFromName = groupName.match(/\b(19|20)\d{2}\b/);
        if (yearMatchFromName) {
          graduation_year = parseInt(yearMatchFromName[0]);
        }
      }
    }

    // 6. تحقق إذا كان في جروب تاني بنفس البيانات
    if (faculty_code && graduation_year) {
      const existingGroup = await Group.findOne({
        where: {
          faculty_code: faculty_code,
          graduation_year: graduation_year,
          id: { [Op.ne]: groupId },
        },
      });

      if (existingGroup) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("Duplicate group found during edit", {
          groupId,
          faculty_code,
          graduation_year,
          existingGroupId: existingGroup.id,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
        // 🔴 END OF LOGGING
        return res.status(400).json({
          status: "fail",
          message: `Another group already exists for ${faculty_code} - ${graduation_year}`,
        });
      }
    }

    // 7. تحديث البيانات
    const oldGroupName = group["group-name"];
    const oldDescription = group.description;

    if (groupName) group["group-name"] = groupName;
    if (description) group.description = description;
    group.faculty_code = faculty_code;
    group.graduation_year = graduation_year;

    // 8. مسح صورة الجروب لو مطلوب
    if (removeGroupImage) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.debug("Removing group image as requested", {
        groupId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      group["group-image"] = null;
    }

    // 9. رفع صورة جديدة
    if (req.file) {
      const imageUrl = req.file.path || req.file.url || req.file.location;
      group["group-image"] = imageUrl;
      // 🔴 START OF LOGGING - ADDED THIS
      logger.debug("New group image uploaded", {
        groupId,
        hasNewImage: !!imageUrl,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
    }

    await group.save();

    const membersCount = await GroupMember.count({
      where: { "group-id": group.id },
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Group updated successfully", {
      userId: user.id,
      userType: user["user-type"],
      groupId,
      changes: {
        groupName: oldGroupName !== group["group-name"],
        description: oldDescription !== group.description,
        faculty_code: faculty_code !== group.faculty_code,
        graduation_year: graduation_year !== group.graduation_year,
      },
      newFacultyCode: faculty_code,
      newGraduationYear: graduation_year,
      membersCount,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: "success",
      message: "Group updated successfully",
      data: {
        id: group.id,
        groupName: group["group-name"],
        description: group.description,
        groupImage: group["group-image"],
        createdDate: group["created-date"],
        faculty_code: group.faculty_code,
        graduation_year: group.graduation_year,
        membersCount,
      },
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error editing group", {
      userId: req.user?.id,
      groupId: req.params.groupId,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error(err);
    return res
      .status(500)
      .json({ status: "error", message: err.message, data: [] });
  }
};

// controllers/group.controller.js
const deleteGroup = async (req, res) => {
  try {
    const user = req.user;
    const { groupId } = req.params;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Delete group request initiated", {
      userId: user?.id,
      userType: user?.["user-type"],
      groupId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Unauthorized access to delete group", {
        userId: user?.id,
        userType: user?.["user-type"],
        groupId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "fail",
        message: "Access denied.",
        data: [],
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "Communities management",
        "delete"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("Staff permission denied for deleting group", {
          userId: user.id,
          permission: "Communities management",
          groupId,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "fail",
          message: "Access denied. You don't have permission to delete groups.",
          data: [],
        });
      }
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    const group = await Group.findByPk(groupId);
    if (!group) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Group not found for deletion", {
        groupId,
        userId: user.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "fail",
        message: "Group not found",
        data: [],
      });
    }

    // حفظ معلومات الجروب قبل الحذف
    const groupInfo = {
      id: group.id,
      name: group["group-name"],
      faculty_code: group.faculty_code,
      graduation_year: group.graduation_year,
    };

    // احسب عدد البوستات والأعضاء قبل الحذف
    const postsCount = await Post.count({ where: { "group-id": groupId } });
    const membersCount = await GroupMember.count({
      where: { "group-id": groupId },
    });

    // امسح البوستات المرتبطة بالجروب
    await Post.destroy({ where: { "group-id": groupId } });

    // امسح الأعضاء
    await GroupMember.destroy({ where: { "group-id": groupId } });

    // امسح الجروب
    await group.destroy();

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Group deleted successfully", {
      userId: user.id,
      userType: user["user-type"],
      groupId,
      groupName: groupInfo.name,
      facultyCode: groupInfo.faculty_code,
      graduationYear: groupInfo.graduation_year,
      deletedPostsCount: postsCount,
      deletedMembersCount: membersCount,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: "success",
      message: "Group, members, and posts deleted successfully",
      data: [],
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error deleting group", {
      userId: req.user?.id,
      groupId: req.params.groupId,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("Error deleting group:", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

// controllers/group.controller.js
const getGroupMembersCount = async (req, res) => {
  try {
    const user = req.user;
    const { groupId } = req.params;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Get group members count request initiated", {
      userId: user?.id,
      userType: user?.["user-type"],
      groupId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Unauthorized access to view group members count", {
        userId: user?.id,
        userType: user?.["user-type"],
        groupId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "fail",
        message: "Access denied.",
        data: [],
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "Communities management",
        "view"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("Staff permission denied for viewing members count", {
          userId: user.id,
          permission: "Communities management",
          groupId,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "fail",
          message:
            "Access denied. You don't have permission to view members count.",
          data: [],
        });
      }
    }

    // 4. لو admin أو graduate أو staff مع صلاحية → اتركه يكمل
    // اتأكد إن الجروب موجود
    const group = await Group.findByPk(groupId);
    if (!group) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Group not found for members count", {
        groupId,
        userId: user.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "fail",
        message: "Group not found",
        data: [],
      });
    }

    // احسب عدد الأعضاء
    const membersCount = await GroupMember.count({
      where: { "group-id": groupId },
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Group members count retrieved successfully", {
      userId: user.id,
      userType: user["user-type"],
      groupId,
      groupName: group["group-name"],
      membersCount,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: "success",
      message: "Group members count fetched successfully",
      data: [
        {
          groupId: group.id,
          groupName: group["group-name"],
          membersCount,
        },
      ],
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error getting group members count", {
      userId: req.user?.id,
      groupId: req.params.groupId,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

//as a graduate ,i want to join to group
const joinGroup = async (req, res) => {
  try {
    const userId = req.user.id; // جاي من الـ middleware
    const { groupId } = req.body;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Join group request initiated", {
      userId,
      groupId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // هات بيانات اليوزر
    const user = await User.findByPk(userId);
    if (!user) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("User not found for joining group", {
        userId,
        groupId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "User not found",
      });
    }

    // لازم يكون Graduate علشان يعمل join
    if (user["user-type"] !== "graduate") {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Non-graduate user attempted to join group", {
        userId,
        userType: user["user-type"],
        groupId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: HttpStatusHelper.FAIL,
        message: "Only graduates can join groups",
      });
    }

    // هات بيانات الجروب
    const group = await Group.findByPk(groupId);
    if (!group) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Group not found for joining", {
        userId,
        groupId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Group not found",
      });
    }

    // اتأكد إنه مش عضو بالفعل
    const existingMember = await GroupMember.findOne({
      where: { "group-id": groupId, "user-id": userId },
    });

    if (existingMember) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("User already member of group", {
        userId,
        groupId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: HttpStatusHelper.FAIL,
        message: "You are already a member of this group",
      });
    }

    // ضيفه كعضو جديد
    await GroupMember.create({
      "group-id": groupId,
      "user-id": userId,
    });

    // Note: When a user joins a group themselves, we don't create a notification
    // Notifications are only created when an admin adds a user to a group

    // احسب عدد الأعضاء بعد الإضافة
    const memberCount = await GroupMember.count({
      where: { "group-id": groupId },
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("User joined group successfully", {
      userId,
      userName: `${user["first-name"]} ${user["last-name"]}`,
      groupId,
      groupName: group["group-name"],
      memberCount,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    return res.status(201).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Joined group successfully",
      data: {
        groupId: group.id,
        groupName: group["group-name"],
        memberCount: memberCount,
      },
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error joining group", {
      userId: req.user?.id,
      groupId: req.body.groupId,
      error: error.message,
      stack: error.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error(error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: error.message,
    });
  }
};

//as a graduate,i want to left from group
const leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id; // جاي من الـ middleware
    const { groupId } = req.params; // بنجيب الـ groupId من الـ URL

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Leave group request initiated", {
      userId,
      groupId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    //find group
    const group = await Group.findByPk(groupId);
    if (!group) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Group not found for leaving", {
        userId,
        groupId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: HttpStatusHelper.ERROR,
        message: "Group not found",
      });
    }

    // is member??
    const membership = await GroupMember.findOne({
      where: {
        "group-id": groupId,
        "user-id": userId,
      },
    });

    if (!membership) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("User not a member of group for leaving", {
        userId,
        groupId,
        groupName: group["group-name"],
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(400).json({
        status: HttpStatusHelper.ERROR,
        message: "You are not a member of this group",
      });
    }

    // delete membership
    await GroupMember.destroy({
      where: {
        "group-id": groupId,
        "user-id": userId,
      },
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("User left group successfully", {
      userId,
      userName: `${req.user?.["first-name"]} ${req.user?.["last-name"]}`,
      groupId,
      groupName: group["group-name"],
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "You have left the group successfully",
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error leaving group", {
      userId: req.user?.id,
      groupId: req.params.groupId,
      error: error.message,
      stack: error.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("Error in leaveGroup:", error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: "Failed to leave group: " + error.message,
    });
  }
};

//as a graduate, i want to get my groups i member in
const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Get my groups request initiated", {
      userId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    //get groups user is memeber in
    const groups = await Group.findAll({
      include: [
        {
          model: User,
          where: { id: userId },
          attributes: [],
          through: { attributes: [] },
        },
      ],
      attributes: [
        "id",
        "group-name",
        "description",
        "created-date",
        "group-image",
      ],
    });

    if (!groups || groups.length === 0) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.info("User has no groups", {
        userId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(200).json({
        status: HttpStatusHelper.FAIL,
        message: "You are not a member of any group",
      });
    }

    // membersCount
    const formattedGroups = await Promise.all(
      groups.map(async (group) => {
        const membersCount = await GroupMember.count({
          where: { "group-id": group.id },
        });

        return {
          id: group.id,
          groupName: group["group-name"],
          description: group.description,
          createdDate: group["created-date"],
          groupImage: group["group-image"],
          membersCount,
        };
      })
    );

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("User groups retrieved successfully", {
      userId,
      groupsCount: formattedGroups.length,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "These are your groups",
      data: formattedGroups,
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error getting user groups", {
      userId: req.user?.id,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("Error in getMyGroups:", err);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: "Something went wrong",
    });
  }
};

const getGroupUsers = async (req, res) => {
  try {
    const { groupId } = req.params;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Get group users request initiated", {
      userId: req.user?.id,
      userType: req.user?.["user-type"],
      groupId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Unauthorized access to view group users", {
        userId: req.user?.id,
        userType: req.user?.["user-type"],
        groupId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (req.user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        req.user.id,
        "Community Members management",
        "view"
      );

      if (!hasPermission) {
        // 🔴 START OF LOGGING - ADDED THIS
        logger.warn("Staff permission denied for viewing group users", {
          userId: req.user.id,
          permission: "Community Members management",
          groupId,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
        // 🔴 END OF LOGGING
        return res.status(403).json({
          status: "error",
          message:
            "Access denied. You don't have permission to view group members.",
        });
      }
    }

    // 4. لو admin أو graduate أو staff مع صلاحية → اتركه يكمل
    const group = await Group.findByPk(groupId, {
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name", "email", "user-type"],
          through: { attributes: [] },
          include: [
            {
              model: Graduate,
              attributes: [
                "faculty_code",
                "graduation-year",
                "profile-picture-url",
              ],
            },
          ],
        },
      ],
    });

    if (!group) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Group not found for users list", {
        groupId,
        userId: req.user?.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({
        status: "error",
        message: "Group not found",
      });
    }

    // تحويل faculty_code إلى اسم الكلية
    const lang = req.headers["accept-language"] || req.user?.language || "ar";

    // هنعمل تعديل صغير عشان لو مش موجود Graduate يرجع قيم افتراضية
    const usersWithGraduateInfo = group.Users.map((user) => {
      const facultyName = getCollegeNameByCode(
        user.Graduate?.faculty_code,
        lang
      );

      return {
        ...user.toJSON(),
        faculty: facultyName,
        graduationYear: user.Graduate ? user.Graduate["graduation-year"] : null,
        profilePicture: user.Graduate
          ? user.Graduate["profile-picture-url"]
          : null,
      };
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Group users retrieved successfully", {
      groupId,
      groupName: group["group-name"],
      usersCount: usersWithGraduateInfo.length,
      userId: req.user.id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.json({
      status: "success",
      count: group.Users.length,
      data: usersWithGraduateInfo,
    });
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error fetching group users", {
      userId: req.user?.id,
      groupId: req.params.groupId,
      error: error.message,
      stack: error.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("Error fetching group users:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch group users",
      error: error.message,
    });
  }
};

module.exports = {
  createGroup,
  getGroups,
  addUserToGroup,
  editGroup,
  deleteGroup,
  getGroupMembersCount,
  joinGroup,
  leaveGroup,
  getMyGroups,
  getGroupUsers,
  getGraduatesForGroup,
};
