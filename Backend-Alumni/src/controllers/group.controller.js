const Group = require("../models/Group");
const Staff = require("../models/Staff"); // للتأكد ان الي عامل العملية admin
const User = require("../models/User");
const GroupMember = require("../models/GroupMember");

const createGroup = async (req, res) => {
  try {
    const { groupName, description } = req.body;
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

module.exports = { createGroup };
