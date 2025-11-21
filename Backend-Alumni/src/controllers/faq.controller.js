const { FAQ, User } = require("../models");
const asyncHandler = require("express-async-handler");
const { Op } = require("sequelize");
const checkStaffPermission = require("../utils/permissionChecker");

// @desc    Get all FAQs (public access - only active)
// @route   GET /alumni-portal/faqs
// @access  Public
const getAllFAQs = asyncHandler(async (req, res) => {
  const { category, search, sort = "order", lang = "en" } = req.query;

  let whereClause = { is_active: true };
  let orderClause = [
    ["order", "ASC"],
    ["created-at", "ASC"],
  ];

  // Filter by category
  if (category) {
    whereClause.category = category;
  }

  // Search functionality based on language
  if (search) {
    if (lang === "ar") {
      whereClause[Op.or] = [
        { question_ar: { [Op.iLike]: `%${search}%` } },
        { answer_ar: { [Op.iLike]: `%${search}%` } },
      ];
    } else {
      whereClause[Op.or] = [
        { question_en: { [Op.iLike]: `%${search}%` } },
        { answer_en: { [Op.iLike]: `%${search}%` } },
      ];
    }
  }

  // Sorting options
  if (sort === "date") {
    orderClause = [["created-at", "DESC"]];
  } else if (sort === "category") {
    orderClause = [
      ["category", "ASC"],
      ["order", "ASC"],
    ];
  }

  const faqs = await FAQ.findAll({
    where: whereClause,
    order: orderClause,
    include: [
      {
        model: User,
        as: "creator",
        attributes: ["id", "first-name", "last-name"],
      },
    ],
  });

  // Format response based on language preference
  const formattedFAQs = faqs.map(faq => ({
    faq_id: faq.faq_id,
    question: lang === "ar" ? faq.question_ar : faq.question_en,
    answer: lang === "ar" ? faq.answer_ar : faq.answer_en,
    question_ar: faq.question_ar,
    question_en: faq.question_en,
    answer_ar: faq.answer_ar,
    answer_en: faq.answer_en,
    order: faq.order,
    category: faq.category,
    is_active: faq.is_active,
    created_by: faq.created_by,
    updated_by: faq.updated_by,
    "created-at": faq["created-at"],
    "updated-at": faq["updated-at"],
    creator: faq.creator
  }));

  res.status(200).json({
    success: true,
    count: formattedFAQs.length,
    data: formattedFAQs,
  });
});

