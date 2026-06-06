const DOCUMENT_TYPES = {

  GRAD_CERT: {
    code: "GRAD_CERT",
    name_ar: "شهادة تخرج",
    name_en: "Graduation Certificate",
    requires_attachments: true, 
    requires_national_id: true, 
    base_processing_days: 15, 
    description_ar: "شهادة تخرج رسمية من الجامعة",
    description_en: "Official graduation certificate from the university",
  },

 
  ENROLL_PROOF: {
    code: "ENROLL_PROOF",
    name_ar: "إثبات قيد",
    name_en: "Enrollment Proof",
    requires_attachments: false, 
    requires_national_id: true, 
    base_processing_days: 3, 
    description_ar: "وثيقة تثبت قيد الطالب بالجامعة",
    description_en: "Document proving student enrollment at the university",
  },

 
  STATUS_STMT: {
    code: "STATUS_STMT",
    name_ar: "بيان حالة",
    name_en: "Status Statement",
    requires_attachments: false,
    requires_national_id: true,
    base_processing_days: 3,
    description_ar: "بيان يوضح الحالة الدراسية للطالب",
    description_en: "Statement showing student academic status",
  },


  GRADES_STMT: {
    code: "GRADES_STMT",
    name_ar: "بيان درجات",
    name_en: "Grades Statement",
    requires_attachments: false,
    requires_national_id: true,
    base_processing_days: 5,
    description_ar: "بيان مفصل بالدرجات الخاصة بالطالب",
    description_en: "Detailed statement of student grades",
  },


  SECURED_CERT: {
    code: "SECURED_CERT",
    name_ar: "شهادة مؤمنة",
    name_en: "Secured Certificate",
    requires_attachments: false,
    requires_national_id: true,
    base_processing_days: 7,
    description_ar: "شهادة مؤمنة معتمدة من الجامعة",
    description_en: "Secured and certified certificate from the university",
  },

  
  GRAD_TESTIMONIAL: {
    code: "GRAD_TESTIMONIAL",
    name_ar: "إفادة تخرج",
    name_en: "Graduation Testimonial",
    requires_attachments: false,
    requires_national_id: true,
    base_processing_days: 5,
    description_ar: "إفادة تحتوي على اسم الخريج وسنة التخرج والنتيجة",
    description_en:
      "Testimonial containing graduate name, graduation year and result",
  },

  
  TRANSCRIPT_CERT: {
    code: "TRANSCRIPT_CERT",
    name_ar: "شهادة تقديرات",
    name_en: "Transcript Certificate",
    requires_attachments: false,
    requires_national_id: true,
    base_processing_days: 10,
    description_ar:
      "شهادة تحتوي على كل المواد التي نجح فيها الطالب وجميع البيانات",
    description_en:
      "Certificate containing all courses the student passed and all data",
  },
};


const DOCUMENT_CODES = Object.values(DOCUMENT_TYPES).map((doc) => doc.code);

const getDocumentByCode = (code) => {
  return DOCUMENT_TYPES[code] || null;
};

const getDocumentName = (code, language = "ar") => {
  const doc = DOCUMENT_TYPES[code];
  if (!doc) return "Unknown Document";
  return language === "ar" ? doc.name_ar : doc.name_en;
};

const requiresAttachments = (code) => {
  const doc = DOCUMENT_TYPES[code];
  return doc ? doc.requires_attachments : false;
};

module.exports = {
  DOCUMENT_TYPES,
  DOCUMENT_CODES,
  getDocumentByCode,
  getDocumentName,
  requiresAttachments,
};
