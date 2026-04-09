import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/db.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from './email.service.js';

function generateAccessToken(userId, role) {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

function generateRefreshToken() {
  return uuidv4();
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export async function register({ name, email, password, city, phone }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const refreshToken = generateRefreshToken();
  const hashedRefresh = await bcrypt.hash(refreshToken, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      city: city || 'Delhi',
      phone: phone || null,
      avatar: getInitials(name),
      refreshToken: hashedRefresh,
    },
    select: { id: true, name: true, email: true, role: true, avatar: true, city: true, createdAt: true },
  });

  const accessToken = generateAccessToken(user.id, user.role);

  // Send welcome email async (don't block response)
  sendWelcomeEmail(user).catch(e => console.error('Welcome email failed:', e.message));

  return { user, accessToken, refreshToken };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const refreshToken = generateRefreshToken();
  const hashedRefresh = await bcrypt.hash(refreshToken, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefresh },
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const { passwordHash, refreshToken: _, ...safeUser } = user;

  return { user: safeUser, accessToken, refreshToken };
}

export async function refreshTokens(refreshToken) {
  if (!refreshToken) {
    const err = new Error('Refresh token required');
    err.status = 401;
    throw err;
  }

  // Find users with a refresh token (we need to check all since token is hashed)
  // More efficient: decode a JWT-based refresh token — but we use UUID here
  // So we search by checking the cookie against stored hashes
  // In production you'd store a token ID; for this app we use a simple approach
  const users = await prisma.user.findMany({
    where: { refreshToken: { not: null } },
    select: { id: true, role: true, refreshToken: true },
  });

  let matchedUser = null;
  for (const u of users) {
    if (u.refreshToken && await bcrypt.compare(refreshToken, u.refreshToken)) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser) {
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    throw err;
  }

  // Rotate: generate new pair
  const newRefreshToken = generateRefreshToken();
  const hashedRefresh = await bcrypt.hash(newRefreshToken, 10);

  await prisma.user.update({
    where: { id: matchedUser.id },
    data: { refreshToken: hashedRefresh },
  });

  const accessToken = generateAccessToken(matchedUser.id, matchedUser.role);
  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, avatar: true,
      city: true, ward: true, phone: true, isVerified: true, isOfficialVerified: true,
      createdAt: true,
      _count: { select: { issues: true, votes: true } },
    },
  });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
}

export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Don't reveal if email exists

  // Generate a simple reset token (in production, store this in a separate table with expiry)
  const resetToken = uuidv4();
  const hashedToken = await bcrypt.hash(resetToken, 10);

  await prisma.user.update({
    where: { id: user.id },
    // Store in refreshToken field temporarily (in prod, use a separate PasswordResetToken table)
    data: { refreshToken: `reset:${hashedToken}` },
  });

  sendPasswordResetEmail(user, resetToken).catch(e => console.error('Reset email failed:', e.message));
}

export async function resetPassword(token, newPassword) {
  const users = await prisma.user.findMany({
    where: { refreshToken: { startsWith: 'reset:' } },
    select: { id: true, refreshToken: true },
  });

  let matchedUser = null;
  for (const u of users) {
    const hash = u.refreshToken.replace('reset:', '');
    if (await bcrypt.compare(token, hash)) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser) {
    const err = new Error('Invalid or expired reset token');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: matchedUser.id },
    data: { passwordHash, refreshToken: null },
  });
}
