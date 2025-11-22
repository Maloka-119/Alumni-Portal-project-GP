import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import "./FeedbackPage.css";

export default function FeedbackPageUnique() {
  const { t, i18n } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [records, setRecords] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState("Complaint");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const response = await API.get("/feedbacks/my-feedbacks");
        setRecords(response.data); 
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newItem = { category, title, details, phone, email };

    try {
      setLoading(true);
      const response = await API.post("/feedbacks", newItem);

      if (response.data && response.data.data) {
        setRecords([response.data.data, ...records]);
      }

      setTitle("");
      setDetails("");
      setPhone("");
      setEmail("");
      setCategory("Complaint");
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const smallText = (text) => {
    if (!text) return "";
    return text.length <= 60 ? text : text.slice(0, 60) + "...";
  };

  const getTypeClassName = (category) => {
    if (!category) return "complaint";
    return category.toLowerCase() === "suggestion" ? "suggestion" : "complaint";
  };

  return (
    <div
      className="feedback-main-container"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <h2 className="uni-header">{t("feedbackPageTitle")}</h2>
      <p className="feedback-description">{t("feedbackPageDescription")}</p>

      <button
        className="feedback-toggle-btn"
        onClick={() => setShowForm(!showForm)}
        disabled={loading}
      >
        {showForm ? t("close") : t("addFeedback")}
      </button>

      {showForm && (
        <form className="feedback-form-box" onSubmit={handleSubmit}>
          <label>
            {t("category")}
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Complaint">{t("complaint")}</option>
              <option value="Suggestion">{t("suggestion")}</option>
            </select>
          </label>

          <label>
            {t("title")}
            <input
              type="text"
              value={title}
              required
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label>
            {t("details")}
            <textarea
              value={details}
              required
              onChange={(e) => setDetails(e.target.value)}
            />
          </label>

          <label>
            {t("phone")}
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label>
            {t("email")}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <button 
            className="feedback-submit-btn" 
            type="submit"
            disabled={loading}
          >
            {loading ? t("submitting") : t("submit")}
          </button>
        </form>
      )}

      {loading && <div className="loading-indicator">{t("loading")}</div>}

      <div className="feedback-cards-wrapper">
        {records.map((item) => (
          <div key={item.feedback_id} className="feedback-card">
            <span className="feedback-badge">#{item.feedback_id}</span>
            {/* <span className={`feedback-type-badge ${getTypeClassName(item.category)}`}>
              {item.category === "Suggestion" ? t("suggestion") : t("complaint")}
            </span> */}
            <h4 className="feedback-card-title">{item.title || "No Title"}</h4>
            {/* <h5 className="feedback-user">
              {item.User ? `${item.User["first-name"]} ${item.User["last-name"]}` : "-"}
            </h5> */}
            <p className="feedback-card-text">{smallText(item.details)}</p>
            <button
              className="feedback-see-more"
              onClick={() => setModalItem(item)}
            >
              {t("seeMore")}
            </button>
          </div>
        ))}
      </div>

      {modalItem && (
        <div className="feedback-modal-overlay">
          <div className="feedback-modal-box">
            <h3 className="modal-title">{modalItem.title || "No Title"}</h3>
            <p className="modal-type">
              {modalItem.category === "Suggestion" ? t("suggestion") : t("complaint")}
            </p>
            <p className="modal-details">{modalItem.details || "No details provided"}</p>
            <div className="modal-contact-info">
              <p><strong>{t("phone")}:</strong> {modalItem.phone || "-"}</p>
              <p><strong>{t("email")}:</strong> {modalItem.email || "-"}</p>
            </div>
            <button
              className="modal-close-btn"
              onClick={() => setModalItem(null)}
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
