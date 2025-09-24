import React, { useState, useEffect } from "react";
import "./GroupDetail.css";
import PROFILE from './PROFILE.jpeg';
import { Heart, MessageCircle, Info, ArrowLeft, Edit, Image, FileText, Link as LinkIcon } from 'lucide-react';
import API from "../../services/api";

function GroupDetail({ group, goBack, updateGroup }) {
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [graduates, setGraduates] = useState([]);
  const [selectedGraduates, setSelectedGraduates] = useState([]);
  const [showAddPostForm, setShowAddPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [postTitle, setPostTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [postType, setPostType] = useState("");
  const [postLink, setPostLink] = useState("");
  const [postImages, setPostImages] = useState([]);
  const [postFiles, setPostFiles] = useState([]);
  const [removeImages, setRemoveImages] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [types, setTypes] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [years, setYears] = useState([]);

  useEffect(() => {
    fetchGraduates();
    fetchFilters();
    fetchTypes();
  }, []);

  const fetchGraduates = async () => {
    try {
      const res = await API.get("/graduates");
      setGraduates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFilters = async () => {
    setColleges(["Engineering", "Medicine", "Arts"]);
    setYears([2020, 2021]);
  };

  const fetchTypes = async () => {
    try {
      const res = await API.get("/post-types");
      setTypes(res.data || []);
      if(res.data && res.data.length > 0) setPostType(res.data[0]); // default
    } catch (err) {
      console.error("Error fetching types", err);
      setTypes(["General"]); // fallback
      setPostType("General");
    }
  };

  const filteredGraduates = graduates.filter(
    g => (!college || g.college === college) && (!year || g.year === Number(year))
  );

  const toggleGraduate = grad => {
    setSelectedGraduates(prev =>
      prev.includes(grad.id)
        ? prev.filter(id => id !== grad.id)
        : [...prev, grad.id]
    );
  };

  const addGraduates = async () => {
    try {
      for (let id of selectedGraduates) {
        await API.post("/groups/add-user", { groupId: group.id, userId: id });
      }
      const res = await API.get(`/groups/${group.id}`);
      updateGroup(res.data);
      setSelectedGraduates([]);
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    }
  };
  const handleLikePost = async (post) => {
    try {
      await API.post(`/posts/${post.post_id}/like`);
      const updatedPosts = group.posts.map(p =>
        p.post_id === post.post_id
          ? { ...p, liked: true } 
          : p
      );
      updateGroup({ ...group, posts: updatedPosts });
    } catch (err) {
      console.error("Failed to like post", err);
    }
  };

  const handlePostSubmit = async e => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("category", postType);
      formData.append("content", postText);
      formData.append("groupId", group.id);
      formData.append("inLanding", true);
      if(postLink) formData.append("link", postLink);
      postImages.forEach(img => formData.append("images", img));
      postFiles.forEach(f => formData.append("files", f));
      removeImages.forEach(url => formData.append("removeImages", url));

      let res;
      if(editingPost){
        res = await API.put(`/posts/${editingPost.post_id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        const updatedPosts = group.posts.map(p =>
          p.post_id === editingPost.post_id ? res.data.post : p
        );
        updateGroup({ ...group, posts: updatedPosts });
        setEditingPost(null);
      } else {
        res = await API.post("/posts/create-post", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        updateGroup({ ...group, posts: [res.data.post, ...group.posts] });
        setShowAddPostForm(false);
      }

      
      setPostText("");
      setPostLink("");
      setPostType(types[0] || "News");
      setPostImages([]);
      setPostFiles([]);
      setRemoveImages([]);
    } catch(err){
      console.error(err);
    }
  };

  const startEditPost = post => {
    setEditingPost(post);
   
    setPostText(post.content || post.text || "");
    setPostType(post.category || (types[0] || "News"));
    setPostLink(post.link || "");
    setPostImages(post.images || []);
    setPostFiles([]);
    setRemoveImages([]);
  };

  const handleImageChange = e => {
    const files = Array.from(e.target.files);
    setPostImages(prev => [...prev, ...files]);
  };

  const handleFileChange = e => {
    const files = Array.from(e.target.files);
    setPostFiles(prev => [...prev, ...files]);
  };

  const handleRemoveImage = url => {
    if(typeof url === "string") setRemoveImages(prev => [...prev, url]);
    setPostImages(prev => prev.filter(img => img !== url));
  };

  return (
    <div className="container">
      <button className="back-btn" onClick={goBack} style={{ float: "right", display: "flex", alignItems: "center", gap: "6px" }}>
        <ArrowLeft size={16} />
      </button>

      <div className="group-header">
        <div className="created-icon-wrapper">
          <Info size={18} color="#4f46e5" style={{ cursor: 'pointer' }} />
          <div className="tooltip">
            Created at: {new Date(group.createdAt).toLocaleString()}
          </div>
        </div>

        {group.cover ? (
          <img src={group.cover} alt={group.name} className="cover-img" />
        ) : (
          <div className="cover-placeholder">No Cover Image</div>
        )}

        <h1 style={{ color: '#1e3a8a' }}>{group.name}</h1>

        <div className="group-actions">
          <div className="action-tag" onClick={() => setShowMembersModal(true)}>
            {group.members.length} Members
          </div>
          <div className="action-tag" onClick={() => setShowAddModal(true)}>
            Add Members +
          </div>
          <p className="group-description">{group.description}</p>
        </div>
      </div>

      <div className="posts-section">
        <div className="new-post-bar" onClick={() => { setShowAddPostForm(true); setEditingPost(null); setPostText(""); setPostImages([]); }}>
          What's on your mind...
        </div>

        {(showAddPostForm || editingPost) && (
          <form onSubmit={handlePostSubmit} className="compact-post-form">
            
            <textarea value={postText} onChange={e => setPostText(e.target.value)} placeholder={'Post Content'} required className="input-field" />
            <select value={postType} onChange={e => setPostType(e.target.value)} required className="input-field">
              {types.map(ti => <option key={ti}>{ti}</option>)}
            </select>
            <input value={postLink} onChange={e => setPostLink(e.target.value)} placeholder={'Optional Link'} className="input-field" />

            <div className="optional-icons">
              <label title={'Add Image'}>
                <input type="file" onChange={handleImageChange} multiple style={{ display: 'none' }} />
                <Image size={20} />
              </label>
              <label title={'Add File'}>
                <input type="file" onChange={handleFileChange} multiple style={{ display: 'none' }} />
                <FileText size={20} />
              </label>
              <label title={'Add Link'}>
                <LinkIcon size={20} /> 
              </label>
            </div>

            <div className="images-preview">
              {postImages.map((img, idx) => (
                <div key={idx} style={{ display: "inline-block", position: "relative", margin: "4px" }}>
                  <span style={{ cursor: "pointer", position: "absolute", top: 0, right: 0, color: "red" }} onClick={() => handleRemoveImage(img)}>X</span>
                  {typeof img === "string" ? <img src={img} alt="post" style={{ width: "80px", height: "80px" }} /> : <span>{img.name}</span>}
                </div>
              ))}
            </div>

            <div className="form-buttons">
              <button style={{backgroundColor: '#facc15'}} type="submit">{editingPost ? "Update Post" : "Post"}</button>
            </div>
          </form>
        )}

        <ul className="posts-list">
          {group.posts.map(p => (
            <li key={p.post_id || p.id} className="post-card">
              <div className="post-header">
                <img
                  src={p.author?.avatar || PROFILE}
                  alt={p.author?.name || "User"}
                  className="avatar"
                />
                <span className="username">{p.author?.name || "User"}</span>
                <span className="post-date">{new Date(p["created-at"] || p.createdAt).toLocaleString()}</span>
                <Edit size={16} style={{ cursor: "pointer", marginLeft: "8px" }} onClick={() => startEditPost(p)} />
              </div>
              <div className="post-content">{p.content || p.text}</div>
              <div className="post-actions">
                <button onClick={() => handleLikePost(p)}><Heart size={16} />Like</button>
                <button><MessageCircle size={16} />Comment</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showMembersModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <button className="modal-close" onClick={() => setShowMembersModal(false)}>X</button>
            <h3>Members</h3>
            <ul>
              {group.members.map(m => <li key={m.id}>{m.name}</li>)}
            </ul>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <button className="modal-close" onClick={() => setShowAddModal(false)}>X</button>
            <h3>Add Graduates</h3>
            <div className="filters">
              <select value={college} onChange={e => setCollege(e.target.value)}>
                <option value="">All Colleges</option>
                {colleges.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select value={year} onChange={e => setYear(e.target.value)}>
                <option value="">All Years</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <ul>
              {filteredGraduates.map(g => (
                <li key={g.id}>
                  <input
                    type="checkbox"
                    checked={selectedGraduates.includes(g.id)}
                    onChange={() => toggleGraduate(g)}
                  />
                  {g.name} ({g.college}, {g.year})
                </li>
              ))}
            </ul>
            <button onClick={addGraduates}>Add to Group</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupDetail;
