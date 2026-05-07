# optel-query plugin — Tests

## Structure

| Location | Type | Description |
|----------|------|-------------|
| `tests/test_plugin_structure.sh` | Automated | Validates plugin metadata and base structure |
| `evals/` | Agent evals | Task + criteria fixtures for optel-query skill behaviour |

## Running Tests

### Plugin structure validation

```bash
bash tests/test_plugin_structure.sh
```

### Skill evals

Eval fixtures live under `evals/`. Each subdirectory has a `task.md` (prompt) and `criteria.json` (weighted pass/fail criteria).
