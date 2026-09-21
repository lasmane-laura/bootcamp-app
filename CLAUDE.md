# CLAUDE.md

## Stack
React (Vite) client + Express server, npm workspaces monorepo (`client/`, `server/`).

## Severity Levels
- **Critical** — blocks core functionality or causes data loss; no workaround exists.
- **Major** — breaks an important feature or flow; a workaround may exist but is painful.
- **Minor** — a small functional defect that doesn't block usage.
- **Trivial** — cosmetic or negligible issue with no functional impact.

## Test Case Fields
- **Title** — short, descriptive name for the test case.
- **Preconditions** — state required before the test can be run.
- **Steps** — numbered actions to execute.
- **Expected Result** — what should happen if the test passes.
- **Severity** — Critical / Major / Minor / Trivial.
- **Status** — draft / ready / passed / failed / skipped.

## Bug Report Fields
- **Title** — short, descriptive name for the bug.
- **Steps to Reproduce** — numbered actions leading to the bug.
- **Expected** — what should have happened.
- **Actual** — what actually happened.
- **Severity** — Critical / Major / Minor / Trivial.
- **Status** — open / in-progress / resolved / closed / reopened.

## API Response Shape
Every endpoint returns:
```json
{ "success": boolean, "data": any, "error": string | null }
```

## File Naming
- Files: `kebab-case` (e.g. `user-profile.js`)
- React components: `PascalCase` (e.g. `UserProfile.jsx`)
- API handlers: `handleVerbNoun` (e.g. `handleCreateUser`)

## Voice
Test cases and bug reports are written in clear, direct English. No buzzwords, no filler. State what happened and what's expected — nothing else. Use sentence case when referring to UI elements (e.g. Login page). Keep steps simple, using imperative mood, starting with the action. Each step should have only one action. If there is more than one expected result, they should be in a bullet list.
