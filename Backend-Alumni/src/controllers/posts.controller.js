const HttpStatusHelper = require('../utils/HttpStatuHelper');
const Post = require('../models/Post');
const PostImage = require('../models/PostImage');
const Comment = require('../models/Comment');
const Like = require('../models/Like');

const createPost = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { category, content, description, groupId, inLanding } = req.body;

    const post = await Post.create({
      category,
      content,
      description,
      'author-id': userId,
      'group-id': groupId || null,
      'in-landing': inLanding || false
    });

    if (req.files && req.files.length > 0) {
      const postImages = req.files.map(file => ({
        'post-id': post.post_id,
        'image-url': file.location   // URL اللي جاي من S3
      }));
      await PostImage.bulkCreate(postImages);
    }

    return res.status(201).json({ status: HttpStatusHelper.SUCCESS, data: post });
  } catch (err) {
    return res.status(500).json({ status: HttpStatusHelper.ERROR, message: err.message });
  }
};


module.exports={
  createPost
}