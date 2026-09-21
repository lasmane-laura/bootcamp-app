const express = require('express');
const db = require('../db');

const router = express.Router();

const RESULTS = ['pending', 'passed', 'failed', 'skipped'];
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function serializeRun(row, extra = {}) {
  return {
    id: row.id,
    suiteId: row.suite_id,
    status: row.status,
    passCount: row.pass_count,
    failCount: row.fail_count,
    skipCount: row.skip_count,
    startTime: row.start_time,
    endTime: row.end_time,
    createdBy: row.created_by,
    ...extra,
  };
}

function serializeResult(row) {
  return {
    id: row.id,
    runId: row.run_id,
    testCaseId: row.test_case_id,
    title: row.title,
    severity: row.severity,
    result: row.result,
    durationMs: row.duration_ms,
    notes: row.notes,
    failedAt: row.failed_at,
    alertSent: !!row.alert_sent,
  };
}

function getResults(runId) {
  return db
    .prepare(
      `SELECT trr.*, tc.title, tc.severity
       FROM test_run_results trr
       JOIN test_cases tc ON tc.id = trr.test_case_id
       WHERE trr.run_id = ?
       ORDER BY trr.id ASC`
    )
    .all(runId)
    .map(serializeResult);
}

function recomputeRunCounts(runId) {
  const rows = db.prepare('SELECT result FROM test_run_results WHERE run_id = ?').all(runId);
  const counts = { passed: 0, failed: 0, skipped: 0, pending: 0 };
  rows.forEach((r) => counts[r.result]++);

  const run = db.prepare('SELECT * FROM test_runs_v2 WHERE id = ?').get(runId);
  const nowCompleted = counts.pending === 0;
  const status = nowCompleted ? 'completed' : 'in-progress';
  const endTime = nowCompleted ? run.end_time || new Date().toISOString() : null;

  db.prepare('UPDATE test_runs_v2 SET pass_count = ?, fail_count = ?, skip_count = ?, status = ?, end_time = ? WHERE id = ?').run(
    counts.passed,
    counts.failed,
    counts.skipped,
    status,
    endTime,
    runId
  );
}

async function sendFailureAlert(run, resultRow, testCase) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL not configured; skipping failure alert.');
    return false;
  }

  const runLink = `${CLIENT_URL}/test-runs/${run.id}`;
  const content = [
    `**Test failed:** ${testCase.title}`,
    resultRow.notes ? `**Notes:** ${resultRow.notes}` : '**Notes:** (none provided)',
    `**Run:** ${runLink}`,
  ].join('\n');

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to post Discord alert:', err.message);
    return false;
  }
}

function handleListRuns(req, res) {
  const rows = db
    .prepare(
      `SELECT tr.*, s.name AS suite_name
       FROM test_runs_v2 tr
       JOIN suites s ON s.id = tr.suite_id
       ORDER BY tr.start_time DESC`
    )
    .all();

  const items = rows.map((row) => serializeRun(row, { suiteName: row.suite_name }));
  res.json({ success: true, data: { items, total: items.length }, error: null });
}

