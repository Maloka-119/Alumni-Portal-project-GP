import React, { useState, useEffect } from 'react';
import './AdminPostsPage.css';
import { Heart, MessageCircle, Share2, EyeOff, Eye, Send } from 'lucide-react';
import { useTranslation } from "react-i18next";
import API from '../../services/api';
import PROFILE from './PROFILE.jpeg';
import Swal from "sweetalert2";
const UsersPostsPage = () => {
  const { t } = useTranslation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  // ====================== Format Posts بنفس منطق الصفحات التانية ======================
  const formatPosts = (data) => {
    return (data || []).map(post => {
      const formattedComments = (post.comments || []).map((comment) => ({
        id: comment.comment_id,
        userName: comment.author?.["full-name"] || "Unknown User",
        content: comment.content,
        avatar: comment.author?.image || PROFILE,
        date: comment["created-at"],
      }));

      return {
        ...post,
        id: post.post_id,
        likes: post.likes_count || 0,
        liked: false, // دائماً false في البداية
        comments: formattedComments,
        images: post.images || [],
        showComments: false, // إضافة showComments
        author: {
          id: post.author?.id,
          name: post.author?.["full-name"] || "Unknown",
          photo: post.author?.image || PROFILE,
        },
        isHidden: post["is-hidden"] === true
      };
    });
  };

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/posts');
      console.log('Fetched posts from backend:', res.data); 

      if (res.data.status === "success") {
        setPosts(formatPosts(res.data.data));
      } else {
        setPosts(formatPosts(res.data.data || []));
      }
    } catch (err) {
      console.error('Error fetching posts', err);
      setError(t("fetchPostsFailed"));
    } finally {
      setLoading(false);
    }
  };


const handleHide = async (id) => {
  if (!id) return;
  try {
    const response = await API.put(`/posts/${id}/hide`);
    if (response.data.status === "success") {
      await fetchPosts();

      Swal.fire({
        icon: "success",
        title: "Post hidden",
        text: "The post has been hidden successfully.",
        toast: true,
        position: "top-end",
        timer: 1800,
        showConfirmButton: false,
        background: "#fefefe",
        color: "#333",
      });
    }
  } catch (err) {
    console.error("Error hiding post", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to hide the post.",
      toast: true,
      position: "top-end",
      timer: 1800,
      showConfirmButton: false,
      background: "#fefefe",
      color: "#333",
    });
  }
};

