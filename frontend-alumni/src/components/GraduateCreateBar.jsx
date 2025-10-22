import React, { useState } from "react";
import { Image } from "lucide-react";
import API from "../services/api";
import "./GraduateCreateBar.css";

function GraduateCreateBar({ onPostCreated }) {
  const token = localStorage.getItem("token");
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({
    content: "",
    category: "General",
    image: null
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPost.content && !newPost.image) {
      setError("Post cannot be empty");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", newPost.content);
      formData.append("type", newPost.category);
      if (newPost.image) formData.append("images", newPost.image);

      await API.post("/posts/create-post", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Post created");
      setNewPost({ content: "", category: "General", image: null });
      setShowForm(false);

      if (onPostCreated) onPostCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post");
    }
  };

  return (
    <div className="grad-create-container">
      {!showForm ? (
        <div
          className="grad-create-bar"
          onClick={() => setShowForm(true)}
        >
          <input
            type="text"
            placeholder="Share your thoughts..."
            readOnly
          />
        </div>
      ) : (
        <form
          className="grad-create-form"
          onSubmit={handleSubmit}
        >
          <textarea
            placeholder="Write your post"
            value={newPost.content}
            onChange={(e) =>
              setNewPost({ ...newPost, content: e.target.value })
            }
            rows={3}
          />
          <div className="grad-create-options">
            <label>
              <Image size={18} />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setNewPost({ ...newPost, image: e.target.files[0] })
                }
                hidden
              />
            </label>
            <select
              value={newPost.category}
              onChange={(e) =>
                setNewPost({ ...newPost, category: e.target.value })
              }
            >
              <option value="General">General</option>
              <option value="Internship">Internship</option>
              <option value="Success story">Success story</option>
            </select>
          </div>
          {error && <p className="grad-error">{error}</p>}
          {success && <p className="grad-success">{success}</p>}
          <div className="grad-create-buttons">
            <button type="submit">Post</button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default GraduateCreateBar;
