---
name: create-screen-doc
description: >
  Use when extracting form structure from visual inputs — screenshots, Figma
  frames, or design mockups — to populate the Screens, Navigation, and Custom
  Components sections of a journey spec. NOT for requirements docs — use
  analyze-requirements instead.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.2"
  type: skill
  triggers:
    - screenshots
    - figma
    - mockup
    - design file
    - visual analysis
    - extract from design
    - screen from image
---

# Visual Analysis — Screens to Spec

Analyzes visual inputs (screenshots, Figma, mockups) and produces the `## Screens`, `## Navigation`, and `## Custom Components` sections of `journeys/<journey>/spec.md`.

---

## When to Use

- Requirements are visual-only (screenshots, Figma frames, exported design specs)
- Requirements doc exists but is missing screen structure detail — use this to fill gaps
- User provides design mockups alongside a requirements doc

**Do NOT use for:** requirements documents, inline text, JUD files, or v1 form JSON — use `analyze-requirements` for those.

---

## Inputs

| Input | How to identify |
|---|---|
| Screenshots | `.png`, `.jpg`, `.pdf` image files |
| Figma frames | Figma export or shared frame URL |
| Design specs | Exported design documents with annotated fields |

Collect all available materials — desktop AND mobile viewports if available.

---

## Workflow

### Step 1 — Map Visual Structure to Form Structure

| Visual element | Maps to |
|---|---|
| Distinct section with heading | Wizard step (Screen) |
| Tabbed interface | `tabsontop` panel (single screen, multiple tabs) |
| Progress bar with labeled steps | Wizard wrapper + N screens |
| Collapsible section | Accordion panel (within a screen) |
| Group of related fields | Panel container (within a screen) |
| "Add another" button + repeating row | Repeatable panel |

> **Wizard steps vs panels:** A Screen boundary = a new wizard step the user navigates to (Next/Back). Panels within a step are NOT separate screens.

### Step 2 — Identify Custom Components

For each field, ask: does this look like an OOTB field or a custom renderer?

| Visual pattern | Likely custom component |
|---|---|
| Radio options displayed as image cards | `card-choice` (base: radio-group) |
| Numeric range slider | `range` (base: number-input) |
| Countdown display | `countdown-timer` (base: number-input) |
| Modal/overlay panel | `confirm-modal` (base: panel) |

If project `blocks/form/mappings.js` is accessible, cross-reference `customComponents` array.

### Step 3 — Catalog Fields Per Screen

For each screen, document every visible field:

| Field Name | Type / fd:viewType | Required | Placeholder | Notes |
|---|---|---|---|---|
| full_name | text-input | yes | Full name | — |
| plan_type | card-choice | yes | — | Image card selection |

**Field name:** derive from label using snake_case.
**Required:** infer from asterisk (*), "required" label, or design annotation.
**Placeholder:** capture if visible in design.

### Step 4 — Map Navigation

For multi-screen designs:

| From | To | Condition |
|---|---|---|
| Screen 1 | Screen 2 | always (Next button) |
| Screen 2 | Screen 3 | field_x = "yes" |

Identify: Back/Next buttons, conditional skip (e.g., "If No, skip to step 4"), progress indicators.

### Step 5 — Identify Conditional Logic Hints

Note visible show/hide patterns for `analyze-requirements` to formalize:
- "If Yes, additional fields appear" → functional rule candidate
- "Show more" toggles → show/hide rule candidate

Document as: `When <field> = <value>: show/hide <target>` — these become entries in `## Functional Rules`.

### Step 6 — Write Spec Sections

Output the following sections in journey spec format:

```markdown
## Custom Components

| fd:viewType | Base Type | Purpose |
|---|---|---|
| card-choice | radio-group | Radio options as image cards |

## Screens

### Screen 1: <name>
Purpose: <what user does here>

| Field Name | Type / fd:viewType | Required | Placeholder | Notes |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

### Screen 2: <name>
...

## Navigation

| From | To | Condition |
|---|---|---|
| Screen 1 | Screen 2 | always |
```

---

## Output

The three spec sections above, ready to paste into (or merge with) `journeys/<journey>/spec.md`.

If a spec file already exists, merge these sections into it — do not overwrite sections populated by `analyze-requirements`.

---

## Common Patterns

**Wizard (multi-step):**
- Progress bar with N labeled steps → N screens
- Each step = one Screen sub-section
- Back/Next buttons → Navigation table with `always` conditions

**Single screen with accordion:**
- Collapsible sections = accordion panels within ONE screen
- Not separate screens — no Navigation table needed

**Two-column field layout:**
- Side-by-side fields on desktop = CSS only (same Screen)
- NOT separate screens or panels

**Repeatable section:**
- "Add another" button + repeating row = repeatable panel within a screen
- Note max rows if visible in design
