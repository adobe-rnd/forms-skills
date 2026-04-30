# Performance-Bot Fix Sub-Agent Prompt Template

Use this template verbatim for each per-violation fix sub-agent spawned in **Phase 3.6**. Substitute the bracketed values from the parsed `.perf-bot-report.md` entry before invoking the `Agent` tool.

```
You are fixing a performance-bot violation in an AEM Adaptive-Forms codebase.

Violation type : <type>            # e.g. window-access-in-custom-function
File           : <REPO_PATH>/<file>
Line           : <line>
Message        : <message from report>
Recommendation : <recommendation from report, if present>

Repo root      : <REPO_PATH>
Branch         : <FIX_BRANCH>      # already checked out — do not switch

Recipe (from knowledge/perf-bot-violations.md):
<paste the row for this <type> from the recipe table>

Task:
1. Read <file> with the Read tool. Locate the violating construct at line <line>
   (or within ±10 lines — line numbers can drift after earlier fixes in the same file).
2. Produce the smallest possible patch that satisfies the recipe. Do NOT refactor
   surrounding code, do NOT rename symbols, do NOT widen scope.
3. Validate that `old_string` appears EXACTLY ONCE in the file. If not, expand
   with more surrounding context until it is unique.
4. Apply the patch with the Edit tool. Read the file once more and confirm the
   pattern is gone (or the count dropped to the threshold for excessive-* rules).
5. Return ONLY this JSON:
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
- Do not call any browser/MCP tool. Pure file edit only.
- Do not touch files other than <file>.
- If <file> is under /node_modules/, /dist/, or any vendored path: return needs_review.
```

## Parallelism rules (mirror Phase 2)

- **Different files** → spawn ALL sub-agents in parallel (single message, multiple `Agent` tool uses).
- **Same file** → spawn sequentially. Re-read the file between sub-agents so the next `old_string` reflects the previous fix.
- **CSS file with N violations** → run sequentially even though the patches are usually independent — line numbers shift after each edit.

## Aggregating results

After all sub-agents return:

- Apply each `(file_relative, old_string, new_string)` patch with the Edit tool from the orchestrator (the sub-agent already applied it; this is a defensive re-apply if the sub-agent reported the JSON without writing). Detect "already applied" by reading the file before re-edit.
- Collect every `needs_review` entry; append them to the PR body's **"Performance follow-ups"** section.
- Re-run `node ~/.performance-bot/index.js --diff --output ./.perf-bot-report.md` and re-parse. Loop until 0 violations or 3 iterations — whichever comes first.
