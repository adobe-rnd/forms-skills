---
name: workflow-plan
description: >
  Workflow plan type reference. Defines the pattern for plans that build a specific
  user flow or conditional branch within the form.
type: plan-type
---

# Workflow Plan

Builds a specific user flow or branch within the form.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Primary skills** | `forms-content-author`, `forms-rule-creator` |
| **Specification focus** | Branching logic tables (trigger → condition → show/hide/set actions), enum mappings, conditional field requirements |
| **Typical steps** | Add fields to existing panels → implement visibility rules → implement value/property rules → validate → push |
| **Example** | Plan 02: Workflow Branch A, Plan 03: Workflow Branch B |

---

## Characteristics

- Depends on the structure plan (panel skeleton must exist)
- Heavy use of visibility rules and conditional required flags
- May introduce custom functions for dynamic behavior (e.g., switching validation patterns)
- One plan per major branch/flow — keeps scope manageable

---

## Specification Pattern

The specification section of a workflow plan should include:

### Branching Logic Tables

Show what triggers the branch, the conditions, and the resulting actions:

| Component | Trigger | Condition | Actions |
|-----------|---------|-----------|---------|
| `<field>` | is changed | value EQUALS `"<value>"` | Show `<panel>`, Hide `<panel>`, Set `<field>` required = true |
| `<field>` | is changed | value EQUALS `"<value>"` | Hide `<panel>`, Show `<panel>`, Clear `<field>` |

### New Fields (if adding fields to existing panels)

| Field | Panel | Type | Required | Visible | Notes |
|-------|-------|------|----------|---------|-------|
| `<fieldName>` | `<panelName>` | text-input | Yes | true | Added for this workflow |

### Enum Mappings (if applicable)

| Enum Value | Display Label | Triggers |
|------------|--------------|----------|
| `"optionA"` | Option A | Show `panelA` |
| `"optionB"` | Option B | Show `panelB` |

### Conditional Requirements

| Field | Required When | Not Required When |
|-------|--------------|-------------------|
| `<field>` | `<trigger>` equals `"<value>"` | All other cases |

---

## Typical Steps

1. **Add fields to existing panels** using `forms-content-author`:
   - Add workflow-specific fields to the panels created by the structure plan
   - Set initial visibility (`visible: false` for conditionally shown panels)

2. **Implement visibility rules** using `forms-rule-creator`:
   - Wire trigger fields to show/hide panels and fields based on user selection
   - Ensure mutually exclusive branches hide each other

3. **Implement value/property rules** using `forms-rule-creator`:
   - Set conditional required flags
   - Clear dependent fields when the branch changes
   - Reset state when the user switches between branches

4. **Create custom functions** (if needed) using `forms-rule-creator`:
   - Dynamic behavior like switching validation patterns
   - Complex branching logic that can't be expressed in simple rules

5. **Validate:**
   ```
   node tools/eds-form-validator/validate.js <path-to-form.json>
   ```

6. **Push to AEM:**
   Use `forms-content-author` — content is written directly to AEM via `patch-aem-page-content`.

---

## When to Use

- The form has **conditional sections** that appear/disappear based on user input
- A **dropdown, radio, or checkbox** drives which fields are visible
- Multiple **mutually exclusive paths** exist (e.g., account types, document types)
- A **sub-flow** within the form has its own set of fields and rules

---

## When NOT to Use

- The form has no conditional branching → use a **structure plan** instead
- You're adding cross-field validations without new UI → use a **logic plan** instead
- You're wiring APIs without new branching → use an **integration plan** instead