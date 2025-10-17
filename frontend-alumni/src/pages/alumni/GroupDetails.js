import { useState, useEffect } from "react";
import API from "../../services/api";
import "./GroupDetails.css";

function GroupDetails({ group, goBack, currentUserId }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [category, setCategory] = useState("General");
  const [image, setImage] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [likedPosts, setLikedPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showInviteSection, setShowInviteSection] = useState(false);

  // ====================== Fetch Data ======================
  useEffect(() => {
    fetchPosts();
    fetchFriends();
    fetchInvitations();
  }, [group.id]);

  const fetchPosts = async () => {
    try {
      const res = await API.get(`/posts/${group.id}`);
      if (res.data.status === "success") setPosts(res.data.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await API.get("/friendships/friends");
      setFriends(res.data || []);
    } catch (err) {
      console.error("Error fetching friends:", err);
      alert("Failed to fetch friends");
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await API.get("/invitations/received");
      setInvitations(res.data || []);
    } catch (err) {
      console.error("Error fetching invitations:", err);
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

  // ====================== Likes ======================
  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    setLikedPosts(savedLikes);
  }, []);

  useEffect(() => {
    localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
  }, [likedPosts]);

  const handleLike = (postId) => {
    if (likedPosts.includes(postId)) return;
    setPosts((p) =>
      p.map((post) =>
        post.post_id === postId
          ? { ...post, likesCount: (post.likesCount || 0) + 1 }
          : post
      )
    );
    setLikedPosts([...likedPosts, postId]);
  };

  // ====================== Comments ======================
  const handleComment = (postId) => {
    const comment = commentText[postId];
    if (!comment?.trim()) return;
    setPosts((prev) =>
      prev.map((p) =>
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

  // ====================== Invitations ======================
  const isInvited = (friendId) =>
    invitations.some((inv) => inv.receiver_id === friendId && inv.status === "pending");

  const handleToggleInvitation = async (friendId) => {
    const invite = invitations.find(
      (inv) => inv.receiver_id === friendId && inv.status === "pending"
    );
    try {
      if (invite) {
        await API.post(`/invitations/${invite.id}/cancel`);
        setInvitations((prev) => prev.filter((inv) => inv.id !== invite.id));
      } else {
        const res = await API.post("/invitations/send", {
          receiver_id: friendId,
          group_id: group.id,
        });
        setInvitations((prev) => [...prev, res.data]);
      }
    } catch (err) {
      console.error("Error toggling invitation:", err);
      alert("Failed to process invitation");
    }
  };

  // ====================== Render ======================
  return (
    <div className="group-details">
      <div className="group-details__container">
        <button onClick={goBack} className="back-button">← Back</button>

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
            {friends.length === 0 ? (
              <p>No friends available to invite.</p>
            ) : (
              <ul className="invite-list">
                {friends.map((f) => (
                  <li key={f.friendId}>
                    <div className="friend-info">
                      <img src={f.profilePicture} alt="Profile" />
                      <span>{f.fullName}</span>
                    </div>
                    <button
                      className={`invite-action ${isInvited(f.friendId) ? "cancel" : "invite"}`}
                      onClick={() => handleToggleInvitation(f.friendId)}
                    >
                      {isInvited(f.friendId) ? "Cancel" : "Invite"}
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
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Internship">Internship</option>
            <option value="Success story">Success story</option>
            <option value="General">General</option>
          </select>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write a new post..."
          />
          <input type="file" onChange={(e) => setImage(e.target.files[0])} />
          <button onClick={handleCreatePost} className="btn btn--primary">
            Post
          </button>
        </div>

        {/* Posts List */}
        <h3>Group Posts</h3>
        {posts.length === 0 ? (
          <p className="empty-state">No posts yet in this group.</p>
        ) : (
          <div className="posts-list">
            {posts.map((p) => (
              <div key={p.post_id} className="post-card">
                <div className="post-author">{p.author.fullName}</div>
                <div className="post-content">{p.content}</div>
                {p.image && <img src={p.image} alt="Post" className="post-image" />}
                <div className="post-meta">{new Date(p["created-at"]).toLocaleString()}</div>
                <button onClick={() => handleLike(p.post_id)} className="like-button">
                  👍 Like ({p.likesCount || 0})
                </button>
                <div className="comment-section">
                  <input
                    type="text"
                    placeholder="Add a comment"
                    value={commentText[p.post_id] || ""}
                    onChange={(e) =>
                      setCommentText((prev) => ({ ...prev, [p.post_id]: e.target.value }))
                    }
                  />
                  <button onClick={() => handleComment(p.post_id)}>Comment</button>
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
