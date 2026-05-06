# Scope Functions Reference

Custom functions access the `globals` object to interact with form components programmatically.

**Important:** The `globals` parameter must:
- Use type `{scope}` in JSDoc
- ALWAYS be the last argument in the function signature
- Is auto-injected by the runtime when called from a rule

---

## Globals Object Structure

```javascript
/**
 * @param {string} param1 - First parameter
 * @param {scope} globals - Globals object (auto-injected)
 */
function myFunction(param1, globals) {
    const currentField = globals.field;       // Field that triggered the rule
    const form = globals.form;                // Entire form model
    const fns = globals.functions;            // All scope functions below
}
```

---

## Reading Field Values

Access any field through `globals.form.<path>.$value`:

```javascript
const name = globals.form.personalInfo.firstName.$value;
const age  = globals.form.personalInfo.age.$value;
const sel  = globals.form.preferences.dropdown.$value;
```

---

## setProperty — Set Field Properties

```javascript
globals.functions.setProperty(field, properties)
```

| Property | Type | Description |
|----------|------|-------------|
| `value` | `any` | Set the field's value |
| `visible` | `boolean` | Show or hide the field |
| `enabled` | `boolean` | Enable or disable the field |
| `required` | `boolean` | Mark field as required |
| `placeholder` | `string` | Set placeholder text |
| `readOnly` | `boolean` | Make field read-only |
| `valid` | `boolean` | Mark field valid/invalid |
| `label.value` | `string` | Change field label |
| `enum` | `any[]` | Set dropdown option values |
| `enumNames` | `string[]` | Set dropdown option display names |

### Examples

```javascript
// Set a single property
globals.functions.setProperty(globals.form.name, { value: 'John' });

// Set multiple properties at once
globals.functions.setProperty(globals.form.email, {
    visible: true,
    required: true,
    enabled: true,
    placeholder: 'Enter your email'
});

// Hide a field
globals.functions.setProperty(globals.form.panel.secretField, { visible: false });

// Populate dropdown options
globals.functions.setProperty(globals.form.stateDropdown, {
    enum: ['CA', 'NY', 'TX'],
    enumNames: ['California', 'New York', 'Texas']
});

// Set field value to an array (repeatable panels)
globals.functions.setProperty(globals.form.addresses, {
    value: [
        { street: '123 Main St', city: 'Austin' },
        { street: '456 Oak Ave', city: 'Dallas' }
    ]
});
```

---

## dispatchEvent — Dispatch Custom Events

```javascript
globals.functions.dispatchEvent(target, eventName)
```

- `target` — form component to dispatch on (field, panel, or `globals.form`)
- `eventName` — string, typically prefixed with `custom:`

**Important:** `dispatchEvent` does NOT support a data payload. Use `setVariable` before dispatching to pass data.

### Example: Event with Data

```javascript
function fireEventWithData(targetField, eventName, data, globals) {
    // Store data first
    globals.functions.setVariable(eventName + '_data', data, globals.form);
    // Then dispatch
    globals.functions.dispatchEvent(targetField, eventName);
}

// Listener reads data via getVariable
function onMyEvent(globals) {
    var data = globals.functions.getVariable('custom:myEvent_data', globals.form);
    // ... use data
}
```

### Cross-Fragment Communication

Child fragments CANNOT reference parent fields via `$parent`. Use events instead:

```javascript
// In fragment function — dispatch event to form root
globals.functions.dispatchEvent(globals.form, 'custom:bankSelected');

// In form-level rule — listen for 'custom:bankSelected' and act on form fields
```

---

## setVariable / getVariable — Runtime Variables

### setVariable

```javascript
globals.functions.setVariable(name, value, target?)
```

- `name` — string key (stored as a **flat** key)
- `value` — any serializable value
- `target` — optional; defaults to `globals.form`

### getVariable

```javascript
globals.functions.getVariable(name, target?)
```

- `name` — string key; supports **dot notation** for nested reads
- Returns `undefined` if not found

### Critical Asymmetry

`setVariable` stores keys as flat strings. `getVariable` reads with dot notation into stored objects.

```javascript
// ❌ WON'T WORK — 'address.city' stored as flat key, getVariable looks for nested path
globals.functions.setVariable('address.city', 'NYC');
globals.functions.getVariable('address.city');   // undefined!

// ✅ WORKS — store an object, then read nested path
globals.functions.setVariable('address', { city: 'NYC', zip: '10001' });
globals.functions.getVariable('address.city');    // 'NYC'
globals.functions.getVariable('address.zip');     // '10001'

// ✅ Simple (non-nested) keys always work
globals.functions.setVariable('customerId', '12345');
globals.functions.getVariable('customerId');       // '12345'
```

### Chaining Async Rules

1. **Rule 1:** Store data with `setVariable()`, then `dispatchEvent(globals.form, "custom:step2")`
2. **Rule 2:** Trigger on `custom:step2`, read data with `getVariable()`

### Visual Rule Interoperability

| Direction | How |
|-----------|-----|
| Visual rule → Custom function | Variables set via `SET_VARIABLE` action readable with `getVariable()` |
| Custom function → Visual rule | Variables set via `setVariable()` readable with `GET_VARIABLE` expression |

---

## request — HTTP API Calls

```javascript
globals.functions.request(options)
```

**CRITICAL:** Always use `globals.functions.request()` for ALL API calls — NEVER use `fetch()` directly.

### Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `url` | `string` | Yes | — | API endpoint URL |
| `method` | `string` | No | `'GET'` | HTTP method |
| `body` | `object` | No | — | Request payload (POST/PUT/PATCH) |
| `headers` | `object` | No | `{ 'Content-Type': 'application/json' }` | Request headers |
| `options` | `object` | No | — | Fetch API options (see below) |

#### Fetch API Options (`options` sub-object)

| Option | Values |
|--------|--------|
| `credentials` | `'omit'` \| `'same-origin'` \| `'include'` |
| `mode` | `'cors'` \| `'no-cors'` \| `'same-origin'` |
| `cache` | `'default'` \| `'no-store'` \| `'reload'` \| `'no-cache'` \| `'force-cache'` |
| `redirect` | `'follow'` \| `'error'` \| `'manual'` |
| `referrerPolicy` | Standard referrer policy values |
| `keepalive` | `boolean` |

### Response Format

Returns `Promise<Response>`:

```javascript
{
    ok: true,           // boolean — true for 2xx status
    status: 200,        // number — HTTP status code
    body: { ... },      // object — parsed JSON response body
    headers: { ... }    // object — response headers
}
```

### Example

```javascript
globals.functions.request({
    url: '/api/customers/' + custId,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
}).then(function(response) {
    if (response.ok) {
        globals.functions.setProperty(globals.form.name, { value: response.body.name });
    } else {
        console.error('API error:', response.status, response.body);
    }
}).catch(function(error) {
    console.error('Request failed:', error);
});
```

---

## importData — Bulk Import Form Data

```javascript
globals.functions.importData(data)
```

Imports an object whose keys map to form field paths. Supports dot notation.

```javascript
globals.functions.importData({
    firstName: 'Jane',
    lastName: 'Doe',
    'address.street': '123 Main St',
    'address.city': 'Austin'
});
```

---

## Other Scope Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `validate` | `validate(field)` | Validate a field, panel, or form. Returns array of errors. |
| `reset` | `reset(field)` | Reset field/panel/form to initial state |
| `submitForm` | `submitForm(options?)` | Submit the form |
| `setFocus` | `setFocus(field, option)` | Focus a field. Option: `'nextItem'`, `'previousItem'` |
| `exportData` | `exportData()` | Export all form data as object |
| `markFieldAsInvalid` | `markFieldAsInvalid(name, opts)` | Mark a field invalid with message |

### markFieldAsInvalid Example

```javascript
globals.functions.markFieldAsInvalid('$form.email', {
    useId: true,
    message: 'Please enter a valid email address'
});
```

### validate + submitForm Example

```javascript
function validateAndSubmit(globals) {
    var errors = globals.functions.validate(globals.form);
    if (errors.length === 0) {
        globals.functions.submitForm();
    }
}
```

---

## Extensibility Hooks

The `globals.functions.request()` pipeline calls four hooks (all no-op by default):

| Hook | Signature | Called When | Purpose |
|------|-----------|------------|---------|
| `encrypt` | `encrypt(payload) → payload` | Before sending request | Encrypt request body |
| `decrypt` | `decrypt(body, originalReq) → body` | After 2xx response only | Decrypt response body |
| `retryHandler` | `retryHandler(requestFn) → Promise` | Wraps request execution | Retry logic (e.g., refresh token on 401) |
| `externalize` | `externalize(url) → url` | Before request | Add context path prefix to URLs |

### encrypt

Receives `{ body, headers, cryptoMetadata?, options? }`, returns same structure with encrypted body.

```javascript
function encrypt(payload) {
    var { body, headers, cryptoMetadata, options } = payload;
    var encryptedBody = performEncryption(body);
    return {
        body: encryptedBody,
        headers: { ...headers, 'X-Encrypted': 'true' },
        cryptoMetadata: cryptoMetadata,
        options: options   // MUST pass through unchanged
    };
}
```

### decrypt

Receives `(body, originalRequest)` where `originalRequest` contains `cryptoMetadata`.

```javascript
function decrypt(body, originalRequest) {
    var { cryptoMetadata } = originalRequest;
    return decryptWithKey(body, cryptoMetadata.symmetricKey);
}
```

### retryHandler

Receives `requestFn` — call it to execute the request. Call multiple times for retries. Pass optional `{ headers, body }` to **merge** into the original request.

```javascript
// Retry on 401 with refreshed token
function retryHandler(requestFn) {
    return requestFn().then(function(response) {
        if (response.status === 401) {
            return refreshAuthToken().then(function(newToken) {
                return requestFn({
                    headers: { 'Authorization': 'Bearer ' + newToken }
                });
            });
        }
        return response;
    });
}
```

**Merge behavior:** Retry `{ headers, body }` values are shallow-merged with original request. New keys are added; existing keys are overwritten.

### externalize

Receives a URL string, returns the modified URL.

```javascript
function externalize(url) {
    var contextPath = '/content/mysite';
    if (url.startsWith('/') && !url.startsWith(contextPath)) {
        return contextPath + url;
    }
    return url;
}
```

---

## Dynamic Variables (Utility Pattern)

For convenience, import helpers from `code/blocks/form/functions.js`:

```javascript
import { setProperty, getProperty, setFieldProperty, getFieldProperty } from '../functions.js';

// Form-level variable (stored in globals.form.$properties)
setProperty('myVar', { foo: 'bar' }, globals);
getProperty('myVar', globals);           // { foo: 'bar' }
getProperty('myVar.foo', globals);       // 'bar' (dot notation)

// Field-level variable
setFieldProperty(field, 'tempData', value, globals);
getFieldProperty(field, 'tempData', globals);
```
