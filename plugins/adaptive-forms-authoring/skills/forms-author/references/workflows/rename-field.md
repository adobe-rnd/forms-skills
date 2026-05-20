# Rename Field Workflow

Renaming changes `qualifiedId` — rules referencing the old id break. This workflow migrates them.

1. Fetch `get-aem-page-content` + `get-aem-page-content-definition` in parallel
2. Save to temp files using Bash — the Write tool requires a prior Read and fails on new `/tmp` paths:

   ```bash
   cat > /tmp/pre-model.json << 'HEREDOC'
   <CONTENT_MODEL JSON>
   HEREDOC
   cat > /tmp/definition.json << 'HEREDOC'
   <DEFINITION JSON>
   HEREDOC
   ```
3. Run `find-field` → existing component + oldQualifiedId

```bash
node $SKILL_DIR/scripts/find-field.bundle.js \
  --content-model-file /tmp/pre-model.json --name '<oldName>'
```

4. Emit COMPONENT HANDOFF (update, intent: `"rename to <newName>"`) — see `references/component-handoff.md`
5. Receive updated component. Run `diff-component` → replace op for `name`.

```bash
node $SKILL_DIR/scripts/diff-component.bundle.js \
  --old '<existingComponentJson>' --new '<updatedComponentJson>'
```

6. Run `find-rule-refs(oldQualifiedId)` — if total > 0: warn *"N rule(s) will be migrated after rename."* Wait for confirmation.
7. Run `validate-patch`. Call `patch-aem-page-content` (rename op only).
8. Call `get-aem-page-content` → POST-PATCH model. Save to `/tmp/post-model.json` using Bash:

   ```bash
   cat > /tmp/post-model.json << 'HEREDOC'
   <POST-PATCH CONTENT MODEL JSON>
   HEREDOC
   ```
9. Run rule migration:

```bash
node $SKILL_DIR/../forms-rule-author/scripts/transform-content-model.jsh \
  --content-model-file /tmp/post-model.json
# Writes /tmp/treeJson.json

node $SKILL_DIR/scripts/find-field.bundle.js \
  --content-model-file /tmp/post-model.json --name '<newName>'
# → newQualifiedId

node $SKILL_DIR/scripts/rewrite-rule-refs.bundle.js \
  --content-model-file /tmp/post-model.json \
  --old-id '<oldQualifiedId>' --new-id '<newQualifiedId>'
# → [{ fieldName, capiKey, pointer, fdKey, rewrittenAst }]
```

10. For each rewritten AST — validate and generate formula:

```bash
node $SKILL_DIR/../forms-rule-author/scripts/validate-rule.jsh \
  /tmp/rewritten-rule.json --tree /tmp/treeJson.json --storage-path <fdKey>
# Must return { valid: true }

node $SKILL_DIR/../forms-rule-author/scripts/generate-formula.jsh \
  /tmp/rewritten-rule.json --tree /tmp/treeJson.json --event <fdKey>
# Must return { formulaValid: true }
```

11. Run `apply-rule-patch` for each validated AST. Call `patch-aem-page-content`.
