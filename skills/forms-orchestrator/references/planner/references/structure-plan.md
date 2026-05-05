---
name: structure-plan
description: >
  Plan type reference for structure plans. Builds the form skeleton: panels,
  fields, and basic per-field validations. Usually the first plan in a journey.
type: plan-type
---

# Structure Plan

Builds the form skeleton: panels, fields, and basic per-field validations.

| Attribute | Value |
|-----------|-------|
| **Primary skills** | `forms-content-author` |
| **Specification focus** | Panel hierarchy tree, field property tables (name, type, required, min, max, pattern) |
| **Typical steps** | Create form on AEM → build form.json with panels and fields → validate → push |
| **Example** | Plan 01: Form Structure & Initial Fields |

---

## Characteristics

- Usually the first plan in a journey — establishes the form skeleton
- Creates placeholder panels for features built in later plans
- Hidden panels default to `visible: false`
- Field specs include `constraintMessages` for validation errors

---

## Specification Sections

A structure plan's specification typically includes:

### Panel Structure

A tree diagram showing the full panel hierarchy with field types:

```
rootPanel
├── panelA
│   ├── fieldA1        (text-input)
│   └── fieldA2        (drop-down)
└── panelB             (initially hidden)
    └── fieldB1        (number-input)
```

### Field Specifications

A table defining every field's properties:

| Field | Type | Required | Min | Max | Pattern | Notes |
|-------|------|----------|-----|-----|---------|-------|
| fieldA1 | text-input | Yes | 2 | 30 | `^[A-Za-z]+$` | Auto-uppercase |
| fieldA2 | drop-down | Yes | — | — | — | Enum from API |

---

## Typical Steps

1. **Create form on AEM** using `forms-content-author` (`create-form` intent):
   - Provide the template source pageId; `forms-content-update` scaffolds the form via `patch-aem-page-content`

2. **Build form content** using `forms-content-author`:
   - Add all top-level panels (including empty placeholders for later plans)
   - Add fields to panels with types, required flags, min/max, patterns
   - Set `visible: false` on panels that are conditionally shown later
   - Add `constraintMessages` for field-level validation errors
   - All changes are written directly to AEM via `patch-aem-page-content`

3. **Validate:**
   ```
   node tools/eds-form-validator/validate.cjs <form.json> code/authoring/_form.json
   ```

---

## Dependencies

- **Depends on:** Nothing — this is typically the first plan
- **Depended on by:** All subsequent plans (workflow, logic, integration, infrastructure)