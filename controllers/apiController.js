const Post = require('../models/Post');

const PAGE_SIZE = 10;

/** GET /api/posts — list published posts with pagination, category and search filters. */
const apiListPosts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const filter = { status: 'published' };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.q) filter.$text = { $search: req.query.q };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name avatar')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE),
      Post.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: posts,
      meta: { page, pageSize: PAGE_SIZE, total, totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1) }
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/posts/:slug — fetch a single published post (or owned/admin draft) by slug. */
const apiGetPost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate('author', 'name avatar');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isOwnerOrAdmin =
      req.user && (req.user.role === 'admin' || req.user._id.equals(post.author._id));

    if (post.status !== 'published' && !isOwnerOrAdmin) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.status(200).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/** POST /api/posts — create a post via the API (authenticated). */
const apiCreatePost = async (req, res, next) => {
  try {
    const { title, excerpt, content, category, status, coverImage, tags } = req.body;

    const post = await Post.create({
      title,
      excerpt,
      content,
      category,
      status,
      coverImage,
      tags,
      author: req.user._id
    });

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/posts/:id — update a post via the API (owner or admin only). */
const apiUpdatePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/posts/:id — remove a post via the API (owner or admin only). */
const apiDeletePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

module.exports = { apiListPosts, apiGetPost, apiCreatePost, apiUpdatePost, apiDeletePost };
