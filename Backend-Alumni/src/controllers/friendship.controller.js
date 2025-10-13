const { Op } = require("sequelize");
const Friendship = require("../models/Friendship");
const Graduate = require("../models/Graduate");

/**
 * 1️⃣ View Suggestions
 */
exports.viewSuggestions = async (req, res) => {
  try {
    const userId = req.user.graduate_id;

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
      },
    });

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 2️⃣ Send Friend Request
 */
exports.sendRequest = async (req, res) => {
  try {
    const senderId = req.user.graduate_id;
    const { receiverId } = req.params;

    if (senderId == receiverId)
      return res.status(400).json({ message: "You cannot add yourself" });

    const existing = await Friendship.findOne({
      where: {
        [Op.or]: [
          { sender_id: senderId, receiver_id: receiverId },
          { sender_id: receiverId, receiver_id: senderId },
        ],
      },
    });

    if (existing)
      return res.status(400).json({ message: "Friend request already exists" });

    const request = await Friendship.create({
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 3️⃣ Cancel Sent Request
 */
exports.cancelRequest = async (req, res) => {
  try {
    const senderId = req.user.graduate_id;
    const { receiverId } = req.params;

    await Friendship.destroy({
      where: { sender_id: senderId, receiver_id: receiverId, status: "pending" },
    });

    res.json({ message: "Request canceled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 4️⃣ View Friend Requests (الطلبات اللي جاياله)
 */
exports.viewRequests = async (req, res) => {
  try {
    const userId = req.user.graduate_id;

    const requests = await Friendship.findAll({
      where: {
        receiver_id: userId,
        status: "pending",
        hidden_for_receiver: false,
      },
      include: [{ model: Graduate, as: "sender" }],
    });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 5️⃣ Confirm Friend Request
 */
exports.confirmRequest = async (req, res) => {
  try {
    const receiverId = req.user.graduate_id;
    const { senderId } = req.params;

    const request = await Friendship.findOne({
      where: { sender_id: senderId, receiver_id: receiverId, status: "pending" },
    });

    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "accepted";
    request.updated_at = new Date();
    await request.save();

    res.json({ message: "Friend request accepted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 6️⃣ Delete From My Requests
 */
exports.deleteFromMyRequests = async (req, res) => {
  try {
    const receiverId = req.user.graduate_id;
    const { senderId } = req.params;

    await Friendship.update(
      { hidden_for_receiver: true },
      { where: { sender_id: senderId, receiver_id: receiverId, status: "pending" } }
    );

    res.json({ message: "Request hidden for receiver" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 7️⃣ View My Friends
 */
exports.viewFriends = async (req, res) => {
  try {
    const userId = req.user.graduate_id;

    const friends = await Friendship.findAll({
      where: {
        status: "accepted",
        [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
      },
      include: [
        { model: Graduate, as: "sender" },
        { model: Graduate, as: "receiver" },
      ],
    });

    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 8️⃣ Delete From My Friends
 */
exports.deleteFriend = async (req, res) => {
  try {
    const userId = req.user.graduate_id;
    const { friendId } = req.params;

    await Friendship.destroy({
      where: {
        status: "accepted",
        [Op.or]: [
          { sender_id: userId, receiver_id: friendId },
          { sender_id: friendId, receiver_id: userId },
        ],
      },
    });

    res.json({ message: "Friend removed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
