import React, { useState, useEffect } from 'react';
import './AdminPostsPage.css';
import { Heart, MessageCircle, Share2, EyeOff } from 'lucide-react';
import { useTranslation } from "react-i18next";
import API from '../../services/api';
import PROFILE from './PROFILE.jpeg'

const UsersPostsPage = () => {
  const { t } = useTranslation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null); 
const [newComment, setNewComment] = useState(''); 


  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/posts'); 
      setPosts(res.data.data);
    } catch (err) {
      console.error('Error fetching posts', err);
      setError(t("fetchPostsFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async (id) => {
    try {
      await API.put(`/posts/${id}/hide`);
      setPosts(posts.map(p => p.id === id ? { ...p, state: 'hidden' } : p));
    } catch (err) {
      console.error('Error hiding post', err);
      setError(t("hidePostFailed"));
    }
  };

  const openComments = (post) => {
    setSelectedPost(post);
  };
  
  const closeComments = () => {
    setSelectedPost(null);
  };

  const handleAddComment = async () => {
  if (!newComment) return;

  try {
    await API.post(`/posts/${selectedPost.id}/comment`, { content: newComment });

    setSelectedPost({
      ...selectedPost,
      comments: [
        ...selectedPost.comments,
        { id: Date.now(), user: { name: 'You', photo: selectedPost.profileImageUrl }, content: newComment }
      ]
    });

    setPosts(posts.map(p => p.id === selectedPost.id ? {
      ...p,
      comments: [...p.comments, { id: Date.now(), user: { name: 'You', photo: selectedPost.profileImageUrl }, content: newComment }]
    } : p));

    setNewComment('');
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div className="feed-container">
      <h2 className="page-title">{t("userPosts")}</h2>

      {loading && <p>{t("loadingPosts")}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <div className="posts-feed">
          {posts.map((post) => (
            post.state !== 'hidden' && (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-header-info">
                    <img src={post.author.image || PROFILE} alt="profile" className="profile-pic" />
                    <strong>{post.author["full-name"]}</strong>
                    <div className="post-date">
                      {new Date(post["created-at"]).toLocaleString()} - {post.category}
                    </div>

                  </div>
                  <button onClick={() => handleHide(post.id)} className="hide-btn-top"><EyeOff size={16} /></button>
                </div>

                <div className="post-content">
                  <h4>{post.title}</h4>
                  <p>{post.content}</p>
                  {post.imageUrl && <img src={post.imageUrl} alt="post" className="post-image" />}
                  {post.fileUrl && <a href={post.fileUrl} download className="post-file-link">{post.fileName}</a>}
                  {post.link && (
                    <a href={post.link} target="_blank" rel="noopener noreferrer" className="post-link">
                      {post.link}
                    </a>
                  )}
                </div>

                <div className="post-actions">
                  <button><Heart size={16} /> {post.likes}</button>
                  <button onClick={() => openComments(post)}>
                  <MessageCircle size={16} /> {post.comments?.length || 0}

</button>
                  <button><Share2 size={16} /> {post.shares}</button>
                </div>

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
    </div>
  </div>
)}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersPostsPage;


