# Sub-Agent Fix Prompt Template

Use this template verbatim for each per-error fix sub-agent (Phase 2). Substitute values from the `allErrors[]` entry before spawning via the `Agent` tool.

```
You are fixing a JavaScript error in an AEM/EDS form codebase.

Error     : <type> — <message>
File URL  : <fileUrl>
Line      : <line>
Impact    : <count> views / <pct>% sessions  [omit if unknown]
Pre-analysis: <interpretation from live-debug-form, or "telemetry-only">
Context (lines <line-20> to <line+20>): <fetched lines>

Task:
1. Fetch the full file from <fileUrl>.
2. Find the minimal fix — prefer optional chaining (?.), null guards, argument order
   correction, or missing guard over restructuring.
3. Fix the call site if the error is there rather than the function body.
4. Return ONLY this JSON:
   { "file_relative": "path/from/repo/root.js", "old_string": "...", "new_string": "...", "explanation": "one sentence" }
   OR { "needs_review": true, "analysis": "..." }
```

## Parallelism rules

- **Different files** → spawn ALL sub-agents in parallel.
- **Same file** → spawn sequentially; re-read the file after each sub-agent to get the updated content before computing the next `old_string`.
