

import React, { useState, useEffect } from "react";
import "./GroupDetail.css";
import AdminPostsImg from "./AdminPosts.jpeg";
import PROFILE from './PROFILE.jpeg';
import { Heart, MessageCircle, Info, ArrowLeft, Edit,Trash2 } from "lucide-react";
import API from "../../services/api";
import CreateBar from "../../components/CreatePostBar";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import communityCover from "./defualtCommunityCover.jpg";
import { useRef } from "react";

function GroupDetail({ group, goBack, updateGroup, perms, currentUserId }) {
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
  const [commentInputs, setCommentInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const formRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null)


  useEffect(() => {
    fetchFilters();
    fetchTypes();
  }, []);

  useEffect(() => {
    if (!group?.id) return;
    fetchMembers();
    fetchPosts();
  }, [group?.id]);

  const formatPosts = (data) => {
    return data.map((post) => {
      const formattedComments = (post.comments || []).map((comment) => {
        const isAdminOrStaff = ["admin", "staff"].includes(comment.author?.["user-type"]);
        return {
          id: comment.comment_id,
          userName: isAdminOrStaff ? "Alumni Portal – Helwan University" : comment.author?.["full-name"] || "Unknown User",
          content: comment.content,
          avatar: isAdminOrStaff ? AdminPostsImg : comment.author?.image || PROFILE,
          date: comment["created-at"],
        };
      });
  
      return {
        ...post,
        id: post.post_id,
        likes: post.likesCount || 0,
        liked: post.isLikedByYou || false,
        comments: formattedComments,
        images: post.images || [],
        author: {
          id: post.author?.id,
          name: post.author?.["full-name"] || "Unknown",
          photo: post.author?.image || AdminPostsImg,
          type: post.author?.type || "user",
        },
        showComments: false,  
      };
    });
  };
  
  
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
      setLoading(true);
      console.log("Fetching posts for group:", group.id); 
  
      const res = await API.get(`/posts/group/${group.id}`);
      console.log("API response:", res.data); 
  
      if (res.data.status === "success") {
        const formatted = formatPosts(res.data.data);
        console.log("Formatted posts:", formatted);
        setPosts(formatted);
      } else {
        console.warn("No posts found or API status not success");
        setPosts([]);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
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

    Swal.fire({
      icon: "success",
      title: "Graduates added successfully!",
      showConfirmButton: false,
      timer: 1500,
    });
  } catch (err) {
    console.error("Error adding graduates:", err);
    Swal.fire({
      icon: "error",
      title: "Failed to add graduates",
      text: err.response?.data?.message || "",
    });
  }
};

const handleLike = async (postId) => {
  const postIndex = posts.findIndex((p) => p.id === postId);
  if (postIndex === -1) return;

  const post = posts[postIndex];
  const action = post.liked ? "delete" : "post";

  try {
    if (action === "post") {
      await API.post(`/posts/${postId}/like`);
      posts[postIndex] = { ...post, liked: true, likes: post.likes + 1 };
    } else {
      await API.delete(`/posts/${postId}/like`);
      posts[postIndex] = { ...post, liked: false, likes: Math.max(0, post.likes - 1) };
    }
    setPosts([...posts]);
  } catch (err) {
    console.error("Error toggling like:", err.response?.data || err);
  }
};

  const handleCommentChange = (postId, value) => {
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  const handleCommentSubmit = async (postId) => {
    const comment = commentInputs[postId];
    if (!comment?.trim()) return;
  
    try {
      const res = await API.post(`/posts/${postId}/comments`, { content: comment });
  
      if (res.data.comment) {
        const isAdminOrStaff = ["admin", "staff"].includes(res.data.comment.author?.["user-type"]);
        const newComment = {
          id: res.data.comment.comment_id,
          userName: isAdminOrStaff ? "Alumni Portal – Helwan University" : res.data.comment.author?.["full-name"] || "You",
          content: res.data.comment.content,
          avatar: isAdminOrStaff ? AdminPostsImg : res.data.comment.author?.image || PROFILE,
          date: new Date().toLocaleString(),
        };
  
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, comments: [...post.comments, newComment] }
              : post
          )
        );
      }
  
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      Swal.fire({ icon: "success", title: "Comment added!", showConfirmButton: false, timer: 1200 });
    } catch (err) {
      console.error("Error submitting comment:", err.response?.data || err);
      Swal.fire({ icon: "error", title: "Failed to add comment", text: err.response?.data?.message || "" });
    }
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
      const res = await API.post("/posts/create-post", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      postId = res.data?.post?.post_id; 
    }

    await fetchPosts();
    setEditingPost(null);

    if (postId) {
      setTimeout(() => {
        const postEl = document.getElementById(`post-${postId}`);
        postEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  } catch (err) {
    console.error("Error creating/updating post:", err);
  }
};


  const startEditPost = (post) => {
    setEditingPost(post);
  
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };
  

  const filterGraduates = (facultyFilter, yearFilter) => {
    let filtered = availableGraduates;
    if (facultyFilter) filtered = filtered.filter((g) => g.faculty === facultyFilter);
    if (yearFilter) filtered = filtered.filter((g) => g.graduationYear === parseInt(yearFilter));
    setFilteredGraduates(filtered);
  };
  const handleDelete = async (id) => {
    if (!perms.postPerms.canDelete) return;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      try {
        await API.delete(`/posts/${id}`);
        Swal.fire({ icon: "success", title: "Deleted!", text: "Post deleted successfully" });
        fetchPosts();
      } catch (err) {
        console.error("Error deleting post:", err);
        Swal.fire({ icon: "error", title: "Error", text: "Failed to delete post" });
      }
    }
  };

  const toggleComments = (postId) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId ? { ...post, showComments: !post.showComments } : post
      )
    );
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
<img 
  src={group.cover || communityCover} 
  alt={group.name} 
  className="cover-img" 
