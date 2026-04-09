import sanitizeHtml from 'sanitize-html';
import prisma from '../config/db.js';
import { getIO } from '../config/socket.js';

const SANITIZE_OPTS = { allowedTags: [], allowedAttributes: {} };

export async function getComments(req, res, next) {
  try {
    const { id: issueId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const take = Math.min(parseInt(limit), 50);
    const skip = (parseInt(page) - 1) * take;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { issueId },
        orderBy: { createdAt: 'asc' },
        take,
        skip,
        include: {
          author: { select: { id: true, name: true, avatar: true, role: true, isOfficialVerified: true } },
        },
      }),
      prisma.comment.count({ where: { issueId } }),
    ]);

    res.json({ data: comments, meta: { total, page: parseInt(page), hasNext: parseInt(page) * take < total } });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req, res, next) {
  try {
    const { id: issueId } = req.params;
    const body = sanitizeHtml(req.body.body || '', { allowedTags: [], allowedAttributes: {} }).trim();

    if (!body || body.length < 1) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, title: true, authorId: true },
    });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const isOfficial = req.user.role === 'OFFICIAL';

    const comment = await prisma.comment.create({
      data: { body, issueId, authorId: req.user.id, isOfficial },
      include: {
        author: { select: { id: true, name: true, avatar: true, role: true, isOfficialVerified: true } },
      },
    });

    // Notify issue author if commenter is different
    if (issue.authorId !== req.user.id) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT',
          title: 'New Comment',
          body: `${req.user.name} commented on "${issue.title}"`,
          userId: issue.authorId,
          issueId,
        },
      });

      try {
        getIO().to(`user:${issue.authorId}`).emit('notification:new', {
          type: 'COMMENT',
          body: `${req.user.name} commented on your issue`,
        });
        getIO().to(`issue:${issueId}`).emit('comment:new', { comment });
      } catch {}
    }

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const { commentId } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await prisma.comment.delete({ where: { id: commentId } });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
}
