const { Op } = require("sequelize");
const Friendship = require("../models/Friendship");
const Graduate = require("../models/Graduate");
const User = require("../models/User");
const {
  notifyUserAdded,
  notifyRequestAccepted,
} = require("../services/notificationService");

// 🔴 START OF LOGGER IMPORT - ADDED THIS
const { logger, securityLogger } = require("../utils/logger");
// 🔴 END OF LOGGER IMPORT

//1- View Suggestions
const viewSuggestions = async (req, res) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("View friend suggestions initiated", {
      userId: req.user?.id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    if (!req.user)
      return res.status(401).json({ message: "User not authenticated" });

    const userId = req.user.id;

    const relations = await Friendship.findAll({
      where: {
        [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
      },
    });

    const relatedIds = relations.flatMap((r) => [r.sender_id, r.receiver_id]);

    const suggestions = await Graduate.findAll({
      where: {
        graduate_id: {
          [Op.notIn]: [...relatedIds, userId],
        },
        "status-to-login": "accepted",
      },
      include: [
        {
          model: User,
          attributes: ["id", "first-name", "last-name"],
        },
      ],
    });

    const formatted = suggestions.map((g) => ({
      graduate_id: g.graduate_id,
      fullName: `${g.User["first-name"]} ${g.User["last-name"]}`,
      faculty: g.faculty,
      "profile-picture-url": g["profile-picture-url"],
    }));

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Friend suggestions retrieved successfully", {
      userId,
      suggestionCount: formatted.length,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.json(formatted);
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error viewing friend suggestions", {
      userId: req.user?.id,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    res.status(500).json({ message: err.message });
  }
};

//2- Send Friend Request
const sendRequest = async (req, res) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Send friend request initiated", {
      userId: req.user?.id,
      receiverId: req.params.receiverId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    if (!req.user)
      return res.status(401).json({ message: "User not authenticated" });

    const graduate = await Graduate.findOne({
      where: { graduate_id: req.user.id },
    });
    if (!graduate) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("No graduate profile found for user", {
        userId: req.user.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(401).json({ message: "No graduate profile found" });
    }

    const senderId = graduate.graduate_id;
    const { receiverId } = req.params;

    if (senderId == receiverId) {
      // 🔴 START OF LOGGING - ADDED THIS
      securityLogger.warn("User attempted to add themselves as friend", {
        userId: senderId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    const existing = await Friendship.findOne({
      where: {
        [Op.or]: [
          { sender_id: senderId, receiver_id: receiverId },
          { sender_id: receiverId, receiver_id: senderId },
        ],
      },
    });

    if (existing) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Friend request already exists", {
        senderId,
        receiverId,
        existingStatus: existing.status,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(400).json({ message: "Friend request already exists" });
    }

    const request = await Friendship.create({
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
    });

    const receiverGraduate = await Graduate.findOne({
      where: { graduate_id: receiverId },
      include: [{ model: User, attributes: ["first-name", "last-name"] }],
    });

    // Create notification for the receiver
    await notifyUserAdded(receiverId, senderId);

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Friend request sent successfully", {
      senderId,
      receiverId,
      requestId: request.id,
      receiverName: `${receiverGraduate.User["first-name"]} ${receiverGraduate.User["last-name"]}`,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.json({
      message: "Request sent successfully",
      receiverFullName: `${receiverGraduate.User["first-name"]} ${receiverGraduate.User["last-name"]}`,
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error sending friend request", {
      userId: req.user?.id,
      receiverId: req.params.receiverId,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    res.status(500).json({ message: err.message });
  }
};

//3- Cancel Sent Request
const cancelRequest = async (req, res) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Cancel friend request initiated", {
      userId: req.user?.id,
      receiverId: req.params.receiverId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    if (!req.user)
      return res.status(401).json({ message: "User not authenticated" });

    const graduate = await Graduate.findOne({
      where: { graduate_id: req.user.id },
    });
    if (!graduate) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Graduate profile not found for cancellation", {
        userId: req.user.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(401).json({ message: "Graduate profile not found" });
    }

    const senderId = graduate.graduate_id;
    const { receiverId } = req.params;

    const result = await Friendship.destroy({
      where: {
        sender_id: senderId,
        receiver_id: receiverId,
        status: "pending",
      },
    });

    // 🔴 START OF LOGGING - ADDED THIS
    if (result > 0) {
      logger.info("Friend request canceled successfully", {
        senderId,
        receiverId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.warn("No pending friend request found to cancel", {
        senderId,
        receiverId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    }
    // 🔴 END OF LOGGING

    res.json({ message: "Request canceled" });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error canceling friend request", {
      userId: req.user?.id,
      receiverId: req.params.receiverId,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    res.status(500).json({ message: err.message });
  }
};

//4- View Friend Requests
const viewRequests = async (req, res) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("View friend requests initiated", {
      userId: req.user?.id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    if (!req.user)
      return res.status(401).json({ message: "User not authenticated" });

    const graduate = await Graduate.findOne({
      where: { graduate_id: req.user.id },
    });
    if (!graduate) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Graduate profile not found for viewing requests", {
        userId: req.user.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(401).json({ message: "Graduate profile not found" });
    }

    const userId = graduate.graduate_id;

    const requests = await Friendship.findAll({
      where: {
        receiver_id: userId,
        status: "pending",
        hidden_for_receiver: false,
      },
      include: [
        {
          model: Graduate,
          as: "sender",
          include: [{ model: User, attributes: ["first-name", "last-name"] }],
        },
      ],
    });

    const formatted = requests.map((r) => ({
      id: r.id,
      senderId: r.sender_id,
      fullName: `${r.sender.User["first-name"]} ${r.sender.User["last-name"]}`,
      profilePicture: r.sender["profile-picture-url"] || null,
    }));

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Friend requests retrieved successfully", {
      userId,
      requestCount: formatted.length,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.json(formatted);
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error viewing friend requests", {
      userId: req.user?.id,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    res.status(500).json({ message: err.message });
  }
};

//5- Confirm Friend Request
const confirmRequest = async (req, res) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Confirm friend request initiated", {
      userId: req.user?.id,
      senderId: req.params.senderId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    if (!req.user)
      return res.status(401).json({ message: "User not authenticated" });

    const graduate = await Graduate.findOne({
      where: { graduate_id: req.user.id },
    });
    if (!graduate) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Graduate profile not found for confirming request", {
        userId: req.user.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(401).json({ message: "Graduate profile not found" });
    }

    const receiverId = graduate.graduate_id;
    const { senderId } = req.params;

    const request = await Friendship.findOne({
      where: {
        sender_id: senderId,
        receiver_id: receiverId,
        status: "pending",
      },
    });

    if (!request) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Friend request not found for confirmation", {
        senderId,
        receiverId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "accepted";
    request.updated_at = new Date();
    await request.save();

    const senderGraduate = await Graduate.findOne({
      where: { graduate_id: senderId },
      include: [{ model: User, attributes: ["first-name", "last-name"] }],
    });

    // Create notification for the sender (who sent the original request)
    await notifyRequestAccepted(senderId, receiverId);

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Friend request confirmed successfully", {
      senderId,
      receiverId,
      requestId: request.id,
      senderName: `${senderGraduate.User["first-name"]} ${senderGraduate.User["last-name"]}`,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.json({
      message: "Friend request accepted",
      friendFullName: `${senderGraduate.User["first-name"]} ${senderGraduate.User["last-name"]}`,
    });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error confirming friend request", {
      userId: req.user?.id,
      senderId: req.params.senderId,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    res.status(500).json({ message: err.message });
  }
};

//6- Delete From My Requests
const deleteFromMyRequests = async (req, res) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Delete from my requests initiated", {
      userId: req.user?.id,
      senderId: req.params.senderId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    if (!req.user)
      return res.status(401).json({ message: "User not authenticated" });

    const graduate = await Graduate.findOne({
      where: { graduate_id: req.user.id },
    });
    if (!graduate) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Graduate profile not found for deleting request", {
        userId: req.user.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(401).json({ message: "Graduate profile not found" });
    }

    const receiverId = graduate.graduate_id;
    const { senderId } = req.params;

    const result = await Friendship.update(
      { hidden_for_receiver: true },
      {
        where: {
          sender_id: senderId,
          receiver_id: receiverId,
          status: "pending",
        },
      }
    );

    // 🔴 START OF LOGGING - ADDED THIS
    if (result[0] > 0) {
      logger.info("Friend request hidden successfully", {
        senderId,
        receiverId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.warn("No pending friend request found to hide", {
        senderId,
        receiverId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    }
    // 🔴 END OF LOGGING

    res.json({ message: "Request hidden for receiver" });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error hiding friend request", {
      userId: req.user?.id,
      senderId: req.params.senderId,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    res.status(500).json({ message: err.message });
  }
};

//7- View My Friends
const viewFriends = async (req, res) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("View friends initiated", {
      userId: req.user?.id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    if (!req.user)
      return res.status(401).json({ message: "User not authenticated" });

    const graduate = await Graduate.findOne({
      where: { graduate_id: req.user.id },
    });
    if (!graduate) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Graduate profile not found for viewing friends", {
        userId: req.user.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(401).json({ message: "Graduate profile not found" });
    }

    const userId = graduate.graduate_id;

    const friends = await Friendship.findAll({
      where: {
        status: "accepted",
        [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
      },
      include: [
        { model: Graduate, as: "sender", include: [{ model: User }] },
        { model: Graduate, as: "receiver", include: [{ model: User }] },
      ],
    });

    const formatted = friends.map((f) => {
      const friend = f.sender_id === userId ? f.receiver : f.sender;
      return {
        friendId: friend.graduate_id,
        fullName: `${friend.User["first-name"]} ${friend.User["last-name"]}`,
        faculty: friend.faculty,
        profilePicture: friend["profile-picture-url"],
      };
    });

    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Friends list retrieved successfully", {
      userId,
      friendCount: formatted.length,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    res.json(formatted);
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error viewing friends", {
      userId: req.user?.id,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    res.status(500).json({ message: err.message });
  }
};

//8- Delete From My Friends
const deleteFriend = async (req, res) => {
  try {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.info("Delete friend initiated", {
      userId: req.user?.id,
      friendId: req.params.friendId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING

    if (!req.user)
      return res.status(401).json({ message: "User not authenticated" });

    const graduate = await Graduate.findOne({
      where: { graduate_id: req.user.id },
    });
    if (!graduate) {
      // 🔴 START OF LOGGING - ADDED THIS
      logger.warn("Graduate profile not found for deleting friend", {
        userId: req.user.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      // 🔴 END OF LOGGING
      return res.status(401).json({ message: "Graduate profile not found" });
    }

    const userId = graduate.graduate_id;
    const { friendId } = req.params;

    const result = await Friendship.destroy({
      where: {
        status: "accepted",
        [Op.or]: [
          { sender_id: userId, receiver_id: friendId },
          { sender_id: friendId, receiver_id: userId },
        ],
      },
    });

    // 🔴 START OF LOGGING - ADDED THIS
    if (result > 0) {
      logger.info("Friend deleted successfully", {
        userId,
        friendId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.warn("No friendship found to delete", {
        userId,
        friendId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    }
    // 🔴 END OF LOGGING

    res.json({ message: "Friend deleted successfully" });
  } catch (err) {
    // 🔴 START OF LOGGING - ADDED THIS
    logger.error("Error deleting friend", {
      userId: req.user?.id,
      friendId: req.params.friendId,
      error: err.message,
      stack: err.stack.substring(0, 200),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    // 🔴 END OF LOGGING
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  viewSuggestions,
  sendRequest,
  cancelRequest,
  viewRequests,
  confirmRequest,
  deleteFromMyRequests,
  viewFriends,
  deleteFriend,
};
