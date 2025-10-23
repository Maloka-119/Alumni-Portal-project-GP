import React, { useState } from "react";
import { Heart, MessageCircle, Share2, Trash2, MoreVertical, Edit, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import API from "../services/api";
import PROFILE from "../pages/alumni/PROFILE.jpeg";
import "../pages/alumni/AlumniAdminPosts.css";
import ReactDOM from "react-dom";
import Swal from "sweetalert2";


const PostCard = ({ post, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const [zoomedImage, setZoomedImage] = useState(null); // الصورة المكبرة

  const token = localStorage.getItem("token");

  const handleLikeToggle = async () => {
    if (!token) return;
    try {
      if (liked) {
        await API.delete(`/posts/${post.id}/like`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await API.post(`/posts/${post.id}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error toggling like:", err.response?.data || err);
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
  
      const newCommentObj = {
        userName: res.data.comment?.author?.["full-name"] || "You",
        content: res.data.comment.content,
        avatar: res.data.comment?.author?.image || PROFILE, // ⬅️ التصحيح هنا
        date: new Date().toLocaleString(),
      };
  
      setComments((prev) => [...prev, newCommentObj]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err.response?.data || err);
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
              <MoreVertical size={20} />
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
              <img
                key={index}
                src={imgUrl}
                alt={`post-${index}`}
                className="uni-post-preview"
                onClick={() => setZoomedImage(imgUrl)} // فتح الصورة
              />
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
        <button>
          <Share2 size={16} /> {post.shares}
        </button>
      </div>

      {showComments && (
        <div className="uni-comments-section">
          <div className="comments-list">
            {comments.map((c, i) => (
              <div key={i} className="comment-item">
                <div className="comment-left">
                  <img
                    src={c.avatar || c.author?.image || PROFILE}
                    alt="avatar"
                    className="comment-avatar"
                  />
                  <div className="comment-text">
                    <strong>{c.userName || c.author?.["full-name"] || t("unknown")}</strong>
                    <p>{c.content}</p>
                  </div>
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



//alert style
// import React, { useState } from "react";
// import { Heart, MessageCircle, Share2, Trash2, MoreVertical, Edit, Send } from "lucide-react";
// import { useTranslation } from "react-i18next";
// import API from "../services/api";
// import PROFILE from "../pages/alumni/PROFILE.jpeg";
// import "../pages/alumni/AlumniAdminPosts.css";
// import ReactDOM from "react-dom";
// import Swal from "sweetalert2"; // ✅ استيراد SweetAlert2

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

//   // ✅ Toast ثابت لأي إشعار بسيط
//   const Toast = Swal.mixin({
//     toast: true,
//     position: "top-end",
//     showConfirmButton: false,
//     timer: 1500,
//     timerProgressBar: true,
//   });

//   // ❤️ Like toggle
//   const handleLikeToggle = async () => {
//     if (!token) return;
//     try {
//       if (liked) {
//         await API.delete(`/posts/${post.id}/like`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setLiked(false);
//         setLikesCount((prev) => Math.max(0, prev - 1));
//         Toast.fire({
//           icon: "error",
//           title: t("Like removed") || "تم إزالة الإعجاب 💔",
//         });
//       } else {
//         await API.post(`/posts/${post.id}/like`, {}, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setLiked(true);
//         setLikesCount((prev) => prev + 1);
//         Toast.fire({
//           icon: "success",
//           title: t("Liked!") || "أعجبك المنشور ❤️",
//         });
//       }
//     } catch (err) {
//       Swal.fire({
//         icon: "error",
//         title: t("Error") || "حدث خطأ",
//         text: t("Could not update like") || "تعذر تحديث الإعجاب.",
//       });
//     }
//   };

//   // 💬 إضافة تعليق
//   const handleAddComment = async () => {
//     if (!token || !newComment.trim()) return;
//     try {
//       const res = await API.post(
//         `/posts/${post.id}/comments`,
//         { content: newComment },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       const newCommentObj = {
//         userName: res.data.comment?.author?.["full-name"] || "You",
//         content: res.data.comment.content,
//         avatar: res.data.comment?.author?.image || PROFILE,
//         date: new Date().toLocaleString(),
//       };

//       setComments((prev) => [...prev, newCommentObj]);
//       setNewComment("");

//       Toast.fire({
//         icon: "success",
//         title: t("Comment added!") || "تم إضافة التعليق ✅",
//       });
//     } catch (err) {
//       Swal.fire({
//         icon: "error",
//         title: t("Error") || "حدث خطأ 😢",
//         text: t("Could not add comment") || "لم يتمكن النظام من إضافة التعليق.",
//       });
//     }
//   };

//   // 🗑️ حذف المنشور (بتأكيد)
//   const handleDelete = () => {
//     Swal.fire({
//       title: t("Are you sure?") || "هل أنت متأكد؟",
//       text: t("This post will be permanently deleted.") || "سيتم حذف هذا المنشور نهائيًا.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#d33",
//       cancelButtonColor: "#3085d6",
//       confirmButtonText: t("Yes, delete it!") || "نعم، احذف",
//       cancelButtonText: t("Cancel") || "إلغاء",
//     }).then((result) => {
//       if (result.isConfirmed) {
//         onDelete();
//         Swal.fire({
//           icon: "success",
//           title: t("Deleted!") || "تم الحذف ✅",
//           text: t("The post has been deleted.") || "تم حذف المنشور بنجاح.",
//           timer: 2000,
//           showConfirmButton: false,
//         });
//       }
//     });
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
//               <MoreVertical size={20} />
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
//                       handleDelete();
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
//               <img
//                 key={index}
//                 src={imgUrl}
//                 alt={`post-${index}`}
//                 className="uni-post-preview"
//                 onClick={() => setZoomedImage(imgUrl)}
//               />
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
//         <button>
//           <Share2 size={16} /> {post.shares}
//         </button>
//       </div>

//       {showComments && (
//         <div className="uni-comments-section">
//           <div className="comments-list">
//             {comments.map((c, i) => (
//               <div key={i} className="comment-item">
//                 <div className="comment-left">
//                   <img
//                     src={c.avatar || c.author?.image || PROFILE}
//                     alt="avatar"
//                     className="comment-avatar"
//                   />
//                   <div className="comment-text">
//                     <strong>{c.userName || c.author?.["full-name"] || t("unknown")}</strong>
//                     <p>{c.content}</p>
//                   </div>
//                 </div>

//                 <div className="comment-date">
//                   {new Date(c["created-at"]).toLocaleString([], {
//                     year: "numeric",
//                     month: "2-digit",
//                     day: "2-digit",
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })}
//                 </div>
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

//       {zoomedImage &&
//         ReactDOM.createPortal(
//           <div className="image-viewer-overlay">
//             <div className="image-viewer-box">
//               <button className="image-viewer-close" onClick={() => setZoomedImage(null)}>✕</button>
//               <img src={zoomedImage} alt="Zoomed" className="image-viewer-full" />
//             </div>
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// };

// export default PostCard;
