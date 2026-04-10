# Implementation Patterns

Concrete code examples for common custom function scenarios.

---

## 1. Simple Calculation Function

```javascript
/**
 * Calculates the monthly payment for a loan
 * @name calculateMonthlyPayment Calculate Monthly Payment
 * @param {number} principal - Loan principal amount
 * @param {number} annualRate - Annual interest rate (as decimal, e.g., 0.05 for 5%)
 * @param {number} months - Number of months
 * @returns {number} Monthly payment amount
 */
function calculateMonthlyPayment(principal, annualRate, months) {
    if (months === 0) return 0;
    var monthlyRate = annualRate / 12;
    if (monthlyRate === 0) return principal / months;

    var payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months))
                  / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(payment * 100) / 100;
}

export { calculateMonthlyPayment };
```

**Key points:**
- Pure function — no `globals` needed when returning a value without side effects
- Guard against division by zero
- Round currency to 2 decimal places

---

## 2. Validation Function

```javascript
/**
 * Validates email format
 * @name validateEmail Validate Email Address
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
function validateEmail(email) {
    if (!email) return false;
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export { validateEmail };
```

**Key points:**
- Always check for null/undefined inputs first
- Return `boolean` for validation functions so they work with rule editor conditions

---

## 3. Data Transformation

```javascript
/**
 * Formats a date to MM/DD/YYYY format
 * @name formatDate Format Date
 * @param {date} inputDate - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(inputDate) {
    if (!inputDate) return '';
    var date = new Date(inputDate);
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    var year = date.getFullYear();
    return month + '/' + day + '/' + year;
}

export { formatDate };
```

---

## 4. Optional Parameters

```javascript
/**
 * Calculates discounted price
 * @name calculateDiscount Calculate Discounted Price
 * @param {number} originalPrice - Original price
 * @param {number} [discountPercent=10] - Discount percentage (defaults to 10%)
 * @returns {number} Discounted price
 */
function calculateDiscount(originalPrice, discountPercent) {
    var pct = (discountPercent !== undefined && discountPercent !== null) ? discountPercent : 10;
    var discount = originalPrice * (pct / 100);
    return Math.round((originalPrice - discount) * 100) / 100;
}

export { calculateDiscount };
```

**Key points:**
- Use manual default checks instead of ES6 default params for maximum parser compatibility
- Document defaults in JSDoc with `[param=default]` syntax

---

## 5. API Call Function with globals.functions.request

**IMPORTANT:** Always use `globals.functions.request()` — never `fetch()` directly.

```javascript
// Async helper — CAN use async/await (not exported)
async function fetchUserHelper(userId, globals) {
    var response = await globals.functions.request({
        url: '/api/users/' + userId,
        method: 'GET'
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user: ' + response.status);
    }
    return response.body;
}

// Exported function — MUST be sync for rule editor
/**
 * Fetches user data from API and populates form fields
 * @name fetchUserData Fetch User Data
 * @param {string} userId - User ID to fetch
 * @param {scope} globals - Globals object
 */
function fetchUserData(userId, globals) {
    fetchUserHelper(userId, globals)
        .then(function(user) {
            globals.functions.setVariable('userData', user, globals.form);
            globals.functions.setProperty(globals.form.userName, { value: user.name });
            globals.functions.setProperty(globals.form.userEmail, { value: user.email });
        })
        .catch(function(error) {
            console.error('Request failed:', error);
        });
}

export { fetchUserData };
```

### Chaining Sequential API Calls

```javascript
async function fetchCustomerWithOrdersHelper(customerId, globals) {
    // Step 1: Fetch customer
    var customerResponse = await globals.functions.request({
        url: '/api/customers/' + customerId,
        method: 'GET'
    });
    if (!customerResponse.ok) {
        throw new Error('Customer fetch failed');
    }

    // Step 2: Fetch orders using customer's order ID
    var ordersResponse = await globals.functions.request({
        url: '/api/orders/' + customerResponse.body.orderId,
        method: 'GET'
    });

    return {
        customer: customerResponse.body,
        orders: ordersResponse.body
    };
}

/**
 * Fetches customer with their orders
 * @name fetchCustomerWithOrders Fetch Customer With Orders
 * @param {string} customerId - Customer ID
 * @param {scope} globals - Globals object
 */
function fetchCustomerWithOrders(customerId, globals) {
    fetchCustomerWithOrdersHelper(customerId, globals)
        .then(function(data) {
            globals.functions.setProperty(globals.form.customerName, {
                value: data.customer.name
            });
            globals.functions.setProperty(globals.form.orderCount, {
                value: data.orders.length
            });
        })
        .catch(function(error) {
            console.error('Error:', error);
        });
}

export { fetchCustomerWithOrders };
```

---

## 6. Repeatable Panel Population

### Using setProperty with Array Value

