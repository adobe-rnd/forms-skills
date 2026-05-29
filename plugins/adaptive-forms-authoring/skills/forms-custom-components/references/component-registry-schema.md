# journey/component-registry.md — Schema Reference

`journey/component-registry.md` is an **optional per-project file** cataloging custom `fd:viewType` components. When present, `forms-content-modeler` and `forms-component-inventory` check it before defaulting to OOTB types.

**Location:** `journey/component-registry.md` (project root, alongside `plans/`)

---

## Schema

```markdown
# Component Registry

## Custom Components

| fd:viewType | Base Type | Description | Registered In |
|---|---|---|---|
| countdown-timer | number-input | Numeric countdown — renders remaining time as live display | blocks/form/mappings.js |
| card-choice | radio-group | Radio group rendered as clickable image cards | blocks/form/mappings.js |
| confirm-modal | panel | Fixed overlay modal — shown/hidden via form rules | blocks/form/mappings.js |
```

---

## Rules

- Every entry must have a matching entry in `blocks/form/mappings.js` `customComponents` array
- `fd:viewType` must match the folder name under `blocks/form/components/`
- Update this file when a custom component is added or removed

---

## When to Create This File

Create when the project has 2+ custom components. If it doesn't exist, `forms-content-modeler` and `forms-component-inventory` fall back to reading `mappings.js` directly.

---

## How forms-component-inventory Uses It

When resolving a field intent:
1. Check `journey/component-registry.md` for a matching custom component
2. If found: prefer the custom component — it exists because OOTB was insufficient
3. If not found: fall back to `mappings.js` → then `field-types.md`

Example: registry has `card-choice` (base: radio-group). User says "single choice with images" → use `card-choice` over plain `radio-group`.
