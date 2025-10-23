import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import PROFILE from "./PROFILE.jpeg";
import "./FriendShip.css";
import { MessageCircle } from "lucide-react";


function FriendshipPage() {
  const { t, i18n } = useTranslation();
  const [currentTab, setCurrentTab] = useState("friends");

  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    document.body.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      const res = await API.get("/friendships/friends");
      const mapped = res.data.map(f => ({
        id: f.friendId,
        friendId: f.friendId,
        userName: f.fullName || "No Name",
        image: f.profilePicture || PROFILE,
      }));
      setFriends(mapped);
    } catch (err) {
      console.error("Friends API Error:", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await API.get("/friendships/requests");
      const mapped = res.data.map(f => ({
        id: f.id,
        senderId: f.senderId,
        userName: f.fullName || "No Name",
        image: f.profilePicture || PROFILE
      }));
      setFriendRequests(mapped);
    } catch (err) {
      console.error("Requests API Error:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const res = await API.get("/friendships/suggestions");
      const mapped = res.data.map(f => ({
        id: f.graduate_id,
        userName: f.fullName || "No Name",
        image: f["profile-picture-url"] || PROFILE,
        added: false
      }));
      setSuggestions(mapped);
    } catch (err) {
      console.error("Suggestions API Error:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchSuggestions();
  }, []);

  const confirmFriend = async (senderId) => {
    try {
      await API.put(`/friendships/confirm/${senderId}`);
      fetchFriends();
      fetchRequests();
    } catch (err) {
      console.error("Confirm Friend API Error:", err);
    }
  };

  const UnfriendFriend = async (friendId, userName) => {
    try {
      await API.delete(`/friendships/friends/${friendId}`);
      setFriends(prev => prev.filter(f => f.friendId !== friendId));
      fetchSuggestions();
    } catch (err) {
      console.error("Delete Friend API Error:", err);
    }
  };

  const removeRequest = async (senderId) => {
    try {
      await API.put(`/friendships/hide/${senderId}`);
      fetchRequests();
      fetchSuggestions();
    } catch (err) {
      console.error("Remove Request API Error:", err);
    }
  };

  const toggleRequest = async (receiverId, added) => {
    try {
      if (!added) {
        await API.post(`/friendships/request/${receiverId}`);
      } else {
        await API.delete(`/friendships/cancel/${receiverId}`);
      }
      setSuggestions(prev =>
        prev.map(f => (f.id === receiverId ? { ...f, added: !added } : f))
      );
    } catch (err) {
      console.error("Add/Cancel Request API Error:", err);
    }
  };

  const removeSuggestion = (id) => {
    setSuggestions(prev => prev.filter(f => f.id !== id));
  };

  const filteredSuggestions = suggestions.filter(f =>
    f.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    switch (currentTab) {
      case "friends":
        return (
          <>
           <h2 className="Title">
  {t("friendsList")} <span className="req-count">({friends.length})</span>
</h2>

            {loadingFriends ? (
              <p>{t("loadingFriends")}</p>
            ) : friends.length === 0 ? (
              <p>{t("noFriends")}</p>
            ) : (
              friends.map(f => (
                <div className="user" key={f.id}>
                  <div className="friend-info">
  <img className="imgreq" src={f.image} alt={f.userName} />
  <span className="user-name">{f.userName}</span>
</div>
                  <div className="friend-actions">
                  <button className=" chat-icon-btn">
  <MessageCircle size={18} />
</button>

            <button
              className="Removebutton"
              onClick={() => UnfriendFriend(f.friendId, f.userName)}
            >
              {t("Unfriend")}
            </button>
                  </div>
                </div>
              ))
            )}
          </>
        );

      case "requests":
        return (
          <>
            <h2 className="Title">
  {t("friendRequests")} <span className="req-count">({friendRequests.length})</span>
</h2>

            {loadingRequests ? (
              <p>{t("loadingRequests")}</p>
            ) : friendRequests.length === 0 ? (
              <p>{t("noRequests")}</p>
            ) : (
              friendRequests.map(f => (
                <div className="user" key={f.id}>
                  <div className="friend-info">
  <img className="imgreq" src={f.image} alt={f.userName} />
  <span className="user-name">{f.userName}</span>
</div>
                  <div className="friend-actions">
                  <button className="button" onClick={() => confirmFriend(f.senderId)}>
              {t("confirm")}
            </button>
            <button className="Removebutton" onClick={() => removeRequest(f.senderId)}>
              {t("remove")}
            </button>
                  </div>
                </div>
              ))
            )}
          </>
        );

      case "suggestions":
        return (
          <>
            <h2 className="Title">{t("suggestedFriends")}</h2>
            <div className="friendship-search">
              <input
                type="text"
                placeholder={t("searchByName")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {loadingSuggestions ? (
              <p>{t("loadingSuggestions")}</p>
            ) : filteredSuggestions.length === 0 ? (
              <p>{t("noSuggestionsFound")}</p>
            ) : (
              filteredSuggestions.map(f => (
                <div className="user" key={f.id}>
                  <div className="friend-info">
  <img className="imgreq" src={f.image} alt={f.userName} />
  <span className="user-name">{f.userName}</span>
</div>
                  <div className="friend-actions">
                    {!f.added ? (
                      <>
                        <button className="button" onClick={() => toggleRequest(f.id, f.added)}>
                  {t("add")}
                </button>
                <button className="Removebutton" onClick={() => removeSuggestion(f.id)}>
                  {t("remove")}
                </button>
                      </>
                    ) : (
                      <button className="button" onClick={() => toggleRequest(f.id, f.added)}>
                {t("requested")}
              </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page">
      <div className="friendship-bar">
      <button
          className={`friendship-link ${currentTab === "suggestions" ? "active" : ""}`}
          onClick={() => setCurrentTab("suggestions")}
        >
          {t("Suggestions")}
        </button>
        <button
          className={`friendship-link ${currentTab === "friends" ? "active" : ""}`}
          onClick={() => setCurrentTab("friends")}
        >
          {t("Friends")}
        </button>
        <button
          className={`friendship-link ${currentTab === "requests" ? "active" : ""}`}
          onClick={() => setCurrentTab("requests")}
        >
          {t("Requests")}
        </button>
        
      </div>

      <div className="content-area">{renderContent()}</div>
    </div>
  );
}

export default FriendshipPage;

// import { useState, useEffect } from "react";
// import { useTranslation } from "react-i18next";
// import API from "../../services/api";
// import PROFILE from "./PROFILE.jpeg";
// import "./FriendShip.css";

// function FriendshipPage() {
//   const { t, i18n } = useTranslation();
//   const [currentTab, setCurrentTab] = useState("friends");

//   const [friends, setFriends] = useState([]);
//   const [friendRequests, setFriendRequests] = useState([]);
//   const [suggestions, setSuggestions] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");

//   const [loadingFriends, setLoadingFriends] = useState(true);
//   const [loadingRequests, setLoadingRequests] = useState(true);
//   const [loadingSuggestions, setLoadingSuggestions] = useState(true);

//   // تغيير اتجاه الصفحة حسب اللغة
//   useEffect(() => {
//     document.body.dir = i18n.language === "ar" ? "rtl" : "ltr";
//   }, [i18n.language]);

//   // ================= Fetch Data =================
//   const fetchFriends = async () => {
//     try {
//       setLoadingFriends(true);
//       const res = await API.get("/friendships/friends");
//       const mapped = res.data.map(f => ({
//         id: f.friendId,
//         friendId: f.friendId,
//         userName: f.fullName || "No Name",
//         image: f.profilePicture || PROFILE,
      
//       }));
//       setFriends(mapped);
//     } catch (err) {
//       console.error("Friends API Error:", err);
//     } finally {
//       setLoadingFriends(false);
//     }
//   };

//   const fetchRequests = async () => {
//     try {
//       setLoadingRequests(true);
//       const res = await API.get("/friendships/requests");
//       const mapped = res.data.map(f => ({
//         id: f.id,
//         senderId: f.senderId,
//         userName: f.fullName || "No Name",
//         image: f.profilePicture || PROFILE
//       }));
//       setFriendRequests(mapped);
//     } catch (err) {
//       console.error("Requests API Error:", err);
//     } finally {
//       setLoadingRequests(false);
//     }
//   };

//   const fetchSuggestions = async () => {
//     try {
//       setLoadingSuggestions(true);
//       const res = await API.get("/friendships/suggestions");
//       const mapped = res.data.map(f => ({
//         id: f.graduate_id,
//         userName: f.fullName || "No Name",
//         image: f["profile-picture-url"] || PROFILE,
//         added: false
//       }));
//       setSuggestions(mapped);
//     } catch (err) {
//       console.error("Suggestions API Error:", err);
//     } finally {
//       setLoadingSuggestions(false);
//     }
//   };

//   useEffect(() => {
//     fetchFriends();
//     fetchRequests();
//     fetchSuggestions();
//   }, []);

//   // ================= Actions =================
//   const confirmFriend = async (senderId) => {
//     if (!senderId) return alert("Sender ID is missing!");
//     try {
//       await API.put(`/friendships/confirm/${senderId}`);
//       fetchFriends();
//       fetchRequests();
    
//     } catch (err) {
//       console.error("Confirm Friend API Error:", err);
    
//       alert(err.response?.data?.message || err.message);
//     }
//   };

//   const removeFriend = async (friendId, userName) => {
//     if (!friendId) return alert("Friend ID is missing!");
//     try {
//       await API.delete(`/friendships/friends/${friendId}`);
//       setFriends(prev => prev.filter(f => f.friendId !== friendId));
//       alert(t("removedSuccessfully", { name: userName }));
//       fetchSuggestions();
//     } catch (err) {
//       console.error("Delete Friend API Error:", err);
//       alert(err.response?.data?.message || err.message);
//     }
//   };

//   const removeRequest = async (senderId) => {
//     if (!senderId) return alert("Sender ID is missing!");
//     try {
//       await API.put(`/friendships/hide/${senderId}`);
//       fetchRequests();
//       fetchSuggestions();
//     } catch (err) {
//       console.error("Remove Request API Error:", err);
//       alert(err.response?.data?.message || err.message);
//     }
//   };

//   const toggleRequest = async (receiverId, added) => {
//     if (!receiverId) return alert("Receiver ID is missing!");
//     try {
//       if (!added) {
//         await API.post(`/friendships/request/${receiverId}`);
//       } else {
//         await API.delete(`/friendships/cancel/${receiverId}`);
//       }
//       setSuggestions(prev =>
//         prev.map(f => (f.id === receiverId ? { ...f, added: !added } : f))
//       );
//     } catch (err) {
//       console.error("Add/Cancel Request API Error:", err);
//       alert(err.response?.data?.message || err.message);
//     }
//   };

//   const removeSuggestion = (id) => {
//     setSuggestions(prev => prev.filter(f => f.id !== id));
//   };

//   const filteredSuggestions = suggestions.filter(f =>
//     f.userName.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // ================= Render =================
//   const renderContent = () => {
//     switch (currentTab) {
//       case "friends":
//         if (loadingFriends) return <p>{t("loadingFriends")}</p>;
//         if (friends.length === 0) return <p>{t("noFriends")}</p>;
//         return friends.map(f => (
//           <div className="user" key={f.id}>
//             <img className="img" src={f.image} alt={f.userName} />
//             {f.userName}
//             <p className="data">{f.faculty}</p>
//             <button className="button">{t("chat")}</button>
//             <button
//               className="Removebutton"
//               onClick={() => removeFriend(f.friendId, f.userName)}
//             >
//               {t("remove")}
//             </button>
//           </div>
//         ));

//       case "requests":
//         if (loadingRequests) return <p>{t("loadingRequests")}</p>;
//         if (friendRequests.length === 0) return <p>{t("noRequests")}</p>;
//         return friendRequests.map(f => (
//           <div className="user" key={f.id}>
//             <img className="img" src={f.image} alt={f.userName} />
//             {f.userName}
//             <p className="data"></p>
            // <button className="button" onClick={() => confirmFriend(f.senderId)}>
            //   {t("confirm")}
            // </button>
            // <button className="Removebutton" onClick={() => removeRequest(f.senderId)}>
            //   {t("remove")}
            // </button>
//           </div>
//         ));

//       case "suggestions":
//         if (loadingSuggestions) return <p>{t("loadingSuggestions")}</p>;
//         if (filteredSuggestions.length === 0) return <p>{t("noSuggestionsFound")}</p>;
//         return filteredSuggestions.map(f => (
//           <div className="user" key={f.id}>
//             <img className="img" src={f.image} alt={f.userName} />
//             {f.userName}
//             <p className="data"></p>
//             {!f.added ? (
//               <div>
//                 <button className="button" onClick={() => toggleRequest(f.id, f.added)}>
//                   {t("add")}
//                 </button>
//                 <button className="Removebutton" onClick={() => removeSuggestion(f.id)}>
//                   {t("remove")}
//                 </button>
//               </div>
//             ) : (
//               <button className="button" onClick={() => toggleRequest(f.id, f.added)}>
//                 {t("requested")}
//               </button>
//             )}
//           </div>
//         ));

//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="page">
//       <div className="friendship-bar">
//         <button
//           className={`friendship-link ${currentTab === "friends" ? "active" : ""}`}
//           onClick={() => setCurrentTab("friends")}
//         >
//           {t("Friends")}
//         </button>
//         <button
//           className={`friendship-link ${currentTab === "requests" ? "active" : ""}`}
//           onClick={() => setCurrentTab("requests")}
//         >
//           {t("Requests")}
//         </button>
//         <button
//           className={`friendship-link ${currentTab === "suggestions" ? "active" : ""}`}
//           onClick={() => setCurrentTab("suggestions")}
//         >
//           {t("Suggestions")}
//         </button>
//       </div>
//       <div className="content-area">{renderContent()}</div>
//     </div>
//   );
// }

// export default FriendshipPage;
