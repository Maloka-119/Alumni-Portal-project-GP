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

// getGraduatesForGroup اللي مسموحلهم تبعتلهم دعوه للجروب دا او معموله دعوه لسه متقبلتش
//available to invite
const getGraduatesForGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user.id;
    const currentUserType = req.user["user-type"];

    // تحقق إن المستخدم Admin أو Staff أو Graduate
    const isAllowedUser =
      currentUserType === "admin" ||
      currentUserType === "staff" ||
      currentUserType === "graduate";

    if (!isAllowedUser) {
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
          attributes: ["profile-picture-url", "faculty_code", "graduation-year"],
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

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getGraduatesForGroup:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

//as an admin, i want to create group
const createGroup = async (req, res) => {
  try {
    const { groupName, description } = req.body;
    const user = req.user;

    // تحقق من البيانات
    if (!groupName || !description) {
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
        return res.status(403).json({
          status: "fail",
          message: "Access denied. You don't have permission to create groups.",
          data: [],
        });
      }
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    // معالجة الصورة
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path || req.file.url || req.file.location || null;
    }

    // إنشاء الجروب
    const group = await Group.create({
      "group-name": groupName,
      description,
      "created-date": new Date(),
      "group-image": imageUrl,
    });

    const memberCount = await GroupMember.count({
      where: { "group-id": group.id },
    });

    return res.status(201).json({
      status: "success",
      message: "Group created successfully",
      data: {
        id: group.id,
        groupName: group["group-name"],
        description: group.description,
        createdDate: group["created-date"],
        groupImage: group["group-image"],
        memberCount,
      },
    });
  } catch (err) {
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
    // 1. تحديد اليوزر types المسموح لهم - كل اليوزر types
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
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

    return res.status(200).json({
      status: "success",
      message: "Groups fetched successfully",
      data: groupsWithCount,
    });
  } catch (err) {
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

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
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
      return res.status(404).json({
        status: "fail",
        message: "Group not found",
        data: [],
      });
    }

    // تأكد إن اليوزر موجود
    const member = await User.findByPk(userId);
    if (!member) {
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

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
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
        return res.status(403).json({
          status: "fail",
          message: "Access denied. You don't have permission to edit groups.",
        });
      }
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    const group = await Group.findByPk(groupId);
    if (!group)
      return res
        .status(404)
        .json({ status: "fail", message: "Group not found" });

    if (groupName) group["group-name"] = groupName;
    if (description) group.description = description;

    // مسح صورة الجروب لو مطلوب
    if (removeGroupImage) {
      group["group-image"] = null;
    }

    // رفع صورة جديدة
    if (req.file) {
      const imageUrl = req.file.path || req.file.url || req.file.location;
      group["group-image"] = imageUrl;
    }

    await group.save();

    const membersCount = await GroupMember.count({
      where: { "group-id": group.id },
    });

    return res.status(200).json({
      status: "success",
      message: "Group updated successfully",
      data: {
        id: group.id,
        groupName: group["group-name"],
        description: group.description,
        groupImage: group["group-image"],
        createdDate: group["created-date"],
        membersCount,
      },
    });
  } catch (err) {
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

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
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
      return res.status(404).json({
        status: "fail",
        message: "Group not found",
        data: [],
      });
    }

    // امسح البوستات المرتبطة بالجروب
    await Post.destroy({ where: { "group-id": groupId } });

    // امسح الأعضاء
    await GroupMember.destroy({ where: { "group-id": groupId } });

    // امسح الجروب
    await group.destroy();

    return res.status(200).json({
      status: "success",
      message: "Group, members, and posts deleted successfully",
      data: [],
    });
  } catch (err) {
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

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
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

    // هات بيانات اليوزر
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "User not found",
      });
    }

    // لازم يكون Graduate علشان يعمل join
    if (user["user-type"] !== "graduate") {
      return res.status(403).json({
        status: HttpStatusHelper.FAIL,
        message: "Only graduates can join groups",
      });
    }

    // هات بيانات الجروب
    const group = await Group.findByPk(groupId);
    if (!group) {
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

    //find group
    const group = await Group.findByPk(groupId);
    if (!group) {
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

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "You have left the group successfully",
    });
  } catch (error) {
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

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "These are your groups",
      data: formattedGroups,
    });
  } catch (err) {
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

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff", "graduate"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!req.user || !allowedUserTypes.includes(req.user["user-type"])) {
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
              attributes: ["faculty_code", "graduation-year", "profile-picture-url"],
            },
          ],
        },
      ],
    });

    if (!group) {
      return res.status(404).json({
        status: "error",
        message: "Group not found",
      });
    }

    // تحويل faculty_code إلى اسم الكلية
    const lang = req.headers["accept-language"] || req.user?.language || "ar";

    // هنعمل تعديل صغير عشان لو مش موجود Graduate يرجع قيم افتراضية
    const usersWithGraduateInfo = group.Users.map((user) => {
      const facultyName = getCollegeNameByCode(user.Graduate?.faculty_code, lang);
      
      return {
        ...user.toJSON(),
        faculty: facultyName,
        graduationYear: user.Graduate ? user.Graduate["graduation-year"] : null,
        profilePicture: user.Graduate
          ? user.Graduate["profile-picture-url"]
          : null,
      };
    });

    res.json({
      status: "success",
      count: group.Users.length,
      data: usersWithGraduateInfo,
    });
  } catch (error) {
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