# Delete Field Workflow

1. Fetch `get-aem-page-content` + `get-aem-page-content-definition` in parallel
2. Save content model to `/tmp/content-model.json` using Bash — the Write tool requires a prior Read and fails on new `/tmp` paths:

   ```bash
   cat > /tmp/content-model.json << 'HEREDOC'
   <CONTENT_MODEL JSON>
   HEREDOC
   ```

3. Run `find-field` → pointer, isPanel, qualifiedId

```bash
node $SKILL_DIR/scripts/find-field.bundle.js \
  --content-model-file /tmp/content-model.json --name '<fieldName>'
```

4. Run `find-rule-refs` — if total > 0, warn: *"N rule(s) on [fieldNames] reference this field. Proceed?"* Wait for confirmation.

```bash
node $SKILL_DIR/scripts/find-rule-refs.bundle.js \
  --content-model-file /tmp/content-model.json --qualified-id '<qualifiedId>'
```

5. If `isPanel` — warn: *"Removing this panel removes ALL its children. Confirm?"* Wait for confirmation.
6. Run `validate-patch` with `[{ op: "remove", path: "<pointer>" }]`
7. Call `patch-aem-page-content`
8. Call `get-aem-page-content` → confirm field gone. Save response to `/tmp/content-model.json` (overwrites stale copy — keeps content model current for subsequent rule generation).
