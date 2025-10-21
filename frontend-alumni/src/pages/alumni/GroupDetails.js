import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import API from "../../services/api";
import "./GroupDetails.css";
import PROFILE from "./PROFILE.jpeg";

function GroupDetails({ group, goBack, currentUserId }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [category, setCategory] = useState("General");
  const [image, setImage] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [availableGraduates, setAvailableGraduates] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [loading, setLoading] = useState(true);

  // ====================== Fetch Data ======================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchPosts();
      fetchAvailableGraduates();
      fetchInvitations();
    } else {
      console.warn("No token found, skipping fetch calls");
    }
  }, [group.id]);

  // في دالة formatPosts، غير بس جزء الـ comments
  const formatPosts = (data) => {
    return data.map((post) => {
      // ⬇️⬇️⬇️ التصحيح هنا فقط ⬇️⬇️⬇️
      const formattedComments = (post.comments || []).map((comment) => ({
        id: comment.comment_id,
        userName: comment.author?.["full-name"] || "Unknown User",
        content: comment.content,
        avatar: comment.author?.image || PROFILE,
        date: comment["created-at"],
      }));

      return {
        ...post,
        id: post.post_id,
        likes: post.likes_count || 0,
        liked: false,
        comments: formattedComments, // ⬅️ استخدم المتغير الجديد
        images: post.images || [],
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
      setLoading(true);
      const res = await API.get(`/posts/${group.id}`);
      if (res.data.status === "success") {
        setPosts(formatPosts(res.data.data));
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // ====================== Available Graduates ======================
  const fetchAvailableGraduates = async () => {
    try {
      const res = await API.get(`/groups/${group.id}/available-graduates`);
      setAvailableGraduates(res.data || []);
    } catch (err) {
      console.error("Error fetching available graduates:", err);
      alert("Failed to fetch graduates");
    }
  };

  // ====================== Invitations ======================
  const fetchInvitations = async () => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        API.get("/invitations/sent"),
        API.get("/invitations/received"),
      ]);

      const allInvites = [...(sentRes.data || []), ...(receivedRes.data || [])];
      const groupInvites = allInvites.filter(
        (inv) => inv.group_id === group.id
      );
      setInvitations(groupInvites);
    } catch (err) {
      console.error("Error fetching invitations:", err);
    }
  };

  const handleToggleInvitation = async (friend) => {
    try {
      if (friend.invitationStatus === "pending") {
        // Cancel invitation
        await API.post(`/invitations/${friend.invitationId}/cancel`);

        // تحديث الحالة محليًا
        setAvailableGraduates((prev) =>
          prev.map((f) =>
            f.id === friend.id
              ? { ...f, invitationStatus: "not_invited", invitationId: null }
              : f
          )
        );
      } else if (friend.invitationStatus === "not_invited") {
        // Send invitation
        const res = await API.post("/invitations/send", {
          receiver_id: friend.id,
          group_id: group.id,
        });

        const newInvitationId = res.data.invitationId || res.data.id;
        setAvailableGraduates((prev) =>
          prev.map((f) =>
            f.id === friend.id
              ? {
                  ...f,
                  invitationStatus: "pending",
                  invitationId: newInvitationId,
                }
              : f
          )
        );
      }
    } catch (err) {
      console.error("Error toggling invitation:", err);
      alert("Failed to process invitation");
    }
  };

  // ====================== Create Post ======================
  const handleCreatePost = async () => {
    if (!newPost.trim()) return alert("Post content is required");
    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("content", newPost);
      formData.append("inLanding", false);
      formData.append("groupId", group.id);
      if (image) formData.append("image", image);

      await API.post("/posts/create-post", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNewPost("");
      setImage(null);
      fetchPosts();
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post");
    }
  };

  // ====================== Likes - نفس منطق الصفحات التانية ⬇️⬇️⬇️ ======================
  const handleLike = async (postId) => {
    const postIndex = posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) return;

    try {
      const post = posts[postIndex];

      // حاول unlike أولاً
      try {
        await API.delete(`/posts/${postId}/like`);
        // إذا نجح الـ unlike، هذا معناه أن البوست كان معجب بيه
        const updatedPosts = [...posts];
        updatedPosts[postIndex] = {
          ...post,
          likes: Math.max(0, post.likes - 1),
          liked: false,
        };
        setPosts(updatedPosts);
        console.log("✅ Successfully unliked post:", postId);
      } catch (unlikeError) {
        // إذا فشل الـ unlike، جرب like
        if (unlikeError.response?.status === 404) {
          await API.post(`/posts/${postId}/like`);
          const updatedPosts = [...posts];
          updatedPosts[postIndex] = {
            ...post,
            likes: post.likes + 1,
            liked: true,
          };
          setPosts(updatedPosts);
          console.log("✅ Successfully liked post:", postId);
        } else {
          throw unlikeError;
        }
      }
    } catch (err) {
      console.error("🔴 Error in handleLike:", err.response?.data || err);
      // في حالة أي خطأ، أعد جلب البيانات من السيرفر
      await fetchPosts();
    }
  };

  // ====================== Comments - نفس منطق الصفحات التانية ⬇️⬇️⬇️ ======================
  const handleCommentChange = (postId, value) => {
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  const handleCommentSubmit = async (postId) => {
    const comment = commentInputs[postId];
    if (!comment?.trim()) return;

    try {
      const res = await API.post(`/posts/${postId}/comments`, {
        content: comment,
      });

      if (res.data.comment) {
        const newComment = {
          userName: res.data.comment.author?.["full-name"] || "You",
          content: res.data.comment.content,
          avatar: PROFILE,
          date: new Date().toLocaleString(),
        };

        // تحديث فوري للكومنتات
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, comments: [...post.comments, newComment] }
              : post
          )
        );
      }

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("🔴 Error submitting comment:", err.response?.data || err);
      alert("Failed to add comment");
    }
  };

  // ====================== Render ======================
  return (
    <div className="group-details">
      <div className="group-details__container">
        <button onClick={goBack} className="back-button">
          ← Back
        </button>

        <div className="group-header">
          <h2>{group.groupName}</h2>
          <p>{group.description}</p>
          <button
            className="invite-button"
            onClick={() => setShowInviteSection(!showInviteSection)}
          >
            {showInviteSection ? "Hide Invites" : "Invite Friends"}
          </button>
        </div>

        {/* Invite Friends Section */}
        {showInviteSection && (
          <div className="invite-section">
            <h3>Invite Friends</h3>
            {availableGraduates.length === 0 ? (
              <p>No graduates available to invite.</p>
            ) : (
              <ul className="invite-list">
                {availableGraduates.map((f) => (
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
                        ? "Cancel Invitation"
                        : "Invite to Group"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Create Post Section */}
        <div className="create-post">
          <h3>Create a Post</h3>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Internship">Internship</option>
            <option value="Success story">Success story</option>
            <option value="General">General</option>
          </select>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write a new post..."
            rows={4}
          />
          <input type="file" onChange={(e) => setImage(e.target.files[0])} />
          <button onClick={handleCreatePost} className="btn btn--primary">
            Post
          </button>
        </div>

        {/* Posts List */}
        <h3>Community Posts</h3>
        {loading && <div>Loading posts...</div>}
        {!loading && posts.length === 0 ? (
          <p className="empty-state">No posts yet in this group.</p>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post.id} className="post-card uni-post-card">
                <div
                  className="post-header"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <img
                    src={post.author?.photo || PROFILE}
                    className="profile-pic"
                    alt="profile"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                    }}
                  />
                  <div
                    className="post-user-info"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      lineHeight: "1.2",
                    }}
                  >
                    <strong>{post.author?.name || "Unknown"}</strong>
                    <div
                      style={{
                        marginTop: "2px",
                        marginLeft: "4px",
                        color: "#555",
                        fontSize: "0.9em",
                      }}
                    >
                      {new Date(post["created-at"]).toLocaleString()} -{" "}
                      {post.category}
                    </div>
                  </div>
                </div>

                <div className="post-content uni-post-body">
                  <p>{post.content}</p>
                  {post.images && post.images.length > 0 && (
                    <div className="uni-post-images">
                      {post.images.map((imgUrl, index) => (
                        <img
                          key={index}
                          src={imgUrl}
                          alt={`post-${index}`}
                          className="uni-post-preview"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="uni-post-actions">
                  <button
                    className={post.liked ? "uni-liked" : ""}
                    onClick={() => handleLike(post.id)}
                  >
                    <Heart
                      size={16}
                      fill={post.liked ? "currentColor" : "none"}
                    />
                    {post.likes}
                  </button>
                  <button>
                    <MessageCircle size={16} />
                    {post.comments.length}
                  </button>
                  <button>
                    <Share2 size={16} />
                    {post.shares || 0}
                  </button>
                </div>

                {/* Comments Section */}
                <div className="comment-section uni-comments-section">
                  {post.comments.map((comment, idx) => (
                    <div key={idx} className="comment-item uni-comment-item">
                      <img
                        src={comment.avatar || PROFILE}
                        alt={comment.userName}
                        className="uni-comment-avatar"
                      />
                      <div className="comment-text uni-comment-text">
                        <strong>{comment.userName}</strong>: {comment.content}
                      </div>
                    </div>
                  ))}
                  <div className="comment-input uni-comment-input">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        handleCommentChange(post.id, e.target.value)
                      }
                    />
                    <button onClick={() => handleCommentSubmit(post.id)}>
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupDetails;

/*import { useState, useEffect } from "react";
import API from "../../services/api";
import "./GroupDetails.css";

function GroupDetails({ group, goBack }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [category, setCategory] = useState("General");
  const [image, setImage] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [likedPosts, setLikedPosts] = useState([]);

  // fetch posts
  useEffect(() => {
    fetchPosts();
  }, [group.id]);

  const fetchPosts = async () => {
    try {
      const res = await API.get(`/posts/${group.id}`);
      if (res.data.status === "success") {
        setPosts(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    setLikedPosts(savedLikes);
  }, []);

  useEffect(() => {
    localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
  }, [likedPosts]);

  // create post
  const handleCreatePost = async () => {
    if (!newPost.trim()) return alert("Post content is required");

    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("content", newPost);
      formData.append("inLanding", false);
      formData.append("groupId", group.id);
      if (image) {
        formData.append("image", image);
      }

      await API.post("/posts/create-post", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNewPost("");
      setImage(null);
      fetchPosts(); // refresh posts
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post");
    }
  };

  // like (local only)
  const handleLike = (postId) => {
    if (likedPosts.includes(postId)) {
      alert("You already liked this post!");
      return;
    }
    setPosts(
      posts.map((p) =>
        p.post_id === postId
          ? { ...p, likesCount: (p.likesCount || 0) + 1 }
          : p
      )
    );
    setLikedPosts([...likedPosts, postId]);
  };

  // comment (محلي مؤقت لحد ما يبقى عندك API للكومنتس)
  const handleComment = (postId) => {
    const comment = commentText[postId];
    if (!comment?.trim()) return;
    setPosts(
      posts.map((p) =>
        p.post_id === postId
          ? {
              ...p,
              comments: [
                ...(p.comments || []),
                { id: Date.now(), user: { fullName: "You" }, content: comment },
              ],
            }
          : p
      )
    );
    setCommentText((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="group-details">
      <div className="group-details__container">
        <button onClick={goBack} className="back-button">
          
        </button>

        <div className="group-header">
          <h2 >{group.groupName}</h2>
          <p>{group.description}</p>
        </div>

        <div className="create-post">
          <h3>Create a Post</h3>
          <div className="create-post__controls">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Internship">Internship</option>
              <option value="Success story">Success story</option>
              <option value="General">General</option>
            </select>
          </div>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write a new post..."
          />
          <input type="file" onChange={(e) => setImage(e.target.files[0])} />
          <div className="create-post__actions">
            <button className="btn btn--primary" onClick={handleCreatePost}>
              Post
            </button>
          </div>
        </div>

        <h3>Group Posts</h3>
        {posts.length === 0 ? (
          <p className="empty-state">No posts yet in this group.</p>
        ) : (
          <div className="posts-list">
            {posts.map((p) => (
              <div key={p.post_id} className="post-card">
                <div className="post-author">{p.author["full-name"]}</div>
                <div className="post-content">{p.content}</div>
                {p.image && (
                  <img src={p.image} alt="Post" className="post-image" />
                )}
                <div className="post-meta">
                  {new Date(p["created-at"]).toLocaleString()}
                </div>
                <div className="post-actions">
                  <button
                    className="like-button"
                    onClick={() => handleLike(p.post_id)}
                  >
                    👍 Like ({p.likesCount || 0})
                  </button>
                </div>

                <div className="comment-section">
                  <input
                    type="text"
                    placeholder="Add a comment"
                    value={commentText[p.post_id] || ""}
                    onChange={(e) =>
                      setCommentText((prev) => ({
                        ...prev,
                        [p.post_id]: e.target.value,
                      }))
                    }
                  />
                  <button onClick={() => handleComment(p.post_id)}>
                    Comment
                  </button>
                </div>

                {p.comments && p.comments.length > 0 && (
                  <div className="comments-list">
                    {p.comments.map((c) => (
                      <p key={c.id}>
                        <b>{c.user.fullName}</b>: {c.content}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupDetails;*/

// import { useState, useEffect } from "react";
// import API from "../../services/api";

// function GroupDetails({ group, goBack }) {
//   const [posts, setPosts] = useState([]);
//   const [newPost, setNewPost] = useState("");
//   const [category, setCategory] = useState("General");
//   const [image, setImage] = useState(null);
//   const [commentText, setCommentText] = useState({});
//   const [likedPosts, setLikedPosts] = useState([]);

//   // fetch posts
//   useEffect(() => {
//     fetchPosts();
//   }, [group.id]);

//   const fetchPosts = async () => {
//     try {
//       const res = await API.get(`/posts/${group.id}`);
//       if (res.data.status === "success") {
//         setPosts(res.data.data);
//       }
//     } catch (err) {
//       console.error("Error fetching posts:", err);
//     }
//   };

//   useEffect(() => {
//     const savedLikes = JSON.parse(localStorage.getItem("likedPosts") || "[]");
//     setLikedPosts(savedLikes);
//   }, []);

//   useEffect(() => {
//     localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
//   }, [likedPosts]);

//   // create post
//   const handleCreatePost = async () => {
//     if (!newPost.trim()) return alert("Post content is required");

//     try {
//       const formData = new FormData();
//       formData.append("category", category);
//       formData.append("content", newPost);
//       formData.append("inLanding", false);
//       formData.append("groupId", group.id);
//       if (image) {
//         formData.append("image", image);
//       }

//       await API.post("/posts/create-post", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       setNewPost("");
//       setImage(null);
//       fetchPosts(); // refresh posts
//     } catch (err) {
//       console.error("Error creating post:", err);
//       alert("Failed to create post");
//     }
//   };

//   // like (local only)
//   const handleLike = (postId) => {
//     if (likedPosts.includes(postId)) {
//       alert("You already liked this post!");
//       return;
//     }
//     setPosts(
//       posts.map((p) =>
//         p.post_id === postId
//           ? { ...p, likesCount: (p.likesCount || 0) + 1 }
//           : p
//       )
//     );
//     setLikedPosts([...likedPosts, postId]);
//   };

//   // comment (محلي مؤقت لحد ما يبقى عندك API للكومنتس)
//   const handleComment = (postId) => {
//     const comment = commentText[postId];
//     if (!comment?.trim()) return;
//     setPosts(
//       posts.map((p) =>
//         p.post_id === postId
//           ? {
//               ...p,
//               comments: [
//                 ...(p.comments || []),
//                 { id: Date.now(), user: { fullName: "You" }, content: comment },
//               ],
//             }
//           : p
//       )
//     );
//     setCommentText((prev) => ({ ...prev, [postId]: "" }));
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <button onClick={goBack} style={{ marginBottom: 20 }}>
//         ← Back to My Communities
//       </button>
//       <h2>{group.groupName}</h2>
//       <p>{group.description}</p>

//       <h3>Create a Post</h3>
//       <select
//         value={category}
//         onChange={(e) => setCategory(e.target.value)}
//         style={{ marginBottom: 10 }}
//       >
//         <option value="Internship">Internship</option>
//         <option value="Success story">Success story</option>
//         <option value="General">General</option>
//       </select>
//       <br />
//       <textarea
//         value={newPost}
//         onChange={(e) => setNewPost(e.target.value)}
//         placeholder="Write a new post..."
//         style={{ width: "100%", minHeight: 60, marginBottom: 10 }}
//       />
//       <br />
//       <input
//         type="file"
//         onChange={(e) => setImage(e.target.files[0])}
//         style={{ marginBottom: 10 }}
//       />
//       <br />
//       <button onClick={handleCreatePost}>Post</button>

//       <h3>Group Posts</h3>
//       {posts.length === 0 ? (
//         <p>No posts yet in this group.</p>
//       ) : (
//         posts.map((p) => (
//           <div
//             key={p.post_id}
//             style={{ border: "1px solid #ddd", padding: 15, margin: "10px 0" }}
//           >
//             <h4>{p.author["full-name"]}</h4>
//             <p>{p.content}</p>
//             {p.image && <img src={p.image} alt="Post" style={{ maxWidth: "100%" }} />}
//             <small>{new Date(p["created-at"]).toLocaleString()}</small>
//             <br />
//             <button onClick={() => handleLike(p.post_id)}>
//               👍 Like ({p.likesCount || 0})
//             </button>

//             <div style={{ marginTop: 10 }}>
//               <input
//                 type="text"
//                 placeholder="Add a comment"
//                 value={commentText[p.post_id] || ""}
//                 onChange={(e) =>
//                   setCommentText((prev) => ({
//                     ...prev,
//                     [p.post_id]: e.target.value,
//                   }))
//                 }
//                 style={{ marginRight: 8 }}
//               />
//               <button onClick={() => handleComment(p.post_id)}>Comment</button>
//             </div>

//             {p.comments && p.comments.length > 0 && (
//               <div style={{ marginTop: 10, paddingLeft: 15 }}>
//                 {p.comments.map((c) => (
//                   <p key={c.id}>
//                     <b>{c.user.fullName}</b>: {c.content}
//                   </p>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))
//       )}
//     </div>
//   );
// }

// export default GroupDetails;
