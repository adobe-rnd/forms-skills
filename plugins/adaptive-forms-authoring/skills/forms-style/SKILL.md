---
name: forms-style
description: >
  Use when styling or theming an AEM EDS form — changing colors, typography,
  spacing, layout, or component appearance. Covers both global form.css rules
  and per-component CSS files. NOT for adding fields or writing rules — use
  forms-author or forms-rule-author instead.
license: Apache-2.0
metadata:
  type: skill
  author: Adobe
  version: "0.1"
  triggers:
    - style
    - theme
    - css
    - color
    - font
    - spacing
    - layout
    - appearance
    - border
    - background
    - padding
    - margin
    - form.css
    - component css
    - styling the form
    - visual design
---

# Forms Style

Apply CSS styling to AEM EDS forms. Two target files, two selector axes, one rule: **override CSS custom properties before writing new selector rules**.

---

## When to Use

- Changing form colors, typography, spacing, or layout
- Styling a specific field type (all date pickers, all dropdowns)
- Styling a specific field by name (the `fullName` field only)
- Styling a registered component (wizard, accordion, modal, custom component)
- Applying a visual design or brand theme to a form

**Not for:** adding fields (`forms-author`), writing business rules (`forms-rule-author`), creating custom components (`forms-custom-components`).

---

## Dependencies

- **[forms-component-inventory](../forms-component-inventory/SKILL.md)** — run first to discover which components have their own CSS files and where they live
- **[references/form-css-vars.md](references/form-css-vars.md)** — all `--form-*` custom properties with defaults and purpose

---

## File Routing

| What you're styling | File to edit |
|---|---|
| All form inputs, labels, buttons, layout | `$FORMS_EDS_ROOT/blocks/form/form.css` |
| A specific field type (e.g., all date pickers) | `$FORMS_EDS_ROOT/blocks/form/form.css` |
| A specific field by name | `$FORMS_EDS_ROOT/blocks/form/form.css` |
| A registered component (wizard, accordion, modal, or custom) | `$FORMS_EDS_ROOT/blocks/form/components/{name}/{name}.css` |

Run `forms-component-inventory` to confirm which components have a CSS file. If the component's CSS file does not exist yet, create it at the deterministic path above.

---

## Workflow

### Step 1 — Run forms-component-inventory

Identify which components are registered and whether they have their own CSS file. This determines where to write styles.

### Step 2 — Identify the styling target

Determine:
- **Scope**: global (all fields of a type) or specific (one named field)
- **File**: `form.css` or `components/{name}/{name}.css`

### Step 3 — CSS var override first

Check [references/form-css-vars.md](references/form-css-vars.md). If a `--form-*` variable controls what you want to change, override it in `:root` at the top of `form.css`:

```css
:root {
  --form-input-border-color: #0070c0;
  --form-input-font-size: 1.125rem;
  --form-button-background-color: #1a1a1a;
}
```

This is safer than adding selector rules — it propagates everywhere the var is used.

### Step 4 — Add scoped selector rules for what vars don't cover

Use the [selector system](#selector-system) below. Always scope to `main .form` to prevent bleed outside the form.

### Step 5 — Read the target file before editing

Use the Read tool on the target CSS file. Verify the selector doesn't already exist before adding it.

---

## Selector System

Two axes — type-based and name-based. Use both simultaneously when needed.

### Axis 1: Type-based (field type wrapper)

Target all fields of a given `fieldType`:

```css
/* All text inputs */
main .form .text-input-wrapper input { }

/* All date pickers */
main .form .date-input-wrapper input { }

/* All dropdowns */
main .form .drop-down-wrapper select { }

/* All radio groups */
main .form .radio-group-wrapper { }

/* All checkboxes (single) */
main .form .checkbox-wrapper { }

/* All file uploads */
main .form .file-wrapper { }

/* All buttons */
main .form .button-wrapper button { }
```

Pattern: `main .form .{fieldType}-wrapper` where `fieldType` matches the value in `form.json` (e.g., `text-input`, `date-input`, `drop-down`, `radio-group`, `checkbox-group`, `file-input`, `button`, `panel`).

### Axis 2: Name-based (field name class)

Target one specific field by its `name` property from `form.json`:

```css
/* Field named "fullName" — targets the wrapper div */
main .form .field-fullName { }
main .form .field-fullName input { border-left: 4px solid green; }
main .form .field-fullName label { font-weight: 600; }
```

Pattern: `main .form .field-{name}` — the runtime adds `field-{name}` as a class to the field's wrapper element.

### State selectors

These classes are added by the form runtime — do not add them in JS:

```css
/* Validation failure */
main .form .field-invalid input { border-color: var(--form-invalid-border-color); }

/* Required indicator (already in form.css via [data-required="true"]) */
[data-required="true"] > label::after { content: "*"; color: var(--form-error-color); }

/* Disabled */
main .form input:disabled { background-color: var(--form-input-disable-color); }

/* Hidden (managed by form model — do not override) */
/* form:not(.edit-mode) [data-visible="false"] { display: none !important; } */
```

### Component CSS scoping

For registered components (files under `components/{name}/`), scope to the component wrapper:

```css
/* In components/wizard/wizard.css */
.wizard-menu-items { background-color: #1a1a1a; color: #fff; }

/* In components/accordion/accordion.css */
.accordion-wrapper .accordion-item-label { font-weight: 700; }
```

The form runtime loads these files automatically when the component is registered in `mappings.js`.

---

## Worked Example

**Task:** "Blue border on text inputs, dark wizard header, green accent on fullName field"

**Step 1** — inventory confirms `wizard.css` exists at `components/wizard/wizard.css`.

**Step 2** — targets: text-input (type), fullName (name) → `form.css`; wizard header → `wizard.css`.

**Step 3** — CSS var override in `form.css`:

```css
:root {
  --form-input-border-color: #0070c0;
}
```

**Step 4** — selector rules for what vars don't cover:

```css
/* form.css — fullName accent (no var for per-field accent) */
main .form .field-fullName input {
  border-left: 4px solid #28a745;
}
```

```css
/* components/wizard/wizard.css — wizard nav dark theme */
.wizard-menu-items {
  background-color: #1a1a1a;
  color: #ffffff;
  padding: 1rem;
}

.wizard-menu-items .wizard-menu-item {
  color: #ffffff;
}
```

---

## Anti-Patterns

| Don't | Do instead |
|---|---|
| `input { border-color: blue; }` — unscoped | `main .form input { border-color: blue; }` |
| `[name="fullName"] { }` — attribute selector on input | `main .form .field-fullName { }` — wrapper class |
| Hardcode `#0070c0` when `--form-input-border-color` exists | Override the var in `:root` |
| Inline styles via JS (`el.style.color`) | Modify CSS files only |
| Toggle `display: none` to hide fields | Never — visibility is owned by the form model (`[data-visible="false"]`) |
| `.wizard-header { }` — guessing class names | Read rendered HTML or wizard.css to confirm actual classes |
| `!important` | Increase specificity via `main .form` scope |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Style not applying | Check specificity — prefix with `main .form` |
| Component CSS not loading | Verify component registered in `mappings.js` `customComponents` or `OOTBComponentDecorators` |
| Field-name class wrong | Confirm `name` value in `form.json` — class is `field-{name}` verbatim |
| Var override not propagating | Ensure override is in `:root` at top of `form.css`, not inside a selector |
| Wizard classes unknown | Read `blocks/form/components/wizard/wizard.css` or inspect rendered HTML |
