// import React, { useState } from "react";
// import { Heart, MessageCircle, Share2, Trash2, Edit, Send } from "lucide-react";
// import { useTranslation } from "react-i18next";
// import API from "../services/api";
// import PROFILE from "../pages/alumni/PROFILE.jpeg";
// import "../pages/alumni/AlumniAdminPosts.css";
// import Swal from "sweetalert2";
// import ReactDOM from "react-dom";
// import AdminPostsImg from '../pages/alumni/AdminPosts.jpeg';
// import Staffprof from '../pages/alumni/Staffprof.jpg'

// const PostCard = ({ post, onEdit, onDelete }) => {
//   const { t } = useTranslation();
//   const [openDropdown, setOpenDropdown] = useState(false);
//   const [liked, setLiked] = useState(post.liked || false);
//   const [likesCount, setLikesCount] = useState(post.likes || 0);
//   const [showComments, setShowComments] = useState(false);
//   const [comments, setComments] = useState(post.comments || []);
//   const [newComment, setNewComment] = useState("");
//   const [zoomedImage, setZoomedImage] = useState(null); 

//   const token = localStorage.getItem("token");
//   const currentUser = JSON.parse(localStorage.getItem("user")); 

//   const handleLikeToggle = async () => {
//     if (!token) return;
//     try {
//       if (liked) {
//         await API.delete(`/posts/${post.id}/like`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setLiked(false);
//         setLikesCount((prev) => Math.max(0, prev - 1));
//       } else {
//         await API.post(`/posts/${post.id}/like`, {}, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setLiked(true);
//         setLikesCount((prev) => prev + 1);
//       }
//     } catch (err) {
//       console.error("Error toggling like:", err.response?.data || err);
//     }
//   };

//   const handleAddComment = async () => {
//     if (!token || !newComment.trim()) return;

//     try {
//       const res = await API.post(
//         `/posts/${post.id}/comments`,
//         { content: newComment },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       setComments((prev) => [...prev, res.data.comment]);
//       setNewComment("");
//     } catch (err) {
//       console.error("Error adding comment:", err.response?.data || err);
//     }
//   };

//   const handleDeleteComment = async (commentId) => {
//     try {
//       await API.delete(`/posts/comments/${commentId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setComments((prev) => prev.filter((c) => c.comment_id !== commentId));

//       Swal.fire({
//         icon: "success",
//         title: t("Comment deleted successfully"),
//         timer: 1500,
//         showConfirmButton: false,
//       });
//     } catch (err) {
//       console.error("Error deleting comment:", err.response?.data || err);
//     }
//   };

//   const handleEditComment = async (commentId, oldContent) => {
//     const { value: newContent } = await Swal.fire({
//       input: "textarea",
//       inputLabel: t("Edit your comment"),
//       inputValue: oldContent,
//       showCancelButton: true,
//       confirmButtonText: t("Save"),
//     });

//     if (!newContent) return;

//     try {
//       const res = await API.put(
//         `/posts/comments/${commentId}`,
//         { content: newContent },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       setComments((prev) =>
//         prev.map((c) =>
//           c.comment_id === commentId ? { ...c, content: res.data.comment.content } : c
//         )
//       );

//       Swal.fire({
//         icon: "success",
//         title: t("Comment updated successfully"),
//         timer: 1500,
//         showConfirmButton: false,
//       });
//     } catch (err) {
//       console.error("Error editing comment:", err.response?.data || err);
//     }
//   };

//   return (
//     <div className={`uni-post-card ${post["is-hidden"] ? "is-hidden" : ""}`}>
//       <div className="uni-post-header">
//         <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
//           <img src={post.author?.photo || PROFILE} className="profile-pic" alt="profile" />
//           <div className="post-author-info">
//             <strong>{post.author?.name || t("unknown")}</strong>
//             <div className="uni-post-date">
//               {new Date(post.date).toLocaleString("en-US", {
//                 year: "numeric",
//                 month: "short",
//                 day: "2-digit",
//                 hour: "2-digit",
//                 minute: "2-digit",
//                 hour12: true,
//               })}{" "}
//               - {post.category}
//               {post["group-id"] ? " - In Group" : ""}
//             </div>
//           </div>
//         </div>

//         {(onEdit || onDelete) && (
//           <div className="post-actions-dropdown">
//             <button className="more-btn" onClick={() => setOpenDropdown(!openDropdown)}>
//               •••
//             </button>

