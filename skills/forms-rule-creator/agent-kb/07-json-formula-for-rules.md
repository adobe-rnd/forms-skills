> Source: https://github.com/adobe-aem-forms/af2-docs/blob/gh-pages/spec/agent-kb/07-json-formula-for-rules.md

# JSON Formula For Rules
Purpose: Define syntax/evaluation behavior used in rule expressions.
Use when: Asked how to write/parse rule expressions.
Do not use when: Asked for function catalog details (use OOTB file).
Input: Expression intent and referenced field/data paths.
Output: Valid JSON Formula expression pattern.
Related primary: `INDEX.md`.
Related secondary: `08-ootb-functions-reference.md`.
Runtime model: Expressions evaluate against Form Runtime Model.

## Minimal Answer Template
- Access: `<element>.$<property>` or absolute `$form...`
- Operator/function: `<operator or function>`
- Result type: `<boolean|string|number|object|array>`

## Access Patterns
- Absolute path: `$form.accidentData.fullName.firstName`
- Array item access: `$form.panel.arrayField[0]`
- Special chars in names: quote segment (example: `$form."sp3ci@l'Field"`)
- Property disambiguation: `element.$name` (property) vs `element.name` (child node)

## Evaluation Model
- Expressions are processed via queue.
- Dependent rules are enqueued when dependencies change.
- Queue ordering prevents stale dependency evaluation.
- Event dispatch and many rule side effects are asynchronous.
- `validate(...)` returns validation results synchronously for the current call.

## Validation Guard Pattern
- Prefer guarding network/event operations with validation return value:
  - `if(length(validate($form.login)) = 0, request(...), <show error>)`
- This avoids relying only on `$valid` in the same expression chain.

## Operators And Core Language
- JSON Formula extends JMESPath with additional operators and function set.
- Includes query, projections, slicing, filters, boolean/math/string operators.

## Common Mistakes
- Using child access when property access is needed (`x.y` vs `x.$y`).
- Assuming synchronous update visibility within same rule tick.
