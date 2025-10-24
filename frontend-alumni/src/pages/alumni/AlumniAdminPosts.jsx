// import React, { useState, useEffect, useContext } from 'react';
// import { Heart, MessageCircle, Share2,Send  } from 'lucide-react';
// import AdminPostsImg from './AdminPosts.jpeg';
// import PROFILE from './PROFILE.jpeg';
// import './AlumniAdminPosts.css';
// import { DarkModeContext } from './DarkModeContext';
// import { useTranslation } from "react-i18next";
// import API from '../../services/api'; 
// import ReactDOM from "react-dom";

// const AlumniAdminPosts = () => {
//   const { darkMode } = useContext(DarkModeContext);
//   const [filterType, setFilterType] = useState('All');
//   const [commentInputs, setCommentInputs] = useState({});
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { t } = useTranslation();
//   const [types, setTypes] = useState([]);
//   const [zoomedImage, setZoomedImage] = useState(null); 
//   const currentUserId = 2;

//   useEffect(() => {
//     fetchPosts();
//     fetchTypes();
//   }, []);

//   const fetchPosts = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await API.get("/posts/admin");
//       const filtered = (res.data?.data || []).filter(p => !p['group-id']);
  
//       const formattedPosts = filtered.map(p => {
//         // تجاهل تماماً التحقق من الإعجاب من البيانات القادمة من السيرفر
//         // لأن فيها مشكلة في user-id
//         return {
//           id: p.post_id,
//           content: p.content,
//           likes: p.likes_count || (p.likes ? p.likes.length : 0),
//           liked: false, // دائماً false في البداية
//           comments: p.comments?.map(c => ({
//             userName: c.author?.['full-name'] || "Anonymous",
//             content: c.content,
//             avatar: c.author?.image || PROFILE
//           })) || [],
//           date: new Date(p['created-at']).toLocaleString('en-US', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//             hour12: true
//           }),
//           authorName: "Alumni Portal – Helwan University",
//           shares: 0,
//           type: p.category,
//           images: p.images || [],
//           showComments: false
//         };
//       });
  
//       setPosts(formattedPosts);
//     } catch (err) {
//       console.error("Error fetching posts:", err.response?.data || err.message);
//       setError(err.response?.data?.message || 'Error fetching posts');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchTypes = async () => {
//     try {
//       const res = await API.get("/posts/categories");
//       setTypes(res.data.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleLike = async (postId) => {
//     const postIndex = posts.findIndex(p => p.id === postId);
//     if (postIndex === -1) return;
  
//     try {
//       const post = posts[postIndex];
      
//       // حاول عمل unlike أولاً (الأكثر احتمالاً)
//       try {
//         await API.delete(`/posts/${postId}/like`);
//         // إذا نجح الـ unlike، هذا معناه أن البوست كان معجب بيه
//         const updatedPosts = [...posts];
//         updatedPosts[postIndex] = {
//           ...post,
//           likes: Math.max(0, post.likes - 1),
//           liked: false
//         };
//         setPosts(updatedPosts);
//         console.log("Successfully unliked post:", postId);
        
//       } catch (unlikeError) {
//         // إذا فشل الـ unlike، جرب like
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
      
//       // في حالة أي خطأ، أعد جلب البيانات من السيرفر
//       await fetchPosts();
//     }
//   };
  

//   const toggleComments = (postId) => {
//     setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
//   };

//   const handleCommentChange = (postId, value) => {
//     setCommentInputs({ ...commentInputs, [postId]: value });
//   };

//   const handleCommentSubmit = async (postId) => {
//     const comment = commentInputs[postId];
//     if (!comment) return;
  
//     try {
//       const res = await API.post(`/posts/${postId}/comments`, { content: comment });
  
//       console.log("🟡 Comment response from backend:", res.data);
  
//       // ✅ ضيف الكومينت الجديد بنفس structure الـ posts الأصلية
//       setPosts(prevPosts =>
//         prevPosts.map(p =>
//           p.id === postId
//             ? {
//                 ...p,
//                 comments: [
//                   ...(p.comments || []),
//                   {
//                     id: res.data.comment.comment_id,
//                     userName: res.data.comment.author["full-name"],
//                     content: res.data.comment.content,
//                     avatar: res.data.comment.author.image, // ⬅️ الصورة موجودة هنا
//                     date: new Date(res.data.comment["created-at"]).toLocaleString()
//                   }
//                 ]
//               }
//             : p
//         )
//       );
  
//       // ✅ امسح حقل الكتابة بعد الإرسال
//       setCommentInputs({ ...commentInputs, [postId]: '' });
  
//     } catch (err) {
//       console.error("Error submitting comment:", err);
//     }
//   };
  
  

//   const filteredPosts = filterType === 'All' ? posts : posts.filter(p => p.type === filterType);

//   if (loading) return <p>{t("uniAdminPosts_loading")}</p>;
//   if (error) return <p style={{ color: 'red' }}>{t("uniAdminPosts_error")}</p>;

