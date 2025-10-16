const Invitation = require('../models/Invitation');
const GroupMember = require('../models/GroupMember');
const Group = require('../models/Group');
const { Op } = require("sequelize");
const User = require("../models/User");
const sequelize = require("../config/db");

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

    const invitations = await Invitation.findAll({
      where: { receiver_id, status: "pending" },
      attributes: ["id", "status", "sent_date"],
      include: [
        {
          model: Group,
          attributes: ["id", "group-name"], // اسم الجروب
        },
        {
          model: User,
          as: "sender", // استخدمنا alias من الموديل
          attributes: ["id", "first-name", "last-name"],
          include: [
            {
              model: require("../models/Graduate"), // نجيب بيانات الخريج لو موجودة
              attributes: ["faculty", "graduation-year", "current-job"],
            },
          ],
        },
      ],
    });

    // نركب النتيجة بشكل منسق
    const result = invitations.map((inv) => {
      const firstName = inv.sender?.["first-name"] || "";
      const lastName = inv.sender?.["last-name"] || "";
      const fullName = `${firstName} ${lastName}`.trim();

      return {
        id: inv.id,
        status: inv.status,
        sent_date: inv.sent_date,
        groupName: inv.Group ? inv.Group["group-name"] : null,
        senderFullName: fullName,
        senderFaculty: inv.sender?.Graduate?.faculty || null,
        senderGraduationYear: inv.sender?.Graduate?.["graduation-year"] || null,
        senderJob: inv.sender?.Graduate?.["current-job"] || null,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error in getReceivedInvitations:", err);
    res.status(500).json({ error: err.message });
  }
};


// export all at once
module.exports = {
  sendInvitation,
  acceptInvitation,
  deleteInvitation,
  cancelInvitation,
  getReceivedInvitations
};
