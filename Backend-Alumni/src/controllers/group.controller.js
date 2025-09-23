const Group = require("../models/Group");
const Staff = require("../models/Staff"); // للتأكد ان الي عامل العملية admin
const User = require("../models/User");
const GroupMember = require("../models/GroupMember");
const HttpStatusHelper = require("../utils/HttpStatuHelper");

//as an admin, i want to create group
const createGroup = async (req, res) => {
  try {
    const { groupName, description, groupImage } = req.body; // استقبل الصورة من الـ body
    const user = req.user; // middleware بيرجع الـ user

    // تأكد إن الشخص admin
    if (user["user-type"] !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Only admins can create groups",
        data: [],
      });
    }

    // إنشاء المجموعة
    const group = await Group.create({
      "group-name": groupName,
      description,
      "created-date": new Date(),
      "group-image": groupImage || null, // نحط الصورة لو موجودة
    });

    // احسب عدد الأعضاء الحاليين في الجروب
    const memberCount = await GroupMember.count({
      where: { "group-id": group.id },
    });

    // ريسبونس بالشكل المطلوب
    return res.status(201).json({
      status: "success",
      message: "Group created successfully",
      data: [
        {
          id: group.id,
          groupName: group["group-name"],
          description: group.description,
          createdDate: group["created-date"],
          groupImage: group["group-image"], // نرجع الصورة كمان
          memberCount: memberCount, // العدد الحالي للأعضاء
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

//as an admin & graduate ,i want to see all groups in community
const getGroups = async (req, res) => {
  try {
    const user = req.user;

    // تأكد إنه admin
    if (user["user-type"] !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Only admins can view groups",
        data: [],
      });
    }

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
          groupImage: group["group-image"], // أضفنا الصورة هنا
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
    const user = req.user; // middleware بيرجع اليوزر الحالي

    // تأكد إنه Admin
    if (user["user-type"] !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Only admins can add users to groups",
        data: [],
      });
    }

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
    const { groupName, description, groupImage } = req.body;

    // لازم يكون Admin
    if (user["user-type"] !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Only admins can edit groups",
        data: [],
      });
    }

    // دور على الجروب
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        status: "fail",
        message: "Group not found",
        data: [],
      });
    }

    // عدّل القيم اللي اتبعتت بس
    if (groupName) group["group-name"] = groupName;
    if (description) group.description = description;
    if (groupImage) group["group-image"] = groupImage;

    await group.save();

    // جيب عدد الأعضاء
    const membersCount = await GroupMember.count({
      where: { "group-id": group.id },
    });

    return res.status(200).json({
      status: "success",
      message: "Group updated successfully",
      data: [
        {
          id: group.id,
          groupName: group["group-name"],
          description: group.description,
          groupImage: group["group-image"],
          createdDate: group["created-date"],
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

// controllers/group.controller.js
const deleteGroup = async (req, res) => {
  try {
    const user = req.user;
    const { groupId } = req.params;

    // لازم يكون Admin
    if (user["user-type"] !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Only admins can delete groups",
        data: [],
      });
    }

    // دور على الجروب
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        status: "fail",
        message: "Group not found",
        data: [],
      });
    }

    // امسح الجروب
    await group.destroy();

    return res.status(200).json({
      status: "success",
      message: "Group deleted successfully",
      data: [],
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
const getGroupMembersCount = async (req, res) => {
  try {
    const user = req.user;
    const { groupId } = req.params;

    // لازم يكون Admin
    if (user["user-type"] !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Only admins can view members count",
        data: [],
      });
    }

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
        status:HttpStatusHelper.FAIL,
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
      status:HttpStatusHelper.ERROR,
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


module.exports = {
  createGroup,
  getGroups,
  addUserToGroup,
  editGroup,
  deleteGroup,
  getGroupMembersCount,
  joinGroup,
  leaveGroup
};
