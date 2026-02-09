import { useEffect, useState } from "react";
import axios from "axios";
import "./documentRequests.css";

const DocumentRequest = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false); // state للبوب اب

  // Load document types
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:5005/alumni-portal/documents-types?language=en", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        const alumniDocs = res.data.data.filter(
          (doc) => doc.code !== "ENROLL_PROOF"
        );
        setDocuments(alumniDocs);
      })
      .catch(() => setError("Failed to load document types"));
  }, []);

  const handleSelect = (doc) => {
    setSelectedDoc(doc);
    setAttachments([]);
    setError("");
    setSuccessMessage("");
    setShowModal(true); // عرض البوب اب
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!selectedDoc) {
      setError("Please select a document first");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("document_code", selectedDoc.code);

    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    const token = localStorage.getItem("token");

      axios.post("http://localhost:5005/alumni-portal/documents/requests", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })
      
      .then(() => {
        setSuccessMessage("Request submitted successfully ✅");
        setSelectedDoc(null);
        setAttachments([]);
        setShowModal(false); // اغلاق البوب اب بعد الإرسال
      })
      .catch((err) => {
        console.error(err.response || err);
        if (err.response?.status === 401) {
          setError("Unauthorized: Please login first");
        } else {
          setError("Failed to submit request");
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="document-wrapper">
      <h2 className="document-header">Alumni Document Requests</h2>
      <p style={{ textAlign: "center", marginBottom: 20 }}>
        Request official documents for graduates
      </p>

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
      {successMessage && (
        <p style={{ color: "green", textAlign: "center" }}>{successMessage}</p>
      )}

      <div className="document-grid">
        {documents.map((doc) => (
          <div key={doc.code} className="document-card">
            <span className="document-badge">
              {doc.base_processing_days} Days
            </span>
            <div className="document-card-content">
              <h3 className="document-title">{doc.name}</h3>
              <p className="document-desc">{doc.description}</p>
            </div>
            <div className="document-actions">
              <button
                className="document-btn document-btn-primary"
                onClick={() => handleSelect(doc)}
              >
                Request
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Modal Popup ===== */}
      {showModal && selectedDoc && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Request: {selectedDoc.name}</h3>

            {selectedDoc.requires_attachments && (
              <>
                <label>Attachments</label>
                <input
                  type="file"
                  multiple
                  required
                  onChange={(e) => setAttachments([...e.target.files])}
                />
                {attachments.length > 0 && (
                  <ul style={{ marginTop: 10 }}>
                    {attachments.map((file, idx) => (
                      <li key={idx}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </>
            )}

            <div className="document-actions" style={{ marginTop: 15 }}>
              <button
                className="document-btn document-btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
              <button
                className="document-btn document-btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRequest;
