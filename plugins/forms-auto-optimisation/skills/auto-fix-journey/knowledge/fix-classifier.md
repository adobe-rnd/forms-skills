---
name: fix-classifier
description: Rules for classifying AEM Forms backend Java errors into Structural (apply fix directly), Logic (flag for manual test), or Adobe framework (config recommendation only) fix types, based on exception pattern and whether a fix requires runtime payload context.
---

# Fix Classifier

## Classification table

| Fix type | When to apply | Example patterns | Action |
|----------|---------------|------------------|--------|
| **Structural** | Exception is deterministic regardless of payload — null guard missing, unchecked cast, unhandled empty list, missing try/catch on a void call | `NullPointerException`, `ClassCastException`, `IndexOutOfBoundsException`, `IllegalStateException` on a getter chain, unchecked `get(0)` on a potentially empty list | Apply fix directly in sub-agent |
| **Logic** | Exception message or error code changes with input data — business rule, field validation, conditional branch depends on runtime values the log does not reveal | `errorCode: V5LO4010SH`, custom `BusinessException`, conditional `if (amount > threshold)` failing silently | Generate stub fix with `needs_review: true` + manual test checklist |
| **Framework** | Failure is in OSGi wiring, FDM datasource config, CRX/JCR path, or OSGI component activation — not in Java logic | `ComponentException`, `LoginException`, datasource `ConnectionRefusedError`, missing CRX config node | Return config recommendation only — no code edit |

---

## Structural fix patterns

Apply these patterns when the exception type matches and the stack trace points to a specific line:

| Exception | Root cause | Fix template |
|-----------|------------|--------------|
| `NullPointerException` at `obj.method()` | Object returned from API or map lookup can be null | Add null check: `if (obj != null) { … }` or use `Optional.ofNullable(obj).ifPresent(…)` |
| `NullPointerException` at `list.get(i)` | List itself is null (vs empty) | Add null+empty guard before loop: `if (list != null && !list.isEmpty())` |
| `ClassCastException` | Unsafe cast from `Object` or `Map` value | Add `instanceof` check before cast |
| `IndexOutOfBoundsException` | `get(0)` on list that may be empty | Check `!list.isEmpty()` before `get(0)` |
| `IllegalStateException` from a builder or lifecycle call | Method called after object already finalized | Add lifecycle guard or reorder call |
| Unhandled checked exception propagating as `RuntimeException` | Missing try/catch around API call that throws checked exception | Wrap in try/catch, log and return safe default |

---

## Logic fix patterns

When the error code or message implies business-rule failure:

1. Generate a stub that logs the context clearly:
   ```java
   // TODO: manual review — fix depends on runtime payload not available in logs
   // Observed: ErrorCode <CODE> — <message from Splunk>
   // Trigger: <short_class> at <method> during journey step <step>
   log.error("MANUAL_REVIEW_NEEDED: <CODE> at <method> — verify <condition> against payload");
   ```
2. Return `{ "needs_review": true, "fix_type": "logic", "manual_test_checklist": [...] }`

---

## Framework fix patterns

When the exception is in OSGi activation, CRX config, or FDM datasource:

Return a recommendation block (no code edit):
```
Fix type: Framework configuration
Affected component: <short_class>
Likely cause: <describe from error — missing CRX node, wrong datasource URL, etc.>
Recommended action:
  - Check /conf/<project>/settings/cloudconfigs/<datasource-name> in CRXDE
  - Verify OSGi component config at /system/console/components/<full_class>
  - Confirm datasource credentials and endpoint URL in CRX
```

---

## Decision flowchart

```
Exception in Splunk log
        │
        ▼
Is it an OSGi / CRX / datasource error?
  YES → Framework fix (config recommendation, no code edit)
  NO ↓
        ▼
Does the fix depend on runtime payload values not visible in logs?
  YES → Logic fix (needs_review stub + checklist)
  NO ↓
        ▼
Is the throw site a deterministic null/cast/bounds/lifecycle error?
  YES → Structural fix (apply directly)
  NO  → Logic fix (needs_review — not enough context)
```
