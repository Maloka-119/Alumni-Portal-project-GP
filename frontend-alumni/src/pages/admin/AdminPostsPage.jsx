import React, { useState, useEffect } from 'react';
import './AdminPostsPage.css';
import AdminPostsImg from './AdminPosts.jpeg';
import { Heart, MessageCircle, Share2, Edit, Trash2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API from "../../services/api";
import CreatePostBar from '../../components/CreatePostBar'; 

const AdminPostsPage = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [types, setTypes] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [editingPostId, setEditingPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  // ====================== Format Posts بنفس منطق الصفحة الثانية ======================
  const formatPosts = (data) => {
    const filtered = (data || []).filter(p => !p['group-id']);
    
    return filtered.map(post => {
      const formattedComments = (post.comments || []).map((comment) => ({
        id: comment.comment_id,
        userName: comment.author?.["full-name"] || "Anonymous",
        content: comment.content,
        avatar: comment.author?.image || AdminPostsImg,
        date: comment["created-at"],
      }));

      return {
        id: post.post_id,
        content: post.content,
        likes: post.likes_count || 0,
        liked: false, // دائماً false في البداية - بنفس منطق الصفحة الثانية
        comments: formattedComments,
        date: new Date(post['created-at']).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        authorName: "Alumni Portal – Helwan University",
        shares: 0,
        type: post.category,
        images: post.images || [],
        showComments: false, // إضافة showComments بنفس منطق الصفحة الثانية
        author: {
          photo: AdminPostsImg
        }
      };
    });
  };

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('/posts/admin');
      if (response.data.status === "success") {
        setPosts(formatPosts(response.data.data));
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
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
        await API.post("/posts/create-post", formData);
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
    if (!window.confirm(t("confirmDelete"))) return;
    try {
      await API.delete(`/posts/${id}`);
      setSuccess(t("postDeleted"));
      fetchPosts();
    } catch (err) {
      console.error("Error deleting post", err);
      setError(t("deletePostFailed"));
    }
  };

  // ====================== Likes - نفس منطق الصفحة الثانية ======================
  const handleLike = async (postId) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    try {
      const post = posts[postIndex];
      
      // حاول عمل unlike أولاً (الأكثر احتمالاً)
      try {
        await API.delete(`/posts/${postId}/like`);
        // إذا نجح الـ unlike، هذا معناه أن البوست كان معجب بيه
        const updatedPosts = [...posts];
        updatedPosts[postIndex] = {
          ...post,
          likes: Math.max(0, post.likes - 1),
          liked: false
        };
        setPosts(updatedPosts);
        console.log("Successfully unliked post:", postId);
        
      } catch (unlikeError) {
        // إذا فشل الـ unlike، جرب like
        if (unlikeError.response?.data?.message?.includes('not found')) {
          await API.post(`/posts/${postId}/like`);
          const updatedPosts = [...posts];
          updatedPosts[postIndex] = {
            ...post,
            likes: post.likes + 1,
            liked: true
          };
          setPosts(updatedPosts);
          console.log("Successfully liked post:", postId);
        } else {
          throw unlikeError;
        }
      }
      
    } catch (err) {
      console.error("Error in handleLike:", err.response?.data || err);
      
      // في حالة أي خطأ، أعد جلب البيانات من السيرفر
      await fetchPosts();
    }
  };

  // ====================== Comments - نفس منطق الصفحة الثانية ======================
  const toggleComments = (postId) => {
    setPosts(prevPosts => prevPosts.map(p => 
      p.id === postId ? { ...p, showComments: !p.showComments } : p
    ));
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  const handleCommentSubmit = async (postId) => {
    const comment = commentInputs[postId];
    if (!comment) return;
  
    try {
      const res = await API.post(`/posts/${postId}/comments`, { content: comment });
  
      console.log("Comment response from backend:", res.data);
  
      // ✅ ضيف الكومينت الجديد مباشرة في الـ state
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId
            ? {
                ...p,
                comments: [
                  ...(p.comments || []),
                  {
                    id: res.data.comment.comment_id,
                    userName: res.data.comment.author?.["full-name"] || "Admin",
                    content: res.data.comment.content,
                    avatar: res.data.comment.author?.image || AdminPostsImg, // ⬅️ التصحيح هنا
                    date: new Date().toLocaleString(),
                    "created-at": res.data.comment["created-at"]
                  }
                ]
              }
            : p
        )
      );
  
      // ✅ امسح حقل الكتابة بعد الإرسال
      setCommentInputs({ ...commentInputs, [postId]: '' });
  
    } catch (err) {
      console.error("Error submitting comment:", err);
    }
  };

  // ✅ الرسائل تختفي بعد ثانيتين
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const filteredPosts = filterType === 'All'
    ? posts
    : posts.filter(p => p.type === filterType);

  return (
    <div className="feed-container">
      <h2 className="page-title">{t('Manage Alumni Posts')}</h2>

      {loading && <p>{t('loadingPosts')}</p>}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <CreatePostBar
        types={types}
        editingPost={posts.find(p => p.id === editingPostId) || null}
        onSubmit={(formData, postId) => handleCreateOrEdit(formData, postId)}
      />

      {!loading && !error && (
        <>
          <div className="filter-bar">
            <label>{t('Filter by type:')}</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">{t('All')}</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="posts-feed">
            {filteredPosts.length === 0 ? (
              <p className="no-posts">{t('noPosts')}</p>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <img src={post.author?.photo || AdminPostsImg} alt="profile" className="profile-pic" />
                    <div className="post-header-info">
                      <strong>{post.authorName}</strong>
                      <div className="post-date">
                        {post.date}
                        {post['group-id'] ? ' - In Group' : ''}
                      </div>
                    </div>
                    <span className="post-type-badge">{post.type}</span>
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
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post Actions - بنفس تصميم الصفحة الثانية */}
                  <div className="post-actions">
                    <button 
                      className={post.liked ? "liked" : ""}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart 
                        size={16} 
                      /> 
                      {post.likes}
                    </button>
                    <button onClick={() => toggleComments(post.id)}>
                      <MessageCircle size={16} /> {post.comments?.length || 0}
                    </button>
                    <button>
                      <Share2 size={16} /> {post.shares || 0}
                    </button>
                    <button onClick={() => setEditingPostId(post.id)} className="edit-btn">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="delete-btn">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Comments Section - تظهر فقط عندما showComments = true */}
                  {post.showComments && (
                    <div className="comments-section">
                      <div className="existing-comments">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="comment-item">
                            <img
                              src={comment.avatar || AdminPostsImg}
                              alt={comment.userName}
                              className="comment-avatar"
                            />
                            <div className="comment-text">
                              <strong>{comment.userName}</strong>: {comment.content}
                            </div>
                            <div className="comment-date">
                              {new Date(comment["created-at"]).toLocaleString([], {
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
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ""}
                          onChange={(e) => handleCommentChange(post.id, e.target.value)}
                        />
                        <button onClick={() => handleCommentSubmit(post.id)}>
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPostsPage;
// import React, { useState, useEffect } from 'react';
// import './AdminPostsPage.css';
// import AdminPostsImg from './AdminPosts.jpeg';
// import { Heart, MessageCircle, Share2, Edit, Trash2, Image } from 'lucide-react';
// import { useTranslation } from 'react-i18next';
// import API from "../../services/api";

// const AdminPostsPage = () => {
//   const { t } = useTranslation();
//   const [showForm, setShowForm] = useState(false);
//   const [posts, setPosts] = useState([]);
//   const [types, setTypes] = useState([]);
//   const [filterType, setFilterType] = useState('All');
//   const [editingPostId, setEditingPostId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);

//   useEffect(() => {
//     fetchPosts();
//     fetchCategories();
//   }, []);

//   const fetchPosts = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await API.get('/posts/admin');
//       console.log("📦 Response from backend:", response.data);
      
//       const postsWithImages = response.data.data.map(post => ({
//         ...post,
//         id: post.post_id,
//         images: post.images || [],
//       }));
      
//       setPosts(postsWithImages);
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

//   const handleSubmitPost = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setSuccess(null);
  
//     const formData = new FormData();
//     formData.append("content", e.target.content.value);
//     formData.append("type", e.target.type.value);
//     if (e.target.image.files[0]) formData.append("images", e.target.image.files[0]);
    
//     try {
//       if (editingPostId) {
//         await API.put(`/posts/${editingPostId}/edit`, formData, {
//           headers: { 'Content-Type': 'multipart/form-data' },
//         });
//         setSuccess(t("postUpdated"));
//       } else {
//         await API.post("/posts/create-post", formData);
//         setSuccess(t("postCreated"));
//       }
      
//       fetchPosts();
//       setShowForm(false);
//       setEditingPostId(null);
//       e.target.reset();
//     } catch (err) {
//       console.error("❌ Error saving post", err);
//       setError(err.response?.data?.message || t("savePostFailed"));
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm(t("confirmDelete"))) return;
    
//     try {
//       await API.delete(`/posts/${id}`);
//       setSuccess(t("postDeleted"));
//       fetchPosts();
//     } catch (err) {
//       console.error("Error deleting post", err);
//       setError(t("deletePostFailed"));
//     }
//   };

//   const handleLikePost = async (post) => {
//     try {
//       await API.post(`/posts/${post.id}/like`);
//       setPosts(prev =>
//         prev.map(p =>
//           p.post_id === post.post_id
//             ? { ...p, likes: Array.isArray(p.likes) ? [...p.likes, { temp: true }] : (p.likes || 0) + 1 }
//             : p
//         )
//       );
//     } catch (err) {
//       console.error("Failed to like post", err);
//     }
//   };

//   const handleEdit = (post) => {
//     setShowForm(true);
//     setEditingPostId(post.post_id);

//     setTimeout(() => {
//       const contentField = document.querySelector('textarea[name="content"]');
//       const categoryField = document.querySelector('select[name="category"]');
//       if (contentField) contentField.value = post.content || '';
//       if (categoryField) categoryField.value = post.category || '';
//     }, 100);
//   };

//   const filteredPosts = filterType === 'All'
//     ? posts
//     : posts.filter(p => p.category === filterType);

//   return (
//     <div className="feed-container">
//       <h2 className="page-title">{t('Manage Alumni Posts')}</h2>

//       {loading && <p>{t('loadingPosts')}</p>}
//       {error && <div className="error-message">{error}</div>}
//       {success && <div className="success-message">{success}</div>}

//       <div className="create-post-bar" onClick={() => setShowForm(true)}>
//         <input placeholder={t('Create new post...')} className="post-input" readOnly />
//       </div>

//       {showForm && (
//         <form onSubmit={handleSubmitPost} className="compact-post-form">
//           <textarea 
//             name="content"
//             placeholder={t('Post Content')}
//             required
//             className="input-field"
//             rows="4"
//           />
//           <select name="type" required className="input-field" defaultValue={types[0] || ''}>
//             {types.map(type => <option key={type} value={type}>{type}</option>)}
//           </select>
          
//           <div className="optional-icons">
//             <label title={t('Add Image')}>
//               <input type="file" name="image" accept="image/*" style={{ display: 'none' }} />
//               <Image size={20} />
//             </label>
//           </div>

//           <div className="form-buttons">
//             <button type="submit" className="submit-btn">
//               {editingPostId ? t('Update') : t('Post')}
//             </button>
//             <button 
//               type="button" 
//               className="cancel-btn"
//               onClick={() => { setShowForm(false); setEditingPostId(null); }}
//             >
//               {t('Cancel')}
//             </button>
//           </div>
//         </form>
//       )}

//       {!loading && !error && (
//         <>
//           <div className="filter-bar">
//             <label>{t('Filter by type:')}</label>
//             <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
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
//                     <img src={AdminPostsImg} alt="profile" className="profile-pic" />
//                     <div className="post-header-info">
//                       <strong>Alumni Portal – Helwan University</strong>
//                       <div className="post-date">
//                         {new Date(post['created-at']).toLocaleString()}
//                       </div>
//                     </div>
//                     <span className="post-type-badge">{post.category}</span>
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
//                             onError={(e) => {
//                               console.error(`❌ Failed to load image: ${imgUrl}`);
//                               e.target.style.display = 'none';
//                             }}
//                           />
//                         ))}
//                       </div>
//                     )}
//                   </div>

//                   <div className="post-actions">
//                     <button onClick={() => handleLikePost(post)}>
//                       <Heart size={16} /> {Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)}
//                     </button>
//                     <button>
//                       <MessageCircle size={16} /> {post.comments?.length || 0}
//                     </button>
//                     <button>
//                       <Share2 size={16} /> {post.shares || 0}
//                     </button>
//                     <button onClick={() => handleEdit(post)} className="edit-btn">
//                       <Edit size={16} />
//                     </button>
//                     <button onClick={() => handleDelete(post.id)} className="delete-btn">
//                       <Trash2 size={16} />
//                     </button>
//                   </div>
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