//   return (
//     <div className={`uni-feed ${darkMode ? 'dark-mode' : ''}`}>
//       <div className="uni-header">
//         <h2>{t("Opportunities")}</h2>
//       </div>

//       <div className="uni-filter">
//         <label>{t("filterByType")}</label>
//         <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
//           <option>All</option>
//           {types.map(t => <option key={t}>{t}</option>)}
//         </select>
//       </div>

//       <div className="uni-posts">
//         {filteredPosts.map(post => (
//           <div key={post.id} className="uni-post-card">
//             <div className="post-header">
//               <img src={AdminPostsImg} alt="profile" className="profile-pic" />
//               <div className="post-header-info">
//                 <strong>{post.authorName}</strong>
//                 <div className="post-date">{post.date}</div>
//               </div>
//               <span className="post-type-badge">{post.type}</span>
//             </div>

//             <div className="uni-post-body">
//               <p>{post.content}</p>
//               {post.images && post.images.length > 0 && (
//           <div className="uni-post-images">
//             {post.images.map((imgUrl, index) => (
//               <img key={index} src={imgUrl} alt={`post-${index}`} className="uni-post-preview"  onClick={() => setZoomedImage(imgUrl)}/>
//             ))}
//                 </div>
//               )}
//             </div>

//             <div className="uni-post-actions">
//               <button className={post.liked ? 'uni-liked' : ''} onClick={() => handleLike(post.id)}>
//                 <Heart size={16}/> {post.likes}
//               </button>
//               <button onClick={() => toggleComments(post.id)}>
//                 <MessageCircle size={16}/> {post.comments.length} 
//               </button>
//               <button>
//                 <Share2 size={16}/> {post.shares} 
//               </button>
//             </div>

//             {post.showComments && (
//               <div className="uni-comments-section">
//                 <div className="uni-existing-comments">
//                   {post.comments.map((c, idx) => (
//                     <div key={idx} className="uni-comment-item">
//                       <img src={c.avatar} alt={c.userName} className="uni-comment-avatar"/>
//                       <div className="uni-comment-text">
//                         <strong>{c.userName}</strong>: {c.content}
//                       </div>
//                       <div className="comment-date">
//                   {new Date(c["created-at"]).toLocaleString([], {
//                     year: "numeric",
//                     month: "2-digit",
//                     day: "2-digit",
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })}
//                 </div>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="uni-comment-input">
//                   <input
//                     type="text"
//                     placeholder={t("writeComment")}
//                     value={commentInputs[post.id] || ''}
//                     onChange={(e) => handleCommentChange(post.id, e.target.value)}
//                   />
//                   <button onClick={() => handleCommentSubmit(post.id)}> <Send size={16} /></button>
//                 </div>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//       {zoomedImage &&
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

// export default AlumniAdminPosts;


import React, { useState, useEffect, useContext } from 'react';
import { Heart, MessageCircle, Share2, Send, Edit, Trash2 } from 'lucide-react';
import AdminPostsImg from './AdminPosts.jpeg';
import PROFILE from './PROFILE.jpeg';
import './AlumniAdminPosts.css';
import { DarkModeContext } from './DarkModeContext';
import { useTranslation } from "react-i18next";
import API from '../../services/api';
import ReactDOM from "react-dom";
import Swal from 'sweetalert2';

