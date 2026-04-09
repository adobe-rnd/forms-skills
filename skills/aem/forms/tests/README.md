# AEM Forms Plugin — Tests

## Structure

Tests are organized at two levels:

### Plugin-level tests (this directory)

| File | Type | Description |
|------|------|-------------|
| `test_plugin_structure.sh` | Automated | Validates plugin metadata, skill files, and package structure |
| `e2e-test-plan.md` | Manual | End-to-end test plan covering the full form lifecycle |
| `error-handling-guide.md` | Reference | Error reporting and recovery patterns for all tools |

### Skill-level evals (`skills/*/eval/`)

Each skill with testable scripts has its own `eval/` directory:

| Skill | Eval contents |
|-------|---------------|
| `create-form/eval/` | Form validator smoke test + form fixture |
| `add-rules/eval/` | Rule transform/validate/save smoke tests + rule fixtures |
| `create-function/eval/` | Parse-functions smoke test + function fixture |
| `manage-apis/eval/` | API Manager smoke test |
| `analyze-requirements/eval/` | Requirements fixture + manual eval plan |

## Running Tests

### Plugin structure validation

```bash
bash tests/test_plugin_structure.sh
```

### All skill evals

```bash
bash skills/create-form/eval/eval-form-validate.sh
bash skills/add-rules/eval/eval-rule-tools.sh
bash skills/create-function/eval/eval-parse-functions.sh
bash skills/manage-apis/eval/eval-api-manager.sh
```

### Prerequisites

- Node.js 18+ (for form validator, rule bridge scripts)
- Python 3.10+ (for rule validator, API manager)
- `npm install` in `scripts/rule_coder/bridge/` (for lodash dependency)