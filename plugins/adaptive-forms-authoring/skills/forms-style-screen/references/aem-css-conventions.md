# AEM EDS Forms — CSS Class Emission Reference

Source of truth: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/build-forms/getting-started-edge-delivery-services-forms/style-theme-forms

These classes are emitted by the EDS forms block at render time. **Do not invent new classes** — write CSS scoped to the classes below. The form HTML is owned by AEM; styling must work with what is emitted.

## Field-name → class derivation

A form field named `panName` becomes `field-pan-name` in the DOM. The rule:

- Lowercased.
- Multiple consecutive non-alphanumeric characters collapse to a single dash.
- Leading and trailing dashes are removed.
- Only alphanumerics and dashes are kept.

Use this when mapping a field's qualified name (from the AEM content model or the rendered DOM) to the selector used in CSS.

## Field-type wrapper classes

Each field type gets a wrapper class on its containing element:

| Field type | Wrapper class |
|---|---|
| Text input | `text-wrapper` |
| Number input | `number-wrapper` |
| Email input | `email-wrapper` |
| Date input | `date-wrapper` |
| Dropdown / select | `drop-down-wrapper` |
| Radio group | `radio-group-wrapper` |
| Checkbox group | `checkbox-group-wrapper` |
| Single radio | `radio-wrapper` |
| Single checkbox | `checkbox-wrapper` |
| File upload | `file-wrapper` |
| Panel / fieldset | `panel-wrapper` |
| Submit button | `submit-wrapper` |
| Generic field wrapper | `field-wrapper` |

## Panels, fieldsets, labels

- Panels render as `<fieldset class="panel-wrapper field-{name} field-wrapper">`.
- The panel title is in a `<legend class="field-label">`.
- Field labels are `<label class="field-label">`.
- Repeatable panels carry `data-repeatable="true"` and have `.repeat-wrapper`.

## Wizard structure

Wizards add specific classes:

- Container: `<fieldset class="wizard">`. Add `.left` modifier for vertical menu.
- Step menu container: `.wizard-menu-items` (use `.hdfc-wizard` in this project for the custom hidden-step variant).
- Step items: `.wizard-menu-item`. Active item: `.wizard-menu-active-item`.
- Active step panel: `.current-wizard-step` (only rendered panel; others are hidden by `display: none`).
- Step navigation buttons wrapper: `.wizard-button-wrapper`.
- Prev / Next buttons: `.wizard-button-prev`, `.wizard-button-next`.

## State attributes

- `data-required="true"` — required field. Renders the `*` indicator (already styled in `form.css`).
- `data-visible="false"` — field hidden via rule. `form.css` hides these unless `.edit-mode`.
- `data-active="true"` — focused/active input (used for floating-label transform in `form.css`).
- `data-empty="false"` — input has a value (also used for floating-label transform).
- `.field-invalid` — field with a validation error.

## Grid columns

A `.field-wrapper` can carry `.col-1` … `.col-12` to take that many of the 12 grid columns. Below 768px these collapse to span 12.

## Cards pattern

`<fieldset class="cards">` with `.radio-wrapper` / `.checkbox-wrapper` children renders a card-style selector group. `.cards.horizontal` lays them in a row. The selected state uses `input:checked ~ label` (already styled in `form.css`).

## Recommended selector patterns

```css
/* Type-based (broad) */
.text-wrapper input { ... }
.drop-down-wrapper select { ... }

/* Field-specific (narrow) */
.field-pan-name input { ... }

/* Panel-scoped (preferred for screen styles) */
.field-personal-details-panel .field-pan-name input { ... }

/* State-based */
[data-required="true"] > label::after { ... }
.field-invalid input { ... }

/* Wizard step-scoped */
.current-wizard-step.field-account-selection-panel .cards { ... }
```

## Constraints — what NOT to do

- **Do not change the DOM.** Don't add wrapper elements, don't move children, don't rename. Style only.
- **Do not invent classes.** If a screen needs a new visual variant, use existing conventions (`.cards`, `.cards.horizontal`, `.left` on wizard, `.col-N`). If none fit, scope the rule under `.field-{panelName}` rather than adding a new class to the form model.
- **Do not bypass the cascade.** `form.css` already defines `:root` tokens, base resets, fieldset rules, wizard chrome, cards, repeatables. Reuse — don't redefine.
- **Avoid `!important`.** Existing `video-kyc.css` uses `!important` for legend overrides; this is a code smell. Prefer increasing selector specificity by chaining stable classes.
