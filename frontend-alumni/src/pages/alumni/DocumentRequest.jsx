

import { useEffect, useState } from "react";
import API from "../../services/api"; 
import "./documentRequests.css";
import { useTranslation } from "react-i18next";

const DocumentRequest = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [docLanguage, setDocLanguage] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";

  useEffect(() => {

    setDocLanguage(currentLang === "ar" ? "ar" : "en");
  }, [currentLang]);


  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 1500); 
      return () => clearTimeout(timer);
    }
  }, [successMessage]);


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
  }, [t]);

  const handleSelect = (doc) => {
    setSelectedDoc(doc);
    setAttachments([]);
    setDocLanguage(currentLang === "ar" ? "ar" : "en"); 
    setError("");
    setSuccessMessage("");
    setShowModal(true);
  };

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
    formData.append("language", docLanguage); 
    
    if (attachments.length > 0) {
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    }

   
    API.post("/documents/requests", formData)
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

 
      {showModal && selectedDoc && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">{t("request")}: {selectedDoc.name}</h3>

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

         
            <div className="input-group-horizontal lang-selection-container">
              <label className="input-label-side">{t("certificate_language") || "لغة الشهادة"}:</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input 
                    type="radio" 
                    name="docLang" 
                    value="ar" 
                    checked={docLanguage === "ar"} 
                    onChange={(e) => setDocLanguage(e.target.value)}
                  />
                  <span>{t("arabic") || "عربي"}</span>
                </label>
                <label className="radio-option">
                  <input 
                    type="radio" 
                    name="docLang" 
                    value="en" 
                    checked={docLanguage === "en"} 
                    onChange={(e) => setDocLanguage(e.target.value)}
                  />
                  <span>{t("english") || "إنجليزي"}</span>
                </label>
              </div>
            </div>
     

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
                  <p className="file-instruction-text">{t("allowedFilesNote")}</p>
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

