const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Reads the JWT from the cookie, verifies it, and attaches the user to req.
 * Makes the current user available to every view via res.locals.currentUser.
 */
const attachUser = async (req, res, next) => {
  const token = req.cookies[process.env.COOKIE_NAME || 'inkwell_token'];
  res.locals.currentUser = null;

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
      res.locals.currentUser = user;
    }
  } catch (err) {
    // Invalid or expired token: treat the request as unauthenticated
    res.clearCookie(process.env.COOKIE_NAME || 'inkwell_token');
  }

  next();
};

/** Blocks unauthenticated requests; redirects browser requests to login. */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
};

/** Restricts access to one or more roles, e.g. requireRole('admin'). */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    return res.status(403).render('errors/403', { title: 'Access denied' });
  }
  next();
};

/** Allows only the post's author or an admin to proceed. */
const requireOwnerOrAdmin = (getOwnerId) => async (req, res, next) => {
  try {
    const ownerId = await getOwnerId(req);
    if (!ownerId) return res.status(404).render('errors/404', { title: 'Not found' });

    const isOwner = req.user && ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).render('errors/403', { title: 'Access denied' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { attachUser, requireAuth, requireRole, requireOwnerOrAdmin };
