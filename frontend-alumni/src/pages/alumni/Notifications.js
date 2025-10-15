// import React, { useState } from "react";
// import "./Notification.css";

// function Notifications() {
//   const [activeTab, setActiveTab] = useState("all");

//   const [allNotifications, setAllNotifications] = useState([
//     {
//       id: 1,
//       message: "Yara liked your post",
//       time: "10:30 AM",
//       type: "general",
//     },
//     {
//       id: 2,
//       sender: "Ahmed",
//       group: "Frontend Developers",
//       time: "11:15 AM",
//       type: "invitation",
//       status: "pending", // pending | accepted 
//     },
//     {
//       id: 3,
//       sender: "Mona",
//       group: "React Learners",
//       time: "12:40 PM",
//       type: "invitation",
//       status: "pending",
//     },
//   ]);

//   // 🗑 حذف إشعار
//   const deleteNotification = (id) => {
//     setAllNotifications((prev) => prev.filter((n) => n.id !== id));
//   };

//   // ✅ قبول الدعوة
//   const acceptInvitation = (id) => {
//     setAllNotifications((prev) =>
//       prev.map((n) =>
//         n.id === id ? { ...n, status: "accepted" } : n
//       )
//     );
//   };

//   // ❌ رفض الدعوة
//   const rejectInvitation = (id) => {
//     setAllNotifications((prev) =>
//       prev.map((n) =>
//         n.id === id ? { ...n, status: "rejected" } : n
//       )
//     );
//   };

//   // 🔎 فلترة حسب التبويب
//   const filteredNotifications =
//     activeTab === "all"
//       ? allNotifications
//       : allNotifications.filter((n) => n.type === "invitation");

//   return (
//     <div className="notifications-container">
//       <h1 className="Title">Notifications</h1>

//       {/* التبويبات */}
//       <div className="tabs">
//         <button
//           className={activeTab === "all" ? "active" : ""}
//           onClick={() => setActiveTab("all")}
//         >
//           All
//         </button>
//         <button
//           className={activeTab === "invitation" ? "active" : ""}
//           onClick={() => setActiveTab("invitation")}
//         >
//           Invitations
//         </button>
//       </div>

//       {/* قائمة الإشعارات */}
//       <div className="notification-list">
//         {filteredNotifications.length === 0 ? (
//           <p className="empty">No notifications</p>
//         ) : (
//           filteredNotifications.map((n) => (
//             <div key={n.id} className="notification-item">
//               <div className="notif-content">
//                 {n.type === "invitation" ? (
//                   <>
//                     <p>
//                       <strong>{n.sender}</strong> invited you to join{" "}
//                       <strong>{n.group}</strong>
//                     </p>
//                     <small className="time">{n.time}</small>

//                     {n.status === "pending" ? (
//                       <div className="invitation-actions">
//                         <button
//                           className="accept-btn"
//                           onClick={() => acceptInvitation(n.id)}
//                         >
//                           Accept
//                         </button>
//                         <button
//                           className="reject-btn"
//                           onClick={() => rejectInvitation(n.id)}
//                         >
//                           Reject
//                         </button>
//                       </div>
//                     ) : (
//                       <p
//                         className={`status ${
//                           n.status === "accepted" ? "accepted" : "rejected"
//                         }`}
//                       >
//                         {n.status === "accepted"
//                           ? "Invitation Accepted ✅"
//                           : "Invitation Rejected ❌"}
//                       </p>
//                     )}
//                   </>
//                 ) : (
//                   <>
//                     <p>{n.message}</p>
//                     <small className="time">{n.time}</small>
//                   </>
//                 )}
//               </div>

//               <button
//                 className="delete-btn"
//                 onClick={() => deleteNotification(n.id)}
//               >
//                 🗑
//               </button>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default Notifications;
import React, { useState } from "react";
import "./Notification.css";

function Notifications() {
  const [activeTab, setActiveTab] = useState("all");

  const [allNotifications, setAllNotifications] = useState([
    {
      id: 1,
      message: "Yara liked your post",
      time: "10:30 AM",
      type: "general",
    },
    {
      id: 2,
      sender: "Ahmed",
      group: "Frontend Developers",
      time: "11:15 AM",
      type: "invitation",
      status: "pending",
    },
    {
      id: 3,
      sender: "Mona",
      group: "React Learners",
      time: "12:40 PM",
      type: "invitation",
      status: "pending",
    },
  ]);

  const deleteNotification = (id) => {
    setAllNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const acceptInvitation = (id) => {
    setAllNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, status: "accepted" } : n
      )
    );
  };

  const rejectInvitation = (id) => {
    setAllNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, status: "rejected" } : n
      )
    );
  };

  const filteredNotifications =
    activeTab === "all"
      ? allNotifications
      : allNotifications.filter((n) => n.type === "invitation");

  return (
    <div className="notifications-container">
      <h1 className="Title">Notifications</h1>

      <div className="tabs">
        <button
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={activeTab === "invitation" ? "active" : ""}
          onClick={() => setActiveTab("invitation")}
        >
          Invitations
        </button>
      </div>

      <div className="notification-list">
        {filteredNotifications.length === 0 ? (
          <p className="empty">No notifications</p>
        ) : (
          filteredNotifications.map((n) => (
            <div key={n.id} className="notification-item">
              <div className="notif-content">
                {n.type === "invitation" ? (
                  <p>
                    <strong>{n.sender}</strong> invited you to join{" "}
                    <strong>{n.group}</strong>
                  </p>
                ) : (
                  <p>{n.message}</p>
                )}
                <small className="time">{n.time}</small>
              </div>

              <div className="notif-actions">
                {n.type === "invitation" && n.status === "pending" && (
                  <>
                    <button
                      className="accept-btn"
                      onClick={() => acceptInvitation(n.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => rejectInvitation(n.id)}
                    >
                      Reject
                    </button>
                  </>
                )}

                {n.type === "invitation" && n.status !== "pending" && (
                  <p
                    className={`status ${
                      n.status === "accepted" ? "accepted" : "rejected"
                    }`}
                  >
                    {n.status === "accepted"
                      ? "✅ Accepted"
                      : "❌ Rejected"}
                  </p>
                )}

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
