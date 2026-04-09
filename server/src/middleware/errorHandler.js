import { Prisma } from '@prisma/client';

export function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message, err.stack?.split('\n')[1]);

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'field';
      return res.status(409).json({ error: `${field} already exists` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Resource not found' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Related resource not found' });
    }
    return res.status(400).json({ error: 'Database error', code: err.code });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: 'Invalid data provided' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
  }

  // Default
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(status).json({ error: message });
}
