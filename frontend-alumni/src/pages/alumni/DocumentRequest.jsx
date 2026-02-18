// import { useEffect, useState } from "react";
// import API from "../../services/api"; 
// import "./documentRequests.css";
// import { useTranslation } from "react-i18next";

// const DocumentRequest = () => {
//   const [documents, setDocuments] = useState([]);
//   const [selectedDoc, setSelectedDoc] = useState(null);
//   const [attachments, setAttachments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");
//   const [showModal, setShowModal] = useState(false);

//   const { t, i18n } = useTranslation();
//   const currentLang = i18n.language || "en";

//   // ================= 1. Timer for Success Message =================
//   useEffect(() => {
//     if (successMessage) {
//       const timer = setTimeout(() => {
//         setSuccessMessage("");
//       }, 1500); // يختفي بعد ثانية ونصف
//       return () => clearTimeout(timer);
//     }
//   }, [successMessage]);

//   // ================= Load document types =================
//   useEffect(() => {
//     API.get("/documents-types")
//       .then((res) => {
//         const docsData = res.data?.data || [];
//         const alumniDocs = docsData.filter(
//           (doc) => doc.code !== "ENROLL_PROOF"
//         );
//         setDocuments(alumniDocs);
//       })
//       .catch(() => setError(t("loadDocumentsError")));
//   }, [currentLang, t]);

//   const handleSelect = (doc) => {
//     setSelectedDoc(doc);
//     setAttachments([]);
//     setError("");
//     setSuccessMessage("");
//     setShowModal(true);
//   };

//   // ================= Helper Functions =================
//   const handleSuccess = () => {
//     setSuccessMessage(t("requestSuccess"));
//     setShowModal(false); // إغلاق المودال فوراً عند النجاح
//     setSelectedDoc(null);
//     setAttachments([]);
//     setError("");
//   };

//   const handleBackendError = (err) => {
//     console.error("Backend Error Detail:", err.response?.data);
//     const serverMessage = err.response?.data?.message;
//     setError(serverMessage || t("submitRequestError"));
//   };

//   // ================= Submit request =================
//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     // التحقق الإضافي (Validation)
//     if (selectedDoc.requires_attachments && attachments.length === 0) {
//       setError(currentLang === "ar" ? "يرجى إرفاق المستندات المطلوبة" : "Please attach the required documents");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     const formData = new FormData();
//     formData.append("document_type", selectedDoc.code);
//     formData.append("language", currentLang);
    
//     if (attachments.length > 0) {
//       attachments.forEach((file) => {
//         formData.append("attachments", file);
//       });
//     }

//     // إرسال الطلب (تعميم الكود ليناسب الحالتين)
//     API.post("/documents/requests", attachments.length === 0 ? {
//         document_type: selectedDoc.code,
//         language: currentLang
//     } : formData)
//       .then(() => handleSuccess())
//       .catch((err) => handleBackendError(err))
//       .finally(() => setLoading(false));
//   };

//   // ================= Check if Submit should be disabled =================
//   // هذا المتغير يمنع الضغط على الزر إذا كانت المرفقات مطلوبة وهي فارغة
//   const isSubmitDisabled = loading || (selectedDoc?.requires_attachments && attachments.length === 0);

//   return (
//     <div className="document-wrapper">
//       <h1 className="uni-header">{t("documentRequestsTitle")}</h1>
//       <p className="document-subtitle">{t("documentRequestsSubtitle")}</p>

//       {error && <p className="status-message error">{error}</p>}
//       {successMessage && <p className="status-message success">{successMessage}</p>}

//       <div className="document-grid">
//         {documents.map((doc) => (
//           <div key={doc.code} className="document-card">
//             <span className="document-badge">{doc.base_processing_days} {t("days")}</span>
//             <div className="document-card-content">
//               <h3 className="document-title">{doc.name}</h3>
//               <p className="document-desc">{doc.description}</p>
//             </div>
//             <div className="document-actions">
//               <button className="document-btn document-btn-primary" onClick={() => handleSelect(doc)}>
//                 {t("request")}
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* ================= Modal ================= */}
//       {showModal && selectedDoc && (
//         <div className="modal-overlay">
//           <div className="modal-content">
//             <h3 className="modal-title">{t("request")}: {selectedDoc.name}</h3>

//             {selectedDoc.requires_attachments && (
//               <div className="input-group-horizontal upload-container">
//               <label className="input-label-side">{t("attachments")}</label>
//               <div className="file-input-wrapper">
//                 <input
//                   type="file"
//                   id="file-upload"
//                   className="hidden-file-input"
//                   multiple
//                   // إضافة خاصية accept بتخلي المتصفح يفلتر الملفات تلقائياً
//                   accept=".jpeg,.jpg,.png,.pdf" 
//                   onChange={(e) => {
//                     setAttachments(Array.from(e.target.files));
//                     setError(""); 
//                   }}
//                 />
//                 <label htmlFor="file-upload" className="custom-file-button">
//                   {attachments.length > 0 
//                     ? `${attachments.length} ${t("filesSelected")}` 
//                     : t("chooseFile")}
//                 </label>
                
