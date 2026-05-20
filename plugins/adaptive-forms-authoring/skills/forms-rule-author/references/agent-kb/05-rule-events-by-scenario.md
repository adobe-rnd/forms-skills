# Rule Events By Scenario
Purpose: Select the correct event name for each rule trigger scenario.
Use when: Asked which event to bind/dispatch for a behavior.
Do not use when: Asked for function signatures or formula syntax.
Input: Trigger scenario (user action, validation, submit, repeatable ops).
Output: Event name plus target and payload expectation.
Related secondary: `08-ootb-functions-reference.md`.

## Scenario -> Event
- Form loaded and initial handlers: `load` (form), then `initialize` (DFS over fields).
- Field/dependency change: `change`.
- Click action: `click`.
- Submit flow: `submit` -> (`submitSuccess` | `submitError`).
- Save/reset: `save`, `reset`.
- Processor/script failure: `error` (form-level).

> Events not implemented and intentionally excluded from the table above:
> `focus`, `blur`, `valid`, `invalid`, `addInstance`, `removeInstance`,
> `addItem`, `removeItem`. They may be added in a future revision.

## Event Notes
- `dispatchEvent(element, eventName, payload)` is async and enqueued.
