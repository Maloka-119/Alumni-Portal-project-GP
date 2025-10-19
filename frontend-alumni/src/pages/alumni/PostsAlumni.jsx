import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Image, FileText, Link as LinkIcon, Trash2, MoreVertical, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './AlumniAdminPosts.css';
import API from "../../services/api";
import PROFILE from './PROFILE.jpeg';

const PostsAlumni = ({ user: propUser }) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [newPost, setNewPost] = useState({ content: '', image: null, file: null, link: '', category: 'General' });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const token = localStorage.getItem("token");

  const formatPosts = (data) => {
    return data
      .sort((a, b) => new Date(b['created-at']) - new Date(a['created-at']))
      .map(post => ({
        ...post,
        id: post.id || post.post_id,
        date: post['created-at'],
        comments: post.comments || [],
        images: post.images || [],
        likes: post.likes || 0,
        liked: post.liked || false,
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

  const handleAddPost = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!token) {
      setError("You must be logged in to post");
      return;
    }

    if (!newPost.content && !newPost.image && !newPost.file && !newPost.link) {
      setError("Post cannot be empty");
      return;
    }

    const formData = new FormData();
    formData.append('content', newPost.content);
    formData.append('type', newPost.category);
    if (newPost.image) formData.append('images', newPost.image);

    try {
      const res = await API.post('/posts/create-post', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      await fetchPosts();
      setSuccessMsg("Post created successfully");
      setNewPost({ content: '', category: 'General', image: null, file: null, link: '' });
      setShowForm(false);
      setShowLinkInput(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post");
    }
  };

  const handleEdit = async (postId, content, link) => {
    if (!token) return;
    try {
      const res = await API.patch(`/posts/${postId}`, { content, link }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updated = res.data.data;
      setPosts(posts.map(p => (p.id === updated.id ? formatPosts([updated])[0] : p)));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
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

  const handleLikeToggle = async (postId) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const post = posts[postIndex];

    try {
      const updatedPosts = [...posts];

      if (post.liked) {
        await API.delete(`/posts/${postId}/like`, { headers: { Authorization: `Bearer ${token}` } });
        updatedPosts[postIndex].likes -= 1;
        updatedPosts[postIndex].liked = false;
      } else {
        await API.post(`/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
        updatedPosts[postIndex].likes += 1;
        updatedPosts[postIndex].liked = true;
      }

      setPosts(updatedPosts);
    } catch (err) {
      console.error("Error toggling like:", err.response?.data || err);
    }
  };

  const openComments = (post) => setSelectedPost(post);
  const closeComments = () => { setSelectedPost(null); setNewComment(''); };

  const handleAddComment = async () => {
    if (!token || !newComment.trim() || !selectedPost) return;
    try {
      const res = await API.post(`/posts/${selectedPost.id}/comment`, { content: newComment }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updatedPost = res.data.data;
      setPosts(posts.map(p => (p.id === updatedPost.id ? formatPosts([updatedPost])[0] : p)));
      setSelectedPost(formatPosts([updatedPost])[0]);
      setNewComment('');
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

          <div className="am-create-bar" onClick={() => setShowForm(true)}>
            <input placeholder={t('createNewPost')} readOnly />
          </div>

          {showForm && (
            <form className="uni-post-form" onSubmit={handleAddPost}>
              <textarea
                placeholder={t('writePost')}
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={4}
              />
              <div className="uni-category-select">
                <label>Category:</label>
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
                  <input type="file" style={{ display: 'none' }} onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })} />
                  <Image size={20} />
                </label>
              </div>
              <div className="uni-form-buttons">
                <button type="submit">{t('post')}</button>
                <button type="button" onClick={() => { setShowForm(false); setShowLinkInput(false); }}>{t('cancel')}</button>
              </div>
            </form>
          )}

          {!loading && posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={(content, link) => handleEdit(post.id, content, link)}
              onDelete={() => handleDelete(post.id)}
              onOpenComments={() => openComments(post)}
              onLike={handleLikeToggle}
            />
          ))}

          {selectedPost && (
            <div className="comments-modal">
              <div className="comments-container">
                <div className="comments-header">
                  <span>{t('comments')}</span>
                  <button className="comments-close-btn" onClick={closeComments}>X</button>
                </div>
                <div className="comments-list">
                  {selectedPost.comments.map(c => (
                    <div key={c.id} className="comment-item">
                      <img src={c.user?.photo || PROFILE} alt="avatar" className="comment-avatar" />
                      <div className="comment-text">
                        <strong>{c.user?.name || t('unknown')}</strong>
                        <p>{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="comment-input">
                  <input
                    placeholder={t('writeComment')}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button onClick={handleAddComment}>{t('send')}</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const PostCard = ({ post, onEdit, onDelete, onOpenComments, onLike }) => {
  const { t } = useTranslation();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editLink, setEditLink] = useState(post.link || '');

  return (
    <div className={`uni-post-card ${post['is-hidden'] ? 'is-hidden' : ''}`}>
      <div className="uni-post-header">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <img src={post.author?.photo || PROFILE} className="profile-pic" alt="profile" />
          <strong>{post.author?.name || t('unknown')}</strong>
          <div className="uni-post-date">
            {new Date(post.date).toLocaleString()} - {post.category}
          </div>
        </div>
        <div className="post-actions-dropdown">
          <button className="more-btn" onClick={() => setOpenDropdown(!openDropdown)}>
            <MoreVertical size={20} />
          </button>
          {openDropdown && (
            <div className="dropdown-menu">
              <button onClick={() => { setIsEditing(true); setOpenDropdown(false); }}>
                <Edit size={16} /> {t('edit')}
              </button>
              <button onClick={() => { onDelete(); setOpenDropdown(false); }}>
                <Trash2 size={16} /> {t('delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="uni-post-body">
        {isEditing ? (
          <>
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            <input value={editLink} onChange={(e) => setEditLink(e.target.value)} placeholder={t('editLink')} />
            <button onClick={() => { onEdit(editContent, editLink); setIsEditing(false); }}>{t('save')}</button>
            <button onClick={() => setIsEditing(false)}>{t('cancel')}</button>
          </>
        ) : (
          <>
            <p>{post.content}</p>
            {post.images && post.images.length > 0 && (
              <div className="uni-post-images">
                {post.images.map((imgUrl, index) => (
                  <img key={index} src={imgUrl} alt={`post-${index}`} className="uni-post-preview" />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="uni-post-actions">
        <button onClick={() => onLike(post.id)}>
          <Heart
            size={16}
            color={post.liked ? 'red' : 'black'}
            fill={post.liked ? 'red' : 'none'}
          />
          {post.likes}
        </button>
        <button onClick={onOpenComments}><MessageCircle size={16} /> {post.comments.length}</button>
        <button><Share2 size={16} /> {post.shares}</button>
      </div>
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
//     console.log("📦 Full backend response:", data);
//     return data
//       .sort((a, b) => new Date(b['created-at']) - new Date(a['created-at']))
//       .map(post => {
//         return {
//           ...post,
//           id: post.id || post.post_id,
//           date: post['created-at'],
//           comments: post.comments || [],
//           images: post.images || [],
//           author: {
//             id: post.author?.id,
//             name: post.author?.['full-name'] || 'Unknown',
//             photo: post.author?.image || PROFILE
//           }
//         };
//       });
//   };

//   const fetchPosts = async () => {
//     if (!token) return;
//     try {
//       setLoading(true);
//       setError(null);
//       const res = await API.get('/posts/my-graduate-posts', {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });

//       console.log("🧾 Raw backend response:", res.data);
//       console.log("📄 Data array:", res.data.data);

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
//       console.log("✅ Post created response:", res.data);
//       await fetchPosts();
//       setSuccessMsg("Post created successfully");
//       setNewPost({ content: '', category: 'General', image: null, file: null, link: '' });
//       setShowForm(false);
//       setShowLinkInput(false);
//     } catch (err) {
//       console.error("❌ Error creating post:", err);
//       setError(err.response?.data?.message || "Failed to create post");
//     }
//   };

//   const handleEdit = async (postId, content, link) => {
//     if (!token) return;
//     try {
//       const res = await API.patch(`/posts/${postId}`, { content, link }, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       console.log("✏️ Edit post response:", res.data);
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
//       console.log(`🗑️ Post ${postId} deleted`);
//       setPosts(posts.filter(p => p.id !== postId));
//     } catch (err) {
//       setError(err.response?.data?.message || err.message);
//     }
//   };

// const handleLikeToggle= async (postId) => {
//   const postIndex = posts.findIndex(p => p.id === postId);
//   const post = posts[postIndex];

//   try {
//     if (post.liked) {
//       // لو عمل like قبل كده، اشيله
//       await API.delete(`/posts/${postId}/like`);
//       const updatedPosts = [...posts];
//       updatedPosts[postIndex].likes -= 1;
//       updatedPosts[postIndex].liked = false;
//       setPosts(updatedPosts);
//     } else {
//       // لو ما عملش like، اعمله
//       await API.post(`/posts/${postId}/like`);
//       const updatedPosts = [...posts];
//       updatedPosts[postIndex].likes += 1;
//       updatedPosts[postIndex].liked = true;
//       setPosts(updatedPosts);
//     }
//   } catch (err) {
//     console.error("Error toggling like:", err.response?.data || err);
//   }
// };
//   const openComments = (post) => setSelectedPost(post);
//   const closeComments = () => { setSelectedPost(null); setNewComment(''); };

//   const handleAddComment = async () => {
//     if (!token || !newComment.trim() || !selectedPost) return;
//     try {
//       const res = await API.post(`/posts/${selectedPost.id}/comment`, { content: newComment }, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       console.log("💬 New comment response:", res.data);
//       const updatedPost = res.data.data;
//       setPosts(posts.map(p => (p.id === updatedPost.id ? formatPosts([updatedPost])[0] : p)));
//       setSelectedPost(formatPosts([updatedPost])[0]);
//       setNewComment('');
//     } catch (err) {
//       setError(err.response?.data?.message || err.message);
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
//               onLike={() => handleLikeToggle(post)}
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
//                   {selectedPost.comments.map(c => (
//                     <div key={c.id} className="comment-item">
//                       <img src={c.user?.photo || PROFILE} alt="avatar" className="comment-avatar" />
//                       <div className="comment-text">
//                         <strong>{c.user?.name || t('unknown')}</strong>
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
//       {post['is-hidden'] && <div className="hidden-label"></div>}

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
//                   <img
//                     key={index}
//                     src={imgUrl}
//                     alt={`post-${index}`}
//                     className="uni-post-preview"
//                   />
//                 ))}
//               </div>
//             )}
            
//           </>
//         )}
//       </div>

//       <div className="uni-post-actions">
//         <button onClick={onLike}><Heart size={16} /> {post.likes}</button>
//         <button onClick={onOpenComments}><MessageCircle size={16} /> {post.comments.length}</button>
//         <button><Share2 size={16} /> {post.shares}</button>
//       </div>
//     </div>
//   );
// };

// export default PostsAlumni;


