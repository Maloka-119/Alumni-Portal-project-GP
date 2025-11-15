// import React, { useState, useEffect, useRef } from 'react';
// import { Image } from 'lucide-react';
// import { useTranslation } from 'react-i18next';
// import './AlumniAdminPosts.css';
// import API from "../../services/api";
// import PROFILE from './PROFILE.jpeg';
// import PostCard from '../../components/PostCard'; 
// import Swal from 'sweetalert2';

// const PostsAlumni = () => {
//   const { t } = useTranslation();
//   const [showForm, setShowForm] = useState(false);
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [successMsg, setSuccessMsg] = useState(null);
//   const [newPost, setNewPost] = useState({
//     content: '',
//     image: null,
//     link: '',
//     category: 'General'
//   });
//   const [editingPostId, setEditingPostId] = useState(null);
//   const [isEditingMode, setIsEditingMode] = useState(false);

//   const formRef = useRef(null);
//   const postRefs = useRef({});

//   const user = JSON.parse(localStorage.getItem("user")) || null;
//   const token = localStorage.getItem("token");

//   useEffect(() => {
//     if (successMsg || error) {
//       const timer = setTimeout(() => {
//         setSuccessMsg(null);
//         setError(null);
//       }, 1000); 
//       return () => clearTimeout(timer);
//     }
//   }, [successMsg, error]);

//   const formatPosts = (data) => {
//     return data
//       .sort((a, b) => new Date(b['created-at']) - new Date(a['created-at']))
//       .map(post => ({
//         ...post,
//         id: post.id || post.post_id,
//         date: new Date(post['created-at']).toLocaleString('en-US', {
//           month: 'short',
//           day: 'numeric',
//           year: 'numeric',
//           hour: '2-digit',
//           minute: '2-digit',
//           hour12: true
//         }),
//         comments: post.comments || [],
//         likes: post.likes_count || 0,
//         author: {
//           id: post.author?.id,
//           name: post.author?.['full-name'] || 'Unknown',
//           photo: post.author?.image || PROFILE
//         }
//       }));
//   };

//   const fetchPosts = async () => {
//     if (!token) return;
//     try {
//       setLoading(true);
//       const res = await API.get('/posts/my-graduate-posts', {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       setPosts(formatPosts(res.data.data));
//     } catch (err) {
//       setError(err.response?.data?.message || err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (token) fetchPosts();
//   }, [token]);

//   const handleAddOrEditPost = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setSuccessMsg(null);

//     if (!token) {
//       setError("Login first");
//       return;
//     }

//     if (!newPost.content && !newPost.image) {
//       setError("Post cannot be empty");
//       return;
//     }

//     const formData = new FormData();
//     formData.append('content', newPost.content);
//     formData.append('type', newPost.category);
//     if (newPost.image) formData.append('images', newPost.image);

//     try {
//       if (isEditingMode && editingPostId) {
//         await API.put(`/posts/${editingPostId}/edit`, formData, {
//           headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
//         });

//         // تحديث محلي للبوست
//         setPosts(prev => prev.map(p =>
//           p.id === editingPostId ? { ...p, content: newPost.content, category: newPost.category } : p
//         ));

//         setSuccessMsg("Post updated");

//         // scroll للبوست بعد التحديث
//         setTimeout(() => {
//           postRefs.current[editingPostId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
//         }, 100);

//       } else {
//         await API.post('/posts/create-post', formData, {
//           headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
//         });
//         setSuccessMsg("Post created");
//         await fetchPosts();
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to save post");
//     }

//     setShowForm(false);
//     setEditingPostId(null);
//     setIsEditingMode(false);
//     setNewPost({ content: '', category: 'General', image: null, link: '' });
//   };

//   const handleEditPostClick = (post) => {
//     setShowForm(true);
//     setIsEditingMode(true);
//     setEditingPostId(post.id);
//     setNewPost({
//       content: post.content || '',
//       category: post.category || 'General',
//       image: null,
//       link: post.link || ''
//     });

//     setTimeout(() => {
//       formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
//     }, 100);
//   };

//   const handleDelete = async (postId) => {
//     if (!token) return;
//     try {
//       await API.delete(`/posts/${postId}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       setPosts(posts.filter(p => p.id !== postId));
//     } catch (err) {
//       setError(err.response?.data?.message || err.message);
//     }
//   };

//   return (
//     <div className="uni-feed">
//       {!user && <div>{t('pleaseLogin')}</div>}

//       {user && (
//         <>
//           <h2 className="uni-header">{t('myPosts')}</h2>

