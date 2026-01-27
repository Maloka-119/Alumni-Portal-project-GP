const express = require("express");
const router = express.Router();
const documentRequestController = require("../controllers/documentRequest.Controller"); // ⬅️ التعديل هنا
const { protect } = require("../middleware/authMiddleware");

// ==================== GRADUATE ROUTES ====================
// Create new document request (Graduates only)
router.post(
  "/requests",
  protect,
  documentRequestController.createDocumentRequest
);

// Get graduate's own document requests (Graduates only)
router.get(
  "/requests/my-requests",
  protect,
  documentRequestController.getMyDocumentRequests
);

// ==================== STAFF/ADMIN ROUTES ====================
// Get all document requests (Staff/Admin only)
router.get(
  "/requests",
  protect,
  documentRequestController.getAllDocumentRequests
);

// Update document request status (Staff/Admin only)
router.put(
  "/requests/:requestId/status",
  protect,
  documentRequestController.updateDocumentRequestStatus
);

module.exports = router;
