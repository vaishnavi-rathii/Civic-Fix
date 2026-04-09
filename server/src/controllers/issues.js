const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

const VALID_CATEGORIES = ['POTHOLE', 'GARBAGE', 'STREETLIGHT', 'WATER_SUPPLY', 'DRAINAGE', 'ROAD_DAMAGE', 'PARK', 'OTHER'];
const VALID_STATUSES = ['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

// Parse photos JSON string safely
function parsePhotos(photosStr) {
  try {
    return JSON.parse(photosStr || '[]');
  } catch {
    return [];
  }
}

// Format issue for API response
function formatIssue(issue, userId = null) {
  return {
    ...issue,
    photos: parsePhotos(issue.photos),
    voteCount: issue._count?.votes ?? 0,
    commentCount: issue._count?.comments ?? 0,
    userVoted: userId
      ? (issue.votes?.some(v => v.userId === userId) ?? false)
      : false,
    votes: undefined,
    _count: undefined,
  };
}

async function listIssues(req, res) {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      status,
      sort = 'newest',
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const take = Math.min(Math.max(1, parseInt(limit)), 50);
    const skip = (pageNum - 1) * take;

    const where = {};

    if (category && VALID_CATEGORIES.includes(category.toUpperCase())) {
      where.category = category.toUpperCase();
    }
    if (status && VALID_STATUSES.includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }
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
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
          ...(req.user ? { votes: { where: { userId: req.user.id }, select: { userId: true } } } : {}),
        },
      }),
      prisma.issue.count({ where }),
    ]);

    res.json({
      data: issues.map(i => formatIssue(i, req.user?.id)),
      meta: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: pageNum * take < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (err) {
    console.error('List issues error:', err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
}

async function getIssue(req, res) {
  try {
    const { id } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { votes: true, comments: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
        ...(req.user ? { votes: { where: { userId: req.user.id }, select: { userId: true } } } : {}),
      },
    });

    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    res.json({ issue: formatIssue(issue, req.user?.id) });
  } catch (err) {
    console.error('Get issue error:', err);
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
}

async function createIssue(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { title, description, category, latitude, longitude, address } = req.body;

    const normalizedCategory = category?.toUpperCase();
    if (!VALID_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    // Collect uploaded file paths (relative, served as static)
    const photos = (req.files || []).map(f => `/uploads/${path.basename(f.filename || f.path)}`);

    const issue = await prisma.issue.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: normalizedCategory,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address.trim(),
        photos: JSON.stringify(photos),
        authorId: req.user.id,
      },
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { votes: true, comments: true } },
      },
    });

    // Create initial status history entry
    await prisma.statusHistory.create({
      data: {
        issueId: issue.id,
        status: 'OPEN',
        note: 'Issue reported by citizen',
        changedBy: req.user.id,
      },
    });

    res.status(201).json({ issue: formatIssue(issue) });
  } catch (err) {
    console.error('Create issue error:', err);
    res.status(500).json({ error: 'Failed to create issue' });
  }
}

async function toggleVote(req, res) {
  try {
    const { id: issueId } = req.params;
    const userId = req.user.id;

    const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { id: true } });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const existing = await prisma.vote.findUnique({
      where: { issueId_userId: { issueId, userId } },
    });

    if (existing) {
      await prisma.vote.delete({ where: { issueId_userId: { issueId, userId } } });
    } else {
      await prisma.vote.create({ data: { issueId, userId } });
    }

    const voteCount = await prisma.vote.count({ where: { issueId } });
    res.json({ voteCount, userVoted: !existing });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Failed to toggle vote' });
  }
}

async function getComments(req, res) {
  try {
    const { id: issueId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const take = Math.min(Math.max(1, parseInt(limit)), 50);
    const skip = (pageNum - 1) * take;

    const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { id: true } });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { issueId },
        orderBy: { createdAt: 'asc' },
        take,
        skip,
        include: {
          author: { select: { id: true, name: true } },
        },
      }),
      prisma.comment.count({ where: { issueId } }),
    ]);

    res.json({
      data: comments,
      meta: { total, page: pageNum, hasNext: pageNum * take < total },
    });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
}

async function addComment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { id: issueId } = req.params;
    const { body } = req.body;

    const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { id: true } });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    const comment = await prisma.comment.create({
      data: { body: body.trim(), issueId, authorId: req.user.id },
      include: { author: { select: { id: true, name: true } } },
    });

    res.status(201).json({ comment });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

module.exports = { listIssues, getIssue, createIssue, toggleVote, getComments, addComment };
