const express = require('express');
const db = require('../db');

const router = express.Router();

const FLAKY_TRANSITIONS_THRESHOLD = 2;
const SORTABLE = ['title', 'totalRuns', 'passRate', 'transitions', 'isFlaky'];

function computeFlakyStats() {
  const rows = db
    .prepare(
      `SELECT trr.test_case_id, trr.run_id, trr.result, tr.start_time, tc.title, tc.severity
       FROM test_run_results trr
       JOIN test_runs_v2 tr ON tr.id = trr.run_id
       JOIN test_cases tc ON tc.id = trr.test_case_id
       WHERE trr.result != 'pending'
       ORDER BY trr.test_case_id ASC, tr.start_time ASC, trr.run_id ASC`
    )
    .all();

  const byCase = new Map();
  for (const row of rows) {
    if (!byCase.has(row.test_case_id)) {
      byCase.set(row.test_case_id, { title: row.title, severity: row.severity, history: [] });
    }
    byCase.get(row.test_case_id).history.push(row);
  }

  const stats = [];
  for (const [testCaseId, entry] of byCase.entries()) {
    let passCount = 0;
    let failCount = 0;
    let skipCount = 0;
    entry.history.forEach((r) => {
      if (r.result === 'passed') passCount++;
      else if (r.result === 'failed') failCount++;
      else if (r.result === 'skipped') skipCount++;
    });

    const decided = entry.history.filter((r) => r.result === 'passed' || r.result === 'failed');
    let transitions = 0;
    for (let i = 1; i < decided.length; i++) {
      if (decided[i].result !== decided[i - 1].result) transitions++;
    }

    const decidedTotal = passCount + failCount;
    const passRate = decidedTotal > 0 ? Math.round((passCount / decidedTotal) * 1000) / 10 : null;

    stats.push({
      testCaseId,
      title: entry.title,
      severity: entry.severity,
      totalRuns: entry.history.length,
      passCount,
      failCount,
      skipCount,
      passRate,
      transitions,
      isFlaky: transitions >= FLAKY_TRANSITIONS_THRESHOLD,
      history: entry.history.map((r) => ({ runId: r.run_id, result: r.result, date: r.start_time })),
    });
  }

  return stats;
}

function getFilteredSortedFlakyStats(query) {
  const search = (query.search || '').trim().toLowerCase();
  const flakyFilter = query.flaky === 'flaky' || query.flaky === 'stable' ? query.flaky : '';
  const sortBy = SORTABLE.includes(query.sortBy) ? query.sortBy : 'transitions';
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';

  let rows = computeFlakyStats();

  if (search) rows = rows.filter((r) => r.title.toLowerCase().includes(search));
  if (flakyFilter === 'flaky') rows = rows.filter((r) => r.isFlaky);
  if (flakyFilter === 'stable') rows = rows.filter((r) => !r.isFlaky);

  rows.sort((a, b) => {
    let cmp;
    if (sortBy === 'title') cmp = a.title.localeCompare(b.title);
    else cmp = (a[sortBy] ?? -Infinity) - (b[sortBy] ?? -Infinity);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return rows;
}

function handleListFlakyTests(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.max(parseInt(req.query.pageSize, 10) || 20, 1);

  const rows = getFilteredSortedFlakyStats(req.query);
  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);

  res.json({ success: true, data: { items, total, page, pageSize }, error: null });
}

router.get('/', handleListFlakyTests);

router.FLAKY_TRANSITIONS_THRESHOLD = FLAKY_TRANSITIONS_THRESHOLD;

module.exports = router;
