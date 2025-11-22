//NotificationsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import './Notification.css'
import { useTranslation } from "react-i18next";

const token = localStorage.getItem("token");

const API = axios.create({
  baseURL: "http://localhost:5005/alumni-portal",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // تحديث اتجاه الصفحة تلقائي حسب اللغة
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) return <div className="notifications-container">{t("Loading notifications...")}</div>;

  return (
    <div className="notifications-container">
      <h1 className="Title">{t("Notifications")}</h1>
      <div className="notifications-list">
        <button className="accept-btn" onClick={markAllAsRead}>{t("Mark All as Read")}</button>

        {notifications.length === 0 ? (
          <div className="empty">{t("No notifications")}</div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`notification-item ${n.isRead ? "" : "unread"}`}>
              <div className="notif-content">
                <p>{n.message}</p>
           
                <span className="time">
  {new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(n.createdAt))}
</span>

              </div>
              <div className="notif-actions">
                {!n.isRead && (
                  <button className="accept-btn" onClick={() => markAsRead(n.id)}>
                    {t("Mark as Read")}
                  </button>
                )}
                <button className="delete-btn" onClick={() => deleteNotification(n.id)}>
                  {t("Delete")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
