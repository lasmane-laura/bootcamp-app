#!/usr/bin/env bash
# PostToolUse hook: after a Bash command that looks like it wrote test_run_results
# rows (directly against server/data.sqlite, e.g. a seed script or an ad-hoc
# node/sqlite3 one-liner), recompute flakiness for every test case and post a
# Discord "new flaky test" alert for anything that just crossed the threshold.
#
# This only ever fires for tool calls this Claude Code session makes — it cannot
# see real app usage in a separately running server process. Its purpose is
# narrower: catch flaky-transitions caused by writes that bypass the Express PATCH
# route in server/routes/test-runs.js (which already alerts for its own writes),
# such as seed scripts run directly via Bash. See lib/check-new-flaky.js for the
# double-alert caveat when a Bash command instead curls the live API.
set -euo pipefail

input="$(cat)"
command="$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"

if [[ -z "$command" ]]; then
  exit 0
fi

# Cheap gate so we don't spin up node+sqlite on every unrelated Bash call.
if ! [[ "$command" == *"test_run_results"* || "$command" == *"data.sqlite"* || "$command" == *"seed-test-runs"* ]]; then
  exit 0
fi

project_dir="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

output="$(cd "$project_dir/server" && node "$project_dir/.claude/hooks/lib/check-new-flaky.js" 2>&1 || true)"

if [[ -n "$output" ]]; then
  jq -n --arg msg "test_run_results.sh: ${output}" '{systemMessage: $msg}'
fi

exit 0
