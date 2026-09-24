# Extensive UI design audit across the whole app

## Prompt I typed

> Now, I want you to run an extensive UI design analysis. Go through all of the apps surfaces and identify any design related issues, including what elements do not fit the overall vibe - clean, minimalistic, professional. Take your time and let me know when you are finished. As as result, I want 5 suggestions for UI/design/visual improvements

## What Claude did

1. Grepped the codebase first for concrete leads: hardcoded hex colors outside the theme files, leftover emoji, and inconsistent `border-radius` values.
2. Dispatched a background (forked) agent with a directive covering every route and modal — Home, Test Cases, Test Suites + detail, Bugs + detail, Test Runs + detail, Flaky Tests, Dashboard, Reports + detail, Settings, and every dialog/row-action menu — checked in both light and dark mode.
3. Briefed the agent on the app's own established design conventions from earlier in the session (e.g. the deliberate fixed-color badge pattern in `SeverityBadge`/`FlakyBadge`) so it wouldn't misreport an intentional choice as a bug.
4. Read back the full findings list and condensed it into a ranked top 5.
5. Reported the top 5 back for review before touching any code.

## Result

The agent's top-5 output, verbatim:

1. **Fix the hardcoded borders app-wide.** Nearly every list page (Test Cases, Bugs, Test Suites, Test Runs, Reports, Flaky Tests, Import CSV) hardcodes `#ddd`/`#eee` for row dividers instead of `var(--border)`. In dark mode this turns into a bright, glowing line between every row.
2. **Remove the last two spots of the old blue brand color.** The bug-attachment dropzone's drag-over highlight and the Quick Search modal's active-row highlight still use the pre-rebrand blue, clashing with the moss-green identity everywhere else.
3. **Replace the raw emoji icons with the app's own icon style.** 🎬/📄 (attachment fallbacks) and 🔔 (alert indicator) clash with the restrained custom monoline SVGs used elsewhere.
4. **Extract one shared table/list-row style or component.** Every list page reimplements its own inline table styling, which is why the border bug above recurred independently on 7+ pages.
5. **Tone down the CSV import page's invalid-row styling** to match the app's small-pill color language instead of a full-row solid-red band.

This became the direct input to a follow-up prompt ("Fix all 5"), implemented in `client/src/index.css`, `client/src/pages/*.jsx`, `client/src/components/BugForm.jsx`, `client/src/components/QuickSearchModal.jsx`, and a new `client/src/components/AttachmentIcon.jsx`.
