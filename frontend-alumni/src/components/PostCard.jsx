import React, { useState } from "react";
import { Heart, MessageCircle, Share2, Trash2, MoreVertical, Edit, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import API from "../services/api";
import PROFILE from "../pages/alumni/PROFILE.jpeg";
import '../pages/alumni/AlumniAdminPosts.css';

const PostCard = ({ post, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");

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
        avatar: PROFILE,
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
  hour12: true
})}
{" "}
        - {post.category}
        {post['group-id'] ? ' - In Group' : ''}
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
      <img key={index} src={imgUrl} alt={`post-${index}`} className="uni-post-preview" />
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
                  <strong>{c.userName || c.author?.['full-name'] || t('unknown')}</strong>
                  <p>{c.content}</p>
                </div>
              </div>
            
              <div className="comment-date">
              {new Date(c['created-at']).toLocaleString([], {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
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
    </div>
  );
};

export default PostCard;


// import React, { useState } from "react";
// import { Heart, MessageCircle, Share2, Trash2, MoreVertical, Edit, Send } from "lucide-react";
// import { useTranslation } from "react-i18next";
// import API from "../services/api";
// import PROFILE from "../pages/alumni/PROFILE.jpeg";
// import '../pages/alumni/AlumniAdminPosts.css';

// const PostCard = ({ post, onEdit, onDelete }) => {
//   const { t } = useTranslation();
//   const [openDropdown, setOpenDropdown] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editContent, setEditContent] = useState(post.content);
//   const [editLink, setEditLink] = useState(post.link || "");
//   const [liked, setLiked] = useState(post.liked || false);
//   const [likesCount, setLikesCount] = useState(post.likes || 0);
//   const [showComments, setShowComments] = useState(false);
//   const [comments, setComments] = useState(post.comments || []);
//   const [newComment, setNewComment] = useState("");

//   const token = localStorage.getItem("token");

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

//       const newCommentObj = {
//         userName: res.data.comment?.author?.["full-name"] || "You",
//         content: res.data.comment.content,
//         avatar: PROFILE,
//         date: new Date().toLocaleString(),
//       };

//       setComments((prev) => [...prev, newCommentObj]);
//       setNewComment("");
//     } catch (err) {
//       console.error("Error adding comment:", err.response?.data || err);
//     }
//   };

//   return (
//     <div className={`uni-post-card ${post["is-hidden"] ? "is-hidden" : ""}`}>
//       <div className="uni-post-header">
//         <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
//           <img src={post.author?.photo || PROFILE} className="profile-pic" alt="profile" />
//           <strong>{post.author?.name || t("unknown")}</strong>
//           <div className="uni-post-date">
//             {new Date(post.date).toLocaleString()} - {post.category}
//           </div>
//         </div>

//         <div className="post-actions-dropdown">
//           <button className="more-btn" onClick={() => setOpenDropdown(!openDropdown)}>
//             <MoreVertical size={20} />
//           </button>

//           {openDropdown && (
//             <div className="dropdown-menu">
//               <button onClick={() => { setIsEditing(true); setOpenDropdown(false); }}>
//                 <Edit size={16} /> {t("edit")}
//               </button>
//               <button onClick={() => { onDelete(); setOpenDropdown(false); }}>
//                 <Trash2 size={16} /> {t("delete")}
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="uni-post-body">
//         {isEditing ? (
//           <>
//             <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
//             <input
//               value={editLink}
//               onChange={(e) => setEditLink(e.target.value)}
//               placeholder={t("editLink")}
//             />
//             <button
//               onClick={() => {
//                 onEdit(editContent, editLink);
//                 setIsEditing(false);
//               }}
//             >
//               {t("save")}
//             </button>
//             <button onClick={() => setIsEditing(false)}>{t("cancel")}</button>
//           </>
//         ) : (
//           <>
//             <p>{post.content}</p>
//             {post.images && post.images.length > 0 && (
//               <div className="uni-post-images">
//                 {post.images.map((imgUrl, index) => (
//                   <img key={index} src={imgUrl} alt={`post-${index}`} className="uni-post-preview" />
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       <div className="uni-post-actions">
//         <button className={liked ? "uni-liked" : ""} onClick={handleLikeToggle}>
//           <Heart size={16} color={liked ? "red" : "black"} fill={liked ? "red" : "none"} />
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
//               <div className="comment-left">
//                 <img
//                   src={c.avatar || c.author?.image || PROFILE}
//                   alt="avatar"
//                   className="comment-avatar"
//                 />
//                 <div className="comment-text">
//                   <strong>{c.userName || c.author?.['full-name'] || t('unknown')}</strong>
//                   <p>{c.content}</p>
//                 </div>
//               </div>
            
//               <div className="comment-date">
//               {new Date(c['created-at']).toLocaleString([], {
//   year: "numeric",
//   month: "2-digit",
//   day: "2-digit",
//   hour: "2-digit",
//   minute: "2-digit"
// })}

//               </div>
//             </div>
            
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
//     </div>
//   );
// };

// export default PostCard;

