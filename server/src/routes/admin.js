const { Router } = require('express');
const { body } = require('express-validator');
const { getStats, listIssues, updateStatus } = require('../controllers/admin');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(verifyToken, requireAdmin);

router.get('/stats', getStats);

router.get('/issues', listIssues);

router.patch(
  '/issues/:id/status',
  [
    body('status').notEmpty().withMessage('Status is required'),
    body('note').optional().isString().isLength({ max: 500 }),
  ],
  updateStatus
);

module.exports = router;
