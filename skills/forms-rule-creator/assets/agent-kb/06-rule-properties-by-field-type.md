> Source: https://github.com/adobe-aem-forms/af2-docs/blob/gh-pages/spec/agent-kb/06-rule-properties-by-field-type.md

# Rule Properties By Field Type
Purpose: Identify rule-available properties and mutability by field type.
Use when: Asked what a rule may access or mutate on a field/panel.
Do not use when: Asked for formula syntax or function signatures.
Input: Target field type and intended read/write behavior.
Output: Deterministic property list with `readOnly`.
Canonical source: `runtime-property-matrix.json`.
Related primary: `INDEX.md`.
Related secondary: `09-runtime-field-access-and-exposed-properties.md`.

## Minimal Answer Template
- Field type: `<fieldType>`
- Rule-available properties: `<property names from computed field-type set>`
- Read-only properties: `<subset where readOnly=true>`
- Mutable properties: `<subset where readOnly=false>`

## Lookup Procedure
1. Read `runtime-property-matrix.json`.
2. Read `fieldTypeProperties.<fieldType>.includes` as group names to include (for example `fieldCommon`, `fieldConstraints`, `fieldRuntime`).
3. Resolve each included group under `properties.*`; special token `fieldTypeAdditional` means `properties.fieldTypeAdditional.<fieldType>`.
4. Apply `fieldTypeProperties.<fieldType>.excludes` to remove non-applicable properties by name.
5. Resolve each property definition from included groups; if duplicated, later groups in `includes` override earlier groups.
6. The matrix is rule-only; property presence means rule-available.
7. For form-level questions, use `properties.form`.
8. Mutability always comes from `readOnly` in the resolved property entry.

## Policy Notes
- This matrix only contains rule-available properties.
- `readOnly` is the only access flag required in this file.
- Example: `text-input.includes=[fieldCommon, fieldConstraints, fieldRuntime]`; `checkbox.checked` comes from `fieldTypeAdditional` when `fieldTypeAdditional` is present in `checkbox.includes`.
