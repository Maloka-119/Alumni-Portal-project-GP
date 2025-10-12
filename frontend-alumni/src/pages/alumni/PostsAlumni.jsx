import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Image, FileText, Link as LinkIcon, Trash2, MoreVertical, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './AlumniAdminPosts.css';
import API from "../../services/api";
import PROFILE from './PROFILE.jpeg'

const PostsAlumni = ({ user: propUser }) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [newPost, setNewPost] = useState({ content: '', image: null, file: null, link: '' , category: 'General' });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const token = localStorage.getItem("token"); 

  const formatPosts = (data) => {
    return data
      .sort((a, b) => new Date(b['created-at']) - new Date(a['created-at']))
      .map(post => {
        console.log(`📋 Formatting post ${post.id || post.post_id}:`, {
          id: post.id || post.post_id,
          images: post.images,
          hasImages: !!post.images,
          imagesCount: post.images?.length || 0,
          rawPost: post // 🆕 علشان نشوف شكل البيانات كامل
        });
        
        return {
          ...post,
          id: post.id || post.post_id, // تأكد من الـ ID
          date: post['created-at'],
          comments: post.comments || [],
          images: post.images || [], // استخدم الصور من الـ API
          author: {
            id: post.author?.id,
            name: post.author?.['full-name'] || 'Unknown',
            photo: post.author?.image || PROFILE
          }
        };
      });
  };

  const fetchPosts = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await API.get('/posts/my-graduate-posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("📸 Raw posts data:", res.data.data);
      console.log("🖼️ First post images:", res.data.data[0]?.images);
      setPosts(formatPosts(res.data.data));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  if (!token) return;

  fetchPosts(); // جلب البيانات مرة واحدة عند تحميل المكون
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
  
  // 🆕 غير من image إلى images
  if (newPost.image) formData.append('images', newPost.image);
  if (newPost.file) formData.append('file', newPost.file);
  if (newPost.link) formData.append('link', newPost.link);

  console.log("📤 Sending form data:", {
    content: newPost.content,
    type: newPost.category,
    hasImage: !!newPost.image,
    hasFile: !!newPost.file,
    link: newPost.link
  });

  try {
    const res = await API.post('/posts/create-post', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log("✅ Post created successfully:", res.data);
    
    await fetchPosts();
    setSuccessMsg("Post created successfully");
    setNewPost({ content: '', category: 'General', image: null, file: null, link: '' });
    setShowForm(false);
    setShowLinkInput(false);

  } catch (err) {
    console.error("❌ Error creating post:", err);
    console.error("🔍 Error details:", err.response?.data);
    setError(err.response?.data?.message || "Failed to create post");
  }
};

  const categories = [
    { value: "General", label: "General" },
    { value: "Internship", label: "Internship" },
    { value: "Success story", label: "Success story" }
  ];

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

  const handleLikeToggle = async (post) => {
    if (!token) return;
    try {
      const method = post.liked ? 'delete' : 'post';
      const res = await API[method](`/posts/${post.id}/like`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updated = res.data.data;
      setPosts(posts.map(p => 
        p.id === post.id ? { ...p, likes: post.liked ? post.likes - 1 : post.likes + 1, liked: !post.liked } : p
      ));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
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
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {newPost.category === "Success story" && (
                  <small style={{ color: "#555" }}>
                    If you choose this, it means you agree that the post will appear on the landing page
                  </small>
                )}
              </div>

              {showLinkInput && (
                <input
                  placeholder={t('addLink')}
                  value={newPost.link}
                  onChange={(e) => setNewPost({ ...newPost, link: e.target.value })}
                />
              )}
              <div className="uni-optional-icons">
                <label title={t('addImage')}>
                  <input type="file" style={{ display: 'none' }} onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })} />
                  <Image size={20} />
                </label>
                <label title={t('addFile')}>
                  <input type="file" style={{ display: 'none' }} onChange={(e) => setNewPost({ ...newPost, file: e.target.files[0] })} />
                  <FileText size={20} />
                </label>
                <span title={t('addLink')} onClick={() => setShowLinkInput(!showLinkInput)}>
                  <LinkIcon size={20} />
                </span>
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
              onLike={() =>handleLikeToggle(post)}
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
                      <img src={c.user?.photo || PROFILE } alt="avatar" className="comment-avatar" />
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

  // 🔍 Debug: شوف شكل البيانات في كل بوست
  useEffect(() => {
    console.log(`🎯 Post ${post.id} data:`, {
      images: post.images,
      imagesType: typeof post.images,
      imagesLength: post.images?.length
    });
  }, [post]);

  const saveEdit = () => {
    onEdit(editContent, editLink);
    setIsEditing(false);
  };

  return (
    <div className="uni-post-card">
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
            <button onClick={saveEdit}>{t('save')}</button>
            <button onClick={() => setIsEditing(false)}>{t('cancel')}</button>
          </>
        ) : (
          <>
            <p>{post.content}</p>
            
            {/* 🖼️ عرض الصور - النسخة المبسطة */}
            {post.images && post.images.length > 0 && (
              <div className="uni-post-images">
                {post.images.map((imgUrl, index) => (
                  <img
                    key={index}
                    src={imgUrl}
                    alt={`post-${index}`}
                    className="uni-post-preview"
                    onError={(e) => {
                      console.error(`❌ Failed to load image: ${imgUrl}`);
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => console.log(`✅ Image loaded: ${imgUrl}`)}
                  />
                ))}
              </div>
            )}

            {post.file && <a href={post.file} download className="uni-post-file">{t('file')}</a>}
            {post.link && <a href={post.link} target="_blank" rel="noopener noreferrer" className="uni-post-file">{t('link')}</a>}
          </>
        )}
      </div>

      <div className="uni-post-actions">
        <button onClick={onLike}><Heart size={16} /> {post.likes}</button>
        <button onClick={onOpenComments}><MessageCircle size={16} /> {post.comments.length}</button>
        <button><Share2 size={16} /> {post.shares}</button>
      </div>
    </div>
  );
};

export default PostsAlumni;