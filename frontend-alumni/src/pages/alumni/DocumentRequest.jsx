// import { useEffect, useState } from "react";
// import API from "../../services/api"; 
// import "./documentRequests.css";
// import { useTranslation } from "react-i18next";

// const DocumentRequest = () => {
//   const [documents, setDocuments] = useState([]);
//   const [selectedDoc, setSelectedDoc] = useState(null);
//   const [attachments, setAttachments] = useState([]);
//   const [nationalId, setNationalId] = useState(""); // حقل جديد للرقم القومي
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");
//   const [showModal, setShowModal] = useState(false);

//   const { t, i18n } = useTranslation();
//   const currentLang = i18n.language || "en";

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
//     setNationalId(""); // تصفير الحقل عند فتح مودال جديد
//     setError("");
//     setSuccessMessage("");
//     setShowModal(true);
//   };

//   // ================= Submit request =================
//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     // تأكد من إدخال الرقم القومي
//     if (!nationalId || nationalId.length !== 14) {
//       setError(currentLang === "ar" ? "يرجى إدخال رقم قومي صحيح مكون من 14 رقم" : "Please enter a valid 14-digit National ID");
//       return;
//     }

//     setLoading(true);
//     setError("");
//     setSuccessMessage("");

//     const requestData = {
//       document_type: selectedDoc.code,
//       language: currentLang,
//       national_id: nationalId // الرقم اللي المستخدم دخله بإيده
//     };

//     API.post("/documents/requests", requestData)
//       .then(() => {
//         setSuccessMessage(t("requestSuccess"));
//         setSelectedDoc(null);
//         setAttachments([]);
//         setNationalId("");
//         setShowModal(false);
//       })
//       .catch((err) => {
//         console.error("Backend Error:", err.response?.data);
//         const serverMessage = err.response?.data?.message;
//         setError(serverMessage || t("submitRequestError"));
//       })
//       .finally(() => setLoading(false));
//   };

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

//             {/* حقل الرقم القومي الإجباري */}
//             <div className="input-group-horizontal">
//   <label className="input-label-side">
//     {currentLang === "ar" ? "الرقم القومي" : "National ID"}
//   </label>
//   <input
//     className="form-input-side"
//     type="text"
//     placeholder="2XXXXXXXXXXXXX"
//     value={nationalId}
//     maxLength={14}
//     onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ""))} 
//     required
//   />
// </div>
// {selectedDoc.requires_attachments && (
//   <div className="input-group-horizontal upload-container">
//     <label className="input-label-side">{t("attachments")}</label>
//     <div className="file-input-wrapper">
//       <input
//         type="file"
//         id="file-upload"
//         className="hidden-file-input"
//         multiple
//         onChange={(e) => setAttachments(Array.from(e.target.files))}
//       />
//       <label htmlFor="file-upload" className="custom-file-button">
//         {attachments.length > 0 
//           ? `${attachments.length} ${t("filesSelected")}` 
//           : t("chooseFile")}
//       </label>
//     </div>
//   </div>
// )}

//             <div className="document-actions">
//               <button className="document-btn document-btn-primary" onClick={handleSubmit} disabled={loading}>
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

  // ================= Submit request =================
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 1. سحب الرقم القومي من الـ LocalStorage
    const storedNationalId = localStorage.getItem("national_id");

    // 2. التحقق من وجود الرقم القومي في التخزين
    if (!storedNationalId) {
      setError(currentLang === "ar" 
        ? "بيانات الرقم القومي غير موجودة، يرجى إعادة تسجيل الدخول" 
        : "National ID not found, please re-login");
      return;
    }

    // 3. التحقق من المرفقات إذا كانت مطلوبة
    if (selectedDoc.requires_attachments && attachments.length === 0) {
      setError(currentLang === "ar" ? "يرجى إرفاق المستندات المطلوبة" : "Please attach the required documents");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    // 4. تجهيز البيانات للإرسال
    const formData = new FormData();
    formData.append("document_type", selectedDoc.code);
    formData.append("language", currentLang);
    formData.append("national_id", storedNationalId); // سحب آلي
    
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    API.post("/documents/requests", formData)
      .then(() => {
        setSuccessMessage(t("requestSuccess"));
        setSelectedDoc(null);
        setAttachments([]);
        setShowModal(false);
      })
      .catch((err) => {
        console.error("Backend Error:", err.response?.data);
        const serverMessage = err.response?.data?.message;
        setError(serverMessage || t("submitRequestError"));
      })
      .finally(() => setLoading(false));
  };

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

            {/* تم حذف حقل الرقم القومي لأنه يُسحب آلياً الآن */}

            {selectedDoc.requires_attachments && (
              <div className="input-group-horizontal upload-container">
                <label className="input-label-side">{t("attachments")}</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden-file-input"
                    multiple
                    onChange={(e) => setAttachments(Array.from(e.target.files))}
                  />
                  <label htmlFor="file-upload" className="custom-file-button">
                    {attachments.length > 0 
                      ? `${attachments.length} ${t("filesSelected")}` 
                      : t("chooseFile")}
                  </label>
                </div>
              </div>
            )}

            <div className="document-actions">
              <button className="document-btn document-btn-primary" onClick={handleSubmit} disabled={loading}>
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