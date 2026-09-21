---
description: Walk through filing a bug report and save it under tests/bugs/
---

Walk the user through creating a bug report, step by step. Ask one question at a time and wait for their reply before moving to the next:

1. **Title** — a short, descriptive name for the bug.
2. **Where** — which page/screen the bug occurred on.
3. **What you did** — the steps taken leading up to the bug (this becomes the numbered repro steps).
4. **What you expected** — the expected behavior.
5. **What actually happened** — the actual (buggy) behavior.
6. **Severity** — must be exactly one of: `Critical`, `Major`, `Minor`, `Trivial`. If the user gives something else, ask them to pick one of these four.

Once all pieces are collected, build the bug report using this exact format (use the current date/time for the timestamp):

```markdown
# {Title}

**Location:** {Where}
**Severity:** {Severity}
**Timestamp:** {YYYY-MM-DD HH:MM}

## Repro Steps
1. {step one}
2. {step two}
...

## Expected
{expected result}

## Actual
{actual result}
```

Then:
- Create the `tests/bugs/` directory if it doesn't already exist.
- Save the file as `tests/bugs/{YYYY-MM-DD}-{kebab-case-title}.md` (slugify the title; lowercase, spaces to hyphens, strip special characters), using today's date. If a file with that name already exists, append `-2`, `-3`, etc. so nothing is overwritten.
- Confirm to the user where the file was saved and show the final content.

Do not skip ahead or assume answers — always wait for the user's actual input at each step, and don't invent steps, expected/actual behavior, or severity on their behalf.
