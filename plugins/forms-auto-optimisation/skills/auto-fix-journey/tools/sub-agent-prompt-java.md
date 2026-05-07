---
name: sub-agent-prompt-java
description: Prompt template for Java fix sub-agents spawned by auto-fix-journey Step 8. Substitute all __PLACEHOLDERS__ before sending. Returns a JSON result block.
---

# Java Fix Sub-Agent Prompt Template

> Substitute every `__PLACEHOLDER__` before sending. Send the resolved text as the Agent prompt.

---

You are fixing a backend Java error in an AEM Forms application.

## Error context

- **Class**: `__SHORT_CLASS__` (full: `__FULL_CLASS__`)
- **Exception**: `__EXCEPTION_TYPE__: __EXCEPTION_MESSAGE__`
- **Stack trace extract** (from Splunk, up to 500 chars):
  ```
  __STACK_TRACE__
  ```
- **Journey context** (non-PII — API codes and step markers only):
  ```
  __JOURNEY_CONTEXT__
  ```
- **Fix type**: `__FIX_TYPE__` (Structural / Logic)
- **API error code** (if present): `__API_ERROR_CODE__`

## Source file

- **File path**: `__FILE_PATH__`
- **Line number**: `__LINE_NUMBER__` (approximate — verify against current source)

## What to do

1. Read `__FILE_PATH__` and locate the method at or near line `__LINE_NUMBER__`.
2. Understand why the exception occurs: examine the code path, method signatures, and what value is null/mistyped/out-of-bounds.
3. Generate a minimal fix: the smallest change that prevents the exception without altering business logic.
   - For **Structural** fixes: add null/empty guards, fix unchecked casts, wrap in try/catch.
   - For **Logic** fixes: generate a stub with a `// TODO: MANUAL_REVIEW` comment and return `needs_review: true`.

## Response format

Return exactly one JSON block and nothing else:

```json
{
  "file_path": "__FILE_PATH__",
  "old_string": "<exact lines from the file — must appear exactly once>",
  "new_string": "<replacement lines with the fix applied>",
  "explanation": "<one sentence: what was wrong and what the fix does>",
  "fix_type": "structural | logic | framework",
  "needs_review": false
}
```

OR if the fix requires payload context or manual verification:

```json
{
  "file_path": "__FILE_PATH__",
  "needs_review": true,
  "fix_type": "logic | framework",
  "analysis": "<what the error means, what payload/config data would be needed to fix it properly>",
  "manual_test_checklist": [
    "Reproduce with a journey where <condition>",
    "Verify <field> is non-null before the call at line __LINE_NUMBER__",
    "Check CRX config at /conf/… if <framework issue>"
  ]
}
```

## Constraints

- `old_string` must be an exact substring of the current file content — verify by reading the file.
- Do not change method signatures, access modifiers, or surrounding logic.
- Do not add imports unless required by the fix.
- Do not change indentation style (match the file's existing style).
- If the source file is minified or generated, return `{ "needs_review": true, "analysis": "Minified/generated file — cannot auto-fix." }`.