// @desc    Get all FAQs (admin access - includes inactive)
// @route   GET /alumni-portal/admin/faqs
// @access  Admin & Staff
const getAllFAQsAdmin = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    const { category, search, is_active, sort = "order", lang = "en" } = req.query;

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "FAQ management",
        "view"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You don't have permission to view FAQs.",
        });
      }
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    let whereClause = {};
    let orderClause = [
      ["order", "ASC"],
      ["created-at", "ASC"],
    ];

    // Filter by category
    if (category) {
      whereClause.category = category;
    }

    // Filter by active status
    if (is_active !== undefined) {
      whereClause.is_active = is_active === "true";
    }

    // Search functionality based on language
    if (search) {
      if (lang === "ar") {
        whereClause[Op.or] = [
          { question_ar: { [Op.iLike]: `%${search}%` } },
          { answer_ar: { [Op.iLike]: `%${search}%` } },
        ];
      } else {
        whereClause[Op.or] = [
          { question_en: { [Op.iLike]: `%${search}%` } },
          { answer_en: { [Op.iLike]: `%${search}%` } },
        ];
      }
    }

    // Sorting options
    if (sort === "date") {
      orderClause = [["created-at", "DESC"]];
    } else if (sort === "category") {
      orderClause = [
        ["category", "ASC"],
        ["order", "ASC"],
      ];
    }

    const faqs = await FAQ.findAll({
      where: whereClause,
      order: orderClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "first-name", "last-name"],
        },
        {
          model: User,
          as: "updater",
          attributes: ["id", "first-name", "last-name"],
        },
      ],
    });

    // Format response with both languages
    const formattedFAQs = faqs.map(faq => ({
      ...faq.toJSON(),
      question: lang === "ar" ? faq.question_ar : faq.question_en,
      answer: lang === "ar" ? faq.answer_ar : faq.answer_en,
    }));

    res.status(200).json({
      success: true,
      count: formattedFAQs.length,
      data: formattedFAQs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Get single FAQ
// @route   GET /alumni-portal/faqs/:id
// @access  Public
const getFAQ = asyncHandler(async (req, res) => {
  const { lang = "en" } = req.query;

  const faq = await FAQ.findOne({
    where: {
      faq_id: req.params.id,
      is_active: true,
    },
    include: [
      {
        model: User,
        as: "creator",
        attributes: ["id", "first-name", "last-name"],
      },
    ],
  });

  if (!faq) {
    return res.status(404).json({
      success: false,
      message: "FAQ not found",
    });
  }

  // Format response based on language preference
  const formattedFAQ = {
    ...faq.toJSON(),
    question: lang === "ar" ? faq.question_ar : faq.question_en,
    answer: lang === "ar" ? faq.answer_ar : faq.answer_en,
  };

  res.status(200).json({
    success: true,
    data: formattedFAQ,
  });
});

// @desc    Create new FAQ
// @route   POST /alumni-portal/admin/faqs
// @access  Admin & Staff
const createFAQ = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    const { question_ar, question_en, answer_ar, answer_en, order, category, is_active } = req.body;

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "FAQ management",
        "add"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You don't have permission to create FAQs.",
        });
      }
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    // Validate required fields for both languages
    if (!question_ar || !question_en || !answer_ar || !answer_en) {
      return res.status(400).json({
        success: false,
        message: "Question and answer in both Arabic and English are required",
      });
    }

    // Check if order is provided, otherwise get the next order number
    let faqOrder = order;
    if (faqOrder === undefined || faqOrder === null) {
      const lastFAQ = await FAQ.findOne({
        order: [["order", "DESC"]],
      });
      faqOrder = lastFAQ ? lastFAQ.order + 1 : 1;
    }

    const faq = await FAQ.create({
      question_ar: question_ar.trim(),
      question_en: question_en.trim(),
      answer_ar: answer_ar.trim(),
      answer_en: answer_en.trim(),
      order: faqOrder,
      category: category?.trim() || "General",
      is_active: is_active !== undefined ? is_active : true,
      created_by: user.id,
      "created-at": new Date(),
      "updated-at": new Date(),
    });

    // Fetch the created FAQ with creator info
    const createdFAQ = await FAQ.findByPk(faq.faq_id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "first-name", "last-name"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: createdFAQ,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Update FAQ
// @route   PUT /alumni-portal/admin/faqs/:id
// @access  Admin & Staff
const updateFAQ = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    const { question_ar, question_en, answer_ar, answer_en, order, category, is_active } = req.body;

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "FAQ management",
        "edit"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You don't have permission to update FAQs.",
        });
      }
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    const faq = await FAQ.findByPk(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    // Update fields
    const updateData = {
      "updated-by": user.id,
      "updated-at": new Date(),
    };

    if (question_ar !== undefined) updateData.question_ar = question_ar.trim();
    if (question_en !== undefined) updateData.question_en = question_en.trim();
    if (answer_ar !== undefined) updateData.answer_ar = answer_ar.trim();
    if (answer_en !== undefined) updateData.answer_en = answer_en.trim();
    if (order !== undefined) updateData.order = order;
    if (category !== undefined) updateData.category = category.trim();
    if (is_active !== undefined) updateData.is_active = is_active;

    await faq.update(updateData);

    // Fetch updated FAQ with creator and updater info
    const updatedFAQ = await FAQ.findByPk(faq.faq_id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "first-name", "last-name"],
        },
        {
          model: User,
          as: "updater",
          attributes: ["id", "first-name", "last-name"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: updatedFAQ,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Soft delete FAQ (mark as inactive)
// @route   DELETE /alumni-portal/admin/faqs/:id
// @access  Admin & Staff
const deleteFAQ = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "FAQ management",
        "delete"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You don't have permission to delete FAQs.",
        });
      }
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    const faq = await FAQ.findByPk(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    // Soft delete - mark as inactive
    await faq.update({
      is_active: false,
      "updated-by": user.id,
      "updated-at": new Date(),
    });

    res.status(200).json({
      success: true,
      message: "FAQ deleted successfully (marked as inactive)",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Hard delete FAQ (permanent removal)
// @route   DELETE /alumni-portal/admin/faqs/:id/hard
// @access  Admin & Staff
const hardDeleteFAQ = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "FAQ management",
        "delete"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You don't have permission to delete FAQs.",
        });
      }
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    const faq = await FAQ.findByPk(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    await faq.destroy();

    res.status(200).json({
      success: true,
      message: "FAQ permanently deleted",
    });
  } catch ( error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Get FAQ categories
// @route   GET /alumni-portal/faqs/categories
// @access  Public
const getFAQCategories = asyncHandler(async (req, res) => {
  const categories = await FAQ.findAll({
    where: { is_active: true },
    attributes: ["category"],
    group: ["category"],
    order: [["category", "ASC"]],
  });

  const categoryList = categories.map((faq) => faq.category);

  res.status(200).json({
    success: true,
    data: categoryList,
  });
});

// @desc    Reorder FAQs
// @route   PUT /alumni-portal/admin/faqs/reorder
// @access  Admin & Staff
const reorderFAQs = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    const { faq_orders } = req.body; // Array of { faq_id, order }

    // 1. تحديد اليوزر types المسموح لهم
    const allowedUserTypes = ["admin", "staff"];

    // 2. لو مش من النوع المسموح → ارفض
    if (!user || !allowedUserTypes.includes(user["user-type"])) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // 3. لو staff → تحقق من الصلاحية
    if (user["user-type"] === "staff") {
      const hasPermission = await checkStaffPermission(
        user.id,
        "FAQ management",
        "edit"
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You don't have permission to reorder FAQs.",
        });
      }
    }

    // 4. لو admin أو staff مع صلاحية → اتركه يكمل
    if (!Array.isArray(faq_orders)) {
      return res.status(400).json({
        success: false,
        message: "faq_orders must be an array",
      });
    }

    // Update orders in transaction
    const transaction = await FAQ.sequelize.transaction();

    try {
      for (const { faq_id, order } of faq_orders) {
        await FAQ.update(
          {
            order: order,
            "updated-by": user.id,
            "updated-at": new Date(),
          },
          {
            where: { faq_id },
            transaction,
          }
        );
      }

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: "FAQs reordered successfully",
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = {
  getAllFAQs,
  getAllFAQsAdmin,
  getFAQ,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  hardDeleteFAQ,
  getFAQCategories,
  reorderFAQs,
};