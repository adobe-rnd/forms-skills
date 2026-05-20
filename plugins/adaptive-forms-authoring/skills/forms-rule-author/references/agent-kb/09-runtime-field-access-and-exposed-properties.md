# Runtime Field Access And Properties
Purpose: Explain runtime access syntax and exposed properties.
Use when: Asked how to reference fields/properties in rules.
Do not use when: Asked only for author-time JSON structure.
Input: Field path/type and target property.
Output: Correct runtime expression and access/mutability status.
Canonical source: `runtime-property-matrix.json`.
Related secondary: `06-rule-properties-by-field-type.md`.

## Runtime Access Pattern
- Element path access: `$form.<path>`
- Runtime property access: `<elementRef>.$<property>` — note the `$` prefix on the property name
- Example element access: `$form.accidentData.fullName.firstName`
- Example property reads:
  - `$form.accidentData.fullName.firstName.$value`
  - `$form.accidentData.fullName.firstName.$valid`
  - `$form.accidentData.fullName.firstName.$qualifiedName`
  - `$form.ageField.$minimum` — reads constraint from a number-input field

## $field Shorthand
`$field` is a shorthand that refers to the field the rule is authored on.
- `$field.$minimum` — reads the current field's minimum constraint
- `$field.$label` — reads the current field's label object
- `$field.$label.value` — reads the label text string
- Equivalent to `$form.<currentFieldPath>.$<property>`
- When `--field-id` is not provided to `validate-rule-v2`, `$field`-rooted refs are silently skipped (not validated).

## $parent Traversal
`$parent` strips the last path segment from the current field reference — it is a path traversal operator, not a property access.
- `$form.panel.field.$parent` → resolves to `$form.panel`
- `$form.panel.field.$parent.sibling` → resolves to `$form.panel.sibling`
- `$form.panel.field.$parent.$parent.sibling` → resolves to `$form.sibling`
- `$form.$parent` → **invalid** (above form root); emits `SEMANTIC_MEMBER_COMPONENT_UNKNOWN`
- `$field.$parent.sibling` — resolves via the current field's path

## Object-Typed Properties
Some properties (`label`, `properties`) are object-typed. Access their sub-fields with an additional dot segment:
- `$form.myField.$label.value` — label text string (readable)
- `$form.myField.$label.visible` — label visibility (readable)
- `$form.myField.$label.bogus` — emits `PROPERTY_PATH_INVALID` warning (unknown sub-property)

## Property Access Model
Use `runtime-property-matrix.json` as canonical source.
- All properties listed in the matrix are rule-accessible by definition.
- `readOnly=true`: readable but not writable by rules.
- `readOnly=false`: mutable by rules.
- V2 runtime extras not in the matrix: `index`, `parent`, `qualifiedName` (all types); `checked` (checkbox only).

## Validator Diagnostics
The `validate-rule-v2` CLI (`aemf-validate-rule-v2`) checks property access:
- `SEMANTIC_MEMBER_COMPONENT_UNKNOWN` — field path not in scope (includes `$parent` above root)
- `SEMANTIC_MEMBER_PROPERTY_UNKNOWN` — property not readable for the field's type (or globally)
- `PROPERTY_PATH_INVALID` (warning) — unknown sub-property of an object-typed property

Pass `--field-id <qualifiedId>` to enable validation of `$field`-rooted expressions.

## Important Policy
- `events` and `rules` are read-only and not rule-accessible.
