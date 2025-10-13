import React, { useState, useEffect } from 'react';
import './AdminPostsPage.css';
import { Heart, MessageCircle, Share2, EyeOff } from 'lucide-react';
import { useTranslation } from "react-i18next";
import API from '../../services/api';
import PROFILE from './PROFILE.jpeg';

const UsersPostsPage = () => {
  const { t } = useTranslation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/posts');
      const formattedPosts = (res.data.data || []).map(p => ({
        ...p,
        comments: Array.isArray(p.comments) ? p.comments : [],
      }));
      // Print only title and author
      formattedPosts.forEach(post => console.log('Post title:', post.title, 'Author:', post.author?.["full-name"]));
      setPosts(formattedPosts);
    } catch (err) {
      console.error('Error fetching posts', err);
      setError(t("fetchPostsFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async (id) => {
    if (!id) {
      console.log('Invalid post id:', id);
      return;
    }
    try {
      const response = await API.put(`/posts/${id}/hide`);
      if (response.data.status === "success") {
        setPosts(posts.map(p => p.id === id ? { ...p, isHidden: true } : p));
      }
    } catch (err) {
      console.error("Error hiding post", err);
      setError(t("hidePostFailed"));
    }
  };

  const openComments = (post) => setSelectedPost(post);
  const closeComments = () => {
    setSelectedPost(null);
    setNewComment('');
  };

  const handleAddComment = async () => {
    if (!newComment || !selectedPost) return;

    try {
      await API.post(`/posts/${selectedPost.id}/comment`, { content: newComment });

      const commentObj = {
        id: Date.now(),
        user: { name: 'You', photo: selectedPost.author?.image || PROFILE },
        content: newComment
      };

      setSelectedPost({
        ...selectedPost,
        comments: [...selectedPost.comments, commentObj]
      });

      setPosts(posts.map(p => p.id === selectedPost.id ? {
        ...p,
        comments: [...p.comments, commentObj]
      } : p));

      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikePost = async (post) => {
    try {
      await API.post(`/posts/${post.id}/like`);
      setPosts(posts.map(p =>
        p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p
      ));
      if (selectedPost?.id === post.id) {
        setSelectedPost({ ...selectedPost, likes: (selectedPost.likes || 0) + 1 });
      }
    } catch (err) {
      console.error("Failed to like post", err);
    }
  };

  if (loading) return <p>{t("loadingPosts")}</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const filteredPosts = posts.filter(p => {
    if (filter === 'Hidden') return p.isHidden;
    if (filter === 'Normal') return !p.isHidden;
    return true;
  });

  return (
    <div className="feed-container">
      <h2 className="page-title">{t("userPosts")}</h2>

      <div className="filter-bar">
        <label>{t("Filter by:")}</label>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option>All</option>
          <option>Normal</option>
          <option>Hidden</option>
        </select>
      </div>

      <div className="posts-feed">
        {filteredPosts.map((post) => (
          <div key={post.id} className={`post-card ${post.isHidden ? 'hidden-post' : ''}`}>
            <div className="post-header">
              <div className="post-header-info">
                <img src={post.author?.image || PROFILE} alt="profile" className="profile-pic" />
                <strong>{post.author?.["full-name"] || t('unknown')}</strong>
                <div className="post-date">
                  {new Date(post["created-at"]).toLocaleString()} - {post.category}
                </div>
              </div>
              {!post.isHidden && (
                <button onClick={() => handleHide(post.id)} className="hide-btn-top">
                  <EyeOff size={16} />
                </button>
              )}
            </div>

            <div className="post-content">
              <h4>{post.title}</h4>
              <p>{post.content}</p>
              {post.imageUrl && <img src={post.imageUrl} alt="post" className="post-image" />}
              {post.fileUrl && <a href={post.fileUrl} download className="post-file-link">{post.fileName}</a>}
              {post.link && <a href={post.link} target="_blank" rel="noopener noreferrer" className="post-link">{post.link}</a>}
            </div>

            <div className="post-actions">
              <button onClick={() => handleLikePost(post)}>
                <Heart size={16} /> {post.likes || 0}
              </button>
              <button onClick={() => openComments(post)}>
                <MessageCircle size={16} /> {(post.comments || []).length}
              </button>
              <button>
                <Share2 size={16} /> {post.shares || 0}
              </button>
            </div>

            {selectedPost?.id === post.id && selectedPost?.comments && Array.isArray(selectedPost.comments) && (
              <div className="comments-modal">
                <div className="comments-container">
                  <div className="comments-header">
                    <span>{t('comments')}</span>
                    <button className="comments-close-btn" onClick={closeComments}>X</button>
                  </div>
                  <div className="comments-list">
                    {selectedPost.comments.map(c => (
                      <div key={c.id} className="comment-item">
                        <img src={c.user?.photo || PROFILE} alt="avatar" className="comment-avatar" />
                        <div className="comment-text">
                          <strong>{c.user?.name || t('unknown')}</strong>
                          <p>{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="add-comment">
                    <input
                      type="text"
                      placeholder={t("writeComment")}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button onClick={handleAddComment}>{t("send")}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersPostsPage;



// import React, { useState, useEffect } from 'react';
// import './AdminPostsPage.css';
// import { Heart, MessageCircle, Share2, EyeOff } from 'lucide-react';
// import { useTranslation } from "react-i18next";
// import API from '../../services/api';
// import PROFILE from './PROFILE.jpeg'

// const UsersPostsPage = () => {
//   const { t } = useTranslation();

//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedPost, setSelectedPost] = useState(null); 
// const [newComment, setNewComment] = useState(''); 


//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const fetchPosts = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await API.get('/posts'); 
//       setPosts(res.data.data);
//     } catch (err) {
//       console.error('Error fetching posts', err);
//       setError(t("fetchPostsFailed"));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleHide = async (id) => {
//     try {
//       const response = await API.put(`/posts/${id}/hide`);
  
//       if (response.data.status === "success") {
//         setPosts(posts.map(p =>
//           p.id === id ? { ...p, isHidden: true } : p
//         ));
//       }
//     } catch (err) {
//       console.error("Error hiding post", err);
//       setError(t("hidePostFailed"));
//     }
//   };
  

//   const openComments = (post) => {
//     setSelectedPost(post);
//   };
  
//   const closeComments = () => {
//     setSelectedPost(null);
//   };

//   const handleAddComment = async () => {
//   if (!newComment) return;

//   try {
//     await API.post(`/posts/${selectedPost.id}/comment`, { content: newComment });

//     setSelectedPost({
//       ...selectedPost,
//       comments: [
//         ...selectedPost.comments,
//         { id: Date.now(), user: { name: 'You', photo: selectedPost.profileImageUrl }, content: newComment }
//       ]
//     });

//     setPosts(posts.map(p => p.id === selectedPost.id ? {
//       ...p,
//       comments: [...p.comments, { id: Date.now(), user: { name: 'You', photo: selectedPost.profileImageUrl }, content: newComment }]
//     } : p));

//     setNewComment('');
//   } catch (err) {
//     console.error(err);
//   }
// };
// const handleLikePost = async (post) => {
//   try {
//     await API.post(`/posts/${post.id}/like`);
//     setPosts(posts.map(p =>
//       p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p
//     ));
//     if (selectedPost?.id === post.id) {
//       setSelectedPost({ ...selectedPost, likes: (selectedPost.likes || 0) + 1 });
//     }
//   } catch (err) {
//     console.error("Failed to like post", err);
//   }
// };

//   return (
//     <div className="feed-container">
//       <h2 className="page-title">{t("userPosts")}</h2>

//       {loading && <p>{t("loadingPosts")}</p>}
//       {error && <p style={{ color: 'red' }}>{error}</p>}

//       {!loading && !error && (
//         <div className="posts-feed">
//           {posts.map((post) => (
//             !post.isHidden && (
//               <div key={post.id} className="post-card">
//                 <div className="post-header">
//                   <div className="post-header-info">
//                     <img src={post.author.image || PROFILE} alt="profile" className="profile-pic" />
//                     <strong>{post.author["full-name"]}</strong>
//                     <div className="post-date">
//                       {new Date(post["created-at"]).toLocaleString()} - {post.category}
//                     </div>

//                   </div>
//                   <button onClick={() => handleHide(post.id)} className="hide-btn-top"><EyeOff size={16} /></button>
//                 </div>

//                 <div className="post-content">
//                   <h4>{post.title}</h4>
//                   <p>{post.content}</p>
//                   {post.imageUrl && <img src={post.imageUrl} alt="post" className="post-image" />}
//                   {post.fileUrl && <a href={post.fileUrl} download className="post-file-link">{post.fileName}</a>}
//                   {post.link && (
//                     <a href={post.link} target="_blank" rel="noopener noreferrer" className="post-link">
//                       {post.link}
//                     </a>
//                   )}
//                 </div>

//                 <div className="post-actions">
//                   <button onClick={() => handleLikePost(post)}><Heart size={16} /> {post.likes}</button>
//                   <button onClick={() => openComments(post)}>
//                   <MessageCircle size={16} /> {post.comments?.length || 0}

// </button>
//                   <button><Share2 size={16} /> {post.shares}</button>
//                 </div>

//                 {selectedPost?.id === post.id &&  (
//   <div className="comments-modal">
//     <div className="comments-container">
//       <div className="comments-header">
//         <span>{t('comments')}</span>
//         <button className="comments-close-btn" onClick={closeComments}>X</button>
//       </div>
//       <div className="comments-list">
//         {selectedPost.comments.map(c => (
//           <div key={c.id} className="comment-item">
//             <img src={c.user?.photo || PROFILE } alt="avatar" className="comment-avatar" />
//             <div className="comment-text">
//               <strong>{c.user?.name || t('unknown')}</strong>
//               <p>{c.content}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   </div>
// )}
//               </div>
//             )
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default UsersPostsPage;
