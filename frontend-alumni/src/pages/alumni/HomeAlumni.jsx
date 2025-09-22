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
      console.log("Fetching posts..."); // 🔹 بداية الفانكشن
      const res = await API.get(`/posts/user-posts?page=${page}&limit=5`);

      console.log("Response from API:", res); // 🔹 هنا هتشوف الـ response كامل
      


  
      // const formatted = res.data.data.map(post => ({
        
      //   id: post.post_id,
      //   userName: post.author["full-name"],
      //   avatar: PROFILE,
      //   date: new Date(post["created-at"]).toLocaleDateString(),
      //   type: post.category,
      //   content: post.content,
      //   likes: 0,
      //   liked: false,
      //   shares: 0,
      //   comments: [],
      // }));
      const formatted = res.data.data.map(post => {
        console.log("Mapping post:", post); // 🔹 هنا هتشوف كل بوست قبل ما يتعدل
        let avatar;
      
        if (post.author["full-name"] === "Alumni Portal - Helwan university") {
          avatar = AdminPostsImg;
        } else if (post.author.image) {
          avatar = post.author.image; 
        } else {
          avatar = PROFILE;
        }
      
        return {
          id: post.id,
          userName: post.author["full-name"],
          avatar: avatar,
          date: new Date(post['created-at']).toLocaleDateString(),
          type: post.category,
          isPortal: post.author["full-name"] === "Alumni Portal - Helwan university",
          content: post.content,
          likes: 0,
          liked: false,
          shares: 0,
          comments: [],
        };
      });
      
      
  
      
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
            <div className="post-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={post.avatar} alt={post.userName} className="profile-pic" />
                <div className="post-header-info" style={{ marginLeft: '10px' }}>
                  <strong>{post.userName}</strong>
                  <div className="post-date">
  {post.date}
  {!post.isPortal && post.type && (
    <span style={{ marginLeft: "8px", color: "#555", fontSize: "0.9em" }}>
      {post.type}
    </span>
  )}
</div>

                </div>
              </div>
              {post.isPortal && post.type && (
  <span className="post-type-badge">{post.type}</span>
)}

            </div>

            <div className="uni-post-body">
              {/* <h4>{post.title}</h4> */}
              <p>{post.content}</p>
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
