import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./Notification.css";

function Notifications() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("all");

  const [allNotifications, setAllNotifications] = useState([
    {
      id: 1,
      message: "Yara likes your post",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "general",
    },
    {
      id: 2,
      message: "Ahmed invited you to join group",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "invitation",
    },
  ]);

  const deleteNotification = (id) => {
    setAllNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications =
    activeTab === "all"
      ? allNotifications
      : allNotifications.filter((n) => n.type === "invitation");

  return (
    <div className="notifications-container">
      <h1 className="uni-header">{t("Notifications")}</h1>

      <div className="tabs">
        <button
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          {t("All")}
        </button>
        <button
          className={activeTab === "invitation" ? "active" : ""}
          onClick={() => setActiveTab("invitation")}
        >
          {t("invitations")}
        </button>
      </div>

      <div className="notification-list">
        {filteredNotifications.length === 0 ? (
          <p className="empty">{t("noNotifications")}</p>
        ) : (
          filteredNotifications.map((n) => (
            <div key={n.id} className="notification-item">
              <div className="notif-content">
                <p>{n.message}</p>
              </div>
              <div className="notif-actions">
                <small className="time">{n.time}</small>
                <button
                  className="delete-btn"
                  onClick={() => deleteNotification(n.id)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;
