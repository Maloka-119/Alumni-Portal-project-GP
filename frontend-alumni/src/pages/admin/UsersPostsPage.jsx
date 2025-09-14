import React, { useState, useEffect } from 'react';
import './AdminPostsPage.css';
import { Heart, MessageCircle, Share2, EyeOff } from 'lucide-react';
import { useTranslation } from "react-i18next";
import API from '../../services/api';
import PROFILE from './PROFILE.jpeg'

const UsersPostsPage = () => {
  const { t } = useTranslation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null); 
const [newComment, setNewComment] = useState(''); 


  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/posts'); // الرابط النسبي بعد baseURL
      setPosts(res.data);
    } catch (err) {
      console.error('Error fetching posts', err);
      setError(t("fetchPostsFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async (id) => {
    try {
      await API.put(`/posts/${id}/hide`);
      setPosts(posts.map(p => p.id === id ? { ...p, state: 'hidden' } : p));
    } catch (err) {
      console.error('Error hiding post', err);
      setError(t("hidePostFailed"));
    }
  };

  const openComments = (post) => {
    setSelectedPost(post);
  };
  
  const closeComments = () => {
    setSelectedPost(null);
  };

  const handleAddComment = async () => {
  if (!newComment) return;

  try {
    await API.post(`/posts/${selectedPost.id}/comment`, { content: newComment });

    // تحديث التعليقات محلياً بعد الإرسال
    setSelectedPost({
      ...selectedPost,
      comments: [
        ...selectedPost.comments,
        { id: Date.now(), user: { name: 'You', photo: selectedPost.profileImageUrl }, content: newComment }
      ]
    });

    // تحديث الحالة العامة للبوستات لو محتاج
    setPosts(posts.map(p => p.id === selectedPost.id ? {
      ...p,
      comments: [...p.comments, { id: Date.now(), user: { name: 'You', photo: selectedPost.profileImageUrl }, content: newComment }]
    } : p));

    setNewComment('');
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div className="feed-container">
      <h2 className="page-title">{t("userPosts")}</h2>

      {loading && <p>{t("loadingPosts")}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <div className="posts-feed">
          {posts.map((post) => (
            post.state !== 'hidden' && (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-header-info">
                    <img src={post.profileImageUrl} alt="profile" className="profile-pic" />
                    <strong>{post.username}</strong>
                    <div className="post-date">{post.date}</div>
                  </div>
                  <button onClick={() => handleHide(post.id)} className="hide-btn-top"><EyeOff size={16} /></button>
                </div>

                <div className="post-content">
                  <h4>{post.title}</h4>
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
                  <button><Heart size={16} /> {post.likes}</button>
                  <button onClick={() => openComments(post)}>
  <MessageCircle size={16} /> {post.comments.length}
</button>
                  <button><Share2 size={16} /> {post.shares}</button>
                </div>

                {selectedPost && (
  <div className="comments-modal">
    <div className="comments-container">
      <div className="comments-header">
        <span>{t('comments')}</span>
        <button className="comments-close-btn" onClick={closeComments}>X</button>
      </div>
      <div className="comments-list">
        {selectedPost.comments.map(c => (
          <div key={c.id} className="comment-item">
            <img src={c.user?.photo || PROFILE } alt="avatar" className="comment-avatar" />
            <div className="comment-text">
              <strong>{c.user?.name || t('unknown')}</strong>
              <p>{c.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersPostsPage;



// import React, { useState } from 'react';
// import './AdminPostsPage.css';
// import { Heart, MessageCircle, Share2, EyeOff, Trash2 } from 'lucide-react';

// const mockPosts = [
//   {
//     id: 1,
//     username: 'Ahmed Hossam',
//     title: 'Graduation Ceremony 2025',
//     state: 'hidden',
//     content: 'The graduation ceremony will be held on 15th September.',
//     imageUrl: null,
//     fileUrl: null,
//     fileName: '',
//     link: '',
//     likes: 5,
//     comments: [],
//     shares: 2,
//     date: '2025-09-01 14:30',
//   },
//   {
//     id: 2,
//     username: 'Sara Ali',
//     title: 'New Job Opportunity',
//     state: 'approved',
//     content: 'Company XYZ is hiring alumni for multiple positions.',
//     imageUrl: null,
//     fileUrl: null,
//     fileName: '',
//     link: 'https://companyxyz.com/careers',
//     likes: 3,
//     comments: [],
//     shares: 1,
//     date: '2025-09-02 09:15',
//   },
//   {
//     id: 3,
//     username: 'Salwa Ali',
//     title: 'News',
//     state: 'approved',
//     content: 'Company XYZ is hiring alumni for multiple positions.',
//     imageUrl: null,
//     fileUrl: null,
//     fileName: '',
//     link: 'https://companyxyz.com/careers',
//     likes: 3,
//     comments: [],
//     shares: 1,
//     date: '2025-09-02 09:15',
//   },
// ];

// const UsersPostsPage = () => {
//   const [posts, setPosts] = useState(mockPosts);

//   // صلاحيات المستخدم الحالي
//   const userPermissions = ["view", "edit"]; // مثال

//   const handleHide = (id) => {
//     if (!userPermissions.includes("edit")) return;
//     setPosts(posts.map(p => p.id === id ? { ...p, state: 'hidden' } : p));
//   };

//   const handleDelete = (id) => {
//     if (!userPermissions.includes("delete")) return;
//     setPosts(posts.filter(p => p.id !== id));
//   };

//   return (
//     <div className="feed-container">
//       <h2 className="page-title">User Posts</h2>

//       <div className="posts-feed">
//         {posts.map((post) => (
//           userPermissions.includes("view") && post.state !== 'hidden' && (
//             <div key={post.id} className="post-card">
//               <div className="post-header">
//                 <div className="post-header-info">
//                   <strong>{post.username}</strong>
//                   <div className="post-date">{post.date}</div>
//                 </div>

//                 <div className="post-header-actions">
//                   {userPermissions.includes("edit") && (
//                     <button onClick={() => handleHide(post.id)} className="hide-btn-top">
//                       <EyeOff size={16} />
//                     </button>
//                   )}
//                   {userPermissions.includes("delete") && (
//                     <button onClick={() => handleDelete(post.id)} className="delete-btn-top">
//                       <Trash2 size={16} />
//                     </button>
//                   )}
//                 </div>
//               </div>

//               <div className="post-content">
//                 <h4>{post.title}</h4>
//                 <p>{post.content}</p>
//                 {post.imageUrl && <img src={post.imageUrl} alt="post" className="post-image" />}
//                 {post.fileUrl && <a href={post.fileUrl} download className="post-file-link">{post.fileName}</a>}
//                 {post.link && (
//                   <a href={post.link} target="_blank" rel="noopener noreferrer" className="post-link">
//                     {post.link}
//                   </a>
//                 )}
//               </div>

//               <div className="post-actions">
//                 <button><Heart size={16} /> {post.likes}</button>
//                 <button><MessageCircle size={16} /> {post.comments.length}</button>
//                 <button><Share2 size={16} /> {post.shares}</button>
//               </div>
//             </div>
//           )
//         ))}
//       </div>
//     </div>
//   );
// };

// export default UsersPostsPage;
