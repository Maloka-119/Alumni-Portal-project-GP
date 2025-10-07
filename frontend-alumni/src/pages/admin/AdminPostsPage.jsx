import React, { useState, useEffect } from 'react';
import './AdminPostsPage.css';
import AdminPostsImg from './AdminPosts.jpeg';
import { Heart, MessageCircle, Share2, Image, FileText, Edit, Trash2, Link as LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API from "../../services/api";

const AdminPostsPage = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [posts, setPosts] = useState([]);
  const [types, setTypes] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [editingPostId, setEditingPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  // const fetchPosts = async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const res = await API.get("/posts/admin");
  //     setPosts(res.data.data);
  //   } catch (err) {
  //     console.error("Error fetching posts", err);
  //     setError(t("fetchPostsFailed"));
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/posts/admin");
      console.log("Response from backend:", res.data); 
      setPosts(res.data?.data || []); 
    } catch (err) {
      console.error("Error fetching posts", err);
      setError(t("fetchPostsFailed"));
    } finally {
      setLoading(false);
    }
  }; 
  

  const fetchCategories = async () => {
    try {
      const res = await API.get("/posts/categories");
      setTypes(res.data.data || []); 
    } catch (err) {
      console.error("Error fetching categories", err);
      setTypes([]);
    }
  };
//========================================================================================
  // const handleSubmitPost = async (e) => {
  //   e.preventDefault();
  //   const formData = new FormData();
  //   formData.append("content", e.target.content.value);
  //   formData.append("type", e.target.type.value);
  //   formData.append("link", e.target.link.value);
  //   if (e.target.image.files[0]) formData.append("image", e.target.image.files[0]);
  //   if (e.target.file.files[0]) formData.append("file", e.target.file.files[0]);
  
  //   try {
  //     if (editingPostId) {
  //       await API.put(`/posts/${editingPostId}`, formData);
  //     } else {
  //       await API.post("/posts/create-post", formData);
  //     }
  //     fetchPosts();
  //     setShowForm(false);
  //     setEditingPostId(null);
  //   } catch (err) {
  //     console.error("Error saving post", err);
  //     setError(t("savePostFailed"));
  //   }
  // };
