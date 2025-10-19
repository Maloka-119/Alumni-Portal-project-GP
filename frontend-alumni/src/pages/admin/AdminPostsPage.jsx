import React, { useState, useEffect } from 'react';
import './AdminPostsPage.css';
import AdminPostsImg from './AdminPosts.jpeg';
import { Heart, MessageCircle, Share2, Edit, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('/posts/admin');
      const postsWithImages = response.data.data.map(post => ({
        ...post,
        id: post.post_id,
        images: post.images || [],
      }));
      setPosts(postsWithImages);
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

  const handleLikePost = async (post) => {
    try {
      await API.post(`/posts/${post.id}/like`);
      setPosts(prev =>
        prev.map(p =>
          p.post_id === post.post_id
            ? { ...p, likes: Array.isArray(p.likes) ? [...p.likes, {}] : (p.likes || 0) + 1 }
            : p
        )
      );
    } catch (err) {
      console.error("Failed to like post", err);
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
    : posts.filter(p => p.category === filterType);

  return (
    <div className="feed-container">
      <h2 className="page-title">{t('Manage Alumni Posts')}</h2>

      {loading && <p>{t('loadingPosts')}</p>}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <CreatePostBar
        types={types}
        editingPost={posts.find(p => p.post_id === editingPostId) || null}
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
                    <img src={AdminPostsImg} alt="profile" className="profile-pic" />
                    <div className="post-header-info">
                      <strong>Alumni Portal – Helwan University</strong>
                      <div className="post-date">
                        {new Date(post['created-at']).toLocaleString()}
                        {post['group-id'] ? ' - In Group' : ''}
                      </div>
                    </div>
                    <span className="post-type-badge">{post.category}</span>
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

                  <div className="post-actions">
                    <button onClick={() => handleLikePost(post)}>
                      <Heart size={16} /> {Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)}
                    </button>
                    <button>
                      <MessageCircle size={16} /> {post.comments?.length || 0}
                    </button>
                    <button>
                      <Share2 size={16} /> {post.shares || 0}
                    </button>
                    <button onClick={() => setEditingPostId(post.post_id)} className="edit-btn">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="delete-btn">
                      <Trash2 size={16} />
                    </button>
                  </div>
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