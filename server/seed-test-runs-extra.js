const db = require('./db');

const CREATED_BY = 'seed-extra-20';

// 20 outcome patterns across a suite's 3 cases, deliberately mixed (not a
// repeating cycle) so the dashboard trend charts and test-run history show
// realistic variation instead of a flat pattern.
const OUTCOME_PLANS = [
  ['passed', 'passed', 'passed'],
  ['failed', 'passed', 'passed'],
  ['passed', 'failed', 'passed'],
  ['passed', 'passed', 'failed'],
  ['failed', 'failed', 'passed'],
  ['skipped', 'passed', 'passed'],
  ['passed', 'skipped', 'passed'],
  ['passed', 'passed', 'skipped'],
  ['failed', 'skipped', 'passed'],
  ['passed', 'failed', 'skipped'],
  ['failed', 'failed', 'failed'],
  ['passed', 'passed', 'passed'],
  ['skipped', 'skipped', 'passed'],
  ['failed', 'passed', 'skipped'],
  ['passed', 'failed', 'failed'],
  ['passed', 'passed', 'failed'],
  ['skipped', 'failed', 'passed'],
  ['passed', 'skipped', 'failed'],
  ['failed', 'passed', 'passed'],
  ['passed', 'passed', 'passed'],
];

function seedExtraTestRuns() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM test_runs_v2 WHERE created_by = ?').get(CREATED_BY);
  if (count > 0) {
    console.log(`Skipping extra test run seed — ${count} row(s) already tagged '${CREATED_BY}'.`);
    return;
  }

  const suite = db.prepare('SELECT id FROM suites ORDER BY id ASC LIMIT 1').get();
  if (!suite) {
    console.log('Skipping extra test run seed — no suites found.');
    return;
  }

  const suiteCases = db
    .prepare('SELECT test_case_id FROM suite_cases WHERE suite_id = ? ORDER BY sort_order ASC')
    .all(suite.id)
    .map((r) => r.test_case_id);

  if (suiteCases.length === 0) {
    console.log('Skipping extra test run seed — suite has no cases.');
    return;
  }

  const insertRun = db.prepare(
    'INSERT INTO test_runs_v2 (suite_id, status, start_time, end_time, created_by) VALUES (?, ?, ?, ?, ?)'
  );
  const insertResult = db.prepare(
    'INSERT INTO test_run_results (run_id, test_case_id, result, notes, failed_at, alert_sent) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const updateCounts = db.prepare('UPDATE test_runs_v2 SET pass_count = ?, fail_count = ?, skip_count = ? WHERE id = ?');

  const now = Date.now();
  let daysAgo = 62;

  OUTCOME_PLANS.forEach((outcomes) => {
    daysAgo -= 3;
    const startTime = new Date(now - daysAgo * 24 * 3600 * 1000).toISOString();
    const endTime = new Date(now - daysAgo * 24 * 3600 * 1000 + 4 * 60 * 1000).toISOString();

    const { lastInsertRowid: runId } = insertRun.run(suite.id, 'completed', startTime, endTime, CREATED_BY);

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

    updateCounts.run(passCount, failCount, skipCount, runId);
  });

  console.log(`Seeded ${OUTCOME_PLANS.length} extra test runs for suite ${suite.id}.`);
}

module.exports = seedExtraTestRuns;

if (require.main === module) {
  seedExtraTestRuns();
}
