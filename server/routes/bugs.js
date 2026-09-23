const express = require('express');
const db = require('../db');
const { getAttachments } = require('./bug-attachments');

const router = express.Router();

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['open', 'in-progress', 'resolved', 'closed', 'reopened'];
const SEVERITY_RANK = { Critical: 0, Major: 1, Minor: 2, Trivial: 3 };
const PRIORITY_RANK = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

const TRANSITIONS = {
  open: ['in-progress', 'closed'],
  'in-progress': ['resolved', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in-progress', 'closed'],
};

function serializeBug(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    priority: row.priority,
    status: row.status,
    steps: JSON.parse(row.steps),
    expected: row.expected,
    actual: row.actual,
    environment: row.environment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeActivity(row) {
  return {
    id: row.id,
    action: row.action,
    oldValue: row.old_value,
    newValue: row.new_value,
    message: row.message,
    createdAt: row.created_at,
  };
}

function getActivity(bugId) {
  return db
    .prepare('SELECT * FROM bug_activity WHERE bug_id = ? ORDER BY created_at DESC, id DESC')
    .all(bugId)
    .map(serializeActivity);
}

function validate(body, { partial = false } = {}) {
  const errors = [];
  const { title, description, severity, priority, steps, expected, actual, environment } = body;

  if (!partial || title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) errors.push('title is required');
  }
  if (!partial || description !== undefined) {
    if (typeof description !== 'string' || !description.trim()) errors.push('description is required');
  }
  if (!partial || severity !== undefined) {
    if (!SEVERITIES.includes(severity)) errors.push(`severity must be one of ${SEVERITIES.join(', ')}`);
  }
  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of ${PRIORITIES.join(', ')}`);
  }
  if (!partial || steps !== undefined) {
    if (!Array.isArray(steps) || steps.length === 0 || steps.some((s) => typeof s !== 'string' || !s.trim())) {
      errors.push('steps must be a non-empty array of non-empty strings');
    }
  }
  if (!partial || expected !== undefined) {
    if (typeof expected !== 'string' || !expected.trim()) errors.push('expected is required');
  }
  if (!partial || actual !== undefined) {
    if (typeof actual !== 'string' || !actual.trim()) errors.push('actual is required');
  }
  if (environment !== undefined && environment !== null && typeof environment !== 'string') {
    errors.push('environment must be a string');
  }
  if (body.status !== undefined) {
    errors.push('status cannot be set directly; use PATCH /bugs/:id/status');
  }

  return errors;
}

function handleListBugs(req, res) {
  const status = req.query.status;
  const severity = req.query.severity;
  const priority = req.query.priority;
  const search = (req.query.search || '').trim();
  const SORTABLE = ['title', 'severity', 'priority', 'status', 'updated_at'];
  const sortBy = SORTABLE.includes(req.query.sortBy) ? req.query.sortBy : 'updated_at';
  const sortDir = req.query.sortDir === 'asc' ? 'asc' : 'desc';

  let rows = db.prepare('SELECT * FROM bugs').all();

  if (status && STATUSES.includes(status)) rows = rows.filter((r) => r.status === status);
  if (severity && SEVERITIES.includes(severity)) rows = rows.filter((r) => r.severity === severity);
  if (priority && PRIORITIES.includes(priority)) rows = rows.filter((r) => r.priority === priority);
  if (search) {
    const needle = search.toLowerCase();
    rows = rows.filter((r) => r.title.toLowerCase().includes(needle) || r.description.toLowerCase().includes(needle));
  }

  rows.sort((a, b) => {
    let cmp;
    if (sortBy === 'severity') cmp = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    else if (sortBy === 'priority') cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    else if (sortBy === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
    else cmp = a.updated_at < b.updated_at ? -1 : a.updated_at > b.updated_at ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  res.json({ success: true, data: { items: rows.map(serializeBug), total: rows.length }, error: null });
}

function handleGetBug(req, res) {
  const row = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, data: null, error: 'Bug not found' });
  res.json({
    success: true,
    data: { ...serializeBug(row), activity: getActivity(req.params.id), attachments: getAttachments(req.params.id) },
    error: null,
  });
}

function handleCreateBug(req, res) {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ success: false, data: null, error: errors.join('; ') });

  const now = new Date().toISOString();
  const { title, description, severity, priority, steps, expected, actual, environment } = req.body;

  const result = db
    .prepare(
      `INSERT INTO bugs (title, description, severity, priority, status, steps, expected, actual, environment, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title.trim(),
      description.trim(),
      severity,
      priority || 'Medium',
      JSON.stringify(steps),
      expected.trim(),
      actual.trim(),
      environment ? environment.trim() : null,
      now,
      now
    );

  const row = db.prepare('SELECT * FROM bugs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: { ...serializeBug(row), activity: [], attachments: [] }, error: null });
}

function handleUpdateBug(req, res) {
  const existing = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, data: null, error: 'Bug not found' });

  const errors = validate(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ success: false, data: null, error: errors.join('; ') });

  const merged = {
    title: req.body.title !== undefined ? req.body.title.trim() : existing.title,
    description: req.body.description !== undefined ? req.body.description.trim() : existing.description,
    severity: req.body.severity !== undefined ? req.body.severity : existing.severity,
    priority: req.body.priority !== undefined ? req.body.priority : existing.priority,
    steps: req.body.steps !== undefined ? JSON.stringify(req.body.steps) : existing.steps,
    expected: req.body.expected !== undefined ? req.body.expected.trim() : existing.expected,
    actual: req.body.actual !== undefined ? req.body.actual.trim() : existing.actual,
    environment:
      req.body.environment !== undefined ? (req.body.environment ? req.body.environment.trim() : null) : existing.environment,
  };

  db.prepare(
    `UPDATE bugs SET title = ?, description = ?, severity = ?, priority = ?, steps = ?, expected = ?, actual = ?, environment = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    merged.title,
    merged.description,
    merged.severity,
    merged.priority,
    merged.steps,
    merged.expected,
    merged.actual,
    merged.environment,
    new Date().toISOString(),
    req.params.id
  );

  const row = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  res.json({
    success: true,
    data: { ...serializeBug(row), activity: getActivity(req.params.id), attachments: getAttachments(req.params.id) },
    error: null,
  });
}

function handleDeleteBug(req, res) {
  const existing = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, data: null, error: 'Bug not found' });

  db.prepare('DELETE FROM bugs WHERE id = ?').run(req.params.id);
  res.json({ success: true, data: { id: Number(req.params.id) }, error: null });
}

function handleChangeStatus(req, res) {
  const existing = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, data: null, error: 'Bug not found' });

  const { status: newStatus, message } = req.body;
  if (!STATUSES.includes(newStatus)) {
    return res.status(400).json({ success: false, data: null, error: `status must be one of ${STATUSES.join(', ')}` });
  }

  const allowed = TRANSITIONS[existing.status] || [];
  if (!allowed.includes(newStatus)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: `Cannot transition from "${existing.status}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}`,
    });
  }

  const now = new Date().toISOString();
  const applyTransition = db.transaction(() => {
    db.prepare('UPDATE bugs SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, req.params.id);
    db.prepare(
      'INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.params.id, 'status_change', existing.status, newStatus, message ? String(message).trim() || null : null, now);
  });
  applyTransition();

  const row = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  res.json({
    success: true,
    data: { ...serializeBug(row), activity: getActivity(req.params.id), attachments: getAttachments(req.params.id) },
    error: null,
  });
}

function handleAddComment(req, res) {
  const existing = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, data: null, error: 'Bug not found' });

  const message = (req.body.message || '').trim();
  if (!message) return res.status(400).json({ success: false, data: null, error: 'message is required' });

  db.prepare('INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.params.id,
    'comment',
    null,
    null,
    message,
    new Date().toISOString()
  );

  res.status(201).json({ success: true, data: { activity: getActivity(req.params.id) }, error: null });
}

router.get('/', handleListBugs);
router.get('/:id', handleGetBug);
router.post('/', handleCreateBug);
router.put('/:id', handleUpdateBug);
router.delete('/:id', handleDeleteBug);
router.patch('/:id/status', handleChangeStatus);
router.post('/:id/comments', handleAddComment);

module.exports = router;
