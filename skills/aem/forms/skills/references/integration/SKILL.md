---
name: integration
description: Domain router for API & data-integration skills
triggers:
  - API
  - FDM
  - sync APIs
  - add API
  - build client
  - OpenAPI
  - cURL
license: Apache-2.0
author: Adobe
version: "0.1"
---

# Integration — domain router

Routes API and data-integration intents to the appropriate skill.

## Routing table

| Intent | Skill |
|---|---|
| Sync APIs from AEM FDM, discover APIs | `manage-apis` |
| Add new API definition, cURL → OpenAPI | `manage-apis` |
| Build / rebuild JS API clients | `manage-apis` |
| List / show API details | `manage-apis` |

## File locations

| What | Path |
|---|---|
| API clients (live) | `code/blocks/form/api-clients/` |
| API clients (staging) | `refs/apis/api-clients/` |
| API definitions | `refs/apis/` |