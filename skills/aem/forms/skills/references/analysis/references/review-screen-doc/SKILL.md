---
name: review-screen-doc
description: >
  Reviews and critiques Screen.md documentation by cross-referencing against
  actual v1 form JSON. Adds missing sections, removes duplicates, resolves
  dropdowns, and validates field properties. Use when reviewing existing screen
  documentation. Triggers: review screen doc, check Screen.md, validate
  documentation, critique screen doc, missing sections.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Screen Documentation Reviewer

Reviews and improves existing `Screen.md` files by validating every claim against the actual form JSON definition, removing duplicated information, and ensuring all required sections are present.

---

## When to Use

- Reviewing an existing `Screen.md` for correctness and completeness
- Validating documented fields, types, and constraints against a form JSON
- Cleaning up duplicate information between Content and Validation sections
- Resolving placeholder dropdown options with actual enum values from JSON
- Ensuring the standard 11-section structure is followed

---

## Critical Rules

1. **Always cross-reference against actual JSON** — never trust the Screen.md at face value; verify every field name, type, dataRef, required flag, visible flag, and constraint
2. **Remove duplicates** — if a validation rule merely restates a property already in the Content table (pattern, min/max, character limits), delete it from Validation Rules
3. **Mark unknowns in Open Items** — anything that cannot be resolved from the JSON (API endpoints, pre-fill sources, ambiguous business logic) goes into Open Items with a clear TBD marker
4. **No code references** — remove all `PL.currentFormContext` setter references; mark data sources as TBD instead
5. **No container panels** — remove panels that are just structural wrappers with no visibility rules

---

## Review Workflow

1. **Read the Screen.md** at `journey/<journey-name>/screens/<screen-name>/Screen.md`
2. **Read the form JSON** (e.g., `refs/afv1/pletb-wo.json`) and search for every field mentioned in the Screen.md
3. **Identify issues** — build a list of: missing fields, incorrect properties, duplicate validations, unresolved dropdowns, unnecessary container panels, unverified APIs
4. **Apply fixes** — update Content tables, remove duplicates from Validation, strip container panels, resolve dropdown options from JSON enums
5. **Update Open Items** — ensure every unresolved item is captured with a checkbox, and add an API Endpoints TBD table for any APIs needing verification

---

## Structure Check

Verify the document contains all 11 sections in this order:

| # | Section | Purpose |
|---|---------|---------|
| 1 | Title and Progress | Screen name, step indicator position |
| 2 | Navigation | Back/Next buttons, targets |
| 3 | Content Screen | Field table: Name, Type, dataRef, Required, Visible, Properties |
| 4 | Validation Rules | Only rules NOT already captured in Content Properties |
| 5 | Visibility Rules | Conditions that show/hide fields or panels |
| 6 | Business Rules | Logic beyond simple validation (calculations, dependencies) |
| 7 | API Calls | Endpoints called on this screen |
| 8 | Error Popups | Modal/toast error definitions |
| 9 | Form Context Variables | Variables read or written on this screen |
| 10 | Summary | Brief description of screen purpose |
| 11 | Open Items / To Be Clarified | Unresolved questions, TBD tables |

---

## Content Validation

For every field in the Content table, verify against the JSON:

| Check | What to verify |
|-------|---------------|
| **Field exists** | Field name is present in the JSON |
| **Type is correct** | Matches JSON type (text-input, drop-down, date-input, etc.) |
| **dataRef is accurate** | Path matches the JSON `dataRef` property |
| **Required flag** | Matches JSON `required` value |
| **Visible flag** | Matches JSON `visible` value; if `false`, must appear in Visibility Rules as "Initially Hidden" |
| **Constraints** | pattern, maxLength, minLength, min, max from JSON are in Properties |
| **Dropdown options** | enum/enumNames from JSON are listed in Properties |

---

## Common Issues

| Issue | How to Fix |
|-------|-----------|
| Validation rule duplicates a Content Property (pattern, min/max, char limits) | Delete the rule from Validation; keep only triggers, error messages, and behaviors not in Content |
| Dropdown shows "TBD" but JSON has enum/enumNames | Extract options from JSON and update Content Properties: `Options: Value1, Value2, Value3` |
| Container panel listed in Content with no visibility rule | Remove the panel row entirely |
| `PL.currentFormContext` references in Business Rules or Form Context | Remove the reference; replace with a TBD note in Open Items |
| Field in JSON missing from Content table | Add the field row with all properties from JSON |
| API endpoint listed without verification | Move to Open Items → API Endpoints TBD table |
| UI/UX details (CSS, styling, screenshots) present | Remove — these do not belong in Screen.md |

---

## What to Remove

- **Container panels** that are purely structural wrappers (always visible, no conditions)
- **Duplicate validation rules** that restate pattern, min/max, or character limits already in Content Properties
- **`PL.currentFormContext`** setter/getter references — replace with TBD
- **UI/UX details** — CSS classes, styling notes, layout specifics
- **Journey state logging** — internal logging implementation details
- **Screenshot references** — image links or references to visual assets

---

## What to Add

- **Missing fields** discovered in JSON but absent from the Content table
- **Resolved dropdown options** extracted from JSON `enum` / `enumNames` arrays
- **API Endpoints TBD table** in Open Items for every API that lacks endpoint verification:

```
| API | Purpose | Reference API (to verify) | Needs |
|-----|---------|---------------------------|-------|
| <api> | <purpose> | `<reference>.json` | Verify endpoint, success/error response |
```

- **Pre-fill data source** as a TBD checkbox if not documented
- **Validation error messages** for any rule that is missing its user-facing message
- **Missing sections** — any of the 11 required sections not present in the document

---

## JSON Resolution Patterns

When resolving values from the form JSON:

- **Dropdowns**: look for `enum` and `enumNames` arrays on the field object → list as `Options: Display1, Display2, ...`
- **Patterns**: look for `pattern` property → add to Content Properties, remove from Validation if duplicated
- **Character limits**: look for `maxLength` / `minLength` → add to Content Properties as `maxChars` / `minLength`
- **Required**: look for `required: true` → set Required column to `true`
- **Hidden fields**: look for `visible: false` → set Visible column to `false` and add "Initially Hidden" entry in Visibility Rules

---

## Output Quality

After review, the Screen.md must:

- Follow the correct 11-section order
- Contain no duplicate information between Content and Validation
- Have no unnecessary container panels
- Have resolved dropdown options wherever JSON provides them
- List all unverified APIs in an Open Items TBD table
- Contain zero `PL.currentFormContext` references
- Have every field property verified against the actual JSON