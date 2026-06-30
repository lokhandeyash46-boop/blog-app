const { body, validationResult } = require('express-validator');

/** Collects validation errors and either renders or returns JSON, depending on route type. */
const handleValidation = (viewOnError) => (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const errorMessages = errors.array().map((e) => e.msg);

  if (req.originalUrl.startsWith('/api')) {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: errorMessages });
  }

  if (viewOnError) {
    return res.status(422).render(viewOnError, {
      title: 'Please check your input',
      errors: errorMessages,
      old: req.body
    });
  }

  return res.status(422).send(errorMessages.join(', '));
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  })
];

const loginRules = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const postRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 140 }),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('excerpt').trim().isLength({ max: 280 }).withMessage('Excerpt cannot exceed 280 characters'),
  body('category').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body('status').optional().isIn(['draft', 'published']).withMessage('Invalid status')
];

module.exports = { handleValidation, registerRules, loginRules, postRules };
