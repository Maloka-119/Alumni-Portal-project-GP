// import { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import API from "../../services/api";
// import PROFILE from "./PROFILE.jpeg";
// import "./Accountgrad.css";
// import PostCard from "../../components/PostCard"; 
// import { useTranslation } from "react-i18next";
// import AdminPostsImg from './AdminPosts.jpeg';


// function Accountgrad() {
//   const { t } = useTranslation();
//   const { userId } = useParams();
//   // console.log("userId from useParams:", userId);
//   const [formData, setFormData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchProfile = async () => {
//       setLoading(true);
//       // console.log("userId from useParams:", userId);

//       try {
//         const res = await API.get(`/graduates/profile/${userId}`);
//         // console.log("Profile API response:", res.data);

//         if (res.data.status === "success" && res.data.data) {
//           const data = res.data.data;

//           const skills = Array.isArray(data.skills) ? data.skills : JSON.parse(data.skills || "[]");

//           const formattedPosts = (data.posts || []).map((p) => ({
//             ...p,
//             id: p.post_id,
//             content: p.content,
//             category: p.category,
//             date: p["created-at"],
//             author: {
//               name:
//                 p.author?.["user-type"] === "admin" || p.author?.["user-type"] === "staff"
//                   ? "Alumni Portal - Helwan University"
//                   : p.author?.["full-name"] || "Unknown",
//               photo:
//                 p.author?.["user-type"] === "admin" || p.author?.["user-type"] === "staff"
//                   ? AdminPostsImg
//                   : p.author?.image || PROFILE,
//             },
          
//             likes: Array.isArray(p.likes) ? p.likes : [],
//             likesCount: Number(p.likes_count) || 0,
//             likedByCurrentUser: !!p.like_id,
          
//             comments: Array.isArray(p.comments)
//   ? p.comments.map((c) => {
//       const isUni =
//         c.author?.["full-name"]?.includes("Alumni Portal - Helwan University",) ||
//         c.author?.["user-type"] === "admin" ||
//         c.author?.["user-type"] === "staff";

//       return {
//         ...c,
//         author: {
//           ...c.author,
//           name: isUni
//             ? "Alumni Portal - Helwan University"
//             : c.author?.["full-name"] || "Unknown",
//           image: isUni ? AdminPostsImg : c.author?.image || PROFILE,
//         },
//       };
//     })
//   : [],

          
//             images: Array.isArray(p.images) ? p.images : [],
//             shares: Number(p.shares) || 0,
//           }));
          
        

//           setFormData({
//             ...data,
//             skills,
//             posts: formattedPosts,
//           });
//         } else {
//           // console.log("Profile not found for userId:", userId);
//           setFormData(null);
//         }
//       } catch (err) {
//         console.error(
//           "Profile API Error for userId",
//           userId,
//           err.response?.status || err
//         );
//         setFormData(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, [userId]);

//   if (loading) return <p>{t("loading")}...</p>;
//   if (!formData) return <p>{t("noProfile")}</p>;

//   return (
//     <div className="profiile-page">
//       <div className="profiile-card">
//         <div className="profile-header">
//           <img
//             src={formData.profilePicture || PROFILE}
//             alt={formData.fullName || "User"}
//             className="profiile-img"
//           />
//           <div className="profiile-name">
//             <h2>{formData.fullName || t("noName")}</h2>
//             <p className="profiile-title">{formData.currentJob || t("noJob")}</p>
//           </div>
//         </div>

//         <div className="profiile-details">
//           <p><strong>{t("faculty")}:</strong> {formData.faculty || t("noFaculty")}</p>
//           <p><strong>{t("graduationYear")}:</strong> {formData.graduationYear || t("noYear")}</p>
//           <p><strong>{t("currentJob")}:</strong> {formData.currentJob || t("noJob")}</p>
//           {formData.showPhone && (
//             <p><strong>{t("phoneNumber")}:</strong> {formData.phoneNumber || t("noPhone")}</p>
//           )}
//           <p><strong>{t("skills")}:</strong> {formData.skills.length > 0 ? formData.skills.join(", ") : t("noSkills")}</p>
//           {formData.showCV && (
//             <p>
//               <strong>{t("cv")}:</strong> {formData.CV ? <a href={formData.CV} download>{t("downloadCv")}</a> : t("noCv")}
//             </p>
//           )}
//         </div>
//       </div>

