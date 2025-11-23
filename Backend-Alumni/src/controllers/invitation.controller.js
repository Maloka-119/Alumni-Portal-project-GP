const Invitation = require('../models/Invitation');
const GroupMember = require('../models/GroupMember');
const Group = require('../models/Group');
const { Op } = require("sequelize");
const User = require("../models/User");
const Graduate = require("../models/Graduate"); // ⬅️ أضف هذا الاستيراد
const sequelize = require("../config/db");
const { getCollegeNameByCode } = require("../services/facultiesService"); // ⬅️ أضف هذا الاستيراد

// send invitation
const sendInvitation = async (req, res) => {
  try {
    const sender_id = req.user.id; // الشخص اللي بيبعت الدعوة
    const { receiver_id, group_id } = req.body; // الشخص المستلم والجروب

    if (!receiver_id || !group_id) {
      return res.status(400).json({ message: "receiver_id and group_id are required" });
    }

    //check sender is member
    const isMember = await GroupMember.findOne({
      where: { 'group-id': group_id, 'user-id': sender_id }
    });

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // create invitation
    const invitation = await Invitation.create({ sender_id, receiver_id, group_id });
    res.status(201).json(invitation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// accept invitation
const acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findByPk(id);
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });

    invitation.status = 'accepted';
    await invitation.save();

    // add member to group
    await GroupMember.create({ 'group-id': invitation.group_id, 'user-id': invitation.receiver_id });

    res.json(invitation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// delete invitation by reciever
const deleteInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findByPk(id);
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });

    await invitation.destroy(); 
    res.json({ message: 'Invitation deleted from your side' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//(cancel) by sender
const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findByPk(id);
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });

    await invitation.destroy(); 
    res.json({ message: 'Invitation cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//view Invitations
const getReceivedInvitations = async (req, res) => {
  try {
    const receiver_id = req.user.id;
    const lang = req.headers["accept-language"] || req.user?.language || "ar"; // ⬅️ تحديد اللغة

    const invitations = await Invitation.findAll({
      where: { receiver_id, status: "pending" },
      attributes: ["id", "status", "sent_date", "sender_id", "receiver_id", "group_id"],
      include: [
        {
          model: Group,
          attributes: ["id", "group-name"], // اسم الجروب
        },
        {
          model: User,
          as: "sender",
          attributes: ["id", "first-name", "last-name"],
          include: [
            {
              model: Graduate,
              attributes: ["faculty_code", "graduation-year", "current-job", "profile-picture-url"], // ⬅️ استخدام faculty_code بدلاً من faculty
            },
          ],
        },
      ],
    });

    // تنسيق النتيجة مع تحويل faculty_code إلى اسم الكلية
    const result = invitations.map((inv) => {
      const firstName = inv.sender?.["first-name"] || "";
      const lastName = inv.sender?.["last-name"] || "";
      const fullName = `${firstName} ${lastName}`.trim();

      // تحويل faculty_code إلى اسم الكلية
      const facultyName = getCollegeNameByCode(inv.sender?.Graduate?.faculty_code, lang);

      return {
        invitationId: inv.id,
        status: inv.status,
        sent_date: inv.sent_date,
        sender_id: inv.sender_id,
        receiver_id: inv.receiver_id,
        group_id: inv.group_id,
        groupName: inv.Group ? inv.Group["group-name"] : null,
        senderFullName: fullName,
        senderFaculty: facultyName, // ⬅️ اسم الكلية بدلاً من الكود
        senderGraduationYear: inv.sender?.Graduate?.["graduation-year"] || null,
        senderCurrentJob: inv.sender?.Graduate?.["current-job"] || null,
        senderProfilePicture: inv.sender?.Graduate?.["profile-picture-url"] || null,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error in getReceivedInvitations:", err);
    res.status(500).json({ error: err.message });
  }
};

// ⬅️ دالة جديدة للحصول على الدعوات المرسلة
const getSentInvitations = async (req, res) => {
  try {
    const sender_id = req.user.id;
    const lang = req.headers["accept-language"] || req.user?.language || "ar";

    const invitations = await Invitation.findAll({
      where: { sender_id, status: "pending" },
      attributes: ["id", "status", "sent_date", "sender_id", "receiver_id", "group_id"],
      include: [
        {
          model: Group,
          attributes: ["id", "group-name"],
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "first-name", "last-name"],
          include: [
            {
              model: Graduate,
              attributes: ["faculty_code", "graduation-year", "profile-picture-url"],
            },
          ],
        },
      ],
    });

    // تنسيق النتيجة مع تحويل faculty_code إلى اسم الكلية
    const result = invitations.map((inv) => {
      const firstName = inv.receiver?.["first-name"] || "";
      const lastName = inv.receiver?.["last-name"] || "";
      const fullName = `${firstName} ${lastName}`.trim();

      // تحويل faculty_code إلى اسم الكلية
      const facultyName = getCollegeNameByCode(inv.receiver?.Graduate?.faculty_code, lang);

      return {
        invitationId: inv.id,
        status: inv.status,
        sent_date: inv.sent_date,
        sender_id: inv.sender_id,
        receiver_id: inv.receiver_id,
        group_id: inv.group_id,
        groupName: inv.Group ? inv.Group["group-name"] : null,
        receiverFullName: fullName,
        receiverFaculty: facultyName,
        receiverGraduationYear: inv.receiver?.Graduate?.["graduation-year"] || null,
        receiverProfilePicture: inv.receiver?.Graduate?.["profile-picture-url"] || null,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error in getSentInvitations:", err);
    res.status(500).json({ error: err.message });
  }
};

// export all at once
module.exports = {
  sendInvitation,
  acceptInvitation,
  deleteInvitation,
  cancelInvitation,
  getReceivedInvitations,
  getSentInvitations // ⬅️ أضف الدالة الجديدة للتصدير
};