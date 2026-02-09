import { useEffect, useState } from "react";
import axios from "axios";
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
  const token = localStorage.getItem("token");
  const currentLang = i18n.language || "en";

  // ================= Load document types =================
  useEffect(() => {
    axios
      .get("http://localhost:5005/alumni-portal/documents-types", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Accept-Language": currentLang, // ✅ مربوط بالـ i18n
        },
      })
      .then((res) => {
        const alumniDocs = res.data.data.filter(
          (doc) => doc.code !== "ENROLL_PROOF"
        );
        setDocuments(alumniDocs);
      })
      .catch(() => setError(t("loadDocumentsError")));
  }, [token, currentLang, t]);

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
    setLoading(true);
    setError("");
    setSuccessMessage("");

    if (!selectedDoc) {
      setError(t("errorLabel"));
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("document_code", selectedDoc.code);

    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    axios
      .post(
        "http://localhost:5005/alumni-portal/documents/requests",
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Accept-Language": currentLang, // ✅
          },
        }
      )
      .then(() => {
        setSuccessMessage(t("requestSuccess"));
        setSelectedDoc(null);
        setAttachments([]);
        setShowModal(false);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setError(t("unauthorizedError"));
        } else {
          setError(t("submitRequestError"));
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="document-wrapper">
      <h2 className="document-header">
        {t("documentRequestsTitle")}
      </h2>

      <p style={{ textAlign: "center", marginBottom: 20 }}>
        {t("documentRequestsSubtitle")}
      </p>

      {error && (
        <p style={{ color: "red", textAlign: "center" }}>{error}</p>
      )}

      {successMessage && (
        <p style={{ color: "green", textAlign: "center" }}>
          {successMessage}
        </p>
      )}

      <div className="document-grid">
        {documents.map((doc) => (
          <div key={doc.code} className="document-card">
            <span className="document-badge">
              {doc.base_processing_days} {t("days")}
            </span>

            <h3 className="document-title">{doc.name}</h3>
            <p className="document-desc">{doc.description}</p>

            <button
              className="document-btn document-btn-primary"
              onClick={() => handleSelect(doc)}
            >
              {t("request")}
            </button>
          </div>
        ))}
      </div>

      {/* ================= Modal ================= */}
      {showModal && selectedDoc && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {t("request")}: {selectedDoc.name}
            </h3>

            {selectedDoc.requires_attachments && (
              <>
                <label>{t("attachments")}</label>
                <input
                  type="file"
                  multiple
                  required
                  onChange={(e) =>
                    setAttachments(Array.from(e.target.files))
                  }
                />
              </>
            )}

            <div className="document-actions">
              <button
                className="document-btn document-btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? t("submitting") : t("submitRequest")}
              </button>

              <button
                className="document-btn document-btn-secondary"
                onClick={() => setShowModal(false)}
              >
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
