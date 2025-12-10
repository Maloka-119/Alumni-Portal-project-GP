
// import React, { useState, useEffect } from 'react';
// import './AdminPostsPage.css';
// import { Heart, MessageCircle, Share2, EyeOff, Eye, Send, CheckCircle, Circle,Edit , Trash2 } from 'lucide-react';
// import { useTranslation } from "react-i18next";
// import API from '../../services/api';
// import PROFILE from './PROFILE.jpeg';
// import Swal from "sweetalert2";
// import { getPermission } from "../../components/usePermission";
// import Staffprof from "../alumni/Staffprof.jpg";
// import AdminPostsImg from "../alumni/AdminPosts.jpeg";

// const UsersPostsPage = ({ currentUser }) => {
// const { t, i18n } = useTranslation();

//   const [typeFilter, setTypeFilter] = useState('All');
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [filter, setFilter] = useState('All');
//   const [commentInputs, setCommentInputs] = useState({});
//   const [selectedImage, setSelectedImage] = useState({ postId: null, url: null });
//   const postPerm = currentUser?.userType === "admin"
//   ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
//   : getPermission("Graduates posts management", currentUser) || { canView: false, canAdd: false, canEdit: false, canDelete: false };


//   useEffect(() => {
//     if (postPerm.canView) fetchPosts();
//     else setLoading(false);
//   }, [currentUser]);

//   const formatPosts = (data) => {
//     return (data || []).map(post => {
//       const formattedComments = (post.comments || []).map(comment => {
//         const isAdminOrStaff = ["admin", "staff"].includes(comment.author?.["user-type"]);
//         return {
//           id: comment.comment_id,
//           userName: isAdminOrStaff ? "Alumni Portal – Helwan University" : comment.author?.["full-name"] || "Unknown User",
//           content: comment.content,
//           avatar: isAdminOrStaff ? AdminPostsImg : comment.author?.image || PROFILE,
//           date: comment["created-at"],
//           author: comment.author,
//         };
//       });
  
//       return {
//         ...post,
//         id: post.post_id,
//         likes: post.likesCount || 0,
//         liked: post.isLikedByYou || false,
//         comments: formattedComments,
//         images: post.images || [],
//         showComments: false,
//         author: {
//           ...post.author,
//           name: post.author?.name || post.author?.["full-name"],
//           photo: post.author?.photo || post.author?.image || PROFILE
//         },
//         isHidden: post["is-hidden"] === true,
//         inLanding: post["in-landing"] === true
//       };
//     });
//   };
  
  

//   const fetchPosts = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await API.get('/posts');
//       // console.log("Fetch posts response:", res);
//       if (res.data.status === "success") {
//         setPosts(formatPosts(res.data.data));
//       } else {
//         setPosts(formatPosts(res.data.data || []));
//       }
//     } catch (err) {
//       console.error('Error fetching posts', err);
//       setError(t("fetchPostsFailed"));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLandingToggle = async (postId, currentValue) => {
//     if (!postPerm.canAdd) return;
//     try {
//       await API.patch(`/posts/${postId}/landing`, { inLanding: !currentValue });
//       setPosts(prev => prev.map(p => p.id === postId ? { ...p, inLanding: !currentValue } : p));
//       Swal.fire({ icon: "success", title: t("Updated"), text: `Post ${!currentValue ? "added to" : "removed from"} landing`, toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
//     } catch (err) {
//       console.error("Error updating landing status", err);
//       Swal.fire({ icon: "error", title: t("Error"), text: t("Failed to update landing status"), toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
//     }
//   };

//   const handleHide = async (id) => {
//     if (!postPerm.canEdit) return;
//     try {
//       const response = await API.put(`/posts/${id}/hide`);
//       //  console.log("Hide post response:", response);
//       if (response.data.status === "success") {
//         await fetchPosts();
//         Swal.fire({ icon: "success", title: t("Post hidden"), toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
//       }
//     } catch (err) {
//       console.error("Error hiding post", err);
//       Swal.fire({ icon: "error", title: t("Error"), text: t("Failed to hide the post."), toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
//     }
//   };

