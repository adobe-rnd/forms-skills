---
name: analysis
description: >
  Domain router for analysis & documentation skills. Routes user intents
  to the correct analysis skill based on input source.
  Triggers: analyze, requirements, document, screen, review, migrate,
  v1 form, journey, screenshots.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Analysis — Domain Router

Routes to the correct analysis/documentation skill based on input source. Does not implement — delegates.

---

## Skills

| Skill | Purpose |
|-------|---------|
| `analyze-requirements` | Parse requirements docs / mockups into structured form specification |
| `analyze-v1-form` | Read legacy v1 AEM form JSON and produce Screen.md docs for migration |
| `create-screen-doc` | Create standardized Screen.md per form screen (11-section format) |
| `review-screen-doc` | Validate Screen.md against actual form JSON — quality gate |

## Input-Source Routing

The input source determines which skill runs. First match wins.

```
                         ┌─ requirements doc ──→ analyze-requirements ─┐
                         ├─ journey.md ────────→ analyze-requirements ─┤
  Input Source ──────────┤                                             ├──→ Screen.md
                         ├─ screenshots/figma ─→ create-screen-doc ───┤
                         └─ v1 adaptive form ──→ analyze-v1-form ─────┘
                                                        │
                                              review-screen-doc (quality gate)
```

All paths produce Screen.md. All Screen.md files pass through `review-screen-doc` before leaving this domain.

## Intake

Before routing, ask the user to place input files in the workspace:

| Source | Place In | Convention |
|--------|----------|------------|
| Screen.md | `journeys/<journey>/screens/<screen>/` | `Screen.md` |
| Journey.md | `journeys/` | `<journey-name>.md` |
| Screenshots | `journeys/<journey>/screens/<screen>/` | `*.png`, `*.jpg`, `*.pdf` |
| V1 Form JSON | `refs/` | `<form-name>.v1.json` |

> **Gate:** Do NOT proceed until files are confirmed on disk.

## Output

Validated Screen.md per screen at `journeys/<journey>/screens/<screen>/Screen.md`.