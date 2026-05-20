# Field Type → fieldType Reference

Maps user natural language to the AEM `fieldType` value. The exact `componentType` is resolved
from the live definition by `resolve-component-type.bundle.js` — it is **not** hard-coded here.

**How to use this table:**
1. Match user intent against the "User Says" column (keyword match — any phrase in the list qualifies)
2. Take the `fieldType` value
3. Pass to `resolve-component-type` to get the candidates list
4. If one candidate, use it. If multiple, pick the candidate whose `title` contains the keyword in the Notes column (case-insensitive substring match — titles vary across component libraries)

---

## Field Types

| User Says | fieldType | Notes |
|---|---|---|
| text, name, first name, last name, input, short text, string | `text-input` | Default for any free-text single-line input |
| textarea, multiline, multiline text, multi-line, long text, text area | `text-input` | Add `multiLine: true` to component properties |
| phone, mobile, telephone, cell, contact number | `tel` | |
| email, email address, e-mail | `email` | |
| number, amount, count, age, quantity, price, rate, salary | `number-input` | |
| date, DOB, date of birth, expiry, expiry date, calendar | `date-input` | |
| date and time, datetime, timestamp, appointment | `datetime-input` | |
| dropdown, select, picker, choose one, list | `drop-down` | |
| radio, radio button, single choice, one of, option group | `radio-group` | |
| checkbox group, multi-select, multiple choice, tick all that apply | `checkbox-group` | |
| checkbox, agree, accept, yes/no, single tick, terms | `checkbox` | title contains "checkbox" (not "switch") |
| switch, toggle, on/off, enable/disable | `checkbox` | title contains "switch" |
| file, upload, attachment, document, PDF upload, image upload | `file-input` | |
| submit, submit button, send, confirm, done | `button` | title contains "submit" |
| reset, clear, start over, reset button | `button` | title contains "reset" |
| button, action button, generic button, click | `button` | title contains "button" (not submit/reset) |
| title, heading, section heading, h1, h2, h3 | `plain-text` | title contains "title" |
| text block, paragraph, description text, static text, body text | `plain-text` | title contains "text" (not title) |
| image, photo, picture, graphic, logo | `image` | |
| section, panel, group, container, step | `panel` | title contains "panel" (not accordion/wizard/tab/fragment) |
| accordion, collapsible section | `panel` | title contains "accordion" |
| wizard layout, wizard | `panel` | title contains "wizard" — wrapper appears once, contains panelcontainer steps |
| wizard step | `panel` | title contains "panel" — individual step inside the wizard |
| tabs, tab panel, tabbed section | `panel` | title contains "tab" |
| fragment, reusable section, embedded form | `panel` | title contains "fragment" |

---

## Panels

`panelcontainer`, `accordion`, `wizard`, `tabsontop`, and `fragment` all use `fieldType: "panel"`.
`resolve-component-type` returns all of them as candidates — pick by title using the Notes column above.

> **Wizard structure:** the `wizard` component is the navigation wrapper (step tabs, progress bar, next/back buttons) and appears **once**. Each individual step is a `panelcontainer` nested inside it.
>
> ```
> guideContainer (form)
>   └── wizard                  ← ONE wizard wrapper
>         ├── panelcontainer    ← step 1
>         ├── panelcontainer    ← step 2
>         └── panelcontainer    ← step 3
> ```
