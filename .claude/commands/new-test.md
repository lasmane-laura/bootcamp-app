---
description: Walk through writing a manual test case and save it under tests/manual/
---

Walk the user through creating a manual test case, step by step. Ask one question at a time and wait for their reply before moving to the next:

1. **Title** — a short, descriptive name for the test case.
2. **Steps** — the steps to execute, ask the user to provide them (they can give them all at once or one at a time). Number them in the final output.
3. **Expected result** — what should happen if the test passes.
4. **Severity** — must be exactly one of: `Critical`, `Major`, `Minor`, `Trivial`. If the user gives something else, ask them to pick one of these four.

Once all four pieces are collected, build the test case using this exact format:

```markdown
# {Title}

**Severity:** {Severity}

## Steps
1. {step one}
2. {step two}
...

## Expected Result
{expected result}
```

Then:
- Create the `tests/manual/` directory if it doesn't already exist.
- Save the file as `tests/manual/{kebab-case-title}.md` (slugify the title; lowercase, spaces to hyphens, strip special characters). If a file with that name already exists, append `-2`, `-3`, etc. so nothing is overwritten.
- Confirm to the user where the file was saved and show the final content.

Do not skip ahead or assume answers — always wait for the user's actual input at each step, and don't invent steps or an expected result on their behalf.
