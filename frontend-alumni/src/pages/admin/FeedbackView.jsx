import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "./FeedbackView.css";

export default function FeedbackView() {
  const { t, i18n } = useTranslation();
  const [records, setRecords] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [filter, setFilter] = useState("all"); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Axios instance
  const API = axios.create({
    baseURL: "http://localhost:5005/alumni-portal",
    headers: {
      "Content-Type": "application/json",
    },
  });

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await API.get("/feedbacks");
        setRecords(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
        setError("Failed to fetch feedbacks");
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  const smallText = (text) =>
    text && text.length > 60 ? text.slice(0, 60) + "..." : text;

  // Filter based on category
  const filteredRecords =
    filter === "all"
      ? records
      : records.filter(
          (item) => item.category.toLowerCase() === filter.toLowerCase()
        );

  return (
    <div
      className="admin-feedback-container"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <h2 className="page-title">{t("adminFeedbackPageTitle")}</h2>

      {loading && <p>{t("loading") || "Loading..."}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {records.length > 0 && (
        <>
          <div className="admin-feedback-filter">
            <label>
              {t("filter")} :
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">{t("all")}</option>
                <option value="complaint">{t("complaint")}</option>
                <option value="suggestion">{t("suggestion")}</option>
              </select>
            </label>
          </div>

          {filteredRecords.length === 0 ? (
            <p>{t("noFeedback") || "No feedback found for this category"}</p>
          ) : (
            <div className="admin-feedback-cards">
              {filteredRecords.map((item) => (
                <div key={item.feedback_id} className="admin-feedback-card">
                  <span className="admin-feedback-badge">
                    #{item.feedback_id}
                  </span>
                  <h4 className="admin-feedback-card-title">{item.title}</h4>
                  <p className="admin-feedback-card-user">
                    {item.User
                      ? `${item.User["first-name"]} ${item.User["last-name"]}`
                      : "-"}
                  </p>
                  <p className="admin-feedback-card-text">
                    {smallText(item.details)}
                  </p>
                  <button
                    className="admin-feedback-see-more"
                    onClick={() => setModalItem(item)}
                  >
                    {t("seeMore")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {modalItem && (
        <div className="admin-feedback-modal-overlay">
          <div className="admin-feedback-modal-box">
            <h3 className="admin-feedback-modal-title">{modalItem.title}</h3>
            <p className="admin-feedback-modal-user">
              {modalItem.User
                ? `${modalItem.User["first-name"]} ${modalItem.User["last-name"]}`
                : "-"}
            </p>
            <p className="admin-feedback-modal-details">{modalItem.details}</p>
            <p className="admin-feedback-modal-info">{modalItem.phone || "-"}</p>
            <p className="admin-feedback-modal-info">{modalItem.email || "-"}</p>
            <button
              className="admin-feedback-modal-close"
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
