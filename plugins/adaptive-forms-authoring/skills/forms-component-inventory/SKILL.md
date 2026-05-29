---
name: forms-component-inventory
description: >
  Use when selecting field types for a form — checks what custom fd:viewType
  components exist in this project before defaulting to OOTB AEM Forms types.
  Also use when forms-content-modeler is resolving a field intent and the
  project may have registered custom components.
license: Apache-2.0
metadata:
  type: skill
  author: Adobe
  version: "0.1"
  triggers:
    - component inventory
    - available components
    - custom components
    - what components exist
    - mappings.js
    - component registry
    - field palette
    - what field types are available
---

# Forms Component Inventory

Survey available form components — project-specific custom `fd:viewType` components AND OOTB field types — before making field selection decisions.

**Run this before resolving any field intent.** Custom components take priority over OOTB equivalents — they exist because OOTB was insufficient for this project.

---

## When to Use

- Starting field type resolution in `forms-content-modeler`
- User asks "what components are available?"
- Authoring a new form and need the full component palette

**Skip when:**
- You already know the exact `fd:viewType` needed and it's confirmed registered
- `blocks/form/mappings.js` does not exist in this project (OOTB only — go straight to `field-types.md`)

---

## Workflow

### Step 1 — Read custom component registrations

```bash
grep -n "customComponents" blocks/form/mappings.js
```

Extract the array value. Each string is a registered `fd:viewType`.

### Step 2 — Check journey/component-registry.md

If `journey/component-registry.md` exists, read it for descriptions and base types per custom component. Schema: see `skills/forms-custom-components/references/component-registry-schema.md`.

If the file doesn't exist, infer base type from component name where possible (e.g., `card-choice` → likely `radio-group` base).

### Step 3 — Produce unified palette

```
Custom Components (project-specific — prefer these):
- card-choice   (base: radio-group)   — radio options as clickable image cards
- confirm-modal (base: panel)         — fixed overlay modal panel
- range         (base: number-input)  — range slider input

OOTB Field Types (fallback):
→ See skills/forms-content-modeler/references/field-types.md
```

### Step 4 — Match user intent, custom first

For each field the user needs:
1. Does any custom component match the intent better than its OOTB base? → use it
2. No match → fall back to `field-types.md` resolution

**Example:** User says "single selection displayed as image cards":
- ✅ `card-choice` (fd:viewType) + `radio-group` (fieldType) — custom component exists for this
- ❌ `radio-group` alone — correct base type, wrong UI; use the custom component

---

## Output Format

Report the palette before resolving field intents:

```
## Component Palette

### Custom (prefer these)
| fd:viewType | Base fieldType | Description |
|---|---|---|
| card-choice | radio-group | Radio options as clickable image cards |
| confirm-modal | panel | Fixed overlay modal — shown via form rules |
| range | number-input | Slider for numeric ranges |

### OOTB (fallback)
→ forms-content-modeler/references/field-types.md
```

---

## Rules

1. **Always check mappings.js before resolving field intents.** Never skip this step because OOTB "seems right."
2. **Custom wins.** If a custom component covers the use case, use it — that's why it was built.
3. **fieldType is always required.** Even when `fd:viewType` is set, `fieldType` must reflect the semantic data type.
4. **If mappings.js is absent**, OOTB only — proceed directly to `field-types.md`.
