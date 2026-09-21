---
name: test-generator
description: skill to auto-generate test cases upon mention of them
---

Generate test cases using ISTQB boundary-value analysis and equivalence partitioning. Trigger this skill whenever the user asks for test cases, a test plan for a specific input/field/flow, or to "test" a feature.

## Analysis approach

For each input or flow under test, work through these categories systematically. Skip a category only if it genuinely does not apply (e.g. no numeric bounds exist), and say so briefly rather than silently omitting it.

1. **Happy path** — the normal, expected use of the feature with valid input.
2. **Boundary values** (for any bounded field — length, numeric range, date range, etc.):
   - Minimum valid value
   - Maximum valid value
   - Minimum − 1 (just below the valid range)
   - Maximum + 1 (just above the valid range)
   - Empty value
   - Whitespace-only value
   - Very long value (well beyond the maximum, to check for overflow/truncation issues)
3. **Equivalence partitions** — one representative case per distinct class of valid and invalid input (e.g. valid email format vs. malformed email vs. empty domain), beyond the specific boundaries already covered above.
4. **Negative cases**:
   - Wrong data type (e.g. string where a number is expected)
   - Missing required field
   - Duplicate value where uniqueness is required

## Output format

Use the test case shape defined in this project's `CLAUDE.md`. Produce one test case per scenario, as plain readable text (not a code block), in this format:

```
Title: <short, descriptive name of the scenario>

Preconditions: <state required before the test can be run, or omit if none>

Steps:
1. <numbered, imperative action>
2. <numbered, imperative action>

Expected Result: <what should happen if the test passes>

Severity: <Critical | Major | Minor | Trivial>

Status: draft
```

Guidance for assigning severity:
- **Critical** — happy path scenarios covering the feature's core purpose, and negative cases that could cause data loss or corruption if unhandled.
- **Major** — boundary violations (min−1, max+1, wrong type, missing required, duplicate) that should be rejected but aren't catastrophic if missed.
- **Minor** — boundary edges that are valid (exact min/max) and less common equivalence partitions.
- **Trivial** — cosmetic or very low-impact edge cases (e.g. whitespace-only input where trimming is expected).

Status is always `draft` for newly generated test cases, since they haven't been reviewed or run yet.

Group the output under headings by category (Happy path / Boundary values / Equivalence partitions / Negative cases) so the set is easy to scan.
