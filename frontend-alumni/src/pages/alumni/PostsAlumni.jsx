import React, { useState, useEffect } from 'react';
import { Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './AlumniAdminPosts.css';
import API from "../../services/api";
import PROFILE from './PROFILE.jpeg';
import PostCard from '../../components/PostCard'; 

const PostsAlumni = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [newPost, setNewPost] = useState({
    content: '',
    image: null,
    link: '',
    category: 'General'
  });
  const [editingPostId, setEditingPostId] = useState(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setError(null);
      }, 1500); 
  
      return () => clearTimeout(timer);
    }
  }, [successMsg, error]);
  

  const formatPosts = (data) => {
    return data
      .sort((a, b) => new Date(b['created-at']) - new Date(a['created-at']))
      .map(post => ({
        ...post,
        id: post.id || post.post_id,
        date: new Date(post['created-at']).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        comments: post.comments || [],
        likes: post.likes_count || 0,
        author: {
          id: post.author?.id,
          name: post.author?.['full-name'] || 'Unknown',
          photo: post.author?.image || PROFILE
        }
      }));
  };

  const fetchPosts = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await API.get('/posts/my-graduate-posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPosts(formatPosts(res.data.data));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  const handleAddOrEditPost = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!token) {
      setError("Login first");
      return;
    }

    if (!newPost.content && !newPost.image) {
      setError("Post cannot be empty");
      return;
    }

    const formData = new FormData();
    formData.append('content', newPost.content);
    formData.append('type', newPost.category);
    if (newPost.image) formData.append('images', newPost.image);

    try {
      if (isEditingMode && editingPostId) {
        await API.put(`/posts/${editingPostId}/edit`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccessMsg("Post updated");
      } else {
        await API.post('/posts/create-post', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccessMsg("Post created");
      }

      await fetchPosts();
      setNewPost({ content: '', category: 'General', image: null, link: '' });
      setShowForm(false);
      setEditingPostId(null);
      setIsEditingMode(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save post");
    }
  };

  const handleEditPostClick = (post) => {
    setShowForm(true);
    setIsEditingMode(true);
    setEditingPostId(post.id);
    setNewPost({
      content: post.content || '',
      category: post.category || 'General',
      image: null,
      link: post.link || ''
    });
  };

  const handleDelete = async (postId) => {
    if (!token) return;
    try {
      await API.delete(`/posts/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="uni-feed">
      {!user && <div>{t('pleaseLogin')}</div>}

      {user && (
        <>
          <h2 className="uni-header">{t('myPosts')}</h2>

          {successMsg && <div style={{ color: 'green' }}>{successMsg}</div>}
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {loading && <div>{t('loadingPosts')}</div>}
          {!loading && posts.length === 0 && <div>{t('noPosts')}</div>}

          <div className="am-create-bar" onClick={() => {
            setShowForm(true);
            setIsEditingMode(false);
            setNewPost({ content: '', image: null, link: '', category: 'General' });
          }}>
            <input placeholder={t('createNewPost')} readOnly />
          </div>

          {showForm && (
            <form className="uni-post-form" onSubmit={handleAddOrEditPost}>
              <textarea
                placeholder={t('writePost')}
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={4}
              />
              <div className="uni-category-select">
                <label>{t('category')}:</label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Internship">Internship</option>
                  <option value="Success story">Success story</option>
                </select>
              </div>
              <div className="uni-optional-icons">
                <label title={t('addImage')}>
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })}
                  />
                  <Image size={20} />
                </label>
              </div>
              <div className="uni-form-buttons">
                <button type="submit">
                  {isEditingMode ? t('update') : t('post')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setIsEditingMode(false);
                    setNewPost({ content: '', image: null, link: '', category: 'General' });
                  }}
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          )}

          {!loading && posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={() => handleEditPostClick(post)}
              onDelete={() => handleDelete(post.id)}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default PostsAlumni;

// import React, { useState, useEffect } from 'react';
// import { Heart, MessageCircle, Share2, Image, FileText, Link as LinkIcon, Trash2, MoreVertical, Edit } from 'lucide-react';
// import { useTranslation } from 'react-i18next';
// import './AlumniAdminPosts.css';
// import API from "../../services/api";
// import PROFILE from './PROFILE.jpeg';

// const PostsAlumni = ({ user: propUser }) => {
//   const { t } = useTranslation();
//   const [showForm, setShowForm] = useState(false);
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [successMsg, setSuccessMsg] = useState(null);
//   const [newPost, setNewPost] = useState({ content: '', image: null, file: null, link: '', category: 'General' });
//   const [showLinkInput, setShowLinkInput] = useState(false);
//   const [selectedPost, setSelectedPost] = useState(null);
//   const [newComment, setNewComment] = useState('');

//   const user = JSON.parse(localStorage.getItem("user")) || null;
//   const token = localStorage.getItem("token");

//   const formatPosts = (data) => {
//     return data
//       .sort((a, b) => new Date(b['created-at']) - new Date(a['created-at']))
//       .map(post => ({
//         ...post,
//         id: post.id || post.post_id,
//         date: post['created-at'],
//         comments: post.comments || [],
//         images: post.images || [],
//         // ⬇️⬇️⬇️ نفس منطق HomeAlumni ⬇️⬇️⬇️
//         likes: post.likes_count || 0,
//         liked: false, // ⬅️ دائماً false في البداية
//         shares: 0,
//         author: {
//           id: post.author?.id,
//           name: post.author?.['full-name'] || 'Unknown',
//           photo: post.author?.image || PROFILE
//         }
//       }));
//   };

//   const fetchPosts = async () => {
//     if (!token) return;
//     try {
//       setLoading(true);
//       const res = await API.get('/posts/my-graduate-posts', {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       setPosts(formatPosts(res.data.data));
//     } catch (err) {
//       setError(err.response?.data?.message || err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (token) fetchPosts();
//   }, [token]);

//   const handleAddPost = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setSuccessMsg(null);

//     if (!token) {
//       setError("You must be logged in to post");
//       return;
//     }

//     if (!newPost.content && !newPost.image && !newPost.file && !newPost.link) {
//       setError("Post cannot be empty");
//       return;
//     }

//     const formData = new FormData();
//     formData.append('content', newPost.content);
//     formData.append('type', newPost.category);
//     if (newPost.image) formData.append('images', newPost.image);

//     try {
//       const res = await API.post('/posts/create-post', formData, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'multipart/form-data'
//         }
//       });
//       await fetchPosts();
//       setSuccessMsg("Post created successfully");
//       setNewPost({ content: '', category: 'General', image: null, file: null, link: '' });
//       setShowForm(false);
//       setShowLinkInput(false);
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to create post");
//     }
//   };

//   const handleEdit = async (postId, content, link) => {
//     if (!token) return;
//     try {
//       const res = await API.patch(`/posts/${postId}`, { content, link }, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       const updated = res.data.data;
//       setPosts(posts.map(p => (p.id === updated.id ? formatPosts([updated])[0] : p)));
//     } catch (err) {
//       setError(err.response?.data?.message || err.message);
//     }
//   };

//   const handleDelete = async (postId) => {
//     if (!token) return;
//     try {
//       await API.delete(`/posts/${postId}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       setPosts(posts.filter(p => p.id !== postId));
//     } catch (err) {
//       setError(err.response?.data?.message || err.message);
//     }
//   };

//   // ⬇️⬇️⬇️ نفس منطق HomeAlumni للـ like ⬇️⬇️⬇️
//   const handleLikeToggle = async (postId) => {
//     const postIndex = posts.findIndex(p => p.id === postId);
//     if (postIndex === -1) return;

//     try {
//       const post = posts[postIndex];
      
//       // حاول unlike أولاً
//       try {
//         await API.delete(`/posts/${postId}/like`, { headers: { Authorization: `Bearer ${token}` } });
//         // إذا نجح الـ unlike، هذا معناه أن البوست كان معجب بيه
//         const updatedPosts = [...posts];
//         updatedPosts[postIndex] = {
//           ...post,
//           likes: Math.max(0, post.likes - 1),
//           liked: false
//         };
//         setPosts(updatedPosts);
//         console.log("✅ Successfully unliked post:", postId);
        
//       } catch (unlikeError) {
//         // إذا فشل الـ unlike، جرب like
//         if (unlikeError.response?.status === 404) {
//           await API.post(`/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
//           const updatedPosts = [...posts];
//           updatedPosts[postIndex] = {
//             ...post,
//             likes: post.likes + 1,
//             liked: true
//           };
//           setPosts(updatedPosts);
//           console.log("✅ Successfully liked post:", postId);
//         } else {
//           throw unlikeError;
//         }
//       }
      
//     } catch (err) {
//       console.error("🔴 Error in handleLikeToggle:", err.response?.data || err);
//       // في حالة أي خطأ، أعد جلب البيانات من السيرفر
//       await fetchPosts();
//     }
//   };

//   const openComments = (post) => setSelectedPost(post);
//   const closeComments = () => { setSelectedPost(null); setNewComment(''); };

//   // ⬇️⬇️⬇️ نفس منطق HomeAlumni للكومنتات ⬇️⬇️⬇️
//   const handleAddComment = async () => {
//     if (!token || !newComment.trim() || !selectedPost) return;
    
//     try {
//       const res = await API.post(`/posts/${selectedPost.id}/comments`, { content: newComment }, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });

//       if (res.data.comment) {
//         const newCommentObj = {
//           userName: res.data.comment.author?.['full-name'] || "You",
//           content: res.data.comment.content,
//           avatar: PROFILE,
//           date: new Date().toLocaleString()
//         };

//         // تحديث فوري للكومنتات
//         setPosts(prev => prev.map(post => 
//           post.id === selectedPost.id 
//             ? { ...post, comments: [...post.comments, newCommentObj] }
//             : post
//         ));

//         // تحديث الـ selectedPost
//         setSelectedPost(prev => prev ? {
//           ...prev,
//           comments: [...prev.comments, newCommentObj]
//         } : null);
//       }

//       setNewComment('');
//     } catch (err) {
//       console.error("🔴 Error submitting comment:", err.response?.data || err);
//       setError(err.response?.data?.message || "Failed to add comment");
//     }
//   };

//   return (
//     <div className="uni-feed">
//       {!user && <div>{t('pleaseLogin')}</div>}
//       {user && (
//         <>
//           <h2 className="uni-header">{t('myPosts')}</h2>

//           {successMsg && <div style={{ color: 'green' }}>{successMsg}</div>}
//           {error && <div style={{ color: 'red' }}>{error}</div>}
//           {loading && <div>{t('loadingPosts')}</div>}
//           {!loading && posts.length === 0 && <div>{t('noPosts')}</div>}

//           <div className="am-create-bar" onClick={() => setShowForm(true)}>
//             <input placeholder={t('createNewPost')} readOnly />
//           </div>

//           {showForm && (
//             <form className="uni-post-form" onSubmit={handleAddPost}>
//               <textarea
//                 placeholder={t('writePost')}
//                 value={newPost.content}
//                 onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
//                 rows={4}
//               />
//               <div className="uni-category-select">
//                 <label>Category:</label>
//                 <select
//                   value={newPost.category}
//                   onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
//                 >
//                   <option value="General">General</option>
//                   <option value="Internship">Internship</option>
//                   <option value="Success story">Success story</option>
//                 </select>
//               </div>
//               <div className="uni-optional-icons">
//                 <label title={t('addImage')}>
//                   <input type="file" style={{ display: 'none' }} onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })} />
//                   <Image size={20} />
//                 </label>
//               </div>
//               <div className="uni-form-buttons">
//                 <button type="submit">{t('post')}</button>
//                 <button type="button" onClick={() => { setShowForm(false); setShowLinkInput(false); }}>{t('cancel')}</button>
//               </div>
//             </form>
//           )}

//           {!loading && posts.map(post => (
//             <PostCard
//               key={post.id}
//               post={post}
//               onEdit={(content, link) => handleEdit(post.id, content, link)}
//               onDelete={() => handleDelete(post.id)}
//               onOpenComments={() => openComments(post)}
//               onLike={handleLikeToggle}
//             />
//           ))}

//           {selectedPost && (
//             <div className="comments-modal">
//               <div className="comments-container">
//                 <div className="comments-header">
//                   <span>{t('comments')}</span>
//                   <button className="comments-close-btn" onClick={closeComments}>X</button>
//                 </div>
//                 <div className="comments-list">
//                   {selectedPost.comments.map((c, idx) => (
//                     <div key={c.comment_id || c.id || idx} className="comment-item">
//                       <img src={c.avatar || c.author?.image || PROFILE} alt="avatar" className="comment-avatar" />
//                       <div className="comment-text">
//                         <strong>{c.userName || c.author?.['full-name'] || t('unknown')}</strong>
//                         <p>{c.content}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="comment-input">
//                   <input
//                     placeholder={t('writeComment')}
//                     value={newComment}
//                     onChange={(e) => setNewComment(e.target.value)}
//                   />
//                   <button onClick={handleAddComment}>{t('send')}</button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// const PostCard = ({ post, onEdit, onDelete, onOpenComments, onLike }) => {
//   const { t } = useTranslation();
//   const [openDropdown, setOpenDropdown] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editContent, setEditContent] = useState(post.content);
//   const [editLink, setEditLink] = useState(post.link || '');

//   return (
//     <div className={`uni-post-card ${post['is-hidden'] ? 'is-hidden' : ''}`}>
//       <div className="uni-post-header">
//         <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
//           <img src={post.author?.photo || PROFILE} className="profile-pic" alt="profile" />
//           <strong>{post.author?.name || t('unknown')}</strong>
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
//                 <Edit size={16} /> {t('edit')}
//               </button>
//               <button onClick={() => { onDelete(); setOpenDropdown(false); }}>
//                 <Trash2 size={16} /> {t('delete')}
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="uni-post-body">
//         {isEditing ? (
//           <>
//             <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
//             <input value={editLink} onChange={(e) => setEditLink(e.target.value)} placeholder={t('editLink')} />
//             <button onClick={() => { onEdit(editContent, editLink); setIsEditing(false); }}>{t('save')}</button>
//             <button onClick={() => setIsEditing(false)}>{t('cancel')}</button>
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
//         <button 
//           className={post.liked ? 'uni-liked' : ''} 
//           onClick={() => onLike(post.id)}
//         >
//           <Heart
//             size={16}
//             color={post.liked ? 'red' : 'black'}
//             fill={post.liked ? 'red' : 'none'}
//           />
//           {post.likes}
//         </button>
//         <button onClick={onOpenComments}>
//           <MessageCircle size={16} /> 
//           {post.comments.length}
//         </button>
//         <button>
//           <Share2 size={16} /> 
//           {post.shares}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default PostsAlumni;