const handleUnhide = async (id) => {
  if (!id) return;
  try {
    const response = await API.put(`/posts/${id}/unhide`);
    if (response.data.status === "success") {
      await fetchPosts();

      Swal.fire({
        icon: "success",
        title: "Post unhidden",
        text: "The post is now visible.",
        toast: true,
        position: "top-end",
        timer: 1800,
        showConfirmButton: false,
        background: "#fefefe",
        color: "#333",
      });
    }
  } catch (err) {
    console.error("Error unhiding post", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to unhide the post.",
      toast: true,
      position: "top-end",
      timer: 1800,
      showConfirmButton: false,
      background: "#fefefe",
      color: "#333",
    });
  }
};

  // ====================== Likes - نفس منطق الصفحات التانية ======================
  const handleLike = async (postId) => {
    const postIndex = posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) return;

    try {
      const post = posts[postIndex];

      // حاول unlike أولاً
      try {
        await API.delete(`/posts/${postId}/like`);
        // إذا نجح الـ unlike، هذا معناه أن البوست كان معجب بيه
        const updatedPosts = [...posts];
        updatedPosts[postIndex] = {
          ...post,
          likes: Math.max(0, post.likes - 1),
          liked: false,
        };
        setPosts(updatedPosts);
        console.log("✅ Successfully unliked post:", postId);
      } catch (unlikeError) {
        // إذا فشل الـ unlike، جرب like
        if (unlikeError.response?.status === 404) {
          await API.post(`/posts/${postId}/like`);
          const updatedPosts = [...posts];
          updatedPosts[postIndex] = {
            ...post,
            likes: post.likes + 1,
            liked: true,
          };
          setPosts(updatedPosts);
          console.log("✅ Successfully liked post:", postId);
        } else {
          throw unlikeError;
        }
      }
    } catch (err) {
      console.error("🔴 Error in handleLike:", err.response?.data || err);
      // في حالة أي خطأ، أعد جلب البيانات من السيرفر
      await fetchPosts();
    }
  };

  // ====================== Comments - نفس منطق الصفحات التانية ======================
  const toggleComments = (postId) => {
    setPosts(prevPosts => prevPosts.map(p => 
      p.id === postId ? { ...p, showComments: !p.showComments } : p
    ));
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  const handleCommentSubmit = async (postId) => {
    const comment = commentInputs[postId];
    if (!comment?.trim()) return;

    try {
      const res = await API.post(`/posts/${postId}/comments`, {
        content: comment,
      });

      if (res.data.comment) {
        const newComment = {
          id: res.data.comment.comment_id,
          userName: res.data.comment.author?.["full-name"] || "You",
          content: res.data.comment.content,
          avatar: PROFILE,
          date: new Date().toLocaleString(),
        };

        // تحديث فوري للكومنتات
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, comments: [...post.comments, newComment] }
              : post
          )
        );
      }

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("🔴 Error submitting comment:", err.response?.data || err);
      alert("Failed to add comment");
    }
  };

  if (loading) return <p>{t("loadingPosts")}</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const filteredPosts = posts.filter(p => {
    if (filter === 'Hidden') return p.isHidden;
    if (filter === 'Normal') return !p.isHidden;
    return true;
  });

  return (
    <div className="feed-container">
      <h2 className="page-title">{t("userPosts")}</h2>

      <div className="filter-bar">
        <label>{t("filterBy")}</label>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="All">{t("all")}</option>
          <option value="Normal">{t("normal")}</option>
          <option value="Hidden">{t("hidden")}</option>
        </select>
      </div>

      <div className="posts-feed">
        {filteredPosts.map((post) => (
          <div 
            key={post.id} 
            className="post-card" 
            style={post.isHidden ? { backgroundColor: 'rgba(66, 64, 64, 0.15)' } : {}}
          >
            <div className="post-header">
              <img src={post.author?.photo || PROFILE} alt="profile" className="profile-pic" />
              <div className="post-header-info">
                <strong>{post.author?.name || t('unknown')}</strong>
                <div className="post-date">
                  {new Date(post["created-at"]).toLocaleString()} - {post.category}
                  {post['group-id'] ? ' - In Group' : ''}
                </div>
              </div>

              {!post.isHidden ? (
                <button onClick={() => handleHide(post.id)} className="hide-btn-top">
                  <EyeOff size={16} />
                </button>
              ) : (
                <button onClick={() => handleUnhide(post.id)} className="hide-btn-top">
                  <Eye size={16} />
                </button>
              )}
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

            {/* Post Actions - بنفس تصميم الصفحات التانية */}
            <div className="post-actions">
              <button 
                className={post.liked ? "liked" : ""}
                onClick={() => handleLike(post.id)}
              >
                <Heart 
                  size={16} 
                  fill={post.liked ? "currentColor" : "none"} 
                /> 
                {post.likes}
              </button>
              <button onClick={() => toggleComments(post.id)}>
                <MessageCircle size={16} /> {post.comments?.length || 0}
              </button>
              <button>
                <Share2 size={16} /> {post.shares || 0}
              </button>
            </div>

            {/* Comments Section - تظهر فقط عندما showComments = true */}
            {post.showComments && (
              <div className="comments-section">
                <div className="existing-comments">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <img
                        src={comment.avatar || PROFILE}
                        alt={comment.userName}
                        className="comment-avatar"
                      />
                      <div className="comment-text">
                        <strong>{comment.userName}</strong>: {comment.content}
                      </div>
                      <div className="comment-date">
                        {new Date(comment["created-at"]).toLocaleString([], {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="comment-input">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => handleCommentChange(post.id, e.target.value)}
                  />
                  <button onClick={() => handleCommentSubmit(post.id)}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersPostsPage;