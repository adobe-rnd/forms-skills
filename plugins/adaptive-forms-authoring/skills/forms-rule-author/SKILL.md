---
name: forms-rule-author
description: >
  Use when creating business rules for AEM Adaptive Form fields — show/hide,
  validate, calculate, event handlers (click, value-commit, init),
  enabled/disabled, or format rules. Input is a form definition (JCR or Sites
  Content API) and a natural language prompt.
license: Apache-2.0
compatibility: "Scripts are pre-bundled in $SKILL_DIR/scripts/ — no npm install required at runtime."
metadata:
  author: Adobe
  version: "0.1"
  type: skill
  triggers:
    - rule
    - show hide
    - validate
    - calculate
    - event handler
    - click event
    - value commit
    - enabled disabled
    - format rule
    - business rule
---

Generate AEM Forms business rules from a form definition (JCR or Sites Content API), a natural language prompt, and an optional custom functions JS file. Produces `{ fd:rules, fd:events }` ready for insertion into the rule store.

> **Script path:** All scripts are in `$SKILL_DIR/scripts/`. Run with `node $SKILL_DIR/scripts/<name>.jsh` (Node.js) or `<name>` (SLICC jsh — auto-discovered as commands). No `npm install` required.
> **Script invocation:** `references/tools-reference.md` is the authoritative reference for every script — args, output format, and exit codes. Consult it before running any script. Do not guess invocation from inline examples.

## Inputs

1. **Form definition** — one of:
   - **JCR form JSON** — raw AEM export (top-level node with `fieldType`, `fd:rules`, etc.)
   - **Content model** — Sites Content API response from `get-aem-page-content` (has numeric-keyed `items`, `properties.*` metadata)
2. **Prompt** — natural language description of the rule to create
3. **Custom functions JS** (optional) — file with `@name`-annotated function JSDoc

## Workflow

### Step 1: Determine STATEMENT type from prompt

Map the prompt intent to a STATEMENT type:

| Prompt intent | STATEMENT type | fd:* key |
|--------------|----------------|----------|
| When [event], then [action] | EVENT_SCRIPTS | `fd:click`, `fd:valueCommit`, `fd:init` |
| Calculate / set value of X using formula | CALC_EXPRESSION | `fd:calc` |
| Clear value of X | CLEAR_EXPRESSION | `fd:calc` |
| Validate X | VALIDATE_EXPRESSION | `fd:validate` |
| Format display of X | FORMAT_EXPRESSION | `fd:format` |
| Show X when [condition] | SHOW_EXPRESSION | `fd:visible` |
| Hide X when [condition] | VISIBLE_EXPRESSION | `fd:visible` |
| Enable X when [condition] | ACCESS_EXPRESSION | `fd:enabled` |
| Disable X when [condition] | DISABLE_EXPRESSION | `fd:enabled` |

### Step 2: Load grammar files (see matrix below)

### Step 3: Load agent-kb articles (see matrix below)

### Step 4: Build treeJson from form definition

Write the form definition to a temp file first, then run the appropriate script.

**JCR input:**
```bash
node $SKILL_DIR/scripts/transform-jcr.jsh <jcr.json> --output /tmp/treeJson.json
# Output: { success: true, treeJson: {...}, outputPath: "/tmp/treeJson.json" }
```

**Content model input:**
```bash
# Write content model to /tmp first using Bash heredoc (Write tool cannot write outside the project directory):
# cat > /tmp/content-model.json << 'HEREDOC'
# <CONTENT_MODEL JSON>
# HEREDOC
node $SKILL_DIR/scripts/transform-content-model.jsh \
  --content-model-file /tmp/content-model.json \
  --output /tmp/treeJson.json
# Output: { success: true, treeJson: {...}, outputPath: "/tmp/treeJson.json" }
```

### Step 5: Run `parse-functions` (skip if no functions file)

```bash
node $SKILL_DIR/scripts/parse-functions.jsh <functions.js>
# Output: { success: true, customFunction: [...], imports: [...] }
```

Save `customFunction[]` to `/tmp/customFunctions.json` for subsequent tool calls.

Each entry in `customFunction[]` contains the function's full parsed metadata. When building a `FUNCTION_CALL` node, copy only the `id` and `name` subset into its `functionName` object — the scope carries the full function definition:

