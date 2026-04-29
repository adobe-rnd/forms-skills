# 03-ambiguous-base-requests-clarification — ✅ pass

## Validators
- ✅ file_not_contains(code/blocks/form/mappings.js) — pattern /date-picker|custom-date/ absent in code/blocks/form/mappings.js

## Rubric
- ✅ asks-before-guessing — The agent explicitly asks 'Which OOTB field type should this extend?' and provides multiple options (date-input, text-input, Other?) for the user to choose from before proceeding.
- ✅ does-not-scaffold — The agent does not invoke 'npm run create:custom-component' in this interaction. It only mentions that it *can* do so 'Once you provide these details', making it clear the scaffolding will happen after user confirmation.
- ✅ does-not-edit-mappings — The agent does not edit mappings.js in this scenario. It only mentions registering the component in mappings.js as a future step after the user provides the required details.