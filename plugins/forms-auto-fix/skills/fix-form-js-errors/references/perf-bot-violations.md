---
name: perf-bot-violations
description: Maps each performance-bot --diff HEAD violation type to a fix recipe used by the Phase 5.2 sub-agents of fix-form-js-errors.
type: reference
---

# Performance-Bot Violation Recipes

Used by **Phase 5** of `fix-form-js-errors` — after Phase 4.3 has applied the approved error fixes to the working tree but **not yet committed them**, and before the single combined commit at Phase 6.1. The CLI is local-only and reads only git-changed JS/CSS — no URL, no browser.

## Install + run via the shared helper

```bash
bash ../../shared/scripts/perf-bot.sh --mode install
bash ../../shared/scripts/perf-bot.sh --mode run --repo "$REPO_PATH"
```

The helper installs the CLI into `${HOME}/.performance-bot/` on first call, ensures `.perf-bot-report.md` is in `.gitignore`, then runs `--diff HEAD` and writes the report to `<repo>/.perf-bot-report.md`. It prints a one-line JSON summary including `violations` (line count of `- ⚠`).

`--diff HEAD` diffs the working tree (uncommitted changes) against the current `HEAD` commit. Because the fix-form-js-errors orchestrator **defers** the combined commit to Phase 6, `HEAD` still points at `BASE_BRANCH`'s tip during the perf-bot loop — so this command captures all uncommitted error+perf changes in one cumulative scan.

The CLI exits `0` even when violations are found, so the report file MUST be parsed. Iteration N+1 sees iteration N's uncommitted edits — that's intentional.

## Parsing the report

The report is markdown. Violation lines start with `  - ⚠` and live under one of these section headers:

- `## Custom Functions` — `window-access-in-custom-function`, `dom-access-in-custom-function`, `http-request-in-custom-function`, `custom-event-in-custom-function`, `bulk-set-property-use-import-data`
- `## Form CSS` — `css-background-image`, `inline-data-uri`, `excessive-important`, `deep-selector`, `duplicate-selector`, `css-import-blocking`, `inline-font-blocking`, `hardcoded-colors`, `large-css-file`, `non-composited-animation`, `missing-will-change`
- `## Hidden Fields` — `unnecessary-hidden-field`, `static-false-visibility`
- `## Runtime CLS` — runtime issues (rare in pure --diff JS-only mode)
- `## Block Decorators` — `block-decorator-input-mutation` (rendered by Custom Functions or Runtime CLS section depending on version — match by `type`, not by header)

Each line typically contains the file path, line number, and violation type. To get the canonical record (with full `details` array, recommendation, etc.) re-grep `./.perf-bot-report.md` for the line, then read the surrounding lines.

For deterministic parsing, the skill should:

1. Read `.perf-bot-report.md` end-to-end.
2. Count violations as the number of `- ⚠` lines under the four sections above.
3. For each violation, capture: section header, file (in backticks), line, and the message text after the warning glyph.

If the count is `0`, exit Phase 5.2 and proceed directly to the combined commit at Phase 6.1. Otherwise spawn one sub-agent per violation (parallelism rules from Phase 4.2 apply — different files in parallel, same file sequential).

## Fix recipes

### A. Custom-function violations

These are JS files referenced from the form's `customFunctionsPath` (typically `blocks/custom-functions/functions.js`). The fix is always **inside** the function body — never the call site.

