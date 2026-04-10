# add-rules — Eval Plan

## Automated

Run the rule tools smoke test:

```bash
bash skills/add-rules/eval/eval-rule-tools.sh
```

## Manual (E2E)

### Prompt
> Add business rules: when inquiry type is "Support", show the message field.
> When inquiry type changes away from "Support", hide the message field.

### Expected Behavior
- Runs `rule-transform` to get the component tree
- Creates a rule JSON for visibility toggle
- Validates the rule with `rule-validate`
- Saves the rule with `rule-save`

### Checklist
- [ ] transform-form was called first to get field qualified names
- [ ] Rule JSON uses correct grammar nodes (IF_ELSE_STATEMENT, CONDITION, etc.)
- [ ] Validator was run BEFORE save
- [ ] Validator reports valid
- [ ] Rule was saved to rule store
- [ ] Rule uses field names from transform-form output (not guessed names)