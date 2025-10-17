import { useState, useEffect } from "react";
import API from "../../services/api";
import "./GroupDetails.css";

function GroupDetails({ group, goBack, currentUserId }) {
  // ====== State ======
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [category, setCategory] = useState("General");
  const [image, setImage] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [likedPosts, setLikedPosts] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [invitations, setInvitations] = useState([]); // invitations sent by me

  // ====== Fetch Data ======
  useEffect(() => {
    fetchPosts();
    fetchFriends();
    fetchInvitations();
  }, [group.id]);

  // ====== Fetch Posts ======
  const fetchPosts = async () => {
    try {
      const res = await API.get(`/posts/${group.id}`);
      if (res.data.status === "success") setPosts(res.data.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  // ====== Fetch Friends Not in Group ======
  const fetchFriends = async () => {
    try {
      const res = await API.get("/friends"); // API عندك
      const friendsData = res.data;

      console.log("friends from API:", friendsData);
      console.log("group members:", group.members);

      // تحويل العلاقات إلى أصدقاء حقيقيين بالنسبة ليك
      const actualFriends = friendsData.map((rel) =>
        rel.sender_id === currentUserId ? rel.receiver : rel.sender
      );

      // فلترة الأصدقاء اللي مش موجودين في الجروب
      const groupMemberIds = (group.members || []).map(
        (m) => m.id || m.graduate_id
      );

      const nonMembers = actualFriends.filter(
        (f) => !groupMemberIds.includes(f.graduate_id)
      );

      setFriends(nonMembers);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  // ====== Fetch Invitations Sent By Me ======
  const fetchInvitations = async () => {
    try {
      const res = await API.get("/invitations/received");
      setInvitations(res.data);
    } catch (err) {
      console.error("Error fetching invitations:", err);
    }
  };

  // ====== Create Post ======
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

  // ====== Like Post ======
  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    setLikedPosts(savedLikes);
  }, []);

  useEffect(() => {
    localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
  }, [likedPosts]);

  const handleLike = (postId) => {
    if (likedPosts.includes(postId)) return alert("You already liked this post!");
    setPosts(
      posts.map((p) =>
        p.post_id === postId
          ? { ...p, likesCount: (p.likesCount || 0) + 1 }
          : p
      )
    );
    setLikedPosts([...likedPosts, postId]);
  };

  // ====== Comment Post ======
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

  // ====== Invite Friend ======
  const handleSendInvitation = async (friendId) => {
    try {
      await API.post("/invitations/send", {
        receiver_id: friendId,
        group_id: group.id,
      });
      fetchInvitations();
    } catch (err) {
      console.error("Error sending invitation:", err);
      alert("Failed to send invitation");
    }
  };

  const handleCancelInvitation = async (inviteId) => {
    try {
      await API.post(`/invitations/${inviteId}/cancel`);
      fetchInvitations();
    } catch (err) {
      console.error("Error canceling invitation:", err);
      alert("Failed to cancel invitation");
    }
  };

  const isInvited = (friendId) => {
    return invitations.some(
      (inv) => inv.receiver_id === friendId && inv.status === "pending"
    );
  };

  // ====== Render ======
  return (
    <div className="group-details">
      <div className="group-details__container">
        <button onClick={goBack} className="back-button">Back</button>

        <div className="group-header">
          <h2>{group.groupName}</h2>
          <p>{group.description}</p>
          <button
            className="invite-button"
            onClick={() => setShowInviteModal(true)}
          >
            Invite
          </button>
        </div>

        {/* ===== Invite Modal ===== */}
        {showInviteModal && (
          <div className="invite-modal">
            <h3>Invite Friends</h3>
            <button
              className="close-modal"
              onClick={() => setShowInviteModal(false)}
            >
              X
            </button>
            {friends.length === 0 ? (
              <p>No friends to invite</p>
            ) : (
              <ul className="invite-list">
                {friends.map((f) => (
                  <li key={f.graduate_id}>
                    {f.fullName || f["full-name"]}
                    {isInvited(f.graduate_id) ? (
                      <button
                        className="invite-action cancel"
                        onClick={() =>
                          handleCancelInvitation(
                            invitations.find(
                              (inv) =>
                                inv.receiver_id === f.graduate_id &&
                                inv.status === "pending"
                            ).id
                          )
                        }
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        className="invite-action invite"
                        onClick={() =>
                          handleSendInvitation(f.graduate_id)
                        }
                      >
                        Invite
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ===== Create Post ===== */}
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
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
          />
          <div className="create-post__actions">
            <button className="btn btn--primary" onClick={handleCreatePost}>
              Post
            </button>
          </div>
        </div>

        {/* ===== Group Posts ===== */}
        <h3>Group Posts</h3>
        {posts.length === 0 ? (
          <p className="empty-state">No posts yet in this group.</p>
        ) : (
          <div className="posts-list">
            {posts.map((p) => (
              <div key={p.post_id} className="post-card">
                <div className="post-author">{p.author["full-name"]}</div>
                <div className="post-content">{p.content}</div>
                {p.image && <img src={p.image} alt="Post" className="post-image" />}
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
                  <button onClick={() => handleComment(p.post_id)}>Comment</button>
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
