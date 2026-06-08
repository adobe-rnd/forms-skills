---
name: visual-analysis
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

Analyzes visual inputs (screenshots, Figma, mockups) and produces the `## Screens`, `## Navigation`, and `## Custom Components` sections of `$FORMS_WORKSPACE/journeys/<journey>/spec.md`.

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
| JUD (.docx) | Word document with embedded screenshots |
| Live form URL | Existing deployed form for inspection |

Collect all available materials — desktop AND mobile viewports if available.

---

## Workflow

### Step 0 — Gather All Visuals

Before analysis, collect:
- Desktop viewport screenshots/frames
- Mobile viewport screenshots/frames (layout is CSS only — same field structure)
- Any annotated design spec or JUD document
- Live form URL if the form already exists

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

If project `$FORMS_EDS_ROOT/blocks/form/mappings.js` is accessible, cross-reference `customComponents` array.

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

### Step 6 — Extract Design Tokens

Identify brand colors, typography, and spacing from the visual. Map each to its `--form-*` CSS custom property. This output feeds the `## Style` section of the journey spec, which the planner uses to generate a Style plan.

**Colors** — sample from buttons, input borders, labels, error states, backgrounds:

| Visual element | CSS Variable | Observed Value |
|---|---|---|
| Primary CTA button fill | `--button-primary-color` | e.g., `#d84800` |
| Input border | `--form-input-border-color` | e.g., `#d0d0d0` |
| Label text | `--form-label-color` | e.g., `#333333` |
| Error / required indicator | `--form-error-color` | e.g., `#cc0000` |
| Form background | `--form-background-color` | e.g., `#f8f8f8` |

**Typography** — read from design spec annotations or Figma text styles:

| Usage | CSS Variable | Observed Value |
|---|---|---|
| Input text size | `--form-input-font-size` | e.g., `1rem` |
| Label size | `--form-label-font-size` | e.g., `0.875rem` |
| Label weight | `--form-label-font-weight` | e.g., `500` |
| Button text size | `--form-button-font-size` | e.g., `1rem` |

**Spacing** — read from design gutters, field gaps:

| Usage | CSS Variable | Observed Value |
|---|---|---|
| Vertical gap between fields | `--form-field-vert-gap` | e.g., `24px` |
| Horizontal gap between fields | `--form-field-horz-gap` | e.g., `32px` |

> If the visual doesn't provide explicit values, note the token as `TBD` — do not guess. The Style plan will refine.

**Custom component tokens** — if custom components (wizard, card-choice, etc.) have distinct visual treatment, note their specific vars (see `forms-style-screen/references/aem-css-conventions.md` for emitted class names and selector patterns).

Skip this step if the design has no brand styling information (wireframe-only, no color/type specs).

### Step 7 — Write Spec Sections

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

## Style

| CSS Variable | Value | Source |
|---|---|---|
| `--button-primary-color` | `#d84800` | CTA button fill |
| `--form-input-border-color` | `#d0d0d0` | Input border |
| `--form-label-color` | `#333` | Label text color |
```

Omit `## Style` if Step 6 was skipped (wireframe-only design).

---

## Output

The three spec sections above, ready to paste into (or merge with) `$FORMS_WORKSPACE/journeys/<journey>/spec.md`.

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

**Responsive layout:**
- Desktop/tablet/mobile show the same fields — layout differences are CSS only
- Do NOT create separate panels or screens for different viewports
- Note responsive constraints (e.g., "max 2-column on tablet") as CSS notes, not structural changes

**Repeatable section:**
- "Add another" button + repeating row = repeatable panel within a screen
- Note max rows if visible in design
