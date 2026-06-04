# Form CSS Custom Properties

All `--form-*` custom properties defined in `blocks/form/form.css `:root`. Override these in `:root` at the top of `form.css` to change defaults globally. Prefer var overrides over adding new selector rules.

---

## Typography

| Variable | Default | Controls |
|---|---|---|
| `--form-font-size-m` | `22px` | Medium text size |
| `--form-font-size-s` | `18px` | Small text — used for labels, buttons, paragraphs |
| `--form-font-size-xs` | `16px` | Extra-small — used for upload labels |
| `--form-input-font-size` | `1rem` | Input field text size |
| `--form-label-font-size` | `var(--form-font-size-s)` | Label text size |
| `--form-label-font-weight` | `400` | Label font weight |
| `--form-title-font-weight` | `600` | Section title / legend font weight |
| `--form-button-font-size` | `var(--form-font-size-s)` | Button text size |
| `--form-paragraph-font-size` | `var(--form-font-size-s)` | Plain-text / paragraph field size |
| `--form-paragraph-font-style` | `none` | Plain-text font style (e.g., `italic`) |
| `--form-fieldset-legend-font-size` | `var(--form-label-font-size)` | Fieldset legend font size |
| `--form-fieldset-legend-font-weight` | `var(--form-title-font-weight)` | Fieldset legend font weight |

---

## Colors

| Variable | Default | Controls |
|---|---|---|
| `--form-input-border-color` | `var(--border-color)` → `#818a91` | Input/textarea/select border |
| `--form-invalid-border-color` | `#ff5f3f` | Border color on validation failure |
| `--form-error-color` | `#ff5f3f` | Error text and required asterisk |
| `--form-input-background-color` | `var(--background-color-primary)` → `#fff` | Input background |
| `--form-input-disable-color` | `#ebebe4` | Disabled input background |
| `--form-background-color` | `var(--background-color-primary)` | Form container background |
| `--form-label-color` | `var(--label-color)` → `#666` | Labels and description text |
| `--form-paragraph-color` | `var(--label-color)` | Plain-text field color |
| `--form-fieldset-legend-color` | `var(--form-label-color)` | Fieldset legend color |

---

## Buttons

| Variable | Default | Controls |
|---|---|---|
| `--form-button-color` | `var(--background-color-primary)` → `#fff` | Button text color |
| `--form-button-background-color` | `var(--button-primary-color)` → `#5F8DDA` | Button background |
| `--form-button-background-hover-color` | `var(--button-primary-hover-color)` → `#035fe6` | Button hover background |
| `--form-button-border` | `2px solid transparent` | Button border |
| `--form-button-padding` | `15px 50px` | Button padding |
| `--form-submit-width` | `100%` | Submit button width |

---

## Inputs

| Variable | Default | Controls |
|---|---|---|
| `--form-input-border-size` | `1px` | Input border width |
| `--form-input-padding` | `0.75rem 0.6rem` | Input inner padding |

---

## Layout & Spacing

| Variable | Default | Controls |
|---|---|---|
| `--form-width` | `100%` | Overall form width |
| `--form-padding` | `0 10px` | Form container padding |
| `--form-columns` | `12` | CSS grid column count |
| `--form-field-horz-gap` | `40px` | Horizontal gap between fields in grid |
| `--form-field-vert-gap` | `20px` | Vertical gap between fields in grid |
| `--form-field-gap` | `5px` | Margin applied to each field wrapper |

---

## Fieldset / Panel

| Variable | Default | Controls |
|---|---|---|
| `--form-fieldset-border` | `0` | Fieldset border (set to e.g. `1px solid #ccc` to add borders) |
| `--form-fieldset-marign` | `0` | Fieldset margin |
| `--form-fieldset-columns` | `1` | Columns inside a fieldset |
| `--form-fieldset-legend-border` | `none` | Bottom border on section legends |
| `--form-fieldset-legend-padding` | `0` | Padding on section legends |

---

## Paragraph / Plain Text

| Variable | Default | Controls |
|---|---|---|
| `--form-paragraph-margin` | `0 0 0.9rem` | Margin below plain-text fields |

---

## File Upload

| Variable | Default | Controls |
|---|---|---|
| `--form-upload-color` | `var(--form-label-color)` | File selector button text |
| `--form-upload-font-size` | `var(--form-font-size-xs)` | File selector button font size |
| `--form-upload-background-color` | `var(--background-color-primary)` | File selector button background |

---

## Wizard

| Variable | Default | Controls |
|---|---|---|
| `--form-wizard-border` | `0` | Outer wizard border |
| `--form-wizard-border-color` | `#757575` | Wizard border color |
| `--form-wizard-background-color` | `var(--background-color-primary)` | Wizard panel background |
| `--form-wizard-number-color` | `var(--button-primary-color)` | Step number circle color |
| `--form-wizard-padding` | `0px` | Wizard horizontal padding |
| `--form-wizard-padding-bottom` | `160px` | Wizard bottom padding |
| `--form-wizard-step-legend-padding` | `10px` | Step legend padding |
| `--form-wizard-step-legend-font-size` | `1.1rem` | Step legend font size |

---

## Card Options (radio/checkbox rendered as cards)

These apply when a `radio-group` or `checkbox-group` panel has the `cards` class (set via authoring property).

| Variable | Default | Controls |
|---|---|---|
| `--form-card-border-color` | `#e0e0e0` | Card border |
| `--form-card-border-radius` | `4px` | Card corner radius |
| `--form-card-padding` | `0.6rem 0.8rem` | Card inner padding |
| `--form-card-background` | `var(--background-color-primary)` | Card background |
| `--form-card-shadow` | `0 1px 2px rgb(0 0 0 / 3%)` | Card default shadow |
| `--form-card-hover-shadow` | `0 2px 4px rgb(0 0 0 / 6%)` | Card hover shadow |
| `--form-card-selected-border-color` | `var(--button-primary-color)` | Selected card border |
| `--form-card-selected-background` | `#F5F9FF` | Selected card background |
| `--form-card-selected-shadow` | `0 0 0 1px var(--button-primary-color)` | Selected card ring |
| `--form-card-transition` | `all 0.15s ease-in-out` | Card animation |

---

## Override Pattern

```css
/* At top of blocks/form/form.css — override any var here */
:root {
  /* Brand primary */
  --button-primary-color: #d84800;
  --button-primary-hover-color: #b03a00;

  /* Input styling */
  --form-input-border-color: #d0d0d0;
  --form-input-font-size: 1.125rem;

  /* Label */
  --form-label-font-size: 1rem;
  --form-label-color: #333;

  /* Wizard */
  --form-wizard-number-color: #d84800;
}
```
