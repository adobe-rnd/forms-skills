---
name: analyze-requirements
description: >
  Use when analyzing a requirements document, inline text, or journey.md to
  produce a journey spec at journeys/<journey>/spec.md. Extracts API
  definitions to $FORMS_WORKSPACE/refs/apis/ before writing the spec.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.2"
  type: skill
  triggers:
    - analyze requirements
    - create spec
    - plan form
    - journey spec
    - requirements doc
---

# Analyze Requirements

Parse requirements input into a structured journey spec at `$FORMS_WORKSPACE/journeys/<journey>/spec.md`.

## When to Use

- Input is a requirements document, inline user text, or journey.md
- A new journey needs a spec before planning begins
- Requirements contain API definitions that need extracting

## Critical Rules

1. **Act autonomously** — read input, produce spec. Don't ask "should I analyze this?"
2. **Extract APIs first** — write all API definitions to `$FORMS_WORKSPACE/refs/apis/` before writing spec.md. Spec references files, never inline schemas.
3. **Mark unknowns TBD** — if an API endpoint, data source, or behavior is unclear, mark TBD
4. **No PL.currentFormContext** — mark data sources as TBD instead
5. **Custom components first** — identify custom `fd:viewType` components before describing screens
6. **Complete field coverage** — every user-facing field must appear in the spec
7. **Identify fragments** — before describing screens, flag panels that meet fragment thresholds (reused across 2+ forms, 10+ fields, regulatory, or frequently changing). Document in `## Fragments` section; note fragment reference in the affected screen(s).

## Input Handling

| Input type | Action |
|---|---|
| Requirements doc at `$FORMS_WORKSPACE/inputs/<name>.md` | Read directly |
| Inline text from user | Write to `$FORMS_WORKSPACE/inputs/<journey>-requirements.md` first, then read |
| `.docx` file | Run `scripts/docx-to-text.py <path>` → read output, then proceed |
| With screenshots | Pass visuals to `visual-analysis` to fill screen structure gaps |
| Images / Figma URLs / design file links | Attribute each to its screen and record under that screen's `Design references` in the spec |

**Design references rule:** any image path, screenshot attachment, Figma URL (`figma.com/design/...`), or design file link found in the requirements input must be attributed to a specific screen. Record them under a `### Design references` sub-section inside the relevant screen entry. If a reference covers multiple screens, duplicate the entry per screen. If attribution is ambiguous, list under all plausible screens and mark `(unconfirmed)`. Never discard design references — they are carried forward into screen plans and consumed by `forms-style-screen`.

## Step 1 — Extract APIs to $FORMS_WORKSPACE/refs/apis/

Before writing the spec, scan all input for API information:

| API info type | Action |
|---|---|
| OpenAPI YAML | Copy to `$FORMS_WORKSPACE/refs/apis/<name>.yaml` as-is |
| Custom YAML | Write to `$FORMS_WORKSPACE/refs/apis/<name>.yaml` |
| JSON payload / schema | Write to `$FORMS_WORKSPACE/refs/apis/<name>.json` |
| Inline description (URL, params, response) | Generate `$FORMS_WORKSPACE/refs/apis/<name>.md` with structured description |
| cURL example | Write to `$FORMS_WORKSPACE/refs/apis/<name>.md` with endpoint, method, headers, body |
| No APIs found | Skip — omit `## Integrations` section from spec |

## Step 2 — Write journeys/<journey>/spec.md

Produce a structured markdown file with ALL applicable sections in this order:

---

### Section 1 — Overview

```markdown
# Journey: <name>

## Overview
- Purpose: <one sentence — what the user accomplishes>
- Form path: /content/forms/af/<name>
- Screen count: N
```

`Screen count` drives planner: 1 = single-screen (no wizard needed), N > 1 = wizard steps.

---

### Section 2 — Custom Components

Identify from requirements + project `blocks/form/mappings.js` if accessible.

```markdown
## Custom Components

| fd:viewType | Base Type | Purpose |
|---|---|---|
| card-choice | radio-group | Radio options as clickable image cards |
```

If none: write `None` under the heading. Planner skips Custom Component plan if `None`.

---

### Section 2.5 — Fragments

Identify panels that should be extracted as reusable fragments. Apply thresholds:

| Threshold | Create fragment when... |
|-----------|------------------------|
| Reusability | Panel appears in 2+ forms |
| Complexity | 10+ fields OR complex logic that clutters the main form |
| Standardization | Regulatory/consent text that must be org-consistent |
| Maintenance | Section changes frequently and propagation must be instant |

```markdown
## Fragments

| Fragment | File | Used In | Reason |
|----------|------|---------|--------|
| personal-details | forms/personal-details.json | Screen 1, Screen 3 | Reused across 3 journeys |
| consent-block | forms/consent-block.json | Screen 4 | Regulatory — must be org-consistent |
```

If none: write `None` under the heading. Planner skips Fragment plan if `None`.

For each fragment entry, add a `#### Design references` sub-section immediately after the fragment table, one per fragment:

