# API Integration Patterns

## Discovering APIs

Use the `api-manager` CLI to find and understand available APIs:

```bash
# List all available APIs
python3 scripts/api_manager/cli.py list

# Search by keyword
python3 scripts/api_manager/cli.py list | grep -i otp
python3 scripts/api_manager/cli.py list | grep -i customer

# Get full API details (parameters, URL, method, request/response shape)
python3 scripts/api_manager/cli.py show customerIdentification --json
```

---

## Two Approaches: api-clients (Preferred) vs Direct Request

Both approaches return the same response format. Choose based on whether a typed client already exists.

### Response Format (Same for Both)

```javascript
{
    ok: true,           // boolean — true for 2xx status codes
    status: 200,        // number — HTTP status code
    body: { ... },      // object — parsed JSON response body
    headers: { ... }    // object — response headers
}
```

---

### Approach A: api-clients (Preferred)

Generated async functions with typed parameters. Import from `./api-clients` in `script-libs/`.

```javascript
import { customerIdentification } from './api-clients';

// api-clients are async — use inside async helper functions
async function fetchCustomerHelper(custId, globals) {
    const response = await customerIdentification({
        customerId: custId
    }, globals);

    if (response.ok && response.body?.status?.responseCode === '0') {
        return response.body;
    }
    throw new Error('API failed: ' + response.status);
}

// Exported function MUST be sync (async won't appear in rule editor)
/**
 * Fetches customer data using api-clients
 * @name fetchCustomer Fetch Customer
 * @param {string} custId - Customer ID
 * @param {scope} globals - Globals object
 */
function fetchCustomer(custId, globals) {
    fetchCustomerHelper(custId, globals)
        .then(function(data) {
            globals.functions.setProperty(globals.form.customerName, {
                value: data.customerName
            });
        })
        .catch(function(error) {
            console.error('API error:', error);
        });
}

export { fetchCustomer };
```

**Benefits:** Typed parameters, auto-validates required fields, auto-builds request body, IDE autocomplete.

---

### Approach B: globals.functions.request() (Direct)

Call any API endpoint directly when you need full control or the API isn't in api-clients yet.

```javascript
/**
 * Fetches customer data using direct request
 * @name fetchCustomerDirect Fetch Customer Direct
 * @param {string} custId - Customer ID
 * @param {scope} globals - Globals object
 */
function fetchCustomerDirect(custId, globals) {
    globals.functions.request({
        url: '/content/hdfc_hdb/api/customerIdentification.json',
        method: 'POST',
        body: { requestString: { customerId: custId } },
        headers: { 'Content-Type': 'application/json' }
    }).then(function(response) {
        if (response.ok) {
            var data = response.body;
            globals.functions.setProperty(globals.form.customerName, {
                value: data.customerName
            });
        } else {
            console.error('API error:', response.status, response.body);
        }
    });
}

export { fetchCustomerDirect };
```

**When to use direct:** API not in api-clients yet, need custom request building, quick testing/debugging.

---

## API Call Patterns

### Pattern A: Fire and Forget

Use when the function triggers an API call without needing to update the UI (analytics, logging, background sync).

```javascript
/**
 * Sends analytics event to server
 * @name sendAnalyticsEvent Send Analytics Event
 * @param {string} eventName - Event name
 * @param {string} eventData - Event payload as JSON string
 * @param {scope} globals - Globals object
 */
function sendAnalyticsEvent(eventName, eventData, globals) {
    globals.functions.request({
        url: '/api/analytics',
        method: 'POST',
        body: { event: eventName, data: eventData }
    }).then(function(response) {
        if (!response.ok) {
            console.error('Analytics failed:', response.status);
        }
    });
}

export { sendAnalyticsEvent };
```

### Pattern B: Handle with Scope (Most Common)

Use when you need to act on the API response — populate fields, show/hide panels, display messages.

```javascript
async function fetchAndPopulateHelper(custId, globals) {
    const response = await globals.functions.request({
        url: '/api/customers/' + custId,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        throw new Error('API error: ' + response.status);
    }
    return response.body;
}

/**
 * Fetches customer and populates form fields
 * @name fetchAndPopulateCustomer Fetch And Populate Customer
 * @param {string} custId - Customer ID
 * @param {scope} globals - Globals object
 */
function fetchAndPopulateCustomer(custId, globals) {
    fetchAndPopulateHelper(custId, globals)
        .then(function(customer) {
            globals.functions.setProperty(globals.form.firstName, {
                value: customer.firstName
            });
            globals.functions.setProperty(globals.form.lastName, {
                value: customer.lastName
            });
            globals.functions.setProperty(globals.form.addressPanel, {
                visible: true
            });
        })
        .catch(function(error) {
            console.error('Failed to fetch customer:', error);
        });
}

export { fetchAndPopulateCustomer };
```

| Pattern | Use When |
|---------|----------|
| **A: Fire and Forget** | Trigger API without UI updates (analytics, logging, background sync) |
| **B: Handle with Scope** | Need to act on API response (populate fields, show/hide, validate) |

