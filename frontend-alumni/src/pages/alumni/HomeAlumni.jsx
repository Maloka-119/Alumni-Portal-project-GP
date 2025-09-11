import React, { useState, useEffect, useContext } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import './AlumniAdminPosts.css';
import { DarkModeContext } from './DarkModeContext';

const API_URL = 'http://localhost:5000/api';

const HomeAlumni = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [posts, setPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/posts?page=${page}&limit=5`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      if (data.length === 0) setHasMore(false);
      else setPosts(prev => [...prev, ...data]);
    } catch (err) {
      console.error(err);
      setError('Error fetching posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [page]);

  const handleLike = async (postId) => {
    try {
      await fetch(`${API_URL}/posts/${postId}/like`, { method: 'POST' });
      setPosts(posts.map(p =>
        p.id === postId && !p.liked ? { ...p, likes: p.likes + 1, liked: true } : p
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId) => {
    setPosts(posts.map(p =>
      p.id === postId ? { ...p, showComments: !p.showComments } : p
    ));
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

  if (loading && page === 1) return <p>Loading posts...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className={`uni-feed ${darkMode ? 'dark-mode' : ''}`}>
      <div className="uni-header"><h2>Home Feed</h2></div>

      <div className="uni-posts">
        {posts.map(post => (
          <div key={post.id} className="uni-post-card">
            <div className="post-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={post.avatar} alt={post.userName} className="profile-pic" />
                <div className="post-header-info" style={{ marginLeft: '10px' }}>
                  <strong>{post.userName}</strong>
                  <div className="post-date">{post.date}</div>
                </div>
              </div>
              {post.type && <span className="post-type-badge">{post.type}</span>}
            </div>

            <div className="uni-post-body">
              <h4>{post.title}</h4>
              <p>{post.content}</p>
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
                {post.comments.map((c, idx) => (
                  <div key={idx} className="uni-comment-item">
                    <img src={c.avatar} alt={c.userName} className="uni-comment-avatar"/>
                    <div className="uni-comment-text"><strong>{c.userName}</strong>: {c.content}</div>
                  </div>
                ))}
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

      {hasMore && (
        <div style={{ textAlign: 'center', margin: '20px' }}>
          <button onClick={() => setPage(page + 1)}>Load more</button>
        </div>
      )}
    </div>
  );
};

export default HomeAlumni;




// import React, { useState, useContext } from 'react';
// import { Heart, MessageCircle, Share2 } from 'lucide-react';
// import AdminPostsImg from './AdminPosts.jpeg';
// import './AlumniAdminPosts.css';
// import { DarkModeContext } from './DarkModeContext';

// const HomeAlumni = () => {
//   const { darkMode } = useContext(DarkModeContext);
//   const [commentInputs, setCommentInputs] = useState({});

//   const initialPosts = [
//     {
//       id: 1,
//       title: 'Welcome Alumni!',
//       content: 'Join our upcoming networking event this Friday.',
//       type: 'University',
//       date: '2025-09-07',
//       likes: 12,
//       liked: false,
//       shares: 3,
//       showComments: false,
//       comments: [
//         { userName: 'Ahmed', content: 'Looking forward to it!', avatar: 'https://i.pravatar.cc/40?img=1' },
//         { userName: 'Sara', content: 'I will be there.', avatar: 'https://i.pravatar.cc/40?img=2' }
//       ],
//       avatar: AdminPostsImg,
//       userName: 'Alumni Portal – Helwan University'
//     },
//     {
//       id: 2,
//       title: 'Had a great weekend!',
//       content: 'Visited the new cafe downtown, it was amazing!',
//       type: null,
//       date: '2025-09-08',
//       likes: 5,
//       liked: false,
//       shares: 0,
//       showComments: false,
//       comments: [
//         { userName: 'Laila', content: 'Looks fun!', avatar: 'https://i.pravatar.cc/40?img=4' }
//       ],
//       avatar: 'https://i.pravatar.cc/40?img=5',
//       userName: 'Omar Khaled'
//     }
//   ];

//   const [posts, setPosts] = useState(initialPosts);

//   const handleLike = (postId) => {
//     setPosts(posts.map(p => p.id === postId && !p.liked ? { ...p, likes: p.likes + 1, liked: true } : p));
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

//   return (
//     <div className={`uni-feed ${darkMode ? 'dark-mode' : ''}`}>
//       <div className="uni-header">
//         <h2>Home Feed</h2>
//       </div>

//       <div className="uni-posts">
//         {posts.map(post => (
//           <div key={post.id} className="uni-post-card">
//             <div className="post-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//               <div style={{ display: 'flex', alignItems: 'center' }}>
//                 <img src={post.avatar} alt={post.userName} className="profile-pic" />
//                 <div className="post-header-info" style={{ marginLeft: '10px' }}>
//                   <strong>{post.userName}</strong>
//                   <div className="post-date">{post.date}</div>
//                 </div>
//               </div>
//               {post.type === 'University' && (
//                 <span className="post-type-badge">
//                   {post.type}
//                 </span>
//               )}
//             </div>

//             <div className="uni-post-body">
//               <h4>{post.title}</h4>
//               <p>{post.content}</p>
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

// export default HomeAlumni;
