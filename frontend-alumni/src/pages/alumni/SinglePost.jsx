import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import PROFILE from './PROFILE.jpeg';
import PostCard from "../../components/PostCard";
import "./SinglePost.css";

const token = localStorage.getItem("token");
const API = axios.create({
  baseURL: "http://localhost:5005/alumni-portal",
  headers: { Authorization: `Bearer ${token}` },
});

const SinglePost = () => {
  const { t, i18n } = useTranslation();
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/posts/${postId}`);
      setPost(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  if (loading) return <div>{t("Loading post...")}</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!post) return <div>{t("Post not found")}</div>;

  const formattedPost = {
    ...post,
    author: {
      id: post.author?.id,
      name: post.author?.["full-name"] || t("unknown"),
      photo: post.author?.image || PROFILE,
    },
    comments: post.comments?.map(c => ({
      ...c,
      displayName: c.author?.["user-type"] === "admin" || c.author?.["user-type"] === "staff"
        ? "Alumni Portal - Helwan University"
        : c.author?.["full-name"],
      displayImage: c.author?.["user-type"] === "admin" || c.author?.["user-type"] === "staff"
        ? PROFILE
        : c.author?.image || PROFILE,
      date: new Date(c["created-at"]).toLocaleString(i18n.language === "ar" ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    })) || [],
    likes: post.likes_count || 0,
    images: post.images || [],
  };

  return (
    <div className="single-post-container">
      <PostCard post={formattedPost} />
    </div>
  );
};

export default SinglePost;
