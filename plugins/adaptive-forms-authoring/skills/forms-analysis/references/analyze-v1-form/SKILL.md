---
name: analyze-v1-form
description: >
  Use when analyzing a v1 AEM form JSON export to produce a journey spec at
  journeys/<journey>/spec.md. Identifies screens, extracts fields, rules, and
  APIs. NOT for requirements docs — use analyze-requirements instead.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
  type: skill
  triggers:
    - v1 form
    - legacy form
    - migrate form
    - v1 JSON
    - AEM migration
    - extract screens
    - extract fields
    - compare journeys
---

# Analyze v1 Form

Analyze legacy AEM v1 Adaptive Form JSON files through **direct reading and human reasoning** to
identify screens, extract fields and business rules, and produce a journey spec at
`$FORMS_WORKSPACE/journeys/<journey>/spec.md` for migration to Edge Delivery forms.

## When to Use

- User asks to analyze a v1 AEM form JSON file
- User wants to identify screens in a legacy journey
- User needs fields, rules, or fragments extracted from form JSON
- User wants to compare two or more journeys side by side
- User references a `.json` file from a v1 adaptive form export

## Critical Rules

1. **Read JSON directly** — open the file, read it section by section like a human analyst. NEVER write scripts, parsers, or automated heuristics to process the JSON
2. **Distinguish screens from non-screens** — popups, helpers, loaders, and nested sub-panels are NOT screens (see Screen Definition below)
3. **Document in journey spec format** — output to `$FORMS_WORKSPACE/journeys/<journey>/spec.md` following the Output section below
4. **Use `name` not panel keys** — panel keys like `panel_1239854573` are auto-generated; always use the `name` property to identify panels
5. **Mark unknowns as TBD** — if an API endpoint, field purpose, or rule behavior is unclear, mark it TBD rather than guessing
6. **Complete field coverage** — every user-facing field in each screen must appear in the documentation

## JSON Navigation

### How to Find Screens in the JSON Hierarchy

The top-level structure of every v1 form JSON is:

```
guideContainer
├── prefillService, schemaRef, themeRef (form metadata)
└── rootPanel
    ├── initScript (form-level initialization rules)
    └── items
        ├── header (SKIP — not a screen)
        └── PLPanel
            └── NavigationPanel ← SCREENS ARE DIRECT CHILDREN HERE
                └── items
                    ├── multipleAccountPanel ← Screen 01
                    ├── basicDetailsScreen   ← Screen 02
                    └── ...
```

### Navigation Structure Variations

Different journeys use different navigation patterns. Identify which pattern applies
before enumerating screens:

| Journey Type | Path to Screens | Layout | Typical Screen Count |
|-------------|-----------------|--------|---------------------|
| Full (ETBWO, NTB) | `rootPanel → PLPanel → NavigationPanel → items` | Navigation tabs | 16–17 |
| Wizard (ETB10SEC) | `rootPanel → PLLoanPagePanel → PLNavigationPanel → items` | `fd/af/layouts/panel/wizard` | 4 |
| Partner (A2A) | `rootPanel → LoanFormPanel → LoanFormA2A → items` | `fd/af/layouts/panel/wizard` | 3 |

For wizard layouts, look for `"sling:resourceType": "fd/af/layouts/panel/wizard"` —
direct children of that panel are the screens.

## Screen Definition

### What IS a Screen

A screen is a **logical step in the user journey** — what the user sees at a specific
point in time. Screens have these characteristics:

- **User-facing purpose** — represents a discrete step (e.g., "Select your account", "Verify details")
- **Progress indicator** — typically shows "Step XX — XX% complete"
- **Contains related fields/fragments** — groups inputs needed for that journey step
- **Navigation target** — the form navigates TO this panel after user actions
- **Initially hidden** — most have `"visible": false`, shown conditionally based on progress

### What is NOT a Screen

| Category | Examples | How to Identify |
|----------|----------|-----------------|
| Popups | `bre2failurepopupPanel`, `errorPopup`, `keyFacPanel`, `OVDpopup` | Name contains "popup", "error", "failure" |
| Helper panels | `formRenderingFragment`, `loanStepsPanel` | Technical/progress components, no user inputs |
| Nested sub-panels | Panels inside screens that organize content | Not direct children of navigation panel |
| Loaders/spinners | BRE Loader panels | Loading states that auto-transition |

## Analysis Workflow

### Step 1: Understand the JSON Structure

Read the JSON from the top. Note form-level metadata (`prefillService`, `schemaRef`,
`themeRef`) and the `initScript` on `rootPanel` — this contains form-level initialization
rules.

### Step 2: Locate the Navigation Panel

