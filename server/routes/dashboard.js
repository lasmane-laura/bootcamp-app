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

router.get('/metrics', handleGetMetrics);

module.exports = router;
