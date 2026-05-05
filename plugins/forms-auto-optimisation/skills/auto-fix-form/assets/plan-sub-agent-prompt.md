# Planning Sub-Agent Prompt Template

Used by **Phase 3.1** (and Phase 3.3 `redo` / `regenerate` / `add`) of `auto-fix-form`. Substitute the bracketed values from the `allErrors[]` entry before invoking the `Agent` tool. The sub-agent **does not produce a patch** — it produces an analysis the user can review and iterate on.

```
You are analysing a JavaScript error in an AEM/EDS form codebase. Produce a fix
PLAN, not a patch — the user will review and may ask you to revise before any
code is changed.

Error      : <type> — <message>
File URL   : <fileUrl>            # may be a JS file, a page URL, or absent
File       : <file>
Line       : <line>
Column     : <col>
Source     : <source>             # telemetry | live | user-provided | telemetry-only
Impact     : <count> views / <pct>% sessions   # omit if unknown
Pre-analysis from live-debug-form : <interpretation, or "none">
Repo root  : <REPO_PATH>          # already resolved; you may Read files under it
Extra user guidance (optional)    : <user_guidance, or "none">

Tasks:
1. Inspect the file at the given line. If <fileUrl> is reachable, fetch it; otherwise
   Read <REPO_PATH>/<file>. Read 30 lines of surrounding context.
2. Identify the ROOT CAUSE — what is happening at runtime, in one paragraph.
   Distinguish "bug at the call site" vs "bug in the function body".
3. Propose ONE primary APPROACH for the fix, in one paragraph. Prefer the
   minimal-diff option (optional chaining, null guard, argument-order fix,
   missing default). Do not write the patch yet — just describe it.
4. List up to 3 ALTERNATIVES briefly. Mark the trade-off of each in one phrase
   (wider blast radius / requires refactor / depends on framework version / etc.).
5. Estimate SCOPE and RISK:
   - scope  : single-line | multi-line | page-level | repo-wide
   - risk   : low | medium | high (low = local change in one file; medium = touches
             multiple call sites or rule-editor wiring; high = changes a public
             API or shared utility)
6. List the AFFECTED FILES (paths relative to REPO_PATH). For "page-level" or
   "repo-search" cases, run grep first and include the matching files.
7. If the user provided extra guidance, weight your APPROACH toward it. If the
   guidance contradicts code reality (e.g. "use Array.from" but the file has no
   reference to Array — a different fix is required), explain the conflict in
   the analysis instead of forcing the guidance.

Return ONLY this JSON:
{
  "error_id"       : <id>,
  "root_cause"     : "<one paragraph>",
  "approach"       : "<one paragraph>",
  "scope"          : "single-line" | "multi-line" | "page-level" | "repo-wide",
  "affected_files" : ["path/from/repo/root.js", "..."],
  "risk"           : "low" | "medium" | "high",
  "alternatives"   : ["short trade-off line", "..."],
  "needs_review"   : false
}

OR, if the error genuinely cannot be planned without human input (e.g. minified
source with no map, third-party file, requires a decision the agent cannot make):
{
  "error_id"     : <id>,
  "needs_review" : true,
  "analysis"     : "one paragraph — why this needs human judgement, and what info
                   would unblock automated planning"
}

Constraints:
- Do NOT call the Edit tool. Do NOT write the patch. Read-only inspection only.
- Do NOT run `git`, `npm`, or any shell command beyond Read / Grep / Glob.
- Do NOT touch files. The orchestrator owns all writes; this is the analysis pass.
- Do NOT include "step 1 / step 2 / patch hint" sections. Stick to the JSON shape.
```

## Parallelism rules

- **Different files** → spawn ALL planning sub-agents in parallel via a **single message with multiple `Agent` tool uses**.
- **Same file** → sequential. Re-read the file between sub-agents so each has fresh context.
- For `regenerate` (Phase 3.3): group by `affected_files[0]` and apply the same rule.

## What the orchestrator does with the result

- `needs_review: true` → entry is added to the plan with `status: "needs_review"` and surfaces in the PR body's "Manual review needed" section. It is NOT silently dropped.
- Otherwise: build the plan entry, render it in the table, wait for user iteration.
- The orchestrator never calls Edit during Phase 3 — this is strictly the planning pass.