---

## Chaining Multiple API Calls

Use an async helper to sequence dependent API calls:

```javascript
import { customerIdentification, generateOtp } from './api-clients';

async function loginFlowHelper(phone, dob, globals) {
    // Step 1: Identify customer
    const custResponse = await customerIdentification({
        mobileNumber: phone,
        dateOfBirth: dob
    }, globals);

    if (!custResponse.ok || custResponse.body?.status?.responseCode !== '0') {
        throw new Error('Customer identification failed');
    }

    // Step 2: Generate OTP using customer ID from step 1
    const otpResponse = await generateOtp({
        customerId: custResponse.body.customerId
    }, globals);

    if (!otpResponse.ok) {
        throw new Error('OTP generation failed');
    }

    return {
        customerId: custResponse.body.customerId,
        otpSent: true
    };
}

/**
 * Handles login flow — identifies customer then sends OTP
 * @name handleLogin Handle Login
 * @param {scope} globals - Globals object
 */
function handleLogin(globals) {
    loginFlowHelper(
        globals.form.phone.$value,
        globals.form.dob.$value,
        globals
    ).then(function(data) {
        globals.functions.setProperty(globals.form.customerId, {
            value: data.customerId
        });
        globals.functions.setProperty(globals.form.otpPanel, { visible: true });
    }).catch(function(error) {
        console.error('Login error:', error);
    });
}

export { handleLogin };
```

---

## When API is NOT in api-clients

### Option 1: Add the API (Recommended for Reusable APIs)

1. Create an OpenAPI YAML spec in `refs/apis/<api-name>.yaml` (use `refs/apis/_template.yaml` as a reference)
2. Run `python3 scripts/api_manager/cli.py build` to regenerate api-clients
3. Import and use:

```javascript
import { newApiName } from './api-clients';

async function helper(globals) {
    const response = await newApiName({ param1: 'value' }, globals);
    // ...
}
```

### Option 2: Call Directly (Quick Testing or One-Off Use)

```javascript
globals.functions.request({
    url: '/content/forms/api/endpoint.json',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { requestString: { param1: 'value' } }
}).then(function(response) {
    if (response.ok && response.body?.status?.responseCode === '0') {
        // handle success
    }
});
```

---

## Encryption (encrypt Extensibility Hook)

If the API requires encrypted payloads, `globals.functions.request()` automatically calls the `encrypt` hook before sending. By default it's a no-op pass-through.

Override `encrypt` as an exported function to add encryption:

```javascript
/**
 * Encrypts request payload with RSA
 * @param {object} payload - { body, headers, cryptoMetadata?, options? }
 * @returns {object} Encrypted payload with same structure
 */
function encrypt(payload) {
    const { body, headers, cryptoMetadata, options } = payload;

    // Generate symmetric key, encrypt body
    const symmetricKey = generateSymmetricKey();
    const encryptedBody = encryptWithSymmetricKey(JSON.stringify(body), symmetricKey);
    const encryptedSymKey = encryptWithPublicKey(symmetricKey, PUBLIC_KEY);

    return {
        body: encryptedBody,
        headers: { ...headers, 'X-Encrypted': 'true' },
        encryptedSymKey: encryptedSymKey,
        // cryptoMetadata passes through to decrypt hook for decryption
        cryptoMetadata: { ...cryptoMetadata, symmetricKey },
        // options pass through unchanged to the Fetch request
        options: options
    };
}

export { encrypt };
```

The full extensibility pipeline for `request()`:

| Hook | Default | Override To |
|------|---------|-------------|
| `encrypt(payload)` | Pass-through | Encrypt request body before sending |
| `decrypt(body, req)` | Pass-through | Decrypt response body (2xx only) |
| `retryHandler(requestFn)` | Execute once | Add retry logic (e.g., refresh token on 401) |
| `externalize(url)` | Pass-through | Add context path prefix to URLs |

See [scope-functions-reference.md](scope-functions-reference.md) for full `request()` API details.

---

## API Integration Checklist

| Step | Action |
|------|--------|
| 1 | **Search for APIs:** `python3 scripts/api_manager/cli.py list \| grep -i keyword` |
| 2 | **Get API details:** `python3 scripts/api_manager/cli.py show <apiName> --json` |
| 3 | **Import from api-clients:** `import { apiName } from './api-clients'` |
| 4 | **Write async helper** that calls the api-client (can use `async`/`await`) |
| 5 | **Write exported sync wrapper** with JSDoc `@name` for rule editor |
| 6 | **Handle success and error** — populate fields on success, log errors on failure |
| 7 | **Add re-export** if the function lives in a fragment script |

### Key Rules Summary

- **Exported functions** (with JSDoc `@name`) **MUST be sync** — `async` won't appear in rule editor
- **Helper functions** (internal, not exported) **CAN use async/await**
- **api-client functions are async** — always use them inside async helpers
- **NEVER use `fetch()` directly** — always use `globals.functions.request()` or api-clients