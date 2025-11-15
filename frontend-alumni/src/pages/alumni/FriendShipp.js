import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import PROFILE from "./PROFILE.jpeg";
import "./FriendShip.css";
import { MessageCircle } from "lucide-react";
import ChatBox from "./ChatBox";

function FriendshipPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("friends");

  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [chatId, setChatId] = useState(null);

  // ضبط اتجاه النص حسب اللغة
// ضبط اتجاه الصفحة حسب اللغة (أفضل حل)
useEffect(() => {
  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", i18n.language);
}, [i18n.language]);


  // -------------------- Fetch Functions --------------------
  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      const res = await API.get("/friendships/friends");
      const mapped = res.data.map((f) => ({
        id: f.graduate_id, // صححت الـ id عشان profile API
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
      const mapped = res.data.map((f) => ({
        id: f.senderId, // صححت الـ id عشان profile API
        senderId: f.senderId,
        userName: f.fullName || "No Name",
        image: f.profilePicture || PROFILE,
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

      const removed = JSON.parse(
        localStorage.getItem("removedSuggestions") || "{}"
      );
      const now = Date.now();

      // فلترة الأشخاص اللي لسه ما كملوش 24 ساعة
      const filtered = res.data.filter((f) => {
        const removedAt = removed[f.graduate_id];
        if (!removedAt) return true; // مش محذوف أصلاً
        const diffHours = (now - removedAt) / (1000 * 60 * 60); // فرق الساعات
        return diffHours >= 24; // لو مرّ عليه 24 ساعة أو أكثر → يظهر تاني
      });

      const mapped = filtered.map((f) => ({
        id: f.graduate_id,
        userName: f.fullName || "No Name",
        image: f["profile-picture-url"] || PROFILE,
        added: false,
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

  // -------------------- Friend Actions --------------------
  const confirmFriend = async (senderId) => {
    try {
      await API.put(`/friendships/confirm/${senderId}`);
      fetchFriends();
      fetchRequests();
    } catch (err) {
      console.error("Confirm Friend API Error:", err);
    }
  };

  const unfriendFriend = async (friendId) => {
    try {
      await API.delete(`/friendships/friends/${friendId}`);
      setFriends((prev) => prev.filter((f) => f.friendId !== friendId));
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
      setSuggestions((prev) =>
        prev.map((f) => (f.id === receiverId ? { ...f, added: !added } : f))
      );
    } catch (err) {
      console.error("Add/Cancel Request API Error:", err);
    }
  };

  const removeSuggestion = (id) => {
    // حفظ وقت الحذف في localStorage
    const removed = JSON.parse(
      localStorage.getItem("removedSuggestions") || "{}"
    );
    removed[id] = Date.now(); // وقت الحذف الحالي بالميللي ثانية
    localStorage.setItem("removedSuggestions", JSON.stringify(removed));

    // إزالة من الواجهة
    setSuggestions((prev) => prev.filter((f) => f.id !== id));
  };

  // -------------------- Chat Functions --------------------
  const openChat = async (friend) => {
    console.log("Friend Object Received:", friend);

    // تأكدي من وجود ID صالح
    const receiverId = friend.friendId || friend.id;
    console.log("Receiver ID to send:", receiverId);

    if (!receiverId) {
      console.error("❌ Friend ID is missing. Cannot open chat.", friend);
      return;
    }

    try {
      // قبل الإرسال، تأكدي من الـ token
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No auth token found in localStorage");
        return;
      }

      // عمل POST للـ conversation
      const res = await API.post("/chat/conversation", {
        otherUserId: receiverId,
      });

      console.log("✅ Open Chat Response:", res.data);

      if (res.data && res.data.data && res.data.data.chat_id) {
        setChatId(res.data.data.chat_id);
        setActiveChatFriend(friend);
      } else {
        console.warn("⚠️ Response received but chat_id missing", res.data);
      }
    } catch (err) {
      console.error(
        "❌ Open Chat Error:",
        err.response?.data || err.message || err
      );
    }
  };

  const closeChat = () => {
    setActiveChatFriend(null);
    setChatId(null);
  };

  const filteredSuggestions = suggestions.filter((f) =>
    f.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // -------------------- Render Tabs --------------------
  const renderContent = () => {
    switch (currentTab) {
      case "friends":
        return (
          <>
<h2
  className="Title"
  style={{ textAlign: i18n.language === "ar" ? "right" : "left" }}
>
  {t("friendsList")}{" "}
  <span className="req-count">({friends.length})</span>
</h2>

            {loadingFriends ? (
              <p>{t("loadingFriends")}</p>
            ) : friends.length === 0 ? (
              <p>{t("noFriends")}</p>
            ) : (
              friends.map((f, index) => (
                <div className="user" key={`${f.id}-${index}`}>
                  <div className="friend-info">
                    <img className="imgreq" src={f.image} alt={f.userName} />
                    <span
                      className="user-name"
                      onClick={() => {
                        const profileId = f.friendId || f.senderId || f.id;
                        if(profileId) navigate(`/helwan-alumni-portal/graduate/dashboard/friends/${profileId}`);
                        else console.warn("No valid id for navigation", f);
                      }}
                      
                      style={{ cursor: "pointer", color: "#007bff" }}
                    >
                      {f.userName}
                    </span>
                  </div>
                  <div className="friend-actions">
                    <button
                      className="chat-icon-btn"
                      onClick={() => openChat(f)}
                    >
                      <MessageCircle size={18} />
                    </button>
                    <button
  className="Removebutton"
  onClick={() => unfriendFriend(f.friendId)}
>
  {t("unfriend")}
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
<h2
  className="Title"
  style={{ textAlign: i18n.language === "ar" ? "right" : "left" }}
>
  {t("friendRequests")}{" "}
  <span className="req-count">({friendRequests.length})</span>
</h2>
            {loadingRequests ? (
              <p>{t("loadingRequests")}</p>
            ) : friendRequests.length === 0 ? (
              <p>{t("noRequests")}</p>
            ) : (
              friendRequests.map((f, index) => (
                <div className="user" key={`${f.id}-${index}`}>
                  <div className="friend-info">
                    <img className="imgreq" src={f.image} alt={f.userName} />
                    <span
                      className="user-name"
                      onClick={() => {
                        const profileId = f.friendId || f.senderId || f.id;
                        if(profileId) navigate(`/helwan-alumni-portal/graduate/dashboard/friends/${profileId}`);
                        else console.warn("No valid id for navigation", f);
                      }}
                      
                      style={{ cursor: "pointer", color: "#007bff" }}
                    >
                      {f.userName}
                    </span>
                  </div>
                  <div className="friend-actions">
                    <button
                      className="button"
                      onClick={() => confirmFriend(f.senderId)}
                    >
                      {t("confirm")}
                    </button>
                    <button
                      className="button"
                      onClick={() => removeRequest(f.senderId)}
                      style={{ backgroundColor: "red", color: "white" }}
                    >
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
           <h2
  className="Title"
  style={{ textAlign: i18n.language === "ar" ? "right" : "left" }}
>
  {t("suggestedFriends")}
</h2>

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
              filteredSuggestions.map((f, index) => (
                <div className="user" key={`${f.id}-${index}`}>
                  <div className="friend-info">
                    <img className="imgreq" src={f.image} alt={f.userName} />
                    <span
                      className="user-name"
                      onClick={() => {
                        const profileId = f.friendId || f.senderId || f.id;
                        if(profileId) navigate(`/helwan-alumni-portal/graduate/dashboard/friends/${profileId}`);
                        else console.warn("No valid id for navigation", f);
                      }}
                      
                      style={{ cursor: "pointer", color: "#007bff" }}
                    >
                      {f.userName}
                    </span>
                  </div>
                  <div className="friend-actions">
                    {!f.added ? (
                      <>
                        <button
                          className="button"
                          onClick={() => toggleRequest(f.id, f.added)}
                        >
                          {t("add")}
                        </button>
                        <button
                          className="button"
                          onClick={() => removeSuggestion(f.id)}
                          style={{ backgroundColor: "red", color: "white" }}
                        >
                          {t("remove")}
                        </button>
                      </>
                    ) : (
                      <button
                        className="button"
                        onClick={() => toggleRequest(f.id, f.added)}
                      >
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
          className={`friendship-link ${
            currentTab === "suggestions" ? "active" : ""
          }`}
          onClick={() => setCurrentTab("suggestions")}
        >
          {t("Suggestions")}
        </button>
        <button
          className={`friendship-link ${
            currentTab === "friends" ? "active" : ""
          }`}
          onClick={() => setCurrentTab("friends")}
        >
          {t("Friends")}
        </button>
        <button
          className={`friendship-link ${
            currentTab === "requests" ? "active" : ""
          }`}
          onClick={() => setCurrentTab("requests")}
        >
          {t("Requests")}
        </button>
      </div>

      <div className="content-area">{renderContent()}</div>

      {activeChatFriend && (
        <ChatBox
          chatId={chatId}
          activeChatFriend={activeChatFriend}
          onClose={closeChat}
        />
      )}
    </div>
  );
}

export default FriendshipPage;
