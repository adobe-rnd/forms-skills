# analyze-requirements — Eval Plan

## Automated

No automated tests — this skill is pure reasoning with no CLI tools.

## Manual (E2E)

### Prompt
> Analyze these requirements for a Contact Us form:
> - Full Name (required, 2-50 chars)
> - Email (required, valid email)
> - Phone (optional)
> - Inquiry Type (dropdown: General, Support, Sales)
> - Message (multiline, required when Inquiry Type is "Support")
> - On form submit, show thank-you message

### Expected Behavior
- Produces a structured specification with all 11 sections
- Field inventory lists all 5 fields with correct types
- Rule requirements mention show/hide for message based on inquiry type
- No hallucinated APIs or extra fields
- Does NOT ask clarifying questions for clearly specified fields
- Marks any unknowns as TBD

### Checklist
- [ ] Output has structured sections (field inventory, panel structure, rules, etc.)
- [ ] All 5 fields listed with correct types
- [ ] Rule requirements mention visibility for message field
- [ ] No hallucinated content

### Fixture
See [fixtures/sample-requirements.md](fixtures/sample-requirements.md) for a sample requirements document.