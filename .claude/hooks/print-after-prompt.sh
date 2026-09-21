#!/usr/bin/env bash
# Stop hook: prints a fixed "Query executed successfully" confirmation, in
# dark orange, after every completed prompt.
set -euo pipefail

# Drain stdin (the hook input JSON) even though we don't need its contents.
cat > /dev/null || true

MESSAGE='Query executed successfully ✓'

DARK_ORANGE=$'\033[38;2;255;140;0m'
RESET=$'\033[0m'

# Write straight to the controlling terminal so the ANSI color actually
# renders. This is a no-op (not an error) wherever there's no controlling
# tty for the hook subprocess — confirmed to be the case in some
# environments, where the systemMessage fallback below is what actually
# reaches the user.
{ printf '%s%s%s\n' "$DARK_ORANGE" "$MESSAGE" "$RESET" > /dev/tty; } 2>/dev/null || true

jq -n --arg msg "$MESSAGE" '{systemMessage: $msg}'

exit 0
