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
  console.log("\n" + "=".repeat(70));
  console.log("🚀🚀🚀 CREATE DOCUMENT REQUEST - DEBUG START 🚀🚀🚀");
  console.log("=".repeat(70));

  // ==================== PHASE 0: DEBUG LOGS ====================
  console.log("\n🔍 PHASE 0: REQUEST ARRIVED AT CONTROLLER");
  console.log("   Time:", new Date().toISOString());
  console.log("   Controller invoked successfully!");

  // ==================== PHASE 1: REQUEST INSPECTION ====================
  console.log("\n📋 PHASE 1: REQUEST INSPECTION");
  console.log("   Method:", req.method);
  console.log("   URL:", req.originalUrl || req.url);
  console.log("   Headers:");
  console.log("     - Content-Type:", req.headers["content-type"] || "NOT SET");
  console.log("     - Content-Length:", req.headers["content-length"] || "0");
  console.log(
    "     - Authorization:",
    req.headers["authorization"] ? "PRESENT" : "MISSING"
  );

  // تحقق من req.body بعد multer
  console.log("\n🔍 BODY PARSER STATUS (AFTER MULTER):");
  console.log("   req.body exists?", !!req.body);
  console.log("   Type of req.body:", typeof req.body);

  if (req.body) {
    console.log("   req.body keys:", Object.keys(req.body));

    // طباعة كل حقول الـ body
    Object.keys(req.body).forEach((key) => {
      const value = req.body[key];
      console.log(
        `     - ${key}:`,
        value,
        `(type: ${typeof value}, length: ${value ? value.length : 0})`
      );
    });

    // بحث عن document_type بأي شكل
    const allKeys = Object.keys(req.body);
    const possibleDocTypeFields = allKeys.filter(
      (key) =>
        key.toLowerCase().includes("document") ||
        key.toLowerCase().includes("type") ||
        key.toLowerCase().includes("doc")
    );

    console.log("   Possible document_type fields:", possibleDocTypeFields);

    if (possibleDocTypeFields.length > 0) {
      possibleDocTypeFields.forEach((field) => {
        console.log(`     Checking ${field}:`, req.body[field]);
      });
    }
  } else {
    console.log("   ⚠️ WARNING: req.body is undefined or null!");
  }

  // تحقق من الملفات
  console.log("\n📁 FILES STATUS:");
  console.log("   req.files exists?", !!req.files);
  console.log("   req.file exists?", !!req.file);

  if (req.files && Array.isArray(req.files)) {
    console.log("   Number of files:", req.files.length);
    req.files.forEach((file, i) => {
      console.log(`   File ${i + 1}:`);
      console.log(`     - Fieldname: ${file.fieldname}`);
      console.log(`     - Original: ${file.originalname}`);
      console.log(`     - Size: ${file.size} bytes`);
      console.log(`     - Mimetype: ${file.mimetype}`);
      console.log(`     - Path: ${file.path}`);
      console.log(`     - Filename: ${file.filename}`);
    });
  } else if (req.file) {
    console.log("   Single file:");
    console.log(`     - Fieldname: ${req.file.fieldname}`);
    console.log(`     - Original: ${req.file.originalname}`);
    console.log(`     - Path: ${req.file.path}`);
  } else {
    console.log("   No files received");
  }

  // تحقق من الـ user
  console.log("\n👤 USER AUTH STATUS:");
  console.log("   req.user exists?", !!req.user);
  if (req.user) {
    console.log("   User ID:", req.user.id);
    console.log("   User Type:", req.user["user-type"]);
    console.log("   Full user object:", JSON.stringify(req.user, null, 2));
  } else {
    console.log("   ❌ ERROR: No user in request!");
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
      debug: { step: "user_authentication", user: req.user },
    });
  }

  // ==================== PHASE 2: SAFE DATA EXTRACTION ====================
  console.log("\n📦 PHASE 2: SAFE DATA EXTRACTION");

  // استخدام req.body مباشرة (مش محتاج || {} لأن multer هيحط البيانات)
  const requestBody = req.body || {};
  const requestFiles = req.files || [];

  console.log("   Using requestBody:", requestBody);
  console.log(
    "   Using requestFiles:",
    requestFiles.length > 0 ? `${requestFiles.length} file(s)` : "none"
  );

  // البحث عن document_type بكل الطرق الممكنة
  let document_type = null;

  // قائمة بكل الأسماء المحتملة
  const possibleNames = [
    "document_type",
    "documentType",
    "document-type",
    "doc_type",
    "doctype",
    "type",
    "document",
    "docType",
    "request_type",
    "request-type",
  ];

  console.log("\n🔍 SEARCHING FOR DOCUMENT_TYPE:");
  for (const name of possibleNames) {
    if (
      requestBody[name] !== undefined &&
      requestBody[name] !== null &&
      requestBody[name] !== ""
    ) {
      document_type = requestBody[name];
      console.log(`   ✅ Found as '${name}':`, document_type);
      break;
    }
  }

  if (!document_type) {
    // جرب البحث بأي حقل يحتوي على كلمة document أو type
    const allBodyKeys = Object.keys(requestBody);
    for (const key of allBodyKeys) {
      if (
        requestBody[key] &&
        typeof requestBody[key] === "string" &&
        requestBody[key].trim()
      ) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes("doc") || lowerKey.includes("type")) {
          document_type = requestBody[key];
          console.log(`   ⚠️ Found in field '${key}':`, document_type);
          break;
        }
      }
    }
  }

  const language = requestBody.language || requestBody.lang || "ar";

  // معالجة الملفات
  let attachments = [];
  if (requestFiles.length > 0) {
    attachments = requestFiles.map((file) => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/documents/${file.filename}`, // URL للوصول للملف
    }));
  } else if (requestBody.attachments) {
    attachments = Array.isArray(requestBody.attachments)
      ? requestBody.attachments
      : [requestBody.attachments];
  }

  console.log("\n📊 EXTRACTED DATA:");
  console.log("   document_type:", document_type || "NOT FOUND!");
  console.log("   language:", language);
  console.log("   attachments count:", attachments.length);

  if (attachments.length > 0) {
    console.log("   Attachments details:");
    attachments.forEach((att, i) => {
      if (att.originalname) {
        console.log(`     ${i + 1}. ${att.originalname} (${att.size} bytes)`);
      } else {
        console.log(`     ${i + 1}.`, att);
      }
    });
  }

  // ==================== PHASE 3: VALIDATION ====================
  console.log("\n✅ PHASE 3: VALIDATION");

  // CRITICAL: Check if document_type exists
  if (!document_type) {
    console.error("❌❌❌ CRITICAL ERROR: document_type is missing!");
    console.error("   All body keys:", Object.keys(requestBody));
    console.error("   Body values:", requestBody);
    console.error("   Content-Type:", req.headers["content-type"]);
    console.error("   Request method:", req.method);

    // حاول تجميع كل البيانات المتاحة للمساعدة في التشخيص
    const debugInfo = {
      requestMethod: req.method,
      requestUrl: req.url,
      contentType: req.headers["content-type"],
      contentLength: req.headers["content-length"],
      bodyKeys: Object.keys(requestBody),
      bodyValues: requestBody,
      fileCount: requestFiles.length,
      userAuthenticated: !!req.user,
      userType: req.user ? req.user["user-type"] : null,
    };

    return res.status(400).json({
      success: false,
      message:
        "Document type is required. Please send 'document_type' field in your request.",
      debug: debugInfo,
      suggestion:
        "Make sure you're sending form-data with a field named 'document_type'",
    });
  }

  const user = req.user;
  console.log("✅ User authenticated:", user.id, `(${user["user-type"]})`);

  // 1️⃣ Check if user is graduate
  if (user["user-type"] !== "graduate") {
    console.log("❌ User is not a graduate! User type:", user["user-type"]);
    return res.status(403).json({
      success: false,
      message: "Only graduates can create document requests.",
    });
  }
  console.log("✅ User is a graduate");

  // ==================== PHASE 4: DATABASE OPERATIONS ====================
  console.log("\n💾 PHASE 4: DATABASE OPERATIONS");

  try {
    console.log("🔍 Fetching user from database with ID:", user.id);
    const dbUser = await User.findByPk(user.id, {
      attributes: ["id", "national-id", "first-name", "last-name"],
    });

    if (!dbUser) {
      console.log("❌ User not found in database!");
      return res.status(404).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    console.log("✅ User found in database");
    console.log("   First name:", dbUser["first-name"]);
    console.log("   Last name:", dbUser["last-name"]);
    console.log(
      "   National ID length:",
      dbUser["national-id"] ? dbUser["national-id"].length : 0
    );
    console.log(
      "   National ID (first 20 chars):",
      dbUser["national-id"]
        ? dbUser["national-id"].substring(0, 20) + "..."
        : "null"
    );

    const national_id = dbUser["national-id"];

    // Check document type
    console.log("\n📄 DOCUMENT TYPE VALIDATION:");
    console.log("   Requested type code:", document_type);
    const documentType = getDocumentByCode(document_type);
    if (!documentType) {
      console.log("❌ Invalid document type!");
      return res.status(400).json({
        success: false,
        message: "Invalid document type. Please select a valid document type.",
        validTypes: ["GRAD_CERT", "STATUS_STMT", "OTHER"], // ضع الأنواع الصحيحة هنا
      });
    }
    console.log("✅ Document type valid:", documentType.name_ar);

    // Check if needs attachments
    console.log("\n📎 ATTACHMENTS CHECK:");
    const needsAttachments = requiresAttachments(document_type);
    console.log("   Document requires attachments?", needsAttachments);
    console.log("   Attachments provided:", attachments.length);

    if (needsAttachments && attachments.length === 0) {
      console.log("❌ Missing required attachments");
      return res.status(400).json({
        success: false,
        message:
          "This document requires attachments. Please upload required documents.",
      });
    }
    console.log("✅ Attachments check passed");

    // ==================== PHASE 5: CREATE REQUEST ====================
    console.log("\n🛠️ PHASE 5: CREATING DOCUMENT REQUEST");

    // تحضير بيانات المرفقات للتخزين
    let attachmentsForDB = null;
    if (needsAttachments && attachments.length > 0) {
      attachmentsForDB = attachments.map((att) => ({
        filename: att.originalname || att.filename,
        path: att.path,
        url: att.url,
        size: att.size,
        mimetype: att.mimetype,
      }));
    }

    const requestData = {
      graduate_id: user.id,
      "request-type": document_type,
      language: language,
      national_id: national_id,
      attachments: attachmentsForDB ? JSON.stringify(attachmentsForDB) : null,
      status: document_type === "GRAD_CERT" ? "under_review" : "pending",
    };

    console.log("📦 Request data to save:");
    Object.keys(requestData).forEach((key) => {
      let value = requestData[key];
      let displayValue;

      if (key === "national_id" && value) {
        displayValue = "***" + value.slice(-4);
      } else if (key === "attachments" && value) {
        displayValue = `${attachments.length} attachment(s)`;
      } else if (value && typeof value === "string" && value.length > 50) {
        displayValue = value.substring(0, 50) + "...";
      } else {
        displayValue = value;
      }

      console.log(`   ${key}:`, displayValue);
    });

    console.log("\n💾 Saving to database...");
    const documentRequest = await DocumentRequest.create(requestData);

    console.log("\n🎉 SUCCESS: Document request created!");
    console.log("   Request ID:", documentRequest.document_request_id);
    console.log("   Request Number:", documentRequest.request_number);
    console.log("   Status:", documentRequest.status);
    console.log("   Created at:", documentRequest["created-at"]);

    // Response
    const responseData = {
      success: true,
      message: "Document request created successfully.",
      data: {
        request_id: documentRequest.document_request_id,
        request_number: documentRequest.request_number,
        document_type: document_type,
        status: documentRequest.status,
        expected_completion_date: documentRequest.expected_completion_date,
        has_attachments: attachments.length > 0,
        attachments_count: attachments.length,
      },
    };

    console.log("\n" + "=".repeat(70));
    console.log("✅✅✅ CREATE DOCUMENT REQUEST - DEBUG END SUCCESS ✅✅✅");
    console.log("=".repeat(70) + "\n");

    res.status(201).json(responseData);
  } catch (error) {
    console.error("\n🔥🔥🔥 CREATE DOCUMENT REQUEST - DEBUG END ERROR 🔥🔥🔥");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);

    if (error.errors && error.errors.length > 0) {
      console.error("Sequelize validation errors:");
      error.errors.forEach((err, index) => {
        console.error(
          `   ${index + 1}. ${err.path}: ${err.message} (value: ${err.value})`
        );
      });
    }

    console.error("Error stack (first 15 lines):");
    error.stack
      ?.split("\n")
      .slice(0, 15)
      .forEach((line) => console.error("   ", line));

    const errorResponse = {
      success: false,
      message: "Error creating document request.",
      error: error.message,
      errorName: error.name,
    };

    // إضافة معلومات إضافية للتطوير
    if (process.env.NODE_ENV !== "production") {
      errorResponse.debug = {
        document_type: document_type,
        userId: user?.id,
        attachmentsCount: attachments.length,
      };

      if (error.stack) {
        errorResponse.stack = error.stack.split("\n").slice(0, 10);
      }
    }

    res.status(500).json(errorResponse);

    console.log("=".repeat(70) + "\n");
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

  // تأكد من وجود المستخدم وبياناته (تجنب 500 لو الـ auth فشل أو شكل الـ user مختلف)
  if (!user || user.id == null || user.id === undefined) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, user not found.",
    });
  }

  const userType = user["user-type"];
  // 📝 Log بداية العملية
  logger.info("Fetching all document requests", {
    userId: user.id,
    userType: userType,
    filters: { status, graduate_id },
  });

  // 1️⃣ التحقق: هل المستخدم staff أو admin؟
  if (!["staff", "admin"].includes(userType)) {
    logger.warn("Non-staff/admin tried to view all document requests", {
      userId: user.id,
      userType: user["user-type"],
    });
    return res.status(403).json({
      success: false,
      message: "Only staff and admin can view all document requests.",
    });
  }

  // 2️⃣ التحقق من الصلاحيات للـ staff فقط (الـ admin مفيش عليه فلتر صلاحيات هنا)
  if (userType === "staff") {
    let hasPermission = false;
    try {
      hasPermission = await checkStaffPermission(
        user.id,
        "Document Requests management",
        "view"
      );
    } catch (permErr) {
      logger.error("Error in staff permission check", {
        userId: user.id,
        error: permErr?.message || String(permErr),
      });
      return res.status(500).json({
        success: false,
        message: "Permission check failed. Please try again.",
      });
    }
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
        graduate_name:
          requestData.Graduate && requestData.Graduate.User
            ? `${requestData.Graduate.User["first-name"] || ""} ${requestData.Graduate.User["last-name"] || ""}`.trim()
            : null,
        staff_name:
          requestData.Staff && requestData.Staff.User
            ? `${requestData.Staff.User["first-name"] || ""} ${requestData.Staff.User["last-name"] || ""}`.trim()
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
      userId: user?.id,
      error: error?.message,
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    });

    res.status(500).json({
      success: false,
      message: "Error fetching document requests.",
      error: process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
});

module.exports = {
  createDocumentRequest,
  getMyDocumentRequests,
  updateDocumentRequestStatus,
  getAllDocumentRequests,
};
