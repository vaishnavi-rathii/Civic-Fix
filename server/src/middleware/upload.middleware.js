import multer from 'multer';
import { issueStorage } from '../config/cloudinary.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only image files (JPG, PNG, WebP, GIF) are allowed'), false);
  }
  // Sanitize filename
  file.originalname = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  cb(null, true);
};

export const uploadIssuePhotos = multer({
  storage: issueStorage,
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
  fileFilter,
});

// In-memory upload for cases where Cloudinary is not configured
export const uploadLocal = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
  fileFilter,
});

export function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 5 photos.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err?.message?.includes('Only image')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
}
