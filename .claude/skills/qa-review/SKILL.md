---
name: qa-review
description: skill that auto-triggers QA reviews, for example, testing changes made in code, spotting missing cases etc.
---

Review code or a feature from a tester's angle — not a general code-quality or architecture review (use a dedicated code-review skill for that). Trigger this skill whenever the user asks for a QA review, to check recent changes for test coverage gaps, or to spot what a tester would flag before sign-off.

## Scope

Unless the user names a specific file, feature, or PR, review the current diff (uncommitted changes, or the latest commit if the working tree is clean). If they name a target, review that instead.

## What to look for

Go through each category below. Skip a category only if it genuinely doesn't apply, and don't pad the list with non-issues just to fill a category.

1. **Missing validation** — required fields that aren't checked, no length/format/type constraints enforced, business rules (e.g. allowed domains, numeric ranges) not validated, validation only on the client with no server-side check (or vice versa).
2. **Missing error handling** — unhandled promise rejections, uncaught exceptions, network/API failures with no fallback, silent failures where the user gets no feedback that something went wrong.
3. **Unclear user messages** — vague errors ("Something went wrong"), messages that don't say what to do next, technical jargon or raw error objects shown to the user, missing success confirmation after an action.
4. **Missing confirmation dialogs for destructive actions** — delete, bulk actions, discarding unsaved changes, or any irreversible state change that lets the user proceed without a chance to back out.
5. **Accessibility issues** — missing alt text on images, missing form labels or `aria-*` attributes, interactive elements not reachable/operable by keyboard, focus not managed after a dialog opens/closes, information conveyed by color alone, insufficient contrast.

For each issue found, briefly note: what's wrong, where (file and line if identifiable), and the concrete failure scenario a tester would use to justify it (what a user does, what breaks).

## Output format

Group findings into a structured list under the four severity levels from this project's `CLAUDE.md`, in this order, omitting any level with no findings:

```
## Critical
- <file:line> — <what's wrong> — <failure scenario>

## Major
- <file:line> — <what's wrong> — <failure scenario>

## Minor
- <file:line> — <what's wrong> — <failure scenario>

## Trivial
- <file:line> — <what's wrong> — <failure scenario>
```

Use CLAUDE.md's definitions to decide severity:
- **Critical** — blocks core functionality or causes data loss; no workaround exists.
- **Major** — breaks an important feature or flow; a workaround may exist but is painful.
- **Minor** — a small functional defect that doesn't block usage.
- **Trivial** — cosmetic or negligible issue with no functional impact.

If no issues are found at all, say so plainly instead of inventing filler findings.
