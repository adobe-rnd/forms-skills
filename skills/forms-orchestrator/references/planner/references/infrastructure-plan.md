---
name: infrastructure-plan
description: >
  Reference for the Infrastructure plan type. Covers cross-cutting concerns
  like error handling, session management, toast notifications, and data
  sanitization.
type: plan-type
---

# Infrastructure Plan

Cross-cutting concerns like error handling, session management, toast notifications, and data sanitization.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Primary skills** | `forms-rule-creator` |
| **Specification focus** | Error message catalogs, session management flows, utility function signatures, storage key inventories |
| **Typical steps** | Create utility functions (toast, error handler, sanitizers) → wire rules to fields → add UI elements (modal panels) → validate → push |
| **Example** | Plan 08: Error Handling & Session Management |

---

## Characteristics

- Provides shared infrastructure consumed by other plans
- Build order may differ from plan number (numbered last for logical grouping, but may execute earlier)
- Documents all error messages in a centralized catalog
- Manages storage keys (sessionStorage, localStorage) with clear ownership

---

## Specification Sections

An infrastructure plan's **Specification** section typically includes the following:

### Error Message Catalog

Centralized list of all error and success messages used across the form.

| Code | Type | Message | Display As |
|------|------|---------|------------|
| `ERR_TIMEOUT` | error | "Session expired. Please log in again." | Modal |
| `ERR_API_FAIL` | error | "Something went wrong. Please try again." | Toast |
| `SUC_SAVE` | success | "Your progress has been saved." | Toast |

### Session Management

Define how the form handles session lifecycle — timeout detection, re-authentication, and cleanup.

| Scenario | Detection | Action |
|----------|-----------|--------|
| Session timeout | API returns 401 / fault code 900901 | Show relogin modal, clear sensitive data |
| Tab close / navigate away | `beforeunload` event | Clear session storage |
| Successful completion | Form submitted successfully | Clear all storage keys |

### Storage Key Inventory

All sessionStorage and localStorage keys the form reads or writes, with ownership.

| Key | Storage | Read By | Written By | Purpose |
|-----|---------|---------|------------|---------|
| `session_id` | sessionStorage | Integration plans | Data loading plan | Active session identifier |
| `entry_source` | localStorage | Data loading plan | External | Entry point detection signal |

### Utility Functions

Shared functions consumed by multiple plans.

| Function Name | Purpose | Parameters | Returns |
|---------------|---------|------------|---------|
| `handleApiResponse` | Central error router | `response`, `globals` | void |
| `handleSessionTimeout` | Relogin flow | `globals` | void |
| `clearSessionData` | Storage cleanup | — | void |

### Data Sanitization Rules

Field-level transforms applied on input (e.g., uppercase, trim, format enforcement).

| Field(s) | Rule | Implementation |
|----------|------|----------------|
| `nameField1`, `nameField2` | Force uppercase | `toUpperCase` custom function on `fd:change` |
| `freeTextField` | Trim spaces, uppercase | `sanitizeText` custom function on `fd:change` |

---

## Typical Steps to Execute

1. **Create utility functions** using `forms-rule-creator`:
   - Central API response handler
   - Session timeout handler with relogin modal
   - Data sanitization functions (uppercase, trim)
   - Storage cleanup function

2. **Add UI elements** using `forms-content-author` (if needed):
   - Relogin modal panel with message and button
   - Any shared UI components for error display

3. **Wire rules to fields** using `forms-rule-creator`:
   - Sanitization rules on text input fields (`fd:change` triggers)
   - Relogin button click handler

4. **Validate:**
   ```
   node tools/eds-form-validator/validate.js <path-to-form.json>
   ```

5. **Push to AEM:**
   Use `forms-content-author` — content is written directly to AEM via `patch-aem-page-content`.

---

## Dependencies

Infrastructure plans have a unique dependency pattern:

- **Consumed BY other plans** — provides shared functions that integration and logic plans call
- **Depends ON structure plan** — needs the form skeleton to exist for wiring rules and adding UI elements
- **Numbering vs execution order** — often numbered last for logical grouping, but the dependency note should call out that it can (or should) be executed earlier if other plans depend on its outputs

> **Tip:** If multiple integration/logic plans depend on infrastructure functions (e.g., `handleApiResponse`), consider executing the infrastructure plan before those plans, regardless of its number.

---

## Acceptance Criteria Patterns

Infrastructure plans typically verify:

- [ ] Toast notifications display correctly for all error/success scenarios
- [ ] Session timeout is detected and relogin modal appears
- [ ] Storage keys are cleaned up on form completion
- [ ] Data sanitization rules fire on field input (uppercase, trim)
- [ ] No console errors from utility functions
- [ ] Form passes validation without errors
- [ ] Form renders on AEM without errors
