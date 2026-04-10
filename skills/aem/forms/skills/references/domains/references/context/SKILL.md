---
name: context
description: Domain router for agent memory & session continuity skills
type: domain
triggers:
  - update reports
  - save progress
  - handover
  - session log
  - agent memory
  - save state
  - session summary
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Context — Domain Router

| | |
|---|---|
| **ID** | `context` |
| **Version** | 0.1 |
| **Description** | Routes agent memory & session continuity intents to the correct skill. |

## Routing Table

First match wins.

| Intent | Examples | Skill |
|--------|----------|-------|
| Update project reports, save progress, handover | "update reports", "save progress", "write handover" | `manage-context` |
| Session summary, recall past work | "what did we do", "session summary", "session log" | `manage-context` |

## Skills

| # | Skill | Purpose | Triggers |
|---|-------|---------|----------|
| 1 | `manage-context` | Update project reports, save progress, session log | update reports, save progress, handover, session log, agent memory, save state, session summary |

### Skill Locations

| Skill | Path |
|-------|------|
| `manage-context` | `skills/aem/forms/skills/references/domains/references/context/skills/manage-context/SKILL.md` |

## Guard Policies

> After each pipeline phase completes, the orchestrator prompts:
> **"Would you like me to update the project reports?"**
> If confirmed, routes here. Never update silently.

## File Locations

| Asset | Path |
|-------|------|
| Project state snapshot | `.agent/handover.md` |
| Archived handovers | `.agent/history.md` |
| Session log | `.agent/sessions.md` |

## Dependencies

All pipelines may invoke the context domain at checkpoints for report updates.

## Pipeline Integration

Used in all pipelines at post-plan checkpoints for report updates.

## Extending This Domain

1. Create a new skill directory under `skills/aem/forms/skills/references/domains/references/context/skills/<skill-name>/`.
2. Add a `SKILL.md` following the skill template structure.
3. Register the skill in the **Skills** table and **Skill Locations** sub-table above.
4. Add a routing entry in the **Routing Table** for the intents the new skill handles.
5. Update **triggers** in the YAML frontmatter if the new skill introduces new trigger phrases.