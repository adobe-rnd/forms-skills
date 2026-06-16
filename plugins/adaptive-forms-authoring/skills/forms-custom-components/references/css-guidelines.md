# CSS Guidelines for Custom Form Components

Applies to all `<fd:viewType>.css` files under `blocks/form/components/<fd:viewType>/`.

---

## Scoping

Scope every selector to the component wrapper class `.{fd:viewType}-wrapper` (added by the form runtime):

```css
/* Correct — scoped */
.countdown-timer-wrapper { }
.countdown-timer-wrapper .timer-display { }
.countdown-timer-wrapper input { }

/* Wrong — unscoped, affects all form fields */
input { }
.field-wrapper { }
```

---

## CSS Custom Properties

Prefer form custom properties over hardcoded values:

| Property | Use For |
|---|---|
| `--field-height` | Input height |
| `--field-font-size` | Input font size |
| `--field-border-color` | Default border |
| `--field-border-color-active` | Focus/active border |
| `--field-border-color-error` | Validation error border |
| `--field-background` | Input background |
| `--field-color` | Input text color |
| `--field-label-color` | Label text color |
| `--color-brand-primary` | Primary accent |
| `--color-error` | Error/invalid state |

---

## Mobile-First

Default styles for mobile; add breakpoints for larger viewports:

```css
.card-choice-wrapper .card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (width >= 600px) {
  .card-choice-wrapper .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width >= 900px) {
  .card-choice-wrapper .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## State Classes

Form component state comes from the model via `subscribe` — not from author-applied CSS variant classes. Apply state as modifier classes in the `'change'` callback:

```css
.countdown-timer-wrapper.is-expired { border-color: var(--color-error); }
.countdown-timer-wrapper.is-running { border-color: var(--field-border-color-active); }
```

```js
if (change.propertyName === 'value') {
  fieldDiv.classList.toggle('is-expired', change.currentValue <= 0);
  fieldDiv.classList.toggle('is-running', change.currentValue > 0);
}
```

---

## Validation Error State

The form runtime adds `.field-invalid` on validation failure — hook into it:

```css
.my-component-wrapper.field-invalid input {
  border-color: var(--field-border-color-error);
}

.my-component-wrapper .field-description.field-description-error {
  display: block;
  color: var(--color-error);
}
```

---

## Anti-Patterns

| Don't | Do instead |
|---|---|
| `!important` | Increase specificity via wrapper scope |
| Hardcoded colors (`#ff0000`) | CSS custom properties |
| Bare element selectors (`input { }`) | `.my-wrapper input { }` |
| `max-width` breakpoints | Mobile-first `(width >= N)` |
| Inline styles in JS (`el.style.color`) | Toggle modifier classes |
| Styling `.form-field-wrapper` globally | Only style your own `.<viewType>-wrapper` |
