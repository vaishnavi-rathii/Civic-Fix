const { Router } = require('express');
const { body } = require('express-validator');
const {
  listIssues,
  getIssue,
  createIssue,
  toggleVote,
  getComments,
  addComment,
} = require('../controllers/issues');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = Router();

// Public routes (auth optional for userVoted field)
router.get('/', (req, res, next) => {
  // Optionally parse token without blocking if missing
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      prisma.user.findUnique({ where: { id: decoded.sub }, select: { id: true, role: true } })
        .then(user => { req.user = user; next(); })
        .catch(() => next());
    } catch {
      next();
    }
  } else {
    next();
  }
}, listIssues);

router.get('/:id', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      prisma.user.findUnique({ where: { id: decoded.sub }, select: { id: true, role: true } })
        .then(user => { req.user = user; next(); })
        .catch(() => next());
    } catch {
      next();
    }
  } else {
    next();
  }
}, getIssue);

router.get('/:id/comments', getComments);

// Protected routes
router.post(
  '/',
  verifyToken,
  upload.array('photos', 5),
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 5, max: 120 }).withMessage('Title must be 5–120 characters'),
    body('description').trim().notEmpty().withMessage('Description is required').isLength({ min: 10, max: 2000 }).withMessage('Description must be 10–2000 characters'),
    body('category').notEmpty().withMessage('Category is required'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 300 }),
  ],
  createIssue
);

router.post('/:id/vote', verifyToken, toggleVote);

router.post(
  '/:id/comments',
  verifyToken,
  [body('body').trim().notEmpty().withMessage('Comment body is required').isLength({ max: 1000 })],
  addComment
);

module.exports = router;