/>


        <h1 style={{ color: "#1e3a8a" }}>{group.name}</h1>

        <div className="group-actions">
        {perms.memberPerms.canView && (
  <div className="action-tag" onClick={() => setShowMembersModal(true)}>
    {Array.isArray(group.members) ? group.members.length : group.membersCount || 0} {t("Members")}
  </div>
)}


{perms.memberPerms.canAdd && (
  <div className="action-tag" onClick={() => setShowAddModal(true)}>
    {t("Add Members")} +
  </div>
)}

          <p className="group-description">{group.description}</p>
        </div>
      </div>

      <div className="posts-section">
      <div ref={formRef}>
  {(perms.postPerms.canAdd || editingPost) && (
    <CreateBar
    types={types}
    editingPost={editingPost}
    onSubmit={handlePostSubmit}
    canAdd={perms.postPerms.canAdd}
    onCancelEdit={() => setEditingPost(null)}
    />
  )}
</div>



        {loading && <div className="loading">Loading posts...</div>}
        
        <ul className="posts-list">
        {posts.map((post) => (
  <li key={post.id} id={`post-${post.id}`} className="post-card">
    <div className="post-header">
      <img
        src={
          post.author?.name === "Alumni Portal – Helwan University"
            ? AdminPostsImg
            : post.author?.photo || PROFILE
        }
        alt="author"
        className="profile-pic"
        onError={(e) => { e.target.src = PROFILE }}
      />
      <div className="post-header-info">
        <strong>{post.author?.name || "Unknown"}</strong>
        <div className="post-date">
          {new Date(post["created-at"]).toLocaleString()} - {post.category}
        </div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>

  {(post.author?.id === currentUserId || 
    (["staff", "admin"].includes(post.author?.type) && perms.postPerms.canEdit)) && (
    <Edit
      size={16}
      style={{ cursor: "pointer" }}
      onClick={() => startEditPost(post)}
    />
  )}

  {(post.author?.id === currentUserId || 
    (["staff", "admin"].includes(post.author?.type) && perms.postPerms.canDelete)) && (
    <Trash2
      size={16}
      style={{ cursor: "pointer" }}
      onClick={() => handleDelete(post.id)}
    />
  )}
</div>

    </div>


              <div className="post-content">
                <p>{post.content || t("No content available")}</p>
                {post.images && post.images.length > 0 && (
                  <div className="post-images">
                    {post.images.map((imgUrl, index) => (
  <img
    key={index}
    src={imgUrl}
    alt={`post-${index}`}
    className="post-image"
    onClick={() => setSelectedImage(imgUrl)}
  />
))}
{selectedImage && (
  <div className="image-modal" onClick={() => setSelectedImage(null)}>
    <img src={selectedImage} alt="full" />
  </div>
)}
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="post-actions">
                <button 
                  className={post.liked ? "liked" : ""}
                  onClick={() => handleLike(post.id)}
                >
                  <Heart size={16} color={post.liked ? "#e0245e" : "#555"} />{" "}
                  {post.likes} 
                </button>
                <button onClick={() => toggleComments(post.id)}>
  <MessageCircle size={16} /> {post.comments?.length || 0} 
</button>

              </div>

              {post.showComments && (
  <div className="comments-section">
    <div className="existing-comments">
      {post.comments.map((comment) => (
        <div key={comment.id} className="comment-item">
          <img
            src={comment.avatar || PROFILE}
            alt={comment.userName}
            className="comment-avatar"
            onError={(e) => { e.target.src = PROFILE }}
          />
          <div className="comment-text">
            <strong className="comment-username">{comment.userName}</strong>: {comment.content}
          </div>
          <div className="comment-date">
            {new Date(comment.date).toLocaleString([], { 
              year: "numeric", 
              month: "2-digit", 
              day: "2-digit", 
              hour: "2-digit", 
              minute: "2-digit" 
            })}
          </div>
        </div>
      ))}
    </div>

    {perms.postPerms.canAdd && (
      <div className="comment-input">
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentInputs[post.id] || ""}
          onChange={(e) => handleCommentChange(post.id, e.target.value)}
        />
        <button onClick={() => handleCommentSubmit(post.id)}>
          Send
        </button>
      </div>
    )}
  </div>
)}


            </li>
          ))}
        </ul>

        {!loading && posts.length === 0 && (
          <p className="empty-state">No posts yet in this group.</p>
        )}
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
                    onError={(e) => { e.target.src = PROFILE }}
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
                    onError={(e) => { e.target.src = PROFILE }}
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

// import React, { useState, useEffect } from "react";
// import "./GroupDetail.css";
// import AdminPostsImg from "./AdminPosts.jpeg";
// import PROFILE from './PROFILE.jpeg';
// import { Heart, MessageCircle, Info, ArrowLeft, Edit } from "lucide-react";
// import API from "../../services/api";
// import CreateBar from "../../components/CreatePostBar";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import communityCover from "./defualtCommunityCover.jpg"
// function GroupDetail({ group, goBack, updateGroup }) {
//   const { t } = useTranslation();
//   const [selectedGraduates, setSelectedGraduates] = useState([]);
//   const [availableGraduates, setAvailableGraduates] = useState([]);
//   const [filteredGraduates, setFilteredGraduates] = useState([]);
//   const [editingPost, setEditingPost] = useState(null);
//   const [types, setTypes] = useState([]);
//   const [colleges, setColleges] = useState([]);
//   const [years, setYears] = useState([]);
//   const [showMembersModal, setShowMembersModal] = useState(false);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [posts, setPosts] = useState([]);
//   const [commentInputs, setCommentInputs] = useState({});
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchFilters();
//     fetchTypes();
//   }, []);

//   useEffect(() => {
//     if (!group?.id) return;
//     fetchMembers();
//     fetchPosts();
//   }, [group?.id]);

//   // ====================== Format Posts بنفس منطق صفحة الخريجين ======================
//   const formatPosts = (data) => {
//     return data.map((post) => {
//       const formattedComments = (post.comments || []).map((comment) => ({
//         id: comment.comment_id,
//         userName: comment.author?.["full-name"] || "Unknown User",
//         content: comment.content,
//         avatar: comment.author?.image || AdminPostsImg,
//         date: comment["created-at"],
//       }));

//       return {
//         ...post,
//         id: post.post_id,
//         likes: post.likes_count || 0,
//         liked: post.liked || false,
//         comments: formattedComments,
//         images: post.images || [],
//         author: {
//           id: post.author?.id,
//           name: post.author?.["full-name"] || "Unknown",
//           photo: post.author?.image ||AdminPostsImg,
//         },
//       };
//     });
//   };

//   const fetchMembers = async () => {
//     try {
//       const res = await API.get(`/${group.id}/users`);
//       const members = (res.data.data || []).map((m) => ({
//         id: m.id,
//         "full-name": `${m["first-name"]} ${m["last-name"]}`,
//         image: m.Graduate?.["profile-picture-url"] || PROFILE,
//         faculty: m.Graduate?.faculty || "N/A",
//         graduationYear: m.Graduate?.["graduation-year"] || "N/A",
//       }));
//       updateGroup({ ...group, members, membersCount: members.length });
//     } catch (err) {
//       console.error("Error fetching members:", err);
//       updateGroup({ ...group, members: [], membersCount: 0 });
//     }
//   };

//   const fetchPosts = async () => {
//     try {
//       setLoading(true);
//       console.log("Fetching posts for group:", group.id); 
  
//       const res = await API.get(`/posts/group/${group.id}`);
//       console.log("API response:", res.data); 
  
//       if (res.data.status === "success") {
//         const formatted = formatPosts(res.data.data);
//         console.log("Formatted posts:", formatted);
//         setPosts(formatted);
//       } else {
//         console.warn("No posts found or API status not success");
//         setPosts([]);
//       }
//     } catch (err) {
//       console.error("Error fetching posts:", err);
//       setPosts([]);
//     } finally {
//       setLoading(false);
//     }
//   };
  

//   const fetchFilters = () => {
//     setColleges([
//       "Engineering",
//       "Medicine",
//       "Pharmacy",
//       "Dentistry",
//       "Nursing",
//       "Science",
//       "Arts",
//       "Commerce",
//       "Education",
//       "Law",
//       "Physical Education",
//       "Computer Science",
//       "Media and Arts",
//       "Tourism and Hotels",
//       "Applied Arts",
//     ]);

//     const currentYear = new Date().getFullYear();
//     const yearsArr = [];
//     for (let y = 2000; y <= currentYear; y++) {
//       yearsArr.push(y);
//     }
//     setYears(yearsArr);
//   };

//   const fetchTypes = async () => {
//     try {
//       const res = await API.get("/posts/categories");
//       setTypes(res.data.data || []);
//     } catch {
//       setTypes([]);
//     }
//   };

//   const fetchAvailableGraduates = async () => {
//     if (!group?.id) return;
//     try {
//       const res = await API.get(`/groups/${group.id}/available-graduates`);
//       setAvailableGraduates(res.data || []);
//       setFilteredGraduates(res.data || []);
//     } catch (err) {
//       console.error("Error fetching available graduates:", err);
//       setAvailableGraduates([]);
//       setFilteredGraduates([]);
//     }
//   };

//   useEffect(() => {
//     if (showAddModal) fetchAvailableGraduates();
//   }, [showAddModal]);

//   const toggleGraduate = (grad) => {
//     setSelectedGraduates((prev) =>
//       prev.includes(grad.id)
//         ? prev.filter((id) => id !== grad.id)
//         : [...prev, grad.id]
//     );
//   };

// const addGraduates = async () => {
//   try {
//     if (!group?.id || selectedGraduates.length === 0) return;

//     await API.post("/add-to-group", {
//       groupId: group.id,
//       userIds: selectedGraduates,
//     });

//     const newMembers = [
//       ...(group.members || []),
//       ...availableGraduates
//         .filter((g) => selectedGraduates.includes(g.id))
//         .map((g) => ({
//           id: g.id,
//           "full-name": g.fullName,
//           image: g.profilePicture || PROFILE,
//           faculty: g.faculty,
//           graduationYear: g.graduationYear,
//         })),
//     ];

//     updateGroup({
//       ...group,
//       members: newMembers,
//       membersCount: newMembers.length,
//     });

//     setSelectedGraduates([]);
//     setShowAddModal(false);

//     Swal.fire({
//       icon: "success",
//       title: "Graduates added successfully!",
//       showConfirmButton: false,
//       timer: 1500,
//     });
//   } catch (err) {
//     console.error("Error adding graduates:", err);
//     Swal.fire({
//       icon: "error",
//       title: "Failed to add graduates",
//       text: err.response?.data?.message || "",
//     });
//   }
// };

//   // ====================== Likes - نفس منطق صفحة الخريجين ======================
//   const handleLike = async (postId) => {
//     const postIndex = posts.findIndex((p) => p.id === postId);
//     if (postIndex === -1) return;

//     try {
//       const post = posts[postIndex];

//       // حاول unlike أولاً
//       try {
//         await API.delete(`/posts/${postId}/like`);
//         // إذا نجح الـ unlike، هذا معناه أن البوست كان معجب بيه
//         const updatedPosts = [...posts];
//         updatedPosts[postIndex] = {
//           ...post,
//           likes: Math.max(0, post.likes - 1),
//           liked: false,
//         };
//         setPosts(updatedPosts);
//         console.log("✅ Successfully unliked post:", postId);
//       } catch (unlikeError) {
//         // إذا فشل الـ unlike، جرب like
//         if (unlikeError.response?.status === 404) {
//           await API.post(`/posts/${postId}/like`);
//           const updatedPosts = [...posts];
//           updatedPosts[postIndex] = {
//             ...post,
//             likes: post.likes + 1,
//             liked: true,
//           };
//           setPosts(updatedPosts);
//           console.log("✅ Successfully liked post:", postId);
//         } else {
//           throw unlikeError;
//         }
//       }
//     } catch (err) {
//       console.error("🔴 Error in handleLike:", err.response?.data || err);
//       // في حالة أي خطأ، أعد جلب البيانات من السيرفر
//       await fetchPosts();
//     }
//   };

//   // ====================== Comments - نفس منطق صفحة الخريجين ======================
//   const handleCommentChange = (postId, value) => {
//     setCommentInputs({ ...commentInputs, [postId]: value });
//   };

// const handleCommentSubmit = async (postId) => {
//   const comment = commentInputs[postId];
//   if (!comment?.trim()) return;

//   try {
//     const res = await API.post(`/posts/${postId}/comments`, {
//       content: comment,
//     });

//     if (res.data.comment) {
//       const newComment = {
//         id: res.data.comment.comment_id,
//         userName: res.data.comment.author?.["full-name"] || "You",
//         content: res.data.comment.content,
//         avatar: res.data.comment.author?.image || PROFILE,
//         date: new Date().toLocaleString(),
//       };

//       setPosts((prev) =>
//         prev.map((post) =>
//           post.id === postId
//             ? { ...post, comments: [...post.comments, newComment] }
//             : post
//         )
//       );
//     }

//     setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
//     Swal.fire({
//       icon: "success",
//       title: "Comment added!",
//       showConfirmButton: false,
//       timer: 1200,
//     });
//   } catch (err) {
//     console.error("🔴 Error submitting comment:", err.response?.data || err);
//     Swal.fire({
//       icon: "error",
//       title: "Failed to add comment",
//       text: err.response?.data?.message || "",
//     });
//   }
// };


//   const handlePostSubmit = async (formData, postId = null) => {
//     try {
//       formData.append("groupId", group.id);
//       formData.append("category", formData.get("type"));
//       formData.delete("type");

//       if (postId) {
//         await API.put(`/posts/${postId}/edit`, formData, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//       } else {
//         await API.post("/posts/create-post", formData, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//       }

//       await fetchPosts();
//       setEditingPost(null);
//     } catch (err) {
//       console.error("Error creating/updating post:", err);
//     }
//   };

//   const startEditPost = (post) => {
//     setEditingPost(post);
//   };

//   // فلترة الخريجين حسب الكلية والسنة
//   const filterGraduates = (facultyFilter, yearFilter) => {
//     let filtered = availableGraduates;
//     if (facultyFilter) filtered = filtered.filter((g) => g.faculty === facultyFilter);
//     if (yearFilter) filtered = filtered.filter((g) => g.graduationYear === parseInt(yearFilter));
//     setFilteredGraduates(filtered);
//   };

//   return (
//     <div className="containerr">
//       <button className="back-btn" onClick={goBack}>
//         <ArrowLeft size={16} />
//       </button>

//       <div className="group-header">
//         <div className="created-icon-wrapper">
//           <Info size={18} color="#4f46e5" />
//           <div className="tooltip">
//             {t("Created at")}: {new Date(group.createdAt).toLocaleString()}
//           </div>
//         </div>
// <img 
//   src={group.cover || communityCover} 
//   alt={group.name} 
//   className="cover-img" 
// />


//         <h1 style={{ color: "#1e3a8a" }}>{group.name}</h1>

//         <div className="group-actions">
//           <div className="action-tag" onClick={() => setShowMembersModal(true)}>
//             {Array.isArray(group.members)
//               ? group.members.length
//               : group.membersCount || 0}{" "}
//             {t("Members")}
//           </div>
//           <div className="action-tag" onClick={() => setShowAddModal(true)}>
//             {t("Add Members")} +
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

//         {loading && <div className="loading">Loading posts...</div>}
        
//         <ul className="posts-list">
//           {posts.map((post) => (
//             <li key={post.id} className="post-card">
//               <div className="post-header">
//                 <img
//                   src={
//                     post.author?.name === "Alumni Portal – Helwan University"
//                       ? AdminPostsImg 
//                       : post.author?.photo || PROFILE
//                   }
//                   alt="author"
//                   className="profile-pic"
//                   onError={(e) => { e.target.src = PROFILE }}
//                 />
//                 <div className="post-header-info">
//                   <strong>{post.author?.name || "Unknown"}</strong>
//                   <div className="post-date">
//                     {new Date(post["created-at"]).toLocaleString()} - {post.category}
//                   </div>
//                 </div>
//                 <Edit
//                   size={16}
//                   style={{ cursor: "pointer", marginLeft: "auto" }}
//                   onClick={() => startEditPost(post)}
//                 />
//               </div>

//               <div className="post-content">
//                 <p>{post.content || t("No content available")}</p>
//                 {post.images && post.images.length > 0 && (
//                   <div className="post-images">
//                     {post.images.map((imgUrl, index) => (
//                       <img
//                         key={index}
//                         src={imgUrl}
//                         alt={`post-${index}`}
//                         className="post-image"
//                         onError={(e) => {
//                           e.target.style.display = "none";
//                         }}
//                       />
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Post Actions مع اللايكات */}
//               <div className="post-actions">
//                 <button 
//                   className={post.liked ? "liked" : ""}
//                   onClick={() => handleLike(post.id)}
//                 >
//                   <Heart 
//                     size={16} 
//                     fill={post.liked ? "currentColor" : "none"} 
//                   />{" "}
//                   {post.likes} {t("Likes")}
//                 </button>
//                 <button>
//                   <MessageCircle size={16} /> {post.comments?.length || 0}{" "}
//                   {t("Comments")}
//                 </button>
//               </div>