```json
{
  "id": "fetchPanFromAadhaar",
  "name": "fetchPanFromAadhaar"
}
```

**Critical:** The parser strips the trailing `globals`/`SCOPE` param from `args` and `impl`. Never re-add it. Build the `params` array from `args` only — one `EXPRESSION` per entry, respecting `isMandatory`.

### Step 6: Resolve component IDs

Extract all field names referenced in the rule intent and look them up in treeJson:

```bash
node $SKILL_DIR/scripts/find-field.jsh \
  --tree /tmp/treeJson.json \
  --names "phone,country"
# Output: [{ name, found, qualifiedId, type, displayName, fieldType, isPanel }, ...]
# Exit 0 = all found, 1 = one or more not found
```

Use `qualifiedId` as the COMPONENT node `id` in the rule AST. Use `type` for scope validation.
If any field returns `found: false`: stop and ask the user to confirm the field name.

### Step 7: Write custom function if required

- Load `references/agent-kb/12-custom-functions-authoring.md` + `references/agent-kb/13-custom-function-helper-apis.md`
- Write the function following the JSDoc pattern defined there
- Re-run `parse-functions` on the updated file
- Re-save `/tmp/customFunctions.json`

### Step 8: Generate rule AST JSON

Using the grammar file(s) for the STATEMENT type, construct the rule AST. All COMPONENT nodes must be resolved from treeJson — never hand-constructed.

### Step 9: Validate — loop until `valid: true`

```bash
node $SKILL_DIR/scripts/validate-rule.jsh \
  /tmp/rule.json \
  --tree /tmp/treeJson.json \
  --functions /tmp/customFunctions.json \
  --storage-path <fd:key>
# Output: { valid: true, errors: [], warnings: [] }
# Exit code 0 = valid, 1 = invalid
```

Fix any errors using the `code` field and the grammar files, then re-validate.

### Step 10: Generate formula

If the target field already exists (`find-field` returned `found: true`), pass `--content-model-file` and `--field-pointer` so existing rules for the same `fd:*` key are prepended and compiled together. Omit both flags for new fields.

```bash
# Existing field, adding a new rule alongside existing ones (fd:visible, fd:enabled, fd:validate only)
node $SKILL_DIR/scripts/generate-formula.jsh \
  /tmp/rule.json \
  --tree /tmp/treeJson.json \
  --functions /tmp/customFunctions.json \
  --event <fd:key> \
  --content-model-file /tmp/content-model.json \
  --field-pointer <field-pointer>

# Existing field, replacing/updating an existing rule (user intent: change, not add)
node $SKILL_DIR/scripts/generate-formula.jsh \
  /tmp/rule.json \
  --tree /tmp/treeJson.json \
  --functions /tmp/customFunctions.json \
  --event <fd:key> \
  --content-model-file /tmp/content-model.json \
  --field-pointer <field-pointer> \
  --override

# New field — no prior rules, start fresh
node $SKILL_DIR/scripts/generate-formula.jsh \
  /tmp/rule.json \
  --tree /tmp/treeJson.json \
  --functions /tmp/customFunctions.json \
  --event <fd:key>
# Output: { success: true, input: {...}, fdEvents: {...}, fdRules: {...}, formulaValid: true, validationStatus: "valid" }
```

### Step 11: Merge input and output

Only proceed when BOTH `valid: true` (Step 9) AND `formulaValid: true` (Step 10).

Save the `generate-formula` output to a file, then run `merge-formula` to produce the final `{ fd:rules, fd:events }` deterministically:

```bash
# cat > /tmp/formula-output.json << 'HEREDOC'
# <generate-formula JSON output>
# HEREDOC
node $SKILL_DIR/scripts/merge-formula.jsh /tmp/formula-output.json
# Output: { "fd:rules": {...}, "fd:events": {...}, validationExpression?: "...", displayValueExpression?: "..." }
# Exit 0 = success, 1 = error
```

### Step 12: Output

**This skill generates rules only — it does NOT apply them.** Return the `merge-formula` output to `forms-author`, which applies it via `references/apply-rule-workflow.md` → `apply-rule-patch.bundle.js` → `patch-aem-page-content`. Do NOT PATCH `fd:rules` or `fd:events` directly from this skill.

