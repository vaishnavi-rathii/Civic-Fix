require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const issuesRoutes = require('./routes/issues');
const adminRoutes = require('./routes/admin');

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

// Global error handler
app.use((err, req, res, next) => {
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum 10MB per file.' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Too many files. Maximum 5 photos.' });
  }
  if (err.message?.includes('Only image')) {
    return res.status(400).json({ error: err.message });
  }

  console.error('[Error]', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CivicFix API running on http://localhost:${PORT}`);
  console.log(`  Health:  GET  /api/health`);
  console.log(`  Auth:    POST /api/auth/register | /api/auth/login | GET /api/auth/me`);
  console.log(`  Issues:  GET  /api/issues | GET /api/issues/:id`);
  console.log(`  Admin:   GET  /api/admin/stats (requires ADMIN role)`);
});

module.exports = app;
