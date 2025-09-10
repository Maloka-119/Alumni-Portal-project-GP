const HttpStatusHelper = require('../utils/HttpStatuHelper');
const Post = require('../models/Post');
const PostImage = require('../models/PostImage');
const Comment = require('../models/Comment');
const Like = require('../models/Like');

const createPost = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { category, content, description, groupId, inLanding, images } = req.body;

    const post = await Post.create({
      category,
      content,
      description,
      'author-id': userId,
      'group-id': groupId || null,
      'in-landing': inLanding || false
    });

    if (images && images.length > 0) {
      const postImages = images.map(url => ({ 'post-id': post.post_id, 'image-url': url }));
      await PostImage.bulkCreate(postImages);
    }

    return res.status(201).json({ status: 'success', data: post });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports={
  createPost
}