Return the `merge-formula` output directly:
```json
{
  "fd:rules": {
    "fd:visible": ["<stringified rule JSON>"],
    "visible": "<compiled formula>",
    "validationStatus": "valid"
  },
  "fd:events": {}
}
```

For validate rules (`fd:validate`), `validationExpression` is emitted at the top level (alongside `fd:rules`/`fd:events`), not inside `fd:rules`. Similarly, `displayValueExpression` for format rules (`fd:format`) is top-level.

For event rules (`fd:click`, `fd:init`, etc.), `fd:rules` has only the raw AST entry and `fd:events` has the compiled scripts.

#### Multi-field output

When the prompt requires rules for multiple independent fields (e.g. cascading dropdowns where both `country` and `region` each need their own `fd:valueCommit` rule), run the full workflow (Steps 8–11) once per field. Return an array where each entry binds the merged result to its target field:

```json
[
  {
    "qualifiedId": "$form.country",
    "fd:rules": { "fd:valueCommit": ["..."], "validationStatus": "valid" },
    "fd:events": { "change": ["..."] }
  },
  {
    "qualifiedId": "$form.panel.region",
    "fd:rules": { "fd:valueCommit": ["..."], "validationStatus": "valid" },
    "fd:events": { "change": ["..."] }
  }
]
```

Use `qualifiedId` (the `$form.*` path from `find-field.jsh`) as the field binding — it is always unique even when multiple panels contain fields with the same name. The orchestrator applies the rules in order, one field at a time.

---

## Grammar + Agent KB Loading Matrix

| STATEMENT type | Load grammar files | Load agent-kb articles |
|----------------|--------------------|------------------------|
| EVENT_SCRIPTS (no condition) | `references/grammar/event-scripts.md`, `references/grammar/block-statements.md`, `references/component-lookup.md` | `05` always; `08` if OOTB FUNCTION_CALL; `12`+`13` if custom function |
| EVENT_SCRIPTS (with condition) | + `references/grammar/conditions.md` | + `06`/`09` for property access in condition |
| CALC_EXPRESSION / CLEAR_EXPRESSION | `references/grammar/calc-expression.md`, `references/component-lookup.md` | `07`; `08` if OOTB function |
| VALIDATE_EXPRESSION | `references/grammar/validate-expression.md`, `references/grammar/conditions.md`, `references/component-lookup.md` | `06`, `09` |
| FORMAT_EXPRESSION | `references/grammar/format-expression.md`, `references/component-lookup.md` | `07` |
| SHOW_EXPRESSION / VISIBLE_EXPRESSION | `references/grammar/visibility-expressions.md`, `references/grammar/conditions.md`, `references/component-lookup.md` | `05` always; `06` for property conditions |
| ACCESS_EXPRESSION / DISABLE_EXPRESSION | `references/grammar/enabled-expressions.md`, `references/grammar/conditions.md`, `references/component-lookup.md` | `05` always; `06` for property conditions |
| Custom function needed (write or call) | (any above) + Step 5 (`parse-functions`) | `12`, `13` |
| Always | — | `05` |

**Rule:** Load the minimum set. Do NOT load all grammar files for every request.

---

## Constraints

- No mandatory Function Rule pattern — BLOCK_STATEMENTs used directly in EVENT_SCRIPTS
- COMPONENT nodes always resolved from treeJson — never hand-constructed
- Event names always confirmed against `references/agent-kb/05-rule-events-by-scenario.md` — no guessing
- `validate-rule` must exit 0 before `generate-formula` runs
- `generate-formula` must return `formulaValid: true` before `merge-formula` runs
- Output is `{ fd:rules, fd:events }` for a single-field request, or an array of `{ qualifiedId, fd:rules, fd:events }` for multi-field requests — no file writes
- **FUNCTION_CALL**: use only `{ id, name }` from `customFunction[]` as `functionName`; build `params` from `args` only (globals already stripped); `params` must be a positional prefix of `args` — first N args in order; only trailing optional args may be omitted; `params` length must be ≥ mandatory-arg count and ≤ total-arg count
