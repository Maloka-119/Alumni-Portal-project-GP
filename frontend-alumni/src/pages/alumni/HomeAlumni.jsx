
import React, { useState, useEffect, useContext } from 'react';
import './AlumniAdminPosts.css';
import { DarkModeContext } from './DarkModeContext';
import { useTranslation } from 'react-i18next';
import API from '../../services/api';
import PROFILE from './PROFILE.jpeg';
import AdminPostsImg from './AdminPosts.jpeg';
import { ChevronDown } from "lucide-react";
import PostCard from '../../components/PostCard';

const HomeAlumni = () => {
  const { darkMode } = useContext(DarkModeContext);
  const { t } = useTranslation();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPosts = async (pageNum = 1) => {
    if (pageNum === 1) setPosts([]);
    
    setLoading(true);
    setError(null);
  
    try {
      const res = await API.get(`/posts/user-posts?page=${pageNum}&limit=10`);
      // console.log("Fetched posts response:", res.data);
    
      const filteredData = res.data.data.filter(post => post["group-id"] == null);
    
      const formatted = filteredData.map(post => {
        const isUniversityPost =
          post.author?.type === "admin" || post.author?.type === "staff";
    
        const formattedPost = {
          id: post.post_id || post.id,
          author: {
            name: isUniversityPost
              ? "Alumni Portal - Helwan University"
              : post.author?.["full-name"] || "Unknown",
            photo: isUniversityPost
              ? AdminPostsImg
              : post.author?.image || PROFILE,
            id: post.author?.id,
          },
          date: post["created-at"],
          category: post.category || "",
          "group-id": post["group-id"] || null,
          content: post.content || "",
          images: post.images || [],
          likesCount: Array.isArray(post.likesCount          ) ? post.likes.length : post.likesCount          || 0,   
          isLikedByYou: !!post.isLikedByYou,
          shares: 0,
          comments: (post.comments || []).map(comment => {
            const isUniversityComment =
            comment.author?.["user-type"] === "admin" || 
            comment.author?.["user-type"] === "staff";            
    
            return {
              comment_id: comment.comment_id,
              content: comment.content,
              author: {
                id: comment.author?.id,
                "full-name": isUniversityComment
  ? "Alumni Portal - Helwan University"
  : comment.author?.["full-name"] || "Unknown",

image: isUniversityComment
  ? AdminPostsImg
  : comment.author?.image || PROFILE,
               
              },
              "created-at": comment["created-at"],
            };
          }),
        };
    
        // console.log("Formatted post:", formattedPost); 
    
        return formattedPost;
      });
    
      setPosts(prev => {
        if (pageNum === 1) return formatted;
        const existingIds = new Set(prev.map(p => p.id));
        const newOnes = formatted.filter(p => !existingIds.has(p.id));
        return [...prev, ...newOnes];
      });
    
      setHasMore(res.data.pagination?.hasMore || false);
    } catch (err) {
      console.error("Error in fetchPosts:", err);
      setError(t("errorFetchingPosts"));
    } finally {
      setLoading(false);
    }
    
  };
  

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  if (loading && posts.length === 0) return <p>{t('loadingPosts')}</p>;
  if (error && posts.length === 0) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className={`uni-feed ${darkMode ? 'dark-mode' : ''}`}>
      <div className="uni-header"><h2>{t('homeFeed')}</h2></div>

      <div className="uni-posts">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
          />
        ))}
      </div>

      {loading && posts.length > 0 && (
        <div style={{ textAlign: "center", margin: "20px" }}>
          <p>{t('loading')}...</p>
        </div>
      )}

      {hasMore && !loading && (
        <div style={{ textAlign: "center", margin: "20px" }}>
          <button className="load-more-btn" onClick={loadMore}>
            <ChevronDown size={22} />
          </button>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div style={{ textAlign: "center", margin: "20px", color: darkMode ? '#ccc' : '#666' }}>
          <p>{t('noMorePosts')}</p>
        </div>
      )}
    </div>
  );
};

export default HomeAlumni;



  // const fetchPosts = async (pageNum = 1) => {
  //   if (pageNum === 1) {
  //     setPosts([]);
  //   }
    
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const res = await API.get(`/posts/user-posts?page=${pageNum}&limit=10`);
  //     const filteredData = res.data.data.filter(post => post['group-id'] == null);

  //     const formatted = filteredData.map(post => {
  //       let avatar;
  //       let isPortal = false;

  //       if (post.author && post.author["full-name"]) {
  //         const authorName = post.author["full-name"];

  //         if (authorName.includes("Alumni Portal") || authorName.includes("Helwan University")) {
  //           avatar = AdminPostsImg;
  //           isPortal = true;
  //         } else if (post.author.image) {
  //           avatar = post.author.image;
  //         } else {
  //           avatar = PROFILE;
  //         }
  //       } else {
  //         avatar = PROFILE;
  //       }

  //       const formattedPost = {
  //         id: post.post_id || post.id,
  //         author: {
  //           name: post.author?.["full-name"] || "Unknown",
  //           photo: avatar,
  //           id: post.author?.id
  //         },
  //         date: post["created-at"],
  //         category: post.category || "",
  //         "group-id": post["group-id"] || null,
  //         content: post.content || "",
  //         images: post.images || [],
  //         likes: post.likes_count || 0,
  //         liked: false,
  //         shares: 0,
  //         comments: (post.comments || []).map(comment => ({
  //           comment_id: comment.comment_id,
  //           content: comment.content,
  //           author: {
  //             id: comment.author?.id,
  //             "full-name": comment.author?.["full-name"] || "Unknown",
  //             image: comment.author?.image || PROFILE
  //           },
  //           "created-at": comment["created-at"]
  //         }))
  //       };

  //       return formattedPost;
  //     });

  //     setPosts(prev => {
  //       if (pageNum === 1) {
  //         return formatted;
  //       } else {
  //         const existingIds = new Set(prev.map(p => p.id));
  //         const newOnes = formatted.filter(p => !existingIds.has(p.id));
  //         return [...prev, ...newOnes];
  //       }
  //     });
  //     setHasMore(res.data.pagination?.hasMore || false);
      
  //   } catch (err) {
  //     console.error("Error in fetchPosts:", err);
  //     setError(t('errorFetchingPosts'));
  //   } finally {
  //     setLoading(false);
  //   }
  // };