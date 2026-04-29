> Source: https://github.com/adobe-aem-forms/af2-docs/blob/gh-pages/spec/agent-kb/09-runtime-field-access-and-exposed-properties.md

# Runtime Field Access And Properties
Purpose: Explain runtime access syntax and exposed properties.
Use when: Asked how to reference fields/properties in rules.
Do not use when: Asked only for author-time JSON structure.
Input: Field path/type and target property.
Output: Correct runtime expression and access/mutability status.
Canonical source: `runtime-property-matrix.json`.
Related primary: `INDEX.md`.
Related secondary: `06-rule-properties-by-field-type.md`.

## Runtime Access Pattern
- Element path access: `$form.<path>`
- Runtime property access: `<elementRef>.$<property>`
- Example element access: `$form.accidentData.fullName.firstName`
- Example property reads:
  - `$form.accidentData.fullName.firstName.$value`
  - `$form.accidentData.fullName.firstName.$valid`
  - `$form.accidentData.fullName.firstName.$qualifiedName`

## Property Access Model
Use `runtime-property-matrix.json` as canonical source.
- All properties listed in the matrix are rule-accessible by definition.
- `readOnly=true`: readable but not writable by rules.
- `readOnly=false`: mutable by rules.

## Important Policy
- `events` and `rules` are read-only and not rule-accessible.
