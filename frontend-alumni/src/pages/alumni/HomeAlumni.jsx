import React, { useState, useEffect, useContext } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import './AlumniAdminPosts.css';
import { DarkModeContext } from './DarkModeContext';
import { useTranslation } from 'react-i18next';
import API from '../../services/api';
import PROFILE  from './PROFILE.jpeg';
import AdminPostsImg from './AdminPosts.jpeg';

const HomeAlumni = () => {
  const { darkMode } = useContext(DarkModeContext);
  const { t } = useTranslation();

  const [posts, setPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching posts...");
      const res = await API.get(`/posts/user-posts?page=${page}&limit=5`);

      console.log("Response from API:", res);
      
      const formatted = res.data.data.map(post => {
        console.log("Mapping post:", post);
        console.log("📸 Post images:", post.images); // 🔍 شوف الصور
        
        let avatar;

        if (post.author["full-name"] === "Alumni Portal - Helwan University") {
          avatar = AdminPostsImg;
        } else if (post.author.image) {
          avatar = post.author.image; 
        } else {
          avatar = PROFILE;
        }

        return {
          id: post.post_id || post.id, // 🆕 تأكد من الـ ID
          userName: post.author["full-name"],
          avatar: avatar,
          date: new Date(post['created-at']).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          
          type: post.category,
          isPortal: post.author["full-name"] === "Alumni Portal - Helwan University",
          content: post.content,
          images: post.images || [], // 🆕 أضفنا الصور هنا
          likes: 0,
          liked: false,
          shares: 0,
          comments: [],
        };
      });

      console.log("📦 Formatted posts with images:", formatted); // 🔍 شوف البيانات بعد التعديل
      
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newOnes = formatted.filter(p => !existingIds.has(p.id));
        return [...prev, ...newOnes];
      });
  
      if (res.data.data.length < 5) setHasMore(false);

    } catch (err) {
      console.error(err);
      setError(t('errorFetchingPosts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [page]);

  const handleLike = async (postId) => {
    try {
      await API.post(`/posts/${postId}/like`);
      setPosts(posts.map(p =>
        p.id === postId && !p.liked ? { ...p, likes: p.likes + 1, liked: true } : p
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId) => {
    setPosts(posts.map(p =>
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
      await API.post(`/posts/${postId}/comment`, { content: comment });
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, comments: [...p.comments, { userName: 'You', content: comment, avatar: p.avatar }] }
          : p
      ));
      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && page === 1) return <p>{t('loadingPosts')}</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className={`uni-feed ${darkMode ? 'dark-mode' : ''}`}>
      <div className="uni-header"><h2>{t('homeFeed')}</h2></div>

      <div className="uni-posts">
        {posts.map(post => (
          <div key={post.id} className="uni-post-card">
           <div
  className="post-header"
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }}
>
  {/* الصورة */}
  <img
    src={post.avatar}
    alt={post.userName}
    className="profile-pic"
    style={{ width: '40px', height: '40px', borderRadius: '50%' }}
  />

  {/* الاسم + التاريخ */}
  <div
    className="post-user-info"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      lineHeight: '1.2',
    }}
  >
    <strong>{post.userName}</strong>
    <div
      className="post-date"
      style={{
        marginTop: '2px',
        marginLeft: '4px', // ← يحرك التاريخ يمين لوحده بدون ما يأثر على الاسم
        color: '#555',
        fontSize: '0.9em',
      }}
    >
      {post.date}
      {!post.isPortal && post.type && (
        <span
          style={{
            marginLeft: '8px',
            color: '#777',
            fontSize: '0.9em',
          }}
        >
          {post.type}
        </span>
      )}
    </div>
  </div>
</div>




            <div className="uni-post-body">
              <p>{post.content}</p>
              
              {/* 🆕 جزء عرض الصور - أضفنا هنا */}
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
            </div>

            <div className="uni-post-actions">
              <button className={post.liked ? 'uni-liked' : ''} onClick={() => handleLike(post.id)}>
                <Heart size={16}/> {post.likes}
              </button>
              <button onClick={() => toggleComments(post.id)}>
                <MessageCircle size={16}/> {post.comments.length}
              </button>
              <button>
                <Share2 size={16}/> {post.shares}
              </button>
            </div>

            {post.showComments && (
              <div className="uni-comments-section">
                {post.comments.map((c, idx) => (
                  <div key={idx} className="uni-comment-item">
                    <img src={c.avatar} alt={c.userName} className="uni-comment-avatar"/>
                    <div className="uni-comment-text"><strong>{c.userName}</strong>: {c.content}</div>
                  </div>
                ))}
                <div className="uni-comment-input">
                  <input
                    type="text"
                    placeholder={t('writeComment')}
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => handleCommentChange(post.id, e.target.value)}
                  />
                  <button onClick={() => handleCommentSubmit(post.id)}>{t('send')}</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', margin: '20px' }}>
          <button className="load-more-btn" onClick={() => setPage(page + 1)}>
            {t('loadMore')}
          </button>
        </div>
      )}
    </div>
  );
};

export default HomeAlumni;