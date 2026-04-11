# End-to-End Test Plan: AEM Forms Plugin

> **Task:** P4.5 — Full form lifecycle test
> **Plugin:** aem-forms (skills-only, no MCP server)
> **Duration:** ~30-45 minutes
> **Prerequisites:** Claude Code with aem-forms plugin installed, Node.js 18+, Python 3.10+

---

## Test Environment Setup

### 1. Install the Plugin
```
/plugin install aem-forms@adobe-skills
```

### 2. Verify Plugin Installation
- Run `/skills` and verify all 4 skills appear:
  - `analyze-requirements`
  - `create-form`
  - `add-rules`
  - `create-function`

### 3. Create a Test Workspace
Create a fresh project directory with this structure:
```
test-workspace/
├── form/          (empty — forms will be created here)
├── code/
│   └── blocks/
│       └── form/
│           └── scripts/
│               ├── form/       (form-level scripts)
│               └── fragment/   (fragment scripts)
├── refs/
│   ├── metadata.json    (empty JSON object: {})
│   └── apis/
│       └── generated/
│           └── spec/    (empty — no APIs for this test)
└── scripts -> <path-to-plugin>/scripts/
```

The `scripts` symlink should point to the installed plugin's `scripts/` directory so that tool commands work from the workspace root.

---

## Test Scenario: Contact Us Form

### Requirements
A simple contact form for website visitors with:
- Full Name (required, 2-50 chars)
- Email (required, valid email)
- Phone (optional)
- Inquiry Type (dropdown: General, Support, Sales)
- Message (multiline, required when Inquiry Type is "Support")
- On form submit, show thank-you message

---

## Test Steps

### Step 1: Analyze Requirements (skill: analyze-requirements)

**Prompt to Claude:**
> Here are the requirements for a Contact Us form. Please analyze them using the analyze-requirements skill.
>
> [paste the requirements from above]

**Expected Behavior:**
- Claude reads the requirements
- Produces a structured specification with:
  - Form name and title
  - Field inventory (5 fields with types, validation)
  - Panel structure (2 panels: Contact Info, Inquiry)
  - Rule requirements (1 visibility rule for message field)
  - API dependencies (none)
- Does NOT ask clarifying questions for fields that are clearly specified
- Marks any unknowns as TBD

**Validation Checklist:**
- [ ] Output has all 11 sections from the skill's template
- [ ] Field inventory lists all 5 fields with correct types
- [ ] Rule requirements mention show/hide for message based on inquiry type
- [ ] No hallucinated APIs or extra fields

---

### Step 2: Create Form (skill: create-form)

**Prompt to Claude:**
> Now create the form JSON based on the specification you just produced.

**Expected Behavior:**
- Claude creates `form/contact-us.form.json`
- File contains:
  - Form root with `fieldType: "form"`, proper `sling:resourceType`
  - `contactInfoPanel` with fullName, email, phone fields
  - `inquiryPanel` with inquiryType dropdown, message textarea
  - Proper field types (text-input, email, telephone-input, drop-down)
  - Correct validation constraints (required, minLength, maxLength)
  - colspan layout values
- Claude runs the validator after creation:
  ```
  node scripts/eds_form_validator/validate.cjs form/contact-us.form.json --json
  ```

**Validation Checklist:**
- [ ] `form/contact-us.form.json` was created
- [ ] JSON is valid and parseable
- [ ] All 5 fields present with correct types
- [ ] Validator command was run
- [ ] Validator reports no errors (or only warnings)
- [ ] No `fd:rules` in form.json (rules are separate)
- [ ] Drop-down has correct enum values

---

### Step 3: Add Rules (skill: add-rules)

**Prompt to Claude:**
> Add the business rules: when inquiry type is "Support", show the message field prominently. When inquiry type changes away from "Support", hide the message field.

**Expected Behavior:**
- Claude runs transform-form to get the component tree:
  ```
  node scripts/rule_coder/bridge/cli/transform-form.js form/contact-us.form.json
  ```
- Creates a rule JSON for the visibility toggle
- Validates the rule:
  ```
  python3 -m rule_coder.validator <rule-file> --form form/contact-us.form.json
  ```
- Saves the rule:
  ```
  node scripts/rule_coder/bridge/cli/save-rule.js <rule-file> --rule-store form/contact-us.rule.json --form form/contact-us.form.json
  ```

**Validation Checklist:**
- [ ] transform-form was called first to get field qualified names
- [ ] Rule JSON uses correct grammar nodes (IF_ELSE_STATEMENT, CONDITION, COMPARISON_EXPRESSION, SHOW_STATEMENT/HIDE_STATEMENT)
- [ ] Validator was run BEFORE save
- [ ] Validator reports valid
- [ ] Rule was saved to `form/contact-us.rule.json`
- [ ] Rule store file contains the new rule entry
- [ ] Rule uses field names from transform-form output (not guessed names)

---

### Step 4: Create Function (skill: create-function)

**Prompt to Claude:**
> Create a custom function that prefills the message field with "I'm interested in learning more about..." when the inquiry type is "Sales".

**Expected Behavior:**
- Claude creates a function file at the appropriate script path
- Function has proper JSDoc annotations:
  ```javascript
  /**
   * Prefill Sales Message
   * @name prefillSalesMessage Sets default message for Sales inquiries
   * @param {scope} globals
   */
  ```
- Claude verifies with parse-functions:
  ```
  node scripts/rule_coder/bridge/cli/parse-functions.js <function-file>
  ```
- Claude may also add a rule to invoke the function on inquiryType change

**Validation Checklist:**
- [ ] Function file was created at correct path
- [ ] Function has complete JSDoc annotations
- [ ] Function uses `globals` parameter (no DOM access)
- [ ] parse-functions was called and returned success
- [ ] Function is exported properly
- [ ] If rule was added, it was validated and saved

---

### Step 5: Full Validation Pass

**Prompt to Claude:**
> Run a final validation pass on the entire form — validate the form JSON and all rules.

**Expected Behavior:**
- Claude validates form JSON:
  ```
  node scripts/eds_form_validator/validate.cjs form/contact-us.form.json --json
  ```
- Claude validates each rule in the rule store (or the whole file)
- Reports final status

**Validation Checklist:**
- [ ] Form validator reports valid
- [ ] All rules validate successfully
- [ ] No orphan rules (rules reference fields that exist in form.json)

---

## Success Criteria

The E2E test **passes** if:

1. All 4 skills were used in sequence without errors
2. `form/contact-us.form.json` is valid AEM Adaptive Form JSON
3. `form/contact-us.rule.json` contains at least one visibility rule
4. A custom function file exists with proper JSDoc annotations
5. All validator commands return success
6. The agent did not hallucinate field names, APIs, or grammar nodes
7. The agent followed the tool command patterns from the SKILL.md files (not inventing its own commands)

## Known Limitations

- **No AEM connection:** form_sync tools (pull/push/list/create) cannot be tested without AEM credentials
- **No API integration:** api_manager `list`/`show` require a populated `refs/apis/generated/spec/` directory
- **Script paths:** The agent needs the `scripts/` directory accessible from the workspace. With plugin install, this is handled automatically.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `node: command not found` | Node.js not installed | Install Node.js 18+ |
| `python3: command not found` | Python not installed | Install Python 3.10+ |
| `Cannot find module 'lodash'` | node_modules missing | Run `npm install` in `scripts/rule_coder/bridge/` |
| Validator says "Invalid" | Rule grammar error | Check grammar-reference.md for valid nodeNames |
| `No such file or directory` | Wrong working directory | Ensure running from workspace root |