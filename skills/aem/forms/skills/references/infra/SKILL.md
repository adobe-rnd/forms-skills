---
name: infra
description: >
  Domain router for infrastructure skills — workspace setup, form sync,
  EDS code sync, and sandboxed git operations.
  Triggers: setup, sync, pull, push, deploy, git, workspace, credentials.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Infra — Domain Router

Routes infrastructure intents to the correct skill. This router does not implement — it delegates.

---

## Routing Table

First match wins.

| Intent | Skill |
|--------|-------|
| Set up workspace, initialize project, configure credentials, system prereqs | `setup-workspace` |
| Pull / push / list / create forms on AEM, form sync | `sync-forms` |
| Pull / push EDS code, create branch, open PR on GitHub, code sync | `sync-eds-code` |
| Sandboxed git commit / push / reset, restricted git operations | `git-sandbox` |

---

## Config Files

| File | Managed By | Purpose |
|------|------------|---------|
| `metadata.json` | `sync-forms` | Tracks synced form/fragment paths (AEM ↔ local) |
| `sandbox.json` | `git-sandbox` | Restricts allowed commit paths and push branch names |

## File Locations

| What | Where |
|------|-------|
| Forms | `repo/content/forms/af/<team>/<path>/<name>.form.json` |
| Rule stores | `repo/content/forms/af/<team>/<path>/<name>.rule.json` |
| EDS code | `code/blocks/form/` |