```markdown
### Fragment: personal-details

#### Design references
| Source | URL / Path | Viewport | Notes |
|---|---|---|---|
| Figma | https://figma.com/design/{fileKey}/...?node-id={nodeId} | desktop | Fragment frame |
| Screenshot | $FORMS_WORKSPACE/inputs/fragment-personal-details.png | desktop | — |

_(Write `none` if no design references found for this fragment.)_
```

Apply the same **design references rule** as screens: any image, screenshot, or Figma URL in the requirements that pertains to a fragment must be captured here.

In the affected `## Screens` sub-section, note the fragment reference instead of listing fields inline:

```markdown
### Screen 1: Personal Details
Purpose: Collect user identity information
Fragment: `forms/personal-details.json`
```

---

### Section 3 — Screens

One sub-section per wizard step. Single-screen journeys have one sub-section.

```markdown
## Screens

### Screen 1: <name>
Purpose: <what the user does on this step>

#### Design references
| Source | URL / Path | Viewport | Notes |
|---|---|---|---|
| Figma | https://figma.com/design/{fileKey}/...?node-id={nodeId} | desktop | Main screen frame |
| Screenshot | $FORMS_WORKSPACE/inputs/screen-01-desktop.png | desktop | — |

_(Write `none` if no design references found for this screen.)_

| Field Name | Type / fd:viewType | Required | Placeholder | Notes |
|---|---|---|---|---|
| full_name | text-input | yes | Full name | — |
| plan_type | card-choice | yes | — | Uses card-choice custom component |
| dob | date-input | yes | — | Must be 18+ |

### Screen 2: <name>
...
```

---

### Section 4 — Navigation

Only if Screen count > 1.

```markdown
## Navigation

| From | To | Condition |
|---|---|---|
| Screen 1 | Screen 2 | always |
| Screen 2 | Screen 3 | field_x = "yes" |
| Screen 2 | Screen 4 | field_x != "yes" |
```

---

### Section 5 — Functional Rules

Show/hide, enable/disable, set-value rules.

```markdown
## Functional Rules

| Trigger Field | Condition | Action | Target |
|---|---|---|---|
| has_spouse | value = "yes" | show | spouse_name |
| country | value != "US" | hide | state_field |
```

Omit section if no functional rules.

---

### Section 6 — Complex Rules

Calculations and derived values.

```markdown
## Complex Rules

| Output Field | Formula | Input Fields |
|---|---|---|
| total_premium | base_rate × coverage_amount | base_rate, coverage_amount |
```

Omit section if no complex rules.

---

### Section 7 — Validations

Field constraints and cross-field validations.

```markdown
## Validations

| Field | Rule | Error Message |
|---|---|---|
| email | email format | Enter a valid email |
| confirm_email | equals email | Emails must match |
| dob | date in past | Date of birth must be in the past |
```

---

### Section 8 — Integrations

Reference API files extracted to `$FORMS_WORKSPACE/refs/apis/` in Step 1.

```markdown
## Integrations

> **AEM FDM guard:** APIs with source `aem-fdm` require AEM_HOST and AEM_TOKEN
> in `.skills-workspace/.env`. Mark `sync-blocked: true` if credentials unknown.

### <api-name>
- API ref: $FORMS_WORKSPACE/refs/apis/<name>.<ext>
- Source: `aem-fdm` | `new`
- Sync blocked: true | false   ← aem-fdm only
- Trigger: `form-load` | `field-change: <field_name>` | `button-click: <field_name>`
- Purpose: <one line>
- Response → form mapping:
  - response.<field> → form.<field_name>
- On error: `<message>` | `silent`
```

Omit section if no integrations.

---

### Section 9 — Submit

```markdown
## Submit
- Endpoint: POST /api/submit (or TBD)
- Success: <message text> | redirect to <url>
- Error: <message text>
```

---

### Section 10 — Acceptance Criteria

Journey-level criteria (not plan-level).

```markdown
## Acceptance Criteria
- [ ] Form renders all N fields across M screens
- [ ] Submits to <endpoint> on confirmation
- [ ] Shows <success state> on completion
- [ ] <Key conditional behavior>
```

---

### Section 11 — Open Items

```markdown
## Open Items
- [ ] <API endpoint TBD>
- [ ] <Unclear business rule>
- [ ] <Data source TBD>
```

Omit if no open items.

---

## Complexity Check

After writing the spec, evaluate:

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Screen count | X | ≤ 15 | 🟢/🟡/🔴 |
| Fields (total) | X | ≤ 150 | 🟢/🟡/🔴 |
| Functional rules | X | ≤ 50 | 🟢/🟡/🔴 |
| APIs (unique) | X | ≤ 12 | 🟢/🟡/🔴 |

🔴 on any metric → add a Complexity Warning to Open Items with recommended action (split journey, reduce scope).

## Output

- `$FORMS_WORKSPACE/journeys/<journey>/spec.md` — journey specification
- `$FORMS_WORKSPACE/refs/apis/<name>.<ext>` — one file per API found (written in Step 1)