//             {openDropdown && (
//               <div className="dropdown-menu">
//                 {onEdit && (
//                   <button
//                     onClick={() => {
//                       onEdit(post);
//                       setOpenDropdown(false);
//                     }}
//                   >
//                     <Edit size={16} /> {t("edit")}
//                   </button>
//                 )}
//                 {onDelete && (
//                   <button
//                     onClick={() => {
//                       onDelete();
//                       setOpenDropdown(false);
//                     }}
//                   >
//                     <Trash2 size={16} /> {t("delete")}
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       <div className="uni-post-body">
//         <p>{post.content}</p>
//         {post.images && post.images.length > 0 && (
//           <div className="uni-post-images">
//             {post.images.map((imgUrl, index) => (
//               <img key={index} src={imgUrl} alt={`post-${index}`} className="uni-post-preview" onClick={() => setZoomedImage(imgUrl)} />
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="uni-post-actions">
//         <button className={liked ? "uni-liked" : ""} onClick={handleLikeToggle}>
//           <Heart size={16} color={liked ? "red" : "grey"} fill={liked ? "red" : "none"} />
//           {likesCount}
//         </button>
//         <button onClick={() => setShowComments(!showComments)}>
//           <MessageCircle size={16} /> {comments.length}
//         </button>
//         {/* <button>
//           <Share2 size={16} /> {post.shares}
//         </button> */}
//       </div>

//       {showComments && (
//         <div className="uni-comments-section">
//           <div className="comments-list">
//             {comments.map((c) => (
//               <div key={c.comment_id} className="comment-item">
//                 <div className="comment-left">
//                 <img
//   src={
//     c.author?.type === "admin" || c.author?.type === "staff"
//       ? AdminPostsImg
//       : c.author?.image || PROFILE
//   }
//   alt="avatar"
//   className="comment-avatar"
// />




//                   <div className="comment-text">
//                     <strong>{c.author?.["full-name"]}</strong>
//                     <p>{c.content}</p>
//                   </div>
//                   <div className="comment-date">
//                   {new Date(c["created-at"]).toLocaleString([], {
//                     year: "numeric",
//                     month: "2-digit",
//                     day: "2-digit",
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })}
//                 </div>
//                 </div>

//                 {currentUser && c.author?.id === currentUser.id && (
//                   <div className="comment-actions">
//                     <button onClick={() => handleEditComment(c.comment_id, c.content)}>
//                       <Edit size={14} />
//                     </button>
//                     <button onClick={() => handleDeleteComment(c.comment_id)}>
//                       <Trash2 size={14} />
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>

//           <div className="comment-input">
//             <input
//               placeholder={t("writeComment")}
//               value={newComment}
//               onChange={(e) => setNewComment(e.target.value)}
//             />
//             <button onClick={handleAddComment}>
//               <Send size={16} />
//             </button>
//           </div>
//         </div>
//       )}
      
// {zoomedImage &&
//   ReactDOM.createPortal(
//     <div className="image-viewer-overlay">
//       <div className="image-viewer-box">
//         <button className="image-viewer-close" onClick={() => setZoomedImage(null)}>✕</button>
//         <img src={zoomedImage} alt="Zoomed" className="image-viewer-full" />
//       </div>
//     </div>,
//     document.body
//   )
// }
//     </div>
//   );
// };

// export default PostCard;

