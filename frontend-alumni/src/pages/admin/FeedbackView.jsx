import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import "./FeedbackView.css";

export default function FeedbackView() {
  const { t, i18n } = useTranslation();
  const [records, setRecords] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [filter, setFilter] = useState("all"); 

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await API.get("/feedbacks"); 
        setRecords(response.data);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      }
    };
    fetchFeedbacks();
  }, []);

  const smallText = (text) => (text && text.length > 60 ? text.slice(0, 60) + "..." : text);

  const filteredRecords = filter === "all" ? records : records.filter((item) => item.type === filter);

  return (
    <div className="admin-feedback-container" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <h2 className="page-title">{t("adminFeedbackPageTitle")}</h2>

      <div className="admin-feedback-filter">
        <label>{t("filter")} :
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">{t("all")}</option>
            <option value="complaint">{t("complaint")}</option>
            <option value="suggestion">{t("suggestion")}</option>
          </select>
        </label>
      </div>

      <div className="admin-feedback-cards">
        {filteredRecords.map((item) => (
          <div key={item.id} className="admin-feedback-card">
            <span className="admin-feedback-badge">#{item.id}</span>
            <h4 className="admin-feedback-card-title">{item.title}</h4>
            <p className="admin-feedback-card-user">{item.user?.fullName || "-"}</p>
            <p className="admin-feedback-card-text">{smallText(item.details)}</p>
            <button className="admin-feedback-see-more" onClick={() => setModalItem(item)}>
              {t("seeMore")}
            </button>
          </div>
        ))}
      </div>

      {modalItem && (
        <div className="admin-feedback-modal-overlay">
          <div className="admin-feedback-modal-box">
            <h3 className="admin-feedback-modal-title">{modalItem.title}</h3>
            <p className="admin-feedback-modal-user">{modalItem.user?.fullName || "-"}</p>
            <p className="admin-feedback-modal-details">{modalItem.details}</p>
            <p className="admin-feedback-modal-info">{modalItem.phone || "-"}</p>
            <p className="admin-feedback-modal-info">{modalItem.email || "-"}</p>
            <button className="admin-feedback-modal-close" onClick={() => setModalItem(null)}>
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
