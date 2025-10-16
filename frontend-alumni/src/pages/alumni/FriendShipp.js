import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import API from "../../services/api";
import "./FriendShip.css";
import PROFILE from "./PROFILE.jpeg";

function FriendshipPage() {
  const { i18n, t } = useTranslation();
  const [currentTab, setCurrentTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // حالات التحميل
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // تغيير اتجاه الصفحة حسب اللغة
  useEffect(() => {
    document.body.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // جلب البيانات
  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchSuggestions();
  }, []);

  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      const response = await API.get("/friends");
      setFriends(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await API.get("/friend-requests");
      setFriendRequests(response.data);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const response = await API.get("/friend-suggestions");
      setSuggestions(response.data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addFriend = async (userId) => {
    try {
      await API.post(`/friends/${userId}`);
      fetchSuggestions();
      fetchRequests();
    } catch (error) {
      console.error("Add friend error:", error);
    }
  };

  const confirmFriend = async (userId) => {
    try {
      await API.put(`/friend-requests/${userId}`);
      fetchFriends();
      fetchRequests();
    } catch (error) {
      console.error("Confirm friend error:", error);
    }
  };

  const removeFriend = async (friendId, friendName) => {
    try {
      await API.delete(`/friends/${friendId}`);
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      alert(t("removedSuccessfully", { name: friendName }));
    } catch (error) {
      console.error("Delete Friend API Error:", error);
    }
  };

  // فلترة الاقتراحات
  const filteredSuggestions = suggestions.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="friendship-page">
      {/* Tabs */}
      <div className="tabs">
        <button
          className={currentTab === "friends" ? "active" : ""}
          onClick={() => setCurrentTab("friends")}
        >
          {t("Friends")}
        </button>
        <button
          className={currentTab === "requests" ? "active" : ""}
          onClick={() => setCurrentTab("requests")}
        >
          {t("Requests")}
        </button>
        <button
          className={currentTab === "suggestions" ? "active" : ""}
          onClick={() => setCurrentTab("suggestions")}
        >
          {t("Suggestions")}
        </button>
      </div>

      {/* الأصدقاء */}
      {currentTab === "friends" && (
        <div className="tab-content">
          {loadingFriends ? (
            <p>{t("loadingFriends")}</p>
          ) : friends.length === 0 ? (
            <p>{t("noFriends")}</p>
          ) : (
            friends.map((friend) => (
              <div key={friend._id} className="friend-card">
                <img
                  src={friend.profilePicture || PROFILE}
                  alt={friend.name}
                  className="friend-img"
                />
                <div className="friend-info">
                  <h4>{friend.name}</h4>
                  {friend.lastMessageTime && (
                    <p>
                      {t("chat")}:{" "}
                      {formatDistanceToNow(new Date(friend.lastMessageTime), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeFriend(friend._id, friend.name)}
                >
                  {t("remove")}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* طلبات الصداقة */}
      {currentTab === "requests" && (
        <div className="tab-content">
          {loadingRequests ? (
            <p>{t("loadingRequests")}</p>
          ) : friendRequests.length === 0 ? (
            <p>{t("noRequests")}</p>
          ) : (
            friendRequests.map((req) => (
              <div key={req._id} className="friend-card">
                <img
                  src={req.profilePicture || PROFILE}
                  alt={req.name}
                  className="friend-img"
                />
                <div className="friend-info">
                  <h4>{req.name}</h4>
                </div>
                <button
                  className="confirm-btn"
                  onClick={() => confirmFriend(req._id)}
                >
                  {t("confirm")}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* الاقتراحات */}
      {currentTab === "suggestions" && (
        <div className="tab-content">
          <input
            type="text"
            placeholder={t("searchByName")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          {loadingSuggestions ? (
            <p>{t("loadingSuggestions")}</p>
          ) : filteredSuggestions.length === 0 ? (
            <p>{t("noSuggestionsFound")}</p>
          ) : (
            filteredSuggestions.map((user) => (
              <div key={user._id} className="friend-card">
                <img
                  src={user.profilePicture || PROFILE}
                  alt={user.name}
                  className="friend-img"
                />
                <div className="friend-info">
                  <h4>{user.name}</h4>
                </div>
                <button className="add-btn" onClick={() => addFriend(user._id)}>
                  {t("add")}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default FriendshipPage;
