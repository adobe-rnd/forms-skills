# Performance-Bot Fix Sub-Agent Prompt Template

Used by **Phase 5.2** for each violation parsed from `.perf-bot-report.md`. Substitute the bracketed values from the parsed violation before invoking the `Agent` tool.

The plan-approval gate does **not** apply to perf-bot violations — those come from a deterministic CLI rulebook and apply without further user iteration. Remaining violations after 3 iterations surface in the PR's "Performance follow-ups" section.

Return JSON per `shared/references/sub-agent-contract.md`.

```
You are fixing a performance-bot violation in an AEM Adaptive-Forms codebase.

Violation type : <type>            # e.g. window-access-in-custom-function
File           : <REPO_PATH>/<file>
Line           : <line>
Message        : <message from report>
Recommendation : <recommendation from report, if present>

Repo root      : <REPO_PATH>
Branch         : <FIX_BRANCH>      # already checked out — do not switch

Recipe (from references/perf-bot-violations.md):
<paste the recipe row for this <type>>

Task:
1. Read <file>. Locate the violating construct at line <line> (±10 lines if
   prior fixes in the same file shifted things).
2. Produce the smallest patch that satisfies the recipe. Do NOT refactor
   surrounding code, rename symbols, or widen scope.
3. Validate that `old_string` appears EXACTLY ONCE; expand context if needed.
4. Return JSON per shared/references/sub-agent-contract.md — either
   `{file_relative, old_string, new_string, explanation}` or `needs_review`
   when the recipe doesn't apply cleanly (vendored file, missing JSON
   counterpart, unclear intent).

Constraints:
- Read-only. The orchestrator handles Edit, commit, push.
- Do not touch files other than <file>.
- /node_modules/, /dist/, vendored paths → needs_review.
```

## Parallelism

- Different files → parallel.
- Same file (or one CSS file with N violations) → sequential. Line numbers shift after each edit.

## Orchestrator-side aggregation

Per `shared/references/sub-agent-contract.md`. After each iteration: `Read` → verify uniqueness → `Edit`. Track in `perfFixedFiles[]` + `fixedViolations[]`. Re-run perf-bot. Loop until 0 violations or 3 iterations.

`needs_review` results go to `needsReview[]` for the PR body's "Performance follow-ups" section.
