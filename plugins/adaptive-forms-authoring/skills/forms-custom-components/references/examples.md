# Custom Component Examples

Three worked examples showing the full scaffold + register + implement pattern.

---

## Countdown Timer (extends `number-input`)

Captures a numeric duration value and renders it as a live countdown display.

- **base_type**: `number-input`
- **fd:viewType**: `countdown-timer`

```bash
npm run create:custom-component -- --name countdown-timer --base number-input
```

Register: add `'countdown-timer'` to `customComponents` in `mappings.js`.

**Key implementation points:**
- Read initial value from `fieldJson` in the `'register'` callback
- Create a `<span>` overlay showing remaining time
- On `'change'` → `propertyName === 'value'`: reset countdown to new value
- Dispatch `new Event('change', { bubbles: true })` on the underlying input when countdown reaches zero

---

## Card Choice (extends `radio-group`)

Renders radio options as clickable cards with images and labels instead of plain radio buttons.

- **base_type**: `radio-group`
- **fd:viewType**: `card-choice`

```bash
npm run create:custom-component -- --name card-choice --base radio-group
```

Register: add `'card-choice'` to `customComponents` in `mappings.js`.

**Key implementation points:**
- In the `'register'` callback: iterate `.radio-wrapper` elements (enum entries, not field models — no `data-id`)
- For each, wrap content in a `<div class="card">` with image + label
- React to selection via the parent's `subscribe` callback on `value`/`enum` changes
- Do NOT call `subscribe()` per `.radio-wrapper` — options are not field models

---

## Modal / Overlay (extends `panel`)

A panel that renders as a fixed overlay. Initially hidden; shown/hidden via form rules.

- **base_type**: `panel`
- **fd:viewType**: `confirm-modal`

### 1. Add to form.json

```json
"confirmModal": {
  "fieldType": "panel",
  "sling:resourceType": "core/fd/components/form/panelcontainer/v1/panelcontainer",
  "fd:viewType": "confirm-modal",
  "name": "confirmModal",
  "jcr:title": "Confirm",
  "visible": false
}
```

### 2. Scaffold and register

```bash
npm run create:custom-component -- --name confirm-modal --base panel
```

Add `'confirm-modal'` to `customComponents` in `mappings.js`.

### 3. decorate()

```js
import { subscribe } from '../../rules/index.js';

export default function decorate(fieldDiv, fieldJson, container, formId) {
  fieldDiv.classList.add('modal-panel');

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.addEventListener('click', () => {
    fieldDiv.dispatchEvent(new CustomEvent('modal:close', { bubbles: true }));
  });
  fieldDiv.prepend(backdrop);

  subscribe(fieldDiv, formId, (_el, _model, eventType, payload) => {
    if (eventType === 'change') {
      payload?.changes?.forEach((change) => {
        if (change?.propertyName === 'visible') {
          backdrop.style.display = change.currentValue ? 'block' : 'none';
        }
      });
    }
  }, { listenChanges: true });

  return fieldDiv;
}
```

### 4. confirm-modal.css

```css
.confirm-modal-wrapper {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-modal-wrapper .modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 50%);
}

.confirm-modal-wrapper .panel-wrapper {
  position: relative;
  z-index: 1;
  background: var(--background-color);
  padding: 2rem;
  border-radius: 0.5rem;
  max-width: 480px;
  width: 100%;
}
```

### 5. Wire visibility rules

Use `forms-rule-author` — SHOW_STATEMENT / HIDE_STATEMENT on the modal panel from a button click, API error, or custom event.

> **Key point:** Showing/hiding is always done via the form model (rules or `globals.functions.setProperty`), never by toggling CSS `display` directly.
