const Feedback = require("../models/Feedback");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
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

    if (!category || !title || !details) {
      return res.status(400).json({
        message: "Category, title and details are required",
      });
    }

    if (!["Complaint", "Suggestion"].includes(category)) {
      return res.status(400).json({
        message: "Invalid category value",
      });
    }

    let attachmentUrl = null;

    // 📌 لو في ملف مرفوع
    if (req.file) {
      if (category !== "Complaint") {
        return res.status(400).json({
          message: "Attachment allowed only for Complaint",
        });
      }

      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          message: "Invalid file type. Only JPG, PNG, PDF allowed.",
        });
      }

      // رفع على Cloudinary
      const uploadToCloudinary = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "feedback_attachments",
              resource_type: "auto",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

      const result = await uploadToCloudinary();
      attachmentUrl = result.secure_url;
    }

    const newFeedback = await Feedback.create({
      category,
      title,
      details,
      phone,
      email,
      graduate_id,
      attachment: attachmentUrl,
    });

    logger.info("New feedback submitted", {
      feedbackId: newFeedback.feedback_id,
      graduate_id,
      category,
      hasAttachment: !!attachmentUrl,
    });

    return res.status(201).json({
      message: "Feedback submitted successfully",
      data: newFeedback,
    });

  } catch (error) {
    logger.error("Error creating feedback", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ message: "Server error" });
  }
};


// 2️⃣ جلب كل Feedback (Admin)
const getAllFeedback = async (req, res) => {
  try {
    const list = await Feedback.findAll({
      include: [
        { model: User, attributes: ["first-name", "last-name", "email"] }
      ],
      order: [["createdAt", "DESC"]],
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
      order: [["createdAt", "DESC"]],
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


// 4️⃣ جلب Feedback لخريج معيّن (Admin)
const getGraduateFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedbacks = await Feedback.findAll({
      where: { graduate_id: id },
      order: [["createdAt", "DESC"]],
    });

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

    if (!["Complaint", "Suggestion"].includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const filtered = await Feedback.findAll({
      where: { category },
      order: [["createdAt", "DESC"]],
    });

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


// 6️⃣ حذف Feedback (مع حذف الملف من Cloudinary)
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      logger.warn("Attempted to delete non-existing feedback", { id });
      return res.status(404).json({ message: "Feedback not found" });
    }

    // لو في attachment نحذفه من Cloudinary
    if (feedback.attachment) {
      const publicId = feedback.attachment
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];

      await cloudinary.uploader.destroy(publicId, {
        resource_type: "auto",
      });
    }

    await Feedback.destroy({ where: { feedback_id: id } });

    logger.info("Feedback deleted", { feedbackId: id });

    res.json({ message: "Feedback deleted successfully" });

  } catch (error) {
    logger.error("Error deleting feedback", { error: error.message });
    res.status(500).json({ message: "Server error" });
  }
};


// 7️⃣ تعديل Feedback
const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      logger.warn("Feedback not found for update", { id });
      return res.status(404).json({ message: "Feedback not found" });
    }

    const oldData = { ...feedback.dataValues };

    await Feedback.update(req.body, {
      where: { feedback_id: id },
    });

    const updatedFeedback = await Feedback.findByPk(id);

    logger.info("Feedback updated", {
      feedbackId: id,
      oldData,
      newData: updatedFeedback.dataValues,
    });

    res.json({
      message: "Feedback updated successfully",
      data: updatedFeedback,
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
  getMyFeedback,
};