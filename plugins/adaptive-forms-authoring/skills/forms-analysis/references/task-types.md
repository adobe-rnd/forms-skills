# Forms Analysis — Task Type Guide

Identify the change type first; apply the matching analysis questions and acceptance criteria format.

---

## Task Type Decision

| If the user says... | Task Type |
|---|---|
| "Build a form", "create a new form", "implement this journey" | **New Form** |
| "Add a field", "add a section", "add a step to the wizard" | **Add Fields** |
| "Change the rule", "when X happens Y should", "validation is wrong", "fix condition" | **Modify Rule** |
| "Custom component", "extend this field", "fd:viewType", "custom widget" | **Custom Component** |
| "Connect to API", "prefill from", "submit to endpoint", "FDM integration" | **API Integration** |
| "Fix", "broken", "not working", "regression", "bug" | **Bug Fix** |

---

## Type 1: New Form

### Analysis Questions
1. What is the form's purpose and primary user action?
2. How many screens/steps does the journey have?
3. Which fields are required vs optional?
4. Are there conditional sections (show/hide based on earlier answers)?
5. What APIs does the form load data from or submit to?
6. What are the validation rules per field?
7. What does success/failure look like to the user?

### What NOT to design here
- Exact fieldType mapping → `forms-content-modeler`
- Rule syntax → `forms-rule-author`
- API client code → `forms-integration`

### Acceptance Criteria Format
```
Functional:
- [ ] Form renders all N fields across M steps
- [ ] Submits to <endpoint> on confirmation
- [ ] Shows <success message> on completion

Conditional Logic:
- [ ] Field X visible only when Y = Z
- [ ] Step 3 skipped when condition C is true

Validation:
- [ ] Required fields prevent progression if empty
- [ ] <field> validates <rule> and shows "<error message>"

Author Experience:
- [ ] Form modifiable in Universal Editor without code changes
```

---

## Type 2: Add Fields

### Analysis Questions
1. Which panel/step do the new fields belong to?
2. What field types are needed?
3. Are there validation rules on the new fields?
4. Do existing rules need updating to reference the new fields?
5. Does adding these fields affect the form submit schema?

### Acceptance Criteria Format
```
Functional:
- [ ] Field <name> present in panel <panel>
- [ ] Field <name> validates <rule>

Regressions:
- [ ] Existing fields/rules unaffected
- [ ] Submit schema includes new field values
```

---

## Type 3: Modify Rule

### Analysis Questions
1. What is the current (incorrect) behavior?
2. What should the behavior be instead?
3. Which field(s) or event(s) trigger the rule?
4. Are there edge cases (empty value, null, multiple triggers)?
5. Does changing this rule affect other rules?

### Acceptance Criteria Format
```
Behavior:
- [ ] When <trigger>, <outcome> occurs
- [ ] When <edge case>, <fallback behavior> occurs

Regressions:
- [ ] Existing rules unaffected
- [ ] <related field> still behaves correctly
```

---

## Type 4: Custom Component

### Analysis Questions
1. Which OOTB base type is being extended?
2. What UI behavior does OOTB not provide?
3. What custom authoring properties does the component need?
4. Does the component react to model changes (value, visible, enabled)?
5. Does it contain child field models (panel-based) or enum options (radio/checkbox-based)?

### Acceptance Criteria Format
```
Component:
- [ ] Renders correctly when fd:viewType is set
- [ ] Extends <base_type> without breaking base behavior
- [ ] Custom property <prop> appears in authoring panel

Reactivity:
- [ ] DOM updates when model.<property> changes via subscribe
- [ ] Dispatches change event on underlying input when value changes programmatically
```

---

## Type 5: API Integration

### Analysis Questions
1. What API endpoint and method (GET/POST)?
2. When is the API called (on load, on field change, on submit)?
3. What form fields map to request parameters?
4. What response fields prefill form fields?
5. What happens on API error — silent fail, user message, block submission?

### Acceptance Criteria Format
```
Happy path:
- [ ] API called at <trigger>
- [ ] Response field <X> prefills form field <Y>
- [ ] Form submits payload matching API schema

Error handling:
- [ ] API error shows "<message>" to user
- [ ] Form does not submit while error persists
```

---

## Type 6: Bug Fix

### Analysis Questions
1. What is the exact observed behavior?
2. What is the expected behavior?
3. On which field(s), step(s), or condition(s) does the bug occur?
4. Is the root cause in a rule, field property, custom component, or API call?

### Acceptance Criteria Format
```
Fix:
- [ ] <observed behavior> no longer occurs
- [ ] <expected behavior> works correctly

Regressions:
- [ ] Related fields/rules unaffected
- [ ] Bug does not reappear under edge case <condition>
```
