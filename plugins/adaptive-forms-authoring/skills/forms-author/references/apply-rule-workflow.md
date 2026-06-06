# Apply Rule/Event Workflow

Receives `{ fd:rules, fd:events, validationExpression? }` from `forms-rule-author` (saved to `/tmp/merged-rule.json`).

```
[INPUT]  forms-rule-author returned: { "fd:rules": {...}, "fd:events": {...}, "validationExpression"?: "..." }
         → /tmp/merged-rule.json already written by the orchestrator
[MCP]    get-aem-page-content(pageId) → CONTENT_MODEL + eTag  (reuse if just fetched)
[SCRIPT] Get the target field's content-model pointer:
```

```bash
node $SKILL_DIR/scripts/find-field.bundle.js \
  --content-model '<CONTENT_MODEL>' \
  --name "<fieldName>"
# → { found, pointer, capiKey, propertyPointer, ... }  (single object, not array)
# Use result.pointer as <field-pointer> below
```

```
[SCRIPT] Build patch ops (resolves fd:rules/fd:events child nodes internally):
```

```bash
node $SKILL_DIR/scripts/apply-rule-patch.bundle.js \
  --merged-rule-file /tmp/merged-rule.json \
  --content-model '<CONTENT_MODEL>' \
  --field-pointer '<field-pointer>'
# → JSON patch ops array — save to /tmp/rule-patch.json
```

```
[MCP]    patch-aem-page-content(pageId, eTag, <ops from /tmp/rule-patch.json>)
[MCP]    get-aem-page-content(pageId) → VERIFY:
           - fd:rules/fd:events child nodes have non-empty properties (for rules/events)
           - For only validation rules, ensure field properties.validationExpression is set
         If any expected value is missing or empty → re-patch.
```

**Path A** (neither node exists): generates 1–2 `add` ops, one full child node each.
**Path B** (nodes exist): generates `replace` ops on the full `properties` object — merges existing rules with new ones (new keys win on conflict).
**Mixed** (one exists, one doesn't): each node follows its own path independently.
**Validate / Format rules**: script also emits `add` ops on `<field-pointer>/properties/validationExpression` — included in the same patch call, no separate step needed.