import React, { useState } from "react";
import { Heart, MessageCircle, Share2, Trash2, Edit, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import API from "../services/api";
import PROFILE from "../pages/alumni/PROFILE.jpeg";
import "../pages/alumni/AlumniAdminPosts.css";
import Swal from "sweetalert2";
import ReactDOM from "react-dom";
import AdminPostsImg from '../pages/alumni/AdminPosts.jpeg';
import Staffprof from '../pages/alumni/Staffprof.jpg'

const PostCard = ({ post, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [liked, setLiked] = useState(post.isLikedByYou || false);
const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const [zoomedImage, setZoomedImage] = useState(null); 

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user")); 

  const handleLikeToggle = async () => {
    if (!token) return;
  
    // حدث الحالة محليًا فورًا
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => prev + (newLiked ? 1 : -1));
  
    try {
      if (newLiked) {
        await API.post(`/posts/${post.id}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await API.delete(`/posts/${post.id}/like`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error("Error toggling like:", err.response?.data || err);
  
      // لو حصل خطأ، ارجع للحالة السابقة
      setLiked(liked);
      setLikesCount(prev => prev + (liked ? 1 : -1));
    }
  };
  
  

  const handleAddComment = async () => {
    if (!token || !newComment.trim()) return;

    try {
      const res = await API.post(
        `/posts/${post.id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments((prev) => [...prev, res.data.comment]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err.response?.data || err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/posts/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments((prev) => prev.filter((c) => c.comment_id !== commentId));

      Swal.fire({
        icon: "success",
        title: t("Comment deleted successfully"),
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error deleting comment:", err.response?.data || err);
    }
  };

  const handleEditComment = async (commentId, oldContent) => {
    const { value: newContent } = await Swal.fire({
      input: "textarea",
      inputLabel: t("Edit your comment"),
      inputValue: oldContent,
      showCancelButton: true,
      confirmButtonText: t("Save"),
    });

    if (!newContent) return;

    try {
      const res = await API.put(
        `/posts/comments/${commentId}`,
        { content: newContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments((prev) =>
        prev.map((c) =>
          c.comment_id === commentId ? { ...c, content: res.data.comment.content } : c
        )
      );

      Swal.fire({
        icon: "success",
        title: t("Comment updated successfully"),
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error editing comment:", err.response?.data || err);
    }
  };

  return (
    <div className={`uni-post-card ${post["is-hidden"] ? "is-hidden" : ""}`}>
      <div className="uni-post-header">
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <img src={post.author?.photo || PROFILE} className="profile-pic" alt="profile" />
          <div className="post-author-info">
            <strong>{post.author?.name || t("unknown")}</strong>
            <div className="uni-post-date">
              {new Date(post.date).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}{" "}
              - {post.category}
              {post["group-id"] ? " - In Group" : ""}
            </div>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="post-actions-dropdown">
            <button className="more-btn" onClick={() => setOpenDropdown(!openDropdown)}>
              •••
            </button>

            {openDropdown && (
              <div className="dropdown-menu">
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(post);
                      setOpenDropdown(false);
                    }}
                  >
                    <Edit size={16} /> {t("edit")}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete();
                      setOpenDropdown(false);
                    }}
                  >
                    <Trash2 size={16} /> {t("delete")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="uni-post-body">
        <p>{post.content}</p>
        {post.images && post.images.length > 0 && (
          <div className="uni-post-images">
            {post.images.map((imgUrl, index) => (
              <img key={index} src={imgUrl} alt={`post-${index}`} className="uni-post-preview" onClick={() => setZoomedImage(imgUrl)} />
            ))}
          </div>
        )}
      </div>

      <div className="uni-post-actions">
        <button className={liked ? "uni-liked" : ""} onClick={handleLikeToggle}>
          <Heart size={16} color={liked ? "red" : "grey"} fill={liked ? "red" : "none"} />
          {likesCount}
        </button>
        <button onClick={() => setShowComments(!showComments)}>
          <MessageCircle size={16} /> {comments.length}
        </button>
        {/* <button>
          <Share2 size={16} /> {post.shares}
        </button> */}
      </div>

      {showComments && (
        <div className="uni-comments-section">
          <div className="comments-list">
            {comments.map((c) => (
              <div key={c.comment_id} className="comment-item">
                <div className="comment-left">
                <img
  src={
    c.author?.type === "admin" || c.author?.type === "staff"
      ? AdminPostsImg
      : c.author?.image || PROFILE
  }
  alt="avatar"
  className="comment-avatar"
/>




                  <div className="comment-text">
                    <strong>{c.author?.["full-name"]}</strong>
                    <p>{c.content}</p>
                  </div>
                  <div className="comment-date">
                  {new Date(c["created-at"]).toLocaleString([], {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                </div>

                {currentUser && c.author?.id === currentUser.id && (
                  <div className="comment-actions">
                    <button onClick={() => handleEditComment(c.comment_id, c.content)}>
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteComment(c.comment_id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="comment-input">
            <input
              placeholder={t("writeComment")}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button onClick={handleAddComment}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      
{zoomedImage &&
  ReactDOM.createPortal(
    <div className="image-viewer-overlay">
      <div className="image-viewer-box">
        <button className="image-viewer-close" onClick={() => setZoomedImage(null)}>✕</button>
        <img src={zoomedImage} alt="Zoomed" className="image-viewer-full" />
      </div>
    </div>,
    document.body
  )
}
    </div>
  );
};

export default PostCard;

