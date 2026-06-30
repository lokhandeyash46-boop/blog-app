const express = require('express');
const router = express.Router();

const postController = require('../controllers/postController');
const userController = require('../controllers/userController');
const { requireAuth, requireOwnerOrAdmin, requireRole } = require('../middleware/auth');
const { postRules, handleValidation } = require('../middleware/validate');

// Public
router.get('/', postController.listPublished);

// Authenticated dashboard & profile (declared before "/:slug" so they don't get swallowed)
router.get('/dashboard', requireAuth, postController.dashboard);
router.get('/profile', requireAuth, userController.renderProfile);
router.put('/profile', requireAuth, userController.updateProfile);

// Post creation
router.get('/posts/new', requireAuth, postController.renderCreateForm);
router.post('/posts', requireAuth, postRules, handleValidation('post-form'), postController.createPost);

// Post editing / deletion — owner or admin only
router.get(
  '/posts/:id/edit',
  requireAuth,
  requireOwnerOrAdmin(postController.getPostOwnerId),
  postController.renderEditForm
);
router.put(
  '/posts/:id',
  requireAuth,
  requireOwnerOrAdmin(postController.getPostOwnerId),
  postRules,
  handleValidation('post-form'),
  postController.updatePost
);
router.delete(
  '/posts/:id',
  requireAuth,
  requireOwnerOrAdmin(postController.getPostOwnerId),
  postController.deletePost
);

// Admin-only user management
router.get('/admin/users', requireAuth, requireRole('admin'), userController.listUsers);
router.put('/admin/users/:id/role', requireAuth, requireRole('admin'), userController.changeUserRole);

// Public single-post view by SEO-friendly slug — kept last so it doesn't shadow routes above
router.get('/:slug', postController.showBySlug);

module.exports = router;
