
import React, { useState } from "react";
import { Heart, MessageCircle, EyeOff, Eye, Send, CheckCircle, Circle, Edit, Trash2 } from "lucide-react";
import PROFILE from "../pages/alumni/PROFILE.jpeg";
import AdminPostsImg from "../AdminPosts.jpeg";
import { useNavigate } from "react-router-dom";

const AdminPostcard = ({
  post,
  postPerm,
  handleLike,
  toggleComments,
  handleCommentChange,
  handleCommentSubmit,
  handleLandingToggle,
  handleHide,
  handleUnhide,
  handleEditComment,
  handleDeleteComment,
  commentInputs,
  i18n
}) => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState({ postId: null, url: null });

  return (
    <div className="post-card" style={post.isHidden ? { backgroundColor: 'rgba(66, 64, 64, 0.15)' } : {}}>
      
      <div className="post-header">
        <div className="post-header-left">
          <img src={post.author?.photo || PROFILE} alt="profile" className="profile-pic" />
          <div className="post-header-info">
            <strong
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/helwan-alumni-portal/admin/dashboard/graduateprofile/${post.author.id}`)}
            >
              {post.author?.name || 'Unknown'}
            </strong>
            <div className="post-date-right">
              {new Date(post["created-at"]).toLocaleString(
                i18n.language === 'ar' ? 'ar-EG' : 'en-US',
                { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }
              )}
              - {post.category} {post['group-id'] ? ' - In Group' : ''}
            </div>
          </div>
        </div>

        {postPerm.canEdit && (!post.isHidden ? (
          <button onClick={() => handleHide(post.id)} className="hide-btn-top"><EyeOff size={16} /></button>
        ) : (
          <button onClick={() => handleUnhide(post.id)} className="hide-btn-top"><Eye size={16} /></button>
        ))}
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
                onClick={() => setSelectedImage({ postId: post.id, url: imgUrl })}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ))}
          </div>
        )}

        {selectedImage.url && selectedImage.postId === post.id && (
          <div className="image-modal" onClick={() => setSelectedImage({ postId: null, url: null })}>
            <img src={selectedImage.url} alt="full" />
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
      </div>

      {post.category === "Success story" && postPerm.canAdd && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <div className="landing-tooltip-container">
            <button onClick={() => handleLandingToggle(post.id, post.inLanding)} className="landing-btn">
              {post.inLanding ? <CheckCircle size={20} color="#4CAF50" /> : <Circle size={20} color="#ccc" />}
            </button>
            <span className="landing-tooltip">
              {post.inLanding ? "Remove from Landing Page" : "Add to Landing Page"}
            </span>
          </div>
        </div>
      )}

      {post.showComments && (
        <div className="comments-section">
          <div className="existing-comments">
            {post.comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <img src={comment.avatar || PROFILE} alt={comment.userName} className="comment-avatar" />
                <div className="comment-text">
                  <strong
                    style={{ cursor: "pointer", color: "#007bff" }}
                    onClick={() => navigate(`/helwan-alumni-portal/admin/dashboard/graduateprofile/${comment.author?.id}`)}
                  >
                    {comment.userName}
                  </strong>
                  : {comment.content}
                </div>
                <div className="comment-date">
                  {new Date(post["created-at"]).toLocaleString(
                    i18n.language === 'ar' ? 'ar-EG' : 'en-US',
                    { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }
                  )}
                </div>
                {(comment.author?.["user-type"] === "admin" || comment.author?.["user-type"] === "staff") && (
                  <div className="comment-actions">
                    <button onClick={() => handleEditComment(post.id, comment)}>
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteComment(post.id, comment.id)}>
                      <Trash2 size={14} />
                    </button>
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
                value={commentInputs[post.id] || ""}
                onChange={(e) => handleCommentChange(post.id, e.target.value)}
              />
              <button onClick={() => handleCommentSubmit(post.id)}>
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminPostcard;
