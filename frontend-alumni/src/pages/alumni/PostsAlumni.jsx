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

useEffect(() => {
  if (!token) return;

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get('/posts/my-graduate-posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setPosts(
        res.data.data
          .sort((a, b) => new Date(b['created-at']) - new Date(a['created-at']))
          .map(post => ({
            ...post,
            id: post.id, // استخدم id من الريسبونس
            date: post['created-at'],
            comments: post.comments || [],
            author: {
              id: post.author?.id,
              name: post.author?.['full-name'] || 'Unknown',
              photo: post.author?.image || PROFILE
            }
          }))
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchPosts();
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
  if (newPost.image) formData.append('image', newPost.image);
  if (newPost.file) formData.append('file', newPost.file);
  if (newPost.link) formData.append('link', newPost.link);
  formData.append('category', newPost.category);

  try {
    const res = await API.post('/posts/create-post', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    const createdPost = res.data.post;

    // صياغة البوست الجديد باستخدام بيانات المستخدم اللي عامل اللوج إن
    const formattedPost = {
      id: createdPost.id,
      content: createdPost.content,
      date: createdPost['created-at'],
      category: createdPost.category,
      image: createdPost.image || null,
      file: createdPost.file || null,
      link: createdPost.link || null,
      likes: 0,
      shares: 0,
      comments: [],
      author: {
        id: user?.id,
        name: user?.fullName || 'Unknown',
        photo: user?.image || PROFILE
      }
    };

    // إضافة البوست فورًا في بداية الـ state
    setPosts(prevPosts => [formattedPost, ...prevPosts]);
    setSuccessMsg("Post created successfully");
    setNewPost({ content: '', image: null, file: null, link: '', category: 'General' });
    setShowForm(false);
    setShowLinkInput(false);

  } catch (err) {
    setError(err.response?.data?.message || "Failed to create post");
  }
};



  const categories = [
    { value: "General", label: "General" },
    { value: "Ad", label: "Ad" },
    { value: "Success story", label: "Success story" }
  ];

  const handleEdit = async (postId, content, link) => {
    if (!token) return;
    try {
      const res = await API.patch(`/posts/${postId}`, { content, link }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updated = res.data.data;
      setPosts(posts.map(p => (p.id === updated.id ? updated : p)));
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

  const handleLike = async (postId) => {
    if (!token) return;
    try {
      const res = await API.post(`/posts/${postId}/like`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updated = res.data.data;
      setPosts(posts.map(p => (p.id === updated.id ? updated : p)));
      if (selectedPost?.id === postId) setSelectedPost(updated);
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
      setPosts(posts.map(p => (p.id === updatedPost.id ? updatedPost : p)));
      setSelectedPost(updatedPost);
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

          {!loading && posts.length > 0 && posts.filter(p => p.id).map(post => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={(content, link) => handleEdit(post.id, content, link)}
              onDelete={() => handleDelete(post.id)}
              onOpenComments={() => openComments(post)}
              onLike={() => handleLike(post.id)}
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

  const saveEdit = () => {
    onEdit(editContent, editLink);
    setIsEditing(false);
  };

  return (
    <div className="uni-post-card">
      <div className="uni-post-header">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <img src={post.author?.photo || PROFILE } className="profile-pic" />
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
            {post.image && <img src={post.image} alt="post" className="uni-post-preview" />}
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
