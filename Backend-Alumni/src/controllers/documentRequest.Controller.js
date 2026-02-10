// 📄 File: src/controllers/documentRequestController.js
const asyncHandler = require("express-async-handler");
const { Op } = require("sequelize");
const DocumentRequest = require("../models/DocumentRequest");
const Graduate = require("../models/Graduate");
const Staff = require("../models/Staff");
const User = require("../models/User");
const {
  getDocumentByCode,
  requiresAttachments,
  getDocumentName,
} = require("../constants/documentTypes");
const { logger } = require("../utils/logger");
const {
  notifyDocumentRequestStatusChanged,
} = require("../services/notificationService");
const { checkStaffPermission } = require("../utils/permissionChecker");
const aes = require("../utils/aes");

// @desc    عمل طلب وثيقة جديد (للخريج)
// @route   POST /api/documents/requests
// @access  Private (Graduates only)
const createDocumentRequest = asyncHandler(async (req, res) => {
  console.log("=== CREATE DOCUMENT REQUEST START ===");
  console.log("🔹 Request body:", JSON.stringify(req.body, null, 2));
  console.log(
    "🔹 User from req.user:",
    req.user
      ? {
          id: req.user.id,
          userType: req.user["user-type"],
          nationalId: req.user["national-id"]
            ? "***" + req.user["national-id"].slice(-4)
            : "null",
        }
      : "NO USER IN REQ"
  );

  // ⬇️ التعديل: نشيل national_id من الـ body
  const user = req.user;
  const { document_type, language, attachments } = req.body; // ⬅️ شيل national_id

  // 📝 Log بداية العملية
  logger.info("Creating new document request", {
    userId: user.id,
    userType: user["user-type"],
    documentType: document_type,
    language: language || "ar",
  });

  console.log("🔹 Document type:", document_type);
  console.log("🔹 Language:", language);
  console.log("🔹 Attachments:", attachments);

  // 1️⃣ التحقق: هل المستخدم خريج؟
  if (user["user-type"] !== "graduate") {
    console.log("❌ User is not a graduate! User type:", user["user-type"]);
    logger.warn("Non-graduate user tried to create document request", {
      userId: user.id,
      userType: user["user-type"],
    });
    return res.status(403).json({
      success: false,
      message: "Only graduates can create document requests.",
    });
  }

  console.log("✅ User is a graduate");

  // 🔧 نجيب الـ user من الداتابيز علشان نجيب national-id
  console.log("🔹 Fetching user from database with ID:", user.id);
  const dbUser = await User.findByPk(user.id, {
    attributes: ["id", "national-id", "first-name", "last-name"],
  });

  if (!dbUser) {
    console.log("❌ User not found in database! ID:", user.id);
    logger.warn("User not found in database during document request", {
      userId: user.id,
    });
    return res.status(404).json({
      success: false,
      message: "User not found. Please login again.",
    });
  }

  console.log("✅ User found in database");
  console.log(
    "🔹 DB User national-id (first 10 chars):",
    dbUser["national-id"]
      ? dbUser["national-id"].substring(0, 10) + "..."
      : "null"
  );

  // ⬇️ التعديل: نستخدم الـ national-id من الداتابيز
  const national_id = dbUser["national-id"];
  console.log(
    "🔹 Using national_id from database:",
    national_id ? "***" + national_id.slice(-4) : "null"
  );

  // 2️⃣ التحقق: هل نوع الوثيقة موجود؟
  console.log("🔹 Checking document type:", document_type);
  const documentType = getDocumentByCode(document_type);
  if (!documentType) {
    console.log("❌ Invalid document type:", document_type);
    logger.warn("Invalid document type requested", {
      userId: user.id,
      requestedType: document_type,
    });
    return res.status(400).json({
      success: false,
      message: "Invalid document type.",
    });
  }

  console.log("✅ Document type is valid:", documentType.name_ar);

  // ⬇️ التعديل: ما نعملش validation للـ national-id (مش من الـ body)
  console.log("✅ National ID from database will be used");

  // 3️⃣ التحقق: هل شهادة التخرج محتاجة مرفقات؟
  console.log("🔹 Checking if document requires attachments...");
  const needsAttachments = requiresAttachments(document_type);
  console.log("   Needs attachments?", needsAttachments);

  if (needsAttachments && (!attachments || attachments.length === 0)) {
    console.log(
      "❌ Graduation certificate requires attachments but none provided"
    );
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

  console.log("✅ Attachments check passed");

  try {
    console.log("🔹 Attempting to create document request...");
    console.log("   - graduate_id:", user.id);
    console.log("   - request-type:", document_type);
    console.log("   - language:", language || "ar");
    console.log(
      "   - national_id (from DB):",
      national_id ? "***" + national_id.slice(-4) : "null"
    );
    console.log(
      "   - status:",
      document_type === "GRAD_CERT" ? "under_review" : "pending"
    );
    console.log("   - needsAttachments:", needsAttachments);

    // 4️⃣ إنشاء الطلب
    const documentRequest = await DocumentRequest.create({
      graduate_id: user.id,
      "request-type": document_type,
      language: language || "ar",
      national_id: national_id, // ⬅️ من الداتابيز مش من الـ body
      attachments: needsAttachments ? attachments : null,
      status: document_type === "GRAD_CERT" ? "under_review" : "pending",
    });

    console.log("✅ Document request created successfully!");
    console.log("🔹 Request ID:", documentRequest.document_request_id);
    console.log("🔹 Request Number:", documentRequest.request_number);
    console.log("🔹 Status:", documentRequest.status);

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
    console.log("📤 Sending success response...");
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

    console.log("=== CREATE DOCUMENT REQUEST END SUCCESS ===");
  } catch (error) {
    console.error("=== CREATE DOCUMENT REQUEST ERROR ===");
    console.error("❌ Error creating document request");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    if (error.errors && error.errors.length > 0) {
      console.error("Validation errors:");
      error.errors.forEach((err, index) => {
        console.error(`  ${index + 1}. Field: ${err.path}`);
        console.error(`     Value: ${err.value}`);
        console.error(`     Message: ${err.message}`);
      });
    }

    // Log to file logger
    logger.error("Error creating document request", {
      userId: user.id,
      error: error.message,
      errorName: error.name,
      errorStack: error.stack?.substring(0, 500),
      documentType: document_type,
      validationErrors: error.errors
        ? error.errors.map((e) => ({
            field: e.path,
            message: e.message,
          }))
        : null,
    });

    // Always show error details in development
    const isDevelopment = process.env.NODE_ENV !== "production";

    console.log("📤 Sending error response...");
    res.status(500).json({
      success: false,
      message: "Error creating document request.",
      error: error.message,
      errorName: error.name,
      validationErrors: error.errors
        ? error.errors.map((e) => ({ field: e.path, message: e.message }))
        : undefined,
      ...(isDevelopment && {
        stack: error.stack?.substring(0, 500),
        fullError: error.toString(),
      }),
    });

    console.log("=== CREATE DOCUMENT REQUEST END ERROR ===");
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
    // 2️⃣ جلب طلبات الخريج مع معلومات إضافية
    const requests = await DocumentRequest.findAll({
      where: {
        graduate_id: user.id,
      },
      include: [
        {
          model: Staff,
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name"],
            },
          ],
          required: false,
        },
      ],
      order: [["created-at", "DESC"]], // أحدث الطلبات أولاً
      attributes: [
        "document_request_id",
        "request_number",
        "request-type",
        "language",
        "status",
        "notes",
        "expected_completion_date",
        "actual_completion_date",
        "created-at",
        "updated_at",
        "staff_id",
      ],
    });

    // 📝 Log نجاح العملية
    logger.info("Graduate document requests retrieved successfully", {
      userId: user.id,
      requestCount: requests.length,
    });

    // 3️⃣ تحسين البيانات قبل إرجاعها مع معلومات السجل
    const enhancedRequests = requests.map((request) => {
      const requestData = request.toJSON();
      const docType = getDocumentByCode(requestData["request-type"]);

      // حساب الوقت المنقضي
      const createdAt = new Date(requestData["created-at"]);
      const updatedAt = new Date(requestData.updated_at);
      const now = new Date();
      const daysSinceCreation = Math.floor(
        (now - createdAt) / (1000 * 60 * 60 * 24)
      );
      const daysSinceUpdate = Math.floor(
        (now - updatedAt) / (1000 * 60 * 60 * 24)
      );

      // معلومات الحالة
      const statusInfo = {
        pending: {
          ar: "قيد الانتظار",
          en: "Pending",
          description_ar: "تم استلام طلبك وهو قيد المراجعة",
          description_en: "Your request has been received and is under review",
        },
        under_review: {
          ar: "قيد المراجعة",
          en: "Under Review",
          description_ar: "طلبك قيد المراجعة من قبل الموظفين",
          description_en: "Your request is being reviewed by staff",
        },
        approved: {
          ar: "مقبول",
          en: "Approved",
          description_ar: "تم قبول طلبك وجاري تجهيزه",
          description_en:
            "Your request has been approved and is being processed",
        },
        ready_for_pickup: {
          ar: "جاهز للاستلام",
          en: "Ready for Pickup",
          description_ar: "وثيقتك جاهزة للاستلام",
          description_en: "Your document is ready for pickup",
        },
        completed: {
          ar: "تم الاستلام",
          en: "Completed",
          description_ar: "تم استلام الوثيقة بنجاح",
          description_en: "Document has been received successfully",
        },
        cancelled: {
          ar: "ملغي",
          en: "Cancelled",
          description_ar: "تم إلغاء الطلب",
          description_en: "Request has been cancelled",
        },
      };

      const currentStatusInfo = statusInfo[requestData.status] || {
        ar: requestData.status,
        en: requestData.status,
        description_ar: "",
        description_en: "",
      };

      return {
        ...requestData,
        document_name_ar: docType ? docType.name_ar : "Unknown",
        document_name_en: docType ? docType.name_en : "Unknown",
        requires_attachments: docType ? docType.requires_attachments : false,
        status_info: {
          current: requestData.status,
          label_ar: currentStatusInfo.ar,
          label_en: currentStatusInfo.en,
          description_ar: currentStatusInfo.description_ar,
          description_en: currentStatusInfo.description_en,
        },
        timeline: {
          created_at: requestData["created-at"],
          last_updated: requestData.updated_at,
          days_since_creation: daysSinceCreation,
          days_since_update: daysSinceUpdate,
          expected_completion_date: requestData.expected_completion_date,
          actual_completion_date: requestData.actual_completion_date,
          is_overdue:
            requestData.expected_completion_date &&
            new Date(requestData.expected_completion_date) < now &&
            requestData.status !== "completed" &&
            requestData.status !== "cancelled",
        },
        assigned_staff:
          requestData.Staff && requestData.Staff.User
            ? {
                id: requestData.Staff.staff_id,
                name: `${requestData.Staff.User["first-name"]} ${requestData.Staff.User["last-name"]}`,
              }
            : null,
        // Log information
        log: {
          request_created: requestData["created-at"],
          last_status_change: requestData.updated_at,
          status_history: [
            {
              status: requestData.status,
              changed_at: requestData.updated_at,
              notes: requestData.notes || null,
            },
          ],
        },
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

// @desc    Update document request status (Staff/Admin only)
// @route   PUT /api/documents/requests/:requestId/status
// @access  Private (Staff/Admin only)
const updateDocumentRequestStatus = asyncHandler(async (req, res) => {
  const user = req.user;
  const { requestId } = req.params;
  const { status, notes, expected_completion_date } = req.body;

  // 📝 Log بداية العملية
  logger.info("Updating document request status", {
    userId: user.id,
    userType: user["user-type"],
    requestId: requestId,
    newStatus: status,
  });

  // 1️⃣ التحقق: هل المستخدم staff أو admin؟
  if (!["staff", "admin"].includes(user["user-type"])) {
    logger.warn("Non-staff/admin tried to update document request status", {
      userId: user.id,
      userType: user["user-type"],
      requestId: requestId,
    });
    return res.status(403).json({
      success: false,
      message: "Only staff and admin can update document request status.",
    });
  }

  // 2️⃣ التحقق من الصلاحيات للـ staff
  if (user["user-type"] === "staff") {
    const hasPermission = await checkStaffPermission(
      user.id,
      "Document Requests management",
      "edit"
    );
    if (!hasPermission) {
      logger.warn("Staff permission denied for updating document request", {
        userId: user.id,
        requestId: requestId,
      });
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update document requests.",
      });
    }
  }

  // 3️⃣ التحقق من صحة الحالة
  const validStatuses = [
    "pending",
    "under_review",
    "approved",
    "ready_for_pickup",
    "completed",
    "cancelled",
  ];
  if (!status || !validStatuses.includes(status)) {
    logger.warn("Invalid status value for document request update", {
      userId: user.id,
      requestId: requestId,
      providedStatus: status,
    });
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  try {
    // 4️⃣ جلب الطلب
    const documentRequest = await DocumentRequest.findByPk(requestId, {
      include: [
        {
          model: Graduate,
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name", "email"],
            },
          ],
        },
      ],
    });

    if (!documentRequest) {
      logger.warn("Document request not found", {
        userId: user.id,
        requestId: requestId,
      });
      return res.status(404).json({
        success: false,
        message: "Document request not found.",
      });
    }

    const oldStatus = documentRequest.status;

    // 5️⃣ تحديث الحالة
    documentRequest.status = status;
    if (notes !== undefined) {
      documentRequest.notes = notes;
    }
    if (expected_completion_date) {
      documentRequest.expected_completion_date = expected_completion_date;
    }

    // إذا كان staff_id null، نضيف staff_id الحالي
    if (!documentRequest.staff_id && user["user-type"] === "staff") {
      const staff = await Staff.findOne({ where: { staff_id: user.id } });
      if (staff) {
        documentRequest.staff_id = user.id;
      }
    }

    // إذا كانت الحالة completed، نضيف actual_completion_date
    if (status === "completed" && !documentRequest.actual_completion_date) {
      documentRequest.actual_completion_date = new Date();
    }

    await documentRequest.save();

    // 6️⃣ إرسال إشعار للخريج
    const documentType = getDocumentByCode(documentRequest["request-type"]);
    const documentTypeName = documentType
      ? documentType.name_en
      : documentRequest["request-type"];

    await notifyDocumentRequestStatusChanged(
      documentRequest.graduate_id,
      user.id,
      documentRequest.request_number,
      oldStatus,
      status,
      documentTypeName,
      notes
    );

    // 📝 Log تغيير الحالة
    logger.info("Document request status updated successfully", {
      requestId: documentRequest.document_request_id,
      requestNumber: documentRequest.request_number,
      graduateId: documentRequest.graduate_id,
      oldStatus: oldStatus,
      newStatus: status,
      updatedBy: user.id,
      userType: user["user-type"],
    });

    // 7️⃣ إرجاع النتيجة
    res.status(200).json({
      success: true,
      message: "Document request status updated successfully.",
      data: {
        request_id: documentRequest.document_request_id,
        request_number: documentRequest.request_number,
        status: documentRequest.status,
        old_status: oldStatus,
        notes: documentRequest.notes,
        expected_completion_date: documentRequest.expected_completion_date,
        actual_completion_date: documentRequest.actual_completion_date,
        updated_at: documentRequest.updated_at,
      },
    });
  } catch (error) {
    logger.error("Error updating document request status", {
      userId: user.id,
      requestId: requestId,
      error: error.message,
      stack: error.stack?.substring(0, 200),
    });

    res.status(500).json({
      success: false,
      message: "Error updating document request status.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Get all document requests (Staff/Admin only)
// @route   GET /api/documents/requests
// @access  Private (Staff/Admin only)
const getAllDocumentRequests = asyncHandler(async (req, res) => {
  const user = req.user;
  const { status, graduate_id, page = 1, limit = 20 } = req.query;

  // 📝 Log بداية العملية
  logger.info("Fetching all document requests", {
    userId: user.id,
    userType: user["user-type"],
    filters: { status, graduate_id },
  });

  // 1️⃣ التحقق: هل المستخدم staff أو admin؟
  if (!["staff", "admin"].includes(user["user-type"])) {
    logger.warn("Non-staff/admin tried to view all document requests", {
      userId: user.id,
      userType: user["user-type"],
    });
    return res.status(403).json({
      success: false,
      message: "Only staff and admin can view all document requests.",
    });
  }

  // 2️⃣ التحقق من الصلاحيات للـ staff
  if (user["user-type"] === "staff") {
    const hasPermission = await checkStaffPermission(
      user.id,
      "Document Requests management",
      "view"
    );
    if (!hasPermission) {
      logger.warn("Staff permission denied for viewing document requests", {
        userId: user.id,
      });
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view document requests.",
      });
    }
  }

  try {
    // 3️⃣ بناء where clause
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (graduate_id) {
      whereClause.graduate_id = graduate_id;
    }

    // 4️⃣ جلب الطلبات مع pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows: requests } = await DocumentRequest.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Graduate,
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name", "email"],
            },
          ],
        },
        {
          model: Staff,
          include: [
            {
              model: User,
              attributes: ["id", "first-name", "last-name"],
            },
          ],
          required: false,
        },
      ],
      order: [["created-at", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    // 5️⃣ تحسين البيانات
    const enhancedRequests = requests.map((request) => {
      const requestData = request.toJSON();
      const docType = getDocumentByCode(requestData["request-type"]);

      return {
        ...requestData,
        document_name_ar: docType ? docType.name_ar : "Unknown",
        document_name_en: docType ? docType.name_en : "Unknown",
        graduate_name: requestData.Graduate
          ? `${requestData.Graduate.User["first-name"]} ${requestData.Graduate.User["last-name"]}`
          : null,
        staff_name:
          requestData.Staff && requestData.Staff.User
            ? `${requestData.Staff.User["first-name"]} ${requestData.Staff.User["last-name"]}`
            : null,
      };
    });

    // 📝 Log نجاح العملية
    logger.info("All document requests retrieved successfully", {
      userId: user.id,
      requestCount: count,
      page: page,
      limit: limit,
    });

    // 6️⃣ إرجاع النتيجة
    res.status(200).json({
      success: true,
      count: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
      data: enhancedRequests,
    });
  } catch (error) {
    logger.error("Error fetching all document requests", {
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
  updateDocumentRequestStatus,
  getAllDocumentRequests,
};
