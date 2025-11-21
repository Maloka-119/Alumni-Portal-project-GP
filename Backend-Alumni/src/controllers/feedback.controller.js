const Feedback = require("../models/Feedback");
const User = require("../models/User");

// 1️⃣ إضافة Feedback جديد
const createFeedback = async (req, res) => {
  try {
    const graduate_id = req.user?.id;

    if (!graduate_id) {
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

    return res.status(201).json({
      message: "Feedback submitted successfully",
      data: newFeedback,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 1️⃣ جلب كل Feedback
const getAllFeedback = async (req, res) => {
  try {
    const list = await Feedback.findAll({
      include: [{ model: User, attributes: ["first-name", "last-name", "email"] }],
    });

    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2️⃣ جلب Feedback الخاص بالمستخدم الحالي
const getMyFeedback = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // جلب الفيدباكس الخاصة بالمستخدم الحالي حسب graduate_id
    const myList = await Feedback.findAll({
      where: { graduate_id: req.user.id }, // استخدم graduate_id بدل userId
      include: [
        {
          model: User,
          attributes: ["first-name", "last-name", "email"],
        },
      ],
    });

    res.json(myList);
  } catch (error) {
    console.error("Error in getMyFeedback:", error); // اعرض الخطأ الكامل للتصحيح
    res.status(500).json({ message: "Server error" });
  }
};


// 3️⃣ جلب Feedback خاص بخريج محدد
const getGraduateFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedbacks = await Feedback.findAll({
      where: { graduate_id: id },
    });

    res.json(feedbacks);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 4️⃣ فلترة حسب النوع (Complaint / Suggestion)
const getByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const filtered = await Feedback.findAll({
      where: { category },
    });

    res.json(filtered);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 5️⃣ حذف Feedback
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Feedback.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({ message: "Feedback deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 6️⃣ تعديل Feedback
const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Feedback.update(req.body, { where: { id } });

    if (!updated) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({ message: "Feedback updated successfully" });

  } catch (error) {
    console.error(error);
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