Set a repeatable panel's value to an array of objects. Each object maps to one panel instance, with keys matching field names inside the panel.

```javascript
async function fetchAddressesHelper(custId, globals) {
    var response = await globals.functions.request({
        url: '/api/customers/' + custId + '/addresses',
        method: 'GET'
    });
    if (!response.ok) throw new Error('Failed to load addresses');
    return response.body.addresses;
}

/**
 * Populates the address repeatable panel with API data
 * @name loadAddresses Load Customer Addresses
 * @param {string} custId - Customer ID
 * @param {object} addressPanel - Repeatable address panel
 * @param {scope} globals - Globals object
 */
function loadAddresses(custId, addressPanel, globals) {
    fetchAddressesHelper(custId, globals)
        .then(function(addresses) {
            // Each array element creates one panel instance
            // Keys must match field names inside the repeatable panel
            var panelData = addresses.map(function(addr) {
                return {
                    street: addr.streetLine1,
                    city: addr.city,
                    state: addr.stateCode,
                    zip: addr.postalCode
                };
            });
            globals.functions.setProperty(addressPanel, { value: panelData });
        })
        .catch(function(error) {
            console.error('Failed to load addresses:', error);
        });
}

export { loadAddresses };
```

### Using importData for Bulk Population

`importData` sets values across the entire form using field paths as keys. Useful when populating many fields at once from a single API response.

```javascript
/**
 * Imports customer data into the form
 * @name importCustomerData Import Customer Data
 * @param {string} custId - Customer ID
 * @param {scope} globals - Globals object
 */
function importCustomerData(custId, globals) {
    globals.functions.request({
        url: '/api/customers/' + custId,
        method: 'GET'
    }).then(function(response) {
        if (response.ok) {
            var c = response.body;
            // Keys are dot-notation paths matching form field structure
            globals.functions.importData({
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                phone: c.phone,
                // Repeatable panel — provide an array
                addresses: c.addresses.map(function(a) {
                    return { street: a.street, city: a.city, zip: a.zip };
                })
            });
        }
    }).catch(function(error) {
        console.error('Import failed:', error);
    });
}

export { importCustomerData };
```

**Key differences:**

| Approach | When to Use |
|----------|-------------|
| `setProperty(panel, { value: [...] })` | Populate a single repeatable panel with array data |
| `importData({ ... })` | Bulk-set many fields across the form in one call |

---

## 7. Fragment Function — Pass Specific Fields

Pass individual fields as `{object}` parameters. Fragment/Form root nodes have type `FORM` which doesn't appear in the Form Object dropdown.

```javascript
// ❌ DOES NOT WORK — Fragment root doesn't appear in Form Object dropdown
function handleBankSelection(fragment, globals) { /* ... */ }

// ✅ WORKS — Pass specific fields
/**
 * Handles bank selection and enables continue button
 * @name handleBankSelection Handle Bank Selection
 * @param {object} bankDropdown - Bank selection dropdown field
 * @param {object} hiddenBankName - Hidden field for bank name
 * @param {object} continueButton - Continue button to enable/disable
 * @param {scope} globals - Globals object
 */
function handleBankSelection(bankDropdown, hiddenBankName, continueButton, globals) {
    globals.functions.setProperty(hiddenBankName, { value: bankDropdown.$value });
    globals.functions.setProperty(continueButton, { enabled: true });
    globals.functions.dispatchEvent(globals.form, 'custom:bankSelected');
}

export { handleBankSelection };
```

### Cross-Fragment Communication via Events

Child fragments CANNOT reference parent fields via `$parent` in rule parameters. Use custom events instead:

```javascript
// Fragment function — dispatches event to form root
/**
 * Handles radio selection in ETB account fragment
 * @name handleAccountRadio Handle Account Radio
 * @param {object} accountRadio - Radio button field
 * @param {scope} globals - Globals object
 */
function handleAccountRadio(accountRadio, globals) {
    if (accountRadio.$value) {
        globals.functions.setVariable('selectedAccount', accountRadio.$value, globals.form);
        globals.functions.dispatchEvent(globals.form, 'custom:accountSelected');
    }
}

export { handleAccountRadio };
```

The form-level script listens for `custom:accountSelected` and acts on its own fields.

---

## Parser Output Format

The custom function parser generates JSON used by the rule editor:

```json
{
    "id": "functionName",
    "displayName": "Display Name from @name",
    "args": [
        {
            "type": "STRING",
            "name": "paramName",
            "description": "Parameter description",
            "isMandatory": true
        }
    ],
    "type": "STRING",
    "description": "Function description from JSDoc",
    "impl": "$0($1)"
}
```

- `$0` = function name
- `$1`, `$2`, etc. = parameters in order
- Verify with: `node scripts/rule_coder/bridge/cli/parse-functions.js <path-to-js>`
