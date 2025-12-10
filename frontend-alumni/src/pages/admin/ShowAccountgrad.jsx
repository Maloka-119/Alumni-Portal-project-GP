
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../../services/api";
import PROFILE from "../alumni/PROFILE.jpeg";
import "../alumni/Accountgrad.css";
import PostCard from "../../components/PostCard"; 
import { useTranslation } from "react-i18next";
import AdminPostsImg from '../alumni/AdminPosts.jpeg';
import { FiUserPlus, FiUserCheck, FiUserX, FiMessageCircle, FiUserMinus } from "react-icons/fi";

function ShowAccountgrad() {
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
    //   console.log("Full API Response:", res);
      if (res.data.status === "success" && res.data.data) {
        const data = res.data.data;
        console.log("Profile Data:", data);
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
    fetchProfile(userId);
  }, [userId]);

  if (loading) return <p>{t("loading")}...</p>;
  if (!formData) return <p>{t("noProfile")}</p>;

  return (
    <div className="profiile-page">
      <div className="profiile-card" style={{backgroundColor:"#f7f8fc"}}>
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

    </div>
  );
}

export default ShowAccountgrad;

