const { body, validationResult } = require('express-validator');

// Error checker middleware
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

exports.signupValidator = [
  body('email').isEmail().withMessage('Provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  validateResult
];

exports.loginValidator = [
  body('email').isEmail().withMessage('Provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  validateResult
];

exports.noteValidator = [
  body('title').trim().notEmpty().withMessage('Note title is required'),
  body('content').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
  validateResult
];
