import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../../services/api";
import PROFILE from "./PROFILE.jpeg";
import "./Accountgrad.css";
import PostCard from "../../components/PostCard"; 
import { useTranslation } from "react-i18next";
import AdminPostsImg from './AdminPosts.jpeg';


function Accountgrad() {
  const { t } = useTranslation();
  const { userId } = useParams();
  // console.log("userId from useParams:", userId);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      // console.log("userId from useParams:", userId);

      try {
        const res = await API.get(`/graduates/profile/${userId}`);
        // console.log("Profile API response:", res.data);

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
        c.author?.["full-name"]?.includes("Alumni Portal") ||
        c.author?.["user-type"] === "admin" ||
        c.author?.["user-type"] === "staff";

      return {
        ...c,
        author: {
          ...c.author,
          name: isUni
            ? "Alumni Portal - Helwan University"
            : c.author?.["full-name"] || "Unknown",
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
          // console.log("Profile not found for userId:", userId);
          setFormData(null);
        }
      } catch (err) {
        console.error(
          "Profile API Error for userId",
          userId,
          err.response?.status || err
        );
        setFormData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

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
          <div className="profiile-name">
            <h2>{formData.fullName || t("noName")}</h2>
            <p className="profiile-title">{formData.currentJob || t("noJob")}</p>
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
        {/* <h3></h3> */}
        {formData.posts && formData.posts.length > 0 ? (
          formData.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}  
            />
          ))
        ) : (
          <p>{t("noPostsFound")}</p>
        )}
      </div>
    </div>
  );
}

export default Accountgrad;