| `type` | Replace with | Why |
|--------|--------------|-----|
| `window-access-in-custom-function` | Receive the value via the function signature (`globals.functions.*`, `globals.form`, the field arg passed by the rule) instead of reaching into `window.*`. Remove the access. | Custom functions must be portable to headless / server-side runtimes where `window` does not exist. |
| `dom-access-in-custom-function` | Read/write the form **model** (`globals.functions.setProperty(field, 'value', x)` / `field.$value`) instead of `document.querySelector(...)`. If the visual change cannot be expressed via the model, move the logic to a **custom component** (`blocks/form/components/<name>/<name>.js`). | Same headless argument; also keeps DOM and model in sync. |
| `http-request-in-custom-function` | `globals.functions.request(invokeServiceName, payload, successHandler, failureHandler)` — the **API tool** registered in `functions.js`. Never `fetch` / `XMLHttpRequest` / `axios`. | The API tool wires loading-state, error display, and Invoke-Service auth automatically. |
| `custom-event-in-custom-function` | `globals.functions.dispatchEvent(globals.form, 'custom:eventName', payload)`. Drop `new CustomEvent(...)` + `dispatchEvent(...)`. | Rule-Editor `When: custom:eventName` listens on the AF model bus; DOM `CustomEvent` never reaches it. |
| `bulk-set-property-use-import-data` | One `globals.functions.importData(parentField, { fieldA: a, fieldB: b, … })` instead of N sequential `setProperty` calls. | Each `setProperty` triggers a model recompute; `importData` batches them. |

### B. CSS violations

| `type` | Fix | Notes |
|--------|-----|-------|
| `css-background-image` | Remove the `background-image: url(...)` rule. The image must be authored as an `<Image>` component in the page so it gets lazy-loading + `srcset`. If it must stay in CSS (e.g. icon sprite), move it to an `Image`-backed div via the form's image fragment. | The recommendation field carries the captured `selector` — use it to locate the rule. |
| `inline-data-uri` | Extract the data URI to a file in `/icons` or `/img` and reference it with a normal `url('/icons/foo.svg')`. Threshold is 5 KB. | Dimensions and MIME come from the data URI prefix. |
| `excessive-important` | Increase selector specificity (e.g. add the block's wrapper class) and drop `!important`. | One sub-agent per file is fine — fixes are local. |
| `deep-selector` | Flatten the selector to ≤ 4 levels. Prefer scoping by a wrapper class. | |
| `duplicate-selector` | Merge the duplicate rule blocks. | |
| `css-import-blocking` | Remove `@import` and let the build bundle the imported file (add it to the project's CSS entrypoint). | |
| `inline-font-blocking` | Replace the inline `data:font/...` with an `@font-face` rule pointing at a `.woff2` file in `/fonts`. | |
| `hardcoded-colors` | Define CSS variables in `:root` (or the design-token file) and reference them. Threshold-based; only fix the listed values. | |
| `large-css-file` | Split into module-scoped files; load per-block. | Often a `needs_review` — flag it. |

### C. Hidden-field violations

| `type` | Fix |
|--------|-----|
| `unnecessary-hidden-field` | If the field is required for submission, add a visibility rule that toggles it (or set `visible: false` on a *non-required* sibling). If it is dead weight, **remove it from the form JSON**. The fix lives in the form authoring, not the JS — the sub-agent should propose a JSON edit if the form JSON is in the changed-files set, otherwise mark `needs_review: true` with a one-line recommendation. |
| `static-false-visibility` | Same as above — the field is visible: false at author time and never toggled. |

### D. Block-decorator violation

| `type` | Fix |
|--------|-----|
| `block-decorator-input-mutation` | After the `event.target.value = X` assignment, dispatch a synthetic change event so the runtime model picks up the new value: `event.target.dispatchEvent(new Event('change', { bubbles: true }));`. If the intent is to **prevent** the keystroke, use a `beforeinput` handler with `event.preventDefault()` instead — never mutate value in `input` / `keydown` / `keyup`. |

## When to flag `needs_review`

A sub-agent must return `needs_review: true` (rather than guess) when:

- The fix requires a JSON edit but no JSON file is in the changed-file set.
- The violation lives in a third-party file (`/node_modules/`, `/dist/`, vendored libs).
- The recommended replacement (e.g. moving DOM logic to a custom component) needs new files.
- The CSS rule's intent is unclear (e.g. `large-css-file` with no obvious split).

Phase 5 collects `needs_review` items and adds them to the **PR body's "Performance follow-ups"** section instead of failing the run.

## Iteration cap

Phase 5.2 runs the perf-bot, applies fixes, re-runs, applies fixes — **at most 3 iterations**. After iteration 3 any remaining violations are listed under "Performance follow-ups" in the PR body and the combined commit (Phase 6.1) + PR are opened anyway. This prevents infinite loops when a violation cannot be auto-fixed.