//   const handleUnhide = async (id) => {
//     if (!postPerm.canEdit) return;
//     try {
//       const response = await API.put(`/posts/${id}/unhide`);
//       if (response.data.status === "success") {
//         await fetchPosts();
//         Swal.fire({ icon: "success", title: t("Post unhidden"), toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
//       }
//     } catch (err) {
//       console.error("Error unhiding post", err);
//       Swal.fire({ icon: "error", title: t("Error"), text: t("Failed to unhide the post."), toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
//     }
//   };

//   const handleLike = async (postId) => {
//     const postIndex = posts.findIndex(p => p.id === postId);
//     if (postIndex === -1) return;
  
//     const post = posts[postIndex];
//     const updatedPosts = [...posts];
  
//     if (post.liked) {
//       await API.delete(`/posts/${postId}/like`);
//       updatedPosts[postIndex] = { ...post, liked: false, likes: Math.max(0, post.likes - 1) };
//     } else {
//       await API.post(`/posts/${postId}/like`);
//       updatedPosts[postIndex] = { ...post, liked: true, likes: post.likes + 1 };
//     }
  
//     setPosts(updatedPosts);
//   };
  

//   const toggleComments = (postId) => {
//     if (!postPerm.canView) return;
//     setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
//   };

//   const handleCommentChange = (postId, value) => {
//     setCommentInputs({ ...commentInputs, [postId]: value });
//   };

//   const handleCommentSubmit = async (postId) => {
//     if (!postPerm.canAdd) return;
//     const comment = commentInputs[postId];
//     if (!comment?.trim()) return;
  
//     try {
//       const res = await API.post(`/posts/${postId}/comments`, { content: comment });
  
//       if (res.data.comment) {
//         const newComment = {
//           id: res.data.comment.comment_id,
//           userName: "Alumni Portal – Helwan University",
//           content: res.data.comment.content,
//           avatar: AdminPostsImg,
//           date: new Date().toLocaleString(),
//           author: {
//             ...res.data.comment.author,
//             "user-type": "admin" 
//           },
//         };
  
//         setPosts(prev =>
//           prev.map(post =>
//             post.id === postId
//               ? { ...post, comments: [...post.comments, newComment], showComments: true }
//               : post
//           )
//         );
//       }
//       setCommentInputs(prev => ({ ...prev, [postId]: "" }));
//     } catch (err) {
//       console.error("Error submitting comment:", err.response?.data || err);
//       Swal.fire({
//         icon: "error",
//         title: t("Error"),
//         text: t("Failed to add comment"),
//         toast: true,
//         position: "top-end",
//         timer: 1800,
//         showConfirmButton: false
//       });
//     }
//   };
  
  

//   if (loading) return <p>{t("loadingPosts")}</p>;
//   if (!postPerm.canView) return <p style={{ color: 'red' }}>{t("noPermission")}</p>;
//   if (error) return <p style={{ color: 'red' }}>{error}</p>;

//   const filteredPosts = posts.filter(p => {
//     if (filter === 'Hidden') return p.isHidden;
//     if (filter === 'Normal') return !p.isHidden;
//     return true;
//   }).filter(p => typeFilter === 'All' ? true : p.category === typeFilter);

//   const handleDeleteComment = async (postId, commentId) => {
//     try {
//       await API.delete(`/posts/comments/${commentId}`);
  
