import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Notification.css";
import { Check, X } from "lucide-react";

const NotificationsPage = ({ openChat }) => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:5005/alumni-portal/notifications", {
        headers: getAuthHeaders(),
      });
      setNotifications(res.data.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(
        `http://localhost:5005/alumni-portal/notifications/${id}/read`,
        {},
        { headers: getAuthHeaders() }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5005/alumni-portal/notifications/${id}`,
        { headers: getAuthHeaders() }
      );
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        "http://localhost:5005/alumni-portal/notifications/read-all",
        {},
        { headers: getAuthHeaders() }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) markAsRead(notification.id);

    const nav = notification.navigation;
    if (!nav) return;

    switch (nav.screen) {
      case "chat":
        if (nav.chatId && openChat) {
          const sender = notification.sender || { id: null, fullName: "Unknown", email: "" };
          openChat(nav.chatId, {
            id: sender.id,
            fullName: sender.fullName,
            email: sender.email,
          });
        }
        break;

      case "friend-requests":
        navigate("/helwan-alumni-portal/graduate/dashboard/friends?tab=requests");
        break;

      case "profile":
      case "accept":
        navigate("/helwan-alumni-portal/graduate/dashboard/friends?tab=friends");
        break;

      case "user":
        if (nav.userId) navigate(`/helwan-alumni-portal/graduate/dashboard/profile/${nav.userId}`);
        break;

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
  const fetchInvitations = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5005/alumni-portal/invitations/received",
        { headers: getAuthHeaders() }
      );
      // console.log("Invitations data:", res.data);
      setInvitations(res.data);
    } catch (err) {
      console.error("Error fetching invitations:", err);
    }
  };


  useEffect(() => {
    fetchNotifications();
    fetchInvitations();
  }, []);
  

  if (loading)
    return <div className="notifications-container">{t("Loading notifications...")}</div>;

  const filteredNotifications = notifications.filter((n) => n.type !== "delete_comment");

  const acceptInvitation = async (invitationId) => {
    if (!invitationId) return console.error("Invitation id is missing");
    try {
      await axios.post(
        `http://localhost:5005/alumni-portal/invitations/${invitationId}/accept`,
        {},
        { headers: getAuthHeaders() }
      );
      setInvitations(prev => prev.filter(inv => inv.invitationId !== invitationId));
    } catch (err) {
      console.error("Axios accept error:", err);
    }
  };
  
  const rejectInvitation = async (invitationId) => {
    if (!invitationId) return console.error("Invitation id is missing");
    try {
      await axios.delete(
        `http://localhost:5005/alumni-portal/invitations/${invitationId}`,
        { headers: getAuthHeaders() }
      );
      setInvitations(prev => prev.filter(inv => inv.invitationId !== invitationId));
    } catch (err) {
      console.error("Axios reject error:", err);
    }
  };
  

  

  return (
    <div className="notifications-container">
      <h1 className="Title">{t("Notifications")}</h1>

      <button className="allread" onClick={markAllAsRead}>
        <Check size={24} color="#1089b9" /> {t("Mark All as Read")}
      </button>

      <div className="notifications-list">
  {filteredNotifications.length === 0 && invitations.length === 0 ? (
    <div className="empty">{t("No notifications")}</div>
  ) : (
    <>
      {filteredNotifications.map((n) => (
        <div
          key={`notif-${n.id}`}
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

          <div className="notif-actions" onClick={(e) => e.stopPropagation()}>
            {!n.isRead && (
              <button
                className="delete-btn"
                onClick={() => markAsRead(n.id)}
                style={{ backgroundColor: "transparent" }}
              >
                <Check size={20} color="#1089b9" />
              </button>
            )}
            <button
              className="delete-btn"
              onClick={() => deleteNotification(n.id)}
              style={{ backgroundColor: "transparent" }}
            >
              <X size={20} color="#ff4d4f" />
            </button>
          </div>
        </div>
      ))}

{invitations.map((inv) => (
  <div
    key={`inv-${inv.invitationId}`}
    className={`notification-item ${inv.status === "pending" ? "unread" : ""}`}
  >
    <div className="notif-content">
      <p>{inv.senderFullName} - {inv.groupName}</p>
      <span className="time">
        {new Date(inv.sent_date).toLocaleString(
          i18n.language === "ar" ? "ar-EG" : "en-US"
        )}
      </span>
    </div>

    <div className="notif-actions" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => acceptInvitation(inv.invitationId)}
        className="accept-invv"
      >
        {t("Accept")}
      </button>
      <button
        onClick={() => rejectInvitation(inv.invitationId)}
        className="delete-btn"
      >
        {t("Reject")}
      </button>
    </div>
  </div>
))}

    </>
  )}
</div>

      

    </div>
  );
};

