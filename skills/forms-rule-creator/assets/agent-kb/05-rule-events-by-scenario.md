> Source: https://github.com/adobe-aem-forms/af2-docs/blob/gh-pages/spec/agent-kb/05-rule-events-by-scenario.md

# Rule Events By Scenario
Purpose: Select the correct event name for each rule trigger scenario.
Use when: Asked which event to bind/dispatch for a behavior.
Do not use when: Asked for function signatures or formula syntax.
Input: Trigger scenario (user action, validation, submit, repeatable ops).
Output: Event name plus target and payload expectation.
Related primary: `INDEX.md`.
Related secondary: `08-ootb-functions-reference.md`.
Rule: Prefer canonical event name over deprecated aliases.

## Scenario -> Event
- Form loaded and initial handlers: `load` (form), then `initialize` (DFS over fields).
- Field/dependency change: `change`.
- Focus gained/lost: `focus`, `blur`.
- Click action: `click`.
- Validation result transitions: `valid`, `invalid`.
- Submit flow: `submit` -> (`submitSuccess` | `submitError`).
- Save/reset: `save`, `reset`.
- Repeatable instances: `addInstance`, `removeInstance`.
- Panel item array ops: `addItem`, `removeItem`.
- Processor/script failure: `error` (form-level).

## Event Notes
- `submitFailure` is deprecated; use `submitError`.
- Implementation compatibility note: submit error flows may still emit both `submitError` and deprecated `submitFailure`.
- `change` behavior can be influenced by form property `fd:changeEventBehaviour` (`self` or `deps`).
- `dispatchEvent(element, eventName, payload)` is async and enqueued.

## Common Mistakes
- Using deprecated `submitFailure` for new rules.
- Assuming deprecated `submitFailure` will never be emitted by runtime.
- Dispatching repeatable events on wrong target (must target relevant repeatable element/panel).
