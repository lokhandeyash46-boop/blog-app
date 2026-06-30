const Post = require('../models/Post');
const User = require('../models/User');

const PAGE_SIZE = 6;

/** Public home page: paginated, published posts only. */
const listPublished = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const category = req.query.category;
    const search = req.query.q;

    const filter = { status: 'published' };
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const [posts, total, categories] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name avatar')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE),
      Post.countDocuments(filter),
      Post.distinct('category', { status: 'published' })
    ]);

    res.render('index', {
      title: 'Inkwell — A blog worth reading',
      posts,
      categories,
      currentCategory: category || '',
      search: search || '',
      page,
      totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1)
    });
  } catch (err) {
    next(err);
  }
};

/** Public single-post view, resolved by SEO-friendly slug. */
const showBySlug = async (req, res, next) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate('author', 'name bio avatar');

    if (!post) return res.status(404).render('errors/404', { title: 'Post not found' });

    const isOwnerOrAdmin =
      req.user && (req.user.role === 'admin' || req.user._id.equals(post.author._id));

    if (post.status !== 'published' && !isOwnerOrAdmin) {
      return res.status(404).render('errors/404', { title: 'Post not found' });
    }

    if (post.status === 'published') {
      post.views += 1;
      await post.save({ validateBeforeSave: false });
    }

    const related = await Post.find({
      category: post.category,
      status: 'published',
      _id: { $ne: post._id }
    })
      .limit(3)
      .select('title slug excerpt coverImage');

    res.render('post', { title: post.title, post, related });
  } catch (err) {
    next(err);
  }
};

/** Authenticated dashboard: own posts for users, all posts for admins. */
const dashboard = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { author: req.user._id };
    const posts = await Post.find(filter)
      .populate('author', 'name')
      .sort({ updatedAt: -1 });

    res.render('dashboard', { title: 'Dashboard', posts });
  } catch (err) {
    next(err);
  }
};

const renderCreateForm = (req, res) => {
  res.render('post-form', { title: 'New post', post: {}, errors: [], formAction: '/posts' });
};

const renderEditForm = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).render('errors/404', { title: 'Post not found' });

    res.render('post-form', {
      title: 'Edit post',
      post,
      errors: [],
      formAction: `/posts/${post._id}?_method=PUT`
    });
  } catch (err) {
    next(err);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { title, excerpt, content, category, status, coverImage, tags } = req.body;

    const post = await Post.create({
      title,
      excerpt,
      content,
      category: category || 'General',
      status: status === 'published' ? 'published' : 'draft',
      coverImage: coverImage || '',
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      author: req.user._id
    });

    res.redirect(`/dashboard?created=${post._id}`);
  } catch (err) {
    next(err);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).render('errors/404', { title: 'Post not found' });

    const { title, excerpt, content, category, status, coverImage, tags } = req.body;

    post.title = title;
    post.excerpt = excerpt;
    post.content = content;
    post.category = category || 'General';
    post.status = status === 'published' ? 'published' : 'draft';
    post.coverImage = coverImage || '';
    post.tags = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

    await post.save();
    res.redirect('/dashboard?updated=1');
  } catch (err) {
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard?deleted=1');
  } catch (err) {
    next(err);
  }
};

/** Resolves the owning author id for a post; used by the requireOwnerOrAdmin middleware. */
const getPostOwnerId = async (req) => {
  const post = await Post.findById(req.params.id).select('author');
  return post ? post.author : null;
};

module.exports = {
  listPublished,
  showBySlug,
  dashboard,
  renderCreateForm,
  renderEditForm,
  createPost,
  updatePost,
  deletePost,
  getPostOwnerId
};
