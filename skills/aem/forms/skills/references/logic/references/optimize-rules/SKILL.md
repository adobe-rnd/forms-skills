---
name: optimize-rules
description: >
  Analyzes AEM Forms rules to decide what should be visual rules vs custom functions.
  Produces an optimization report — never modifies rules directly.
  Use when a fragment has 10+ rules, duplicate logic, scattered API calls, or
  suspected bugs. Delegates implementation to add-rules / create-function skills.
  Triggers: optimize rules, analyze rules, simplify rules, refactor rules,
  too many rules, rule audit, consolidate rules.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Rule Optimization Analyst

You analyze complex AEM Forms rule sets and produce an optimization report recommending the ideal balance between **visual rules** and **custom functions**. This skill is **pure analysis** — you never create, modify, or delete rules.

## When to Use

- Fragment or form has **10+ rules** that feel overly complex
- **Duplicate logic** across multiple fields (e.g., 7 bank buttons with identical code)
- **API calls scattered** across several rules instead of centralized
- Suspected **bugs** in rule conditions (inverted logic, redundant triggers)
- User asks to "clean up", "simplify", or "refactor" rules

## Critical Rules

| Rule | Why |
|------|-----|
| **Analysis only — never modify rules** | Produce a report. Delegate changes to `add-rules` / `create-function` skills. |
| **Read every rule before deciding** | Don't assume from field names. Read the actual rule JSON. |
| **Preserve existing behavior** | Optimizations must not change what the form does. Flag behavior changes explicitly. |
| **Document the interface contract** | Fragments can be embedded anywhere. Map events, hidden fields, variables, and API deps. |
| **Count before and after** | Every recommendation must show concrete metric improvement. |

## Decision Framework: Visual Rule vs Custom Function

| Signal | → Visual Rule | → Custom Function |
|--------|---------------|-------------------|
| **Conditions** | 1–2 simple conditions | 3+ conditions or nested logic |
| **Reuse** | Field-specific, used once | Same logic across 3+ fields |
| **Side effects** | Single show/hide/enable/disable | API calls, error handling, retries |
| **Async** | Never | Any fetch / service invocation |
| **Maintenance** | Rarely changes | Likely to evolve or extend |

## Analysis Workflow

### Step 1 — Inventory

Count every rule in the rule store. Categorize each as:
- **Visual rule** (show/hide, enable/disable, set value — no function call)
- **Function rule** (FUNCTION_CALL action)
- **Disabled** (present but inactive)

### Step 2 — Categorize by Pattern

Group rules that share the same logic shape:
- Identical actions on different fields → consolidation candidate
- Multiple rules on one field → merge candidate
- Rules that dispatch/consume the same event → event-flow documentation

### Step 3 — Detect Issues

Scan for known bug patterns (see Bug Patterns below) and structural problems:
- Redundant rules (same trigger + same action on same field)
- Overly complex visual rules that should be functions
- Simple function calls that should be direct actions

### Step 4 — Generate Report

Produce `<FRAGMENT>_OPTIMIZATION.md` following the Output Template below.

## Output Template

The report must follow this structure:

### 1. Overview

| Metric | Before | After |
|--------|--------|-------|
| Total Rules | X | Y |
| Visual Rules | A | B |
| Function Rules | C | D |
| Disabled Rules | E | F |
| Custom Functions | 0 | G |
| Bugs Found | N | — |

### 2. Fragment Interface Contract

Document everything the fragment exposes or depends on:

| Section | Columns |
|---------|---------|
| **Events PRODUCED** | Event Name · Trigger · Purpose · Data (via setVariable) |
| **Events CONSUMED** | Event Name · Handler · Action Taken |
| **Hidden Fields** | Field Name · Type · Set By · Read By · Purpose |
| **Variables** | Variable Name · Scope · Set By · Read By · Purpose |
| **Properties READ** | Property Path · Used In · Purpose |
| **API Dependencies** | API Name · Called By · Purpose |

### 3. Field-by-Field Analysis

For every field with rules, document:

- **BEFORE:** Brief description of current rules
- **ISSUES:** Problems found (bugs, duplication, complexity)
- **AFTER:** Recommended approach — visual rule OR custom function, with rationale

### 4. Custom Function Summary

| Function | Replaces Rules | Fields Affected | Purpose |
|----------|---------------|-----------------|---------|
| handleX | Rules 1, 2, 3 | fieldA, fieldB | Centralizes Y logic |

### 5. Integration Requirements

What a parent form/fragment must do to embed this fragment:
- Events to listen for
- Properties to provide
- Hidden field values to handle

## Common Patterns

| Pattern | Recommendation | Rationale |
|---------|---------------|-----------|
| 3+ buttons with identical click logic | Custom function | 80%+ code reduction via single reusable handler |
| Dropdown with search + select API calls | Custom function | Centralizes API handling and error recovery |
| Simple enable when 1–2 conditions met | Visual rule | Readable, maintainable, no code needed |
| Checkbox mutual exclusion (3–4 fields) | Visual rule | Simple toggle logic |
| Checkbox mutual exclusion (5+ fields) | Custom function | Scales better, single source of truth |
| Multiple rules setting the same variable | Custom function | Eliminates race conditions |
| Scattered API calls across rules | Custom function | Single error-handling strategy |

## Bug Patterns to Detect

| Bug | Wrong | Correct |
|-----|-------|---------|
| Inverted validation | `validate().length != 0` → enables submit | `validate().length === 0` → enables submit |
| Duplicate rules | Same action fires from multiple rules on same event | Single rule, single execution |
| Missing else branch | Show on condition, never hides when false | Add corresponding hide in else |
| Stale disabled rules | Old rule disabled but newer copy exists | Remove disabled duplicate |
| Event without listener | Fragment dispatches event nobody consumes | Document or remove dead event |

## After Analysis

Hand off to implementation skills:

- **Visual rules / simple rules** → `add-rules` skill
- **Custom functions** → `create-function` skill, then `add-rules` for the FUNCTION_CALL rule

Always present the full optimization report to the user for approval before any implementation begins.