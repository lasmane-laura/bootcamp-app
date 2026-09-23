const db = require('./db');

const RUN_PLAN = [
  { daysAgo: 20, outcomes: ['failed', 'failed', 'passed'] },
  { daysAgo: 17, outcomes: ['failed', 'passed', 'passed'] },
  { daysAgo: 14, outcomes: ['passed', 'passed', 'passed'] },
  { daysAgo: 11, outcomes: ['passed', 'failed', 'passed'] },
  { daysAgo: 8, outcomes: ['failed', 'failed', 'passed'] },
  { daysAgo: 6, outcomes: ['passed', 'passed', 'skipped'] },
  { daysAgo: 3, outcomes: ['passed', 'failed', 'passed'] },
  { daysAgo: 1, outcomes: ['passed', 'failed', 'skipped'] },
];

function seedTestRuns() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM test_runs_v2').get();
  if (count > 0) {
    console.log(`Skipping test run seed — test_runs_v2 already has ${count} row(s).`);
    return;
  }

  const suite = db
    .prepare(
      `SELECT s.id, COUNT(sc.test_case_id) AS case_count
       FROM suites s
       JOIN suite_cases sc ON sc.suite_id = s.id
       GROUP BY s.id
       HAVING case_count > 0
       ORDER BY s.id ASC
       LIMIT 1`
    )
    .get();

  if (!suite) {
    console.log('Skipping test run seed — no suite with cases to run.');
    return;
  }

  const suiteCases = db
    .prepare('SELECT test_case_id FROM suite_cases WHERE suite_id = ? ORDER BY sort_order ASC')
    .all(suite.id)
    .map((r) => r.test_case_id);

  const insertRun = db.prepare(
    'INSERT INTO test_runs_v2 (suite_id, status, start_time, end_time, created_by) VALUES (?, ?, ?, ?, ?)'
  );
  const insertResult = db.prepare(
    'INSERT INTO test_run_results (run_id, test_case_id, result, notes, failed_at, alert_sent) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const now = Date.now();

  RUN_PLAN.forEach(({ daysAgo, outcomes }) => {
    const startTime = new Date(now - daysAgo * 24 * 3600 * 1000).toISOString();
    const endTime = new Date(now - daysAgo * 24 * 3600 * 1000 + 300 * 1000).toISOString();

    const runResult = insertRun.run(suite.id, 'completed', startTime, endTime, 'seed');
    const runId = runResult.lastInsertRowid;

    let passCount = 0;
    let failCount = 0;
    let skipCount = 0;

    suiteCases.forEach((testCaseId, i) => {
      const outcome = outcomes[i % outcomes.length];
      if (outcome === 'passed') {
        passCount++;
        insertResult.run(runId, testCaseId, 'passed', null, null, 0);
      } else if (outcome === 'failed') {
        failCount++;
        insertResult.run(runId, testCaseId, 'failed', 'Reproduced consistently; see bug tracker.', endTime, 1);
      } else {
        skipCount++;
        insertResult.run(runId, testCaseId, 'skipped', 'Skipped for this run — blocked by environment setup.', null, 0);
      }
    });

    db.prepare('UPDATE test_runs_v2 SET pass_count = ?, fail_count = ?, skip_count = ? WHERE id = ?').run(
      passCount,
      failCount,
      skipCount,
      runId
    );
  });

  console.log(`Seeded ${RUN_PLAN.length} test runs for suite ${suite.id}.`);
}

module.exports = seedTestRuns;

if (require.main === module) {
  seedTestRuns();
}
