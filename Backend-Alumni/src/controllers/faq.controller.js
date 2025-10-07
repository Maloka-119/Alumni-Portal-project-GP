const { FAQ, User } = require('../models');
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');

// @desc    Get all FAQs (public access - only active)
// @route   GET /alumni-portal/faqs
// @access  Public
const getAllFAQs = asyncHandler(async (req, res) => {
  const { category, search, sort = 'order' } = req.query;
  
  let whereClause = { is_active: true };
  let orderClause = [['order', 'ASC'], ['created-at', 'ASC']];

  // Filter by category
  if (category) {
    whereClause.category = category;
  }

  // Search functionality
  if (search) {
    whereClause[Op.or] = [
      { question: { [Op.iLike]: `%${search}%` } },
      { answer: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Sorting options
  if (sort === 'date') {
    orderClause = [['created-at', 'DESC']];
  } else if (sort === 'category') {
    orderClause = [['category', 'ASC'], ['order', 'ASC']];
  }

  const faqs = await FAQ.findAll({
    where: whereClause,
    order: orderClause,
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'first-name', 'last-name']
      }
    ]
  });

  res.status(200).json({
    success: true,
    count: faqs.length,
    data: faqs
  });
});

// @desc    Get all FAQs (admin access - includes inactive)
// @route   GET /alumni-portal/admin/faqs
// @access  Admin
const getAllFAQsAdmin = asyncHandler(async (req, res) => {
  const { category, search, is_active, sort = 'order' } = req.query;
  
  let whereClause = {};
  let orderClause = [['order', 'ASC'], ['created-at', 'ASC']];

  // Filter by category
  if (category) {
    whereClause.category = category;
  }

  // Filter by active status
  if (is_active !== undefined) {
    whereClause.is_active = is_active === 'true';
  }

  // Search functionality
  if (search) {
    whereClause[Op.or] = [
      { question: { [Op.iLike]: `%${search}%` } },
      { answer: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Sorting options
  if (sort === 'date') {
    orderClause = [['created-at', 'DESC']];
  } else if (sort === 'category') {
    orderClause = [['category', 'ASC'], ['order', 'ASC']];
  }

  const faqs = await FAQ.findAll({
    where: whereClause,
    order: orderClause,
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'first-name', 'last-name']
      },
      {
        model: User,
        as: 'updater',
        attributes: ['id', 'first-name', 'last-name']
      }
    ]
  });

  res.status(200).json({
    success: true,
    count: faqs.length,
    data: faqs
  });
});

// @desc    Get single FAQ
// @route   GET /alumni-portal/faqs/:id
// @access  Public
const getFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.findOne({
    where: { 
      faq_id: req.params.id,
      is_active: true 
    },
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'first-name', 'last-name']
      }
    ]
  });

  if (!faq) {
    return res.status(404).json({
      success: false,
      message: 'FAQ not found'
    });
  }

  res.status(200).json({
    success: true,
    data: faq
  });
});

// @desc    Create new FAQ
// @route   POST /alumni-portal/admin/faqs
// @access  Admin
const createFAQ = asyncHandler(async (req, res) => {
  const { question, answer, order, category, is_active } = req.body;

  // Validate required fields
  if (!question || !answer) {
    return res.status(400).json({
      success: false,
      message: 'Question and answer are required'
    });
  }

  // Check if order is provided, otherwise get the next order number
  let faqOrder = order;
  if (faqOrder === undefined || faqOrder === null) {
    const lastFAQ = await FAQ.findOne({
      order: [['order', 'DESC']]
    });
    faqOrder = lastFAQ ? lastFAQ.order + 1 : 1;
  }

  const faq = await FAQ.create({
    question: question.trim(),
    answer: answer.trim(),
    order: faqOrder,
    category: category?.trim() || 'General',
    is_active: is_active !== undefined ? is_active : true,
    created_by: req.user.id,
    'created-at': new Date(),
    'updated-at': new Date()
  });

  // Fetch the created FAQ with creator info
  const createdFAQ = await FAQ.findByPk(faq.faq_id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'first-name', 'last-name']
      }
    ]
  });

  res.status(201).json({
    success: true,
    data: createdFAQ
  });
});

// @desc    Update FAQ
// @route   PUT /alumni-portal/admin/faqs/:id
// @access  Admin
const updateFAQ = asyncHandler(async (req, res) => {
  const { question, answer, order, category, is_active } = req.body;

  const faq = await FAQ.findByPk(req.params.id);

  if (!faq) {
    return res.status(404).json({
      success: false,
      message: 'FAQ not found'
    });
  }

  // Update fields
  const updateData = {
    'updated-by': req.user.id,
    'updated-at': new Date()
  };

  if (question !== undefined) updateData.question = question.trim();
  if (answer !== undefined) updateData.answer = answer.trim();
  if (order !== undefined) updateData.order = order;
  if (category !== undefined) updateData.category = category.trim();
  if (is_active !== undefined) updateData.is_active = is_active;

  await faq.update(updateData);

  // Fetch updated FAQ with creator and updater info
  const updatedFAQ = await FAQ.findByPk(faq.faq_id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'first-name', 'last-name']
      },
      {
        model: User,
        as: 'updater',
        attributes: ['id', 'first-name', 'last-name']
      }
    ]
  });

  res.status(200).json({
    success: true,
    data: updatedFAQ
  });
});

// @desc    Soft delete FAQ (mark as inactive)
// @route   DELETE /alumni-portal/admin/faqs/:id
// @access  Admin
const deleteFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByPk(req.params.id);

  if (!faq) {
    return res.status(404).json({
      success: false,
      message: 'FAQ not found'
    });
  }

  // Soft delete - mark as inactive
  await faq.update({
    is_active: false,
    'updated-by': req.user.id,
    'updated-at': new Date()
  });

  res.status(200).json({
    success: true,
    message: 'FAQ deleted successfully (marked as inactive)'
  });
});

// @desc    Hard delete FAQ (permanent removal)
// @route   DELETE /alumni-portal/admin/faqs/:id/hard
// @access  Admin
const hardDeleteFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByPk(req.params.id);

  if (!faq) {
    return res.status(404).json({
      success: false,
      message: 'FAQ not found'
    });
  }

  await faq.destroy();

  res.status(200).json({
    success: true,
    message: 'FAQ permanently deleted'
  });
});

// @desc    Get FAQ categories
// @route   GET /alumni-portal/faqs/categories
// @access  Public
const getFAQCategories = asyncHandler(async (req, res) => {
  const categories = await FAQ.findAll({
    where: { is_active: true },
    attributes: ['category'],
    group: ['category'],
    order: [['category', 'ASC']]
  });

  const categoryList = categories.map(faq => faq.category);

  res.status(200).json({
    success: true,
    data: categoryList
  });
});

// @desc    Reorder FAQs
// @route   PUT /alumni-portal/admin/faqs/reorder
// @access  Admin
const reorderFAQs = asyncHandler(async (req, res) => {
  const { faq_orders } = req.body; // Array of { faq_id, order }

  if (!Array.isArray(faq_orders)) {
    return res.status(400).json({
      success: false,
      message: 'faq_orders must be an array'
    });
  }

  // Update orders in transaction
  const transaction = await FAQ.sequelize.transaction();

  try {
    for (const { faq_id, order } of faq_orders) {
      await FAQ.update(
        { 
          order: order,
          'updated-by': req.user.id,
          'updated-at': new Date()
        },
        { 
          where: { faq_id },
          transaction 
        }
      );
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'FAQs reordered successfully'
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
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
  reorderFAQs
};
