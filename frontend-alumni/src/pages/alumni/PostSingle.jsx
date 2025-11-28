import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../../services/api';
import PostCard from '../../components/PostCard';
import PROFILE from './PROFILE.jpeg';
import AdminPostsImg from './AdminPosts.jpeg';
import { useTranslation } from 'react-i18next';

const PostSingle = () => {
  const { t } = useTranslation();
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // جاي من query string لو اشعار كومنت
  const commentId = new URLSearchParams(location.search).get('comment');

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  const formatPost = (post) => ({
    ...post,
    id: post.post_id,
    date: post['created-at'],
    comments: post.comments?.map(c => ({
      ...c,
      comment_id: c.comment_id,
      'created-at': c['created-at'],
      author: {
        ...c.author,
        displayName: c.author?.["user-type"] === "admin" || c.author?.["user-type"] === "staff"
                     ? "Alumni Portal - Helwan University"
                     : c.author?.["full-name"] || c.author?.name || "—",
        displayImage: c.author?.["user-type"] === "admin" || c.author?.["user-type"] === "staff"
                     ? AdminPostsImg
                     : c.author?.image || PROFILE
      }
    })) || [],
    likesCount: post.likesCount || 0,
    images: post.images || [],
    author: {
      id: post.author?.id || null,
      name: post.author?.['full-name'] || post.author?.name || "—",
      photo: post.author?.image || PROFILE
    }
  });

  const fetchPost = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await API.get(`/posts/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPost(formatPost(res.data.data));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId, token]);

  const handleDelete = async () => {
    if (!token) return;
    try {
      await API.delete(`/posts/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  if (loading) return <div>{t('loadingPosts')}</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!post) return <div>{t('noPosts')}</div>;

  return (
    <div className="uni-feed">
      <PostCard
        post={post}
        onDelete={handleDelete}
        onEdit={() => navigate(`/edit-post/${postId}`)}
        highlightCommentId={commentId} // هنا بنمرر commentId
      />
    </div>
  );
};

export default PostSingle;
