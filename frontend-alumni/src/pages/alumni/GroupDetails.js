import React, { useState, useEffect } from "react";
import { ArrowLeft, Info, Image } from "lucide-react";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import PostCard from "../../components/PostCard";
import PROFILE from "./PROFILE.jpeg";
import "./GroupDetails.css";
import communityCover from "./defualtCommunityCover.jpg";
import AdminPostsImg from './AdminPosts.jpeg';

function GroupDetails({ group, goBack }) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [availableGraduates, setAvailableGraduates] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', image: null, link: '', category: 'General' });

  const storedUser = localStorage.getItem("user");
  const currentUserId = storedUser ? JSON.parse(storedUser).id : null;

  const [searchTerm, setSearchTerm] = useState("");
  const filteredGraduates = availableGraduates.filter((f) =>
    f.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!group?.id) return;
    fetchPosts();
    fetchAvailableGraduates();
    fetchInvitations();
  }, [group.id]);

  const formatPosts = (data) => {
    return data.map((post) => ({
      ...post,
      id: post.post_id,
      likes: post.likes_count || 0,
      liked: false,
      images: post.images || [],
      showComments: false,
      author: {
        id: post.author?.id,
        name:
          post.author?.type === "admin" || post.author?.type === "staff"
            ? "Alumni Portal - Helwan University"
            : post.author?.["full-name"] || "Unknown",
        photo:
          post.author?.type === "admin" || post.author?.type === "staff"
            ? AdminPostsImg 
            : post.author?.image || PROFILE,
      },
      date: post["created-at"],
    }));
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found");
        return;
      }

      const res = await API.get(`/posts/group/${group.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": "en",
        },
      });

      if (res.data.status === "success") {
        setPosts(formatPosts(res.data.data));
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  const fetchAvailableGraduates = async () => {
    try {
      // console.log("Token:", localStorage.getItem("token"));

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found");
        return;
      }


      const res = await API.get(`/groups/${group.id}/available-graduates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": "en",
        },
      });

      setAvailableGraduates(res.data || []);
    } catch (err) {
      console.error("Error fetching available graduates:", err);
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found");
        return;
      }

      const receivedRes = await API.get("/invitations/received", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": "en",
        },
      });

      const receivedInvites = receivedRes?.data?.data || [];
      setInvitations(receivedInvites.filter(inv => inv.group_id === group.id));
    } catch (err) {
      console.error("خطأ أثناء جلب الدعوات:", err);
      setInvitations([]);
    }
  };

  const handleToggleInvitation = async (friend) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found");
        return;
      }

      if (friend.invitationStatus === "pending") {
        await API.post(`/invitations/${friend.invitationId}/cancel`, null, {
          headers: { Authorization: `Bearer ${token}`, "Accept-Language": "en" },
        });
        setAvailableGraduates(prev => prev.map(f => f.id === friend.id ? { ...f, invitationStatus: "not_invited", invitationId: null } : f));
      } else if (friend.invitationStatus === "not_invited") {
        const res = await API.post("/invitations/send", { receiver_id: friend.id, group_id: group.id }, {
          headers: { Authorization: `Bearer ${token}`, "Accept-Language": "en" },
        });
        const newInvitationId = res.data.invitationId || res.data.id;
        setAvailableGraduates(prev => prev.map(f => f.id === friend.id ? { ...f, invitationStatus: "pending", invitationId: newInvitationId } : f));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOrEditPost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found");
        return;
      }

      const formData = new FormData();
      formData.append("content", newPost.content);
      formData.append("category", newPost.category);
      formData.append("groupId", group.id);
      if (newPost.image) formData.append("image", newPost.image);

      if (!isEditingMode) {
        await API.post("/posts/create-post", formData, {
          headers: { Authorization: `Bearer ${token}`, "Accept-Language": "en" },
        });
      }

      setShowForm(false);
      setNewPost({ content: '', image: null, link: '', category: 'General' });
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPost = (post) => {
    setIsEditingMode(true);
    setShowForm(true);
    setNewPost({
      content: post.content,
      image: post.images?.[0] || null,
      category: post.category,
      postId: post.id || post.post_id, 
    });
  };

  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found");
        return;
      }

      await API.delete(`/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}`, "Accept-Language": "en" },
      });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="group-details">
      <button className="back-btn" onClick={goBack}>
        <ArrowLeft size={16} />
      </button>

      <div className="group-header">
        <div className="created-icon-wrapper">
          <Info size={18} color="#4f46e5" />
          <div className="tooltip">
            {t("Created at")}: {new Date(group.createdAt || Date.now()).toLocaleString()}
          </div>
        </div>

        <img
          src={group.groupImage || group.cover || communityCover}
          alt={group.groupName || group.name}
          className="cover-img"
        />

        <h1>{group.groupName || group.name}</h1>
        <p className="group-description">{group.description}</p>

        <button className="invite-btn" onClick={() => setShowInviteSection(!showInviteSection)}>
          {showInviteSection ? t("Hide Invites") : t("Invite")}
        </button>
      </div>

      {showInviteSection && (
        <div className="invite-section">
          <h3>{t("Invite Friends")}</h3>

          <input
            type="text"
            placeholder={t("Search by name")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="invite-search"
          />

          {filteredGraduates.length === 0 ? (
            <p>{t("No graduates available to invite.")}</p>
          ) : (
            <ul className="invite-list">
              {filteredGraduates.map((f) => (
                <li key={f.id}>
                  <div className="friend-info">
                    <img src={f.profilePicture || PROFILE} alt="Profile" />
                    <span>{f.fullName}</span>
                  </div>
                  <button
                    className={`invite-action ${f.invitationStatus === "pending" ? "cancel" : "invite"}`}
                    onClick={() => handleToggleInvitation(f)}
                  >
                    {f.invitationStatus === "pending"
                      ? t("Cancel Invitation")
                      : t("Invite to Group")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="am-create-bar" onClick={() => {
        setShowForm(true);
        setIsEditingMode(false);
        setNewPost({ content: '', image: null, link: '', category: 'General' });
      }}>
        <input placeholder={t('createNewPost')} readOnly />
      </div>

      {showForm && (
        <form className="uni-post-form" onSubmit={handleAddOrEditPost}>
          <textarea
            placeholder={t('writePost')}
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            rows={4}
          />
          <div className="uni-category-select">
            <label>{t('category')}:</label>
            <select
              value={newPost.category}
              onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
            >
              <option value="General">General</option>
              <option value="Internship">Internship</option>
              <option value="Success story">Success story</option>
            </select>
          </div>
          <div className="uni-optional-icons">
            <label title={t('addImage')}>
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })}
              />
              <Image size={20} />
            </label>
          </div>
          <div className="uni-form-buttons">
            <button type="submit">{isEditingMode ? t('update') : t('post')}</button>
            <button type="button" onClick={() => {
              setShowForm(false);
              setIsEditingMode(false);
              setNewPost({ content: '', image: null, link: '', category: 'General' });
            }}>{t('cancel')}</button>
          </div>
        </form>
      )}

      <div className="posts-list">
        {posts.map(post => (
          <PostCard key={post.id || post.post_id} post={post} currentUserId={currentUserId} />
        ))}
      </div>
    </div>
  );
}

export default GroupDetails;
