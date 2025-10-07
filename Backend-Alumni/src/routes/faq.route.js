const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faq.controller');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no authentication required)
// @route   GET /alumni-portal/faqs/categories
// @desc    Get FAQ categories
// @access  Public
router.get('/categories', faqController.getFAQCategories);

// @route   GET /alumni-portal/faqs
// @desc    Get all active FAQs with optional filters
// @access  Public
router.get('/', faqController.getAllFAQs);

// @route   GET /alumni-portal/faqs/:id
// @desc    Get single FAQ
// @access  Public
router.get('/:id', faqController.getFAQ);

module.exports = router;
