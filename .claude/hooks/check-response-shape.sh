#!/usr/bin/env bash
# PostToolUse hook: warns (never blocks) when a file under server/routes/ has been
# written or edited and appears to contain a response that doesn't follow the
# {success, data, error} envelope required by CLAUDE.md's API Response Shape.
set -euo pipefail

input="$(cat)"
file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null || true)"

# Only look at files under server/routes/
if [[ -z "$file_path" || "$file_path" != *"/server/routes/"* ]]; then
  exit 0
fi

if [[ ! -f "$file_path" ]]; then
  exit 0
fi

# bash 3.2 (macOS default) has no mapfile — build the array the portable way.
match_lines=()
while IFS= read -r ln; do
  [[ -n "$ln" ]] && match_lines+=("$ln")
done < <(grep -nE 'res\.(status\([^)]*\)\.)?json\(' "$file_path" | cut -d: -f1 || true)

total_lines="$(wc -l < "$file_path" | tr -d ' ')"
count="${#match_lines[@]}"

violations=""

for ((i = 0; i < count; i++)); do
  start="${match_lines[$i]}"
  next_index=$((i + 1))

  # Window ends just before the NEXT res.json(...) call, so we never pull in
  # a neighboring handler's success/data/error keys.
  if [[ $next_index -lt $count ]]; then
    end=$(( ${match_lines[$next_index]} - 1 ))
  else
    end=$((start + 9))
  fi

  max_end=$((start + 9))
  [[ $end -gt $max_end ]] && end=$max_end
  [[ $end -gt $total_lines ]] && end=$total_lines

  window="$(sed -n "${start},${end}p" "$file_path")"

  missing=""
  printf '%s' "$window" | grep -q '\bsuccess\b' || missing="${missing}success "
  printf '%s' "$window" | grep -q '\bdata\b' || missing="${missing}data "
  printf '%s' "$window" | grep -q '\berror\b' || missing="${missing}error "

  if [[ -n "$missing" ]]; then
    violations="${violations}line ${start}: response may be missing [${missing% }]\\n"
  fi
done

if [[ -n "$violations" ]]; then
  msg="CLAUDE.md response-shape check ($(basename "$file_path")): one or more responses may not follow the {success, data, error} envelope.\\n${violations}This is advisory only — verify manually."
  jq -n --arg msg "$msg" '{systemMessage: $msg}'
fi

exit 0
