import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Image, FileText, Link as LinkIcon, Trash2, MoreVertical, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './AlumniAdminPosts.css';
import API from "../../services/api";

const PostsAlumni = ({ user: propUser }) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPost, setNewPost] = useState({ content: '', image: null, file: null, link: '' });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');

  // Safely get user and token
  const user = propUser || JSON.parse(localStorage.getItem("user")) || null;
  const token = user?.token;

  useEffect(() => {
    if (!token) return; // exit if no token

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await API.get('/posts/graduate', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setPosts(res.data.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
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
    if (!token) return;
    if (!newPost.content && !newPost.image && !newPost.file && !newPost.link) return;

    const formData = new FormData();
    formData.append('content', newPost.content);
    if (newPost.image) formData.append('image', newPost.image);
    if (newPost.file) formData.append('file', newPost.file);
    if (newPost.link) formData.append('link', newPost.link);

    try {
      const res = await API.post('/posts/create-post', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setPosts([res.data, ...posts]);
      setNewPost({ content: '', image: null, file: null, link: '' });
      setShowForm(false);
      setShowLinkInput(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleEdit = async (postId, content, link) => {
    if (!token) return;
    try {
      const res = await API.patch(`/posts/${postId}`, { content, link }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updated = res.data.data;
      setPosts(posts.map(p => (p.id === postId ? updated : p)));
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

          {error && <div style={{ color: 'red' }}>{t('error')}: {error}</div>}
          {loading && <div>{t('loadingPosts')}</div>}
          {!loading && posts.length === 0 && <div>{t('noPosts')}</div>}

          {!loading && posts.map(post => (
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
                      <img src={c.user?.photo || 'default-profile.png'} alt="avatar" className="comment-avatar" />
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
          <img src={post.user?.photo || 'default-profile.png'} alt="profile" className="uni-post-avatar" />
          <div className="uni-post-header-info">
            <strong>{post.user?.name || t('unknown')}</strong>
            <div className="uni-post-date">{new Date(post.date).toLocaleString()}</div>
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







