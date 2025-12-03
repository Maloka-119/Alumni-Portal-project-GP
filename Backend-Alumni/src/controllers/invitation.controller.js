const Invitation = require("../models/Invitation");
const GroupMember = require("../models/GroupMember");
const Group = require("../models/Group");
const { Op } = require("sequelize");
const User = require("../models/User");
const Graduate = require("../models/Graduate");
const Notification = require("../models/Notification");
const { findMatchingGroup } = require("../utils/groupUtils");
const sequelize = require("../config/db");
const { getCollegeNameByCode } = require("../services/facultiesService");

// 🔴 START OF LOGGER IMPORT - ADDED THIS
const { logger, securityLogger } = require("../utils/logger");
// 🔴 END OF LOGGER IMPORT

// send invitation
const sendInvitation = async (req, res) => {
  try {
    const sender_id = req.user.id; // الشخص اللي بيبعت الدعوة
    const { receiver_id, group_id } = req.body; // الشخص المستلم والجروب

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Send invitation request initiated", {
      sender_id,
      receiver_id,
      group_id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    if (!receiver_id || !group_id) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Missing required fields for sending invitation", {
        sender_id,
        hasReceiverId: !!receiver_id,
        hasGroupId: !!group_id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res
        .status(400)
        .json({ message: "receiver_id and group_id are required" });
    }

    //check sender is member
    const isMember = await GroupMember.findOne({
      where: { "group-id": group_id, "user-id": sender_id },
    });

    if (!isMember) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Sender not a member of group for invitation", {
        sender_id,
        group_id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    // create invitation
    const invitation = await Invitation.create({
      sender_id,
      receiver_id,
      group_id,
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Invitation sent successfully", {
      invitationId: invitation.id,
      sender_id,
      receiver_id,
      group_id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.status(201).json(invitation);
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error sending invitation", {
      sender_id: req.user?.id,
      receiver_id: req.body.receiver_id,
      group_id: req.body.group_id,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    res.status(500).json({ error: err.message });
  }
};

// accept invitation
const acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Accept invitation request initiated", {
      userId,
      invitationId: id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    const invitation = await Invitation.findByPk(id);
    if (!invitation) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Invitation not found for acceptance", {
        invitationId: id,
        userId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Verify that the current user is the receiver
    if (invitation.receiver_id !== userId) {
      // 🔴 START OF LOGGING - ADDED THIS
      securityLogger.warn("Unauthorized invitation acceptance attempt", {
        userId,
        invitationReceiverId: invitation.receiver_id,
        invitationId: id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res
        .status(403)
        .json({ message: "Not authorized to accept this invitation" });
    }

    const oldStatus = invitation.status;
    invitation.status = "accepted";
    await invitation.save();

    // add member to group
    await GroupMember.create({
      "group-id": invitation.group_id,
      "user-id": invitation.receiver_id,
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Invitation accepted successfully", {
      invitationId: id,
      userId,
      oldStatus,
      newStatus: "accepted",
      groupId: invitation.group_id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.json(invitation);
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error accepting invitation", {
      userId: req.user?.id,
      invitationId: req.params.id,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    res.status(500).json({ error: err.message });
  }
};

// delete invitation by reciever
const deleteInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Delete invitation request initiated", {
      userId,
      invitationId: id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    const invitation = await Invitation.findByPk(id);
    if (!invitation) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Invitation not found for deletion", {
        invitationId: id,
        userId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Verify that the current user is the receiver
    if (invitation.receiver_id !== userId) {
      // 🔴 START OF LOGGING - ADDED THIS
      securityLogger.warn("Unauthorized invitation deletion attempt", {
        userId,
        invitationReceiverId: invitation.receiver_id,
        invitationId: id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res
        .status(403)
        .json({ message: "Not authorized to delete this invitation" });
    }

    const invitationInfo = {
      id: invitation.id,
      sender_id: invitation.sender_id,
      receiver_id: invitation.receiver_id,
      group_id: invitation.group_id,
      status: invitation.status,
    };

    await invitation.destroy();

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Invitation deleted by receiver", {
      invitationId: id,
      userId,
      invitationInfo,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.json({ message: "Invitation deleted from your side" });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error deleting invitation", {
      userId: req.user?.id,
      invitationId: req.params.id,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    res.status(500).json({ error: err.message });
  }
};

//(cancel) by sender
const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Cancel invitation request initiated", {
      userId,
      invitationId: id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    const invitation = await Invitation.findByPk(id);
    if (!invitation) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Invitation not found for cancellation", {
        invitationId: id,
        userId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Verify that the current user is the sender
    if (invitation.sender_id !== userId) {
      // 🔴 START OF LOGGING - ADDED THIS
      securityLogger.warn("Unauthorized invitation cancellation attempt", {
        userId,
        invitationSenderId: invitation.sender_id,
        invitationId: id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this invitation" });
    }

    const invitationInfo = {
      id: invitation.id,
      sender_id: invitation.sender_id,
      receiver_id: invitation.receiver_id,
      group_id: invitation.group_id,
      status: invitation.status,
    };

    await invitation.destroy();

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Invitation cancelled by sender", {
      invitationId: id,
      userId,
      invitationInfo,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.json({ message: "Invitation cancelled successfully" });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error cancelling invitation", {
      userId: req.user?.id,
      invitationId: req.params.id,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    res.status(500).json({ error: err.message });
  }
};

//view Invitations
const getReceivedInvitations = async (req, res) => {
  try {
    const receiver_id = req.user.id;
    const lang = req.headers["accept-language"] || req.user?.language || "ar";

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Get received invitations request initiated", {
      receiver_id,
      lang,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    const invitations = await Invitation.findAll({
      where: { receiver_id, status: "pending" },
      attributes: [
        "id",
        "status",
        "sent_date",
        "sender_id",
        "receiver_id",
        "group_id",
      ],
      include: [
        {
          model: Group,
          attributes: ["id", "group-name"],
        },
        {
          model: User,
          as: "sender",
          attributes: ["id", "first-name", "last-name"],
          include: [
            {
              model: Graduate,
              attributes: [
                "faculty_code",
                "graduation-year",
                "current-job",
                "profile-picture-url",
              ],
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
      const facultyName = getCollegeNameByCode(
        inv.sender?.Graduate?.faculty_code,
        lang
      );

      return {
        invitationId: inv.id,
        status: inv.status,
        sent_date: inv.sent_date,
        sender_id: inv.sender_id,
        receiver_id: inv.receiver_id,
        group_id: inv.group_id,
        groupName: inv.Group ? inv.Group["group-name"] : null,
        senderFullName: fullName,
        senderFaculty: facultyName,
        senderGraduationYear: inv.sender?.Graduate?.["graduation-year"] || null,
        senderCurrentJob: inv.sender?.Graduate?.["current-job"] || null,
        senderProfilePicture:
          inv.sender?.Graduate?.["profile-picture-url"] || null,
      };
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Received invitations retrieved successfully", {
      receiver_id,
      invitationsCount: result.length,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.json(result);
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error getting received invitations", {
      receiver_id: req.user?.id,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("Error in getReceivedInvitations:", err);
    res.status(500).json({ error: err.message });
  }
};

// ⬅️ دالة جديدة للحصول على الدعوات المرسلة
const getSentInvitations = async (req, res) => {
  try {
    const sender_id = req.user.id;
    const lang = req.headers["accept-language"] || req.user?.language || "ar";

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Get sent invitations request initiated", {
      sender_id,
      lang,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    const invitations = await Invitation.findAll({
      where: { sender_id, status: "pending" },
      attributes: [
        "id",
        "status",
        "sent_date",
        "sender_id",
        "receiver_id",
        "group_id",
      ],
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

    // تنسيق النتيجة مع تحويل faculty_code إلى اسم الكلية
    const result = invitations.map((inv) => {
      const firstName = inv.receiver?.["first-name"] || "";
      const lastName = inv.receiver?.["last-name"] || "";
      const fullName = `${firstName} ${lastName}`.trim();

      // تحويل faculty_code إلى اسم الكلية
      const facultyName = getCollegeNameByCode(
        inv.receiver?.Graduate?.faculty_code,
        lang
      );

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
        receiverGraduationYear:
          inv.receiver?.Graduate?.["graduation-year"] || null,
        receiverProfilePicture:
          inv.receiver?.Graduate?.["profile-picture-url"] || null,
      };
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Sent invitations retrieved successfully", {
      sender_id,
      invitationsCount: result.length,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.json(result);
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error getting sent invitations", {
      sender_id: req.user?.id,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("Error in getSentInvitations:", err);
    res.status(500).json({ error: err.message });
  }
};

// بعد كل الـ functions الموجودة، قبل module.exports

// Auto-send group invitation after registration
const sendAutoGroupInvitation = async (userId) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Auto group invitation process started", {
      userId,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // 1. نجيب بيانات الخريج
    const graduate = await Graduate.findOne({
      where: { graduate_id: userId },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name"],
        },
      ],
    });

    if (!graduate) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Graduate not found for auto invitation", {
        userId,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return false;
    }

    // 🔴 START OF LOGGING - ADDED THIS
    logger.debug("Graduate found for auto invitation", {
      userId,
      facultyCode: graduate.faculty_code,
      graduationYear: graduate["graduation-year"],
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // 2. بنبحث عن الجروب المناسب باستخدام الدالة المساعدة
    const matchingGroup = await findMatchingGroup(
      graduate.faculty_code,
      graduate["graduation-year"]
    );

    if (!matchingGroup) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.info("No matching group found for auto invitation", {
        userId,
        facultyCode: graduate.faculty_code,
        graduationYear: graduate["graduation-year"],
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return false;
    }

    // 🔴 START OF LOGGING - ADDED THIS
    logger.debug("Matching group found for auto invitation", {
      userId,
      groupId: matchingGroup.id,
      groupName: matchingGroup["group-name"],
      facultyCode: graduate.faculty_code,
      graduationYear: graduate["graduation-year"],
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // 3. نبعت Invitation
    const invitation = await Invitation.create({
      sender_id: 1, // الـ Admin
      receiver_id: userId,
      group_id: matchingGroup.id,
      status: "pending",
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.debug("Auto invitation created", {
      userId,
      invitationId: invitation.id,
      groupId: matchingGroup.id,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    // 4. نبعت Notification
    await Notification.create({
      receiverId: userId,
      type: "added_to_group",
      message: `عزيزي الخريج، لديك دعوة للانضمام لمجموعة ${matchingGroup["group-name"]}`,
      navigation: {
        type: "invitation",
        invitationId: invitation.id,
        groupId: matchingGroup.id,
      },
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Auto group invitation sent successfully", {
      userId,
      invitationId: invitation.id,
      groupId: matchingGroup.id,
      groupName: matchingGroup["group-name"],
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    return true;
  } catch (error) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error in sendAutoGroupInvitation", {
      userId,
      error: error.message,
      stack: error.stack.substring(0, 200),
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    console.error("Error in sendAutoGroupInvitation:", error);
    return false;
  }
};



const getAutoSentInvitation = async (req, res) => {
  try {
    // جلب الدعوة من admin (id=1) للمستخدم الحالي
    const invitation = await Invitation.findOne({
      where: {
        sender_id: 1,
        receiver_id: req.user.id,
      },
      include: [
        {
          model: Group,
          attributes: ["id", "group-name"], // ممكن تضيفي description لو حابة
        }
      ]
    });

    if (!invitation) {
      return res.json({ invited: false, invitation: null });
    }

    res.json({
      invited: true,
      invitation: invitation,
    });
  } catch (error) {
    console.error("Error fetching auto-sent invitation:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// export all at once
module.exports = {
  sendInvitation,
  acceptInvitation,
  deleteInvitation,
  cancelInvitation,
  getReceivedInvitations,
  sendAutoGroupInvitation,
  getSentInvitations,
getAutoSentInvitation
};
