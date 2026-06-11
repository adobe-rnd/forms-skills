---
name: skill-architecture
description: >
  Architectural patterns and templates for building multi-skill systems.
  Extends the agentskills.io specification with patterns for skill routers,
  routing tables, guidelines, plan-driven workflows, and directory conventions.
metadata:
  type: guidelines
---

# Skill Architecture Guide

This guide defines **architectural patterns** for organizing complex multi-skill systems. It extends the [agentskills.io specification](https://agentskills.io) — which defines the per-skill format (`SKILL.md`, `scripts/`, `references/`, `assets/`) — with patterns for composing skills into larger systems.

The **`adaptive-forms-authoring`** plugin (`plugins/adaptive-forms-authoring/skills/`) is the reference implementation of these patterns. Every example below points at real files in that tree.

> **When do you need this?** If your skill tree has 5+ skills and any form of routing, orchestration, or phased execution, these patterns will help you keep it consistent, lean, and maintainable.

---

## Skill Types

Every SKILL.md declares a `type` under its `metadata:` block. The type is the single most important field — it tells contributors and agents what role this file plays without reading the body.

### SKILL.md Types

Two types are used across the tree:

| Type | Role | Routes? | Implements? | Template |
|------|------|---------|-------------|----------|
| `router` | Dispatches to sub-skills, registries, or other routers. Used by the orchestrator, the domain registry, and domain entry routers (e.g. `forms-analysis`, `forms-integration`) | Yes | No | [skill-router-template.md](skill-router-template.md) |
| `skill` | Leaf node that does the actual work. Also the type of the **planner** (a `skill` that generates plan files) | No | Yes | *(none — leaf skills are freeform per agentskills.io)* |

**Key rules:**
- Every SKILL.md **must** declare exactly one `type` under `metadata:`.
- `type: router` files never implement — they dispatch only and stay under ~100 lines.
- Only `type: skill` files do real work (create files, run scripts, modify code).

```yaml
metadata:
  author: Adobe
  version: "1.0"
  type: router        # or: skill
  triggers: [ ... ]
```

> **There is no `type: domain`.** A *domain* is a logical grouping catalogued by the domain registry, not a frontmatter value. A domain's entry point may be a `type: router` (e.g. `forms-analysis`), a `type: skill` acting as its own router (e.g. `forms-rule-author`), or **no single entry point at all** — `content-author` and `style` have no router; the registry routes intents straight to their leaf skills.

> **Planner pattern:** the planner is a `type: skill` that generates plan files from a journey spec. It's a specialization of `skill`, not a separate type. See [Plan-Driven Workflows](#plan-driven-workflows).

### Asset & Reference Files

Supporting files under `assets/` and `references/` are loaded on demand and are **generally untyped markdown**. Conventions in the reference implementation:

| File | Role | Lives In |
|------|------|----------|
| `ROUTES.md` | Routing algorithm offloaded from a router SKILL.md | `forms-orchestrator/assets/ROUTES.md` |
| `GUARDRAILS.md` | Cross-cutting constraints & conventions | `forms-orchestrator/assets/GUARDRAILS.md`, `…/planner/assets/GUARDRAILS.md` |
| `SETUP.md` | Inline workspace bootstrap run by the router | `forms-orchestrator/assets/SETUP.md` |
| `TEMPLATE.md` (`type: template`) | Plan-file schema/template emitted by the planner | `…/planner/assets/TEMPLATE.md` |
| `TEMPLATE.md` | Domain SKILL.md template (produces `type: router`) | `…/domain-registry/assets/TEMPLATE.md` |
| `task-types.md`, `field-types.md`, grammar docs, etc. | Reference knowledge for a leaf skill | `<skill>/references/` |

> Heavy content is offloaded out of router SKILL.md files into these assets so the router stays lean. Asset files don't consume tokens until explicitly referenced.

---

## Architectural Layers

The system stacks types in layers, from entry point down to leaf skills:

```
┌─────────────────────────────────────────────┐
│  forms-orchestrator        type: router       │  ← entry point, pure dispatcher
│  assets/ROUTES.md, GUARDRAILS.md, SETUP.md    │
└───────────────┬───────────────────────────────┘
                │
       ┌────────┴────────────┐
       ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│ planner       │    │ domain-registry  │
│ type: skill   │    │ type: router     │  ← catalog: intent / plan-step → skill
│ spec → plans  │    │ (flat catalog)   │
└──────┬───────┘    └────────┬─────────┘
       │                     │  resolves to sibling skills under skills/
       ▼                     ▼
  plan files          ┌──────────────────────────────────────────┐
  $FORMS_WORKSPACE/   │ Domains (logical groupings):              │
  journeys/<j>/plans/ │  analysis        → forms-analysis (router)│
                      │  content-author  → forms-author, …  (no   │
                      │                    router; direct)        │
                      │  rule-creator    → forms-rule-author      │
                      │  integration     → forms-integration(rtr) │
                      │  style           → forms-style-screen     │
                      │  context-mgmt    → forms-context-management│
                      └───────────────────┬──────────────────────┘
                                           ▼
                                  ┌──────────────────┐
                                  │ leaf skills       │  ← type: skill — do the work
                                  └──────────────────┘
```

> **Skills are siblings, not nested.** Every domain skill lives at `skills/forms-<name>/`. The domain registry is a **flat catalog** that resolves an intent or plan step to a sibling skill's `SKILL.md` path — it does not contain the domain skills as children.

Not every skill tree needs all layers. Use what fits:

| Complexity | Recommended Types |
|------------|-------------------|
| 1–4 skills | `skill` only — flat, no routing needed |
| 5–10 skills | One `router` at the top + `skill` leaves |
| 10–20 skills | `router` (orchestrator) + `router` (registry) cataloging sibling `skill` leaves |
| 20+ skills or phased workflows | `router` (orchestrator) + `skill` (planner) + `router` (registry) → sibling domain routers/leaves |

---

## Templates

| Template | Produces | Purpose |
|----------|----------|---------|
| [**Skill Router Template**](skill-router-template.md) | `type: router` | SKILL.md for any dispatcher (orchestrator, registry, domain router) |
| [**Routing Table Template**](routing-table-template.md) | routing asset (e.g. `ROUTES.md`) | Routing algorithm offloaded from a router |
| [**Guidelines Template**](guidelines-template.md) | guidelines asset (e.g. `GUARDRAILS.md`) | Cross-cutting constraints |
| [**Directory Structure**](directory-structure.md) | *(layout guide)* | Standard directory layout for all types |

Reference-implementation specializations:

| Specialization | Location |
|---------------|----------|
| Domain SKILL.md template (produces `type: router`) | `forms-orchestrator/references/domain-registry/assets/TEMPLATE.md` |
| Planner | `forms-orchestrator/references/planner/SKILL.md` |
| Plan template (`type: template`) | `forms-orchestrator/references/planner/assets/TEMPLATE.md` |
| Planner guardrails | `forms-orchestrator/references/planner/assets/GUARDRAILS.md` |

> **Leaf skills** (`type: skill`) need no template — they follow the freeform [agentskills.io](https://agentskills.io) format. Keep them under 500 lines / 5,000 tokens.

---

## Key Principles

### 1. Routers are lean

Router SKILL.md files (`type: router`) stay **under ~100 lines**. They contain:
- YAML frontmatter (with `metadata.type`)
- A routing diagram or table (the core dispatch logic)
- Links to `assets/` for everything else

Heavy content goes into asset files:
- Routing algorithm → `assets/ROUTES.md`
- Constraints & conventions → `assets/GUARDRAILS.md`
- Inline setup steps → `assets/SETUP.md`
- Templates → `assets/TEMPLATE.md`

### 2. Progressive disclosure

Following the agentskills.io principle, skills load in layers:

| Layer | Loaded | Token budget |
|-------|--------|-------------|
| `name` + `description` + `metadata.type` (frontmatter) | At startup, for all skills | ~100 tokens |
| SKILL.md body (instructions) | When skill is activated | < 5,000 tokens |
| `references/`, `assets/`, `scripts/` | On demand during execution | As needed |

This is why routers stay lean — they're loaded on every routing decision. Asset files are loaded only when referenced.

### 3. Consistent directory conventions

| Directory | Purpose | Contains |
|-----------|---------|----------|
| `references/` | Sub-skills (folders with `SKILL.md`) or reference docs | `router`, `skill`, `.md` references |
| `assets/` | Static resources offloaded from SKILL.md | `ROUTES.md`, `GUARDRAILS.md`, `SETUP.md`, `TEMPLATE.md` |
| `scripts/` | Executable code (bash, python, JS) | scripts |

### 4. Naming

- Directory name = `name` field in frontmatter (per agentskills.io spec).
- Lowercase, hyphens only: `analyze-requirements`, `forms-content-modeler`.
- Router SKILL.md headings include their role: `# <Name> — Domain Router`, `# <Name> — Skill Gateway`, `# Domain Registry`.

---

## Type Relationships

How the types interact in a running system:

```
User Intent
     │
     ▼
forms-orchestrator [router]  ←── reads assets/ROUTES.md to decide
     │
     ├── no workspace?        → run assets/SETUP.md inline (hard block)
     │
     ├── spec but no plans?   → planner [skill] generates plan files
     │                              │
     │                         $FORMS_WORKSPACE/journeys/<j>/plans/NN-*.md
     │                              │
     ├── plans exist?  ────────────┴→ read next plan step
     │                                    │
     │                                    ▼  resolve domain+skill
     └──────────────────────→ domain-registry [router]
                                          │
                                          ▼
                                   leaf skill [skill]  ←── reads GUARDRAILS for constraints
                                          │
                                          ▼
                                    does the actual work
```

| From | To | Relationship |
|------|----|-------------|
| `router` (orchestrator) | `router` (registry) | Dispatches plan-step / intent resolution to the registry |
| `router` (orchestrator) | `skill` (planner) | Routes to planner when a spec exists but no plans |
| `skill` (planner) | plan files | Generates ordered plan files from the journey spec |
| `router` (orchestrator) | plan files | Reads and executes plan steps sequentially |
| plan step | `skill` | Each step declares a `domain: X, skill: Y`; registry resolves the path |
| `router` (registry) | `skill` / `router` | Resolves a domain's entry skill (sibling under `skills/`) |
| `router` | `ROUTES.md` / `GUARDRAILS.md` | Reads routing logic / constraints (assets, loaded on demand) |

---

## Plan-Driven Workflows

The orchestrator does not hard-code a phase graph. Instead, two stages turn raw inputs into executable plans at runtime:

1. **Analysis** (`forms-analysis`) transforms inputs — requirements docs, screenshots, Figma, or v1 AEM form JSON — into a **journey spec**.
2. **Planner** decomposes that spec into an ordered set of plans, each a feature slice executable via the domain registry.

### Pipeline

```
Inputs (requirements doc, screenshots, Figma, v1 JSON)
     │
     ▼
┌────────────────────────────────────────────┐
│  forms-analysis [router]                    │
│  INTAKE → EXTRACTING (APIs) → GENERATING    │
│  sub-skills: analyze-requirements /          │
│  visual-analysis / analyze-v1-form          │
└─────────────────────┬───────────────────────┘
                      ▼
        $FORMS_WORKSPACE/journeys/<journey>/spec.md
                      │
                      ▼
┌────────────────────────────────────────────┐
│  planner [skill]                            │
│  reads spec.md + refs/apis/                 │
│  selects plan types, orders by dependency   │
└─────────────────────┬───────────────────────┘
                      ▼
        $FORMS_WORKSPACE/journeys/<journey>/plans/
        ├── 01-<screen>.md
        ├── 02-interaction-flow.md
        ├── 03-integration.md
        └── NN-qa.md
                      │
                      ▼
┌────────────────────────────────────────────┐
│  forms-orchestrator executes plans          │
│  sequentially, resolving each step via the  │
│  domain registry                            │
└────────────────────────────────────────────┘
```

> **Plans and specs live in the runtime workspace** (`$FORMS_WORKSPACE`), **not** in the repo skill tree. The skill tree ships the generators (analysis + planner); the workspace holds the generated artifacts per journey.

### Characteristics

| Aspect | Description |
|--------|-------------|
| Workflow definition | Dynamic — generated from the journey spec at runtime |
| Plan count | Variable, max 15 per journey |
| Ordering | Sequential with explicit dependencies |
| Scope per plan | Feature-scoped vertical slice (a plan may invoke skills across multiple domains) |
| Best for | Complex, variable-scope work (building forms from diverse inputs) |

### Plan Types

Plan types are chosen by the planner from the spec's sections (see `planner/assets/GUARDRAILS.md`):

| Type | When created | Primary skills |
|------|--------------|----------------|
| Custom Component | spec has custom component entries | `forms-custom-components` |
| Screen (one per wizard step) | always — one per screen | `forms-author`, `forms-content-modeler` |
| Interaction Flow | multi-screen journey | `forms-rule-author` |
| Functional Rules | spec has functional rules | `forms-rule-author` |
| Complex Rules | spec has calculations / complex rules | `forms-rule-author` |
| Validation | spec has validations | `forms-rule-author` |
| Integration | spec has API integrations | `forms-integration`, `forms-rule-author` |
| Submit | always | `forms-author`, `forms-integration` |
| QA | always — last plan | — |

### Plan Conventions

| Property | Convention |
|----------|-----------|
| Spec path | `$FORMS_WORKSPACE/journeys/<journey>/spec.md` |
| Plan path | `$FORMS_WORKSPACE/journeys/<journey>/plans/NN-<short-title>.md` |
| Numbering | Zero-padded two digits: `01`, `02`, …, `15` |
| Max per journey | 15 — if more are needed, the journey is too complex; flag to the user |
| Execution | Sequential — each plan declares dependencies explicitly |
| Acceptance | Each plan must include an `## Acceptance Criteria` section |

### Key Files in the Plan-Driven System

| What | Where |
|------|-------|
| Analysis router | `forms-analysis/SKILL.md` |
| Analysis sub-skills | `forms-analysis/references/{analyze-requirements,visual-analysis,analyze-v1-form}/SKILL.md` |
| Planner | `forms-orchestrator/references/planner/SKILL.md` |
| Plan template (`type: template`) | `forms-orchestrator/references/planner/assets/TEMPLATE.md` |
| Planner guardrails (plan type selection + ordering) | `forms-orchestrator/references/planner/assets/GUARDRAILS.md` |
| Journey spec (generated) | `$FORMS_WORKSPACE/journeys/<journey>/spec.md` |
| Generated plan files | `$FORMS_WORKSPACE/journeys/<journey>/plans/NN-<title>.md` |

---

## Getting Started

1. **New skill tree?** Start with [Directory Structure](directory-structure.md) to set up the layout.
2. **Need a dispatcher?** Use the [Skill Router Template](skill-router-template.md) — produces `type: router`.
3. **Router getting long?** Offload routing logic to a routing-table asset (`ROUTES.md`, see [Routing Table Template](routing-table-template.md)) and constraints to a guidelines asset (`GUARDRAILS.md`, see [Guidelines Template](guidelines-template.md)).
4. **Need to group skills?** Catalog them as domains in a registry (`type: router`); domain entry points are `type: router` or `type: skill`, or skills are routed to directly when a domain has no single entry.
5. **Need multi-phase workflows?** Pair an analysis stage that emits a journey spec with a planner (`type: skill`) that decomposes it into plans. See [Plan-Driven Workflows](#plan-driven-workflows).
6. **Building a leaf skill?** Follow [agentskills.io](https://agentskills.io) — set `metadata.type: skill` and keep it under 500 lines.
