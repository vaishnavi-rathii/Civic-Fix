const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/auth');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/me', verifyToken, getMe);

module.exports = router;
