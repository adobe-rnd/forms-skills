---
name: forms-integration
description: >
  Use when managing API integrations for a form — adding API definitions, writing JS
  API clients, or wiring external data sources from a cURL command or OpenAPI spec.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.2"
  type: router
  triggers:
    - API
    - FDM
    - add API
    - OpenAPI
    - cURL
    - api client
    - api integration
---

# Integration — Domain Router

Routes API and data-integration intents to the appropriate skill. This router does not implement — it delegates.

**When invoked:** identify the user's intent using the Routing Table below, then read and follow the matched skill's SKILL.md exactly.

---

## Routing Table

First match wins.

| Intent | Skill |
|--------|-------|
| Add new API definition (from cURL or manually) | `manage-apis` |
| Write or update a JS API client file | `manage-apis` |
| List or inspect existing API specs | `manage-apis` |
| Troubleshoot an API integration in a form | `manage-apis` |

## Skills

All skills owned by this domain.

| # | Skill | Path | Purpose | Triggers |
|---|-------|------|---------|----------|
| 1 | `manage-apis` | [`references/manage-apis/SKILL.md`](references/manage-apis/SKILL.md) | Add API definitions, write JS API clients, wire external data sources | API, FDM, add API, OpenAPI, cURL, api client, api integration |

## Guard Policies

| Policy | Rule |
|--------|------|
| `no-guessing-endpoints` | Never guess API endpoints or service URLs. Mark any unknowns as `TBD` and ask the user for the correct value. |

## File Locations

| Asset | Path |
|-------|------|
| API clients | `blocks/form/api-clients/` (in `$FORMS_EDS_ROOT`) |
| API definitions | `$FORMS_WORKSPACE/refs/apis/` |

## Dependencies

| Dependency | Direction | Reason |
|------------|-----------|--------|
| `rule-author` | `rule-author` → This domain | Rule author domain may call `manage-apis` when creating custom functions that need API clients |

## Plan Integration

How this domain participates in plan-driven execution.

| Plan Type | Skill(s) Invoked | Role |
|-----------|-------------------|------|
| Integration plans | `manage-apis` | Adds API definitions, writes JS API clients, and wires up data integrations |

## Extending This Domain

### Adding a New Skill

- Create `references/integration/references/<skill-name>/SKILL.md` as the skill's entry point
- Add the skill to the **Routing Table** and merged **Skills** table above
- Register the skill in the domain registry (`skills/forms-orchestrator/references/domain-registry/SKILL.md`)
- If the skill manages new file types or needs guard policies, add rows to the relevant tables above
