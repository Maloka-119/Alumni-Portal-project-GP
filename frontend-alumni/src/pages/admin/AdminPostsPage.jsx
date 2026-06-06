import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Heart, MessageCircle, Edit, Trash2, CheckCircle, Circle } from 'lucide-react';
import Swal from "sweetalert2";

import API from "../../services/api";
import { getPermission } from "../../components/usePermission";
import CreatePostBar from '../../components/CreatePostBar'; 
import CommentsSection from '../../components/CommentsSection'; 

import './AdminPostsPage.css';
import PROFILE from "./PROFILE.jpeg";
import AdminPostsImg from './AdminPosts.jpeg';

const AdminPostsPage = ({ currentUser }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [types, setTypes] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [editingPostId, setEditingPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedImage, setSelectedImage] = useState({ postId: null, url: null });


  const formRef = useRef(null);
  const previousScrollPosition = useRef(null);

  const postPerm = currentUser?.userType === "admin"
    ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
    : getPermission("Portal posts management", currentUser) || { canView: false, canAdd: false, canEdit: false, canDelete: false };


  useEffect(() => {
    if (editingPostId && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingPostId]);


  useEffect(() => {
    if (editingPostId === null && previousScrollPosition.current !== null) {
      const scrollY = previousScrollPosition.current;
      const timer = setTimeout(() => {
        window.scrollTo({ top: scrollY, behavior: 'smooth' });
        previousScrollPosition.current = null;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editingPostId]);

  useEffect(() => {
    if (postPerm.canView) {
      fetchPosts();
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const formatPosts = (data) => {
    const filtered = (data || []).filter(p => !p['group-id']);
    return filtered.map(post => {
      const formattedComments = (post.comments || []).map((comment) => {
        const isAdminOrStaff = ["admin", "staff"].includes(comment.author?.["user-type"]);
        return {
          id: comment.comment_id,
          userName: isAdminOrStaff ? "Alumni Portal – Helwan University" : comment.author?.["full-name"] || "Anonymous",
          avatar: isAdminOrStaff ? AdminPostsImg : comment.author?.image || PROFILE,
          content: comment.content,
          date: comment["created-at"],
          author: comment.author,
        };
      });

      return {
        id: post.post_id,
        content: post.content,
        likes: post.likesCount || 0,  
        liked: post.isLikedByYou, 
        comments: formattedComments,
        date: post['created-at'],
        authorName: "Alumni Portal – Helwan University",
        type: post.category,
        images: post.images || [],
        showComments: false,
        inLanding: post["in-landing"]
      };
    });
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await API.get('/posts/admin');
      if (response.data.status === "success") setPosts(formatPosts(response.data.data));
    } catch (err) {
      setError(t("fetchPostsFailed"));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get("/posts/categories");
      setTypes(res.data.data || []);
    } catch (err) {
      setTypes([]);
    }
  };

  const handleCreateOrEdit = async (formData, postId = null) => {
    try {
      if (postId) {
        await API.put(`/posts/${postId}/edit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess(t("postUpdated"));
      } else {
        await API.post("/posts/create-post", formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess(t("postCreated"));
      }
      fetchPosts();
      setEditingPostId(null);
    } catch (err) {
      setError(err.response?.data?.message || t("savePostFailed"));
    }
  };


  const handleEditClick = (postId) => {
    previousScrollPosition.current = window.scrollY;
    setEditingPostId(postId);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: t("Are you sure?"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Yes, delete it!"),
    });
    if (result.isConfirmed) {
      try {
        await API.delete(`/posts/${id}`);
        Swal.fire({ icon: "success", title: t("Deleted!") });
        fetchPosts();
      } catch (err) {
        Swal.fire({ icon: "error", title: t("Error") });
      }
    }
  };

  const handleLike = async (postId) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const post = posts[postIndex];
    const updatedPosts = [...posts];

    try {
      if (post.liked) {
        await API.delete(`/posts/${postId}/like`);
        updatedPosts[postIndex] = { ...post, likes: Math.max(0, post.likes - 1), liked: false };
      } else {
        await API.post(`/posts/${postId}/like`);
        updatedPosts[postIndex] = { ...post, likes: post.likes + 1, liked: true };
      }
      setPosts(updatedPosts);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  const handleLandingToggle = async (postId, currentValue) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, inLanding: !currentValue } : p));
    try {
      await API.patch(`/posts/${postId}/landing`, { inLanding: !currentValue });
      Swal.fire({ icon: "success", title: t("Updated") });
    } catch (err) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, inLanding: currentValue } : p));
    }
  };

  const filteredPosts = filterType === 'All' ? posts : posts.filter(p => p.type === filterType);

  if (!postPerm.canView) return <p style={{ color: 'red' }}>{t("noPermission")}</p>;
  if (loading) return <p>{t("loadingPosts")}</p>;

  return (
    <div className="feed-container">
      <h2 className="page-title">{t('Manage Portal Posts')}</h2>
      {success && <div className="success-message">{success}</div>}

      {(postPerm.canAdd || editingPostId) && (
      
        <div ref={formRef}>
          <CreatePostBar
            types={types}
            editingPost={posts.find(p => p.id === editingPostId) || null}
            onSubmit={handleCreateOrEdit}
            canAdd={postPerm.canAdd}
            onCancelEdit={() => setEditingPostId(null)}
          />
        </div>
      )}

      <div className="filter-bar">
        <label>{t('Filter by type:')}</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">{t('All')}</option>
          {types.map(type => <option key={type} value={type}>{t(type)}</option>)}
        </select>
      </div>

      <div className="posts-feed">
        {filteredPosts.length === 0 ? <p className="no-posts">{t('noPosts')}</p> :
          filteredPosts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <img src={post.author?.photo || AdminPostsImg} alt="profile" className="profile-pic" />
                <div className="post-header-info">
                  <strong>{post.authorName}</strong>
                  <div className="post-date">
                    {post.date ? new Date(post.date).toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }) : t('unknownDate')}
                  </div>
                </div>
                <span className="post-type-badge">{post.type}</span>
              </div>

              <div className="post-content">
                <p>{post.content}</p>
                {post.images.length > 0 && (
                  <div className="post-images">
                    {post.images.map((imgUrl, index) => (
                      <img key={index} src={imgUrl} alt="post" className="post-image" onClick={() => setSelectedImage({ postId: post.id, url: imgUrl })} />
                    ))}
                  </div>
                )}
              </div>

              <div className="post-actions">
                <button className={post.liked ? "liked" : ""} onClick={() => handleLike(post.id)}>
                  <Heart size={16} color={post.liked ? "#e0245e" : "#555"} /> {post.likes}
                </button>
                <button onClick={() => toggleComments(post.id)}>
                  <MessageCircle size={16} /> {post.comments?.length || 0}
                </button>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: "auto" }}>
             
                  {postPerm.canEdit && <button onClick={() => handleEditClick(post.id)} className="edit-btn"><Edit size={16} /></button>}
                  {postPerm.canDelete && <button onClick={() => handleDelete(post.id)} className="delete-btn"><Trash2 size={16} /></button>}
                  {postPerm.canAdd && (
                    <div className="landing-tooltip-container">
                      <button onClick={() => handleLandingToggle(post.id, post.inLanding)} className="landing-btn">
                        {post.inLanding ? <CheckCircle size={20} color="#4CAF50" /> : <Circle size={20} color="#ccc" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {post.showComments && (
                <CommentsSection 
                  post={post} 
                  postPerm={postPerm} 
                  onUpdatePosts={(postId, updatedComments) => {
                    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
                  }}
                />
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default AdminPostsPage;