const AlumniAdminPosts = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [filterType, setFilterType] = useState('All');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const [types, setTypes] = useState([]);
  const [zoomedImage, setZoomedImage] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchPosts();
    fetchTypes();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/posts/admin");
      const filtered = res.data?.data || [];
      const formattedPosts = filtered.map(p => ({
        id: p.post_id,
        content: p.content,
        likes: p.likes_count || 0,
        liked: false,
        comments: p.comments?.map(c => ({
          comment_id: c.comment_id,
          user_id: c.author?.id || 0,
          userName: c.author?.['full-name'] || "Anonymous",
          content: c.content,
          avatar: c.author?.image || PROFILE,
          date: c['created-at']
        })) || [],
        date: p['created-at'],
        authorName: p.author?.['full-name'] || "Alumni Portal",
        shares: 0,
        type: p.category,
        images: p.images || [],
        showComments: false
      }));
      setPosts(formattedPosts);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error fetching posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await API.get("/posts/categories");
      setTypes(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeToggle = async (postId) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const post = posts[postIndex];
    try {
      if (post.liked) {
        await API.delete(`/posts/${postId}/like`);
        const updated = [...posts];
        updated[postIndex] = { ...post, liked: false, likes: Math.max(0, post.likes - 1) };
        setPosts(updated);
      } else {
        await API.post(`/posts/${postId}/like`);
        const updated = [...posts];
        updated[postIndex] = { ...post, liked: true, likes: post.likes + 1 };
        setPosts(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  const handleAddComment = async (postId, newComment, setNewComment) => {
    if (!newComment.trim()) return;
    try {
      const res = await API.post(`/posts/${postId}/comments`, { content: newComment });
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        comments: [...p.comments, {
          comment_id: res.data.comment.comment_id,
          user_id: res.data.comment.author.id,
          userName: res.data.comment.author["full-name"],
          avatar: res.data.comment.author.image || PROFILE,
          content: res.data.comment.content,
          date: res.data.comment["created-at"]
        }]
      } : p));
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditComment = async (postId, commentId, oldContent) => {
    const { value: newContent } = await Swal.fire({
      input: "textarea",
      inputLabel: t("Edit your comment"),
      inputValue: oldContent,
      showCancelButton: true,
      confirmButtonText: t("Save"),
    });

    if (!newContent) return;

    try {
      const res = await API.put(`/posts/comments/${commentId}`, { content: newContent });
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        comments: p.comments.map(c => c.comment_id === commentId ? { ...c, content: res.data.comment.content } : c)
      } : p));
      Swal.fire({ icon: "success", title: t("Comment updated successfully"), timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await API.delete(`/posts/comments/${commentId}`);
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        comments: p.comments.filter(c => c.comment_id !== commentId)
      } : p));
      Swal.fire({ icon: "success", title: t("Comment deleted successfully"), timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = filterType === 'All' ? posts : posts.filter(p => p.type === filterType);

  if (loading) return <p>{t("Loading...")}</p>;
  if (error) return <p style={{ color: 'red' }}>{t("Error fetching posts")}</p>;

  return (
    <div className={`uni-feed ${darkMode ? 'dark-mode' : ''}`}>
      <div className="uni-header">
        <h2>{t("Opportunities")}</h2>
      </div>

      <div className="uni-filter">
        <label>{t("filterByType")}</label>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option>All</option>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="uni-posts">
        {filteredPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            handleLikeToggle={() => handleLikeToggle(post.id)}
            toggleComments={() => toggleComments(post.id)}
            handleAddComment={handleAddComment}
            handleEditComment={handleEditComment}
            handleDeleteComment={handleDeleteComment}
            zoomedImage={zoomedImage}
            setZoomedImage={setZoomedImage}
          />
        ))}
      </div>
    </div>
  );
};

const PostCard = ({ post, currentUser, handleLikeToggle, toggleComments, handleAddComment, handleEditComment, handleDeleteComment, zoomedImage, setZoomedImage }) => {
  const [showComments, setShowComments] = useState(post.showComments);
  const [newComment, setNewComment] = useState("");
  const { t } = useTranslation();

  return (
    <div className="uni-post-card">
      <div className="post-header">
        <img src={AdminPostsImg} alt="profile" className="profile-pic" />
        <div className="post-header-info">
          <strong>{post.authorName}</strong>
          <div className="post-date">{new Date(post.date).toLocaleString()}</div>
        </div>
        <span className="post-type-badge">{post.type}</span>
      </div>

      <div className="uni-post-body">
        <p>{post.content}</p>
        {post.images.length > 0 && (
          <div className="uni-post-images">
            {post.images.map((img, i) => (
              <img key={i} src={img} className="uni-post-preview" onClick={() => setZoomedImage(img)} />
            ))}
          </div>
        )}
      </div>

      <div className="uni-post-actions">
        <button className={post.liked ? 'uni-liked' : ''} onClick={handleLikeToggle}>
          <Heart size={16} /> {post.likes}
        </button>
        <button onClick={() => { toggleComments(); setShowComments(!showComments); }}>
          <MessageCircle size={16} /> {post.comments.length}
        </button>
        <button>
          <Share2 size={16} /> {post.shares}
        </button>
      </div>

      {showComments && (
        <div className="uni-comments-section">
          {post.comments.map(c => (
            <div key={c.comment_id} className="uni-comment-item">
              <img src={c.avatar} className="uni-comment-avatar" />
              <div className="uni-comment-text">
                <strong>{c.userName}</strong>: {c.content}
              </div>
              <div className="comment-date">
                {new Date(c.date).toLocaleString([], {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              {currentUser && c.user_id && Number(c.user_id) === Number(currentUser.id) && (
                <div className="comment-actions" style={{ marginLeft: "auto", display: "flex", gap: "5px" }}>
                  <button onClick={() => handleEditComment(post.id, c.comment_id, c.content)}><Edit size={14} /></button>
                  <button onClick={() => handleDeleteComment(post.id, c.comment_id)}><Trash2 size={14} /></button>
                </div>
              )}

              
            </div>
          ))}

          <div className="uni-comment-input">
            <input
              placeholder={t("writeComment")}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button onClick={() => handleAddComment(post.id, newComment, setNewComment)}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {zoomedImage && ReactDOM.createPortal(
        <div className="image-viewer-overlay">
          <div className="image-viewer-box">
            <button className="image-viewer-close" onClick={() => setZoomedImage(null)}>✕</button>
            <img src={zoomedImage} className="image-viewer-full" />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AlumniAdminPosts;
