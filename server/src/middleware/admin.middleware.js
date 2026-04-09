export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'ADMIN' && req.user.role !== 'OFFICIAL') {
    return res.status(403).json({ error: 'Admin or Official role required' });
  }
  next();
}

export function requireSuperAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin role required' });
  }
  next();
}