//           {successMsg && <div style={{ color: 'green' }}>{successMsg}</div>}
//           {error && <div style={{ color: 'red' }}>{error}</div>}
//           {loading && <div>{t('loadingPosts')}</div>}
//           {!loading && posts.length === 0 && <div>{t('noPosts')}</div>}

//           <div className="am-create-bar" onClick={() => {
//             setShowForm(true);
//             setIsEditingMode(false);
//             setNewPost({ content: '', image: null, link: '', category: 'General' });
//             setTimeout(() => {
//               formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
//             }, 100);
//           }}>
//             <input placeholder={t('createNewPost')} readOnly />
//           </div>

//           {showForm && (
//             <form ref={formRef} className="uni-post-form" onSubmit={handleAddOrEditPost}>
//               <textarea
//                 placeholder={t('writePost')}
//                 value={newPost.content}
//                 onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
//                 rows={4}
//               />
//               <div className="uni-category-select">
//                 <label>{t('category')}:</label>
//                 <select
//                   value={newPost.category}
//                   onChange={(e) => {
//                     const selected = e.target.value;
//                     setNewPost({ ...newPost, category: selected });
//                     if (selected === "Success story") {
//                       Swal.fire({
//                         icon: "info",
//                         title: "Public Post",
//                         html: `
//                           <div style="text-align: left;">
//                             <p>Success story posts can be featured publicly on the main page.</p>
//                             <p>يمكن للبوستات التي تصنف كقصة نجاح أن تظهر بشكل عام على الصفحة الرئيسية.</p>
//                           </div>
//                         `,
//                         confirmButtonText: "OK",
//                         background: "#fefefe",
//                         color: "#333",
//                       });
//                     }
//                   }}
//                 >
//                   <option value="General">General</option>
//                   <option value="Internship">Internship</option>
//                   <option value="Success story">Success story</option>
//                 </select>
//               </div>
//               <div className="uni-optional-icons">
//                 <label title={t('addImage')}>
//                   <input
//                     type="file"
//                     style={{ display: 'none' }}
//                     onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })}
//                   />
//                   <Image size={20} />
//                 </label>
//               </div>
//               <div className="uni-form-buttons">
//                 <button type="submit">
//                   {isEditingMode ? t('update') : t('post')}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowForm(false);
//                     setIsEditingMode(false);
//                     setNewPost({ content: '', image: null, link: '', category: 'General' });
//                   }}
//                 >
//                   {t('cancel')}
//                 </button>
//               </div>
//             </form>
//           )}

//           {!loading && posts.map(post => (
//             <div key={post.id} ref={el => postRefs.current[post.id] = el}>
//               <PostCard
//                 post={post}
//                 onEdit={() => handleEditPostClick(post)}
//                 onDelete={() => handleDelete(post.id)}
//               />
//             </div>
//           ))}
//         </>
//       )}
//     </div>
//   );
// };

// export default PostsAlumni;

