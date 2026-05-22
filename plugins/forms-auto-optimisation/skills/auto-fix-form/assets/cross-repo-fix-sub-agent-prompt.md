# Cross-Repo Fix Sub-Agent Prompt Template

Used by **Phase 5.6** of `auto-fix-form`. The primary repo's fix has already been applied and the impact-analyser identified this repo as a downstream consumer. Your job is to find whether the same or an analogous bug exists here and, if so, produce a minimal patch.

Substitute bracketed values before invoking the `Agent` tool.

```
You are producing a JavaScript patch for a DEPENDENT repo in an AEM Forms multi-repo
landscape. The impact-analyser graph identified this repo as downstream of a file that
was just fixed in the primary repo. Your job: find whether the same root cause exists
here and, if so, return the smallest patch that fixes it.

=== ORIGINAL ERROR (from primary repo) ===
Error type    : <type>
Error message : <message>
Primary file  : <file>    Line: <line>    Col: <col>
Source        : <source>   Impact: <count> views / <pct>% sessions (omit if unknown)

=== APPROVED FIX APPLIED IN PRIMARY REPO ===
Root cause    : <root_cause from Phase 3 plan>
Approach      : <approach from Phase 3 plan>
File patched  : <primary file_relative>
old_string    : <old_string from Phase 4 patch>
new_string    : <new_string from Phase 4 patch>
Explanation   : <explanation from Phase 4 patch>

NOTE: Do NOT copy old_string / new_string verbatim. This repo may implement the
same pattern differently. Use the primary fix as a conceptual reference only.

=== DEPENDENT REPO ===
Repo name     : <REPO_NAME from IA codeChanges>
Repo path     : <CROSS_REPO_PATH>
IA graph trail: <trail> — why the impact-analyser linked this repo to the changed file
                (e.g. "← Calls ← MavenDependsOn ← (changed)")

=== YOUR TASK ===

Step 1 — SEARCH for analogous code.
  Use Grep / Glob to locate files in <CROSS_REPO_PATH> that:
  - Implement or extend the same class / function mentioned in the IA trail.
  - Use the same API that caused the primary error (e.g., the method called on line
    <line> of <file>).
  - Share the same clientlib category, resourceType, or OSGi service as the changed file.
  Start broad (symbol name grep), then narrow to the most likely candidate files.
  Read them to confirm the pattern.

Step 2 — DECIDE.
  A) Same root cause present → produce a patch (Step 3).
  B) Code is already correct (fixed by a different mechanism, uses a defensive wrapper,
     or the pattern simply does not appear) → return needs_review with analysis "no
     analogous pattern found" or "already guarded at <file:line>".
  C) Code is structurally too different to assess confidently → return needs_review
     with analysis explaining what you found and what a human reviewer should check.

Step 3 — PATCH (only if Step 2 → A).
  - Produce the SMALLEST patch that fixes the analogous root cause in this repo.
  - Follow the same approved approach as the primary fix, but adapted to this code.
  - Validate that old_string appears EXACTLY ONCE in the file. If not, expand it with
    1-2 lines of surrounding context until it is unique.
  - Do NOT introduce imports, comments, or formatting changes outside the patched lines.
  - Do NOT touch files under /node_modules/, /dist/, /target/, or any vendored path.

Return ONLY one of these two JSON shapes (no prose, no markdown fences):

{
  "file_relative" : "path/from/repo/root/to/file.js",
  "old_string"    : "...",
  "new_string"    : "...",
  "explanation"   : "one sentence — what this fixes and how it parallels the primary error"
}

or

{
  "needs_review"  : true,
  "file_relative" : "<most relevant file found, or 'unknown'>",
  "analysis"      : "what you found, why a patch was not produced, what a human
                     reviewer should verify"
}

Constraints:
- Do NOT call Edit, Write, or any shell/MCP tool beyond Read / Grep / Glob.
- Do NOT re-derive root cause or approach — use what is given above.
- Do NOT touch more than one file. If multiple files need changes, return needs_review
  with a list — the orchestrator will handle sequencing.
- If you are uncertain whether a match is genuine or coincidental, return needs_review.
  False positives in dependent repos are worse than false negatives.
```

## Parallelism rules (orchestrator)

- **Different repos** → spawn all cross-repo sub-agents in parallel (single message, multiple `Agent` tool uses).
- **Same repo, multiple errors** → sequential; re-read between sub-agents so each sees fresh state.
- Within a single repo: if the same error affects multiple files in that repo, return all patches in a single `needs_review` with a list — the orchestrator will re-spawn as needed.

## Orchestrator-side aggregation (Phase 5.6.4)

For each non-`needs_review` result:

1. `Read(<CROSS_REPO_PATH>/<file_relative>)` — fresh read.
2. Verify `old_string` appears exactly once. If multiple matches, expand context (re-spawn sub-agent once; if still not unique → `needs_review`).
3. `Edit(<CROSS_REPO_PATH>/<file_relative>, old_string, new_string)`.
4. Append `<file_relative>` to `crossFixedFiles[REPO_NAME]` (de-duplicated).
5. Record `{file, explanation}` for the cross-repo PR body's "Errors fixed" table.

`needs_review` results go to `crossRepoNeedsReview[REPO_NAME]` and surface in the primary PR's "Manual review needed" section and the cross-repo PR body.

## What this sub-agent never does

- It does not run perf-bot. That is Phase 5.6.5.
- It does not commit, push, or open a PR. Those are Phase 5.6.6.
- It does not touch the primary repo — only `<CROSS_REPO_PATH>`.
- It does not invent fixes for patterns it cannot locate in the dependent repo.
