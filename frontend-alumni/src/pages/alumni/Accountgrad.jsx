//new code
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../../services/api";
import PROFILE from "./PROFILE.jpeg";
import "./Accountgrad.css";
import PostCard from "../../components/PostCard"; 
import { useTranslation } from "react-i18next";

function Accountgrad() {
  const { t } = useTranslation();
  const { userId } = useParams();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/graduates/profile/${userId}`);
        console.log("Profile API response:", res.data);

        if (res.data.status === "success" && res.data.data) {
          const data = res.data.data;
          setFormData({
            ...data,
            skills: Array.isArray(data.skills)
              ? data.skills
              : JSON.parse(data.skills || "[]"),
          });
        } else {
          console.log("Profile not found for userId:", userId);
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
    <div className="profile-page">
      <div className="profile-card">
        <img
          src={formData.profilePicture || PROFILE}
          alt={formData.fullName || "User"}
          className="profile-img"
        />
        <h2>{formData.fullName || t("noName")}</h2>
        <p>
          <strong>{t("faculty")}:</strong> {formData.faculty || t("noFaculty")}
        </p>
        <p>
          <strong>{t("graduationYear")}:</strong>{" "}
          {formData.graduationYear || t("noYear")}
        </p>
        <p>
          <strong>{t("bio")}:</strong> {formData.bio || t("noBio")}
        </p>

        {formData.showCV && (
          <p>
            <strong>{t("cv")}:</strong>{" "}
            {formData.CV ? (
              <a href={formData.CV} download>
                {t("downloadCv")}
              </a>
            ) : (
              t("noCv")
            )}
          </p>
        )}

        <p>
          <strong>{t("skills")}:</strong>{" "}
          {formData.skills.length > 0
            ? formData.skills.join(", ")
            : t("noSkills")}
        </p>

        <p>
          <strong>{t("currentJob")}:</strong>{" "}
          {formData.currentJob || t("noJob")}
        </p>

        {formData.showPhone && (
          <p>
            <strong>{t("phoneNumber")}:</strong>{" "}
            {formData.phoneNumber || t("noPhone")}
          </p>
        )}
      </div>

      <div className="profile-posts">
        <h3>{t("posts")}</h3>
        {formData.posts && formData.posts.length > 0 ? (
          formData.posts.map((post) => (
            <PostCard
              key={post.post_id}
              postId={post.post_id}
              content={post.content}
              category={post.category}
              createdAt={post["created-at"]}
              author={post.author}
              likesCount={post.likes_count}
              commentsCount={post.comments_count}
              images={post.images}
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

////konoz's code
// import { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import API from "../../services/api";
// import PROFILE from "./PROFILE.jpeg";
// import "./Accountgrad.css";
// import PostCard from "../../components/PostCard"; 
// import { useTranslation } from "react-i18next";

// function Accountgrad() {
//   const { t } = useTranslation();
//   const { userId } = useParams();
//   const [formData, setFormData] = useState(null);
//   const [userPosts, setUserPosts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchProfile = async () => {
//       setLoading(true);
//       try {
//         const res = await API.get(`/graduates/profile/${userId}`);
//         console.log("Profile API response:", res.data);

//         if (res.data.status === "success" && res.data.data) {
//           const data = res.data.data;
//           setFormData({
//             ...data,
//             skills: Array.isArray(data.skills)
//               ? data.skills
//               : JSON.parse(data.skills || "[]")
//           });
//         } else {
//           console.log("Profile not found for userId:", userId);
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

//     const fetchPosts = async () => {
//       try {
//         const res = await API.get(`/graduates/${userId}/posts`);
//         setUserPosts(res.data.data || []);
//       } catch (err) {
//         console.error("Posts API Error for userId", userId, err);
//         setUserPosts([]);
//       }
//     };

//     fetchProfile();
//     fetchPosts();
//   }, [userId]);

//   if (loading) return <p>{t("loading")}...</p>;
//   if (!formData) return <p>{t("noProfile")}</p>;

//   return (
//     <div className="profile-page">
//       <div className="profile-card">
//         <img
//           src={formData.profilePicture || PROFILE}
//           alt={formData.fullName || "User"}
//           className="profile-img"
//         />
//         <h2>{formData.fullName || t("noName")}</h2>
//         <p>
//           <strong>{t("faculty")}:</strong> {formData.faculty || t("noFaculty")}
//         </p>
//         <p>
//           <strong>{t("graduationYear")}:</strong> {formData.graduationYear || t("noYear")}
//         </p>
//         <p>
//           <strong>{t("bio")}:</strong> {formData.bio || t("noBio")}
//         </p>

//         {formData.showCV && (
//           <p>
//             <strong>{t("cv")}:</strong>{" "}
//             {formData.CV ? (
//               <a href={formData.CV} download>{t("downloadCv")}</a>
//             ) : (
//               t("noCv")
//             )}
//           </p>
//         )}

//         <p>
//           <strong>{t("skills")}:</strong>{" "}
//           {formData.skills.length > 0 ? formData.skills.join(", ") : t("noSkills")}
//         </p>

//         <p>
//           <strong>{t("currentJob")}:</strong> {formData.currentJob || t("noJob")}
//         </p>

//         {formData.showPhone && (
//           <p>
//             <strong>{t("phoneNumber")}:</strong> {formData.phoneNumber || t("noPhone")}
//           </p>
//         )}
//       </div>

//       <div className="profile-posts">
//         <h3>{t("posts")}</h3>
//         {userPosts.length === 0 ? (
//           <p>{t("noPostsFound")}</p>
//         ) : (
//           userPosts.map(post => (
//             <PostCard
//               key={post.id}
//               postId={post.id}
//               content={post.content}
//               image={post.image}
//             />
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default Accountgrad;


