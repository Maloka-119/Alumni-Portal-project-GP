

// import React, { useState, useEffect } from "react";
// import "./GroupDetail.css";
// import AdminPostsImg from "./AdminPosts.jpeg";
// import PROFILE from "./PROFILE.jpeg";
// import { Heart, MessageCircle, Info, ArrowLeft, Edit } from "lucide-react";
// import API from "../../services/api";
// import CreateBar from "../../components/CreatePostBar";

// function GroupDetail({ group, goBack, updateGroup }) {
//   const [college, setCollege] = useState("");
//   const [year, setYear] = useState("");
//   const [graduates, setGraduates] = useState([]);
//   const [selectedGraduates, setSelectedGraduates] = useState([]);
//   const [editingPost, setEditingPost] = useState(null);
//   const [types, setTypes] = useState([]);
//   const [colleges, setColleges] = useState([]);
//   const [years, setYears] = useState([]);
//   const [showMembersModal, setShowMembersModal] = useState(false);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [posts, setPosts] = useState([]); // هنا البوستات

//   useEffect(() => {
//     fetchGraduates();
//   }, [college, year]);

//   useEffect(() => {
//     fetchFilters();
//     fetchTypes();
//   }, []);

//   useEffect(() => {
//     if (!group?.id) return;
//     fetchMembers();
//     fetchPosts();
//   }, [group?.id]);

//   const fetchMembers = async () => {
//     try {
//       const res = await API.get(`/${group.id}/users`);
//       const members = res.data.data || [];
//       updateGroup({ ...group, members, membersCount: members.length });
//     } catch {
//       updateGroup({ ...group, members: [], membersCount: 0 });
//     }
//   };

//   const fetchPosts = async () => {
//     try {
//       const res = await API.get(`/posts/${group.id}`);
//       const fetchedPosts = res.data.data || [];
//       console.log("Fetched group posts:", fetchedPosts);
//       setPosts(fetchedPosts);
//     } catch {
//       setPosts([]);
//     }
//   };

//   const fetchGraduates = async () => {
//     try {
//       const query = [];
//       if (college) query.push(`faculty=${encodeURIComponent(college)}`);
//       if (year) query.push(`graduation-year=${year}`);
//       const queryString = query.length ? `?${query.join("&")}` : "";
//       const res = await API.get(`/graduates/search${queryString}`);
//       setGraduates(res.data.data || []);
//     } catch {}
//   };

//   const fetchFilters = () => {
//     setColleges(["Engineering", "Medicine", "Arts"]);
//     setYears([2020, 2021]);
//   };

//   const fetchTypes = async () => {
//     try {
//       const res = await API.get("/posts/categories");
//       setTypes(res.data.data || []);
//     } catch {
//       setTypes([]);
//     }
//   };

//   const toggleGraduate = (grad) => {
//     setSelectedGraduates((prev) =>
//       prev.includes(grad.graduate_id)
//         ? prev.filter((id) => id !== grad.graduate_id)
//         : [...prev, grad.graduate_id]
//     );
//   };

//   const addGraduates = async () => {
//     try {
//       if (!group?.id || selectedGraduates.length === 0) return;

//       await API.post("/add-to-group", {
//         groupId: group.id,
//         userIds: selectedGraduates,
//       });

//       const newMembers = [
//         ...(group.members || []),
//         ...graduates
//           .filter((g) => selectedGraduates.includes(g.graduate_id))
//           .map((g) => g.User),
//       ];

//       updateGroup({
//         ...group,
//         members: newMembers,
//         membersCount: newMembers.length,
//       });

//       setSelectedGraduates([]);
//       setShowAddModal(false);
//     } catch {}
//   };

//   const handleLikePost = async (post) => {
//     try {
//       await API.post(`/posts/${post.post_id}/like`);
//       await fetchPosts(); // إعادة جلب بعد اللايك
//     } catch {}
//   };

//   const handlePostSubmit = async (formData, postId = null) => {
//     try {
//       formData.append('groupId', group.id);
//       formData.append('category', formData.get('type'));
//       formData.delete('type');
  
