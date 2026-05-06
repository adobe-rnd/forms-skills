# adaptive-forms-authoring plugin

Build, edit, and integrate AEM Adaptive Forms through conversation — analyze requirements, scaffold forms, add rules and functions, manage APIs, and sync with Edge Delivery Services.

## Prerequisites

| Requirement | Why |
|-------------|-----|
| Node.js 18+ | Runs the form validator, rule transformer, and rule save tools |
| Python 3.10+ | Runs form sync, API manager, and rule validation (deps managed by the plugin) |
| `git` on PATH | Used by `eds-code-sync` and `git-sandbox` for repo operations |

The plugin bundles its own Python virtual environment — you don't install Python packages yourself.

## Required environment variables

Set these in `<workspace>/.env` after running `setup-workspace`:

```bash
AEM_HOST="https://author-pXXXX-eYYYY.adobeaemcloud.com"
AEM_TOKEN="<service token>"
FORMS_WORKSPACE="<absolute path to your workspace>"
GITHUB_TOKEN="<PAT with repo scope>"   # optional — only for eds-code-sync
```

The `setup-workspace` skill walks you through this on first use; you don't have to populate it by hand.

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
npx skills add adobe/skills --path plugins/adaptive-forms-authoring --skill create-form

# List what's available
npx skills add adobe/skills --path plugins/adaptive-forms-authoring --list
```

Python dependencies install on first use.

## Verify

After installation, ask your agent:

> _"Set up a new AEM Forms workspace for my project."_

The `setup-workspace` skill creates the workspace, writes `.env`, runs system checks, and performs the first form sync. Once that succeeds you're ready to build:

> _"Here's the requirements doc for a personal loan application. Build the form."_

The `forms-orchestrator` (entry point) generates plans, routes through six domains (`analysis`, `build`, `logic`, `integration`, `infra`, `context`), and dispatches to leaf skills.

## Plugin layout

```
plugins/adaptive-forms-authoring/
├── .claude-plugin/plugin.json
├── README.md
├── pyproject.toml
├── setup.sh                                # wrapper → skills/forms-orchestrator/scripts/setup.sh
├── skills/
│   └── forms-orchestrator/                  # entry-point skill
│       ├── SKILL.md
│       ├── assets/
│       ├── scripts/                          # shared CLI tools
│       └── references/
│           ├── planner/                      # plan generator (skill)
│           └── domain-registry/              # domain & skill catalog (skill)
│               └── references/<domain>/...
├── agents/                                   # custom subagents (none yet)
├── hooks/                                    # plugin hooks (none yet)
└── tests/
```

## How it works

The plugin is a **Plan-Driven Skill Gateway** — a layered router with a planner and a domain registry that maps user intent to the right skill.

```
User Intent → forms-orchestrator → Planner / Domain Registry → Domain Router → Skill → Tools
```

| Domain | Purpose | Skills |
|--------|---------|--------|
| `analysis` | Requirements & documentation | `analyze-requirements`, `analyze-v1-form`, `create-screen-doc`, `review-screen-doc` |
| `build` | Form structure & components | `scaffold-form`, `create-form`, `create-component` |
| `logic` | Business rules & functions | `add-rules`, `create-function`, `optimize-rules` |
| `integration` | APIs & data | `manage-apis` |
| `infra` | Setup, sync, deploy | `setup-workspace`, `sync-forms`, `sync-eds-code`, `git-sandbox` |
| `context` | Agent memory & session continuity | `manage-context` |

Routing follows the 6-step algorithm in `skills/forms-orchestrator/assets/routing-table.md`. See `skills/forms-orchestrator/SKILL.md` for the full constraints and table.

## Develop on the plugin

```bash
git clone <repo-url>
cd plugins/adaptive-forms-authoring
./skills/forms-orchestrator/scripts/setup.sh
```

The setup script:
1. Creates `.venv/` at the plugin root (uses `uv` if available, falls back to `python3 -m venv`).
2. Installs the project in editable mode (`pip install -e ".[dev]"`).
3. Installs Node.js bridge dependencies (`npm install` in `skills/forms-orchestrator/scripts/rule_coder/bridge/`).

Activate the venv in a new shell:

```bash
source .venv/bin/activate
```

| Flag | Purpose |
|------|---------|
| `--force` | Delete existing `.venv/` and recreate |
| `--skip-deps` | Create the venv without installing packages |

Run the structure test:

```bash
bash tests/test_plugin_structure.sh
```

There's also a manual end-to-end plan in `tests/e2e-test-plan.md` and an error-handling guide in `tests/error-handling-guide.md`.

## CLI tools

Shared tools at `skills/forms-orchestrator/scripts/`:

| Tool | Description |
|------|-------------|
| `api-manager` | Manage OpenAPI specs and JS clients |
| `rule-transform` | Transform form JSON for rule editing |
| `rule-validate` | Validate rule JSON against grammar |
| `rule-save` | Save compiled rules back to form |
| `rule-grammar` | Print the rule grammar reference |
| `parse-functions` | Parse custom function JSDoc annotations |

Skill-embedded tools live under `skills/forms-orchestrator/references/domain-registry/references/<domain>/references/<skill>/scripts/`:

| Tool | Skill | Language |
|------|-------|----------|
| `form-sync` | `infra/sync-forms` | Python |
| `eds-code-sync` | `infra/sync-eds-code` | Python |
| `git-sandbox` | `infra/git-sandbox` | Python |
| `form-validate` | `build/create-form` | Node.js |
| `scaffold-form` | `build/scaffold-form` | Python |
| `cct-create` | `build/create-component` | Python |
| `api-skill` | `integration/manage-apis` | Python |

Always reference these from a SKILL.md as `${CLAUDE_PLUGIN_ROOT}/skills/forms-orchestrator/scripts/<tool>` — never hardcode absolute paths. See `skills/forms-orchestrator/assets/guidelines.md` and `skills/forms-orchestrator/references/domain-registry/assets/contribution-guide.md`.

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
