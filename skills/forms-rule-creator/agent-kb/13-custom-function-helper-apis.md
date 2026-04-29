> Source: https://github.com/adobe-aem-forms/af2-docs/blob/gh-pages/spec/agent-kb/13-custom-function-helper-apis.md

# Custom Function Helper APIs
Purpose: Provide detailed helper API contracts available as `globals.functions.*` in custom functions.
Use when: Asked for parameter, return, side-effect, or deprecation details of helper APIs.
Do not use when: Asked how to register custom functions.
Input: Helper API name and intended operation.
Output: Signature, behavior, side effects, and usage notes.
Related primary: `12-custom-functions-authoring.md`.
Related secondary: `08-ootb-functions-reference.md`.

## Scope
- These APIs are available only inside registered custom function bodies through `globals.functions`.
- They are not called directly in rule expressions.

## API Contracts
### `setProperty(any target, any payload)`
- Behavior: Sets properties on target by dispatching `custom:setProperty`.
- Execution: Async/event-driven.
- Side effects: Triggers runtime update/event flow for affected properties.
- Returns: Dispatch result (runtime-dependent).

### `validate([any target])`
- Behavior: Validates target element when provided; otherwise validates form.
- Execution: Synchronous return.
- Side effects: Updates validity/error states and may emit validation events.
- Returns: `ValidationError[]` (empty array means valid; non-empty means invalid).

### `importData(any inputData [, string qualifiedName])`
- Behavior: Imports/replaces form data; optional `qualifiedName` scopes to container.
- Execution: Synchronous return.
- Side effects: Rebinds/syncs model data and triggers dependent updates.
- Returns: Runtime-dependent (typically no payload).

### `exportData()`
- Behavior: Exports current form data model.
- Execution: Synchronous return.
- Side effects: None (read).
- Returns: Form data object.

### `submitForm(any payload [, boolean validateForm = true, string submitAs = 'multipart/form-data'])`
- Behavior: Submits form using provided payload/config.
- Execution: Async/event-driven.
- Side effects: Submission flow/network call/event dispatch.
- Returns: Runtime-dependent submission result.

### `dispatchEvent(any target, string eventName [, any payload])`
- Behavior: Dispatches event on target (or form-level depending on target).
- Execution: Async/event-driven.
- Side effects: Event queue execution, rules/actions may run asynchronously.
- Returns: Dispatch result.

### `markFieldAsInvalid(string fieldIdentifier, string validationMessage [, any option = {useId: true}])`
- Behavior: Marks field invalid by identifier.
- Execution: Synchronous return.
- Identifier options:
  - `{useId: true}` (default)
  - `{useDataRef: true}`
  - `{useQualifiedName: true}`
- Side effects: Updates field validity/message state.
- Returns: `void`.

### `setFocus(any target [, FocusOption focusOption])`
- Behavior: Sets focus to target field/panel.
- Execution: Async/UI-driven.
- Side effects: UI focus/navigation changes.
- Returns: Runtime-dependent.

### `request(string uri, string httpVerb, object payload, string success, string failure)`
- Behavior: Makes request through runtime request pipeline.
- Execution: Async/event-driven.
- Side effects: Network IO and event-driven success/failure handling.
- Returns: Runtime-dependent response/promise behavior.

### `reset([any target])` (deprecated wrapper)
- Behavior: Dispatches reset behavior.
- Execution: Async/event-driven.
- Status: Deprecated; prefer `dispatchEvent(target, 'reset')`.
- Side effects: Resets target/form state.
- Returns: Dispatch result.

### `getFiles([string qualifiedName])`
- Behavior: Returns map of file input qualified names to serialized file promises.
- Execution: Synchronous map creation; async file serialization via promises.
- Side effects: None (read), aside from serialization processing.
- Returns: `{ [key: string]: Promise<FileObject[]> }`.

### `setVariable(string variableName, any variableValue [, any target])`
- Behavior: Sets variable on target or form default scope.
- Execution: Synchronous return.
- Side effects: Variable state mutation.
- Returns: Runtime-dependent.

### `getVariable(string variableName [, any target])`
- Behavior: Gets variable value from target or form default scope.
- Execution: Synchronous return.
- Side effects: None (read).
- Returns: Variable value.

## Common Mistakes
- Calling these helpers directly in JSON formula expressions (outside custom functions).
- Using deprecated `reset` instead of `dispatchEvent(..., 'reset')`.
- Assuming synchronous completion for event/request-driven helpers.
