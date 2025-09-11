import React, { useState, useEffect, useContext } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import AdminPostsImg from './AdminPosts.jpeg';
import './AlumniAdminPosts.css';
import { DarkModeContext } from './DarkModeContext';

const API_URL = 'http://localhost:5000/api';

const AlumniAdminPosts = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [filterType, setFilterType] = useState('All');
  const [commentInputs, setCommentInputs] = useState({});
  const [posts, setPosts] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
    fetchTypes();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/posts`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
      setError('Error fetching posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/post-types`);
      if (!res.ok) throw new Error('Failed to fetch types');
      const data = await res.json();
      setTypes(data);
    } catch (err) {
      console.error(err);
      setError('Error fetching post types');
    }
  };

  const handleLike = async (postId) => {
    try {
      await fetch(`${API_URL}/posts/${postId}/like`, { method: 'POST' });
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1, liked: true } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  const handleCommentSubmit = async (postId) => {
    const comment = commentInputs[postId];
    if (!comment) return;
    try {
      await fetch(`${API_URL}/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment })
      });
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, comments: [...p.comments, { userName: 'You', content: comment, avatar: 'https://i.pravatar.cc/40?img=10' }] }
          : p
      ));
      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = filterType === 'All' ? posts : posts.filter(p => p.type === filterType);

  if (loading) return <p>Loading posts...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className={`uni-feed ${darkMode ? 'dark-mode' : ''}`}>
      <div className="uni-header">
        <h2>Uni Opportunities</h2>
      </div>

      <div className="uni-filter">
        <label>Filter by type:</label>
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
                <strong>Alumni Portal – Helwan University</strong>
                <div className="post-date">{post.date}</div>
              </div>
              <span className="post-type-badge">{post.type}</span>
            </div>

            <div className="uni-post-body">
              <h4>{post.title}</h4>
              <p>{post.content}</p>
              {post.link && <a href={post.link} target="_blank" rel="noopener noreferrer" className="uni-post-link">{post.link}</a>}
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
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => handleCommentChange(post.id, e.target.value)}
                  />
                  <button onClick={() => handleCommentSubmit(post.id)}>Send</button>
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




// import React, { useState, useContext } from 'react';
// import { Heart, MessageCircle, Share2 } from 'lucide-react';
// import AdminPostsImg from './AdminPosts.jpeg';
// import './AlumniAdminPosts.css';
// import { DarkModeContext } from './DarkModeContext'; // استدعاء الـContext

// const AlumniAdminPosts = () => {
//   const { darkMode } = useContext(DarkModeContext); // استخدم darkMode من الـContext
//   const [filterType, setFilterType] = useState('All');
//   const [commentInputs, setCommentInputs] = useState({});

//   const initialPosts = [
//     {
//       id: 1,
//       title: 'Welcome Alumni!',
//       content: 'Join our upcoming networking event this Friday.',
//       type: 'Event',
//       date: '2025-09-07',
//       likes: 12,
//       liked: false,
//       shares: 3,
//       showComments: false,
//       comments: [
//         { userName: 'Ahmed', content: 'Looking forward to it!', avatar: 'https://i.pravatar.cc/40?img=1' },
//         { userName: 'Sara', content: 'I will be there.', avatar: 'https://i.pravatar.cc/40?img=2' }
//       ]
//     },
//     {
//       id: 2,
//       title: 'Job Opportunity',
//       content: 'We have an opening for a Frontend Developer at XYZ Company.',
//       type: 'Job',
//       date: '2025-09-06',
//       likes: 8,
//       liked: false,
//       shares: 1,
//       showComments: false,
//       comments: [
//         { userName: 'Mona', content: 'Thanks for sharing!', avatar: 'https://i.pravatar.cc/40?img=3' }
//       ],
//       link: 'https://xyz.com/jobs/frontend'
//     }
//   ];

//   const [posts, setPosts] = useState(initialPosts);

//   const handleLike = (postId) => {
//     setPosts(posts.map(p => {
//       if(p.id === postId && !p.liked) return { ...p, likes: p.likes + 1, liked: true };
//       return p;
//     }));
//   };

//   const toggleComments = (postId) => {
//     setPosts(posts.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
//   };

//   const handleCommentChange = (postId, value) => {
//     setCommentInputs({ ...commentInputs, [postId]: value });
//   };

//   const handleCommentSubmit = (postId) => {
//     const comment = commentInputs[postId];
//     if(!comment) return;
//     setPosts(posts.map(p => p.id === postId ? { 
//       ...p, 
//       comments: [...p.comments, { userName: 'You', content: comment, avatar: 'https://i.pravatar.cc/40?img=10' }] 
//     } : p));
//     setCommentInputs({ ...commentInputs, [postId]: '' });
//   };

//   const filteredPosts = filterType === 'All' ? posts : posts.filter(p => p.type === filterType);

//   return (
//     <div className={`uni-feed ${darkMode ? 'dark-mode' : ''}`}>
//       <div className="uni-header">
//         <h2>Uni Opportunities</h2>
//       </div>

//       <div className="uni-filter">
//         <label >Filter by type:</label>
//         <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
//           <option>All</option>
//           {Array.from(new Set(posts.map(p => p.type))).map(t => <option key={t}>{t}</option>)}
//         </select>
//       </div>

//       <div className="uni-posts">
//         {filteredPosts.map(post => (
//           <div key={post.id} className="uni-post-card">
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

//             <div className="uni-post-body">
//               <h4>{post.title}</h4>
//               <p>{post.content}</p>
//               {post.link && <a href={post.link} target="_blank" rel="noopener noreferrer" className="uni-post-link">{post.link}</a>}
//             </div>
// <br/>
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
//                     placeholder="Write a comment..."
//                     value={commentInputs[post.id] || ''}
//                     onChange={(e) => handleCommentChange(post.id, e.target.value)}
//                   />
//                   <button onClick={() => handleCommentSubmit(post.id)}>Send</button>
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
