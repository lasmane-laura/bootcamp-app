---
description: Capture a test plan request for a new feature and save it under tests/tp/
---

Conduct a structured intake for a new feature test plan request. Ask the questions below one at a time, in order, and wait for the user's response before proceeding to the next. Use professional, technical phrasing throughout — this is a formal test plan intake, not a casual checklist.

1. **Title** — the title of the test plan / feature under test.
2. **Feature summary** — a short technical description of the feature being introduced or modified.
3. **Product** — which product this test plan applies to.
4. **Platform** — the target platform(s) (e.g. Web, iOS, Android, API).
5. **Test type** — must be exactly one of: `Smoke`, `Regression`. If the user gives something else, ask them to pick one of the two.
6. **Requested by** — the name or role of the person/team requesting this test plan.
7. **Scoped flows** — ask: "Did the requester specify particular flows that must be covered? (y/n)". If yes, follow up and ask which flows, and record them as a list. If no, record "None specified — coverage to be determined by QA."
8. **Execution cadence** — must be exactly one of: `Daily`, `Weekly`, `Biweekly`, `Monthly`. If the user gives something else, ask them to pick one of the four.
9. **Deadline** — the target completion date for this test plan.
10. **Environment / build** — which environment or build version this test plan targets (e.g. staging, build number). If the user doesn't have one yet, record "Not yet specified."
11. **Reference ticket** — any associated ticket/issue link (Jira, Linear, GitHub, etc.), if applicable. If none, record "N/A."

Once all fields are collected, assemble the test plan request using this exact format (use the current date/time for the timestamp):

```markdown
# Test Plan Request: {Title}

**Timestamp:** {YYYY-MM-DD HH:MM}
**Requested By:** {Requested by}
**Deadline:** {Deadline}

## Feature Overview
{Feature summary}

## Scope
- **Product:** {Product}
- **Platform:** {Platform}
- **Test Type:** {Test type}
- **Environment / Build:** {Environment / build}
- **Reference Ticket:** {Reference ticket}

## Flow Coverage
{Either "The following flows were explicitly requested for coverage:" followed by a bulleted list of the named flows, or "None specified — coverage to be determined by QA." if no flows were named.}

## Execution Cadence
{Cadence}
```

Then:
- Create the `tests/tp/` directory if it doesn't already exist.
- Save the file as `tests/tp/{kebab-case-title}.md` (slugify the title; lowercase, spaces to hyphens, strip special characters). If a file with that name already exists, append `-2`, `-3`, etc. so nothing is overwritten.
- Confirm to the user where the file was saved and show the final content.

Do not skip ahead or assume answers — always wait for the user's actual input at each step, and don't invent scope, flows, cadence, or deadlines on their behalf.
