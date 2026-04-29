# 01-happy-path-countdown — ❌ fail

## Validators
- ✅ file_exists(code/blocks/form/components/countdown-timer/countdown-timer.js) — exists: code/blocks/form/components/countdown-timer/countdown-timer.js
- ✅ file_exists(code/blocks/form/components/countdown-timer/countdown-timer.css) — exists: code/blocks/form/components/countdown-timer/countdown-timer.css
- ✅ file_exists(code/blocks/form/components/countdown-timer/_countdown-timer.json) — exists: code/blocks/form/components/countdown-timer/_countdown-timer.json
- ✅ file_contains(code/blocks/form/mappings.js) — matched /countdown-timer/ in code/blocks/form/mappings.js
- ❌ file_contains(code/blocks/form/components/countdown-timer/countdown-timer.js) — pattern /listenChanges\s*:\s*true/ not found in code/blocks/form/components/countdown-timer/countdown-timer.js
- ✅ json_path_equals(form.json) — property "fd:viewType" = "countdown-timer" in form.json

## Rubric
- ✅ uses-scaffold-command — The agent invoked 'npm run create:custom-component -- --name countdown-timer --base number-input' to scaffold the component rather than manually creating files.
- ✅ extends-not-replaces — The decorate() function extends the existing fieldDiv by querying for existing elements (input, label) and adding buttons to the structure, rather than replacing the entire DOM.
- ✅ adds-field-to-form-json — The agent added a field to form.json with both fieldType: 'number-input' (base type) and fd:viewType: 'countdown-timer' (custom type).
- ⚠️ reads-html-structure-ref — The agent did not read references/field-html-structure.md before writing the decorate() function. No Read tool call was made for that file.