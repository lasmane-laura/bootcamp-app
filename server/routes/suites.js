const express = require('express');
const db = require('../db');

const router = express.Router();

const STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed'];

function serializeSuite(row, caseCount) {
  return {
    id: row.id,
    name: row.name,
    feature: row.feature,
    status: row.status,
    caseCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeCase(row, extra = {}) {
  return {
    id: row.id,
    title: row.title,
    severity: row.severity,
    status: row.status,
    sortOrder: row.sort_order,
    ...extra,
  };
}

function validate(body, { partial = false } = {}) {
  const errors = [];
  const { name, feature, status } = body;

  if (!partial || name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) errors.push('name is required');
  }
  if (!partial || feature !== undefined) {
    if (typeof feature !== 'string' || !feature.trim()) errors.push('feature is required');
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    errors.push(`status must be one of ${STATUSES.join(', ')}`);
  }

  return errors;
}

function handleListSuites(req, res) {
  const status = req.query.status;

  let rows = db.prepare('SELECT * FROM suites').all();
  if (status && STATUSES.includes(status)) {
    rows = rows.filter((r) => r.status === status);
  }

  rows.sort((a, b) => (a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : 0));

  const countStmt = db.prepare('SELECT COUNT(*) AS count FROM suite_cases WHERE suite_id = ?');
  const items = rows.map((row) => serializeSuite(row, countStmt.get(row.id).count));

  res.json({ success: true, data: { items, total: items.length }, error: null });
}

// Deleting a suite cascades to its test_runs_v2/test_run_results rows. For a
// case that also belongs to another suite, that's not just losing this suite's
// runs — computeFlakyStats() aggregates a case's flakiness across every suite it
// belongs to, so it silently corrupts that other suite's flaky/stable signal too.
// Flagged here so the client can warn before the delete is confirmed.
function caseIsAtRiskIfSuiteDeleted(testCaseId, suiteId) {
  const inOtherSuite = db
    .prepare('SELECT 1 FROM suite_cases WHERE test_case_id = ? AND suite_id != ? LIMIT 1')
    .get(testCaseId, suiteId);
  if (!inOtherSuite) return false;

  const hasHistory = db
    .prepare(
      `SELECT 1 FROM test_run_results trr
       JOIN test_runs_v2 tr ON tr.id = trr.run_id
       WHERE tr.suite_id = ? AND trr.test_case_id = ? AND trr.result != 'pending'
       LIMIT 1`
    )
    .get(suiteId, testCaseId);
  return !!hasHistory;
}

function handleGetSuite(req, res) {
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  if (!suite) return res.status(404).json({ success: false, data: null, error: 'Suite not found' });

  const cases = db
    .prepare(
      `SELECT tc.id, tc.title, tc.severity, tc.status, sc.sort_order
       FROM suite_cases sc
       JOIN test_cases tc ON tc.id = sc.test_case_id
       WHERE sc.suite_id = ?
       ORDER BY sc.sort_order ASC`
    )
    .all(req.params.id)
    .map((row) =>
      serializeCase(row, { atRiskIfDeleted: caseIsAtRiskIfSuiteDeleted(row.id, Number(req.params.id)) })
    );

  res.json({ success: true, data: { ...serializeSuite(suite, cases.length), cases }, error: null });
}

function handleCreateSuite(req, res) {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ success: false, data: null, error: errors.join('; ') });

  const now = new Date().toISOString();
  const { name, feature, status } = req.body;

  const result = db
    .prepare('INSERT INTO suites (name, feature, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(name.trim(), feature.trim(), status || 'draft', now, now);

  const row = db.prepare('SELECT * FROM suites WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: serializeSuite(row, 0), error: null });
}

function handleUpdateSuite(req, res) {
  const existing = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, data: null, error: 'Suite not found' });

  const errors = validate(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ success: false, data: null, error: errors.join('; ') });

  const merged = {
    name: req.body.name !== undefined ? req.body.name.trim() : existing.name,
    feature: req.body.feature !== undefined ? req.body.feature.trim() : existing.feature,
    status: req.body.status !== undefined ? req.body.status : existing.status,
  };

  db.prepare('UPDATE suites SET name = ?, feature = ?, status = ?, updated_at = ? WHERE id = ?').run(
    merged.name,
    merged.feature,
    merged.status,
    new Date().toISOString(),
    req.params.id
  );

  const row = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  const count = db.prepare('SELECT COUNT(*) AS count FROM suite_cases WHERE suite_id = ?').get(req.params.id).count;
  res.json({ success: true, data: serializeSuite(row, count), error: null });
}

