const db = require('./db');

// A second batch of runs for the 4 new suites (server/seed-test-runs-new-suites.js
// was the first batch of 30) — extends the history further into the past so the
// two batches read as one continuous timeline with no date overlap.

const CREATED_BY = 'seed-new-suites-30-more';

function stablePass(n) {
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? 'failed' : 'passed'));
}

function stableFail(n) {
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? 'passed' : 'failed'));
}

function flakyFrequent(n) {
  return Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 'passed' : 'failed'));
}

function flakyModerate(n) {
  const blip1 = Math.floor(n / 3);
  const blip2 = Math.floor((2 * n) / 3);
  return Array.from({ length: n }, (_, i) => (i === blip1 || i === blip2 ? 'failed' : 'passed'));
}

function mostlySkippedStablePass(n) {
  return Array.from({ length: n }, (_, i) => (i % 3 === 0 ? 'skipped' : 'passed'));
}

const ROLES = [stablePass, stableFail, flakyFrequent, flakyModerate, mostlySkippedStablePass];

const SUITE_RUN_COUNTS = {
  'Checkout & payment suite': 8,
  'Search & filtering suite': 8,
  'Notifications suite': 7,
  'Admin & user management suite': 7,
};

function seedMoreNewSuiteRuns() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM test_runs_v2 WHERE created_by = ?').get(CREATED_BY);
  if (count > 0) {
    console.log(`Skipping second new-suite run batch — already tagged '${CREATED_BY}'.`);
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
  let totalSeeded = 0;

  Object.entries(SUITE_RUN_COUNTS).forEach(([suiteName, runCount]) => {
    const suite = db.prepare('SELECT id FROM suites WHERE name = ?').get(suiteName);
    if (!suite) {
      console.log(`Skipping runs for "${suiteName}" — suite not found.`);
      return;
    }

    const suiteCases = db
      .prepare('SELECT test_case_id FROM suite_cases WHERE suite_id = ? ORDER BY sort_order ASC')
      .all(suite.id)
      .map((r) => r.test_case_id);

    if (suiteCases.length === 0) return;

    const caseSequences = suiteCases.map((_, i) => ROLES[i % ROLES.length](runCount));

    // First batch used daysAgo starting at runCount*2+1 counting down by 2 to 1.
    // Start this batch further back so it's strictly older, same 2-day cadence.
    let daysAgo = runCount * 4 + 1;

    for (let runIndex = 0; runIndex < runCount; runIndex++) {
      daysAgo -= 2;
      const startTime = new Date(now - daysAgo * 24 * 3600 * 1000).toISOString();
      const endTime = new Date(now - daysAgo * 24 * 3600 * 1000 + 4 * 60 * 1000).toISOString();

      const { lastInsertRowid: runId } = insertRun.run(suite.id, 'completed', startTime, endTime, CREATED_BY);

      let passCount = 0;
      let failCount = 0;
      let skipCount = 0;

      suiteCases.forEach((testCaseId, caseIndex) => {
        const outcome = caseSequences[caseIndex][runIndex];
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
      totalSeeded++;
    }
  });

  console.log(`Seeded ${totalSeeded} more test runs across the new suites.`);
}

module.exports = seedMoreNewSuiteRuns;

if (require.main === module) {
  seedMoreNewSuiteRuns();
}
