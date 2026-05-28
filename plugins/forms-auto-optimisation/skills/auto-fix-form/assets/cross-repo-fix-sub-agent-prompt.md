# Cross-Repo Fix Sub-Agent Prompt Template

Used by **Phase 5.6** (`references/cross-repo-propagation.md`). The primary repo's fix has been applied; the impact-analyser identified this repo as a downstream consumer. Find whether the same root cause is present here and, if so, produce a minimal patch.

Return JSON per `shared/references/sub-agent-contract.md`.

```
You are producing a JavaScript patch for a DEPENDENT repo in an AEM Forms
multi-repo landscape. The impact-analyser graph identified this repo as
downstream of a file that was just fixed in the primary repo.

=== ORIGINAL ERROR (from primary repo) ===
Error type    : <type>
Error message : <message>
Primary file  : <file>    Line: <line>    Col: <col>
Source        : <source>   Impact: <count> views / <pct>% sessions

=== APPROVED FIX APPLIED IN PRIMARY REPO ===
Root cause    : <root_cause from Phase 3 plan>
Approach      : <approach from Phase 3 plan>
File patched  : <primary file_relative>
old_string    : <primary old_string>
new_string    : <primary new_string>
Explanation   : <primary explanation>

NOTE: Do NOT copy old_string / new_string verbatim. This repo may implement
the same pattern differently. The primary fix is a conceptual reference.

=== DEPENDENT REPO ===
Repo name     : <REPO_NAME from IA codeChanges>
Repo path     : <CROSS_REPO_PATH>
IA graph trail: <trail> — why IA linked this repo to the changed file

Steps:
1. SEARCH for analogous code (Grep / Glob). Start with the symbol name from
   the IA trail, then narrow to the most likely candidate files. Read them
   to confirm the pattern.
2. DECIDE:
   A. Same root cause present → produce a patch.
   B. Already guarded / fixed differently / pattern absent → return
      needs_review with analysis "no analogous pattern found" or
      "already guarded at <file:line>".
   C. Structurally too different to assess → return needs_review explaining
      what you found and what a reviewer should verify.
3. PATCH (case A only):
   - Smallest patch that fixes the analogous root cause in THIS repo.
   - Validate old_string appears EXACTLY ONCE; expand context if needed.
   - Do not add imports / comments / formatting outside patched lines.
   - Vendored paths (/node_modules/, /dist/, /target/) → needs_review.

Return JSON per shared/references/sub-agent-contract.md — either the patch
shape `{file_relative, old_string, new_string, explanation}` or
`{needs_review: true, file_relative: ..., analysis: "..."}`.

If you're uncertain whether a match is genuine or coincidental, return
needs_review. False positives in dependent repos are worse than false
negatives.

Constraints:
- Read-only. The orchestrator handles Edit, commit, push.
- Touch one file only. If multiple files need changes, return needs_review
  listing them; the orchestrator will re-spawn as needed.
- This sub-agent does not touch the primary repo.
```

## Parallelism

- Different repos → parallel.
- Same repo, multiple errors → sequential; re-read between sub-agents.

## Orchestrator-side aggregation

Per `shared/references/sub-agent-contract.md`. Inside `CROSS_REPO_PATH`: `Read` → verify uniqueness → `Edit`. Track in `crossFixedFiles[REPO_NAME]`. `needs_review` results go to `crossRepoNeedsReview[REPO_NAME]` and surface in both the primary PR and the cross-repo PR body.
