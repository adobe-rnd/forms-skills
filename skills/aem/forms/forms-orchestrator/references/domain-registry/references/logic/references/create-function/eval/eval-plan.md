# create-function — Eval Plan

## Automated

Run the parse-functions smoke test:

```bash
bash skills/create-function/eval/eval-parse-functions.sh
```

## Manual (E2E)

### Prompt
> Create a custom function that prefills the message field with
> "I'm interested in learning more about..." when the inquiry type is "Sales".

### Expected Behavior
- Creates a function file with proper JSDoc annotations
- Verifies with `parse-functions`
- Function uses `globals` parameter (no DOM access)
- Function is exported properly

### Checklist
- [ ] Function file created at correct path
- [ ] Complete JSDoc annotations (`@name`, `@param`)
- [ ] Uses `globals` parameter
- [ ] `parse-functions` returns success
- [ ] Function is properly exported