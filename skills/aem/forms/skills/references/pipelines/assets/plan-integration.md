---
name: pipeline-plan-integration
description: >
  How pipelines relate to plans. Pipelines define HOW to build;
  plans define WHAT to build.
---

# Pipeline ↔ Plan Relationship

Pipelines define **HOW** to build (the phase graph). Plans define **WHAT** to build (the scope of each pass through the pipeline).

- A pipeline's intake phase (typically Phase 1) generates the plans
- Each plan declares which pipeline phase(s) it exercises
- Plans execute sequentially; each plan enters the pipeline at its starting phase
- Plan lifecycle, checkpoint behavior, and completion rules are owned by the pipeline file

---

## Plan Conventions

| Property | Convention |
|----------|-----------|
| **Path** | `plans/<journey>/NN-<short-title>.md` |
| **Numbering** | Zero-padded two digits: `01`, `02`, ..., `10`, `11` |
| **Max per journey** | 15 plans |
| **Template & decomposition** | See domain registry › `analysis` › `analyze-requirements` skill (§ Plan Generation) |

---

## Plan Status Tracking

Plan status is tracked in `.agent/handover.md` → Plan Execution Status dashboard (managed by domain registry › `context` › `manage-context`).

| Status | Meaning |
|--------|---------|
| 🔵 Active | Currently being executed |
| ✅ Done | Completed successfully |
| ⏸️ Paused | Paused by user at a checkpoint |
| ❌ Failed | Failed — requires intervention |