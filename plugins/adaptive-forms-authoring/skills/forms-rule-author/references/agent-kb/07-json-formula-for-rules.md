# JSON Formula For Rules
Purpose: Define syntax/evaluation behavior used in rule expressions.
Use when: Asked how to write/parse rule expressions.
Do not use when: Asked for function catalog details (use OOTB file).
Input: Expression intent and referenced field/data paths.
Output: Valid JSON Formula expression pattern.
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

## Reference Scoping
Every rule has an owning field (the field the rule is attached to). Identifiers inside the rule resolve in this order:

1. Bare name → sibling of the owning field (same parent panel).
2. Bare name → descendant of the owning field (when it is a container).
3. Otherwise → unresolved; use an absolute path.
4. Absolute: `$form.<path>`, `$event.<path>`, `$browser.<path>`, `$queryParameters.<path>`, `$utmParameters.<path>`, or a declared variable name.

Sibling wins over descendant when both share a bare name. Use the full absolute path to disambiguate.

Inside a repeatable panel, rules cannot index into a specific row; the rule runs once per row and each evaluation uses relative refs against the current row. Row index is not available to the rule expression.

### Examples
Rule on `$form.products[*].totalPrice` (calc):
- `price * quantity` — siblings (correct, idiomatic).
- `$form.products[*].price * $form.products[*].quantity` — incorrect; loses row context.
- `products[*].price` — incorrect; bare name is not in local scope.

Rule on `$form.shippingAddress` (panel with children):
- `street`, `city`, `zip` — descendants of `shippingAddress`.

Ambiguity (sibling and same-named descendant both exist):
- `tax` — resolves to the sibling.
- `$form.products[*].totalPrice.tax` — absolute path reaches the descendant.

## Evaluation Model
- Expressions are processed via queue.
- Dependent rules are enqueued when dependencies change.
- Queue ordering prevents stale dependency evaluation.
- Event dispatch and many rule side effects are asynchronous.
- `validate(...)` returns validation results synchronously for the current call.

## Operators And Core Language
- JSON Formula extends JMESPath with additional operators and function set.
- Includes query, projections, slicing, filters, boolean/math/string operators.

## Common Mistakes
- Using child access when property access is needed (`x.y` vs `x.$y`).
- Assuming synchronous update visibility within same rule tick.
