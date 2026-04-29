# 02-extend-checkbox-group — ✅ pass

## Validators
- ✅ file_exists(code/blocks/form/components/chip-selector/chip-selector.js) — exists: code/blocks/form/components/chip-selector/chip-selector.js
- ✅ file_contains(code/blocks/form/mappings.js) — matched /chip-selector/ in code/blocks/form/mappings.js
- ✅ file_contains(code/blocks/form/components/chip-selector/chip-selector.js) — matched /listenChanges\s*:\s*true/ in code/blocks/form/components/chip-selector/chip-selector.js

## Rubric
- ✅ extends-checkbox-group — The component was scaffolded with 'npm run create:custom-component -- --name chip-selector --base checkbox-group', confirmed in the transcript and _chip-selector.json shows '"base": "checkbox-group"'.
- ✅ transforms-option-ui — The transformCheckboxesToChips() function iterates through .checkbox-wrapper elements in the register callback, hides the original checkbox/label with .chip-input-hidden and .chip-label-hidden classes, and creates a new .chip-button div for each option with visual chip styling.
- ✅ reacts-to-group-value — The component handles 'change' events in the subscribe callback, checking for changes to 'value', 'enum', and 'enumNames' properties. The updateChipStates() function syncs chip visual states with the model's value array, and each checkbox's change event updates the chip-button's .chip-active class.
- ✅ uses-listen-changes — The subscribe call includes '{ listenChanges: true }' as the third argument: 'subscribe(fieldDiv, formId, (_fieldDiv, fieldModel, eventType, payload) => { ... }, { listenChanges: true });'.