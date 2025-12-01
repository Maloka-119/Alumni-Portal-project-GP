import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Notification.css";
import { Check, X } from "lucide-react";

const token = localStorage.getItem("token");

const API = axios.create({
  baseURL: "http://localhost:5005/alumni-portal",
  headers: { Authorization: `Bearer ${token}` },
});

const NotificationsPage = ({ openChat }) => {

  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

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
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------
  //                HANDLE CLICK ON NOTIFICATION
  // -------------------------------------------------------
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) markAsRead(notification.id);

    const nav = notification.navigation;
    if (!nav) return;

    switch (nav.screen) {
      // ---------------------------------------------------
      //                    OPEN CHAT
      // ---------------------------------------------------
      case "chat":
        if (nav.chatId && openChat) {
          // تأكد من وجود sender قبل تمريره
          const sender = notification.sender || { id: null, fullName: "Unknown", email: "" };
          openChat(nav.chatId, {
            id: sender.id,
            fullName: sender.fullName || "Unknown",
            email: sender.email || "",
          });
        }
        break;
      
      
      

      // ---------------------------------------------------
      case "friend-requests":
        navigate(
          "/helwan-alumni-portal/graduate/dashboard/friends?tab=requests"
        );
        break;

      case "profile":
      case "accept":
        navigate(
          "/helwan-alumni-portal/graduate/dashboard/friends?tab=friends"
        );
        break;

      case "user":
        if (nav.userId) {
          navigate(
            `/helwan-alumni-portal/graduate/dashboard/profile/${nav.userId}`
          );
        }
        break;

      // ---------------------------------------------------
      //                    POSTS
      // ---------------------------------------------------
      case "post":
        if (nav.postId) {
          const path = nav.commentId
            ? `/helwan-alumni-portal/graduate/dashboard/posts/${nav.postId}?comment=${nav.commentId}`
            : `/helwan-alumni-portal/graduate/dashboard/posts/${nav.postId}`;
          navigate(path);
        }
        break;

      default:
        console.warn("Unknown notification screen:", nav.screen);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading)
    return (
      <div className="notifications-container">
        {t("Loading notifications...")}
      </div>
    );

  const filteredNotifications = notifications.filter(
    (n) => n.type !== "delete_comment"
  );

  return (
    <div className="notifications-container">
      <h1 className="Title">{t("Notifications")}</h1>
      <button className="allread" onClick={markAllAsRead}>
      <Check size={24} color="#1089b9" /> {t("Mark All as Read")}
      </button>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty">{t("No notifications")}</div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`notification-item ${n.isRead ? "" : "unread"}`}
              onClick={() => handleNotificationClick(n)}
            >
              <div className="notif-content">
                <p>{n.message}</p>
                <span className="time">
                  {new Intl.DateTimeFormat(
                    i18n.language === "ar" ? "ar-EG" : "en-US",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  ).format(new Date(n.createdAt))}
                </span>
              </div>

              <div
                className="notif-actions"
                onClick={(e) => e.stopPropagation()}
              >
                {!n.isRead && (
                  <button
                    className="delete-btn"
                    onClick={() => markAsRead(n.id)}
                  style={{backgroundColor:"transparent"}}
                  >
                    <Check size={20} color="#1089b9" />
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={() => deleteNotification(n.id)}
                  style={{backgroundColor:"transparent"}}
                >
                  <X size={20} color="#ff4d4f" />
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