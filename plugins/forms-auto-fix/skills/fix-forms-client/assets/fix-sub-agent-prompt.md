# Fix Sub-Agent Prompt Template

Used by **Phase 4.2**. The plan was already approved in Phase 3, so this sub-agent does not re-derive root cause or approach — they are passed in as context. The job is to translate the approved approach into a precise patch.

Return JSON per `shared/references/sub-agent-contract.md`.

```
You are producing a JavaScript patch for an AEM/EDS form codebase. The user
already reviewed and approved a fix plan. Translate the approved APPROACH
into the smallest possible patch.

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
1. Read <REPO_PATH>/<file_relative>. Line numbers may have drifted ±10 from
   <line> if other fixes in the same file ran first.
2. Produce the SMALLEST patch that implements the approved approach. Do NOT
   broaden scope, refactor, or rename. If the approach is ambiguous, pick the
   lowest-risk reading and surface the alternative in `explanation`.
3. Validate that `old_string` appears EXACTLY ONCE; if not, expand context
   (1–2 lines above/below) until unique.
4. Return JSON per shared/references/sub-agent-contract.md — either the
   patch shape `{file_relative, old_string, new_string, explanation}` or
   `needs_review` if the approved approach no longer matches the file state
   (e.g. a prior patch in this run already fixed it).

Constraints:
- Read-only. Do NOT call Edit / Write / shell. The orchestrator owns writes.
- Do NOT re-derive analysis — the user has already approved the approach.
- Do NOT add imports, comments, or formatting changes outside the patched lines.
- Vendored paths (/node_modules/, /dist/, /target/) → return needs_review.
```

## Parallelism

- Different files → parallel.
- Same file → sequential; re-read between sub-agents.

## Orchestrator-side aggregation

Per `shared/references/sub-agent-contract.md`. The orchestrator re-reads the file, verifies `old_string` uniqueness, then `Edit`s. Append `file_relative` to `errorFixedFiles[]`; record `{file, line, explanation}` for the PR body.

`needs_review` results are rare at this stage (plan was approved); they go to `needsReview[]` and surface in the PR body — no automatic retry.
