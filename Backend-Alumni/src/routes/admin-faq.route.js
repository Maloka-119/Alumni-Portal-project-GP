const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faq.controller');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require admin authentication
router.use(authMiddleware.protect);
router.use(authMiddleware.admin);

// @route   GET /alumni-portal/admin/faqs
// @desc    Get all FAQs (admin access - includes inactive)
// @access  Admin
router.get('/', faqController.getAllFAQsAdmin);

// @route   PUT /alumni-portal/admin/faqs/reorder
// @desc    Reorder FAQs
// @access  Admin
router.put('/reorder', faqController.reorderFAQs);

// @route   GET /alumni-portal/admin/faqs/:id
// @desc    Get single FAQ (admin access)
// @access  Admin
router.get('/:id', faqController.getFAQ);

// @route   POST /alumni-portal/admin/faqs
// @desc    Create new FAQ
// @access  Admin
router.post('/', faqController.createFAQ);

// @route   PUT /alumni-portal/admin/faqs/:id
// @desc    Update FAQ
// @access  Admin
router.put('/:id', faqController.updateFAQ);

// @route   DELETE /alumni-portal/admin/faqs/:id/hard
// @desc    Hard delete FAQ (permanent removal)
// @access  Admin
router.delete('/:id/hard', faqController.hardDeleteFAQ);

// @route   DELETE /alumni-portal/admin/faqs/:id
// @desc    Soft delete FAQ (mark as inactive)
// @access  Admin
router.delete('/:id', faqController.deleteFAQ);

module.exports = router;
