const express = require('express');
const router = express.Router();

const apiController = require('../controllers/apiController');
const { requireAuth, requireOwnerOrAdmin } = require('../middleware/auth');
const { postRules, handleValidation } = require('../middleware/validate');
const Post = require('../models/Post');

const getPostOwnerId = async (req) => {
  const post = await Post.findById(req.params.id).select('author');
  return post ? post.author : null;
};

router.get('/posts', apiController.apiListPosts);
router.get('/posts/:slug', apiController.apiGetPost);

router.post('/posts', requireAuth, postRules, handleValidation(), apiController.apiCreatePost);
router.put('/posts/:id', requireAuth, requireOwnerOrAdmin(getPostOwnerId), apiController.apiUpdatePost);
router.delete('/posts/:id', requireAuth, requireOwnerOrAdmin(getPostOwnerId), apiController.apiDeletePost);

module.exports = router;