function handleDeleteSuite(req, res) {
  const existing = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, data: null, error: 'Suite not found' });

  db.prepare('DELETE FROM suites WHERE id = ?').run(req.params.id);
  res.json({ success: true, data: { id: Number(req.params.id) }, error: null });
}

function touchSuite(suiteId) {
  db.prepare('UPDATE suites SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), suiteId);
}

function handleAddCaseToSuite(req, res) {
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  if (!suite) return res.status(404).json({ success: false, data: null, error: 'Suite not found' });

  const testCaseId = Number(req.body.testCaseId);
  const testCase = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(testCaseId);
  if (!testCase) return res.status(400).json({ success: false, data: null, error: 'Test case not found' });

  const already = db.prepare('SELECT 1 FROM suite_cases WHERE suite_id = ? AND test_case_id = ?').get(req.params.id, testCaseId);
  if (already) return res.status(400).json({ success: false, data: null, error: 'Test case is already in this suite' });

  const maxOrder = db.prepare('SELECT MAX(sort_order) AS max FROM suite_cases WHERE suite_id = ?').get(req.params.id).max;
  const nextOrder = maxOrder === null ? 0 : maxOrder + 1;

  db.prepare('INSERT INTO suite_cases (suite_id, test_case_id, sort_order) VALUES (?, ?, ?)').run(req.params.id, testCaseId, nextOrder);
  touchSuite(req.params.id);

  const cases = db
    .prepare(
      `SELECT tc.id, tc.title, tc.severity, tc.status, sc.sort_order
       FROM suite_cases sc JOIN test_cases tc ON tc.id = sc.test_case_id
       WHERE sc.suite_id = ? ORDER BY sc.sort_order ASC`
    )
    .all(req.params.id)
    .map(serializeCase);

  res.status(201).json({ success: true, data: { cases }, error: null });
}

function handleRemoveCaseFromSuite(req, res) {
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  if (!suite) return res.status(404).json({ success: false, data: null, error: 'Suite not found' });

  const existing = db.prepare('SELECT 1 FROM suite_cases WHERE suite_id = ? AND test_case_id = ?').get(req.params.id, req.params.caseId);
  if (!existing) return res.status(404).json({ success: false, data: null, error: 'Test case is not in this suite' });

  db.prepare('DELETE FROM suite_cases WHERE suite_id = ? AND test_case_id = ?').run(req.params.id, req.params.caseId);
  touchSuite(req.params.id);

  const cases = db
    .prepare(
      `SELECT tc.id, tc.title, tc.severity, tc.status, sc.sort_order
       FROM suite_cases sc JOIN test_cases tc ON tc.id = sc.test_case_id
       WHERE sc.suite_id = ? ORDER BY sc.sort_order ASC`
    )
    .all(req.params.id)
    .map(serializeCase);

  res.json({ success: true, data: { cases }, error: null });
}

function handleReorderSuiteCases(req, res) {
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(req.params.id);
  if (!suite) return res.status(404).json({ success: false, data: null, error: 'Suite not found' });

  const caseIds = req.body.caseIds;
  if (!Array.isArray(caseIds) || caseIds.some((id) => typeof id !== 'number')) {
    return res.status(400).json({ success: false, data: null, error: 'caseIds must be an array of numbers' });
  }

  const current = db.prepare('SELECT test_case_id FROM suite_cases WHERE suite_id = ?').all(req.params.id).map((r) => r.test_case_id);

  const sameSet = current.length === caseIds.length && current.every((id) => caseIds.includes(id));
  if (!sameSet) {
    return res.status(400).json({ success: false, data: null, error: 'caseIds must match the set of cases currently in the suite' });
  }

  const update = db.prepare('UPDATE suite_cases SET sort_order = ? WHERE suite_id = ? AND test_case_id = ?');
  const reorder = db.transaction((ids) => {
    ids.forEach((id, index) => update.run(index, req.params.id, id));
  });
  reorder(caseIds);
  touchSuite(req.params.id);

  const cases = db
    .prepare(
      `SELECT tc.id, tc.title, tc.severity, tc.status, sc.sort_order
       FROM suite_cases sc JOIN test_cases tc ON tc.id = sc.test_case_id
       WHERE sc.suite_id = ? ORDER BY sc.sort_order ASC`
    )
    .all(req.params.id)
    .map(serializeCase);

  res.json({ success: true, data: { cases }, error: null });
}

router.get('/', handleListSuites);
router.get('/:id', handleGetSuite);
router.post('/', handleCreateSuite);
router.put('/:id', handleUpdateSuite);
router.delete('/:id', handleDeleteSuite);
router.put('/:id/reorder', handleReorderSuiteCases);
router.post('/:id/cases', handleAddCaseToSuite);
router.delete('/:id/cases/:caseId', handleRemoveCaseFromSuite);

module.exports = router;
