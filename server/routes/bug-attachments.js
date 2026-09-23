const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router({ mergeParams: true });

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 10MB keeps a bug's evidence (a screenshot, a short log, a few seconds of
// screen capture) well within reach while stopping a large video from making
// the form slow to submit or the server slow to store/serve.
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_BUG = 5;

const EXTENSIONS_BY_KIND = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  video: ['.mp4', '.mov', '.webm'],
  text: ['.txt', '.log'],
};
const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.txt': 'text/plain',
  '.log': 'text/plain',
};
const ALL_EXTENSIONS = Object.values(EXTENSIONS_BY_KIND).flat();

function kindForExt(ext) {
  return Object.entries(EXTENSIONS_BY_KIND).find(([, exts]) => exts.includes(ext))?.[0] || null;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALL_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Unsupported file type "${ext || '(none)'}". Allowed: ${ALL_EXTENSIONS.join(', ')}`));
    }
    cb(null, true);
  },
});

function serialize(row) {
  return {
    id: row.id,
    bugId: row.bug_id,
    filename: row.filename,
    mimeType: row.mime_type,
    size: row.size,
    kind: row.kind,
    createdAt: row.created_at,
  };
}

function getAttachments(bugId) {
  return db
    .prepare('SELECT * FROM bug_attachments WHERE bug_id = ? ORDER BY created_at ASC, id ASC')
    .all(bugId)
    .map(serialize);
}

function handleUpload(req, res) {
  const bug = db.prepare('SELECT id FROM bugs WHERE id = ?').get(req.params.bugId);
  if (!bug) return res.status(404).json({ success: false, data: null, error: 'Bug not found' });

  if (!req.file) {
    return res.status(400).json({ success: false, data: null, error: 'No file uploaded (expected field "file")' });
  }

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM bug_attachments WHERE bug_id = ?').get(req.params.bugId);
  if (count >= MAX_ATTACHMENTS_PER_BUG) {
    fs.unlink(req.file.path, () => {});
    return res
      .status(400)
      .json({ success: false, data: null, error: `A bug can have at most ${MAX_ATTACHMENTS_PER_BUG} attachments` });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const kind = kindForExt(ext);
  const mimeType = MIME_BY_EXT[ext] || req.file.mimetype || 'application/octet-stream';
  const now = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO bug_attachments (bug_id, filename, stored_name, mime_type, size, kind, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.params.bugId, req.file.originalname, req.file.filename, mimeType, req.file.size, kind, now);

  const row = db.prepare('SELECT * FROM bug_attachments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: serialize(row), error: null });
}

function handleDownload(req, res) {
  const row = db
    .prepare('SELECT * FROM bug_attachments WHERE id = ? AND bug_id = ?')
    .get(req.params.attachmentId, req.params.bugId);
  if (!row) return res.status(404).json({ success: false, data: null, error: 'Attachment not found' });

  res.setHeader('Content-Type', row.mime_type);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.filename)}"`);
  res.sendFile(path.join(UPLOAD_DIR, row.stored_name));
}

function handleDelete(req, res) {
  const row = db
    .prepare('SELECT * FROM bug_attachments WHERE id = ? AND bug_id = ?')
    .get(req.params.attachmentId, req.params.bugId);
  if (!row) return res.status(404).json({ success: false, data: null, error: 'Attachment not found' });

  db.prepare('DELETE FROM bug_attachments WHERE id = ?').run(row.id);
  fs.unlink(path.join(UPLOAD_DIR, row.stored_name), () => {});

  res.json({ success: true, data: { id: row.id }, error: null });
}

function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res
      .status(400)
      .json({ success: false, data: null, error: `File exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` });
  }
  if (err) {
    return res.status(400).json({ success: false, data: null, error: err.message });
  }
  next();
}

router.post('/', upload.single('file'), handleUploadError, handleUpload);
router.get('/:attachmentId', handleDownload);
router.delete('/:attachmentId', handleDelete);

module.exports = router;
module.exports.getAttachments = getAttachments;
