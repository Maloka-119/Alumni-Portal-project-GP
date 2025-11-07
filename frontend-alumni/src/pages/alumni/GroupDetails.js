import React, { useState, useEffect } from "react";
import { ArrowLeft, Info, Image } from "lucide-react";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import PostCard from "../../components/PostCard";
import PROFILE from "./PROFILE.jpeg";
import "./GroupDetails.css";

function GroupDetails({ group, goBack }) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [availableGraduates, setAvailableGraduates] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', image: null, link: '', category: 'General' });
  // جلب المستخدم الحالي
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
    return data.map((post) => {
  
      return {
        ...post,
        id: post.post_id,
        likes: post.likes_count || 0,
        liked: false,
        images: post.images || [],
        showComments: false, 
        author: {
          id: post.author?.id,
          name: post.author?.["full-name"] || "Unknown",
          photo: post.author?.image || PROFILE,
        },
      };
    });
  };
  
  const fetchPosts = async () => {
    try {
      const res = await API.get(`/posts/${group.id}`);
      if (res.data.status === "success") {
        setPosts(formatPosts(res.data.data));
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };
  

  const fetchAvailableGraduates = async () => {
    try {
      const res = await API.get(`/groups/${group.id}/available-graduates`);
      console.log(res.data);
      setAvailableGraduates(res.data || []); // تأكد من الحقل الصحيح
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvitations = async () => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        API.get("/invitations/sent"),
        API.get("/invitations/received"),
      ]);
      const allInvites = [...(sentRes.data.data || []), ...(receivedRes.data.data || [])];
      setInvitations(allInvites.filter(inv => inv.group_id === group.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleInvitation = async (friend) => {
    try {
      if (friend.invitationStatus === "pending") {
        await API.post(`/invitations/${friend.invitationId}/cancel`);
        setAvailableGraduates(prev => prev.map(f => f.id === friend.id ? { ...f, invitationStatus: "not_invited", invitationId: null } : f));
      } else if (friend.invitationStatus === "not_invited") {
        const res = await API.post("/invitations/send", { receiver_id: friend.id, group_id: group.id });
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
      const formData = new FormData();
      formData.append("content", newPost.content);
      formData.append("category", newPost.category);
      formData.append("groupId", group.id);
      if (newPost.image) formData.append("image", newPost.image);

      if (!isEditingMode) {
        await API.post("/posts/create-post", formData);
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
      postId: post.id || post.post_id, // مهم للتحديث
    });
  };
  
  const handleDeletePost = async (postId) => {
    try {
      await API.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter(p => p.id !== postId));
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

        {group.groupImage || group.cover ? (
          <img src={group.groupImage || group.cover} alt={group.groupName || group.name} className="cover-img" />
        ) : (
          <div className="cover-placeholder">{t("No Cover Image")}</div>
        )}

        <h1>{group.groupName || group.name}</h1>
        <p className="group-description">{group.description}</p>

        <button className="invite-btn" onClick={() => setShowInviteSection(!showInviteSection)}>
          {showInviteSection ? t("Hide Invites") : t("Invite")}
        </button>
      </div>

      {showInviteSection && (
  <div className="invite-section">
    <h3>{t("Invite Friends")}</h3>

    {/* search bar */}
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
              className={`invite-action ${
                f.invitationStatus === "pending" ? "cancel" : "invite"
              }`}
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
          <PostCard key={post.id || post.post_id} post={post} 
          currentUserId={currentUserId} />
        ))}
      </div>
    </div>
  );
}

export default GroupDetails;



// import { useState, useEffect } from "react";
// import { Heart, MessageCircle, Share2, Send } from "lucide-react";
// import API from "../../services/api";
// import "./GroupDetails.css";
// import PROFILE from "./PROFILE.jpeg";

// function GroupDetails({ group, goBack, currentUserId }) {
//   const [posts, setPosts] = useState([]);
//   const [newPost, setNewPost] = useState("");
//   const [category, setCategory] = useState("General");
//   const [image, setImage] = useState(null);
//   const [commentInputs, setCommentInputs] = useState({});
//   const [availableGraduates, setAvailableGraduates] = useState([]);
//   const [invitations, setInvitations] = useState([]);
//   const [showInviteSection, setShowInviteSection] = useState(false);
//   const [loading, setLoading] = useState(true);

//   // ====================== Fetch Data ======================
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       fetchPosts();
//       fetchAvailableGraduates();
//       fetchInvitations();
//     } else {
//       console.warn("No token found, skipping fetch calls");
//     }
//   }, [group.id]);

//   // في دالة formatPosts، غير بس جزء الـ comments
//   const formatPosts = (data) => {
//     return data.map((post) => {
//       const formattedComments = (post.comments || []).map((comment) => ({
//         id: comment.comment_id,
//         userName: comment.author?.["full-name"] || "Unknown User",
//         content: comment.content,
//         avatar: comment.author?.image || PROFILE,
//         date: comment["created-at"],
//       }));

//       return {
//         ...post,
//         id: post.post_id,
//         likes: post.likes_count || 0,
//         liked: false,
//         comments: formattedComments,
//         images: post.images || [],
//         showComments: false, // ⬅️ إضافة showComments هنا
//         author: {
//           id: post.author?.id,
//           name: post.author?.["full-name"] || "Unknown",
//           photo: post.author?.image || PROFILE,
//         },
//       };
//     });
//   };

//   const fetchPosts = async () => {
//     try {
//       setLoading(true);
//       const res = await API.get(`/posts/${group.id}`);
//       if (res.data.status === "success") {
//         setPosts(formatPosts(res.data.data));
//       }
//     } catch (err) {
//       console.error("Error fetching posts:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ====================== Available Graduates ======================
//   const fetchAvailableGraduates = async () => {
//     try {
//       const res = await API.get(`/groups/${group.id}/available-graduates`);
//       setAvailableGraduates(res.data || []);
//     } catch (err) {
//       console.error("Error fetching available graduates:", err);
//       alert("Failed to fetch graduates");
//     }
//   };

//   // ====================== Invitations ======================
//   const fetchInvitations = async () => {
//     try {
//       const [sentRes, receivedRes] = await Promise.all([
//         API.get("/invitations/sent"),
//         API.get("/invitations/received"),
//       ]);

//       const allInvites = [...(sentRes.data || []), ...(receivedRes.data || [])];
//       const groupInvites = allInvites.filter(
//         (inv) => inv.group_id === group.id
//       );
//       setInvitations(groupInvites);
//     } catch (err) {
//       console.error("Error fetching invitations:", err);
//     }
//   };

//   const handleToggleInvitation = async (friend) => {
//     try {
//       if (friend.invitationStatus === "pending") {
//         // Cancel invitation
//         await API.post(`/invitations/${friend.invitationId}/cancel`);

//         // تحديث الحالة محليًا
//         setAvailableGraduates((prev) =>
//           prev.map((f) =>
//             f.id === friend.id
//               ? { ...f, invitationStatus: "not_invited", invitationId: null }
//               : f
//           )
//         );
//       } else if (friend.invitationStatus === "not_invited") {
//         // Send invitation
//         const res = await API.post("/invitations/send", {
//           receiver_id: friend.id,
//           group_id: group.id,
//         });

//         const newInvitationId = res.data.invitationId || res.data.id;
//         setAvailableGraduates((prev) =>
//           prev.map((f) =>
//             f.id === friend.id
//               ? {
//                   ...f,
//                   invitationStatus: "pending",
//                   invitationId: newInvitationId,
//                 }
//               : f
//           )
//         );
//       }
//     } catch (err) {
//       console.error("Error toggling invitation:", err);
//       alert("Failed to process invitation");
//     }
//   };

//   // ====================== Create Post ======================
//   const handleCreatePost = async () => {
//     if (!newPost.trim()) return alert("Post content is required");
//     try {
//       const formData = new FormData();
//       formData.append("category", category);
//       formData.append("content", newPost);
//       formData.append("inLanding", false);
//       formData.append("groupId", group.id);
//       if (image) formData.append("image", image);

//       await API.post("/posts/create-post", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       setNewPost("");
//       setImage(null);
//       fetchPosts();
//     } catch (err) {
//       console.error("Error creating post:", err);
//       alert("Failed to create post");
//     }
//   };

//   // ====================== Likes - نفس منطق الصفحات التانية ⬇️⬇️⬇️ ======================
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

//   // ====================== Comments - نفس منطق الصفحات التانية ⬇️⬇️⬇️ ======================
//   const toggleComments = (postId) => {
//     setPosts((prevPosts) =>
//       prevPosts.map((p) =>
//         p.id === postId ? { ...p, showComments: !p.showComments } : p
//       )
//     );
//   };

//   const handleCommentChange = (postId, value) => {
//     setCommentInputs({ ...commentInputs, [postId]: value });
//   };

//   const handleCommentSubmit = async (postId) => {
//     const comment = commentInputs[postId];
//     if (!comment?.trim()) return;

//     try {
//       const res = await API.post(`/posts/${postId}/comments`, {
//         content: comment,
//       });

//       if (res.data.comment) {
//         const newComment = {
//           id: res.data.comment.comment_id,
//           userName: res.data.comment.author?.["full-name"] || "You",
//           content: res.data.comment.content,
//           avatar: res.data.comment?.author?.image || PROFILE, // ⬅️ التصحيح هنا
//           date: new Date().toLocaleString(),
//         };

//         // تحديث فوري للكومنتات
//         setPosts((prev) =>
//           prev.map((post) =>
//             post.id === postId
//               ? { ...post, comments: [...post.comments, newComment] }
//               : post
//           )
//         );
//       }

//       setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
//     } catch (err) {
//       console.error("🔴 Error submitting comment:", err.response?.data || err);
//       alert("Failed to add comment");
//     }
//   };

//   // ====================== Render ======================
//   return (
//     <div className="group-details">
//       <div className="group-details__container">
//         <button onClick={goBack} className="back-button">
//           ← Back
//         </button>

//         <div className="group-header">
//           <h2>{group.groupName}</h2>
//           <p>{group.description}</p>
//           <button
//             className="invite-button"
//             onClick={() => setShowInviteSection(!showInviteSection)}
//           >
//             {showInviteSection ? "Hide Invites" : "Invite Friends"}
//           </button>
//         </div>

//         {/* Invite Friends Section */}
//         {showInviteSection && (
//           <div className="invite-section">
//             <h3>Invite Friends</h3>
//             {availableGraduates.length === 0 ? (
//               <p>No graduates available to invite.</p>
//             ) : (
//               <ul className="invite-list">
//                 {availableGraduates.map((f) => (
//                   <li key={f.id}>
//                     <div className="friend-info">
//                       <img src={f.profilePicture || PROFILE} alt="Profile" />
//                       <span>{f.fullName}</span>
//                     </div>
//                     <button
//                       className={`invite-action ${
//                         f.invitationStatus === "pending" ? "cancel" : "invite"
//                       }`}
//                       onClick={() => handleToggleInvitation(f)}
//                     >
//                       {f.invitationStatus === "pending"
//                         ? "Cancel Invitation"
//                         : "Invite to Group"}
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         )}

//         {/* Create Post Section */}
//         <div className="create-post">
//           <h3>Create a Post</h3>
//           <select
//             value={category}
//             onChange={(e) => setCategory(e.target.value)}
//           >
//             <option value="Internship">Internship</option>
//             <option value="Success story">Success story</option>
//             <option value="General">General</option>
//           </select>
//           <textarea
//             value={newPost}
//             onChange={(e) => setNewPost(e.target.value)}
//             placeholder="Write a new post..."
//             rows={4}
//           />
//           <input type="file" onChange={(e) => setImage(e.target.files[0])} />
//           <button onClick={handleCreatePost} className="btn btn--primary">
//             Post
//           </button>
//         </div>

//         {/* Posts List */}
//         <h3>Community Posts</h3>
//         {loading && <div>Loading posts...</div>}
//         {!loading && posts.length === 0 ? (
//           <p className="empty-state">No posts yet in this group.</p>
//         ) : (
//           <div className="posts-list">
//             {posts.map((post) => (
//               <div key={post.id} className="post-card uni-post-card">
//                 <div
//                   className="post-header"
//                   style={{ display: "flex", alignItems: "center", gap: "8px" }}
//                 >
//                   <img
//                     src={post.author?.photo || PROFILE}
//                     className="profile-pic"
//                     alt="profile"
//                     style={{
//                       width: "40px",
//                       height: "40px",
//                       borderRadius: "50%",
//                     }}
//                   />
//                   <div
//                     className="post-user-info"
//                     style={{
//                       display: "flex",
//                       flexDirection: "column",
//                       alignItems: "flex-start",
//                       lineHeight: "1.2",
//                     }}
//                   >
//                     <strong>{post.author?.name || "Unknown"}</strong>
//                     <div
//                       style={{
//                         marginTop: "2px",
//                         marginLeft: "4px",
//                         color: "#555",
//                         fontSize: "0.9em",
//                       }}
//                     >
//                       {new Date(post["created-at"]).toLocaleString()} -{" "}
//                       {post.category}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="post-content uni-post-body">
//                   <p>{post.content}</p>
//                   {post.images && post.images.length > 0 && (
//                     <div className="uni-post-images">
//                       {post.images.map((imgUrl, index) => (
//                         <img
//                           key={index}
//                           src={imgUrl}
//                           alt={`post-${index}`}
//                           className="uni-post-preview"
//                         />
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 <div className="uni-post-actions">
//                   <button
//                     className={post.liked ? "uni-liked" : ""}
//                     onClick={() => handleLike(post.id)}
//                   >
//                     <Heart
//                       size={16}
//                       fill={post.liked ? "currentColor" : "none"}
//                     />
//                     {post.likes}
//                   </button>
//                   <button onClick={() => toggleComments(post.id)}>
//                     <MessageCircle size={16} />
//                     {post.comments.length}
//                   </button>
//                   <button>
//                     <Share2 size={16} />
//                     {post.shares || 0}
//                   </button>
//                 </div>

//                 {/* Comments Section - تظهر فقط عندما showComments = true */}
//                 {post.showComments && (
//                   <div className="comment-section uni-comments-section">
//                     <div className="existing-comments">
//                       {post.comments.map((comment) => (
//                         <div
//                           key={comment.id}
//                           className="comment-item uni-comment-item"
//                         >
//                           <img
//                             src={comment.avatar || PROFILE}
//                             alt={comment.userName}
//                             className="uni-comment-avatar"
//                           />
//                           <div className="comment-text uni-comment-text">
//                             <strong>{comment.userName}</strong>:{" "}
//                             {comment.content}
//                             <div className="comment-date">
//                               {new Date(comment.date).toLocaleString([], {
//                                 year: "numeric",
//                                 month: "2-digit",
//                                 day: "2-digit",
//                                 hour: "2-digit",
//                                 minute: "2-digit",
//                               })}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                     <div className="comment-input uni-comment-input">
//                       <input
//                         type="text"
//                         placeholder="Write a comment..."
//                         value={commentInputs[post.id] || ""}
//                         onChange={(e) =>
//                           handleCommentChange(post.id, e.target.value)
//                         }
//                       />
//                       <button onClick={() => handleCommentSubmit(post.id)}>
//                         <Send size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default GroupDetails;
