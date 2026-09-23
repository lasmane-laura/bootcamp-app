const express = require('express');
const { stringify } = require('csv-stringify/sync');
const db = require('../db');

const router = express.Router();

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];
const SEVERITY_RANK = { Critical: 0, Major: 1, Minor: 2, Trivial: 3 };

function serialize(row) {
  return {
    id: row.id,
    title: row.title,
    preconditions: row.preconditions,
    steps: JSON.parse(row.steps),
    expectedResult: row.expected_result,
    severity: row.severity,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validate(body, { partial = false } = {}) {
  const errors = [];
  const { title, preconditions, steps, expectedResult, severity, status } = body;

  if (!partial || title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) errors.push('title is required');
  }
  if (!partial || steps !== undefined) {
    if (!Array.isArray(steps) || steps.length === 0 || steps.some((s) => typeof s !== 'string' || !s.trim())) {
      errors.push('steps must be a non-empty array of non-empty strings');
    }
  }
  if (!partial || expectedResult !== undefined) {
    if (typeof expectedResult !== 'string' || !expectedResult.trim()) errors.push('expectedResult is required');
  }
  if (!partial || severity !== undefined) {
    if (!SEVERITIES.includes(severity)) errors.push(`severity must be one of ${SEVERITIES.join(', ')}`);
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    errors.push(`status must be one of ${STATUSES.join(', ')}`);
  }
  if (preconditions !== undefined && preconditions !== null && typeof preconditions !== 'string') {
    errors.push('preconditions must be a string');
  }

  return errors;
}

function getFilteredSortedTestCases(query) {
  const status = query.status;
  const severity = query.severity;
  const search = (query.search || '').trim();
  const SORTABLE = ['title', 'severity', 'status', 'updated_at'];
  const sortBy = SORTABLE.includes(query.sortBy) ? query.sortBy : 'updated_at';
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';

  let rows = db.prepare('SELECT * FROM test_cases').all();

  if (status && STATUSES.includes(status)) {
    rows = rows.filter((r) => r.status === status);
  }
  if (severity && SEVERITIES.includes(severity)) {
    rows = rows.filter((r) => r.severity === severity);
  }
  if (search) {
    const needle = search.toLowerCase();
    rows = rows.filter((r) => r.title.toLowerCase().includes(needle));
  }

  rows.sort((a, b) => {
    let cmp;
    if (sortBy === 'severity') {
      cmp = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    } else if (sortBy === 'title') {
      cmp = a.title.localeCompare(b.title);
    } else if (sortBy === 'status') {
      cmp = a.status.localeCompare(b.status);
    } else {
      cmp = a.updated_at < b.updated_at ? -1 : a.updated_at > b.updated_at ? 1 : 0;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return rows;
}

function handleListTestCases(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.max(parseInt(req.query.pageSize, 10) || 20, 1);

  const rows = getFilteredSortedTestCases(req.query);

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize).map(serialize);

  res.json({ success: true, data: { items, total, page, pageSize }, error: null });
}

const EXPORT_COLUMNS = ['id', 'title', 'preconditions', 'steps', 'expectedResult', 'severity', 'status', 'createdAt', 'updatedAt'];

function handleExportTestCases(req, res) {
  const records = getFilteredSortedTestCases(req.query)
    .map(serialize)
    .map((tc) => ({ ...tc, steps: tc.steps.join('\n') }));

  const csvBody = stringify(records, { header: true, columns: EXPORT_COLUMNS, bom: true });
  const filename = `test-cases-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvBody);
}

function handleGetTestCase(req, res) {
  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, data: null, error: 'Test case not found' });
  res.json({ success: true, data: serialize(row), error: null });
}

function handleCreateTestCase(req, res) {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ success: false, data: null, error: errors.join('; ') });

  const now = new Date().toISOString();
  const { title, preconditions, steps, expectedResult, severity, status } = req.body;

  const result = db
    .prepare(
      `INSERT INTO test_cases (title, preconditions, steps, expected_result, severity, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(title.trim(), preconditions ? preconditions.trim() : null, JSON.stringify(steps), expectedResult.trim(), severity, status || 'draft', now, now);

  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: serialize(row), error: null });
}

function handleUpdateTestCase(req, res) {
  const existing = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, data: null, error: 'Test case not found' });

  const errors = validate(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ success: false, data: null, error: errors.join('; ') });

  const merged = {
    title: req.body.title !== undefined ? req.body.title.trim() : existing.title,
    preconditions: req.body.preconditions !== undefined ? (req.body.preconditions ? req.body.preconditions.trim() : null) : existing.preconditions,
    steps: req.body.steps !== undefined ? JSON.stringify(req.body.steps) : existing.steps,
    expected_result: req.body.expectedResult !== undefined ? req.body.expectedResult.trim() : existing.expected_result,
    severity: req.body.severity !== undefined ? req.body.severity : existing.severity,
    status: req.body.status !== undefined ? req.body.status : existing.status,
  };

  db.prepare(
    `UPDATE test_cases SET title = ?, preconditions = ?, steps = ?, expected_result = ?, severity = ?, status = ?, updated_at = ?
     WHERE id = ?`
  ).run(merged.title, merged.preconditions, merged.steps, merged.expected_result, merged.severity, merged.status, new Date().toISOString(), req.params.id);

  const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: serialize(row), error: null });
}

function handleDeleteTestCase(req, res) {
  const existing = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, data: null, error: 'Test case not found' });

  db.prepare('DELETE FROM test_cases WHERE id = ?').run(req.params.id);
  res.json({ success: true, data: { id: Number(req.params.id) }, error: null });
}

router.get('/', handleListTestCases);
router.get('/export', handleExportTestCases);
router.get('/:id', handleGetTestCase);
router.post('/', handleCreateTestCase);
router.put('/:id', handleUpdateTestCase);
router.delete('/:id', handleDeleteTestCase);

router.validate = validate;
router.SEVERITIES = SEVERITIES;
router.STATUSES = STATUSES;

module.exports = router;
