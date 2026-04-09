import { validationResult } from 'express-validator';
import sanitizeHtml from 'sanitize-html';
import prisma from '../config/db.js';
import { classifyIssue } from '../services/ai.service.js';
import { findDuplicates } from '../services/duplicate.service.js';
import { getIO } from '../config/socket.js';

const SANITIZE_OPTS = { allowedTags: [], allowedAttributes: {} };

function sanitize(str) {
  return sanitizeHtml(str || '', SANITIZE_OPTS).trim();
}

// Map DB status to client-friendly lowercase
export function formatIssue(issue, userId = null) {
  const voteCount = issue._count?.votes ?? issue.votes?.length ?? 0;
  const commentCount = issue._count?.comments ?? issue.comments?.length ?? 0;
  const userVoted = userId ? (issue.votes?.some(v => v.userId === userId) ?? false) : false;

  return {
    ...issue,
    votes: undefined,
    _count: undefined,
    voteCount,
    commentCount,
    userVoted,
    photos: issue.photos || [],
  };
}

export async function listIssues(req, res, next) {
  try {
    const {
      page = '1', limit = '20', category, status,
      city, ward, sort = 'newest', search, lat, lng, radius,
      cursor,
    } = req.query;

    const take = Math.min(parseInt(limit), 50);
    const skip = cursor ? undefined : (parseInt(page) - 1) * take;

    const where = {};
    if (category) where.category = category.toUpperCase();
    if (status) where.status = status.toUpperCase();
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (ward) where.ward = { contains: ward, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy;
    if (sort === 'popular') orderBy = [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }];
    else orderBy = { createdAt: 'desc' };

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        orderBy,
        take,
        skip,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          _count: { select: { votes: true, comments: true } },
          ...(req.user ? { votes: { where: { userId: req.user.id }, select: { userId: true } } } : {}),
        },
      }),
      prisma.issue.count({ where }),
    ]);

    // Filter by radius if lat/lng/radius provided (post-query Haversine)
    let filtered = issues;
    if (lat && lng && radius) {
      const R = 6371000;
      const toRad = d => (d * Math.PI) / 180;
      const refLat = parseFloat(lat);
      const refLng = parseFloat(lng);
      const maxDist = parseFloat(radius);
      filtered = issues.filter(issue => {
        const dLat = toRad(issue.latitude - refLat);
        const dLng = toRad(issue.longitude - refLng);
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(refLat)) * Math.cos(toRad(issue.latitude)) * Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist <= maxDist;
      });
    }

    res.json({
      data: filtered.map(i => formatIssue(i, req.user?.id)),
      meta: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: parseInt(page) * take < total,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getIssue(req, res, next) {
  try {
    const { id } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true, role: true } },
        _count: { select: { votes: true, comments: true } },
        ...(req.user ? { votes: { where: { userId: req.user.id }, select: { userId: true } } } : {}),
        timeline: { orderBy: { createdAt: 'asc' } },
        officialUpdates: {
          include: { official: { select: { id: true, name: true, avatar: true, isOfficialVerified: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Increment view count
    await prisma.issue.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    res.json({ issue: formatIssue(issue, req.user?.id) });
  } catch (err) {
    next(err);
  }
}

export async function createIssue(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { title, description, latitude, longitude, address, ward, city, pincode } = req.body;
    const category = req.body.category?.toUpperCase();

    const cleanTitle = sanitize(title);
    const cleanDesc = sanitize(description);
    const cleanAddress = sanitize(address);

    // Collect uploaded photo URLs
    const photos = req.files?.map(f => f.path || f.secure_url) || [];

    // AI classify (non-blocking, with timeout)
    let aiCategory = null;
    let aiSummary = null;
    try {
      const aiResult = await Promise.race([
        classifyIssue(cleanTitle, cleanDesc),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
      aiCategory = aiResult.category;
      aiSummary = aiResult.summary;
    } catch {}

    const issue = await prisma.issue.create({
      data: {
        title: cleanTitle,
        description: cleanDesc,
        category,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: cleanAddress,
        ward: ward || null,
        city: city || 'Delhi',
        pincode: pincode || null,
        photos,
        aiCategory,
        aiSummary,
        authorId: req.user.id,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { votes: true, comments: true } },
      },
    });

    // Create initial status history
    await prisma.statusHistory.create({
      data: {
        issueId: issue.id,
        status: 'OPEN',
        note: 'Issue reported by citizen',
        changedBy: req.user.id,
      },
    });

    // Check duplicates async
    findDuplicates(issue.latitude, issue.longitude, issue.category, issue.title, issue.id)
      .then(async (dups) => {
        if (dups.length > 0) {
          await prisma.issue.update({
            where: { id: issue.id },
            data: { isDuplicate: true, duplicateOf: dups[0].id },
          });
        }
      })
      .catch(() => {});

    // Emit to admin room
    try {
      getIO().to('admin').emit('issue:new', { issue: formatIssue(issue) });
    } catch {}

    res.status(201).json({ issue: formatIssue(issue) });
  } catch (err) {
    next(err);
  }
}

export async function updateIssue(req, res, next) {
  try {
    const { id } = req.params;
    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    if (issue.authorId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    if (issue.status !== 'OPEN') return res.status(400).json({ error: 'Can only edit open issues' });

    const { title, description } = req.body;
    const updated = await prisma.issue.update({
      where: { id },
      data: {
        title: title ? sanitize(title) : undefined,
        description: description ? sanitize(description) : undefined,
      },
    });
    res.json({ issue: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteIssue(req, res, next) {
  try {
    const { id } = req.params;
    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    if (issue.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await prisma.issue.delete({ where: { id } });
    res.json({ message: 'Issue deleted' });
  } catch (err) {
    next(err);
  }
}

export async function toggleVote(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.vote.findUnique({
      where: { issueId_userId: { issueId: id, userId } },
    });

    if (existing) {
      await prisma.vote.delete({ where: { issueId_userId: { issueId: id, userId } } });
    } else {
      await prisma.vote.create({ data: { issueId: id, userId } });
    }

    const voteCount = await prisma.vote.count({ where: { issueId: id } });
    res.json({ voteCount, userVoted: !existing });
  } catch (err) {
    next(err);
  }
}

export async function getTimeline(req, res, next) {
  try {
    const { id } = req.params;
    const timeline = await prisma.statusHistory.findMany({
      where: { issueId: id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ timeline });
  } catch (err) {
    next(err);
  }
}

export async function getMapPins(req, res, next) {
  try {
    const { minLat, maxLat, minLng, maxLng, category, status } = req.query;
    const where = {};
    if (minLat) where.latitude = { gte: parseFloat(minLat), lte: parseFloat(maxLat) };
    if (minLng) where.longitude = { gte: parseFloat(minLng), lte: parseFloat(maxLng) };
    if (category) where.category = category.toUpperCase();
    if (status) where.status = status.toUpperCase();

    const pins = await prisma.issue.findMany({
      where,
      select: { id: true, latitude: true, longitude: true, category: true, status: true, title: true },
      take: 500,
    });
    res.json({ pins });
  } catch (err) {
    next(err);
  }
}
