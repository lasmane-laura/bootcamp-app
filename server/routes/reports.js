const express = require('express');
const db = require('../db');

const router = express.Router();

function serializeReportSummary(row) {
  return {
    id: row.id,
    runId: row.run_id,
    suiteName: row.suite_name,
    runDate: row.run_date,
    totalCount: row.total_count,
    passedCount: row.passed_count,
    failedCount: row.failed_count,
    skippedCount: row.skipped_count,
    generatedAt: row.generated_at,
  };
}

function serializeReport(row) {
  return {
    ...serializeReportSummary(row),
    results: JSON.parse(row.results),
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const RESULT_LABELS = { passed: 'Passed', failed: 'Failed', skipped: 'Skipped', pending: 'Pending' };

function buildReportHtml(report) {
  const rows = report.results
    .map(
      (r) => `        <tr>
          <td class="case-title">${escapeHtml(r.title)}</td>
          <td><span class="badge severity-${escapeHtml(r.severity)}">${escapeHtml(r.severity)}</span></td>
          <td><span class="badge result-${escapeHtml(r.result)}">${escapeHtml(RESULT_LABELS[r.result] || r.result)}</span></td>
          <td class="notes">${r.notes ? escapeHtml(r.notes) : '—'}</td>
        </tr>`
    )
    .join('\n');

  const title = `Test Report — ${escapeHtml(report.suiteName)}`;
  const passRate = report.totalCount > 0 ? Math.round((report.passedCount / report.totalCount) * 1000) / 10 : null;
  const pct = (n) => (report.totalCount > 0 ? (n / report.totalCount) * 100 : 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<style>
  :root {
    color-scheme: light;
    --brand: #33357a;
    --brand-light: #565a9e;
    --text: #1f2933;
    --muted: #6b7280;
    --border: #e5e7eb;
    --page-bg: #f3f4f6;
    --passed: #1a7f37;
    --passed-bg: #e6f4ea;
    --failed: #a01c1c;
    --failed-bg: #fdeaea;
    --skipped: #8a7000;
    --skipped-bg: #fff8e1;
    --pending: #6b7280;
    --pending-bg: #f3f4f6;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    font-family: -apple-system, 'Segoe UI', Roboto, Arial, Helvetica, sans-serif;
    background: var(--page-bg);
    color: var(--text);
    padding: 2.5rem 1rem;
  }
  .page {
    max-width: 880px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }
  .accent-bar { height: 6px; background: linear-gradient(90deg, var(--brand), var(--brand-light)); }

  .report-header { padding: 2rem 2.5rem 1.5rem; border-bottom: 1px solid var(--border); }
  .brand { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; font-weight: 700; color: var(--brand); margin-bottom: 0.5rem; }
  h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.25rem; }
  .suite-name { font-size: 1.05rem; font-weight: 500; color: var(--muted); margin: 0 0 1rem; }
  .meta-row { font-size: 0.85rem; color: var(--muted); display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .meta-row .dot { color: var(--border); }

  .summary { display: flex; gap: 1rem; flex-wrap: wrap; padding: 1.75rem 2.5rem 0; }
  .stat-card { flex: 1; min-width: 120px; border: 1px solid var(--border); border-top: 4px solid var(--brand); border-radius: 10px; padding: 1rem; text-align: center; background: #fafafa; }
  .stat-card.passed { border-top-color: var(--passed); background: var(--passed-bg); }
  .stat-card.failed { border-top-color: var(--failed); background: var(--failed-bg); }
  .stat-card.skipped { border-top-color: var(--skipped); background: var(--skipped-bg); }
  .stat-value { font-size: 1.9rem; font-weight: 800; line-height: 1; margin-bottom: 0.3rem; }
  .stat-card.passed .stat-value { color: var(--passed); }
  .stat-card.failed .stat-value { color: var(--failed); }
  .stat-card.skipped .stat-value { color: var(--skipped); }
  .stat-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }

  .progress-section { padding: 1.5rem 2.5rem 0; }
  .progress-bar { display: flex; height: 10px; border-radius: 999px; overflow: hidden; background: var(--border); }
  .progress-bar .segment.passed { background: var(--passed); }
  .progress-bar .segment.failed { background: var(--failed); }
  .progress-bar .segment.skipped { background: var(--skipped); }
  .progress-caption { margin-top: 0.5rem; font-size: 0.8rem; color: var(--muted); }
  .progress-caption strong { color: var(--text); }

  .results { padding: 2rem 2.5rem; }
  .results h2 { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); margin: 0 0 1rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
  thead th {
    text-align: left; padding: 0.6rem 0.75rem; background: #f9fafb; color: var(--muted);
    font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700;
    border-bottom: 2px solid var(--border);
  }
  tbody td { padding: 0.7rem 0.75rem; border-bottom: 1px solid var(--border); vertical-align: top; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  tbody tr:last-child td { border-bottom: none; }
  .case-title { font-weight: 600; }
  .notes { color: var(--muted); font-style: italic; font-size: 0.85rem; }

  .badge { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
  .result-passed { background: var(--passed-bg); color: var(--passed); }
  .result-failed { background: var(--failed-bg); color: var(--failed); }
  .result-skipped { background: var(--skipped-bg); color: var(--skipped); }
  .result-pending { background: var(--pending-bg); color: var(--pending); }
  .severity-Critical { background: #fde2e1; color: #a01c1c; }
  .severity-Major { background: #fde8cc; color: #a15c00; }
  .severity-Minor { background: #fff6cc; color: #8a7000; }
  .severity-Trivial { background: #e6e6e6; color: #555555; }

  .report-footer {
    padding: 1.25rem 2.5rem; border-top: 1px solid var(--border); background: #fafbfc;
    display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.4rem;
    font-size: 0.75rem; color: var(--muted);
  }

  @media print {
    @page { margin: 1.5cm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    html, body { background: #fff; }
    body { padding: 0; }
    .page { max-width: 100%; border: none; border-radius: 0; box-shadow: none; }
    .report-header, .summary, .progress-section { page-break-after: avoid; }
    thead { display: table-header-group; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="accent-bar"></div>

    <header class="report-header">
      <div class="brand">Bootcamp App &middot; QA</div>
      <h1>Test Report</h1>
      <p class="suite-name">${escapeHtml(report.suiteName)}</p>
      <div class="meta-row">
        <span>Run date: <strong>${escapeHtml(new Date(report.runDate).toLocaleString())}</strong></span>
        <span class="dot">&bull;</span>
        <span>Generated: <strong>${escapeHtml(new Date(report.generatedAt).toLocaleString())}</strong></span>
      </div>
    </header>

    <section class="summary">
      <div class="stat-card total">
        <div class="stat-value">${report.totalCount}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat-card passed">
        <div class="stat-value">${report.passedCount}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card failed">
        <div class="stat-value">${report.failedCount}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card skipped">
        <div class="stat-value">${report.skippedCount}</div>
        <div class="stat-label">Skipped</div>
      </div>
    </section>

    <section class="progress-section">
      <div class="progress-bar">
        <div class="segment passed" style="width: ${pct(report.passedCount)}%"></div>
        <div class="segment failed" style="width: ${pct(report.failedCount)}%"></div>
        <div class="segment skipped" style="width: ${pct(report.skippedCount)}%"></div>
      </div>
      <p class="progress-caption">${passRate !== null ? `<strong>${passRate}%</strong> pass rate` : 'No results recorded for this run'}</p>
    </section>

    <section class="results">
      <h2>Test case results</h2>
      <table>
        <thead>
          <tr><th>Test case</th><th>Severity</th><th>Result</th><th>Notes</th></tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </section>

    <footer class="report-footer">
      <span>Generated by Bootcamp App Test Reports</span>
      <span>Report #${report.id}</span>
    </footer>
  </div>
</body>
</html>
`;
}

function buildResultsSnapshot(runId) {
  return db
    .prepare(
      `SELECT trr.test_case_id, tc.title, tc.severity, trr.result, trr.notes, trr.duration_ms
       FROM test_run_results trr
       JOIN test_cases tc ON tc.id = trr.test_case_id
       WHERE trr.run_id = ?
       ORDER BY trr.id ASC`
    )
    .all(runId)
    .map((r) => ({
      testCaseId: r.test_case_id,
      title: r.title,
      severity: r.severity,
      result: r.result,
      notes: r.notes,
      durationMs: r.duration_ms,
    }));
}

function handleListReports(req, res) {
  const rows = db.prepare('SELECT * FROM reports ORDER BY generated_at DESC').all();
  const items = rows.map(serializeReportSummary);
  res.json({ success: true, data: { items, total: items.length }, error: null });
}

function handleGetReport(req, res) {
  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, data: null, error: 'Report not found' });
  res.json({ success: true, data: serializeReport(row), error: null });
}

function handleCreateReport(req, res) {
  const runId = Number(req.body.runId);
  if (!Number.isInteger(runId)) {
    return res.status(400).json({ success: false, data: null, error: 'runId is required' });
  }

  const run = db
    .prepare(
      `SELECT tr.*, s.name AS suite_name
       FROM test_runs_v2 tr
       JOIN suites s ON s.id = tr.suite_id
       WHERE tr.id = ?`
    )
    .get(runId);
  if (!run) return res.status(400).json({ success: false, data: null, error: 'Test run not found' });

  const results = buildResultsSnapshot(runId);
  const totalCount = results.length;
  const passedCount = results.filter((r) => r.result === 'passed').length;
  const failedCount = results.filter((r) => r.result === 'failed').length;
  const skippedCount = results.filter((r) => r.result === 'skipped').length;
  const generatedAt = new Date().toISOString();

  const insertResult = db
    .prepare(
      `INSERT INTO reports (run_id, suite_name, run_date, total_count, passed_count, failed_count, skipped_count, results, generated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(run.id, run.suite_name, run.start_time, totalCount, passedCount, failedCount, skippedCount, JSON.stringify(results), generatedAt);

  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(insertResult.lastInsertRowid);
  res.status(201).json({ success: true, data: serializeReport(row), error: null });
}

function handleExportReportHtml(req, res) {
  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, data: null, error: 'Report not found' });

  const report = serializeReport(row);
  const html = buildReportHtml(report);
  const disposition = req.query.inline === '1' ? 'inline' : 'attachment';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `${disposition}; filename="report-${report.id}.html"`);
  res.send(html);
}

router.get('/', handleListReports);
router.get('/:id', handleGetReport);
router.post('/', handleCreateReport);
router.get('/:id/export/html', handleExportReportHtml);

module.exports = router;
