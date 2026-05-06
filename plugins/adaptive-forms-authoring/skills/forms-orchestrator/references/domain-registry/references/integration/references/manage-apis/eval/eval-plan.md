# manage-apis — Eval Plan

## Automated

Run the API Manager smoke test:

```bash
bash skills/manage-apis/eval/eval-api-manager.sh
```

## Manual (E2E)

### Prompt
> Sync APIs from AEM and show me what's available.

### Expected Behavior
- Runs `api-manager list` to show existing APIs
- If AEM credentials are set, can `api-manager sync` to fetch from FDM
- Shows API details with `api-manager show <name>`

### Checklist
- [ ] `api-manager list` works (even with empty result)
- [ ] `api-manager show <name>` works for existing APIs
- [ ] `api-manager build --dry-run` works when specs exist