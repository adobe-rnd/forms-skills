---
name: integration-plan
description: >
  Reference for Integration plan type. Wires APIs and data flows — loading data
  into the form, submitting data out, or calling external services.
type: plan-type
---

# Integration Plan

Wires APIs and data flows — loading data into the form, submitting data out, or calling external services.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Primary skills** | `manage-apis`, `forms-rule-creator` |
| **Specification focus** | API endpoint definitions, request/response schemas, prefill mapping tables (API field → form field → transform), response handling matrices, state management |
| **Typical steps** | Register API definitions → create data-loading/submission functions → create prefill mapping functions → wire form triggers (load, button click) → validate → push |
| **Example** | Plan 06: API Integration — Data Loading, Plan 07: API Integration — Save & Submit |

---

## Characteristics

- Depends on structure + workflow plans (fields and panels must exist for prefill mapping)
- Documents every API field → form field mapping explicitly
- Handles multiple response scenarios (success, timeout, business exception)
- May manage session storage, global variables, and journey detection logic

---

## Specification Sections

An integration plan's **Specification** section typically includes the following:

### API Definition

One table per API endpoint consumed by the plan.

| Property | Value |
|----------|-------|
| Endpoint | `/api/path/to/endpoint` |
| Method | POST |
| Content-Type | application/json |
| Trigger | On form load / On button click |

### Request Body

Document the full request body structure, noting which form fields or variables supply each value.

```json
{
  "param": "<value source>"
}
```

For forms with multiple categories or conditional branches, provide one request body mapping table per branch — clearly label which condition applies.

### Response Handling

A matrix covering all expected response scenarios.

| Response | Status | Action |
|----------|--------|--------|
| Success | 200 | Extract data → prefill form |
| Timeout | 401 | Clear session → show relogin |
| Business exception | 400 | Show error toast with message from response |
| Network error | — | Retry once, then show generic error toast |

### Prefill Mapping

One row per field that receives data from the API response.

| API Field | Form Field | Transform |
|-----------|------------|-----------|
| `response.field_a` | fieldA | Direct |
| `response.date` | dateField | `convertDateApiToForm` |
| `response.category` | categoryField | Enum mapping (API value → form enum) |

### Custom Functions

| Function Name | Purpose | Parameters | Returns |
|---------------|---------|------------|---------|
| `loadFormData` | Entry point — orchestrates API calls and prefill | `globals` | void |
| `prefillFormFields` | Maps API response to form fields | `data`, `globals` | void |
| `assembleRequestBody` | Builds request payload from form fields | `globals` | object |

---

## Typical Steps

1. **Register API definitions** using `manage-apis`:
   - Create OpenAPI spec or cURL-based definition
   - Generate JS API client at `refs/apis/api-clients/`

2. **Create orchestrator function** using `forms-rule-creator`:
   - Entry point function (e.g., `loadFormData`, `submitPersonalDetails`)
   - Calls the API client, handles response routing

3. **Create mapping functions** using `forms-rule-creator`:
   - Prefill mapping (API response → form fields)
   - Request assembly (form fields → API request body)
   - Data transformations (date conversion, enum mapping, etc.)

4. **Wire form triggers** using `forms-rule-creator`:
   - `fd:init` → data loading function
   - Button `fd:click` → save/submit function
   - Custom events for async flows

5. **Validate:**
   ```
   node tools/eds-form-validator/validate.js <path-to-form.json>
   ```

6. **Push to AEM:**
   Use `forms-content-author` — content is written directly to AEM via `patch-aem-page-content`.

---

## Common Patterns

### Data Loading (Prefill)

- Triggered on form initialization (`fd:init` event)
- Reads identifiers from URL params, sessionStorage, or localStorage
- Calls one or more APIs to fetch existing data
- Maps response fields to form fields via a dedicated mapping function
- May set fields to read-only based on data source (e.g., pre-populated journeys)

### Save (Partial)

- Triggered by a "Save" button click
- Assembles request body from current form state (does not require all validations to pass)
- Calls save API — typically does not navigate away on success
- Shows success/error toast based on response

### Submit (Full)

- Triggered by a "Submit" / "Proceed" button click
- Runs full validation before assembling request body
- Enforces disclaimer checkboxes and mandatory fields
- Calls submit API — may trigger downstream flows (e.g., identity verification, next-step routing)
- Handles anti-forgery tokens (CSRF) if required

### CSRF / Anti-Forgery Token

- Read token from `globals.functions.getVariable('requestVerificationToken', globals.form)`
- Include in request headers as `RequestVerificationToken`
- May require a hidden form field to store the token

---

## Dependencies

Integration plans typically depend on:

| Dependency | What It Provides |
|------------|-----------------|
| Structure plan | Panel skeleton and fields that will be prefilled or read from |
| Workflow plans | Conditional branches that affect which fields are in the request body |
| Logic plans (optional) | Validation functions and date conversion utilities reused in mapping |