//       if (postId) {
//         await API.put(`/posts/${postId}/edit`, formData, {
//           headers: { 'Content-Type': 'multipart/form-data' },
//         });
//       } else {
//         await API.post("/posts/create-post", formData, {
//           headers: { 'Content-Type': 'multipart/form-data' },
//         });
//       }
  
//       // تحديث البوستات مباشرة
//       await fetchPosts();
  
//       setEditingPost(null);
  
//     } catch (err) {
//       console.error("Error creating/updating post:", err);
//     }
//   };
  
  
  
  
  

//   const startEditPost = (post) => {
//     setEditingPost(post);
//   };

//   return (
//     <div className="containerr">
//       <button
//         className="back-btn"
//         onClick={goBack}
//         style={{ float: "right", display: "flex", alignItems: "center", gap: "6px" }}
//       >
//         <ArrowLeft size={16} />
//       </button>

//       <div className="group-header">
//         <div className="created-icon-wrapper">
//           <Info size={18} color="#4f46e5" />
//           <div className="tooltip">
//             Created at: {new Date(group.createdAt).toLocaleString()}
//           </div>
//         </div>

//         {group.cover ? (
//           <img src={group.cover} alt={group.name} className="cover-img" />
//         ) : (
//           <div className="cover-placeholder">No Cover Image</div>
//         )}

//         <h1 style={{ color: "#1e3a8a" }}>{group.name}</h1>

//         <div className="group-actions">
//           <div className="action-tag" onClick={() => setShowMembersModal(true)}>
//             {Array.isArray(group.members) ? group.members.length : group.membersCount || 0} Members
//           </div>
//           <div className="action-tag" onClick={() => setShowAddModal(true)}>
//             Add Members +
//           </div>
//           <p className="group-description">{group.description}</p>
//         </div>
//       </div>

//       <div className="posts-section">
//         <CreateBar
//           types={types}
//           editingPost={editingPost}
//           onSubmit={handlePostSubmit}
//         />

//         <ul className="posts-list">
//           {posts.map((p, index) => {
//             if (!p) return null;
//             const author = p.author || {};
//             return (
//               <li key={p.post_id || index} className="post-card">
//                 <div className="post-header">
//                   <img src={author.image || AdminPostsImg} alt="author" className="profile-pic" />
//                   <div className="post-header-info">
//                     <strong>{author["full-name"]}</strong>
//                     <div className="post-date">
//                       {p["created-at"] ? new Date(p["created-at"]).toLocaleString() : ""}
//                       {p.category && <span> - {p.category}</span>}
//                     </div>
//                   </div>
//                   <Edit size={16} style={{ cursor: "pointer", marginLeft: "auto" }} onClick={() => startEditPost(p)} />
//                 </div>

//                 <div className="post-content">
//                   <p>{p.content || "No content available."}</p>
//                   {p.images && p.images.length > 0 && (
//                     <div className="post-images">
//                       {p.images.map((imgUrl, index) => (
//                         <img
//                           key={index}
//                           src={imgUrl}
//                           alt={`post-${index}`}
//                           className="post-image"
//                           onError={(e) => { e.target.style.display = 'none'; }}
//                         />
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 <div className="post-actions">
//                   <button onClick={() => handleLikePost(p)}>
//                     <Heart size={16} /> {Array.isArray(p.likes) ? p.likes.length : (p.likes || 0)}
//                   </button>
//                   <button>
//                     <MessageCircle size={16} /> {p.comments?.length || 0}
//                   </button>
//                 </div>
//               </li>
//             );
//           })}
//         </ul>
//       </div>

//       {showMembersModal && (
//         <div className="modal-overlay">
//           <div className="modal-window">
//             <button className="modal-close" onClick={() => setShowMembersModal(false)}>X</button>
//             <h3>Members</h3>
//             <ul>
//               {(group.members || []).map((m, index) => (
//                 <li key={m.id || index}>{m["first-name"]} {m["last-name"]}</li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       )}

