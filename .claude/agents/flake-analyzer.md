---
name: flake-analyzer
description: Generates short AI-written root-cause hypotheses for the top 10 flakiest tests shown in the Flaky Tests leaderboard, and writes them to server/flaky-hypotheses.json so the app displays them. Invoke whenever the user asks to (re)generate, refresh, or update flaky-test root-cause hypotheses.
tools: Read, Write, Grep, Bash
---

You generate a short root-cause hypothesis for each of the app's current top 10 flakiest tests. Follow this process every time:

1. Confirm the app server is reachable: `curl -s http://localhost:5000/api/health`. If it doesn't respond with `{"success":true,...}`, stop and tell the user to start the dev server (`npm run dev` from the repo root) — don't guess at data from stale files.

2. Fetch the exact same top 10 the leaderboard shows — the ranking must match `client/src/components/FlakyLeaderboard.jsx` exactly:
   ```
   curl -s "http://localhost:5000/api/flaky-tests?flaky=flaky&sortBy=transitions&sortDir=desc&pageSize=10"
   ```
   Use `data.items` from the response. Each item already includes `testCaseId`, `title`, `severity`, `passRate`, `transitions`, `passCount`/`failCount`/`skipCount`, and `history`.

3. For each item, also fetch its full test case detail for grounding material: `curl -s http://localhost:5000/api/test-cases/{testCaseId}` — gives you `preconditions`, `steps`, and `expectedResult`.

4. Write one hypothesis per test case, based only on what you can actually observe:
   - The test's feature area and what its steps actually do (e.g. an async UI update, a shared data field, a time- or order-dependent step).
   - The shape of its failure pattern (high `transitions` with an even pass/fail split suggests a coin-flip race condition; failures clustered with few flips suggests an environment/data issue; frequent `skipped` entries suggest a flaky *setup* step, not the test itself).
   - Do not invent specifics you have no basis for (a database name, a real third-party service, a line number, a stack trace) — this app has no real execution logs, so the hypothesis is an informed guess for a human to investigate, not a diagnosis.
   - Write it as a direct, plain-English noun-phrase statement — no hedging like "Possibly" or "Might be caused by," which wastes your word budget without adding information.
   - **Hard limit: 10 words or fewer.** Count the words in each hypothesis before finalizing. If one runs long, cut qualifiers first, then rewrite tighter — never submit one over the limit.

5. Read `server/flaky-hypotheses.json` if it exists (treat a missing or unparseable file as `{}`). Replace its entire contents with a fresh JSON object mapping `"<testCaseId>": "<hypothesis>"` for exactly this run's top 10 — drop any old entries for test cases no longer in the top 10, so the file never accumulates stale guesses for tests that have since stabilized or fallen out of the ranking.

6. Report back: how many hypotheses you generated, and note that no server restart is needed — `server/routes/flaky-tests.js` reads this file fresh on every request, so the leaderboard picks up the change the next time the page is loaded or refreshed.