function handleGetRun(req, res) {
  const row = db
    .prepare(
      `SELECT tr.*, s.name AS suite_name
       FROM test_runs_v2 tr
       JOIN suites s ON s.id = tr.suite_id
       WHERE tr.id = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ success: false, data: null, error: 'Run not found' });

  const results = getResults(req.params.id);
  res.json({ success: true, data: serializeRun(row, { suiteName: row.suite_name, results }), error: null });
}

function handleCreateRun(req, res) {
  const suiteId = Number(req.body.suiteId);
  const suite = db.prepare('SELECT * FROM suites WHERE id = ?').get(suiteId);
  if (!suite) return res.status(400).json({ success: false, data: null, error: 'Suite not found' });

  const suiteCases = db
    .prepare('SELECT test_case_id FROM suite_cases WHERE suite_id = ? ORDER BY sort_order ASC')
    .all(suiteId);
  if (suiteCases.length === 0) {
    return res.status(400).json({ success: false, data: null, error: 'Suite has no cases to run' });
  }

  const now = new Date().toISOString();
  const createdBy = typeof req.body.createdBy === 'string' && req.body.createdBy.trim() ? req.body.createdBy.trim() : null;

  const createRunTx = db.transaction(() => {
    const runResult = db
      .prepare('INSERT INTO test_runs_v2 (suite_id, status, start_time, created_by) VALUES (?, ?, ?, ?)')
      .run(suiteId, 'in-progress', now, createdBy);

    const runId = runResult.lastInsertRowid;
    const insertResult = db.prepare('INSERT INTO test_run_results (run_id, test_case_id, result) VALUES (?, ?, ?)');
    suiteCases.forEach((c) => insertResult.run(runId, c.test_case_id, 'pending'));

    return runId;
  });

  const runId = createRunTx();
  recomputeRunCounts(runId);

  const row = db
    .prepare(
      `SELECT tr.*, s.name AS suite_name
       FROM test_runs_v2 tr
       JOIN suites s ON s.id = tr.suite_id
       WHERE tr.id = ?`
    )
    .get(runId);

  res.status(201).json({ success: true, data: serializeRun(row, { suiteName: row.suite_name, results: getResults(runId) }), error: null });
}

async function handleUpdateResult(req, res) {
  const run = db.prepare('SELECT * FROM test_runs_v2 WHERE id = ?').get(req.params.runId);
  if (!run) return res.status(404).json({ success: false, data: null, error: 'Run not found' });

  const existing = db
    .prepare('SELECT * FROM test_run_results WHERE run_id = ? AND test_case_id = ?')
    .get(req.params.runId, req.params.testCaseId);
  if (!existing) return res.status(404).json({ success: false, data: null, error: 'This case is not part of this run' });

  const { result, notes, durationMs } = req.body;
  if (!RESULTS.includes(result) || result === 'pending') {
    return res.status(400).json({ success: false, data: null, error: 'result must be one of passed, failed, skipped' });
  }
  if (durationMs !== undefined && durationMs !== null && (typeof durationMs !== 'number' || durationMs < 0)) {
    return res.status(400).json({ success: false, data: null, error: 'durationMs must be a non-negative number' });
  }

  const becomingFailed = result === 'failed' && existing.result !== 'failed';
  const failedAt = result === 'failed' ? new Date().toISOString() : existing.failed_at;

  db.prepare('UPDATE test_run_results SET result = ?, notes = ?, duration_ms = ?, failed_at = ? WHERE id = ?').run(
    result,
    notes !== undefined ? (notes ? String(notes).trim() : null) : existing.notes,
    durationMs !== undefined ? durationMs : existing.duration_ms,
    failedAt,
    existing.id
  );

  if (becomingFailed) {
    const testCase = db.prepare('SELECT title FROM test_cases WHERE id = ?').get(req.params.testCaseId);
    const updatedRow = db.prepare('SELECT * FROM test_run_results WHERE id = ?').get(existing.id);
    const alertSent = await sendFailureAlert(run, updatedRow, testCase);
    if (alertSent) {
      db.prepare('UPDATE test_run_results SET alert_sent = 1 WHERE id = ?').run(existing.id);
    }
  }

  recomputeRunCounts(req.params.runId);

  const updatedRunRow = db
    .prepare(
      `SELECT tr.*, s.name AS suite_name
       FROM test_runs_v2 tr
       JOIN suites s ON s.id = tr.suite_id
       WHERE tr.id = ?`
    )
    .get(req.params.runId);

  res.json({
    success: true,
    data: serializeRun(updatedRunRow, { suiteName: updatedRunRow.suite_name, results: getResults(req.params.runId) }),
    error: null,
  });
}

router.get('/', handleListRuns);
router.get('/:id', handleGetRun);
router.post('/', handleCreateRun);
router.patch('/:runId/results/:testCaseId', handleUpdateResult);

module.exports = router;
