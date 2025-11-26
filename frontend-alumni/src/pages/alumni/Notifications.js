import React, { useEffect, useState } from "react";
import './Notification.css';
import { useTranslation } from "react-i18next";
import axios from "axios";

// استخدام التوكن من localStorage
const token = localStorage.getItem("token");

const API = axios.create({
  baseURL: "http://localhost:5005/alumni-portal",
  headers: { Authorization: `Bearer ${token}` },
});

const NotificationsPage = ({ openChat, openFriendRequest }) => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // تحديث اتجاه الصفحة حسب اللغة
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // جلب النوتيفيكيشنز
  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
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

  // التعامل مع الضغط على النوتيفيكيشن
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification.id);

    const nav = notification.navigation;

    // لو مفيش navigation، نرجع
    if (!nav) return;

    switch(nav.screen) {
      case "chat":
        if(nav.chatId && openChat) openChat(nav.chatId);
        break;

      case "friend-requests":
        // فتح FriendshipPage على تبويب Requests مباشرة
        window.location.href = "/helwan-alumni-portal/graduate/dashboard/friends?tab=requests";
        break;

      case "profile":
      case "accept":
        // أي Accept أو Profile → يفتح قائمة الأصدقاء (Friends tab)
        window.location.href = "/helwan-alumni-portal/graduate/dashboard/friends?tab=friends";
        break;

      case "user":
        if(nav.userId && notification.type === "friend_request" && openFriendRequest) {
          openFriendRequest(nav.userId);
        }
        break;

      case "post":
      case "event":
        // يمكن إضافة navigate لاحقًا للبوست أو الايفنت
        break;

      default:
        console.warn("Unknown notification screen:", nav.screen);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) return <div className="notifications-container">{t("Loading notifications...")}</div>;

  return (
    <div className="notifications-container">
      <h1 className="Title">{t("Notifications")}</h1>
      <button className="accept-btn" onClick={markAllAsRead}>{t("Mark All as Read")}</button>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty">{t("No notifications")}</div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`notification-item ${n.isRead ? "" : "unread"}`}
              onClick={() => handleNotificationClick(n)}
            >
              <div className="notif-content">
                <p>{n.message}</p>
                <span className="time">
                  {new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-EG" : "en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(n.createdAt))}
                </span>
              </div>
              <div className="notif-actions" onClick={(e) => e.stopPropagation()}>
                {!n.isRead && (
                  <button className="accept-btn-" onClick={() => markAsRead(n.id)}>
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

/*// NotificationsPage.jsx
import React, { useEffect, useState } from "react";
import './Notification.css';
import { useTranslation } from "react-i18next";
import axios from "axios";

const token = localStorage.getItem("token");

const API = axios.create({
  baseURL: "http://localhost:5005/alumni-portal",
  headers: { Authorization: `Bearer ${token}` },
});

const NotificationsPage = ({ openChat, openFriendRequest }) => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // تحديث اتجاه الصفحة حسب اللغة
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // جلب النوتيفيكيشنز
  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
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

  const handleNotificationClick = (notification) => {
    console.log("Notification clicked:", notification);

    if (!notification.isRead) markAsRead(notification.id);

    const nav = notification.navigation;
    if (!nav) return;

    // فتح Pop-up Chat أو Friend Requests حسب النوع
    switch(nav.screen) {
      case "chat":
        if(nav.chatId) {
          openChat(nav.chatId);
        }
        break;
      case "user":
        if(nav.userId && notification.type === "friend_request") {
          openFriendRequest(nav.userId);
        }
        break;
      case "post":
      case "event":
        // لو حابة تضيف navigate للبوست أو الايفنت بعدين
        break;
      default:
        console.warn("Unknown notification screen:", nav.screen);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) return <div className="notifications-container">{t("Loading notifications...")}</div>;

  return (
    <div className="notifications-container">
      <h1 className="Title">{t("Notifications")}</h1>
      <button className="accept-btn" onClick={markAllAsRead}>{t("Mark All as Read")}</button>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty">{t("No notifications")}</div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`notification-item ${n.isRead ? "" : "unread"}`}
              onClick={() => handleNotificationClick(n)}
            >
              <div className="notif-content">
                <p>{n.message}</p>
                <span className="time">
                  {new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-EG" : "en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(n.createdAt))}
                </span>
              </div>
              <div className="notif-actions" onClick={(e) => e.stopPropagation()}>
                {!n.isRead && (
                  <button className="accept-btn-" onClick={() => markAsRead(n.id)}>
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
*/