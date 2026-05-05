# Performance-Bot Fix Sub-Agent Prompt Template

Used by **Phase 5.2** of `auto-fix-form` for each violation parsed from `.perf-bot-report.md`. Substitute the bracketed values before invoking the `Agent` tool. The plan-approval gate from Phase 3 does **not** apply to perf-bot violations — those are caught from a deterministic CLI rulebook and applied without further user iteration; remaining violations after iteration 3 surface in the PR body's "Performance follow-ups" section.

```
You are analyzing a performance-bot violation in an AEM Adaptive-Forms codebase.
You will produce a JSON fix description; the orchestrator will apply the Edit.

Violation type : <type>            # e.g. window-access-in-custom-function
File           : <REPO_PATH>/<file>
Line           : <line>
Message        : <message from report>
Recommendation : <recommendation from report, if present>

Repo root      : <REPO_PATH>
Branch         : <FIX_BRANCH>      # already checked out — do not switch

Recipe (from references/perf-bot-violations.md):
<paste the row for this <type> from the recipe table>

Task:
1. Read <file> with the Read tool. Locate the violating construct at line <line>
   (or within ±10 lines — line numbers can drift after earlier fixes in the same file).
2. Produce the smallest possible patch that satisfies the recipe. Do NOT refactor
   surrounding code, do NOT rename symbols, do NOT widen scope.
3. Validate that `old_string` appears EXACTLY ONCE in the file. If not, expand
   with more surrounding context until it is unique.
4. Return ONLY this JSON — do NOT call the Edit tool yourself, the orchestrator
   owns all writes so the run stays atomic and re-entrant:
   {
     "file_relative" : "<file>",
     "type"          : "<type>",
     "old_string"    : "...",
     "new_string"    : "...",
     "explanation"   : "one sentence — what changed and why it satisfies the rule"
   }
   OR if the fix needs human judgement:
   {
     "needs_review"  : true,
     "type"          : "<type>",
     "file_relative" : "<file>",
     "analysis"      : "what makes this non-trivial — one paragraph"
   }

Constraints:
- Do not run `git`, `npm`, or any shell command. The orchestrator handles commit/push.
- Do not call the Edit, Write, or any browser/MCP tool. Read-only analysis + JSON return.
- Do not touch files other than <file>.
- If <file> is under /node_modules/, /dist/, or any vendored path: return needs_review.
```

## Parallelism rules (mirror Phase 4.2)

- **Different files** → spawn ALL sub-agents in parallel via a **single message with multiple `Agent` tool uses**.
- **Same file** → spawn sequentially. Re-read the file between sub-agents so the next `old_string` reflects the previous fix.
- **CSS file with N violations** → run sequentially even though the patches are usually independent — line numbers shift after each edit.

## Aggregating results (orchestrator side)

After all sub-agents return:

- For each non-`needs_review` JSON result: `Read` the file, verify `old_string` appears exactly once, then apply with the `Edit` tool. Track the file in `perfFixedFiles[]` and the violation in `fixedViolations[]`.
- Collect every `needs_review` entry; append them to `needsReview[]` for the PR body's **"Performance follow-ups"** section.
- Re-run `node ~/.performance-bot/index.js --diff HEAD --output ./.perf-bot-report.md` and re-parse. Loop until 0 violations or 3 iterations — whichever comes first.