//       {showAddModal && (
//         <div className="modal-overlay">
//           <div className="modal-window">
//             <button className="modal-close" onClick={() => setShowAddModal(false)}>X</button>
//             <h3>Add Graduates</h3>
//             <div className="filters">
//               <select value={college} onChange={(e) => setCollege(e.target.value)}>
//                 <option value="">All Colleges</option>
//                 {colleges.map((c) => (<option key={c} value={c}>{c}</option>))}
//               </select>
//               <select value={year} onChange={(e) => setYear(e.target.value)}>
//                 <option value="">All Years</option>
//                 {years.map((y) => (<option key={y} value={y}>{y}</option>))}
//               </select>
//             </div>
//             <ul>
//               {graduates.map((g) => (
//                 <li key={g.graduate_id}>
//                   <input
//                     type="checkbox"
//                     checked={selectedGraduates.includes(g.graduate_id)}
//                     onChange={() => toggleGraduate(g)}
//                   />
//                   {g.User["first-name"]} {g.User["last-name"]} ({g.faculty}, {g["graduation-year"]})
//                 </li>
//               ))}
//             </ul>
//             <button onClick={addGraduates}>Add to Group</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default GroupDetail;

import React, { useState, useEffect } from "react";
import "./GroupDetail.css";
import AdminPostsImg from "./AdminPosts.jpeg";
import { Heart, MessageCircle, Info, ArrowLeft, Edit } from "lucide-react";
import API from "../../services/api";
import CreateBar from "../../components/CreatePostBar";
import { useTranslation } from "react-i18next";

function GroupDetail({ group, goBack, updateGroup }) {
  const { t } = useTranslation();
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [graduates, setGraduates] = useState([]);
  const [selectedGraduates, setSelectedGraduates] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [types, setTypes] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [years, setYears] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchGraduates();
  }, [college, year]);

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
      const members = res.data.data || [];
      updateGroup({ ...group, members, membersCount: members.length });
    } catch {
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

  const fetchGraduates = async () => {
    try {
      const query = [];
      if (college) query.push(`faculty=${encodeURIComponent(college)}`);
      if (year) query.push(`graduation-year=${year}`);
      const queryString = query.length ? `?${query.join("&")}` : "";
      const res = await API.get(`/graduates/search${queryString}`);
      setGraduates(res.data.data || []);
    } catch {}
  };

  const fetchFilters = () => {
    setColleges(["Engineering", "Medicine", "Arts"]);
    setYears([2020, 2021]);
  };

  const fetchTypes = async () => {
    try {
      const res = await API.get("/posts/categories");
      setTypes(res.data.data || []);
    } catch {
      setTypes([]);
    }
  };

  const toggleGraduate = (grad) => {
    setSelectedGraduates((prev) =>
      prev.includes(grad.graduate_id)
        ? prev.filter((id) => id !== grad.graduate_id)
        : [...prev, grad.graduate_id]
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
        ...graduates
          .filter((g) => selectedGraduates.includes(g.graduate_id))
          .map((g) => g.User),
      ];

      updateGroup({
        ...group,
        members: newMembers,
        membersCount: newMembers.length,
      });

      setSelectedGraduates([]);
      setShowAddModal(false);
    } catch {}
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
                    {Array.isArray(p.likes)
                      ? p.likes.length
                      : p.likes || 0}{" "}
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
              {(group.members || []).map((m, index) => (
                <li key={m.id || index}>
                  {m["first-name"]} {m["last-name"]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
            <div className="filters">
              <select value={college} onChange={(e) => setCollege(e.target.value)}>
                <option value="">{t("All Colleges")}</option>
                {colleges.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">{t("All Years")}</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <ul>
              {graduates.map((g) => (
                <li key={g.graduate_id}>
                  <input
                    type="checkbox"
                    checked={selectedGraduates.includes(g.graduate_id)}
                    onChange={() => toggleGraduate(g)}
                  />
                  {g.User["first-name"]} {g.User["last-name"]} ({g.faculty},{" "}
                  {g["graduation-year"]})
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
