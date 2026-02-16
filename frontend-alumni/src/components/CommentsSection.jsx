import React, { useState } from 'react';
import { Send, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import API from '../services/api'; 
import PROFILE from "../pages/alumni/PROFILE.jpeg";
import AdminPostsImg from '../pages/alumni/AdminPosts.jpeg';
import { useNavigate } from "react-router-dom";

const CommentsSection = ({ post, postPerm, onUpdatePosts }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [commentInput, setCommentInput] = useState("");

    // دالة إضافة تعليق
    const handleCommentSubmit = async () => {
        if (!postPerm.canAdd || !commentInput.trim()) return;

        try {
            const res = await API.post(`/posts/${post.id}/comments`, { content: commentInput });

            if (res.data.comment) {
                const newComment = {
                    id: res.data.comment.comment_id,
                    userName: "Alumni Portal – Helwan University",
                    content: res.data.comment.content,
                    avatar: AdminPostsImg,
                    date: new Date().toISOString(),
                    author: { ...res.data.comment.author, "user-type": "admin" },
                };

                // تحديث البيانات في الكومبوننت الأب
                onUpdatePosts(post.id, [...post.comments, newComment]);
                setCommentInput("");
            }
        } catch (err) {
            Swal.fire({ icon: "error", title: t("Error"), text: t("Failed to add comment"), toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
        }
    };

    // دالة حذف تعليق
    const handleDeleteComment = async (commentId) => {
        try {
            await API.delete(`/posts/comments/${commentId}`);
            const updatedComments = post.comments.filter(c => c.id !== commentId);
            onUpdatePosts(post.id, updatedComments);
        } catch (err) {
            console.error(err);
        }
    };

    // دالة تعديل تعليق
    const handleEditComment = async (comment) => {
        const { value: newContent } = await Swal.fire({
            input: "textarea",
            inputValue: comment.content,
            showCancelButton: true,
            confirmButtonText: "Save"
        });

        if (!newContent || newContent === comment.content) return;

        try {
            await API.put(`/posts/comments/${comment.id}`, { content: newContent });
            const updatedComments = post.comments.map(c =>
                c.id === comment.id ? { ...c, content: newContent } : c
            );
            onUpdatePosts(post.id, updatedComments);
        } catch (err) {
            console.error(err);
        }
    };

    return (
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
                            <strong
                                style={{ 
                                    cursor: ["admin", "staff"].includes(comment.author?.["user-type"]) ? "default" : "pointer", 
                                    color: "#484c50" 
                                }}
                                onClick={() => {
                                    if (!["admin", "staff"].includes(comment.author?.["user-type"])) {
                                        navigate(`/helwan-alumni-portal/admin/dashboard/graduateprofile/${comment.author?.id}`);
                                    }
                                }}
                            >
                                {comment.userName}
                            </strong>
                            : {comment.content}
                        </div>

                        <div className="comment-date">
                            {new Date(comment.date || post["created-at"]).toLocaleString(
                                i18n.language === 'ar' ? 'ar-EG' : 'en-US',
                                { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }
                            )}
                        </div>

                        {(comment.author?.["user-type"] === "admin" || comment.author?.["user-type"] === "staff") && (
                            <div className="comment-actions">
                                <button onClick={() => handleEditComment(comment)}><Edit size={14} /></button>
                                <button onClick={() => handleDeleteComment(comment.id)}><Trash2 size={14} /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {postPerm.canAdd && (
                <div className="comment-input">
                    <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                    />
                    <button onClick={handleCommentSubmit}>
                        <Send size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CommentsSection;