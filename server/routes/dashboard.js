const express = require('express');
const db = require('../db');

const router = express.Router();

function getMetrics() {
  const totalTestCases = db.prepare('SELECT COUNT(*) AS count FROM test_cases').get().count;

  const resultCounts = db
    .prepare(`SELECT result, COUNT(*) AS count FROM test_run_results WHERE result IN ('passed', 'failed') GROUP BY result`)
    .all();
  let passed = 0;
  let failed = 0;
  resultCounts.forEach((r) => {
    if (r.result === 'passed') passed = r.count;
    if (r.result === 'failed') failed = r.count;
  });
  const passRate = passed + failed > 0 ? Math.round((passed / (passed + failed)) * 1000) / 10 : null;

  // "Open" = still needs attention: not resolved and not closed.
  const openBugs = db
    .prepare(`SELECT COUNT(*) AS count FROM bugs WHERE status IN ('open', 'in-progress', 'reopened')`)
    .get().count;

  const completedRuns = db.prepare(`SELECT start_time, end_time FROM test_runs_v2 WHERE end_time IS NOT NULL`).all();
  let avgTestRunDurationSeconds = null;
  if (completedRuns.length > 0) {
    const totalMs = completedRuns.reduce(
      (sum, r) => sum + (new Date(r.end_time).getTime() - new Date(r.start_time).getTime()),
      0
    );
    avgTestRunDurationSeconds = Math.round(totalMs / completedRuns.length / 1000);
  }

  return { totalTestCases, passRate, openBugs, avgTestRunDurationSeconds };
}

function getRecentRuns() {
  return db
    .prepare(
      `SELECT tr.id, tr.status, tr.pass_count, tr.fail_count, tr.skip_count, tr.start_time, tr.end_time, s.name AS suite_name
       FROM test_runs_v2 tr
       JOIN suites s ON s.id = tr.suite_id
       ORDER BY tr.start_time DESC
       LIMIT 10`
    )
    .all()
    .map((r) => ({
      id: r.id,
      suiteName: r.suite_name,
      status: r.status,
      passCount: r.pass_count,
      failCount: r.fail_count,
      skipCount: r.skip_count,
      startTime: r.start_time,
      endTime: r.end_time,
    }));
}

function getRecentActivity() {
  return db
    .prepare(
      `SELECT ba.id, ba.bug_id, ba.action, ba.old_value, ba.new_value, ba.message, ba.created_at, b.title AS bug_title
       FROM bug_activity ba
       JOIN bugs b ON b.id = ba.bug_id
       ORDER BY ba.created_at DESC
       LIMIT 10`
    )
    .all()
    .map((r) => {
      const summary = r.action === 'status_change' ? `bug #${r.bug_id} marked ${r.new_value}` : `bug #${r.bug_id} commented`;
      return {
        id: r.id,
        bugId: r.bug_id,
        bugTitle: r.bug_title,
        action: r.action,
        oldValue: r.old_value,
        newValue: r.new_value,
        message: r.message,
        createdAt: r.created_at,
        summary,
      };
    });
}

const TEST_CASE_STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getPassRateTrend() {
  const rows = db
    .prepare(
      `SELECT tr.id, tr.start_time, tr.pass_count, tr.fail_count, s.name AS suite_name
       FROM test_runs_v2 tr
       JOIN suites s ON s.id = tr.suite_id
       ORDER BY tr.start_time DESC
       LIMIT 10`
    )
    .all();

  return rows.reverse().map((r) => {
    const decided = r.pass_count + r.fail_count;
    return {
      runId: r.id,
      suiteName: r.suite_name,
      date: r.start_time,
      passRate: decided > 0 ? Math.round((r.pass_count / decided) * 1000) / 10 : null,
    };
  });
}

function getBugsPerWeek() {
  const now = Date.now();
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const weekEnd = now - i * WEEK_MS;
    const weekStart = weekEnd - WEEK_MS;
    weeks.push({ weekStart, weekEnd, opened: 0, closed: 0 });
  }

  function bucketFor(timestamp) {
    return weeks.find((w) => timestamp >= w.weekStart && timestamp < w.weekEnd);
  }

  db.prepare('SELECT created_at FROM bugs').all().forEach((b) => {
    const bucket = bucketFor(new Date(b.created_at).getTime());
    if (bucket) bucket.opened++;
  });

  db.prepare(`SELECT created_at FROM bug_activity WHERE action = 'status_change' AND new_value = 'closed'`)
    .all()
    .forEach((c) => {
      const bucket = bucketFor(new Date(c.created_at).getTime());
      if (bucket) bucket.closed++;
    });

  return weeks.map((w) => ({ weekStart: new Date(w.weekStart).toISOString(), opened: w.opened, closed: w.closed }));
}

function getTestCoverageByStatus() {
  const rows = db.prepare('SELECT status, COUNT(*) AS count FROM test_cases GROUP BY status').all();
  const counts = Object.fromEntries(TEST_CASE_STATUSES.map((s) => [s, 0]));
  rows.forEach((r) => {
    if (counts[r.status] !== undefined) counts[r.status] = r.count;
  });
  return TEST_CASE_STATUSES.map((status) => ({ status, count: counts[status] }));
}

function handleGetMetrics(req, res) {
  res.json({
    success: true,
    data: {
      metrics: getMetrics(),
      recentRuns: getRecentRuns(),
      recentActivity: getRecentActivity(),
    },
    error: null,
  });
}

function handleGetTrends(req, res) {
  res.json({
    success: true,
    data: {
      passRateTrend: getPassRateTrend(),
      bugsPerWeek: getBugsPerWeek(),
      testCoverageByStatus: getTestCoverageByStatus(),
    },
    error: null,
  });
}

router.get('/metrics', handleGetMetrics);
router.get('/trends', handleGetTrends);

module.exports = router;
