import { useState, useEffect } from "react";
import API from "../../services/api";

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
    <div style={{ padding: 20 }}>
      <button onClick={goBack} style={{ marginBottom: 20 }}>
        ← Back to My Communities
      </button>
      <h2>{group.groupName}</h2>
      <p>{group.description}</p>

      <h3>Create a Post</h3>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={{ marginBottom: 10 }}
      >
        <option value="Internship">Internship</option>
        <option value="Success story">Success story</option>
        <option value="General">General</option>
      </select>
      <br />
      <textarea
        value={newPost}
        onChange={(e) => setNewPost(e.target.value)}
        placeholder="Write a new post..."
        style={{ width: "100%", minHeight: 60, marginBottom: 10 }}
      />
      <br />
      <input
        type="file"
        onChange={(e) => setImage(e.target.files[0])}
        style={{ marginBottom: 10 }}
      />
      <br />
      <button onClick={handleCreatePost}>Post</button>

      <h3>Group Posts</h3>
      {posts.length === 0 ? (
        <p>No posts yet in this group.</p>
      ) : (
        posts.map((p) => (
          <div
            key={p.post_id}
            style={{ border: "1px solid #ddd", padding: 15, margin: "10px 0" }}
          >
            <h4>{p.author["full-name"]}</h4>
            <p>{p.content}</p>
            {p.image && <img src={p.image} alt="Post" style={{ maxWidth: "100%" }} />}
            <small>{new Date(p["created-at"]).toLocaleString()}</small>
            <br />
            <button onClick={() => handleLike(p.post_id)}>
              👍 Like ({p.likesCount || 0})
            </button>

            <div style={{ marginTop: 10 }}>
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
                style={{ marginRight: 8 }}
              />
              <button onClick={() => handleComment(p.post_id)}>Comment</button>
            </div>

            {p.comments && p.comments.length > 0 && (
              <div style={{ marginTop: 10, paddingLeft: 15 }}>
                {p.comments.map((c) => (
                  <p key={c.id}>
                    <b>{c.user.fullName}</b>: {c.content}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default GroupDetails;
