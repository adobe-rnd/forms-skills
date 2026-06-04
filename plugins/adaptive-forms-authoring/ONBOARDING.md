# AEM Forms Skills — Onboarding Guide

> Turn natural language into production AEM Adaptive Forms.

---

## How It Works

The plugin is a **Plan-Driven Skill Gateway** — a layered routing architecture that maps user intents to the right skill automatically.

```
User Intent → forms-orchestrator → Planner / Domain Registry → Domain Router → Skill → Tools
```

### Architecture

```
User Intent
     │
     ▼
┌─────────────────────────────────┐
│  forms-orchestrator             │  ← entry point router
│  forms-orchestrator/SKILL.md   │
└──────────────┬──────────────────┘
               │
     ┌─────────┴─────────┐
     ▼                   ▼
┌──────────┐    ┌─────────────────┐
│  Planner │    │  Domain Registry│
│ generates│    │ catalogs domains│
│  plans   │    │   and skills    │
└────┬─────┘    └────────┬────────┘
     │                   │
     ▼                   ▼
journeys/<j>/       Domain Routers
plans/NN-*.md       └── Leaf Skills
```

### Orchestrator State Machine

The orchestrator runs a state machine every session — reading context silently at start, determining where the journey is, and resuming from there.

| State | When | Action |
|-------|------|--------|
| **WORKSPACE_MISSING** | No `.env` or `FORMS_WORKSPACE` | Read `skills/forms-orchestrator/assets/SETUP.md` — hard gate |
| **FRESH** | No `journeys/<j>/spec.md` | Invoke `forms-analysis` → produce spec |
| **SPEC_READY** | spec.md exists, no plans | Invoke `planner` → produce plan files |
| **EXECUTING(N)** | Plan N pending | Execute plan N step by step |
| **BLOCKED** | Plan N acceptance criteria fail | Report to user, await resolution |
| **COMPLETE** | All plans done | Report journey complete |
| **SINGLE_TASK** | Isolated intent, no journey | Route directly to matching domain |

> Full state machine: `skills/forms-orchestrator/assets/ROUTES.md`

### Domains

| Domain | Purpose | Skills |
|--------|---------|--------|
| `analysis` | Requirements → journey spec | `analyze-requirements`, `visual-analysis`, `analyze-v1-form` |
| `content-author` | Form structure & components | `forms-author`, `forms-content-modeler`, `forms-custom-components`, `forms-component-inventory` |
| `style` | CSS theming & component styling | `forms-style`, `forms-component-inventory` |
| `rule-creator` | Business rules & custom functions | `forms-rule-author` |
| `integration` | APIs, FDM, prefill, submit | `manage-apis` |
| `context-management` | Session state & handover | `manage-context` |

### Plan Types

The Planner generates plans from `journeys/<journey>/spec.md`. Each plan is one of nine types, executed in dependency order:

| Plan Type | Purpose |
|-----------|---------|
| **Custom Component** | Scaffold custom `fd:viewType` block before Screen plans that use it |
| **Fragment** (×N) | Create reusable panel as standalone JSON before Screen plans that reference it |
| **Screen** (×N) | One wizard step — fields, layout, CSS. No rules or APIs |
| **Interaction Flow** | Wizard navigation + conditional step progression |
| **Functional Rules** | Show/hide, enable/disable, set-value rules |
| **Complex Rules** | Calculations and derived values |
| **Validation** | Field constraints and cross-field validation |
| **Integration** | API wiring — prefill on load, mid-flow service calls |
| **Submit** | Submit action, success state, error handling |
| **QA** | Lint + full journey smoke test + cross-plan regression |

Plans are written to `journeys/<journey>/plans/NN-<title>.md` and executed sequentially.

---

## System Requirements

| Requirement | Why |
|-------------|-----|
| Node.js 18+ | Form validator, rule transformer, rule save tools |
| Python 3.10+ | API manager and rule validation (deps managed by plugin) |
| `git` on PATH | Version control for EDS code changes |

The plugin bundles its own Python virtual environment — no manual package installs.

---

## Install

### Claude Code

```bash
/plugin marketplace add adobe/skills
/plugin install adaptive-forms-authoring@adobe-skills
```

### Vercel Skills (npx)

```bash
# Install all skills
npx skills add adobe/skills --path plugins/adaptive-forms-authoring --all

# Install a single skill
npx skills add adobe/skills --path plugins/adaptive-forms-authoring --skill forms-author

# List what's available
npx skills add adobe/skills --path plugins/adaptive-forms-authoring --list
```

---

## Get Started

After installation, tell your agent:

> _"Set up a new AEM Forms workspace for my project."_

The orchestrator reads `skills/forms-orchestrator/assets/SETUP.md` at the workspace gate — directory structure, `.env` credentials, system checks, and first-run validation.

Once your workspace is ready:

> _"Here's the requirements doc for a personal loan application. Build the form."_

The orchestrator determines journey state from `handover.md`, invokes the Planner to generate plans, then executes each plan by routing to the appropriate domain and skill. For single-task requests it routes directly to the matching domain.

---

## Resources

- [agentskills.io Specification](https://agentskills.io)
- [Claude Code Plugins](https://code.claude.com/docs/en/discover-plugins)
- [Developer Guide](DEVELOPER.md)
- [#agentskills Slack Channel](https://adobe.enterprise.slack.com/archives/C0APTKDNPEY)
