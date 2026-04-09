---
name: build
description: Domain router for form structure & component skills
triggers:
  - create form
  - add field
  - add panel
  - scaffold
  - fragment
  - layout
  - custom component
  - viewType
license: Apache-2.0
author: Adobe
version: "0.1"
---

# Build — Domain Router

Routes form-building intents to the correct skill.

## Routing Table

| Intent | Skill |
|---|---|
| Scaffold new empty form, bootstrap form template | `scaffold-form` |
| Create / modify form JSON, add field, add panel, add fragment, layout | `create-form` |
| Custom component, extend OOTB field type, custom viewType | `create-component` |

## Guard Policy

> Never hand-write `form.json` from scratch.
> Fields/panels → `create-form`. Empty forms → `scaffold-form`. Custom components → `create-component`.

## File Locations

| Asset | Path |
|---|---|
| Forms | `repo/content/forms/af/<team>/<path>/<name>.form.json` |
| Rule stores | `repo/content/forms/af/<team>/<path>/<name>.rule.json` |
| Custom components | `code/components/<view-type>/` |