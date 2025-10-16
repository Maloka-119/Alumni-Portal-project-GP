import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import API from "../../services/api";
import './FriendShip.css';

function FriendshipPage() {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState("friends");

  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ======== Fetch Data ========
  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/friendships/friends");

      const mapped = res.data.map(f => ({
        id: f.id,
        // اختر الـ friendId حسب response backend
        friendId: f.friend?.id || f.friend_id || f.id,
        userName: f.friend?.fullName || f.sender?.fullName || f.friend?.bio || "No Name",
        image: f.friend?.["profile-picture-url"] || f.sender?.["profile-picture-url"] || "/default-avatar.png"
      }));

      setFriends(mapped);
    } catch (err) {
      console.error("Friends API Error:", err);
      setError("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await API.get("/friendships/requests");

      const mapped = res.data.map(f => ({
        id: f.id,
        senderId: f.sender_id, // مهم لل confirm/hide
        userName: f.sender?.fullName || f.sender?.bio || "No Name",
        image: f.sender?.["profile-picture-url"] || "/default-avatar.png"
      }));

      setFriendRequests(mapped);
    } catch (err) {
      console.error("Requests API Error:", err);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await API.get("/friendships/suggestions");

      const mapped = res.data.map(f => ({
        id: f.graduate_id,
        userName: f.bio || "No Name",
        image: f["profile-picture-url"] || "/default-avatar.png",
        added: false,
        time: Date.now()
      }));

      setSuggestions(mapped);
    } catch (err) {
      console.error("Suggestions API Error:", err);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchSuggestions();
  }, []);

  // ======== Actions ========
  const confirmFriend = async (senderId) => {
    try {
      if (!senderId) return alert("Sender ID is missing!");
      await API.put(`/friendships/confirm/${senderId}`);
      fetchFriends();
      fetchRequests();
    } catch (err) {
      console.error("Confirm Friend API Error:", err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const removeFriend = async (friendId, userName) => {
    try {
      if (!friendId) return alert("Friend ID is missing!");
      await API.delete(`/friendships/friends/${friendId}`);
  
      // حدّث state مباشرة
      setFriends(prev => prev.filter(f => f.friendId !== friendId));
  
      alert(`${userName} removed successfully.`);
    } catch (err) {
      console.error("Delete Friend API Error:", err);
      alert(err.response?.data?.message || err.message);
    }
  };
  

  const removeRequest = async (senderId) => {
    try {
      if (!senderId) return alert("Sender ID is missing!");
      await API.put(`/friendships/hide/${senderId}`);
      fetchRequests();
    } catch (err) {
      console.error("Hide Request API Error:", err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const toggleRequest = async (receiverId, added) => {
    try {
      if (!receiverId) return alert("Receiver ID is missing!");
      if (!added) {
        await API.post(`/friendships/request/${receiverId}`);
      } else {
        await API.delete(`/friendships/cancel/${receiverId}`);
      }
      setSuggestions(prev => prev.map(f => f.id === receiverId ? { ...f, added: !added } : f));
    } catch (err) {
      console.error("Add/Cancel Request API Error:", err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const removeSuggestion = (id) => {
    setSuggestions(prev => prev.filter(f => f.id !== id));
  };

  // ======== Render ========
  const renderContent = () => {
    if (loading) return <p>Loading...</p>;
    if (error) return <p className="error">{error}</p>;

    switch (currentTab) {
      case "friends":
        return (
          <div>
            <p className="Title">{t("Friends")} ({friends.length})</p>
            {friends.length === 0 ? <p>{t("noFriends")}</p> :
              friends.map(f => (
                <div className="user" key={f.id}>
                  <img className="img" src={f.image} alt={f.userName} />
                  <p className="data">{f.userName}</p>
                  <button className="button">🗨️ {t("chat")}</button>
                  <button className="Removebutton" onClick={() => removeFriend(f.friendId, f.userName)}>
                    {t("remove")}
                  </button>
                </div>
              ))
            }
          </div>
        );

      case "requests":
        return (
          <div>
            <p className="Title">{t("Requests")} ({friendRequests.length})</p>
            {friendRequests.map(f => (
              <div className="user" key={f.id}>
                <img className="img" src={f.image} alt={f.userName} />
                <p className="data">{f.userName}</p>
                <button className="button" onClick={() => confirmFriend(f.senderId)}>
                  {t("confirm")}
                </button>
                <button className="Removebutton" onClick={() => removeRequest(f.senderId)}>
                  {t("remove")}
                </button>
              </div>
            ))}
          </div>
        );

      case "suggestions":
        return (
          <div>
            <p className="Title">{t("Suggestions")}</p>
            {suggestions.map(f => (
              <div className="user" key={f.id}>
                <img className="img" src={f.image} alt={f.userName} />
                <p className="data">
                  {f.userName}<br />
                  <span className="time">
                    {formatDistanceToNow(new Date(f.time), { addSuffix: true })}
                  </span>
                </p>
                {!f.added ? (
                  <div>
                    <button className="button" onClick={() => toggleRequest(f.id, f.added)}>
                      {t("add")}
                    </button>
                    <button className="Removebutton" onClick={() => removeSuggestion(f.id)}>
                      {t("remove")}
                    </button>
                  </div>
                ) : (
                  <button className="button" onClick={() => toggleRequest(f.id, f.added)}>
                    {t("requested")}
                  </button>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page">
      <div className="friendship-bar">
        <button
          className={`friendship-link ${currentTab === "friends" ? "active" : ""}`}
          onClick={() => setCurrentTab("friends")}
        >
          Friends
        </button>
        <button
          className={`friendship-link ${currentTab === "requests" ? "active" : ""}`}
          onClick={() => setCurrentTab("requests")}
        >
          Friend Requests
        </button>
        <button
          className={`friendship-link ${currentTab === "suggestions" ? "active" : ""}`}
          onClick={() => setCurrentTab("suggestions")}
        >
          Suggestions
        </button>
      </div>
      <div className="content-area">{renderContent()}</div>
    </div>
  );
}

export default FriendshipPage;