//       setPosts(prev =>
//         prev.map(p =>
//           p.id === postId
//             ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
//             : p
//         )
//       );
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const handleEditComment = async (postId, comment) => {
//     const { value: newContent } = await Swal.fire({
//       input: "textarea",
//       inputValue: comment.content,
//       showCancelButton: true,
//       confirmButtonText: "Save"
//     });
  
//     if (!newContent || newContent === comment.content) return;
  
//     try {
//       await API.put(`/posts/comments/${comment.id}`, {
//         content: newContent
//       });
  
//       setPosts(prev =>
//         prev.map(p =>
//           p.id === postId
//             ? {
//                 ...p,
//                 comments: p.comments.map(c =>
//                   c.id === comment.id ? { ...c, content: newContent } : c
//                 )
//               }
//             : p
//         )
//       );
//     } catch (err) {
//       console.log(err);
//     }
//   };
  

//   return (
//     <div className="feed-container">
//       <h2 className="page-title">{t("userPosts")}</h2>

//       <div className="filter-bar">
//         <label style={{ marginRight: '8px' }}>{t("filterBy")}</label>
//         <select value={filter} onChange={e => setFilter(e.target.value)} style={{ marginRight: '16px' }}>
//           <option value="All">{t("all")}</option>
//           <option value="Normal">{t("normal")}</option>
//           <option value="Hidden">{t("hidden")}</option>
//         </select>
//         <label style={{ marginRight: '8px' }}>{t("Posttype")}</label>
//         <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
//   <option value="All">{t("all")}</option>
//   <option value="General">{t("general")}</option>
//   <option value="Internship">{t("internship")}</option>
//   <option value="Success story">{t("successStory")}</option>
// </select>

//       </div>

//       <div className="posts-feed">
//         {filteredPosts.map((post) => (
//           <div key={post.id} className="post-card" style={post.isHidden ? { backgroundColor: 'rgba(66, 64, 64, 0.15)' } : {}}>
//            <div className="post-header">
//   <div className="post-header-left">
//     <img src={post.author?.photo || PROFILE} alt="profile" className="profile-pic" />
//     <div className="post-header-info">
//       <strong>{post.author?.name || t('unknown')}</strong>
//       <div className="post-date-right">
//       {new Date(post["created-at"]).toLocaleString(
//   i18n.language === 'ar' ? 'ar-EG' : 'en-US',
//   {
//     year: 'numeric',
//     month: 'short',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit',
//     hour12: true
//   }
// )}
// - {t(post.category)}
//   {post['group-id'] ? ' - In Group' : ''}
// </div>

//     </div>
//   </div>

//   {postPerm.canEdit && (!post.isHidden ? (
//     <button onClick={() => handleHide(post.id)} className="hide-btn-top"><EyeOff size={16} /></button>
//   ) : (
//     <button onClick={() => handleUnhide(post.id)} className="hide-btn-top"><Eye size={16} /></button>
//   ))}
// </div>

//             <div className="post-content">
//               <p>{post.content}</p>
//               {post.images && post.images.length > 0 && (
//   <div className="post-images">
//     {post.images.map((imgUrl, index) => (
//       <img
//         key={index}
//         src={imgUrl}
//         alt={`post-${index}`}
//         className="post-image"
//         onClick={() => setSelectedImage({ postId: post.id, url: imgUrl })}
//         onError={(e) => { e.target.style.display = 'none'; }}
//       />
//     ))}
//   </div>
// )}

// {selectedImage.url && selectedImage.postId === post.id && (
//   <div className="image-modal" onClick={() => setSelectedImage({ postId: null, url: null })}>
//     <img src={selectedImage.url} alt="full" />
//   </div>
// )}
//             </div>

//             <div className="post-actions">
//             <button className={post.liked ? "liked" : ""} onClick={() => handleLike(post.id)}>
//             <Heart size={16} color={post.liked ? "#e0245e" : "#555"} /> {post.likes}
// </button>

//               <button onClick={() => toggleComments(post.id)}>
//                 <MessageCircle size={16} /> {post.comments?.length || 0}
//               </button>
//               {/* <button>
//                 <Share2 size={16} /> {post.shares || 0}
//               </button> */}
//             </div>

//             {post.category === "Success story" && postPerm.canAdd && (
//               <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
//                 <div className="landing-tooltip-container">
//                   <button onClick={() => handleLandingToggle(post.id, post.inLanding)} className="landing-btn">
//                     {post.inLanding ? <CheckCircle size={20} color="#4CAF50" /> : <Circle size={20} color="#ccc" />}
//                   </button>
//                   <span className="landing-tooltip">
//                     {post.inLanding ? "Remove from Landing Page" : "Add to Landing Page"}
//                   </span>
//                 </div>
//               </div>
//             )}

// {post.showComments && (
//   <div className="comments-section">

//     <div className="existing-comments">
//       {post.comments.map((comment) => (
//         <div key={comment.id} className="comment-item">

//           <img
//             src={comment.avatar || PROFILE}
//             alt={comment.userName}
//             className="comment-avatar"
//           />

//           <div className="comment-text">
//             <strong>{comment.userName}</strong>: {comment.content}
//           </div>

//           <div className="comment-date">
//           {new Date(post["created-at"]).toLocaleString(
//   i18n.language === 'ar' ? 'ar-EG' : 'en-US',
//   {
//     year: 'numeric',
//     month: 'short',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit',
//     hour12: true
//   }
// )}

//           </div>

//           {(comment.author?.["user-type"] === "admin" || comment.author?.["user-type"] === "staff") && (
//             <div className="comment-actions">
//               <button onClick={() => handleEditComment(post.id, comment)}>
//                 <Edit size={14} />
//               </button>

//               <button onClick={() => handleDeleteComment(post.id, comment.id)}>
//                 <Trash2 size={14} />
//               </button>
//             </div>
//           )}

//         </div>
//       ))}
//     </div>

//     {postPerm.canAdd && (
//       <div className="comment-input">
//         <input
//           type="text"
//           placeholder="Write a comment..."
//           value={commentInputs[post.id] || ""}
//           onChange={(e) => handleCommentChange(post.id, e.target.value)}
//         />
//         <button onClick={() => handleCommentSubmit(post.id)}>
//           <Send size={16} />
//         </button>
//       </div>
//     )}

//   </div>
// )}

//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default UsersPostsPage;


import React, { useState, useEffect } from 'react';
import './AdminPostsPage.css';
import { Heart, MessageCircle, Share2, EyeOff, Eye, Send, CheckCircle, Circle,Edit , Trash2 } from 'lucide-react';
import { useTranslation } from "react-i18next";
import API from '../../services/api';
import PROFILE from './PROFILE.jpeg';
import Swal from "sweetalert2";
import { getPermission } from "../../components/usePermission";
import Staffprof from "../alumni/Staffprof.jpg";
import AdminPostsImg from "../alumni/AdminPosts.jpeg";
import { useNavigate } from "react-router-dom";


const UsersPostsPage = ({ currentUser }) => {
const { t, i18n } = useTranslation();
const navigate = useNavigate();


  const [typeFilter, setTypeFilter] = useState('All');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedImage, setSelectedImage] = useState({ postId: null, url: null });
  const postPerm = currentUser?.userType === "admin"
  ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
  : getPermission("Graduates posts management", currentUser) || { canView: false, canAdd: false, canEdit: false, canDelete: false };

  
  
  useEffect(() => {
    if (postPerm.canView) fetchPosts();
    else setLoading(false);
  }, [currentUser]);

  const formatPosts = (data) => {
    return (data || []).map(post => {
      const formattedComments = (post.comments || []).map(comment => {
        const isAdminOrStaff = ["admin", "staff"].includes(comment.author?.["user-type"]);
        return {
          id: comment.comment_id,
          userName: isAdminOrStaff ? "Alumni Portal – Helwan University" : comment.author?.["full-name"] || "Unknown User",
          content: comment.content,
          avatar: isAdminOrStaff ? AdminPostsImg : comment.author?.image || PROFILE,
          date: comment["created-at"],
          author: comment.author,
        };
      });
  
      return {
        ...post,
        id: post.post_id,
        likes: post.likesCount || 0,
        liked: post.isLikedByYou || false,
        comments: formattedComments,
        images: post.images || [],
        showComments: false,
        author: {
          ...post.author,
          name: post.author?.name || post.author?.["full-name"],
          photo: post.author?.photo || post.author?.image || PROFILE
        },
        isHidden: post["is-hidden"] === true,
        inLanding: post["in-landing"] === true
      };
    });
  };
  
  

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/posts');
      console.log("Fetch posts response:", res);
      if (res.data.status === "success") {
        setPosts(formatPosts(res.data.data));
      } else {
        setPosts(formatPosts(res.data.data || []));
      }
    } catch (err) {
      console.error('Error fetching posts', err);
      setError(t("fetchPostsFailed"));
    } finally {
      setLoading(false);
    }
  };
  

  const handleLandingToggle = async (postId, currentValue) => {
    if (!postPerm.canAdd) return;
    try {
      await API.patch(`/posts/${postId}/landing`, { inLanding: !currentValue });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, inLanding: !currentValue } : p));
      Swal.fire({ icon: "success", title: t("Updated"), text: `Post ${!currentValue ? "added to" : "removed from"} landing`, toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
    } catch (err) {
      console.error("Error updating landing status", err);
      Swal.fire({ icon: "error", title: t("Error"), text: t("Failed to update landing status"), toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
    }
  };

  const handleHide = async (id) => {
    if (!postPerm.canEdit) return;
    try {
      const response = await API.put(`/posts/${id}/hide`);
      //  console.log("Hide post response:", response);
      if (response.data.status === "success") {
        await fetchPosts();
        Swal.fire({ icon: "success", title: t("Post hidden"), toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
      }
    } catch (err) {
      console.error("Error hiding post", err);
      Swal.fire({ icon: "error", title: t("Error"), text: t("Failed to hide the post."), toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
    }
  };

  const handleUnhide = async (id) => {
    if (!postPerm.canEdit) return;
    try {
      const response = await API.put(`/posts/${id}/unhide`);
      if (response.data.status === "success") {
        await fetchPosts();
        Swal.fire({ icon: "success", title: t("Post unhidden"), toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
      }
    } catch (err) {
      console.error("Error unhiding post", err);
      Swal.fire({ icon: "error", title: t("Error"), text: t("Failed to unhide the post."), toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
    }
  };

  const handleLike = async (postId) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
  
    const post = posts[postIndex];
    const updatedPosts = [...posts];
  
    if (post.liked) {
      await API.delete(`/posts/${postId}/like`);
      updatedPosts[postIndex] = { ...post, liked: false, likes: Math.max(0, post.likes - 1) };
    } else {
      await API.post(`/posts/${postId}/like`);
      updatedPosts[postIndex] = { ...post, liked: true, likes: post.likes + 1 };
    }
  
    setPosts(updatedPosts);
  };
  

  const toggleComments = (postId) => {
    if (!postPerm.canView) return;
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  const handleCommentSubmit = async (postId) => {
    if (!postPerm.canAdd) return;
    const comment = commentInputs[postId];
    if (!comment?.trim()) return;
  
    try {
      const res = await API.post(`/posts/${postId}/comments`, { content: comment });
  
      if (res.data.comment) {
        const newComment = {
          id: res.data.comment.comment_id,
          userName: "Alumni Portal – Helwan University",
          content: res.data.comment.content,
          avatar: AdminPostsImg,
          date: new Date().toLocaleString(),
          author: {
            ...res.data.comment.author,
            "user-type": "admin" 
          },
        };
  
        setPosts(prev =>
          prev.map(post =>
            post.id === postId
              ? { ...post, comments: [...post.comments, newComment], showComments: true }
              : post
          )
        );
      }
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Error submitting comment:", err.response?.data || err);
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t("Failed to add comment"),
        toast: true,
        position: "top-end",
        timer: 1800,
        showConfirmButton: false
      });
    }
  };
  
  

  if (loading) return <p>{t("loadingPosts")}</p>;
  if (!postPerm.canView) return <p style={{ color: 'red' }}>{t("noPermission")}</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const filteredPosts = posts.filter(p => {
    if (filter === 'Hidden') return p.isHidden;
    if (filter === 'Normal') return !p.isHidden;
    return true;
  }).filter(p => typeFilter === 'All' ? true : p.category === typeFilter);

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await API.delete(`/posts/comments/${commentId}`);
  
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
            : p
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleEditComment = async (postId, comment) => {
    const { value: newContent } = await Swal.fire({
      input: "textarea",
      inputValue: comment.content,
      showCancelButton: true,
      confirmButtonText: "Save"
    });
  
    if (!newContent || newContent === comment.content) return;
  
    try {
      await API.put(`/posts/comments/${comment.id}`, {
        content: newContent
      });
  
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments.map(c =>
                  c.id === comment.id ? { ...c, content: newContent } : c
                )
              }
            : p
        )
      );
    } catch (err) {
      console.log(err);
    }
  };
  

  return (
    <div className="feed-container">
      <h2 className="page-title">{t("userPosts")}</h2>

      <div className="filter-bar">
        <label style={{ marginRight: '8px' }}>{t("filterBy")}</label>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ marginRight: '16px' }}>
          <option value="All">{t("all")}</option>
          <option value="Normal">{t("normal")}</option>
          <option value="Hidden">{t("hidden")}</option>
        </select>
        <label style={{ marginRight: '8px' }}>{t("Posttype")}</label>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
  <option value="All">{t("all")}</option>
  <option value="General">{t("general")}</option>
  <option value="Internship">{t("internship")}</option>
  <option value="Success story">{t("successStory")}</option>
</select>

      </div>

      <div className="posts-feed">
        {filteredPosts.map((post) => (
          <div key={post.id} className="post-card" style={post.isHidden ? { backgroundColor: 'rgba(66, 64, 64, 0.15)' } : {}}>
           <div className="post-header">
  <div className="post-header-left">
    <img src={post.author?.photo || PROFILE} alt="profile" className="profile-pic" />
    <div className="post-header-info">
    <strong
  style={{ cursor: "pointer" , color:"#484c50" }}
  onClick={() => navigate(`/helwan-alumni-portal/admin/dashboard/graduateprofile/${post.author.id}`)}
>
  {post.author?.name || t('unknown')}
</strong>

      <div className="post-date-right">
      {new Date(post["created-at"]).toLocaleString(
  i18n.language === 'ar' ? 'ar-EG' : 'en-US',
  {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
)}
- {t(post.category)}
  {post['group-id'] ? ' - In Group' : ''}
</div>

    </div>
  </div>

  {postPerm.canEdit && (!post.isHidden ? (
    <button onClick={() => handleHide(post.id)} className="hide-btn-top"><EyeOff size={16} /></button>
  ) : (
    <button onClick={() => handleUnhide(post.id)} className="hide-btn-top"><Eye size={16} /></button>
  ))}
</div>

            <div className="post-content">
              <p>{post.content}</p>
              {post.images && post.images.length > 0 && (
  <div className="post-images">
    {post.images.map((imgUrl, index) => (
      <img
        key={index}
        src={imgUrl}
        alt={`post-${index}`}
        className="post-image"
        onClick={() => setSelectedImage({ postId: post.id, url: imgUrl })}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    ))}
  </div>
)}

{selectedImage.url && selectedImage.postId === post.id && (
  <div className="image-modal" onClick={() => setSelectedImage({ postId: null, url: null })}>
    <img src={selectedImage.url} alt="full" />
  </div>
)}
            </div>

            <div className="post-actions">
            <button className={post.liked ? "liked" : ""} onClick={() => handleLike(post.id)}>
            <Heart size={16} color={post.liked ? "#e0245e" : "#555"} /> {post.likes}
</button>

              <button onClick={() => toggleComments(post.id)}>
                <MessageCircle size={16} /> {post.comments?.length || 0}
              </button>
              {/* <button>
                <Share2 size={16} /> {post.shares || 0}
              </button> */}
            </div>

            {post.category === "Success story" && postPerm.canAdd && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <div className="landing-tooltip-container">
                  <button onClick={() => handleLandingToggle(post.id, post.inLanding)} className="landing-btn">
                    {post.inLanding ? <CheckCircle size={20} color="#4CAF50" /> : <Circle size={20} color="#ccc" />}
                  </button>
                  <span className="landing-tooltip">
                    {post.inLanding ? "Remove from Landing Page" : "Add to Landing Page"}
                  </span>
                </div>
              </div>
            )}

{post.showComments && (
  <div className="comments-section">

    <div className="existing-comments">
      {post.comments.map((comment) => (
        <div key={comment.id} className="comment-item">

          <img
            src={comment.avatar || PROFILE}
            alt={comment.userName}
            className="comment-avatar"
          />

          <div className="comment-text">
          <strong
 style={{ cursor: ["admin", "staff"].includes(comment.author?.["user-type"]) ? "default" : "pointer", color: "#484c50" }}
 onClick={() => {
   if (!["admin", "staff"].includes(comment.author?.["user-type"])) {
     navigate(`/helwan-alumni-portal/admin/dashboard/graduateprofile/${comment.author?.id}`);
   }
 }}
>
  {comment.userName}
</strong>
: {comment.content}

          </div>

          <div className="comment-date">
          {new Date(post["created-at"]).toLocaleString(
  i18n.language === 'ar' ? 'ar-EG' : 'en-US',
  {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
)}

          </div>

          {(comment.author?.["user-type"] === "admin" || comment.author?.["user-type"] === "staff") && (
            <div className="comment-actions">
              <button onClick={() => handleEditComment(post.id, comment)}>
                <Edit size={14} />
              </button>

              <button onClick={() => handleDeleteComment(post.id, comment.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          )}

        </div>
      ))}
    </div>

    {postPerm.canAdd && (
      <div className="comment-input">
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentInputs[post.id] || ""}
          onChange={(e) => handleCommentChange(post.id, e.target.value)}
        />
        <button onClick={() => handleCommentSubmit(post.id)}>
          <Send size={16} />
        </button>
      </div>
    )}

  </div>
)}

          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersPostsPage;
