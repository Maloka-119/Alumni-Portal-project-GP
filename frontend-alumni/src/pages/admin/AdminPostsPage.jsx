

import React, { useState, useEffect } from 'react';
import './AdminPostsPage.css';
import AdminPostsImg from './AdminPosts.jpeg';
import { Heart, MessageCircle, Share2, Edit, Trash2, Send, CheckCircle, Circle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API from "../../services/api";
import CreatePostBar from '../../components/CreatePostBar'; 
import Swal from "sweetalert2";
import { getPermission } from "../../components/usePermission";

const AdminPostsPage = ({ currentUser }) => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [types, setTypes] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [editingPostId, setEditingPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedImage, setSelectedImage] = useState({ postId: null, url: null });

  // صلاحيات المستخدم
  const postPerm = currentUser?.userType === "admin"
  ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
  : getPermission("Portal posts management", currentUser) || { canView: false, canAdd: false, canEdit: false, canDelete: false };

  useEffect(() => {
    if (postPerm.canView) {
      fetchPosts();
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, [currentUser]);
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 2000);
  
      return () => clearTimeout(timer);
    }
  }, [success, error]);
  
  
  const formatPosts = (data) => {
    const filtered = (data || []).filter(p => !p['group-id']);
    
    return filtered.map(post => {
      const formattedComments = (post.comments || []).map((comment) => {
        const isAdminOrStaff = ["admin", "staff"].includes(comment.author?.userType);
        return {
          id: comment.comment_id,
          userName: isAdminOrStaff ? "Alumni Portal – Helwan University" : comment.author?.["full-name"] || "Anonymous",
          avatar: isAdminOrStaff ? AdminPostsImg : comment.author?.image || AdminPostsImg,
          content: comment.content,
          date: comment["created-at"],
          author: comment.author,
        };
      });
  
      return {
        id: post.post_id,
        content: post.content,
        likes: post.likesCount || 0,  
        liked: post.isLikedByYou, 
        comments: formattedComments,
        date: post['created-at'],
        authorName: "Alumni Portal – Helwan University",
        shares: 0,
        type: post.category,
        images: post.images || [],
        showComments: false,
        inLanding: post["in-landing"]
      };
    });
  };
  

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('/posts/admin');
      console.log(" API response:", response.data);
      if (response.data.status === "success") setPosts(formatPosts(response.data.data));
      else setPosts([]);
    } catch (err) {
      console.error('❌ Error fetching posts:', err);
      setError(t("fetchPostsFailed"));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get("/posts/categories");
      setTypes(res.data.data || []);
    } catch (err) {
      console.error("Error fetching categories", err);
      setTypes([]);
    }
  };

  const handleCreateOrEdit = async (formData, postId = null) => {
    setError(null);
    setSuccess(null);
    try {
      if (postId) {
        await API.put(`/posts/${postId}/edit`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess(t("postUpdated"));
      } else {
        await API.post("/posts/create-post", formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess(t("postCreated"));
      }
      fetchPosts();
      setEditingPostId(null);
    } catch (err) {
      console.error("❌ Error saving post", err);
      setError(err.response?.data?.message || t("savePostFailed"));
    }
  };

  const handleDelete = async (id) => {
    if (!postPerm.canDelete) return;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      try {
        await API.delete(`/posts/${id}`);
        Swal.fire({ icon: "success", title: "Deleted!", text: "Post deleted successfully" });
        fetchPosts();
      } catch (err) {
        console.error("Error deleting post:", err);
        Swal.fire({ icon: "error", title: "Error", text: "Failed to delete post" });
      }
    }
  };

  const handleLike = async (postId) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
  
    const post = posts[postIndex];
    const updatedPosts = [...posts];
  
    try {
      if (post.liked) {
        await API.delete(`/posts/${postId}/like`);
        updatedPosts[postIndex] = { ...post, likes: Math.max(0, post.likes - 1), liked: false };
      } else {
        await API.post(`/posts/${postId}/like`);
        updatedPosts[postIndex] = { ...post, likes: post.likes + 1, liked: true };
      }
      setPosts(updatedPosts);
    } catch (err) {
      console.error("Error liking/unliking post:", err.response?.data || err);
    }
  };
  

  const toggleComments = (postId) => {
    if (!postPerm.canView) return;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  const handleCommentChange = (postId, value) => {
    if (!postPerm.canAdd) return;
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  const handleCommentSubmit = async (postId) => {
    if (!postPerm.canAdd) return;
    const comment = commentInputs[postId];
    if (!comment?.trim()) return;
  
    try {
      const res = await API.post(`/posts/${postId}/comments`, { content: comment });
      if (res.data.comment) {
        const isAdminOrStaff = ["admin", "staff"].includes(res.data.comment.author?.userType);
        const newComment = {
          id: res.data.comment.comment_id,
          userName: isAdminOrStaff ? "Alumni Portal – Helwan University" : res.data.comment.author?.["full-name"] || "Admin",
          avatar: isAdminOrStaff ? AdminPostsImg : res.data.comment.author?.image || AdminPostsImg,
          content: res.data.comment.content,
          date: new Date().toLocaleString(),
          author: res.data.comment.author,
        };
        setPosts(prev =>
          prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p)
        );
      }
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Error submitting comment:", err.response?.data || err);
    }
  };
  
  const handleLandingToggle = async (postId, currentValue) => {
    if (!postPerm.canAdd) return;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, inLanding: !currentValue } : p));

    try {
      await API.patch(`/posts/${postId}/landing`, { inLanding: !currentValue });
      Swal.fire({ icon: "success", title: "Updated", text: `Post ${!currentValue ? "added to" : "removed from"} landing`, toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
    } catch (err) {
      console.error("Error updating landing status", err);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, inLanding: currentValue } : p));
      Swal.fire({ icon: "error", title: "Error", text: "Failed to update landing status", toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
    }
  };

  const filteredPosts = filterType === 'All' ? posts : posts.filter(p => p.type === filterType);

  if (!postPerm.canView) return <p style={{ color: 'red' }}>{t("noPermission")}</p>;
  if (loading) return <p>{t("loadingPosts")}</p>;
  if (error) return <div className="error-message">{error}</div>;

  const handleEditComment = async (postId, comment) => {
    const { value: newContent } = await Swal.fire({
      input: "textarea",
      inputValue: comment.content,
      showCancelButton: true,
      confirmButtonText: "Save"
    });
  
    if (!newContent || newContent === comment.content) return;
  
    try {
      await API.put(`/posts/${postId}/comments/${comment.id}`, {
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

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await API.delete(`/posts/${postId}/comments/${commentId}`);
  
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
  

  return (
    <div className="feed-container">
      <h2 className="page-title">{t('Manage Portal Posts')}</h2>

      {success && <div className="success-message">{success}</div>}

      {(postPerm.canAdd || editingPostId) && (
  <CreatePostBar
    types={types}
    editingPost={posts.find(p => p.id === editingPostId) || null}
    onSubmit={handleCreateOrEdit}
    canAdd={postPerm.canAdd}
    onCancelEdit={() => setEditingPostId(null)}
  />
)}

      <div className="filter-bar">
        <label>{t('Filter by type:')}</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">{t('All')}</option>
          {types.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <div className="posts-feed">
        {filteredPosts.length === 0 ? <p className="no-posts">{t('noPosts')}</p> :
          filteredPosts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <img src={post.author?.photo || AdminPostsImg} alt="profile" className="profile-pic" />
                <div className="post-header-info">
                  <strong>{post.authorName}</strong>
                  <div className="post-date">{new Date(post.date).toLocaleString()}</div>
                </div>
                <span className="post-type-badge">{post.type}</span>
                
              </div>

              <div className="post-content">
                <p>{post.content}</p>
                {post.images.length > 0 && (
  <div className="post-images">
    {post.images.map((imgUrl, index) => (
      <img
        key={index}
        src={imgUrl}
        alt={`post-${index}`}
        className="post-image"
        onClick={() => setSelectedImage({ postId: post.id, url: imgUrl })}
        onError={e => e.target.style.display='none'}
      />
    ))}
  </div>
)}

{selectedImage.url && selectedImage.postId === post.id && (
  <div
    className="image-modal"
    onClick={() => setSelectedImage({ postId: null, url: null })}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}
  >
    <img
      src={selectedImage.url}
      alt="full"
      style={{
        maxWidth: "90%",
        maxHeight: "90%",
        objectFit: "contain",
        borderRadius: "8px",
      }}
    />
  </div>
)}
              </div>

              <div className="post-actions">
                <button className={post.liked ? "liked" : ""} onClick={() => handleLike(post.id)}>
                <Heart size={16} color={post.liked ? "#e0245e" : "#555"} />
                {post.likes}
                </button>
                <button onClick={() => toggleComments(post.id)}>
                  <MessageCircle size={16} /> {post.comments?.length || 0}
                </button>
                {/* <button><Share2 size={16} /> {post.shares || 0}</button> */}
                <div style={{  display: 'flex', justifyContent: 'flex-end',marginLeft: "auto"}}>
  {postPerm.canEdit && (
    <button onClick={() => setEditingPostId(post.id)} className="edit-btn">
      <Edit size={16} />
    </button>
  )}

  {postPerm.canDelete && (
    <button onClick={() => handleDelete(post.id)} className="delete-btn">
      <Trash2 size={16} />
    </button>
  )}

  {postPerm.canAdd && (
    <div className="landing-tooltip-container">
      <button
        onClick={() => handleLandingToggle(post.id, post.inLanding)}
        className="landing-btn"
      >
        {post.inLanding ? (
          <CheckCircle size={20} color="#4CAF50" />
        ) : (
          <Circle size={20} color="#ccc" />
        )}
      </button>
      <span className="landing-tooltip">
        {post.inLanding ? "Remove from Landing Page" : "Add to Landing Page"}
      </span>
    </div>
  )}
</div>


              </div>

              {post.showComments && (
                <div className="comments-section">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                    <img
                      src={comment.avatar || AdminPostsImg}
                      alt={comment.userName}
                      className="comment-avatar"
                    />
                  
                    <div className="comment-text">
                      <strong>{comment.userName}</strong> 
                      {comment.content}
                    </div>
                  
                    <div className="comment-date">
                      {new Date(comment.date).toLocaleString()}
                    </div>
                  
                    {(["admin","staff"].includes(comment.author?.userType)) && (
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
                  {postPerm.canAdd && (
                    <div className="comment-input">
                      <input type="text" value={commentInputs[post.id] || ''} onChange={e => handleCommentChange(post.id, e.target.value)} placeholder="Write a comment..." />
                      <button onClick={() => handleCommentSubmit(post.id)}><Send size={16} /></button>
                    </div>
                  )}
                </div>
              )}

            </div>
          ))
        }
      </div>
    </div>
  );
};

export default AdminPostsPage;

// import React, { useState, useEffect } from 'react';
// import './AdminPostsPage.css';
// import AdminPostsImg from './AdminPosts.jpeg';
// import { Heart, MessageCircle, Share2, Edit, Trash2, Send } from 'lucide-react';
// import { useTranslation } from 'react-i18next';
// import API from "../../services/api";
// import CreatePostBar from '../../components/CreatePostBar'; 
// import Swal from "sweetalert2";
// import { CheckCircle, Circle } from 'lucide-react';

// const AdminPostsPage = () => {
//   const { t } = useTranslation();
//   const [posts, setPosts] = useState([]);
//   const [types, setTypes] = useState([]);
//   const [filterType, setFilterType] = useState('All');
//   const [editingPostId, setEditingPostId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [commentInputs, setCommentInputs] = useState({});

//   useEffect(() => {
//     fetchPosts();
//     fetchCategories();
//   }, []);

//   const formatPosts = (data) => {
//     const filtered = (data || []).filter(p => !p['group-id']);
    
//     return filtered.map(post => {
//       const formattedComments = (post.comments || []).map((comment) => ({
//         id: comment.comment_id,
//         userName: comment.author?.["full-name"] || "Anonymous",
//         content: comment.content,
//         avatar: comment.author?.image || AdminPostsImg,
//         date: comment["created-at"],
//       }));

//       return {
//         id: post.post_id,
//         content: post.content,
//         likes: post.likes_count || 0,
//         liked: false, 
//         comments: formattedComments,
//         date: new Date(post['created-at']).toLocaleString('en-US', {
//           year: 'numeric',
//           month: 'short',
//           day: 'numeric',
//           hour: '2-digit',
//           minute: '2-digit',
//           hour12: true
//         }),
//         authorName: "Alumni Portal – Helwan University",
//         shares: 0,
//         type: post.category,
//         images: post.images || [],
//         showComments: false, 
//         author: {
//           photo: AdminPostsImg
//         },
//          inLanding: post["in-landing"]
//       };
//     });
//   };

//   const fetchPosts = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await API.get('/posts/admin');
//       if (response.data.status === "success") {
//         setPosts(formatPosts(response.data.data));
//       } else {
//         setPosts([]);
//       }
//     } catch (error) {
//       console.error('❌ Error fetching posts:', error);
//       setError(t("fetchPostsFailed"));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchCategories = async () => {
//     try {
//       const res = await API.get("/posts/categories");
//       setTypes(res.data.data || []);
//     } catch (err) {
//       console.error("Error fetching categories", err);
//       setTypes([]);
//     }
//   };
// const handleCreateOrEdit = async (formData, postId = null) => {
//   setError(null);
//   setSuccess(null);
//   try {
//     if (postId) {
//       await API.put(`/posts/${postId}/edit`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       setSuccess(t("postUpdated"));
//     } else {
//       await API.post("/posts/create-post", formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       setSuccess(t("postCreated"));
//     }
//     fetchPosts();
//     setEditingPostId(null);
//   } catch (err) {
//     console.error("❌ Error saving post", err);
//     setError(err.response?.data?.message || t("savePostFailed"));
//   }
// };



// const handleDelete = async (id) => {
//   const result = await Swal.fire({
//     title: "Are you sure?",
//     text: "You won't be able to revert this!",
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonText: "Yes, delete it!",
//     cancelButtonText: "Cancel",
//   });

//   if (result.isConfirmed) {
//     try {
//       await API.delete(`/posts/${id}`);
//       Swal.fire({
//         icon: "success",
//         title: "Deleted!",
//         text: "Post deleted successfully",
//       });
//       fetchPosts();
//     } catch (err) {
//       console.error("Error deleting post:", err);
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: "An error occurred while deleting the post",
//       });
//     }
//   }
// };
//   const handleLike = async (postId) => {
//     const postIndex = posts.findIndex(p => p.id === postId);
//     if (postIndex === -1) return;

//     try {
//       const post = posts[postIndex];
      
//       try {
//         await API.delete(`/posts/${postId}/like`);
//         const updatedPosts = [...posts];
//         updatedPosts[postIndex] = {
//           ...post,
//           likes: Math.max(0, post.likes - 1),
//           liked: false
//         };
//         setPosts(updatedPosts);
//         console.log("Successfully unliked post:", postId);
        
//       } catch (unlikeError) {
//         if (unlikeError.response?.data?.message?.includes('not found')) {
//           await API.post(`/posts/${postId}/like`);
//           const updatedPosts = [...posts];
//           updatedPosts[postIndex] = {
//             ...post,
//             likes: post.likes + 1,
//             liked: true
//           };
//           setPosts(updatedPosts);
//           console.log("Successfully liked post:", postId);
//         } else {
//           throw unlikeError;
//         }
//       }
      
//     } catch (err) {
//       console.error("Error in handleLike:", err.response?.data || err);
      
//       await fetchPosts();
//     }
//   };
//   const toggleComments = (postId) => {
//     setPosts(prevPosts => prevPosts.map(p => 
//       p.id === postId ? { ...p, showComments: !p.showComments } : p
//     ));
//   };

//   const handleCommentChange = (postId, value) => {
//     setCommentInputs({ ...commentInputs, [postId]: value });
//   };

//   const handleCommentSubmit = async (postId) => {
//     const comment = commentInputs[postId];
//     if (!comment) return;
  
//     try {
//       const res = await API.post(`/posts/${postId}/comments`, { content: comment });
  
//       console.log("Comment response from backend:", res.data);
//       setPosts(prevPosts =>
//         prevPosts.map(p =>
//           p.id === postId
//             ? {
//                 ...p,
//                 comments: [
//                   ...(p.comments || []),
//                   {
//                     id: res.data.comment.comment_id,
//                     userName: res.data.comment.author?.["full-name"] || "Admin",
//                     content: res.data.comment.content,
//                     avatar: res.data.comment.author?.image || AdminPostsImg, 
//                     date: new Date().toLocaleString(),
//                     "created-at": res.data.comment["created-at"]
//                   }
//                 ]
//               }
//             : p
//         )
//       );
//       setCommentInputs({ ...commentInputs, [postId]: '' });
  
//     } catch (err) {
//       console.error("Error submitting comment:", err);
//     }
//   };
//   useEffect(() => {
//     if (success || error) {
//       const timer = setTimeout(() => {
//         setSuccess(null);
//         setError(null);
//       }, 2000);
//       return () => clearTimeout(timer);
//     }
//   }, [success, error]);

// const handleLandingToggle = async (postId, currentValue) => {
//   // تحديث الـ state فورًا
//   setPosts(prev =>
//     prev.map(p => (p.id === postId ? { ...p, inLanding: !currentValue } : p))
//   );

//   try {
//     const res = await API.patch(`/posts/${postId}/landing`, { inLanding: !currentValue });
//     if (res.data.status === "success") {
//       Swal.fire({
//         icon: "success",
//         title: "Updated",
//         text: `Post ${!currentValue ? "added to" : "removed from"} landing`,
//         toast: true,
//         position: "top-end",
//         timer: 1800,
//         showConfirmButton: false,
//         background: "#fefefe",
//         color: "#333",
//       });
//     }
//   } catch (err) {
//     console.error("Error updating landing status", err);

//     // لو في خطأ، ارجع الحالة زي ما كانت
//     setPosts(prev =>
//       prev.map(p => (p.id === postId ? { ...p, inLanding: currentValue } : p))
//     );

//     Swal.fire({
//       icon: "error",
//       title: "Error",
//       text: "Failed to update landing status",
//       toast: true,
//       position: "top-end",
//       timer: 1800,
//       showConfirmButton: false,
//       background: "#fefefe",
//       color: "#333",
//     });
//   }
// };



//   const filteredPosts = filterType === 'All'
//     ? posts
//     : posts.filter(p => p.type === filterType);

//   return (
//     <div className="feed-container">
//       <h2 className="page-title">{t('Manage Alumni Posts')}</h2>

//       {loading && <p>{t('loadingPosts')}</p>}
//       {error && <div className="error-message">{error}</div>}
//       {success && <div className="success-message">{success}</div>}

//       <CreatePostBar
//         types={types}
//         editingPost={posts.find(p => p.id === editingPostId) || null}
//         onSubmit={(formData, postId) => handleCreateOrEdit(formData, postId)}
//       />

//       {!loading && !error && (
//         <>
//           <div className="filter-bar">
//             <label>{t('Filter by type:')}</label>
//             <select
//               value={filterType}
//               onChange={(e) => setFilterType(e.target.value)}
//             >
//               <option value="All">{t('All')}</option>
//               {types.map(type => (
//                 <option key={type} value={type}>{type}</option>
//               ))}
//             </select>
//           </div>

//           <div className="posts-feed">
//             {filteredPosts.length === 0 ? (
//               <p className="no-posts">{t('noPosts')}</p>
//             ) : (
//               filteredPosts.map((post) => (
//                 <div key={post.id} className="post-card">
//                   <div className="post-header">
//                     <img src={post.author?.photo || AdminPostsImg} alt="profile" className="profile-pic" />
//                     <div className="post-header-info">
//                       <strong>{post.authorName}</strong>
//                       <div className="post-date">
//                         {post.date}
//                         {post['group-id'] ? ' - In Group' : ''}
//                       </div>
//                     </div>
//                     <span className="post-type-badge">{post.type}</span>
//                   </div>

//                   <div className="post-content">
//                     <p>{post.content}</p>
//                     {post.images && post.images.length > 0 && (
//                       <div className="post-images">
//                         {post.images.map((imgUrl, index) => (
//                           <img
//                             key={index}
//                             src={imgUrl}
//                             alt={`post-${index}`}
//                             className="post-image"
//                             onError={(e) => { e.target.style.display = 'none'; }}
//                           />
//                         ))}
//                       </div>
//                     )}
//                   </div>

//                   {/* Post Actions */}
//                   <div className="post-actions">
//                     <button 
//                       className={post.liked ? "liked" : ""}
//                       onClick={() => handleLike(post.id)}
//                     >
//                       <Heart 
//                         size={16} 
//                       /> 
//                       {post.likes}
//                     </button>
//                     <button onClick={() => toggleComments(post.id)}>
//                       <MessageCircle size={16} /> {post.comments?.length || 0}
//                     </button>
//                     <button>
//                       <Share2 size={16} /> {post.shares || 0}
//                     </button>
//                     <button onClick={() => setEditingPostId(post.id)} className="edit-btn">
//                       <Edit size={16} />
//                     </button>
//                     <button onClick={() => handleDelete(post.id)} className="delete-btn">
//                       <Trash2 size={16} />
//                     </button>
//                     <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
//   <div className="landing-tooltip-container">
//     <button
//      onClick={() => handleLandingToggle(post.id, post.inLanding)}
//       className="landing-btn"
//     >
//       {post.inLanding ? (
//         <CheckCircle size={20} color="#4CAF50" />
//       ) : (
//         <Circle size={20} color="#ccc" />
//       )}
//     </button>
//     <span className="landing-tooltip">
//       {post.inLanding ? "Remove from Landing Page" : "Add to Landing Page"}
//     </span>
//   </div>
// </div>
//                   </div>

//                   {/* Comments Section - تظهر فقط عندما showComments = true */}
//                   {post.showComments && (
//                     <div className="comments-section">
//                       <div className="existing-comments">
//                         {post.comments.map((comment) => (
//                           <div key={comment.id} className="comment-item">
//                             <img
//                               src={comment.avatar || AdminPostsImg}
//                               alt={comment.userName}
//                               className="comment-avatar"
//                             />
//                             <div className="comment-text">
//                               <strong>{comment.userName}</strong>: {comment.content}
//                             </div>
//                             <div className="comment-date">
//                               {new Date(comment["created-at"]).toLocaleString([], {
//                                 year: "numeric",
//                                 month: "2-digit",
//                                 day: "2-digit",
//                                 hour: "2-digit",
//                                 minute: "2-digit",
//                               })}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                       <div className="comment-input">
//                         <input
//                           type="text"
//                           placeholder="Write a comment..."
//                           value={commentInputs[post.id] || ""}
//                           onChange={(e) => handleCommentChange(post.id, e.target.value)}
//                         />
//                         <button onClick={() => handleCommentSubmit(post.id)}>
//                           <Send size={16} />
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ))
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default AdminPostsPage;