---
name: sub-agent-prompt-java
description: Prompt template for Java fix sub-agents spawned by fix-forms-java-errors Step 7. Substitute every __PLACEHOLDER__ before sending. Returns JSON per shared/references/sub-agent-contract.md.
---

# Java Fix Sub-Agent Prompt Template

Substitute every `__PLACEHOLDER__` before sending. Send the resolved text as the `Agent` prompt.

Return JSON per `shared/references/sub-agent-contract.md`.

---

You are fixing a backend Java error in an AEM Forms application.

## Error context

- **Class**: `__SHORT_CLASS__` (full: `__FULL_CLASS__`)
- **Exception**: `__EXCEPTION_TYPE__: __EXCEPTION_MESSAGE__`
- **Stack trace extract** (up to 500 chars):
  ```
  __STACK_TRACE__
  ```
- **Journey context** (non-PII — API codes, step markers, IA trail):
  ```
  __JOURNEY_CONTEXT__
  ```
- **Fix type**: `__FIX_TYPE__` (`structural` | `logic`)
- **API error code** (if present): `__API_ERROR_CODE__`

## Source file

- **File path**: `__FILE_PATH__`
- **Line number**: `__LINE_NUMBER__` (approximate — verify against the current source)

## Tasks

1. Read `__FILE_PATH__`. Locate the method at or near line `__LINE_NUMBER__`.
2. Understand why the exception occurs — examine the code path, method signatures, what is null / mistyped / out-of-bounds.
3. Generate a minimal fix:
   - `structural` — add null/empty guards, fix unchecked casts, wrap in try/catch.
   - `logic` — return `needs_review` with a manual-test checklist; do not invent business rules.
4. Validate `old_string` appears EXACTLY ONCE in the current file content; expand context if needed.

## Return shape

Return ONLY one JSON block:

**Patch (structural):**

```json
{
  "file_relative": "<path relative to repo root>",
  "old_string": "<exact lines from the file — must appear exactly once>",
  "new_string": "<replacement lines>",
  "explanation": "one sentence — what was wrong and what the fix does",
  "fix_type": "structural"
}
```

**Needs review (logic / framework):**

```json
{
  "file_relative": "<path relative to repo root>",
  "needs_review": true,
  "fix_type": "logic | framework",
  "analysis": "what the error means, what payload/config data would be needed to fix it properly",
  "manual_test_checklist": [
    "Reproduce with a journey where <condition>",
    "Verify <field> is non-null before the call at line __LINE_NUMBER__"
  ]
}
```

**Need more info** (use only when genuinely blocked by missing runtime data):

```json
{
  "need_more_info": true,
  "fix_type": "logic | structural",
  "questions": ["<specific question 1>", "<specific question 2>"],
  "what_i_know": "what the code does, what the throw site is, why it throws — so the orchestrator can relay this without re-reading the file"
}
```

## Constraints

- `old_string` must be an exact substring of the current file content.
- Do not change method signatures, access modifiers, or surrounding logic.
- Do not add imports unless the fix requires it.
- Match the file's existing indentation style.
- **Never change log levels.** `LOGGER.info(...)` stays `info`. You may add new log statements at the same level as the nearest existing one in the method.
- Minified / generated source → `{ "needs_review": true, "analysis": "Minified/generated file — cannot auto-fix." }`.
- Read-only. The orchestrator owns Edit. Do not call shell or browser tools.
