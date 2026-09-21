const db = require('./db');

function seedReports() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM reports').get();
  if (count > 0) {
    console.log(`Skipping report seed — reports already has ${count} row(s).`);
    return;
  }

  const run = db
    .prepare(
      `SELECT tr.*, s.name AS suite_name
       FROM test_runs_v2 tr
       JOIN suites s ON s.id = tr.suite_id
       ORDER BY tr.start_time DESC
       LIMIT 1`
    )
    .get();

  if (!run) {
    console.log('Skipping report seed — no test run to snapshot.');
    return;
  }

  const results = db
    .prepare(
      `SELECT trr.test_case_id, tc.title, tc.severity, trr.result, trr.notes, trr.duration_ms
       FROM test_run_results trr
       JOIN test_cases tc ON tc.id = trr.test_case_id
       WHERE trr.run_id = ?
       ORDER BY trr.id ASC`
    )
    .all(run.id)
    .map((r) => ({
      testCaseId: r.test_case_id,
      title: r.title,
      severity: r.severity,
      result: r.result,
      notes: r.notes,
      durationMs: r.duration_ms,
    }));

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

  console.log(`Seeded 1 report (report ${insertResult.lastInsertRowid}) for run ${run.id}.`);
}

module.exports = seedReports;

if (require.main === module) {
  seedReports();
}
