import React, { useState } from 'react';
import { Heart, MessageCircle, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PROFILE from '../../pages/Admin/PROFILE.jpeg';
import API from '../../services/api';
import '../pages/alumni/AlumniAdminPosts.css';

const PostCard = ({ post, refreshPosts }) => {
  const { t } = useTranslation();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const toggleLike = async () => {
    try {
      const url = `/posts/${post.id}/like`;
      const res = await API.post(url);
      if (res.data.message.includes('liked')) {
        setLikes(likes + 1);
        setIsLiked(true);
      } else {
        setLikes(likes - 1);
        setIsLiked(false);
      }
    } catch (e) {
      console.error('like error', e);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await API.post(`/posts/${post.id}/comments`, {
        content: newComment,
      });
      setComments([...comments, res.data.comment]);
      setNewComment('');
    } catch (e) {
      console.error('comment error', e);
    }
  };

  return (
    <div className="uni-post-card">
      <div className="uni-post-header">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <img src={PROFILE} className="profile-pic" alt="profile" />
          <div className="uni-post-header-info">
            <strong>{post.author || t('unknown')}</strong>
            <span className="uni-post-date">
              {new Date(post.date).toLocaleString()}
            </span>
          </div>
        </div>

        {/* <div className="post-actions-dropdown">
          <button
            className="more-btn"
            onClick={() => setOpenDropdown(!openDropdown)}
          >
            <MoreVertical size={20} />
          </button>

          {openDropdown && (
            <div className="dropdown-menu">
              <button onClick={() => {}}>
                <Edit size={16} /> {t('edit')}
              </button>
              <button onClick={() => {}}>
                <Trash2 size={16} /> {t('delete')}
              </button>
            </div>
          )}
        </div> */}
      </div>

      <div className="uni-post-body">
        <p>{post.content}</p>

        {post.images && post.images.length > 0 && (
          <div className="uni-post-images">
            {post.images.map((img, i) => (
              <img key={i} src={img} alt="" />
            ))}
          </div>
        )}
      </div>

      <div className="uni-post-actions">
        <button
          onClick={toggleLike}
          className={isLiked ? 'uni-liked' : ''}
        >
          <Heart size={16} /> {likes}
        </button>

        <button onClick={() => setShowComments(!showComments)}>
          <MessageCircle size={16} /> {comments.length}
        </button>
      </div>

      {showComments && (
        <div className="uni-comments-section">
          {comments.map((c, index) => (
            <div key={index} className="uni-comment-item">
              <img
                src={PROFILE}
                alt="user"
                className="uni-comment-avatar"
              />
              <div className="uni-comment-text">
                <strong>{c.author?.['full-name'] || 'User'}</strong>
                <p>{c.content}</p>
              </div>
            </div>
          ))}

          <div className="uni-comment-input">
            <input
              type="text"
              placeholder={t('add comment')}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button onClick={handleAddComment}>{t('send')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
