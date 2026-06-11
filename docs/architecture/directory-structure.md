---
name: directory-structure
description: >
  Standard directory layout conventions for multi-skill systems.
  Covers flat, grouped, and deep skill trees with type annotations,
  using the adaptive-forms-authoring plugin as the reference layout.
metadata:
  type: guidelines
---

# Skill Directory Structure

How to organize a skill tree's files and folders. Follows the [agentskills.io specification](https://agentskills.io) for per-skill layout, with conventions for multi-skill composition.

Every SKILL.md declares a `type` under `metadata:` — see the [Skill Architecture Guide](README.md) for the full type reference.

---

## Per-Skill Layout (agentskills.io standard)

Every skill is a directory with at minimum a `SKILL.md`:

```
<skill-name>/
├── SKILL.md              # metadata.type: skill | router
├── references/           # Sub-skills or reference docs
│   ├── <sub-skill>/
│   │   └── SKILL.md      # metadata.type: skill | router
│   └── <reference>.md
├── assets/               # Static resources, offloaded content
│   ├── GUARDRAILS.md     # constraints & conventions
│   ├── ROUTES.md         # routing algorithm (routers only)
│   ├── SETUP.md          # inline bootstrap (orchestrator only)
│   └── TEMPLATE.md       # template emitted/used by the skill
└── scripts/              # Executable code
    └── <script>.sh
```

**Rules:**
- `name` in SKILL.md frontmatter **must match** the directory name.
- `metadata.type` **must match** the skill's role (`router` or `skill`).
- SKILL.md body should be **under 500 lines / 5,000 tokens** (routers: under ~100 lines).
- Use relative paths for all file references.

