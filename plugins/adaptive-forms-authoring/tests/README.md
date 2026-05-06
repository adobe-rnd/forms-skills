# adaptive-forms-authoring plugin — Tests

## Structure

Tests are organized at two levels:

### Plugin-level tests (this directory)

| File | Type | Description |
|------|------|-------------|
| `test_plugin_structure.sh` | Automated | Validates plugin metadata, skill files, and package structure |
| `e2e-test-plan.md` | Manual | End-to-end test plan covering the full form lifecycle |
| `error-handling-guide.md` | Reference | Error reporting and recovery patterns for all tools |

### Skill-level evals (`skills/forms-orchestrator/.../eval/`)

Each skill with testable scripts has its own `eval/` directory inside the skill folder. The full path pattern is `skills/forms-orchestrator/references/domain-registry/references/<domain>/references/<skill>/eval/`.

| Skill | Domain | Eval contents |
|-------|--------|---------------|
| `create-form` | `build` | Form validator smoke test + form fixture |
| `add-rules` | `logic` | Rule transform/validate/save smoke tests + rule fixtures |
| `create-function` | `logic` | Parse-functions smoke test + function fixture |
| `manage-apis` | `integration` | API Manager smoke test |
| `analyze-requirements` | `analysis` | Requirements fixture + manual eval plan |

## Running Tests

### Plugin structure validation

```bash
bash tests/test_plugin_structure.sh
```

### Skill evals

All eval paths are relative to the plugin root (`plugins/adaptive-forms-authoring/`). The base path for skill evals is `skills/forms-orchestrator/references/domain-registry/references`.

```bash
# Build domain
bash skills/forms-orchestrator/references/domain-registry/references/build/references/create-form/eval/eval-form-validate.sh

# Logic domain
bash skills/forms-orchestrator/references/domain-registry/references/logic/references/add-rules/eval/eval-rule-tools.sh
bash skills/forms-orchestrator/references/domain-registry/references/logic/references/create-function/eval/eval-parse-functions.sh

# Integration domain
bash skills/forms-orchestrator/references/domain-registry/references/integration/references/manage-apis/eval/eval-api-manager.sh
```

### Prerequisites

- Node.js 18+ (for form validator, rule bridge scripts)
- Python 3.10+ (for rule validator, API manager)
- `npm install` in `skills/forms-orchestrator/scripts/rule_coder/bridge/` (for lodash dependency)
- Run `./forms-orchestrator/scripts/setup.sh` first to create the `.venv` and install Python dependencies

## Python Environment

All Python tools run through the central `skills/forms-orchestrator/scripts/python3` wrapper, which:

1. Lazily bootstraps `.venv` at the project root on first use (via `skills/forms-orchestrator/scripts/setup.sh`)
2. Sets `PYTHONPATH` for all plugin Python packages — no individual script needs to manage paths
3. Execs the venv Python with the correct environment

This means eval scripts that invoke Python tools (directly or via CLI wrappers) automatically get the right Python environment without any manual setup beyond the initial `setup.sh` run.