//               {/* Comments Section - زي صفحة الخريجين تماماً */}
//               <div className="comment-section">
//                 {post.comments.map((comment) => (
//                   <div key={comment.id} className="comment-item">
//                     <img
//                       src={comment.avatar || PROFILE}
//                       alt={comment.userName}
//                       className="comment-avatar"
//                       onError={(e) => { e.target.src = PROFILE }}
//                     />
//                     <div className="comment-text">
//                       <strong>{comment.userName}</strong>: {comment.content}
//                     </div>
//                   </div>
//                 ))}
//                 <div className="comment-input">
//                   <input
//                     type="text"
//                     placeholder="Write a comment..."
//                     value={commentInputs[post.id] || ""}
//                     onChange={(e) => handleCommentChange(post.id, e.target.value)}
//                   />
//                   <button onClick={() => handleCommentSubmit(post.id)}>
//                     Send
//                   </button>
//                 </div>
//               </div>
//             </li>
//           ))}
//         </ul>

//         {!loading && posts.length === 0 && (
//           <p className="empty-state">No posts yet in this group.</p>
//         )}
//       </div>

//       {/* Members Modal */}
//       {showMembersModal && (
//         <div className="modal-overlay">
//           <div className="modal-window">
//             <button
//               className="modal-close"
//               onClick={() => setShowMembersModal(false)}
//             >
//               X
//             </button>
//             <h3>{t("Members")}</h3>
//             <ul>
//               {(group.members || []).map((m) => (
//                 <li key={m.id} className="member-item">
//                   <img
//                     src={m.image}
//                     alt={m["full-name"]}
//                     className="member-avatar"
//                     onError={(e) => { e.target.src = PROFILE }}
//                   />
//                   <span className="member-info">
//                     {m["full-name"]} ({m.faculty}, {m.graduationYear})
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       )}

