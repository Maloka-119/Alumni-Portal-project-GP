const DocumentType = require("../models/DocumentType");

const { DOCUMENT_TYPES } = require("../constants/documentTypes");

const getAllDocuments = (req, res) => {
  // 🌐 ناخد اللغة من الهيدرز بدل query
  const langHeader = req.headers["accept-language"];
  const lang = langHeader && langHeader.toLowerCase() === "en" ? "en" : "ar";

  const formattedDocuments = Object.values(DOCUMENT_TYPES).map((doc) => ({
    code: doc.code,
    name: lang === "ar" ? doc.name_ar : doc.name_en,
    description: lang === "ar" ? doc.description_ar : doc.description_en,
    requires_attachments: doc.requires_attachments,
    requires_national_id: doc.requires_national_id,
    base_processing_days: doc.base_processing_days,
  }));

  return res.status(200).json({
    success: true,
    count: formattedDocuments.length,
    language: lang,
    data: formattedDocuments,
  });
};

module.exports = { getAllDocuments };

