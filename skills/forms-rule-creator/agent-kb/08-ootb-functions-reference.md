> Source: https://github.com/adobe-aem-forms/af2-docs/blob/gh-pages/spec/agent-kb/08-ootb-functions-reference.md

# OOTB Functions Reference
Purpose: Provide built-in function names/signatures used in rules/events.
Use when: Asked which function to call and with what arguments.
Do not use when: Asked how to register/write custom functions.
Input: Desired operation (validate, submit, dispatch, data IO, focus, request).
Output: Canonical function call with signature and behavior summary.
Related primary: `INDEX.md`.
Related secondary: `12-custom-functions-authoring.md`.
Note: Includes deprecated functions where spec marks them deprecated.

## Form/Scope Modification Functions
### A) Expression-Exposed Runtime Functions (`defaultFunctions`)
- `validate([any $element])`
- `setFocus(any $element [, FocusOption $focusOption = undefined])`
- `getData()` (deprecated)
- `exportData()`
- `importData(any $payload [, string qualifiedName])`
- `submitForm(any $data [, boolean $validate_form = true, string $submit_as = 'multipart/form-data'])`
- `saveForm(string action [, any _, boolean validate_form=false])`
- `request(string $uri, string $httpVerb, payloadVariant, success, failure)`
- `requestWithRetry(...)`
- `retryHandler(...)`
- `dispatchEvent(any $element, string $eventName [, any $payload])`
- `setVariable(string name, any value [, any target])`
- `getVariable(string name [, any target])`
- `externalize(string url)`
- `awaitFn(promise, successEvent [, errorEvent])`
- `encrypt(payload [, publicKey])` (default idempotent behavior)
- `decrypt(encryptedData [, originalRequest])` (default idempotent behavior)
- `getQueryParameter(string param)`
- `getBrowserDetail(string param)`
- `getURLDetail(string param)`
- `getRelativeInstanceIndex(repeatableFieldSet)`
- `today()`
- `formatInput(input, format)`

## Validation Usage Patterns
- Field-level validation: `validate($form.login.mobileNumber)`
- Panel-level validation: `validate($form.login)` (recommended for grouped flows)
- `validate(...)` return semantics: empty array means valid; non-empty array means invalid.
- Guard API calls with validation result:
  - `if(length(validate($form.login)) = 0, request(...), <handle validation errors>)`

## OTP Flow Cookbook (Recommended)
1. Validate panel: `length(validate($form.login)) = 0`
2. Fetch OTP: `request('/fetchOtp', 'POST', {'mobileNumber': ...}, 'otpFetchSuccess', 'otpFetchFailure')`
3. Store transient request id via variable: `setVariable('requestId', $event.payload.id)`
4. Validate OTP with guarded call:
   - `request('/validateOtp', 'POST', {'otp': ..., 'mobileNumber': ..., 'id': getVariable('requestId')}, 'otpValidateSuccess', 'otpValidateFailure')`
5. Keep runtime-only flags in variables (`otpSent`, `otpValidated`) unless submission payload requires them.

## Deprecated APIs
- `getData()` -> use `exportData()`
- old `submitForm(success, failure, ...)` signature -> use new `submitForm(data, ...)`
- `reset([any $element])` deprecated in index context; use `dispatchEvent($element, 'reset')`

## JSON Formula Extension Functions (selected)
- Logical/condition: `and`, `or`, `not`, `if`, `true`, `false`
- Text: `lower`, `upper`, `trim`, `replace`, `substitute`, `left`, `right`, `mid`, `proper`, `rept`, `find`
- Numeric/date: `round`, `trunc`, `sqrt`, `power`, `exp`, `date`, `time`, `year`, `month`, `day`, `hour`, `minute`, `second`, `today`, `now`, `weekday`
- Mapping: `toMap`, `value`, `charCode`, `codePoint`

## Common Mistakes
- Assuming request only supports one legacy payload signature.
- Using deprecated submit/getData variants in new rules.
- Mixing rule-callable runtime functions with custom-function authoring concerns (see `12-custom-functions-authoring.md`).