Follow the hierarchy to find the navigation container. Identify which navigation
variation applies (full, wizard, or partner). The direct children of this panel are
screen candidates.

### Step 3: Identify Screens vs Non-Screens

For each direct child of the navigation panel, ask:

1. Does it have a user-facing purpose? → Likely a screen
2. Does the name contain "popup", "error", "failure"? → NOT a screen
3. Is it a progress indicator or technical helper? → NOT a screen
4. Does it represent a step in the user journey? → Screen

### Step 4: Extract Screen Details

For each confirmed screen, read its full nested content and extract:

- **Basic info** — `name`, `jcr:title`, `visible`, CSS class, layout
- **Fragments** — any node with a `fragRef` property (note the fragment path)
- **Fields** — all user input components (see Field Extraction)
- **Rules** — all business logic scripts (see Rule Extraction)
- **Navigation** — back/continue button targets

### Step 5: Document Each Screen

Translate each screen into a `### Screen N: <name>` sub-section in the journey spec format (see Output section below).

### Step 6: Cross-Journey Comparison (if applicable)

When comparing journeys, match screens by purpose, compare fragments and rules,
and note differences (see Cross-Journey Comparison).

## Field Extraction

Identify fields by their `sling:resourceType` property:

| resourceType | Field Type |
|-------------|------------|
| `fd/af/components/guidetextbox` | text-input |
| `fd/af/components/guidenumericbox` | number-input |
| `fd/af/components/guidedropdownlist` | drop-down |
| `fd/af/components/guideradiobutton` | radio-group |
| `fd/af/components/guidecheckbox` | checkbox |
| `fd/af/components/guidebutton` | button |
| `fd/af/components/guidedatepicker` | date-input |

For each field, capture: `name`, `jcr:title`, `mandatory`, `bindRef`, `visible`,
`maxChars`, `validatePictureClause` (pattern), and any enum/options.

## Rule Extraction

Rules are embedded as script properties on panels and fields. Look for these properties:

| Property | Trigger | Purpose |
|----------|---------|---------|
| `initScript` | Panel/field initialization | Set initial values, call prefill APIs, configure state |
| `valueCommitScript` | Field value change (on blur) | Validate input, call APIs, update dependent fields |
| `clickExp` | Button click | Navigate, submit, call APIs |
| `validateExp` | Field validation | Custom validation beyond pattern/required |
| `visibleExp` | Visibility condition | Show/hide based on other field values |

For each rule, document:

| Aspect | What to Capture |
|--------|----------------|
| **Component** | Which field or panel owns the rule |
| **Trigger** | When it fires (init, blur, click, etc.) |
| **Intent** | What the rule is trying to accomplish |
| **Depends On** | Which other fields/values it reads |
| **Affects** | Which fields/panels it modifies |

## Cross-Journey Comparison

When comparing two or more journeys:

1. **Match screens by purpose** — not all screens exist in all journeys. Match by what the screen does, not its panel name
2. **Compare fragments** — identify shared vs unique fragments across journeys
3. **Compare rules** — the same field may have different rules per journey (e.g., PAN validation differs between NTB and ETBWO)
4. **Note structural differences** — different navigation types, screen counts, and flow variations

## Output

Write `$FORMS_WORKSPACE/journeys/<journey>/spec.md` using the journey spec format defined in `analyze-requirements/SKILL.md`.

Map v1 JSON concepts to spec sections:

| v1 JSON concept | Journey spec section |
|---|---|
| Screen count (direct children of NavigationPanel) | `## Overview` → `Screen count: N` |
| Custom component registrations | `## Custom Components` |
| Fields per screen | `## Screens` → per-screen field table |
| Back/Continue button targets | `## Navigation` |
| `visibleExp` / `visible: false` rules | `## Functional Rules` |
| Calculations in `valueCommitScript` | `## Complex Rules` |
| `validateExp` / `validatePictureClause` | `## Validations` |
| API calls in `initScript` / `clickExp` | `## Integrations` (write API details to `$FORMS_WORKSPACE/refs/apis/<name>.md`) |
| Submit button / form submit | `## Submit` |

Also write API reference files to `$FORMS_WORKSPACE/refs/apis/<name>.md` for each API found in scripts — spec references these files, does not embed API schemas inline.

### Open Items

Add to `## Open Items` in spec:
- Any API endpoint found as TBD or inferred
- Business rules that could not be fully translated
- Fragment paths that need verification

## What This Skill Does NOT Do

- Does NOT write code, scripts, or parsers
- Does NOT generate form JSON or AEM components
- Does NOT modify the source JSON files
- Does NOT use tool commands — this is pure analysis and documentation