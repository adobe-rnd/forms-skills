---
name: forms-component-discovery
description: >
  Use when selecting field types for a form, discovering which components have
  CSS files for styling, or auditing what is registered in mappings.js. Reads
  both customComponents and OOTBComponentDecorators arrays. Also use when
  forms-content-modeler is resolving a field intent, or forms-style-screen needs to
  know which component CSS files exist for this project.
license: Apache-2.0
metadata:
  type: skill
  author: Adobe
  version: "0.3"
  triggers:
    - component inventory
    - component discovery
    - available components
    - custom components
    - what components exist
    - mappings.js
    - component registry
    - field palette
    - what field types are available
    - component css files
    - which components have css
    - styling components
---

# Forms Component Discovery

Survey all registered form components — custom `fd:viewType` components AND OOTB decorator components — before making field selection or styling decisions. Owns reading and writing of `$FORMS_WORKSPACE/refs/component-registry.md`.

**Run this before resolving any field intent or styling any component.** Custom components take priority over OOTB equivalents for field selection. All registered components (custom + OOTB) have their own CSS files under `blocks/form/components/{name}/{name}.css`.

---

## When to Use

- Starting field type resolution in `forms-content-modeler`
- Starting component CSS discovery in `forms-style-screen`
- User asks "what components are available?" or "which components can I style?"
- Authoring a new form and need the full component palette
- After scaffolding a new custom component (invoked by `forms-custom-components`)

**Skip when:**
- You already know the exact component needed and it's confirmed registered
- `blocks/form/mappings.js` does not exist in this project (OOTB only — go straight to `field-types.md`)

---

## Workflow

### Step 1 — Read both component arrays from mappings.js

```bash
grep -n "customComponents\|OOTBComponentDecorators" $FORMS_EDS_ROOT/blocks/form/mappings.js
```

Extract both array values:
- `customComponents` — project-specific custom `fd:viewType` renderers (e.g. `range`, `autocomplete`)
- `OOTBComponentDecorators` — built-in decorator components with their own CSS + JS (e.g. `accordion`, `wizard`, `modal`)

Both arrays are loaded via the same `loadComponent()` — both get `blocks/form/components/{name}/{name}.css` loaded at runtime.

### Step 2 — Read existing registry

Read `$FORMS_WORKSPACE/refs/component-registry.md` if present. Existing rows (descriptions, base types) carry forward into **Step 5** (Write/merge registry) — they are preserved for components still in `mappings.js`.

If absent, skip. Step 5 will create it.

Schema: see `skills/forms-custom-components/references/component-registry-schema.md`.

If absent and `mappings.js` also absent, infer base type from component name where possible (e.g., `card-choice` → `radio-group`).

### Step 3 — Produce unified palette

```
Custom Components (project-specific fd:viewType — prefer for field selection):
- card-choice   (base: radio-group)   — radio options as clickable image cards
- range         (base: number-input)  — range slider input
- autocomplete  (base: text-input)    — searchable autocomplete field

OOTB Decorator Components (built-in — each has own CSS + JS):
- accordion     — collapsible panel sections
- file          — file upload with drag-and-drop area
- modal         — overlay dialog panel
- password      — password field with show/hide toggle
- rating        — star rating input
- repeat        — repeatable panel with add/remove controls
- tnc           — terms and conditions with scrollable text
- toggleable-link — link that toggles content visibility
- wizard        — multi-step wizard navigation wrapper

OOTB Field Types (no separate component file — styled via form.css):
→ See skills/forms-content-modeler/references/field-types.md
```

### Step 4 — Field selection or CSS discovery

**Field selection (forms-content-modeler context):**

For each field intent:
1. Custom component matches intent better than OOTB base? → use it
2. No match → fall back to `field-types.md`

**Example:** "single selection as image cards" → `card-choice` (fd:viewType) + `radio-group` (fieldType) ✅

**CSS discovery (forms-style-screen context):**

For each component in both arrays, its CSS file is:
```
$FORMS_EDS_ROOT/blocks/form/components/{name}/{name}.css
```

Verify files exist:
```bash
ls $FORMS_EDS_ROOT/blocks/form/components/
```

Report which components have a CSS file — these are the per-component styling targets. Components NOT in either array (plain inputs, dropdowns, checkboxes, etc.) are styled via `blocks/form/form.css` selectors only.

### Step 5 — Write/merge registry

Write the unified palette to `$FORMS_WORKSPACE/refs/component-registry.md`:

- **File absent:** create using schema from `skills/forms-custom-components/references/component-registry-schema.md`
- **File exists:** merge —
  - Add rows for components in `mappings.js` not yet in registry
  - Preserve existing rows for components still in `mappings.js` (descriptions, base types unchanged)
  - Remove rows for components no longer in `mappings.js` — registry must reflect current mappings

Order: custom components (`customComponents` array) first, OOTB decorators (`OOTBComponentDecorators` array) second.

---

## Output Format

```
## Component Palette

### Custom fd:viewType (project-specific — prefer for field selection)
| Name | Base fieldType | CSS file | Description |
|---|---|---|---|
| card-choice | radio-group | components/card-choice/card-choice.css | Image card radio options |
| range | number-input | components/range/range.css | Slider input |

### OOTB Decorators (built-in — each has own CSS + JS)
| Name | CSS file | Description |
|---|---|---|
| accordion | components/accordion/accordion.css | Collapsible panel |
| wizard | components/wizard/wizard.css | Multi-step navigation |
| modal | components/modal/modal.css | Overlay dialog |

### OOTB Field Types (styled via form.css)
→ forms-content-modeler/references/field-types.md
```

---

## Rules

1. **Always read both arrays.** `customComponents` alone misses OOTB decorator components.
2. **Custom wins for field selection.** If a custom component covers the use case, use it.
3. **fieldType is always required.** Even when `fd:viewType` is set, `fieldType` must reflect the semantic data type.
4. **CSS file path is deterministic.** `components/{name}/{name}.css` — no lookup needed.
5. **If mappings.js is absent**, OOTB only — proceed directly to `field-types.md`.
6. **Always write registry after palette production.** Every invocation writes/merges `$FORMS_WORKSPACE/refs/component-registry.md` — idempotent.
