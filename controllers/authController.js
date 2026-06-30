const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = process.env.COOKIE_NAME || 'inkwell_token';

/** Signs a JWT for a given user id. */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/** Sends the JWT as a secure, httpOnly cookie so it can't be read by client JS. */
const sendTokenCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const renderRegister = (req, res) => {
  res.render('auth/register', { title: 'Create an account', errors: [], old: {} });
};

const renderLogin = (req, res) => {
  res.render('auth/login', { title: 'Welcome back', errors: [], old: {} });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).render('auth/register', {
        title: 'Create an account',
        errors: ['An account with that email already exists'],
        old: req.body
      });
    }

    // First registered user becomes admin automatically; everyone else is a regular user
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const user = await User.create({ name, email, password, role });
    const token = signToken(user._id);
    sendTokenCookie(res, token);

    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    const invalidCredentials = !user || !(await user.comparePassword(password));
    if (invalidCredentials) {
      return res.status(401).render('auth/login', {
        title: 'Welcome back',
        errors: ['Incorrect email or password'],
        old: { email }
      });
    }

    const token = signToken(user._id);
    sendTokenCookie(res, token);

    const redirectTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect('/');
};

module.exports = { renderRegister, renderLogin, register, login, logout };
