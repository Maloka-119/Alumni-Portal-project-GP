import React, { useState, useEffect } from "react";
import "./GroupDetail.css";
import AdminPostsImg from "./AdminPosts.jpeg";
import PROFILE from './PROFILE.jpeg';
import { Heart, MessageCircle, Info, ArrowLeft, Edit } from "lucide-react";
import API from "../../services/api";
import CreateBar from "../../components/CreatePostBar";
import { useTranslation } from "react-i18next";

function GroupDetail({ group, goBack, updateGroup }) {
  const { t } = useTranslation();
  const [selectedGraduates, setSelectedGraduates] = useState([]);
  const [availableGraduates, setAvailableGraduates] = useState([]);
  const [filteredGraduates, setFilteredGraduates] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [types, setTypes] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [years, setYears] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchFilters();
    fetchTypes();
  }, []);

  useEffect(() => {
    if (!group?.id) return;
    fetchMembers();
    fetchPosts();
  }, [group?.id]);

  const fetchMembers = async () => {
    try {
      const res = await API.get(`/${group.id}/users`);
      const members = (res.data.data || []).map((m) => ({
        id: m.id,
        "full-name": `${m["first-name"]} ${m["last-name"]}`,
        image: m.Graduate?.["profile-picture-url"] || PROFILE,
        faculty: m.Graduate?.faculty || "N/A",
        graduationYear: m.Graduate?.["graduation-year"] || "N/A",
      }));
      updateGroup({ ...group, members, membersCount: members.length });
    } catch (err) {
      console.error("Error fetching members:", err);
      updateGroup({ ...group, members: [], membersCount: 0 });
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await API.get(`/posts/${group.id}`);
      setPosts(res.data.data || []);
    } catch {
      setPosts([]);
    }
  };

  const fetchFilters = () => {
    setColleges([
  "Engineering",
  "Medicine",
  "Pharmacy",
  "Dentistry",
  "Nursing",
  "Science",
  "Arts",
  "Commerce",
  "Education",
  "Law",
  "Physical Education",
  "Computer Science",
  "Media and Arts",
  "Tourism and Hotels",
  "Applied Arts",
]);


    const currentYear = new Date().getFullYear();
    const yearsArr = [];
    for (let y = 2000; y <= currentYear; y++) {
      yearsArr.push(y);
    }
    setYears(yearsArr);
  };

  const fetchTypes = async () => {
    try {
      const res = await API.get("/posts/categories");
      setTypes(res.data.data || []);
    } catch {
      setTypes([]);
    }
  };

  const fetchAvailableGraduates = async () => {
    if (!group?.id) return;
    try {
      const res = await API.get(`/groups/${group.id}/available-graduates`);
      setAvailableGraduates(res.data || []);
      setFilteredGraduates(res.data || []);
    } catch (err) {
      console.error("Error fetching available graduates:", err);
      setAvailableGraduates([]);
      setFilteredGraduates([]);
    }
  };

  useEffect(() => {
    if (showAddModal) fetchAvailableGraduates();
  }, [showAddModal]);

  const toggleGraduate = (grad) => {
    setSelectedGraduates((prev) =>
      prev.includes(grad.id)
        ? prev.filter((id) => id !== grad.id)
        : [...prev, grad.id]
    );
  };

  const addGraduates = async () => {
    try {
      if (!group?.id || selectedGraduates.length === 0) return;

      await API.post("/add-to-group", {
        groupId: group.id,
        userIds: selectedGraduates,
      });

      const newMembers = [
        ...(group.members || []),
        ...availableGraduates
          .filter((g) => selectedGraduates.includes(g.id))
          .map((g) => ({
            id: g.id,
            "full-name": g.fullName,
            image: g.profilePicture || PROFILE,
            faculty: g.faculty,
            graduationYear: g.graduationYear,
          })),
      ];

      updateGroup({
        ...group,
        members: newMembers,
        membersCount: newMembers.length,
      });

      setSelectedGraduates([]);
      setShowAddModal(false);
    } catch (err) {
      console.error("Error adding graduates:", err);
    }
  };

  const handleLikePost = async (post) => {
    try {
      await API.post(`/posts/${post.post_id}/like`);
      await fetchPosts();
    } catch {}
  };

  const handlePostSubmit = async (formData, postId = null) => {
    try {
      formData.append("groupId", group.id);
      formData.append("category", formData.get("type"));
      formData.delete("type");

      if (postId) {
        await API.put(`/posts/${postId}/edit`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await API.post("/posts/create-post", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await fetchPosts();
      setEditingPost(null);
    } catch (err) {
      console.error("Error creating/updating post:", err);
    }
  };

  const startEditPost = (post) => {
    setEditingPost(post);
  };

  // فلترة الخريجين حسب الكلية والسنة
  const filterGraduates = (facultyFilter, yearFilter) => {
    let filtered = availableGraduates;
    if (facultyFilter) filtered = filtered.filter((g) => g.faculty === facultyFilter);
    if (yearFilter) filtered = filtered.filter((g) => g.graduationYear === parseInt(yearFilter));
    setFilteredGraduates(filtered);
  };

  return (
    <div className="containerr">
      <button className="back-btn" onClick={goBack}>
        <ArrowLeft size={16} />
      </button>

      <div className="group-header">
        <div className="created-icon-wrapper">
          <Info size={18} color="#4f46e5" />
          <div className="tooltip">
            {t("Created at")}: {new Date(group.createdAt).toLocaleString()}
          </div>
        </div>

        {group.cover ? (
          <img src={group.cover} alt={group.name} className="cover-img" />
        ) : (
          <div className="cover-placeholder">{t("No Cover Image")}</div>
        )}

        <h1 style={{ color: "#1e3a8a" }}>{group.name}</h1>

        <div className="group-actions">
          <div className="action-tag" onClick={() => setShowMembersModal(true)}>
            {Array.isArray(group.members)
              ? group.members.length
              : group.membersCount || 0}{" "}
            {t("Members")}
          </div>
          <div className="action-tag" onClick={() => setShowAddModal(true)}>
            {t("Add Members")} +
          </div>
          <p className="group-description">{group.description}</p>
        </div>
      </div>

      <div className="posts-section">
        <CreateBar
          types={types}
          editingPost={editingPost}
          onSubmit={handlePostSubmit}
        />

        <ul className="posts-list">
          {posts.map((p, index) => {
            if (!p) return null;
            const author = p.author || {};
            return (
              <li key={p.post_id || index} className="post-card">
                <div className="post-header">
                  <img
                    src={author.image || AdminPostsImg}
                    alt="author"
                    className="profile-pic"
                  />
                  <div className="post-header-info">
                    <strong>{author["full-name"]}</strong>
                    <div className="post-date">
                      {p["created-at"]
                        ? new Date(p["created-at"]).toLocaleString()
                        : ""}
                      {p.category && <span> - {p.category}</span>}
                    </div>
                  </div>
                  <Edit
                    size={16}
                    style={{ cursor: "pointer", marginLeft: "auto" }}
                    onClick={() => startEditPost(p)}
                  />
                </div>

                <div className="post-content">
                  <p>{p.content || t("No content available")}</p>
                  {p.images && p.images.length > 0 && (
                    <div className="post-images">
                      {p.images.map((imgUrl, index) => (
                        <img
                          key={index}
                          src={imgUrl}
                          alt={`post-${index}`}
                          className="post-image"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="post-actions">
                  <button onClick={() => handleLikePost(p)}>
                    <Heart size={16} />{" "}
                    {Array.isArray(p.likes) ? p.likes.length : p.likes || 0}{" "}
                    {t("Likes")}
                  </button>
                  <button>
                    <MessageCircle size={16} /> {p.comments?.length || 0}{" "}
                    {t("Comments")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Members Modal */}
      {showMembersModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <button
              className="modal-close"
              onClick={() => setShowMembersModal(false)}
            >
              X
            </button>
            <h3>{t("Members")}</h3>
            <ul>
              {(group.members || []).map((m) => (
                <li key={m.id} className="member-item">
                  <img
                    src={m.image}
                    alt={m["full-name"]}
                    className="member-avatar"
                  />
                  <span className="member-info">
                    {m["full-name"]} ({m.faculty}, {m.graduationYear})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Add Graduates Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <button
              className="modal-close"
              onClick={() => setShowAddModal(false)}
            >
              X
            </button>
            <h3>{t("Add Graduates")}</h3>

            {/* Filters */}
            <div className="filters">
              <select
                onChange={(e) => filterGraduates(e.target.value, null)}
              >
                <option value="">{t("All Colleges")}</option>
                {colleges.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                onChange={(e) => filterGraduates(null, e.target.value)}
              >
                <option value="">{t("All Years")}</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <ul>
              {filteredGraduates.map((g) => (
                <li key={g.id} className="graduate-item">
                  <input
                    type="checkbox"
                    checked={selectedGraduates.includes(g.id)}
                    onChange={() => toggleGraduate(g)}
                  />
                  <img
                    src={g.profilePicture || PROFILE}
                    alt={g.fullName}
                    className="graduate-avatar"
                  />
                  <span>
                    {g.fullName} ({g.faculty}, {g.graduationYear})
                  </span>
                </li>
              ))}
            </ul>
            <button onClick={addGraduates}>{t("Add to Group")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupDetail;
