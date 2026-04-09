---
name: logic
description: Domain router for business-rules & custom-function skills
triggers:
  - add rule
  - show hide
  - validate
  - navigate
  - event
  - business logic
  - custom function
  - calculation
  - optimize rules
license: Apache-2.0
author: Adobe
version: "0.1"
---

# Logic — domain router

Routes business-logic intents to the correct skill.

## Routing table

| Intent | Examples | Skill |
|--------|----------|-------|
| Add rule | show/hide, enable/disable, set value, validate, navigate, dispatch event, business logic | `add-rules` |
| Create custom JS function | calculation, API call function, data transformation | `create-function` |
| Optimize / refactor rules | visual vs function split, rule audit | `optimize-rules` |

## Guard policies

> **no-direct-rule-edits:** Never edit `.rule.json` / `fd:events` directly. Never invoke `rule-validate`, `rule-save`, `rule-transform` outside `add-rules`. All business logic → `add-rules`.

> **no-direct-function-writes:** Never write custom-function JS without `create-function`. It ensures JSDoc, exports, and parser compatibility.

## File locations

| Asset | Path |
|-------|------|
| Rule stores | `repo/content/forms/af/<team>/<path>/<name>.rule.json` |
| Fragment scripts | `code/blocks/form/scripts/fragment/<fragment>.js` |
| Form-level scripts | `code/blocks/form/scripts/form/<form>.js` |
| Shared libraries | `code/blocks/form/scripts/script-libs/libs.js` |