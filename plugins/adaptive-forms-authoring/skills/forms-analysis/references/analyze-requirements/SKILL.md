---
name: analyze-requirements
description: >
  Use when analyzing a requirements document, inline text, or journey.md to
  produce a journey spec at journeys/<journey>/spec.md. Extracts API
  definitions to refs/apis/ before writing the spec.
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

Parse requirements input into a structured journey spec at `journeys/<journey>/spec.md`.

## When to Use

- Input is a requirements document, inline user text, or journey.md
- A new journey needs a spec before planning begins
- Requirements contain API definitions that need extracting

## Critical Rules

1. **Act autonomously** — read input, produce spec. Don't ask "should I analyze this?"
2. **Extract APIs first** — write all API definitions to `refs/apis/` before writing spec.md. Spec references files, never inline schemas.
3. **Mark unknowns TBD** — if an API endpoint, data source, or behavior is unclear, mark TBD
4. **No PL.currentFormContext** — mark data sources as TBD instead
5. **Custom components first** — identify custom `fd:viewType` components before describing screens
6. **Complete field coverage** — every user-facing field must appear in the spec

## Input Handling

| Input type | Action |
|---|---|
| Requirements doc at `inputs/<name>.md` | Read directly |
| Inline text from user | Write to `inputs/<journey>-requirements.md` first, then read |
| `.docx` file | Run `scripts/docx-to-text.py <path>` → read output, then proceed |
| With screenshots | Pass visuals to `create-screen-doc` to fill screen structure gaps |

## Step 1 — Extract APIs to refs/apis/

Before writing the spec, scan all input for API information:

| API info type | Action |
|---|---|
| OpenAPI YAML | Copy to `refs/apis/<name>.yaml` as-is |
| Custom YAML | Write to `refs/apis/<name>.yaml` |
| JSON payload / schema | Write to `refs/apis/<name>.json` |
| Inline description (URL, params, response) | Generate `refs/apis/<name>.md` with structured description |
| cURL example | Write to `refs/apis/<name>.md` with endpoint, method, headers, body |
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

### Section 3 — Screens

One sub-section per wizard step. Single-screen journeys have one sub-section.

```markdown
## Screens

### Screen 1: <name>
Purpose: <what the user does on this step>

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

Reference API files extracted to `refs/apis/` in Step 1.

```markdown
## Integrations

> **AEM FDM guard:** APIs with source `aem-fdm` require AEM_HOST and AEM_TOKEN
> in `.skills-workspace/.env`. Mark `sync-blocked: true` if credentials unknown.

### <api-name>
- API ref: refs/apis/<name>.<ext>
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

- `journeys/<journey>/spec.md` — journey specification
- `refs/apis/<name>.<ext>` — one file per API found (written in Step 1)
