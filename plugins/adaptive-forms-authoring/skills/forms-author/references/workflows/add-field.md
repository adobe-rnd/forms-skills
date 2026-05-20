# Add Field(s) Workflow

1. Fetch `get-aem-page-content` + `get-aem-page-content-definition` in parallel → CONTENT_MODEL + eTag, DEFINITION
2. Save CONTENT_MODEL to `/tmp/content-model.json` and DEFINITION to `/tmp/definition.json` using Bash — the Write tool requires a prior Read and fails on new `/tmp` paths (see `references/component-handoff.md` for the heredoc pattern).
3. Emit COMPONENT HANDOFF (build) — see `references/component-handoff.md`
4. Receive validated component array from `forms-content-modeler`
5. Run `find-field` to locate target panel → capiKey. If panel not found, add it first (re-fetch, re-run).
6. Run `resolve-insert-position` → insert pointer
7. Build `add` ops from component array + pointer. Run `validate-patch`.
8. Call `patch-aem-page-content` — ALL ops in one call (no separate call per field)
9. Call `get-aem-page-content` → confirm fields present

```bash
node $SKILL_DIR/scripts/find-field.bundle.js \
  --content-model-file /tmp/content-model.json --name '<panelName>'

node $SKILL_DIR/scripts/resolve-insert-position.bundle.js \
  --content-model "$(cat /tmp/content-model.json)" --panel-capi-key '<capiKey>'

node $SKILL_DIR/scripts/validate-patch.bundle.js \
  --content-model "$(cat /tmp/content-model.json)" \
  --definition "$(cat /tmp/definition.json)" \
  --ops '<ops json>'
```

## Nested panel + children in a single patch call

When the operation adds panels **and** fields inside them, use the COMPONENT HANDOFF `parent:` field (see `references/component-handoff.md`) so `forms-content-modeler` returns a nested component array, then run `build-insert-ops` to produce the full ops array deterministically:

```bash
# Save the nested component array from forms-content-modeler to a file:
cat > /tmp/components.json << 'HEREDOC'
<NESTED COMPONENT ARRAY>
HEREDOC

# Run build-insert-ops and extract only the ops array into /tmp/insert-ops.json:
node $SKILL_DIR/scripts/build-insert-ops.bundle.js \
  --content-model-file /tmp/content-model.json \
  --components-file /tmp/components.json \
  --panel-capi-key '<capiKey of target panel>' | \
node -e "const r=JSON.parse(require('fs').readFileSync(0,'utf8')); \
  if(!r.success)throw new Error(r.error); \
  process.stdout.write(JSON.stringify(r.ops))" \
  > /tmp/insert-ops.json
# /tmp/insert-ops.json now contains the raw ops array
```

The script handles insert-before-submit positioning and all child path derivation automatically. Skip step 6 (`resolve-insert-position`) and the manual op construction in step 7 — but still run `validate-patch` on the output ops to catch name collisions with existing fields:

```bash
node $SKILL_DIR/scripts/validate-patch.bundle.js \
  --content-model "$(cat /tmp/content-model.json)" \
  --definition "$(cat /tmp/definition.json)" \
  --ops "$(cat /tmp/insert-ops.json)"
```

Then pass the ops to `patch-aem-page-content`.

## Defaults when user does not specify

- `name`: snake_case from field label (e.g. "Email Address" → `email_address`)
- `jcr:title`: Title Case from field label
- Position: end of first panel (before submit button if present)