//                 {/* الملاحظة هنا */}
//                 <p className="file-instruction-text">
//                 {t("allowedFilesNote")}
//                 </p>
//               </div>
//             </div>
//             )}

//             <div className="document-actions">
//               <button 
//                 className="document-btn document-btn-primary" 
//                 onClick={handleSubmit} 
//                 disabled={isSubmitDisabled}
//                 style={{ opacity: isSubmitDisabled ? 0.6 : 1, cursor: isSubmitDisabled ? 'not-allowed' : 'pointer' }}
//               >
//                 {loading ? t("submitting") : t("submitRequest")}
//               </button>
//               <button className="document-btn document-btn-secondary" onClick={() => setShowModal(false)}>
//                 {t("cancel")}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DocumentRequest;


import { useEffect, useState } from "react";
import API from "../../services/api"; 
import "./documentRequests.css";
import { useTranslation } from "react-i18next";

const DocumentRequest = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";

  // ================= 1. Timer for Success Message =================
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 1500); 
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ================= Load document types =================
  useEffect(() => {
    API.get("/documents-types")
      .then((res) => {
        const docsData = res.data?.data || [];
        const alumniDocs = docsData.filter(
          (doc) => doc.code !== "ENROLL_PROOF"
        );
        setDocuments(alumniDocs);
      })
      .catch(() => setError(t("loadDocumentsError")));
  }, [currentLang, t]);

  const handleSelect = (doc) => {
    setSelectedDoc(doc);
    setAttachments([]);
    setError("");
    setSuccessMessage("");
    setShowModal(true);
  };

  // ================= Helper Functions =================
  const handleSuccess = () => {
    setSuccessMessage(t("requestSuccess"));
    setShowModal(false); 
    setSelectedDoc(null);
    setAttachments([]);
    setError("");
  };

  const handleBackendError = (err) => {
    const serverMessage = err.response?.data?.message;
    setError(serverMessage || t("submitRequestError"));
  };

  // ================= Submit request =================
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedDoc.requires_attachments && attachments.length === 0) {
      setError(currentLang === "ar" ? "يرجى إرفاق المستندات المطلوبة" : "Please attach the required documents");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("document_type", selectedDoc.code);
    formData.append("language", currentLang);
    
    if (attachments.length > 0) {
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    API.post("/documents/requests", attachments.length === 0 ? {
        document_type: selectedDoc.code,
        language: currentLang
    } : formData)
      .then(() => handleSuccess())
      .catch((err) => handleBackendError(err))
      .finally(() => setLoading(false));
  };

  const isSubmitDisabled = loading || (selectedDoc?.requires_attachments && attachments.length === 0);

  return (
    <div className="document-wrapper">
      <h1 className="uni-header">{t("documentRequestsTitle")}</h1>
      <p className="document-subtitle">{t("documentRequestsSubtitle")}</p>

      {error && <p className="status-message error">{error}</p>}
      {successMessage && <p className="status-message success">{successMessage}</p>}

      <div className="document-grid">
        {documents.map((doc) => (
          <div key={doc.code} className="document-card">
            <span className="document-badge">{doc.base_processing_days} {t("days")}</span>
            <div className="document-card-content">
              <h3 className="document-title">{doc.name}</h3>
              <p className="document-desc">{doc.description}</p>
            </div>
            <div className="document-actions">
              <button className="document-btn document-btn-primary" onClick={() => handleSelect(doc)}>
                {t("request")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= Modal ================= */}
{showModal && selectedDoc && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3 className="modal-title">{t("request")}: {selectedDoc.name}</h3>

      {/* استخدام مفاتيح الترجمة t() بدلاً من النصوص المباشرة */}
      {selectedDoc.code === "GRAD_CERT" && (
        <div className="requirements-box">
          <h4 className="requirements-title">{t("graduation_requirements_title")}</h4>
          <ul className="requirements-list">
            <li>{t("req_fees")}</li>
            <li>{t("req_military")}</li>
            <li>{t("req_clearance")}</li>
          </ul>
        </div>
      )}

            {selectedDoc.requires_attachments && (
              <div className="input-group-horizontal upload-container">
                <label className="input-label-side">{t("attachments")}</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden-file-input"
                    multiple
                    accept=".jpeg,.jpg,.png,.pdf" 
                    onChange={(e) => {
                      setAttachments(Array.from(e.target.files));
                      setError(""); 
                    }}
                  />
                  <label htmlFor="file-upload" className="custom-file-button">
                    {attachments.length > 0 
                      ? `${attachments.length} ${t("filesSelected")}` 
                      : t("chooseFile")}
                  </label>
                  
                  <p className="file-instruction-text">
                    {t("allowedFilesNote")}
                  </p>
                </div>
              </div>
            )}

            <div className="document-actions">
              <button 
                className="document-btn document-btn-primary" 
                onClick={handleSubmit} 
                disabled={isSubmitDisabled}
                style={{ opacity: isSubmitDisabled ? 0.6 : 1, cursor: isSubmitDisabled ? 'not-allowed' : 'pointer' }}
              >
                {loading ? t("submitting") : t("submitRequest")}
              </button>
              <button className="document-btn document-btn-secondary" onClick={() => setShowModal(false)}>
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRequest;