import { useState, useEffect } from "react";

function GroupDetails() {
  const initialPosts = [
    { id: 1, user: { firstName: "Ali", lastName: "Ahmed" }, content: "Welcome to the group!", likesCount: 2, comments: [{ id: 1, user: { firstName: "Sara" }, content: "Thanks!" }] },
    { id: 2, user: { firstName: "Mona", lastName: "Khaled" }, content: "Any React tips?", likesCount: 1, comments: [] }
  ];

  const [posts, setPosts] = useState(initialPosts);
  const [newPost, setNewPost] = useState("");
  const [commentText, setCommentText] = useState({});
  const [likedPosts, setLikedPosts] = useState([]);

  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    setLikedPosts(savedLikes);
  }, []);

  useEffect(() => {
    localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
  }, [likedPosts]);

  const handleCreatePost = () => {
    if (!newPost.trim()) return;
    const newP = { id: Date.now(), user: { firstName: "You", lastName: "" }, content: newPost, likesCount: 0, comments: [] };
    setPosts([newP, ...posts]);
    setNewPost("");
  };

  const handleLike = (postId) => {
    if (likedPosts.includes(postId)) {
      alert("You already liked this post!");
      return;
    }
    setPosts(posts.map(p => p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p));
    setLikedPosts([...likedPosts, postId]);
  };

  const handleComment = (postId) => {
    const comment = commentText[postId];
    if (!comment?.trim()) return;
    setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, { id: Date.now(), user: { firstName: "You" }, content: comment }] } : p));
    setCommentText(prev => ({ ...prev, [postId]: "" }));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Group Posts</h2>
      <textarea
        value={newPost}
        onChange={(e) => setNewPost(e.target.value)}
        placeholder="Write a new post..."
        style={{ width: "100%", minHeight: 60 }}
      />
      <br />
      <button onClick={handleCreatePost}>Post</button>

      {posts.map(p => (
        <div key={p.id} style={{ border: "1px solid #ddd", padding: 15, margin: "10px 0" }}>
          <h4>{p.user.firstName} {p.user.lastName}</h4>
          <p>{p.content}</p>
          <button onClick={() => handleLike(p.id)}>👍 Like ({p.likesCount})</button>

          <div style={{ marginTop: 10 }}>
            <input
              type="text"
              placeholder="Add a comment"
              value={commentText[p.id] || ""}
              onChange={(e) => setCommentText(prev => ({ ...prev, [p.id]: e.target.value }))}
              style={{ marginRight: 8 }}
            />
            <button onClick={() => handleComment(p.id)}>Comment</button>
          </div>

          {p.comments.length > 0 && (
            <div style={{ marginTop: 10, paddingLeft: 15 }}>
              {p.comments.map(c => (
                <p key={c.id}><b>{c.user.firstName}</b>: {c.content}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default GroupDetails;