//=======================================================================================
const handleSubmitPost = async (e) => {
  e.preventDefault();
  
  console.log("🎯 Submit started, editingPostId:", editingPostId);
  
  const formData = new FormData();
  formData.append("content", e.target.content.value);
  formData.append("type", e.target.type.value);
  formData.append("link", e.target.link.value);
  
  if (e.target.image.files[0]) {
    for (let i = 0; i < e.target.image.files.length; i++) {
      formData.append("images", e.target.image.files[i]);
    }
  }

  try {
    let response;
    
    if (editingPostId) {
      console.log("🔄 Editing post with ID:", editingPostId);
      
      // جرب الـ route الأساسي أولاً
      response = await API.put(`/posts/${editingPostId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      console.log("✅ Edit response:", response.data);
      
    } else {
      console.log("🆕 Creating new post");
      response = await API.post("/posts/create-post", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      console.log("✅ Create response:", response.data);
    }
    
    await fetchPosts();
    setShowForm(false);
    setEditingPostId(null);
    e.target.reset();
  } catch (err) {
    console.error("❌ Error saving post:", err);
    console.error("Error details:", err.response?.data);
    setError(t("savePostFailed"));
  }
};

  const handleDelete = async (id) => {
    try {
      await API.delete(`/posts/${id}`);
      fetchPosts();
    } catch (err) {
      console.error("Error deleting post", err);
      setError(t("deletePostFailed"));
    }
  };
  const handleLikePost = async (post) => {
    try {
      await API.post(`/posts/${post.id}/like`);
     
      setPosts(prev =>
        prev.map(p =>
          p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p
        )
      );
    } catch (err) {
      console.error("Failed to like post", err);
    }
  };
//========================================================================================  
  // const handleEdit = (post) => {
  //   setShowForm(true);
  //   setEditingPostId(post.id);
  //   setTimeout(() => {
  //     document.querySelector('textarea[name="content"]').value = post.content;
  //     document.querySelector('select[name="type"]').value = post.category;
  //     document.querySelector('input[name="link"]').value = post.link || '';
  //   }, 0);
  // };
//========================================================================================

const handleEdit = (post) => {
  console.log("✏️ Editing post ID:", post.post_id, "Full post:", post);
  setShowForm(true);
  setEditingPostId(post.post_id); // استخدم post_id بدل id
  
  setTimeout(() => {
    const contentField = document.querySelector('textarea[name="content"]');
    const typeField = document.querySelector('select[name="type"]');
    const linkField = document.querySelector('input[name="link"]');
    
    if (contentField) contentField.value = post.content || '';
    if (typeField) typeField.value = post.category || post.type || '';
    if (linkField) linkField.value = post.link || '';
  }, 100);
};

  const filteredPosts = filterType === t('All', { defaultValue: 'All' }) 
    ? posts 
    : posts.filter(p => p.category === filterType);

  return (
    <div className="feed-container">
      <h2 className="page-title">{t('Manage Alumni Posts')}</h2>

      {loading && <p>{t('loadingPosts')}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="create-post-bar" onClick={() => setShowForm(true)}>
        <input placeholder={t('Create new post...')} className="post-input" readOnly />
      </div>

      {showForm && (
        <form onSubmit={handleSubmitPost} className="compact-post-form">
          <textarea name="content" placeholder={t('Post Content')} required className="input-field" />
          <select name="type" required className="input-field" defaultValue={types[0] || ''}>
            {types.map(ti => <option key={ti} value={ti}>{ti}</option>)}
          </select>
          <input name="link" placeholder={t('Optional Link')} className="input-field" />
          <div className="optional-icons">
            <label title={t('Add Image')}>
              <input type="file" name="image" style={{ display: 'none' }} />
              <Image size={20} />
            </label>
            <label title={t('Add File')}>
              <input type="file" name="file" style={{ display: 'none' }} />
              <FileText size={20} />
            </label>
            <label title={t('Add Link')}>
              <LinkIcon size={20} />
            </label>
          </div>
          <div className="form-buttons">
            <button type="submit" className="submit-btn">{editingPostId ? t('Update') : t('Post')}</button>
            <button type="button" className="cancel-btn" onClick={() => { setShowForm(false); setEditingPostId(null); }}>{t('Cancel')}</button>
          </div>
        </form>
      )}

      {!loading && !error && (
        <>
          <div className="filter-bar">
            <label>{t('Filter by type:')}</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option>{t('All')}</option>
              {types.map(ti => <option key={ti}>{ti}</option>)}
            </select>
          </div>

          <div className="posts-feed">
            {filteredPosts.map((post) => (
              <div key={post.post_id} className="post-card">
                <div className="post-header">
                  <img src={AdminPostsImg} alt="profile" className="profile-pic" />
                  <div className="post-header-info">
                    <strong>Alumni Portal – Helwan University</strong>
                    <div className="post-date">{post['created-at']}</div>
                  </div>
                  <span className="post-type-badge">{post.category}</span>
                </div>
                <div className="post-content">
                  <p>{post.content}</p>
                  {post.imageUrl && <img src={post.imageUrl} alt="post" className="post-image" />}
                  {post.fileUrl && <a href={post.fileUrl} download className="post-file-link">{post.fileName}</a>}
                  {post.link && (
                    <a href={post.link} target="_blank" rel="noopener noreferrer" className="post-link">
                      {post.link}
                    </a>
                  )}
                </div>
                <div className="post-actions">
                  <button onClick={() => handleLikePost(post)}><Heart size={16} /> {post.likes}</button>
                  <button>
  <MessageCircle size={16} /> {post.comments?.length || 0}
</button>

                  <button><Share2 size={16} /> {post.shares}</button>
                  <button onClick={() => handleEdit(post)} className="edit-btn"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(post.id)} className="delete-btn"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPostsPage;



// import React, { useState } from 'react';
// import './AdminPostsPage.css';
// import AdminPostsImg from './AdminPosts.jpeg';
// import { Heart, MessageCircle, Share2, Image, FileText, Edit, Trash2 } from 'lucide-react';



// const AdminPostsPage = () => {
//   const [showForm, setShowForm] = useState(false);
//   const [posts, setPosts] = useState([]);
//   const [filterType, setFilterType] = useState('All');

//   const handleAddPost = (e) => {
//     e.preventDefault();
//     const newPost = {
//       title: e.target.title.value,
//       type: e.target.type.value,
//       content: e.target.content.value,
//       image: e.target.image?.files[0] || null,
//       file: e.target.file?.files[0] || null,
//       likes: 0,
//       comments: [],
//       shares: 0,
//       date: new Date().toLocaleString(),
//     };
//     setPosts([newPost, ...posts]);
//     setShowForm(false);
//   };

//   const handleLike = (index) => {
//     const updated = [...posts];
//     updated[index].likes++;
//     setPosts(updated);
//   };

//   const handleShare = (index) => {
//     const updated = [...posts];
//     updated[index].shares++;
//     setPosts(updated);
//   };

//   const handleDelete = (index) => {
//     const updated = [...posts];
//     updated.splice(index, 1);
//     setPosts(updated);
//   };

//   const handleEdit = (index) => {
//     const post = posts[index];
//     setShowForm(true);
//     setPosts(posts.filter((_, i) => i !== index));
//     setTimeout(() => {
//       document.querySelector('input[name="title"]').value = post.title;
//       document.querySelector('textarea[name="content"]').value = post.content;
//       document.querySelector('select[name="type"]').value = post.type;
//     }, 0);
//   };

//   const filteredPosts = filterType === 'All' ? posts : posts.filter(p => p.type === filterType);

//   return (
//     <div className="feed-container">
//       <h2 className="page-title">Manage Alumni Posts</h2>

//       <div className="filter-bar">
//         <label>Filter by type:</label>
//         <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
//           <option>All</option>
//           <option>News</option>
//           <option>Job Opportunity</option>
//           <option>Event</option>
//           <option>Discount</option>
//           <option>Theater</option>
//           <option>Library</option>
//         </select>
//       </div>

//       <div className="create-post-bar" onClick={() => setShowForm(true)}>
//         <input placeholder="Create new post..." className="post-input" readOnly />
//       </div>

//       {showForm && (
//         <form onSubmit={handleAddPost} className="compact-post-form">
//           <input name="title" placeholder="Post Title" required className="input-field" />
//           <textarea name="content" placeholder="Post Content" required className="input-field" />
//           <select name="type" required className="input-field">
//             <option>News</option>
//             <option>Job Opportunity</option>
//             <option>Event</option>
//             <option>Discount</option>
//             <option>Theater</option>
//             <option>Library</option>
//           </select>
//           <div className="optional-icons">
//             <label title="Add Image">
//               <input type="file" name="image" style={{ display: 'none' }} />
//               <Image size={20} />
//             </label>
//             <label title="Add File">
//               <input type="file" name="file" style={{ display: 'none' }} />
//               <FileText size={20} />
//             </label>
//           </div>
//           <div className="form-buttons">
//             <button type="submit" className="submit-btn">Post</button>
//             <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
//           </div>
//         </form>
//       )}

//       <div className="posts-feed">
//         {filteredPosts.map((post, index) => (
//           <div key={index} className="post-card">
//             <div className="post-header">
//               <img src={AdminPostsImg} alt="profile" className="profile-pic" />
//               <div className="post-header-info">
//                 <strong>Alumni Portal – Helwan University</strong>
//                 <div className="post-date">{post.date}</div>
//               </div>
//               <span
//                 className="post-type-badge"
                
//               >
//                 {post.type}
//               </span>
//             </div>
//             <div className="post-content">
//               <h4>{post.title}</h4>
//               <p>{post.content}</p>
//               {post.image && (
//                 <img src={URL.createObjectURL(post.image)} alt="post" className="post-image" />
//               )}
//               {post.file && (
//   <a 
//     href={URL.createObjectURL(post.file)} 
//     download={post.file.name} 
//     className="post-file-link"
//   >
//     {post.file.name}
//   </a>
// )}

//             </div>
//             <div className="post-actions">
//               <button onClick={() => handleLike(index)}><Heart size={16} /> {post.likes}</button>
//               <button><MessageCircle size={16} /> {post.comments.length}</button>
//               <button onClick={() => handleShare(index)}><Share2 size={16} /> {post.shares}</button>
//               <button onClick={() => handleEdit(index)} className="edit-btn"><Edit size={16} /></button>
//               <button onClick={() => handleDelete(index)} className="delete-btn"><Trash2 size={16} /></button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default AdminPostsPage;


