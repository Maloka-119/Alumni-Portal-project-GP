const Group = require("../models/Group");
const Staff = require("../models/Staff"); // للتأكد ان الي عامل العملية admin
const User = require("../models/User");
const GroupMember = require("../models/GroupMember");

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

module.exports = {
  createGroup,
  getGroups,
  addUserToGroup,
};
