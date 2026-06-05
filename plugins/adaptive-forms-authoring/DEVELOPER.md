# AEM Forms Skills — Developer Guide

Everything needed to work on the plugin — add skills, modify scripts, run tests.

---

## Prerequisites

- Python 3.10+ (3.13 recommended)
- Node.js 18+
- `git` and `npm` on PATH
- [`uv`](https://docs.astral.sh/uv/) (recommended) or `python3 -m venv`

---

## 1. Clone and Set Up

```bash
git clone <repo-url>
cd forms-skills

# Creates .venv at project root, installs everything
./lib/scripts/setup.sh
```

The script:
1. Creates a `.venv` virtual environment (uses `uv` if available, falls back to `python3 -m venv`)
2. Installs the project in editable mode (`pip install -e ".[dev]"`)
3. No additional Node.js install needed — bundles are pre-built in `scripts/` directories

Activate the venv in any new shell:

```bash
source .venv/bin/activate
```

| Flag | What it does |
|------|-------------|
| `--force` | Delete existing `.venv/` and recreate from scratch |
| `--skip-deps` | Create/activate venv but skip package installation |

---

## 2. Run Tests

```bash
# Validate plugin structure against the agentskills.io spec
npx check-plugin .
```

Checks that every skill path in `plugin.json` has a valid `SKILL.md` with `name` and `description` frontmatter. `check-plugin` ships with `@aemforms/crispy-garbanzo` — run `npm install` once to make it available.

---

## 3. Run Evals

**Deterministic script evals** (no token needed):

```bash
node evals/scripts/run-evals.js
node evals/scripts/run-evals.js --filter find-field   # subset
```

**LLM evals** (Bedrock bearer token or `ANTHROPIC_API_KEY`):

```bash
# Bedrock
AWS_BEARER_TOKEN_BEDROCK=<token> AWS_REGION=us-east-1 node evals/scripts/run-llm-evals.js

# Direct Anthropic API
ANTHROPIC_API_KEY=<key> node evals/scripts/run-llm-evals.js

node evals/scripts/run-llm-evals.js --filter routing/01 --verbose  # single scenario
```

Scenarios in `evals/scenarios/`, fixtures in `evals/fixtures/`.

---

## Repository Structure

```
forms-skills/
├── .claude-plugin/
│   └── plugin.json                      # Plugin metadata and skill registry
├── evals/                               # Eval scenarios, fixtures, runner scripts
│   ├── scripts/
│   │   ├── run-evals.js
│   │   └── run-llm-evals.js
│   ├── scenarios/
│   ├── fixtures/
│   └── .envrc.example
├── lib/                                 # Shared scripts and Python runtime
│   └── scripts/
│       ├── setup.sh
├── ONBOARDING.md                        # User onboarding — architecture, install, get started
├── DEVELOPER.md                         # This file
└── skills/
    ├── forms-orchestrator/              # Entry point router
    │   ├── SKILL.md
    │   ├── assets/
    │   │   ├── GUARDRAILS.md
    │   │   ├── ROUTES.md               # Orchestrator state machine
    │   │   └── SETUP.md               # Workspace setup (read inline at gate)
    │   └── references/
    │       ├── planner/                 # Plan generator
    │       └── domain-registry/         # Domain & skill catalog
    ├── forms-analysis/                  # Analysis domain
    │   └── references/
    │       ├── analyze-requirements/
    │       ├── analyze-v1-form/
    │       └── visual-analysis/
    ├── forms-author/                    # Content authoring domain
    │   ├── scripts/                     # Pre-built bundles
    │   └── references/
    ├── forms-content-modeler/           # Component JSON builder
    │   ├── scripts/
    │   └── references/
    ├── forms-component-inventory/       # Custom component discovery
    ├── forms-custom-components/         # Custom EDS component authoring
    │   ├── scripts/
    │   └── references/
    ├── forms-rule-author/               # Rule & custom function authoring
    │   ├── scripts/
    │   ├── assets/
    │   └── references/
    ├── forms-integration/               # Integration domain
    │   └── references/
    │       └── manage-apis/
    └── forms-context-management/        # Context & session domain
        └── references/
            └── manage-context/
```

---

## Shared CLI Tools (`lib/scripts/`)

---

## Rule Creator Scripts (`forms-rule-author/scripts/`)

Pre-built Node.js bundles (`.jsh`) — run with `node $SKILL_DIR/scripts/<name>.jsh`.

| Script | Description |
|--------|-------------|
| `transform-jcr.jsh` | Transform JCR form JSON → treeJson for rule editing |
| `transform-content-model.jsh` | Transform content model JSON → treeJson for rule editing |
| `find-field.jsh` | Find field by name → qualifiedId + type |
| `validate-rule.jsh` | Validate rule AST against grammar |
| `generate-formula.jsh` | Compile rule AST → JSON Formula |
| `merge-formula.jsh` | Merge compiled formula back into form |
| `parse-functions.jsh` | Parse custom function JSDoc annotations |
| `validate-custom-function.bundle.js` | Validate custom function signature |

---

## forms-author Bundles (`forms-author/scripts/`)

Pre-built bundles — run with `node $SKILL_DIR/scripts/<name>.bundle.js`.

| Bundle | Description |
|--------|-------------|
| `find-field.bundle.js` | Find field/panel by name → capiKey + pointer |
| `resolve-insert-position.bundle.js` | Resolve insert index in panel |
| `validate-patch.bundle.js` | Type-check replace ops against Content API definition |
| `build-insert-ops.bundle.js` | Build CAPI insert operations for new components |
| `diff-component.bundle.js` | Diff component JSON to generate patch ops |
| `filter-definition.bundle.js` | Slim component definition to relevant fields |
| `apply-rule-patch.bundle.js` | Apply fd:rules / fd:events patch onto a content model node |
| `find-rule-refs.bundle.js` | Scan fd:rules ASTs for COMPONENT refs to a qualifiedId |
| `rewrite-rule-refs.bundle.js` | Rewrite COMPONENT refs old→new in fd:rules ASTs |

---

## forms-content-modeler Bundles (`forms-content-modeler/scripts/`)

Pre-built bundles — run with `node $SKILL_DIR/scripts/<name>.bundle.js`.

| Bundle | Description |
|--------|-------------|
| `resolve-component-type.bundle.js` | Resolve fieldType intent → component type candidates |
| `filter-definition.bundle.js` | Slim component definition to relevant fields |
| `get-component-def.bundle.js` | Fetch property profile for a component type |
| `validate-add.bundle.js` | Validate a new component payload against the definition |
| `check-name-collision.bundle.js` | Check proposed field names for collisions in the model |

---

## Skill-Embedded CLI Tools

| Tool | Skill | Language |
|------|-------|----------|
| `api-skill` | `forms-integration/references/manage-apis/scripts/` | Python |

---

## Adding a New Skill

1. Decide which domain it belongs to — see `skills/forms-orchestrator/references/domain-registry/SKILL.md`
2. Create `skills/forms-<domain>/references/<skill-name>/SKILL.md`
3. Add frontmatter (`name`, `description`, `license`, `metadata.type`)
4. If the skill needs a CLI tool, add `scripts/` inside the skill directory
5. Register in `references/domain-registry/SKILL.md` — domain's skill table
6. Register in `.claude-plugin/plugin.json` — `skills` array
7. Run `npx check-plugin .` to verify

---

## License

Apache 2.0 — see [LICENSE](../../LICENSE) for details.
