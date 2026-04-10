---
name: <pipeline-id>
description: >
  <One-line purpose of this pipeline>
type: pipeline
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Pipeline: <Pipeline Name>

> **Base pattern:** This template is a forms-specific specialization of the [Skill Router Template](../../../../../../../../../docs/skill-architecture/skill-router-template.md). See the [Skill Architecture Guide](../../../../../../../../../docs/skill-architecture/README.md) for the generalized patterns (directory structure, routing tables, guidelines).

**ID:** `<pipeline-id>`
**Version:** 0.1
**Description:** <One-line purpose of this pipeline>

---

## Pipeline Graph

Define the pipeline as a directed graph. Each node is a phase. Edges show data flow.

```
[Phase 0: <Name>]
       │
       │ <output artifact>
       ▼
[Phase 1: <Name>]
       │
       │ <output artifact>
       ▼
[Phase 2: <Name>]
       │
       │ <output artifact>
       ├────────────────────┐
       ▼                    ▼
[Phase 3: <Name>]    [Phase 4: <Name>]   ← parallel if independent
       │                    │
       │ <output>           │ <output>
       ▼                    │
[Phase 5: <Name>] ◄────────┘              ← joins parallel branches
       │
       │ <output artifact>
       ▼
[Phase 6: <Name>]
       │
       ▼
  ┌──────────────────┐
  │  ✅ Plan done     │──→ Post-plan checkpoint
  └────────┬─────────┘
           │
     more plans?
    ┌─yes──┘──no──┐
    │             │
    ▼             ▼
 next plan   Pipeline complete
             Archive → .agent/history.md
```

> **Graph rules:**
> - Nodes are phases: `[Phase N: Name]`
> - Edges are artifacts: the output of one phase is the input of the next
> - Parallel branches are allowed when phases have no data dependency
> - Joins merge parallel branches before a dependent phase
> - Terminal node should reflect the pipeline's completion pattern (plan loop + archive, single pass, etc.)
> - Not every plan exercises every phase — plans enter the graph at their starting phase and exit through the final phase

---

## Phase Definitions

Define each phase. One section per node in the graph.

### Phase 0: <Name>

| Property | Value |
|----------|-------|
| **Domain** | `<domain>` |
| **Skill** | `<skill-name>` |
| **Input** | <what this phase receives> |
| **Output** | <what this phase produces> |
| **Gate** | <precondition — what must be true before this phase runs> |

**Description:** <1-2 sentences on what this phase does>

---

### Phase N: <Name>

| Property | Value |
|----------|-------|
| **Domain** | `<domain>` |
| **Skill** | `<skill-name>` |
| **Input** | <what this phase receives> |
| **Output** | <what this phase produces> |
| **Gate** | <precondition> |

**Description:** <1-2 sentences>

---

> Copy the phase block above for each node in the graph.

---

## Checkpoints

Define what happens between phases or plans. Checkpoints are moments where the user can intervene.

### Post-Plan Checkpoint (default)

The **post-plan checkpoint** is the standard checkpoint level. It fires after all phases within a single plan have completed — the natural commit/deploy boundary.

> *"This plan is complete. How would you like to proceed?"*
>
> 1. **Deploy and update reports** — Push changes, then update `.agent/` reports.
> 2. **Update reports only** — Skip deployment, update `.agent/` reports.
> 3. **Update reports and proceed to next plan** — Skip deployment, update reports, continue.
> 4. **Proceed to next plan** — Skip both deployment and reports, continue immediately.

### Post-Phase Checkpoint (opt-in)

A finer-grained checkpoint that fires after **each individual phase** within a plan. **Not used by default** — the `build-journey` pipeline uses post-plan checkpoints only (see Rule 3: *"Post-plan checkpoint applies after each plan completes, not after each phase within a plan"*).

Enable post-phase checkpoints only when:
- A phase produces an independently deployable artifact that should be verified before continuing
- The pipeline is exploratory and the user needs to inspect intermediate outputs
- Phases are expensive and failure recovery requires rollback granularity

To enable, add `checkpoint: post-phase` to the relevant Phase Definition's property table.

### Override Rules

| Condition | Checkpoint Behavior |
|-----------|---------------------|
| Phase produces no deployable artifacts | Skip deployment options (offer only 2, 3, 4) |
| Phase is the last in the pipeline | Always offer deployment |
| Plan has remaining phases | Post-plan checkpoint deferred; post-phase only if opted in |
| Plan is complete | Post-plan checkpoint fires |

---

## Gates

Gates are preconditions that must be satisfied before a phase can execute. If a gate fails, the pipeline halts and reports the failure.

| Gate ID | Phase | Condition | On Failure |
|---------|-------|-----------|------------|
| `G0` | Phase 0 | <condition> | <what to do — halt, prompt user, skip> |
| `G1` | Phase 1 | <condition> | <action> |
| ... | ... | ... | ... |

---

## Plan Integration

How this pipeline integrates with plan-driven execution.

| Property | Value |
|----------|-------|
| **Plans generated by** | Phase <N> (`<skill-name>`) |
| **Plan location** | `plans/<journey>/NN-<title>.md` |
| **Max plans per journey** | 15 |
| **Plan execution order** | Sequential — each plan may trigger one or more phases |
| **Status tracking** | `.agent/handover.md` → Plan Execution Status dashboard |
| **Completion archival** | `.agent/history.md` via `manage-context` |

---

## Extending This Pipeline

To create a new pipeline from this template:

1. Copy this file to `references/pipelines/<pipeline-name>.md`
2. Update the YAML frontmatter with the new pipeline's name and description
3. Define the pipeline graph — add/remove/reorder phases as needed
4. Fill in each phase definition with the domain, skill, input/output, and gate
5. Customize checkpoints — post-plan is the default; opt in to post-phase only if needed
6. Define gates for any preconditions
7. Update `SKILL.md` (orchestrator) to register the new pipeline in the Pipeline Registry