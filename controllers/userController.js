const User = require('../models/User');

const renderProfile = (req, res) => {
  res.render('profile', { title: 'Your profile', errors: [], success: req.query.updated === '1' });
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, bio } = req.body;
    await User.findByIdAndUpdate(req.user._id, { name, bio }, { runValidators: true });
    res.redirect('/profile?updated=1');
  } catch (err) {
    next(err);
  }
};

/** Admin-only: list every registered user with their role. */
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render('admin/users', { title: 'Manage users', users });
  } catch (err) {
    next(err);
  }
};

/** Admin-only: promote/demote a user between "user" and "admin". */
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(422).render('errors/403', { title: 'Invalid role' });
    }
    await User.findByIdAndUpdate(req.params.id, { role });
    res.redirect('/admin/users');
  } catch (err) {
    next(err);
  }
};

module.exports = { renderProfile, updateProfile, listUsers, changeUserRole };
