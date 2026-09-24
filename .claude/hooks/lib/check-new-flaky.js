// Run from server/ (so `require('better-sqlite3')` resolves via server/node_modules).
// Invoked by .claude/hooks/test_run_results.sh after a Bash command that looks like
// it wrote test_run_results rows. Recomputes flakiness for every test case and posts
// a Discord alert for any test case that is newly flaky since the last time this
// script ran, tracked in a local state file (kept outside the sqlite db so it
// doesn't need a schema change).
//
// This exists specifically to catch flips caused by direct DB writes (seed scripts,
// ad-hoc node/sqlite3 one-liners run via Bash) that never go through the Express
// PATCH route in server/routes/test-runs.js, so that route's own new-flaky alert
// never fires for them. If the write instead went through a live PATCH request
// (e.g. this session curling the API), that route already sends its own alert —
// this script may fire a second, clearly-labeled one for the same transition since
// it has no way to know the other alert already went out.

const path = require('path');
const fs = require('fs');

process.loadEnvFile(path.join(__dirname, '../../../.env'));

const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, '../../../server/data.sqlite'));

const FLAKY_TRANSITIONS_THRESHOLD = 2; // must match server/routes/flaky-tests.js
const STATE_PATH = path.join(__dirname, '../.flaky-alert-state.json');

function computeFlakyTestCaseIds() {
  const rows = db
    .prepare(
      `SELECT trr.test_case_id, trr.result, tr.start_time
       FROM test_run_results trr
       JOIN test_runs_v2 tr ON tr.id = trr.run_id
       WHERE trr.result != 'pending'
       ORDER BY trr.test_case_id ASC, tr.start_time ASC, trr.run_id ASC`
    )
    .all();

  const byCase = new Map();
  for (const row of rows) {
    if (!byCase.has(row.test_case_id)) byCase.set(row.test_case_id, []);
    byCase.get(row.test_case_id).push(row.result);
  }

  const flakyIds = new Set();
  for (const [testCaseId, results] of byCase.entries()) {
    // Skips carry no pass/fail signal — must be excluded before counting
    // transitions, exactly like flaky-tests.js's `decided` filter and
    // test-runs.js's computeFlakinessForCase, or a passed->skipped->passed
    // run gets miscounted as 2 transitions despite never having failed.
    const decided = results.filter((r) => r === 'passed' || r === 'failed');
    let transitions = 0;
    for (let i = 1; i < decided.length; i++) {
      if (decided[i] !== decided[i - 1]) transitions++;
    }
    if (transitions >= FLAKY_TRANSITIONS_THRESHOLD) flakyIds.add(testCaseId);
  }
  return flakyIds;
}

function loadKnownFlakyIds() {
  try {
    return new Set(JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')));
  } catch {
    return new Set();
  }
}

function saveKnownFlakyIds(ids) {
  fs.writeFileSync(STATE_PATH, JSON.stringify([...ids].sort((a, b) => a - b), null, 2));
}

function suiteNamesFor(testCaseId) {
  const rows = db
    .prepare(
      `SELECT s.name FROM suite_cases sc JOIN suites s ON s.id = sc.suite_id WHERE sc.test_case_id = ?`
    )
    .all(testCaseId);
  return rows.map((r) => r.name).join(', ') || 'Unknown suite';
}

async function sendNewFlakyAlert(testCaseId, title) {
  const webhookUrl = process.env.DISCORD_FT_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const content = [
    '@everyone',
    `**⚠️ New flaky test detected:** ${title}`,
    `**Suite:** ${suiteNamesFor(testCaseId)}`,
    "**Warning:** This test's results have flipped between pass and fail multiple times — please investigate before trusting its results.",
    '**Detected by:** Claude Code hook (test_run_results.sh), outside a live test run',
  ].join('\n');

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, allowed_mentions: { parse: ['everyone'] } }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to post Discord new-flaky alert:', err.message);
    return false;
  }
}

async function main() {
  const currentFlakyIds = computeFlakyTestCaseIds();
  const knownFlakyIds = loadKnownFlakyIds();

  const newlyFlakyIds = [...currentFlakyIds].filter((id) => !knownFlakyIds.has(id));

  for (const testCaseId of newlyFlakyIds) {
    const testCase = db.prepare('SELECT title FROM test_cases WHERE id = ?').get(testCaseId);
    if (!testCase) continue;
    const sent = await sendNewFlakyAlert(testCaseId, testCase.title);
    if (sent) console.log(`test_run_results.sh: posted new-flaky alert for "${testCase.title}" (id ${testCaseId})`);
  }

  saveKnownFlakyIds(currentFlakyIds);
}

main()
  .catch((err) => {
    console.error('check-new-flaky.js failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
