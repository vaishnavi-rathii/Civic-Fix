const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const VALID_STATUSES = ['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

function parsePhotos(photosStr) {
  try { return JSON.parse(photosStr || '[]'); } catch { return []; }
}

async function getStats(req, res) {
  try {
    const [
      totalIssues,
      totalUsers,
      byStatus,
      byCategory,
    ] = await Promise.all([
      prisma.issue.count(),
      prisma.user.count(),
      prisma.issue.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.issue.groupBy({ by: ['category'], _count: { id: true } }),
    ]);

    const statusCounts = Object.fromEntries(
      byStatus.map(s => [s.status, s._count.id])
    );
    const categoryCounts = Object.fromEntries(
      byCategory.map(c => [c.category, c._count.id])
    );

    res.json({
      totalIssues,
      totalUsers,
      byStatus: statusCounts,
      byCategory: categoryCounts,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

async function listIssues(req, res) {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      status,
      search,
      sort = 'newest',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const take = Math.min(Math.max(1, parseInt(limit)), 100);
    const skip = (pageNum - 1) * take;

    const where = {};
    if (category) where.category = category.toUpperCase();
    if (status) where.status = status.toUpperCase();
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
        { address: { contains: search.trim() } },
      ];
    }

    const orderBy =
      sort === 'popular'
        ? [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }]
        : { createdAt: 'desc' };

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        orderBy,
        take,
        skip,
        include: {
          author: { select: { id: true, name: true, email: true } },
          _count: { select: { votes: true, comments: true } },
        },
      }),
      prisma.issue.count({ where }),
    ]);

    res.json({
      data: issues.map(i => ({
        ...i,
        photos: parsePhotos(i.photos),
        voteCount: i._count.votes,
        commentCount: i._count.comments,
        _count: undefined,
      })),
      meta: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: pageNum * take < total,
      },
    });
  } catch (err) {
    console.error('Admin list issues error:', err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
}

async function updateStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const normalizedStatus = status.toUpperCase();
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const [updatedIssue, history] = await prisma.$transaction([
      prisma.issue.update({
        where: { id },
        data: { status: normalizedStatus },
        include: {
          author: { select: { id: true, name: true, email: true } },
          _count: { select: { votes: true, comments: true } },
        },
      }),
      prisma.statusHistory.create({
        data: {
          issueId: id,
          status: normalizedStatus,
          note: note?.trim() || `Status updated to ${normalizedStatus.toLowerCase().replace('_', ' ')}`,
          changedBy: req.user.id,
        },
      }),
    ]);

    res.json({
      issue: {
        ...updatedIssue,
        photos: parsePhotos(updatedIssue.photos),
        voteCount: updatedIssue._count.votes,
        commentCount: updatedIssue._count.comments,
        _count: undefined,
      },
      historyEntry: history,
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
}

module.exports = { getStats, listIssues, updateStatus };