//       {/* Add Graduates Modal */}
//       {showAddModal && (
//         <div className="modal-overlay">
//           <div className="modal-window">
//             <button
//               className="modal-close"
//               onClick={() => setShowAddModal(false)}
//             >
//               X
//             </button>
//             <h3>{t("Add Graduates")}</h3>

//             {/* Filters */}
//             <div className="filters">
//               <select
//                 onChange={(e) => filterGraduates(e.target.value, null)}
//               >
//                 <option value="">{t("All Colleges")}</option>
//                 {colleges.map((c) => (
//                   <option key={c} value={c}>
//                     {c}
//                   </option>
//                 ))}
//               </select>

//               <select
//                 onChange={(e) => filterGraduates(null, e.target.value)}
//               >
//                 <option value="">{t("All Years")}</option>
//                 {years.map((y) => (
//                   <option key={y} value={y}>
//                     {y}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <ul>
//               {filteredGraduates.map((g) => (
//                 <li key={g.id} className="graduate-item">
//                   <input
//                     type="checkbox"
//                     checked={selectedGraduates.includes(g.id)}
//                     onChange={() => toggleGraduate(g)}
//                   />
//                   <img
//                     src={g.profilePicture || PROFILE}
//                     alt={g.fullName}
//                     className="graduate-avatar"
//                     onError={(e) => { e.target.src = PROFILE }}
//                   />
//                   <span>
//                     {g.fullName} ({g.faculty}, {g.graduationYear})
//                   </span>
//                 </li>
//               ))}
//             </ul>
//             <button onClick={addGraduates}>{t("Add to Group")}</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default GroupDetail;