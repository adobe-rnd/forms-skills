# AEM Forms Skills for AI Coding Agents

> Turn natural language into production AEM Adaptive Forms.

Skills plugin that gives AI coding agents (Claude Code, etc.) the knowledge and tools to create, validate, and deploy AEM Adaptive Forms through conversation.

---

## Table of Contents

- [How It Works](#how-it-works)
- [User Guide](#user-guide) _(install, set up workspace, start building)_
- [Developer Guide](#developer-guide) _(work on the plugin itself)_

---

# How It Works

The plugin is organized as a **Skill Gateway** — a layered routing architecture that maps user intents to the right skill automatically.

```
User Intent → forms-orchestrator → Domain Router → Skill → Tools
```

The entry point is the **forms-orchestrator** (`skills/SKILL.md`). It routes to one of six domains, each domain routes to its child skills, and each skill owns its tools and references.

### Domains

| Domain | Purpose | Skills |
|--------|---------|--------|
| `infra` | Setup, sync, deploy | `setup-workspace`, `sync-forms`, `sync-eds-code`, `git-sandbox` |
| `analysis` | Requirements & documentation | `analyze-requirements`, `analyze-v1-form`, `create-screen-doc`, `review-screen-doc` |
| `build` | Form structure & components | `scaffold-form`, `create-form`, `create-component` |
| `logic` | Business rules & functions | `add-rules`, `create-function`, `optimize-rules` |
| `integration` | APIs & data | `manage-apis` |
| `context` | Agent memory & session continuity | `manage-context` |

### Request Pipeline

Building a form end-to-end follows seven phases. The orchestrator guides you through them:

| Phase | Name | Domain |
|-------|------|--------|
| 0 | Setup | `infra` |
| 1 | Intake & Plan | `analysis` |
| 2 | Analyze & Document | `analysis` |
| 3 | Build | `build` |
| 4 | Integrate | `integration` |
| 5 | Logic | `logic` |
| 6 | Deploy | `infra` |

You don't need to memorize this — just start talking to the agent. The orchestrator handles routing.

> **Full details:** See `skills/SKILL.md` for the complete routing table and pipeline definition.

---

# User Guide

Everything you need to install the plugin, set up a workspace, and start building forms.

## 1. System Requirements

| Requirement | Why |
|-------------|-----|
| Node.js 18+ | Runs the form validator, rule transformer, and rule save tools |
| Python 3.10+ | Runs form sync, API manager, and rule validation (deps managed by the plugin) |
| `git` on PATH | Used by `eds-code-sync` and `git-sandbox` for repo operations |

The plugin bundles its own Python virtual environment — you don't install any Python packages yourself.

## 2. Install the Plugin

### Claude Code

```bash
/plugin install aem-forms@adobe-skills
```

### Vercel Skills (npx)

```bash
# Install all skills
npx skills add adobe/skills --path skills/aem/forms --all

# Or install a single skill
npx skills add adobe/skills --path skills/aem/forms --skill create-form

# List what's available
npx skills add adobe/skills --path skills/aem/forms --list
```

Python dependencies are installed automatically on first use.

## 3. Get Started

After installation, tell your agent:

> _"Set up a new AEM Forms workspace for my project."_

The `setup-workspace` skill handles everything — directory structure, `.env` credentials, system checks, and first sync. See [`skills/references/infra/references/setup-workspace/SKILL.md`](skills/references/infra/references/setup-workspace/SKILL.md) for the full workspace layout, credential reference, and configuration guide.

Once your workspace is ready, just start talking:

> _"Here's the requirements doc for a personal loan application. Build the form."_

The **forms-orchestrator** (`skills/SKILL.md`) routes your intent to the right domain and skill automatically. See it for the complete routing table, pipeline phases, and available skills across all six domains: `infra`, `analysis`, `build`, `logic`, `integration`, and `context`.

---

# Developer Guide

Everything you need to work on the plugin code — add skills, modify scripts, and run tests.

## Prerequisites

- Python 3.10+ (3.13 recommended)
- Node.js 18+
- `git` and `npm` on PATH
- [`uv`](https://docs.astral.sh/uv/) (recommended) or `python3 -m venv`

## 1. Clone and Set Up

```bash
git clone <repo-url>
cd skills/aem/forms

# Run the setup script — creates a venv, installs everything
./setup.sh
```

The script will:
1. Create a `.venv` virtual environment (uses `uv` if available, falls back to `python3 -m venv`).
2. Install the project in editable mode (`pip install -e ".[dev]"`).
3. Install the Node.js bridge dependencies (`npm install` in `skills/scripts/rule_coder/bridge/`).

After setup, activate the venv in any new shell:

```bash
source .venv/bin/activate
```

| Flag | What it does |
|------|-------------|
| `--force` | Delete existing `.venv` and recreate from scratch |
| `--skip-deps` | Create/activate venv but skip package installation |

## 2. Run Tests

```bash
source .venv/bin/activate

# Validate plugin structure
bash tests/test_plugin_structure.sh

# Smoke-test every CLI tool against fixtures
bash tests/test_scripts_smoke.sh
```

There's also a manual end-to-end test plan in `tests/e2e-test-plan.md`.

## Repository Structure

```
forms/
├── pyproject.toml                  # Python packaging — deps, entry points
├── setup.sh                       # One-command dev setup
├── README.md                      # This file
├── .claude-plugin/
│   └── plugin.json                # Plugin metadata and skill registry
├── skills/
│   ├── SKILL.md                   # forms-orchestrator — entry point
│   ├── bin/                       # Shared CLI wrappers (auto-added to PATH)
│   ├── scripts/                   # Shared scripts (api_manager, rule_coder)
│   └── references/                # Domain routers and child skills
│       ├── infra/                 #   SKILL.md + references/{setup-workspace, sync-forms, ...}
│       ├── analysis/              #   SKILL.md + references/{analyze-requirements, create-screen-doc, ...}
│       ├── build/                 #   SKILL.md + references/{scaffold-form, create-form, ...}
│       ├── logic/                 #   SKILL.md + references/{add-rules, create-function, ...}
│       ├── integration/           #   SKILL.md + references/{manage-apis}
│       └── context/               #   SKILL.md + references/{manage-context}
└── tests/
    ├── test_plugin_structure.sh
    ├── test_scripts_smoke.sh
    ├── e2e-test-plan.md
    └── fixtures/                  # Sample forms, rules, and functions
```

Every level follows the [agentskills.io specification](https://agentskills.io/specification): `SKILL.md` (required) + `scripts/` + `references/` + `assets/` (optional).

## Shared CLI Tools (`skills/bin/`)

| Tool | Backend | Description |
|------|---------|-------------|
| `api-manager` | `skills/scripts/api_manager/cli.py` | Manage OpenAPI specs and JS clients |
| `rule-transform` | `skills/scripts/rule_coder/bridge/cli/transform-form.js` | Transform form JSON for rule editing |
| `rule-validate` | `skills/scripts/rule_coder/validator/` | Validate rule JSON against grammar |
| `rule-save` | `skills/scripts/rule_coder/bridge/cli/save-rule.js` | Save compiled rules back to form |
| `rule-grammar` | `skills/scripts/rule_coder/grammar/` | Print the rule grammar reference |
| `parse-functions` | `skills/scripts/rule_coder/bridge/cli/parse-functions.js` | Parse custom function JSDoc annotations |

## Skill-Embedded CLI Tools

| Tool | Domain / Skill | Language |
|------|----------------|----------|
| `form-sync` | `infra/sync-forms` | Python |
| `eds-code-sync` | `infra/sync-eds-code` | Python |
| `git-sandbox` | `infra/git-sandbox` | Python |
| `form-validate` | `build/create-form` | Node.js |
| `scaffold-form` | `build/scaffold-form` | Python |
| `cct-create` | `build/create-component` | Python |
| `api-skill` | `integration/manage-apis` | Python |

## Adding a New Skill

1. Decide which domain it belongs to (`infra`, `analysis`, `build`, `logic`, `integration`, or `context`).
2. Create a directory under `skills/references/<domain>/references/<skill-name>/`.
3. Add a `SKILL.md` file with frontmatter (`name`, `description`) and instructions.
4. If the skill needs a CLI tool, add a `scripts/` directory inside the skill.
5. Register it in `.claude-plugin/plugin.json` under the `skills` array.
6. Run `bash tests/test_plugin_structure.sh` to verify.

---

## License

Apache 2.0 — see [LICENSE](../../../LICENSE) for details.