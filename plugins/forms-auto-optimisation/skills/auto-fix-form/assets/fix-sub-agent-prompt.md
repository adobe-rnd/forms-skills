# Fix Sub-Agent Prompt Template

Used by **Phase 4.2** of `auto-fix-form`. The plan has already been approved in Phase 3, so this sub-agent does not re-derive root cause or approach — they are passed in as context. The job is to convert the approved approach into a precise patch.

Substitute bracketed values from the approved `plan[]` entry + its underlying `error` before invoking the `Agent` tool.

```
You are producing a JavaScript patch for an AEM/EDS form codebase. The user has
already reviewed and approved a fix plan. Your job is to translate the approved
APPROACH into a minimal, exact patch.

Error      : <type> — <message>
File URL   : <fileUrl>
File       : <file>
Line       : <line>
Column     : <col>
Source     : <source>
Impact     : <count> views / <pct>% sessions   # omit if unknown
Repo root  : <REPO_PATH>
Branch     : <FIX_BRANCH>            # already checked out — do not switch

Approved root cause :
<root_cause from plan entry>

Approved approach :
<approach from plan entry>

User guidance (if any) :
<user_guidance from plan entry, or "none">

Tasks:
1. Read <REPO_PATH>/<file_relative>. Locate the construct described by the
   approved approach (line numbers may have drifted ±10 from <line> if other
   fixes in the same file ran first).
2. Produce the SMALLEST possible patch that implements the approved approach.
   Do NOT broaden the change — no refactors, renames, or scope expansions
   beyond what the approach explicitly says. If the approach is ambiguous,
   pick the lowest-risk reading and surface the alternative in `explanation`.
3. Validate that `old_string` appears EXACTLY ONCE in the file. If not, expand
   it with more surrounding lines (typically 1-2 above + 1-2 below) until it
   is unique.
4. Return ONLY this JSON — do NOT call the Edit tool yourself:
   {
     "file_relative" : "path/from/repo/root.js",
     "old_string"    : "...",
     "new_string"    : "...",
     "explanation"   : "one sentence — what changed and why this matches the approved approach"
   }

If during inspection the approved approach turns out to not match the file
state (e.g. the affected code was already fixed by a previous patch in this
run, or a different construct now sits at <line>), return:
   {
     "needs_review" : true,
     "file_relative" : "<file>",
     "analysis"     : "what changed since the plan was approved, and what
                       information would unblock the patch"
   }

Constraints:
- Do NOT call Edit, Write, or any shell/MCP tool beyond Read / Grep / Glob.
- Do NOT touch files other than <file_relative>.
- Do NOT re-derive the analysis — the user has already approved the approach.
- Do NOT introduce comments, imports, or formatting changes outside the patched lines.
- If <file_relative> is under /node_modules/, /dist/, or any vendored path:
  return needs_review.
```

## Parallelism rules

- **Different files** → spawn ALL fix sub-agents in parallel via a **single message with multiple `Agent` tool uses**.
- **Same file** → sequential. Re-read the file between sub-agents so the next `old_string` reflects the previous fix.

## Orchestrator-side aggregation

For each non-`needs_review` JSON result:

1. `Read(<REPO_PATH>/<file_relative>)` — fresh read.
2. Verify `old_string` appears exactly once. If multiple matches, expand context (re-spawn the sub-agent if needed).
3. `Edit(<REPO_PATH>/<file_relative>, old_string, new_string)`.
4. Append `<file_relative>` to `errorFixedFiles[]` (de-duplicated).
5. Record `{file, line, explanation}` for the PR body's "Errors fixed" section.

`needs_review` results from this stage are rare (the plan was already approved). When they happen, append to `needsReview[]` and surface in the PR body — do not retry automatically.

## What this sub-agent never does

- It does not run perf-bot. That is Phase 5.
- It does not commit. That is Phase 6.1.
- It does not push or open a PR. Those are Phase 6.2 and 6.3.
- It does not write to any file other than the patched one's specific lines.
