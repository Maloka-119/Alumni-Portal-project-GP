// 📄 File: src/controllers/documentRequestController.js
const asyncHandler = require("express-async-handler");
const { Op } = require("sequelize");
const DocumentRequest = require("../models/DocumentRequest");
const Graduate = require("../models/Graduate");
const User = require("../models/User");
const {
  getDocumentByCode,
  requiresAttachments,
} = require("../constants/documentTypes");
const { logger } = require("../utils/logger");

// @desc    عمل طلب وثيقة جديد (للخريج)
// @route   POST /api/documents/requests
// @access  Private (Graduates only)
const createDocumentRequest = asyncHandler(async (req, res) => {
  const user = req.user;
  const { document_type, language, national_id, attachments } = req.body;

  // 📝 Log بداية العملية
  logger.info("Creating new document request", {
    userId: user.id,
    userType: user["user-type"],
    documentType: document_type,
    language: language || "ar",
  });

  // 1️⃣ التحقق: هل المستخدم خريج؟
  if (user["user-type"] !== "graduate") {
    logger.warn("Non-graduate user tried to create document request", {
      userId: user.id,
      userType: user["user-type"],
    });
    return res.status(403).json({
      success: false,
      message: "Only graduates can create document requests.",
    });
  }

  // 🔧 التعديل هنا: نجيب الـ user من الداتابيز علشان نجيب national-id الصحيح
  const dbUser = await User.findByPk(user.id, {
    attributes: ["id", "national-id", "first-name", "last-name"],
  });

  if (!dbUser) {
    logger.warn("User not found in database during document request", {
      userId: user.id,
    });
    return res.status(404).json({
      success: false,
      message: "User not found. Please login again.",
    });
  }

  console.log("=== DEBUG NATIONAL ID ==="); // ⬅️ للتحقق
  console.log("DB National ID:", dbUser["national-id"]);
  console.log("Provided National ID:", national_id);
  console.log("Are equal?", dbUser["national-id"] === national_id);

  // 2️⃣ التحقق: هل نوع الوثيقة موجود؟
  const documentType = getDocumentByCode(document_type);
  if (!documentType) {
    logger.warn("Invalid document type requested", {
      userId: user.id,
      requestedType: document_type,
    });
    return res.status(400).json({
      success: false,
      message: "Invalid document type.",
    });
  }

  // 3️⃣ التحقق: هل الرقم القومي صح؟ - باستخدام dbUser
  if (national_id !== dbUser["national-id"]) {
    logger.warn("National ID mismatch in document request", {
      userId: user.id,
      providedNationalId: national_id,
      actualNationalId: dbUser["national-id"], // ⬅️ دي من الداتابيز
      dbUserId: dbUser.id,
    });
    return res.status(400).json({
      success: false,
      message: "National ID does not match your account.",
    });
  }

  // 4️⃣ التحقق: هل شهادة التخرج محتاجة مرفقات؟
  const needsAttachments = requiresAttachments(document_type);
  if (needsAttachments && (!attachments || attachments.length === 0)) {
    logger.warn("Graduation certificate missing attachments", {
      userId: user.id,
      documentType: document_type,
    });
    return res.status(400).json({
      success: false,
      message:
        "This document requires attachments. Please upload required documents.",
    });
  }

  try {
    // 5️⃣ إنشاء الطلب
    const documentRequest = await DocumentRequest.create({
      graduate_id: user.id,
      "request-type": document_type,
      language: language || "ar",
      national_id: national_id,
      attachments: needsAttachments ? attachments : null,
      status: document_type === "GRAD_CERT" ? "under_review" : "pending",
    });

    // 📝 Log نجاح إنشاء الطلب
    logger.info("Document request created successfully", {
      requestId: documentRequest.document_request_id,
      requestNumber: documentRequest.request_number,
      userId: user.id,
      documentType: document_type,
      status: documentRequest.status,
      hasAttachments: needsAttachments,
    });

    // إرجاع الرد
    res.status(201).json({
      success: true,
      message: "Document request created successfully.",
      data: {
        request_id: documentRequest.document_request_id,
        request_number: documentRequest.request_number,
        document_type: document_type,
        status: documentRequest.status,
        expected_completion_date: documentRequest.expected_completion_date,
      },
    });
  } catch (error) {
    // ❌ Log أي خطأ مع تفاصيل الـ validation
    console.error("=== SEQUELIZE VALIDATION ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (error.errors && error.errors.length > 0) {
      console.error("Validation errors:");
      error.errors.forEach((err, index) => {
        console.error(
          `  ${index + 1}. Field: ${err.path}, Value: ${err.value}, Message: ${
            err.message
          }`
        );
      });
    }

    console.error("Full error:", error);

    logger.error("Error creating document request", {
      userId: user.id,
      error: error.message,
      documentType: document_type,
      validationErrors: error.errors
        ? error.errors.map((e) => ({
            field: e.path,
            message: e.message,
          }))
        : null,
    });

    res.status(500).json({
      success: false,
      message: "Error creating document request.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      validationErrors:
        process.env.NODE_ENV === "development" && error.errors
          ? error.errors.map((e) => ({ field: e.path, message: e.message }))
          : undefined,
    });
  }
});

// @desc    جلب جميع طلبات وثائق الخريج
// @route   GET /api/documents/requests/my-requests
// @access  Private (Graduates only)
const getMyDocumentRequests = asyncHandler(async (req, res) => {
  const user = req.user;

  // 📝 Log بداية العملية
  logger.info("Fetching document requests for graduate", {
    userId: user.id,
    userType: user["user-type"],
  });

  // 1️⃣ التحقق: هل المستخدم خريج؟
  if (user["user-type"] !== "graduate") {
    logger.warn("Non-graduate tried to access graduate document requests", {
      userId: user.id,
      userType: user["user-type"],
    });
    return res.status(403).json({
      success: false,
      message: "Only graduates can view their document requests.",
    });
  }

  try {
    // 2️⃣ جلب طلبات الخريج
    const requests = await DocumentRequest.findAll({
      where: {
        graduate_id: user.id,
      },
      order: [["created-at", "DESC"]], // أحدث الطلبات أولاً
      attributes: [
        "document_request_id",
        "request_number",
        "request-type",
        "language",
        "status",
        "expected_completion_date",
        "actual_completion_date",
        "created-at",
        "updated_at",
      ],
    });

    // 📝 Log نجاح العملية
    logger.info("Graduate document requests retrieved successfully", {
      userId: user.id,
      requestCount: requests.length,
    });

    // 3️⃣ تحسين البيانات قبل إرجاعها
    const enhancedRequests = requests.map((request) => {
      const requestData = request.toJSON();
      const docType = getDocumentByCode(requestData["request-type"]);

      return {
        ...requestData,
        document_name_ar: docType ? docType.name_ar : "Unknown",
        document_name_en: docType ? docType.name_en : "Unknown",
        requires_attachments: docType ? docType.requires_attachments : false,
      };
    });

    // 4️⃣ إرجاع النتيجة
    res.status(200).json({
      success: true,
      count: enhancedRequests.length,
      data: enhancedRequests,
    });
  } catch (error) {
    // ❌ Log أي خطأ
    logger.error("Error fetching graduate document requests", {
      userId: user.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Error fetching document requests.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = {
  createDocumentRequest,
  getMyDocumentRequests,
};