> **Generated artifacts (plans, specs, journey state) do NOT live in the skill tree.** They are written at runtime into the workspace (`$FORMS_WORKSPACE`) — see [Runtime Workspace](#runtime-workspace).

---

## Type by Layer

In a multi-layer skill tree, each layer uses specific types:

```
Level 0 (entry point)     → metadata.type: router   (orchestrator / gateway)
Level 1 (registry)        → metadata.type: router   (domain registry — flat catalog)
Level 1 (planner)         → metadata.type: skill    (generates plans dynamically)
Level 2 (domain entry)    → metadata.type: router   (e.g. forms-analysis, forms-integration)
                            OR metadata.type: skill  (e.g. forms-rule-author, or no router at all)
Level 3 (implementation)  → metadata.type: skill    (leaf skills — do the work)

Supporting asset files (untyped markdown unless noted):
  assets/ROUTES.md       → routing algorithm
  assets/GUARDRAILS.md   → cross-cutting constraints
  assets/SETUP.md        → inline workspace bootstrap
  assets/TEMPLATE.md     → plan template (type: template) or domain SKILL template
```

| Level | Type | Routing? | Implementation? | Max Lines |
|-------|------|----------|-----------------|-----------|
| 0 | `router` | Yes | No | ~100 |
| 1 (registry) | `router` | Yes | No | ~100 |
| 1 (planner) | `skill` | No | Yes (generates plans) | 500 |
| 2 (domain entry) | `router` or `skill` | Yes | Sometimes | ~100 / 500 |
| 3 (leaf) | `skill` | No | Yes | 500 |
| Any (asset) | *(untyped, or `template`)* | N/A | N/A | No limit |

> There is **no `type: domain`**. Domains are logical groupings catalogued by the registry; their entry skills declare `router` or `skill`. See [Skill Architecture Guide](README.md#skill-types).

---

## Flat Layout (1–4 skills)

All skills are `metadata.type: skill`. No router needed:

```
my-skill-tree/
├── .claude-plugin/
│   └── plugin.json
└── skills/
    ├── skill-a/
    │   └── SKILL.md          # metadata.type: skill
    ├── skill-b/
    │   └── SKILL.md          # metadata.type: skill
    └── skill-c/
        └── SKILL.md          # metadata.type: skill
```

Each skill is standalone and triggered independently by its `description` field.

---

## Grouped Layout (5–10 skills)

Add a `metadata.type: router` at the top that dispatches to `skill` leaves:

```
my-skill-tree/
├── .claude-plugin/
│   └── plugin.json
└── skills/
    └── <orchestrator>/
        ├── SKILL.md              # metadata.type: router — dispatches to sub-skills
        ├── assets/
        │   ├── ROUTES.md         # routing algorithm (if routing is complex)
        │   └── GUARDRAILS.md     # constraints (if cross-cutting rules exist)
        └── references/
            ├── skill-a/
            │   └── SKILL.md      # metadata.type: skill
            ├── skill-b/
            │   └── SKILL.md      # metadata.type: skill
            └── skill-c/
                └── SKILL.md      # metadata.type: skill
```

The router SKILL.md is lean (< 100 lines) and links to `assets/` for details.

---

## Deep Layout (10+ skills, plan-driven workflows)

This is the layout of the **`adaptive-forms-authoring`** reference plugin. The orchestrator owns the planner and registry; **every domain skill is a sibling** under `skills/` — the registry catalogs them by path, it does not contain them.

```
plugins/adaptive-forms-authoring/
├── .claude-plugin/
│   └── plugin.json
└── skills/
    ├── forms-orchestrator/
    │   ├── SKILL.md                       # metadata.type: router (gateway)
    │   ├── assets/
    │   │   ├── ROUTES.md                  # routing algorithm
    │   │   ├── GUARDRAILS.md              # constraints & conventions
    │   │   └── SETUP.md                   # inline workspace bootstrap
    │   └── references/
    │       ├── planner/
    │       │   ├── SKILL.md               # metadata.type: skill (plan generator)
    │       │   └── assets/
    │       │       ├── GUARDRAILS.md      # plan-type selection + ordering
    │       │       └── TEMPLATE.md        # type: template (plan-file schema)
    │       └── domain-registry/
    │           ├── SKILL.md               # metadata.type: router (flat catalog)
    │           └── assets/
    │               └── TEMPLATE.md        # domain SKILL template (produces type: router)
    │
    ├── forms-analysis/                    # analysis domain — entry: router
    │   ├── SKILL.md                       # metadata.type: router
    │   └── references/
    │       ├── analyze-requirements/SKILL.md   # metadata.type: skill
    │       ├── visual-analysis/SKILL.md        # metadata.type: skill
    │       ├── analyze-v1-form/SKILL.md        # metadata.type: skill
    │       └── task-types.md
    │
    ├── forms-author/                      # content-author domain — no router (direct)
    │   ├── SKILL.md                       # metadata.type: skill
    │   └── references/ …
    ├── forms-content-modeler/SKILL.md     # content-author — metadata.type: skill
    ├── forms-component-discovery/SKILL.md # content-author/style — metadata.type: skill
    ├── forms-custom-components/SKILL.md   # content-author — metadata.type: skill
    │
    ├── forms-rule-author/                 # rule-creator domain — entry: skill
    │   ├── SKILL.md                       # metadata.type: skill
    │   └── references/ …
    │
    ├── forms-integration/                 # integration domain — entry: router
    │   ├── SKILL.md                       # metadata.type: router
    │   └── references/
    │       └── manage-apis/SKILL.md       # metadata.type: skill
    │
    ├── forms-style-screen/SKILL.md        # style domain — metadata.type: skill
    └── forms-context-management/SKILL.md  # context-management — metadata.type: skill
```

Key characteristics of the plan-driven deep layout:
- **The planner is a single `type: skill`** that generates plans dynamically at runtime.
- **The domain registry is a flat catalog** — it resolves an intent or plan step to a sibling skill's `SKILL.md` path.
- **Domains are logical, not structural** — a domain may have a router entry (`forms-analysis`, `forms-integration`), a skill entry (`forms-rule-author`), or no entry point (`content-author`, `style` route to leaves directly).
- **No generated artifacts in the tree** — plans and specs are written to `$FORMS_WORKSPACE` at runtime.

---

## Runtime Workspace

The generated, journey-specific artifacts live **outside the skill tree**, in the workspace rooted at `$FORMS_WORKSPACE` (bootstrapped by `forms-orchestrator/assets/SETUP.md`):

```
$FORMS_WORKSPACE/
├── inputs/                       # raw input docs / screenshots
├── refs/
│   ├── apis/<name>.<ext>         # extracted API definitions
│   └── component-registry.md     # written by forms-component-discovery
├── .agent/
│   └── handover.md               # session state / active plan
└── journeys/
    └── <journey>/
        ├── spec.md               # produced by forms-analysis
        └── plans/                # produced by the planner
            ├── 01-<screen>.md
            ├── 02-interaction-flow.md
            └── NN-qa.md
```

| Artifact | Path | Produced By |
|----------|------|-------------|
| Raw inputs | `$FORMS_WORKSPACE/inputs/` | user / analysis INTAKE |
| API refs | `$FORMS_WORKSPACE/refs/apis/<name>.<ext>` | `forms-analysis` (EXTRACTING) |
| Component registry | `$FORMS_WORKSPACE/refs/component-registry.md` | `forms-component-discovery` |
| Journey spec | `$FORMS_WORKSPACE/journeys/<journey>/spec.md` | `forms-analysis` |
| Plan files | `$FORMS_WORKSPACE/journeys/<journey>/plans/NN-<title>.md` | `planner` |
| Session handover | `$FORMS_WORKSPACE/.agent/handover.md` | `forms-context-management` |

---

## Convention Summary

| Convention | Rule |
|------------|------|
| **`metadata.type`** | Every SKILL.md must declare `type` under `metadata:` (`router` or `skill`). |
| **`type: router`** | < ~100 lines. Route only, never implement. |
| **`type: skill`** | < 500 lines / 5,000 tokens. Does the actual work (planner included). |
| **No `type: domain`** | Domains are registry groupings, not a frontmatter type. |
| **`references/`** | Sub-skills (folders with SKILL.md) or reference docs. |
| **`assets/`** | Offloaded content: `ROUTES.md`, `GUARDRAILS.md`, `SETUP.md`, `TEMPLATE.md`, catalogs. |
| **`scripts/`** | Executable code. Self-contained, with error handling. |
| **Generated artifacts** | Plans / specs / handover live in `$FORMS_WORKSPACE`, never in the skill tree. |
| **Directory name = `name` field** | Always. No exceptions. |

---

## Anti-Patterns

| Anti-Pattern | Why It's Bad | Fix |
|-------------|-------------|-----|
| Missing `type` under `metadata` | Contributors can't tell what the file does without reading it | Add `metadata.type` — it's required |
| `type: router` with > 100 lines | Loaded on every routing decision, wastes tokens | Offload to `ROUTES.md` and `GUARDRAILS.md` assets |
| `type: skill` that also routes to sub-skills | Violates single-responsibility, bloats the file | Split into `router` + `skill` |
| Nesting domain skills under the registry | Couples the catalog to the skills; breaks sibling resolution | Keep skills as siblings under `skills/`; let the registry catalog them by path |
| Using a `type: domain` value | Not a real type in this system | Use `router` or `skill`; treat the domain as a registry grouping |
| Deeply nested references (3+ levels) | Hard to discover, slow to navigate | Flatten or catalog via the registry |
| Guidelines duplicated across skills | Drift, contradictions | Consolidate in a `GUARDRAILS.md` asset at the parent level |
| Writing plans/specs into the skill tree | Pollutes the shipped plugin with per-journey state | Write them to `$FORMS_WORKSPACE` |
| `resources/` instead of `references/` + `assets/` | Non-standard naming, confuses the discovery model | Rename to standard directories |
| Plans with more than ~10 steps | Too much scope in a single plan | Split along a natural boundary |
| More than 15 plans per journey | Journey is too complex | Decompose into sub-journeys |
| Plan scope defined by skill domain instead of feature | Fragmented, hard-to-test increments | Scope plans by feature — a plan may invoke multiple domains |