//       <div className="profile-posts">
//         {/* <h3></h3> */}
//         {formData.posts && formData.posts.length > 0 ? (
//           formData.posts.map((post) => (
//             <PostCard
//               key={post.id}
//               post={post}  
//             />
//           ))
//         ) : (
//           <p>{t("noPostsFound")}</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default Accountgrad;

import ChatBox from "./ChatBox";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../../services/api";
import PROFILE from "./PROFILE.jpeg";
import "./Accountgrad.css";
import PostCard from "../../components/PostCard"; 
import { useTranslation } from "react-i18next";
import AdminPostsImg from './AdminPosts.jpeg';
import { FiUserPlus, FiUserCheck, FiUserX, FiMessageCircle, FiUserMinus } from "react-icons/fi";

function Accountgrad() {
  const { t } = useTranslation();
  const { userId } = useParams();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChatFriend, setActiveChatFriend] = useState(null);
const [chatId, setChatId] = useState(null);


  // --- Fetch Profile ---
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/graduates/profile/${userId}`);
      if (res.data.status === "success" && res.data.data) {
        const data = res.data.data;
        const skills = Array.isArray(data.skills) ? data.skills : JSON.parse(data.skills || "[]");

        const formattedPosts = (data.posts || []).map((p) => ({
          ...p,
          id: p.post_id,
          content: p.content,
          category: p.category,
          date: p["created-at"],
          author: {
            name:
              p.author?.["user-type"] === "admin" || p.author?.["user-type"] === "staff"
                ? "Alumni Portal - Helwan University"
                : p.author?.["full-name"] || "Unknown",
            photo:
              p.author?.["user-type"] === "admin" || p.author?.["user-type"] === "staff"
                ? AdminPostsImg
                : p.author?.image || PROFILE,
          },
          likes: Array.isArray(p.likes) ? p.likes : [],
          likesCount: Number(p.likes_count) || 0,
          likedByCurrentUser: !!p.like_id,
          comments: Array.isArray(p.comments)
            ? p.comments.map((c) => {
                const isUni =
                  c.author?.["full-name"]?.includes("Alumni Portal - Helwan University") ||
                  c.author?.["user-type"] === "admin" ||
                  c.author?.["user-type"] === "staff";

                return {
                  ...c,
                  author: {
                    ...c.author,
                    name: isUni ? "Alumni Portal - Helwan University" : c.author?.["full-name"] || "Unknown",
                    image: isUni ? AdminPostsImg : c.author?.image || PROFILE,
                  },
                };
              })
            : [],
          images: Array.isArray(p.images) ? p.images : [],
          shares: Number(p.shares) || 0,
        }));

        setFormData({
          ...data,
          skills,
          posts: formattedPosts,
        });
      } else {
        setFormData(null);
      }
    } catch (err) {
      console.error("Profile API Error for userId", userId, err.response?.status || err);
      setFormData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  // --- Friendship Functions ---
  const confirmFriend = async () => {
    try {
      await API.put(`/friendships/confirm/${userId}`);
      fetchProfile();
    } catch (err) {
      console.error("Confirm Friend API Error:", err);
    }
  };

  const unfriendFriend = async () => {
    try {
      await API.delete(`/friendships/friends/${userId}`);
      fetchProfile();
    } catch (err) {
      console.error("Delete Friend API Error:", err);
    }
  };

  const removeRequest = async () => {
    try {
      await API.put(`/friendships/hide/${userId}`);
      fetchProfile();
    } catch (err) {
      console.error("Remove Request API Error:", err);
    }
  };

  const toggleRequest = async (added) => {
    try {
      if (!added) {
        await API.post(`/friendships/request/${userId}`);
      } else {
        await API.delete(`/friendships/cancel/${userId}`);
      }
      fetchProfile();
    } catch (err) {
      console.error("Add/Cancel Request API Error:", err);
    }
  };

  const openChat = async (friend) => {
    const receiverId = friend.friendId || friend.id;
    if (!receiverId) return console.error("Friend ID missing");
  
    try {
      const token = localStorage.getItem("token");
      if (!token) return console.error("No auth token");
  
      const res = await API.post("/chat/conversation", {
        otherUserId: receiverId,
      });
  
      if (res.data?.data?.chat_id) {
        setChatId(res.data.data.chat_id);
        setActiveChatFriend(friend);
      } else {
        console.warn("Chat ID missing in response");
      }
    } catch (err) {
      console.error("Open Chat Error:", err);
    }
  };
  
  const closeChat = () => {
    setActiveChatFriend(null);
    setChatId(null);
  };
  

  if (loading) return <p>{t("loading")}...</p>;
  if (!formData) return <p>{t("noProfile")}</p>;

  return (
    <div className="profiile-page">
      <div className="profiile-card">
        <div className="profile-header">
          <img
            src={formData.profilePicture || PROFILE}
            alt={formData.fullName || "User"}
            className="profiile-img"
          />
          <div className="profiile-name" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div>
              <h2>{formData.fullName || t("noName")}</h2>
              <p className="profiile-title">{formData.currentJob || t("noJob")}</p>
            </div>

            {!formData.owner && (
  <div className="friendship-buttons" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    {formData.friendshipStatus === "no_relation" && (
      <button onClick={() => toggleRequest(false)} className="friend-btn" title={t("addFriend")}>
        <FiUserPlus style={{ marginRight: "4px" }} /> {t("addFriend")}
        
      </button>
    )}
    {formData.friendshipStatus === "i_sent_request" && (
      <button onClick={() => toggleRequest(true)} className="friend-btn" title={t("cancelRequest")}>
        <FiUserX style={{ marginRight: "4px" }} /> {t("cancelRequest")}
        
      </button>
    )}
    {formData.friendshipStatus === "he_sent_request" && (
      <div style={{ display: "flex", gap: "2px" }}>
        <button onClick={confirmFriend} className="acceptre-btn" title={t("confirm")}>
          <FiUserCheck style={{ marginRight: "4px" }} /> {t("confirm")}
          
        </button>
        <button onClick={removeRequest} className="rejectre-btn"title={t("remove")}>
          <FiUserX style={{ marginRight: "4px" }} /> {t("remove")}
          
        </button>
      </div>
    )}
    {formData.friendshipStatus === "friends" && (
  <div style={{ display: "flex", gap: "8px" }}>
     <button
  onClick={() =>
    openChat({
      id: userId,
      name: formData.fullName,
      photo: formData.profilePicture || PROFILE
    })
  }
  className="friend-btn"
>
  <FiMessageCircle style={{ marginRight: "4px" }} />
</button>

    <button onClick={unfriendFriend} className="rejectre-btn" title={t("unfriend")}>
      <FiUserMinus style={{ marginRight: "4px" }} /> {t("unfriend")}
      
    </button>
  </div>
)}
  </div>
)}

          </div>
        </div>

        <div className="profiile-details">
          <p><strong>{t("faculty")}:</strong> {formData.faculty || t("noFaculty")}</p>
          <p><strong>{t("graduationYear")}:</strong> {formData.graduationYear || t("noYear")}</p>
          <p><strong>{t("currentJob")}:</strong> {formData.currentJob || t("noJob")}</p>
          {formData.showPhone && (
            <p><strong>{t("phoneNumber")}:</strong> {formData.phoneNumber || t("noPhone")}</p>
          )}
          <p><strong>{t("skills")}:</strong> {formData.skills.length > 0 ? formData.skills.join(", ") : t("noSkills")}</p>
          {formData.showCV && (
            <p>
              <strong>{t("cv")}:</strong> {formData.CV ? <a href={formData.CV} download>{t("downloadCv")}</a> : t("noCv")}
            </p>
          )}
        </div>
      </div>

      <div className="profile-posts">
        {formData.posts && formData.posts.length > 0 ? (
          formData.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <p>{t("noPostsFound")}</p>
        )}
      </div>
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

export default Accountgrad;

