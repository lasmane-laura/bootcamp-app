# QA-reviewing the Flaky Test Tracker

## Prompt I typed

> Now i want you to review as a QA the flaky test tracker, analyse what could go wrong. List top 5 largest issues and fix them, if possible

## What Claude did

1. Dispatched the `qa-reviewer` agent (`.claude/agents/qa-reviewer.md`), scoped to the Flaky Test Tracker feature: `server/routes/flaky-tests.js`, `server/routes/test-runs.js`, `server/db.js`, `FlakyTestTrackerPage.jsx`, `FlakyBadge.jsx`, `RunHistoryDots.jsx`, and the related Claude Code hook `.claude/hooks/lib/check-new-flaky.js`.
2. Read the report back and triaged all 5 findings by severity.
3. Fixed finding #1 (Critical) — added a pre-delete check in `server/routes/suites.js` and a specific warning in `client/src/pages/TestSuitesPage.jsx` before deleting a suite that would corrupt shared test cases' flaky history.
4. Fixed finding #2 (Major) — corrected `.claude/hooks/lib/check-new-flaky.js` to filter out `skipped` results before counting transitions.
5. Fixed finding #3 (Major) — closed a race condition in `server/routes/test-runs.js`'s `handleUpdateResult` by snapshotting the flaky check before any `await`.
6. Fixed finding #4 (Minor) — rejected non-finite `durationMs` values in the same file.
7. Fixed finding #5 (Minor) — added `role="img"`/`aria-label` to `client/src/components/RunHistoryDots.jsx`.
8. Verified fix #2 with a live regression test rather than trusting the diff: inserted a temporary test case with a `passed → skipped → passed` history (which used to wrongly count as 2 transitions) and re-ran the hook's logic against it.

## Result

Files changed: `server/routes/suites.js`, `client/src/pages/TestSuitesPage.jsx`, `.claude/hooks/lib/check-new-flaky.js`, `server/routes/test-runs.js`, `client/src/components/RunHistoryDots.jsx`.

Regression-test output confirming fix #2, run against the `passed → skipped → passed` history:

```
decided sequence: [ 'passed', 'passed' ] transitions: 0 isFlaky: false
```

0 transitions, correctly classified Stable — before the fix this same history counted 2 transitions and would have wrongly fired a Discord "new flaky test" alert.
