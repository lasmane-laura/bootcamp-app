#!/usr/bin/env bash
# PostToolUse hook: warns (never blocks) when a JS/TS/React file is written or
# edited and appears to use non-standard severity words instead of this
# project's CLAUDE.md severity enum (Critical / Major / Minor / Trivial).
set -euo pipefail

input="$(cat)"
file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null || true)"

if [[ -z "$file_path" ]]; then
  exit 0
fi

case "$file_path" in
  *.js | *.jsx | *.ts | *.tsx) ;;
  *) exit 0 ;;
esac

if [[ ! -f "$file_path" ]]; then
  exit 0
fi

warnings=""

# "blocker" / "cosmetic" have no legitimate meaning anywhere in this project,
# so flag them unconditionally, anywhere in the file.
while IFS=: read -r lineno word; do
  [[ -z "$lineno" ]] && continue
  warnings="${warnings}line ${lineno}: found \"${word}\" — severity should be Critical/Major/Minor/Trivial\\n"
done < <(grep -inoE '\b(blocker|cosmetic)\b' "$file_path" || true)

# "high" / "medium" / "low" are also legitimate `priority` values in this
# project, so only flag them on the SAME line as the word "severity" (never
# a window across lines — severity/priority fields sit on adjacent lines
# throughout this codebase, e.g. `useState(initial?.priority || 'Medium')`
# right after a severity line, which is not a severity bug).
while IFS=: read -r lineno content; do
  [[ -z "$lineno" ]] && continue
  word="$(printf '%s' "$content" | grep -ioE '\b(high|medium|low)\b' | head -1 || true)"
  [[ -z "$word" ]] && continue
  warnings="${warnings}line ${lineno}: \"severity\" on the same line as \"${word}\" — severity should be Critical/Major/Minor/Trivial\\n"
done < <(grep -inE '\bseverity\b' "$file_path" | grep -iE '\b(high|medium|low)\b' || true)

if [[ -n "$warnings" ]]; then
  msg="CLAUDE.md severity-enum check ($(basename "$file_path")): found wording that may not match the Critical/Major/Minor/Trivial enum.\\n${warnings}This is advisory only — verify manually."
  jq -n --arg msg "$msg" '{systemMessage: $msg}'
fi

exit 0