export default NotificationsPage;


// import React, { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import "./Notification.css";
// import { Check, X } from "lucide-react";

// const NotificationsPage = ({ openChat }) => {
//   const { t, i18n } = useTranslation();
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
//   }, [i18n.language]);

//   const getAuthHeaders = () => {
//     const token = localStorage.getItem("token");
//     return { Authorization: `Bearer ${token}` };
//   };

//   const fetchNotifications = async () => {
//     try {
//       const res = await axios.get("http://localhost:5005/alumni-portal/notifications", {
//         headers: getAuthHeaders(),
//       });
//       setNotifications(res.data.data);
//     } catch (err) {
//       console.error("Error fetching notifications:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const markAsRead = async (id) => {
//     try {
//       await axios.put(
//         `http://localhost:5005/alumni-portal/notifications/${id}/read`,
//         {},
//         { headers: getAuthHeaders() }
//       );
//       setNotifications((prev) =>
//         prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
//       );
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const deleteNotification = async (id) => {
//     try {
//       await axios.delete(
//         `http://localhost:5005/alumni-portal/notifications/${id}`,
//         { headers: getAuthHeaders() }
//       );
//       setNotifications((prev) => prev.filter((n) => n.id !== id));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const markAllAsRead = async () => {
//     try {
//       await axios.put(
//         "http://localhost:5005/alumni-portal/notifications/read-all",
//         {},
//         { headers: getAuthHeaders() }
//       );
//       setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleNotificationClick = async (notification) => {
//     if (!notification.isRead) markAsRead(notification.id);

//     const nav = notification.navigation;
//     if (!nav) return;

//     switch (nav.screen) {
//       case "chat":
//         if (nav.chatId && openChat) {
//           const sender = notification.sender || { id: null, fullName: "Unknown", email: "" };
//           openChat(nav.chatId, {
//             id: sender.id,
//             fullName: sender.fullName,
//             email: sender.email,
//           });
//         }
//         break;

//       case "friend-requests":
//         navigate("/helwan-alumni-portal/graduate/dashboard/friends?tab=requests");
//         break;

//       case "profile":
//       case "accept":
//         navigate("/helwan-alumni-portal/graduate/dashboard/friends?tab=friends");
//         break;

//       case "user":
//         if (nav.userId) navigate(`/helwan-alumni-portal/graduate/dashboard/profile/${nav.userId}`);
//         break;

//       case "post":
//         if (nav.postId) {
//           const path = nav.commentId
//             ? `/helwan-alumni-portal/graduate/dashboard/posts/${nav.postId}?comment=${nav.commentId}`
//             : `/helwan-alumni-portal/graduate/dashboard/posts/${nav.postId}`;
//           navigate(path);
//         }
//         break;

//       default:
//         console.warn("Unknown notification screen:", nav.screen);
//     }
//   };

//   useEffect(() => {
//     fetchNotifications();
//   }, []);

//   if (loading)
//     return <div className="notifications-container">{t("Loading notifications...")}</div>;

//   const filteredNotifications = notifications.filter((n) => n.type !== "delete_comment");

//   return (
//     <div className="notifications-container">
//       <h1 className="Title">{t("Notifications")}</h1>

//       <button className="allread" onClick={markAllAsRead}>
//         <Check size={24} color="#1089b9" /> {t("Mark All as Read")}
//       </button>

//       <div className="notifications-list">
//         {filteredNotifications.length === 0 ? (
//           <div className="empty">{t("No notifications")}</div>
//         ) : (
//           filteredNotifications.map((n) => (
//             <div
//               key={n.id}
//               className={`notification-item ${n.isRead ? "" : "unread"}`}
//               onClick={() => handleNotificationClick(n)}
//             >
//               <div className="notif-content">
//                 <p>{n.message}</p>
//                 <span className="time">
//                   {new Intl.DateTimeFormat(
//                     i18n.language === "ar" ? "ar-EG" : "en-US",
//                     {
//                       weekday: "long",
//                       day: "numeric",
//                       month: "long",
//                       year: "numeric",
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     }
//                   ).format(new Date(n.createdAt))}
//                 </span>
//               </div>

//               <div className="notif-actions" onClick={(e) => e.stopPropagation()}>
//                 {!n.isRead && (
//                   <button
//                     className="delete-btn"
//                     onClick={() => markAsRead(n.id)}
//                     style={{ backgroundColor: "transparent" }}
//                   >
//                     <Check size={20} color="#1089b9" />
//                   </button>
//                 )}
//                 <button
//                   className="delete-btn"
//                   onClick={() => deleteNotification(n.id)}
//                   style={{ backgroundColor: "transparent" }}
//                 >
//                   <X size={20} color="#ff4d4f" />
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default NotificationsPage;

