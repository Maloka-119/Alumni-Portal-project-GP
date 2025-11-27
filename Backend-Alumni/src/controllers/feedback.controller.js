const Feedback = require("../models/Feedback");
const User = require("../models/User");
const { logger, securityLogger } = require("../utils/logger");

// 1️⃣ إضافة Feedback جديد
const createFeedback = async (req, res) => {
  try {
    const graduate_id = req.user?.id;

    if (!graduate_id) {
      securityLogger.warn("Unauthenticated feedback submission attempt");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { category, title, details, phone, email } = req.body;

    const newFeedback = await Feedback.create({
      category,
      title,
      details,
      phone,
      email,
      graduate_id,
    });

    logger.info("New feedback submitted", {
      feedbackId: newFeedback.id,
      graduate_id,
      category,
      title,
    });

    return res.status(201).json({
      message: "Feedback submitted successfully",
      data: newFeedback,
    });

  } catch (error) {
    logger.error("Error creating feedback", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Server error", error });
  }
};

// 2️⃣ جلب كل Feedback
const getAllFeedback = async (req, res) => {
  try {
    const list = await Feedback.findAll({
      include: [{ model: User, attributes: ["first-name", "last-name", "email"] }],
    });

    logger.info("Admin fetched all feedbacks", { count: list.length });

    res.json(list);
  } catch (error) {
    logger.error("Error fetching all feedback", { error: error.message });
    res.status(500).json({ message: "Server error" });
  }
};

// 3️⃣ جلب Feedback الخاص بالمستخدم الحالي
const getMyFeedback = async (req, res) => {
  try {
    if (!req.user) {
      securityLogger.warn("Unauthenticated my-feedback access attempt");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const myList = await Feedback.findAll({
      where: { graduate_id: req.user.id },
      include: [
        { model: User, attributes: ["first-name", "last-name", "email"] }
      ],
    });

    logger.info("User fetched their feedback list", {
      userId: req.user.id,
      count: myList.length,
    });

    res.json(myList);
  } catch (error) {
    logger.error("Error in getMyFeedback", { error: error.message });
    res.status(500).json({ message: "Server error" });
  }
};

// 4️⃣ جلب Feedback لخريج معيّن
const getGraduateFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedbacks = await Feedback.findAll({ where: { graduate_id: id } });

    logger.info("Admin fetched feedbacks for graduate", {
      graduateId: id,
      count: feedbacks.length,
    });

    res.json(feedbacks);

  } catch (error) {
    logger.error("Error fetching graduate feedback", { error: error.message });
    res.status(500).json({ message: "Server error" });
  }
};

// 5️⃣ فلترة حسب النوع
const getByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const filtered = await Feedback.findAll({ where: { category } });

    logger.info("Feedback filtered by category", {
      category,
      count: filtered.length,
    });

    res.json(filtered);

  } catch (error) {
    logger.error("Error filtering feedback by category", { error: error.message });
    res.status(500).json({ message: "Server error" });
  }
};

// 6️⃣ حذف Feedback
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Feedback.destroy({ where: { id } });

    if (!deleted) {
      logger.warn("Attempted to delete non-existing feedback", { id });
      return res.status(404).json({ message: "Feedback not found" });
    }

    logger.info("Feedback deleted", { feedbackId: id });

    res.json({ message: "Feedback deleted successfully" });

  } catch (error) {
    logger.error("Error deleting feedback", { error: error.message });
    res.status(500).json({ message: "Server error" });
  }
};

// 7️⃣ تعديل Feedback (مع تسجيل المحتوى القديم والجديد)
const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      logger.warn("Feedback not found for update", { id });
      return res.status(404).json({ message: "Feedback not found" });
    }

    const oldData = { ...feedback.dataValues }; // قبل التعديل

    await Feedback.update(req.body, { where: { id } });

    const updatedFeedback = await Feedback.findByPk(id);
    const newData = { ...updatedFeedback.dataValues }; // بعد التعديل

    logger.info("Feedback updated", {
      feedbackId: id,
      oldData,
      newData,
    });

    res.json({
      message: "Feedback updated successfully",
      oldData,
      newData,
    });

  } catch (error) {
    logger.error("Error updating feedback", { error: error.message });
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createFeedback,
  getAllFeedback,
  getGraduateFeedback,
  getByCategory,
  deleteFeedback,
  updateFeedback,
  getMyFeedback
};
