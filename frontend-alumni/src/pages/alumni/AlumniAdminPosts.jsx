import React, { useState, useEffect, useContext } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import AdminPostsImg from './AdminPosts.jpeg';
import PROFILE from './PROFILE.jpeg';
import './AlumniAdminPosts.css';
import { DarkModeContext } from './DarkModeContext';
import { useTranslation } from "react-i18next";
import API from '../../services/api'; 

const AlumniAdminPosts = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [filterType, setFilterType] = useState('All');
  const [commentInputs, setCommentInputs] = useState({});
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const [types, setTypes] = useState([]);
  const currentUserId = 2;

  useEffect(() => {
    fetchPosts();
    fetchTypes();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/posts/admin");
      const filtered = (res.data?.data || []).filter(p => !p['group-id']);

      const formattedPosts = filtered.map(p => ({
        id: p.post_id,
        content: p.content,
        likes: p.likes?.length || 0,
        liked: p.likes?.some(l => l['user-id'] === currentUserId) || false,
        comments: p.comments?.map(c => ({
          userName: c.author?.['full-name'] || "Anonymous",
          content: c.content,
          avatar: c.author?.image || PROFILE
        })) || [],

        date: new Date(p['created-at']).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        authorName: "Alumni Portal – Helwan University",
        shares: 0,
        type: p.category,
        images: p.images || []
      }));

      console.log("Fetched and formatted posts:", formattedPosts);

      setPosts(formattedPosts);
    } catch (err) {
      console.error("Error fetching posts:", err.response?.data || err.message);
      setError(err.response?.data?.message || 'Error fetching posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await API.get("/posts/categories");
      setTypes(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (postId) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    const post = posts[postIndex];
  
    try {
      if (post.liked) {
        // لو عمل like قبل كده، اشيله
        await API.delete(`/posts/${postId}/like`);
        const updatedPosts = [...posts];
        updatedPosts[postIndex].likes -= 1;
        updatedPosts[postIndex].liked = false;
        setPosts(updatedPosts);
      } else {
        // لو ما عملش like، اعمله
        await API.post(`/posts/${postId}/like`);
        const updatedPosts = [...posts];
        updatedPosts[postIndex].likes += 1;
        updatedPosts[postIndex].liked = true;
        setPosts(updatedPosts);
      }
    } catch (err) {
      console.error("Error toggling like:", err.response?.data || err);
    }
  };
  

  const toggleComments = (postId) => {
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  const handleCommentSubmit = async (postId) => {
    const comment = commentInputs[postId];
    if (!comment) return;
  
    try {
      const res = await API.post(`/posts/${postId}/comments`, { content: comment });

      console.log("Comment response from backend:", res.data);
  
      // ✅ ضيف الكومينت الجديد مباشرة في الـ state
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId
            ? {
                ...p,
                comments: [
                  ...(p.comments || []),
                  {
                    comment_id: res.data.comment.comment_id,
                    content: res.data.comment.content,
                    createdAt: res.data.comment["created-at"],
                    edited: res.data.comment.edited,
                    author: {
                      id: res.data.comment.author.id,
                      fullName: res.data.comment.author["full-name"],
                      email: res.data.comment.author.email,
                      image: PROFILE
                    }
                  }
                ]
              }
            : p
        )
      );
  
      // ✅ امسح حقل الكتابة بعد الإرسال
      setCommentInputs({ ...commentInputs, [postId]: '' });
  
    } catch (err) {
      console.error("Error submitting comment:", err);
    }
  };
  
  

  const filteredPosts = filterType === 'All' ? posts : posts.filter(p => p.type === filterType);

  if (loading) return <p>{t("uniAdminPosts_loading")}</p>;
  if (error) return <p style={{ color: 'red' }}>{t("uniAdminPosts_error")}</p>;

  return (
    <div className={`uni-feed ${darkMode ? 'dark-mode' : ''}`}>
      <div className="uni-header">
        <h2>{t("Opportunities")}</h2>
      </div>

      <div className="uni-filter">
        <label>{t("filterByType")}</label>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option>All</option>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="uni-posts">
        {filteredPosts.map(post => (
          <div key={post.id} className="uni-post-card">
            <div className="post-header">
              <img src={AdminPostsImg} alt="profile" className="profile-pic" />
              <div className="post-header-info">
                <strong>{post.authorName}</strong>
                <div className="post-date">{post.date}</div>
              </div>
              <span className="post-type-badge">{post.type}</span>
            </div>

            <div className="uni-post-body">
              <p>{post.content}</p>
              {post.images?.length > 0 && (
                <div className="uni-post-images">
                  {post.images.map((imgUrl, index) => (
                    <img
                      key={index}
                      src={imgUrl}
                      alt={`post-${index}`}
                      className="uni-post-image"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="uni-post-actions">
              <button className={post.liked ? 'uni-liked' : ''} onClick={() => handleLike(post.id)}>
                <Heart size={16}/> {post.likes}
              </button>
              <button onClick={() => toggleComments(post.id)}>
                <MessageCircle size={16}/> {post.comments.length} 
              </button>
              <button>
                <Share2 size={16}/> {post.shares} 
              </button>
            </div>

            {post.showComments && (
              <div className="uni-comments-section">
                <div className="uni-existing-comments">
                  {post.comments.map((c, idx) => (
                    <div key={idx} className="uni-comment-item">
                      <img src={c.avatar} alt={c.userName} className="uni-comment-avatar"/>
                      <div className="uni-comment-text">
                        <strong>{c.userName}</strong>: {c.content}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="uni-comment-input">
                  <input
                    type="text"
                    placeholder={t("writeComment")}
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => handleCommentChange(post.id, e.target.value)}
                  />
                  <button onClick={() => handleCommentSubmit(post.id)}>{t("send")}</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlumniAdminPosts;






// import React, { useState, useEffect, useContext } from 'react';
// import { Heart, MessageCircle, Share2 } from 'lucide-react';
// import AdminPostsImg from './AdminPosts.jpeg';
// import './AlumniAdminPosts.css';
// import { DarkModeContext } from './DarkModeContext';
// import { useTranslation } from "react-i18next";
// import API from '../../services/api'; 

// const AlumniAdminPosts = () => {
//   const { darkMode } = useContext(DarkModeContext);
//   const [filterType, setFilterType] = useState('All');
//   const [commentInputs, setCommentInputs] = useState({});
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { t } = useTranslation();
//   const [types, setTypes] = useState([]);

//   useEffect(() => {
//     fetchPosts();
//     fetchTypes();
//   }, []);

//   const fetchPosts = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await API.get("/posts/admin");
//       console.log("Response from backend:", res.data); 
  
//       // فلترة البوستات اللي group_id = null
//       const filtered = (res.data?.data || []).filter(p => p["group-id"] === null);
  
//       const formattedPosts = filtered.map(p => ({
//         id: p.post_id,
//         content: p.content,
//         date: new Date(p['created-at']).toLocaleString(), 
//         authorName: "Alumni Portal – Helwan University",
//         likes: p.likes || 0,
//         liked: false,
//         comments: [],
//         shares: 0,
//         type: p.category,
//         images: p.images || [] // 🆕 أضفنا الصور هنا
//       }));
  
//       setPosts(formattedPosts);
//     } catch (err) {
//       console.error("Error fetching posts:", err.response?.data || err.message);
//       setError(err.response?.data?.message || 'Error fetching posts');
//     } finally {
//       setLoading(false);
//     }
//   };
  
  

//   const fetchTypes = async () => {
//     try {
//       const res = await API.get("/posts/categories");
//       setTypes(res.data.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleLike = async (postId) => {
//     try {
//       await API.post(`/posts/${postId}/like`);
//       setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1, liked: true } : p));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const toggleComments = (postId) => {
//     setPosts(posts.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
//   };

//   const handleCommentChange = (postId, value) => {
//     setCommentInputs({ ...commentInputs, [postId]: value });
//   };

//   const handleCommentSubmit = async (postId) => {
//     const comment = commentInputs[postId];
//     if (!comment) return;
//     try {
//       await API.post(`/posts/${postId}/comment`, { content: comment });
//       setPosts(posts.map(p =>
//         p.id === postId
//           ? { ...p, comments: [...p.comments, { userName: 'You', content: comment, avatar: 'https://i.pravatar.cc/40?img=10' }] }
//           : p
//       ));
//       setCommentInputs({ ...commentInputs, [postId]: '' });
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const filteredPosts = filterType === 'All' ? posts : posts.filter(p => p.type === filterType);

//   if (loading) return <p>{t("uniAdminPosts_loading")}</p>;
//   if (error) return <p style={{ color: 'red' }}>{t("uniAdminPosts_error")}</p>;

//   return (
//     <div className={`uni-feed ${darkMode ? 'dark-mode' : ''}`}>
//       <div className="uni-header">
//         <h2>{t("Opportunities")}</h2>
//       </div>

//       <div className="uni-filter">
//         <label>{t("filterByType")}</label>
//         <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
//           <option>All</option>
//           {types.map(t => <option key={t}>{t}</option>)}
//         </select>
//       </div>

//       <div className="uni-posts">
//         {filteredPosts.map(post => (
//           <div key={post.id} className="uni-post-card">
//             <div className="post-header">
//               <img src={AdminPostsImg} alt="profile" className="profile-pic" />
//               <div className="post-header-info">
//                 <strong>{post.authorName}</strong>
//                 <div className="post-date">{post.date}</div>
//               </div>
//               <span className="post-type-badge">{post.type}</span>
//             </div>

//             <div className="uni-post-body">
//               <p>{post.content}</p>
//               {post.images && post.images.length > 0 && (
//     <div className="uni-post-images">
//       {post.images.map((imgUrl, index) => (
//         <img
//           key={index}
//           src={imgUrl}
//           alt={`post-${index}`}
//           className="uni-post-image"
//           onError={(e) => {
//             console.error(`❌ Failed to load image: ${imgUrl}`);
//             e.target.style.display = 'none';
//           }}
//         />
//       ))}
//     </div>
//   )}
//             </div>

//             <div className="uni-post-actions">
//               <button className={post.liked ? 'uni-liked' : ''} onClick={() => handleLike(post.id)}>
//                 <Heart size={16}/> {post.likes} 
//               </button>
//               <button onClick={() => toggleComments(post.id)}>
//                 <MessageCircle size={16}/> {post.comments.length} 
//               </button>
//               <button>
//                 <Share2 size={16}/> {post.shares} 
//               </button>
//             </div>

//             {post.showComments && (
//               <div className="uni-comments-section">
//                 <div className="uni-existing-comments">
//                   {post.comments.map((c, idx) => (
//                     <div key={idx} className="uni-comment-item">
//                       <img src={c.avatar} alt={c.userName} className="uni-comment-avatar"/>
//                       <div className="uni-comment-text">
//                         <strong>{c.userName}</strong>: {c.content}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="uni-comment-input">
//                   <input
//                     type="text"
//                     placeholder={t("uniAdminPosts_writeComment")}
//                     value={commentInputs[post.id] || ''}
//                     onChange={(e) => handleCommentChange(post.id, e.target.value)}
//                   />
//                   <button onClick={() => handleCommentSubmit(post.id)}>{t("uniAdminPosts_send")}</button>
//                 </div>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default AlumniAdminPosts;

