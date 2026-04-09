---
name: context
description: Domain router for agent memory & session continuity skills
triggers:
  - update reports
  - save progress
  - handover
  - session log
  - agent memory
  - save state
  - session summary
license: Apache-2.0
author: Adobe
version: "0.1"
---

# Context — Domain Router

Routes agent memory & session continuity intents to the correct skill.

## Routing Table

| Intent | Examples | Skill |
|--------|----------|-------|
| Update project reports, save progress, handover | "update reports", "save progress", "write handover" | `manage-context` |
| Session summary, recall past work | "what did we do", "session summary", "session log" | `manage-context` |

## Opt-in Policy

> After each pipeline phase completes, the orchestrator prompts:
> **"Would you like me to update the project reports?"**
> If confirmed, routes here. Never update silently.

## File Locations

| Asset | Path |
|-------|------|
| Project state snapshot | `.agent/handover.md` |
| Archived handovers | `.agent/history.md` |
| Session log | `.agent/sessions.md` |