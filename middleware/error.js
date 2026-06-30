/* eslint-disable no-unused-vars */

/** Catches unmatched routes and forwards a 404 down the chain. */
const notFound = (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }
  res.status(404).render('errors/404', { title: 'Page not found' });
};

/** Final error handler: normalizes Mongoose/JWT errors into clean responses. */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on our end';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier supplied';
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with that value already exists';
  }

  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  if (req.originalUrl.startsWith('/api')) {
    return res.status(statusCode).json({ success: false, message });
  }

  res.status(statusCode).render('errors/500', {
    title: 'Something went wrong',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong on our end' : message
  });
};

module.exports = { notFound, errorHandler };