import React, { useState, useEffect, useRef } from 'react';
import { Image, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './AlumniAdminPosts.css';
import API from "../../services/api";
import PROFILE from './PROFILE.jpeg';
import PostCard from '../../components/PostCard'; 
import Swal from 'sweetalert2';

const PostsAlumni = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [newPost, setNewPost] = useState({ content: '', image: null, link: '', category: 'General' });
  const [editingPostId, setEditingPostId] = useState(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const [newPostImages, setNewPostImages] = useState([]); // ملفات جديدة قبل الحفظ
  const [existingImages, setExistingImages] = useState([]); // الصور الموجودة من الباك
  const [removedImages, setRemovedImages] = useState([]); // لتسجيل الصور المحذوفة

  const formRef = useRef(null);
  const postRefs = useRef({});
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setError(null);
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [successMsg, error]);

  const formatPosts = (data) => {
    return data
      .sort((a, b) => new Date(b['created-at']) - new Date(a['created-at']))
      .map(post => ({
        ...post,
        id: post.id || post.post_id,
        date: new Date(post['created-at']).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        comments: post.comments || [],
        likes: post.likes_count || 0,
        images: post.images || [],
        author: {
          id: post.author?.id,
          name: post.author?.['full-name'] || 'Unknown',
          photo: post.author?.image || PROFILE
        }
      }));
  };

  const fetchPosts = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await API.get('/posts/my-graduate-posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPosts(formatPosts(res.data.data));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  const handleAddOrEditPost = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
  
    if (!token) {
      setError("Login first");
      return;
    }
  
    if (!newPost.content && newPostImages.length === 0 && existingImages.length === 0) {
      setError("Post cannot be empty");
      return;
    }
  
    // ملفات جديدة فقط
    const formData = new FormData();
    formData.append('content', newPost.content);
    formData.append('type', newPost.category);
    newPostImages.forEach(img => formData.append('images', img));
  
    try {
      if (isEditingMode && editingPostId) {
        // أرسل الحذف أولاً كـ JSON
        if (removedImages.length > 0) {
          await API.put(`/posts/${editingPostId}/edit`, {
            removeImages: removedImages
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
  
        // بعدين رفع الملفات الجديدة مع المحتوى
        await API.put(`/posts/${editingPostId}/edit`, formData, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
  
        setSuccessMsg("Post updated");
        await fetchPosts();
      } else {
        await API.post('/posts/create-post', formData, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMsg("Post created");
        await fetchPosts();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save post");
    }
  
    setShowForm(false);
    setIsEditingMode(false);
    setEditingPostId(null);
    setNewPost({ content: '', image: null, link: '', category: 'General' });
    setNewPostImages([]);
    setExistingImages([]);
    setRemovedImages([]);
  };
  

  const handleEditPostClick = (post) => {
    setShowForm(true);
    setIsEditingMode(true);
    setEditingPostId(post.id);
    setNewPost({
      content: post.content || '',
      category: post.category || 'General',
      image: null,
      link: post.link || ''
    });
    setExistingImages(post.images || []);
    setNewPostImages([]);
    setRemovedImages([]);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeletePost = async (postId) => {
    if (!token) return;
    try {
      await API.delete(`/posts/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleAddImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewPostImages(prev => [...prev, file]);
  };

  const handleRemoveExistingImage = (url) => {
    setExistingImages(prev => prev.filter(img => img !== url));
    setRemovedImages(prev => [...prev, url]);
  };

  const handleRemoveNewImage = (file) => {
    setNewPostImages(prev => prev.filter(f => f !== file));
  };

  return (
    <div className="uni-feed">
      {!user && <div>{t('pleaseLogin')}</div>}

      {user && (
        <>
          <h2 className="uni-header">{t('myPosts')}</h2>

          {successMsg && <div style={{ color: 'green' }}>{successMsg}</div>}
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {loading && <div>{t('loadingPosts')}</div>}
          {!loading && posts.length === 0 && <div>{t('noPosts')}</div>}

          <div className="am-create-bar" onClick={() => {
            setShowForm(true);
            setIsEditingMode(false);
            setNewPost({ content: '', image: null, link: '', category: 'General' });
            setExistingImages([]);
            setNewPostImages([]);
            setRemovedImages([]);
            setTimeout(() => {
              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}>
            <input placeholder={t('createNewPost')} readOnly />
          </div>

          {showForm && (
            <form ref={formRef} className="uni-post-form" onSubmit={handleAddOrEditPost}>
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
                  onChange={(e) => {
                    const selected = e.target.value;
                    setNewPost({ ...newPost, category: selected });
                    if (selected === "Success story") {
                      Swal.fire({
                        icon: "info",
                        title: "Public Post",
                        html: `
                          <div style="text-align: left;">
                            <p>Success story posts can be featured publicly on the main page.</p>
                            <p>يمكن للبوستات التي تصنف كقصة نجاح أن تظهر بشكل عام على الصفحة الرئيسية.</p>
                          </div>
                        `,
                        confirmButtonText: "OK",
                        background: "#fefefe",
                        color: "#333",
                      });
                    }
                  }}
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
                    onChange={handleAddImage}
                  />
                  <Image size={20} />
                </label>
              </div>

              <div className="image-preview-container">
                {existingImages.map(url => (
                  <div key={url} className="image-wrapper">
                    <span className="file-name">{url.split('/').pop()}</span>
                    <Trash2 size={16} className="delete-icon" onClick={() => handleRemoveExistingImage(url)} />
                  </div>
                ))}

                {newPostImages.map(file => (
                  <div key={file.name} className="image-wrapper">
                    <span className="file-name">{file.name}</span>
                    <Trash2 size={16} className="delete-icon" onClick={() => handleRemoveNewImage(file)} />
                  </div>
                ))}
              </div>

              <div className="uni-form-buttons">
                <button type="submit">{isEditingMode ? t('update') : t('post')}</button>
                <button type="button" onClick={() => {
                  setShowForm(false);
                  setIsEditingMode(false);
                  setNewPost({ content: '', image: null, link: '', category: 'General' });
                  setExistingImages([]);
                  setNewPostImages([]);
                  setRemovedImages([]);
                }}>{t('cancel')}</button>
              </div>
            </form>
          )}

          {!loading && posts.map(post => (
            <div key={post.id} ref={el => postRefs.current[post.id] = el}>
              <PostCard
                post={post}
                onEdit={() => handleEditPostClick(post)}
                onDelete={() => handleDeletePost(post.id)}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default PostsAlumni;
