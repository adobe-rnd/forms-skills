# Edit Field Property Workflow

1. Fetch `get-aem-page-content` + `get-aem-page-content-definition` in parallel
2. Save content model to `/tmp/content-model.json` and definition to `/tmp/definition.json` using Bash — the Write tool requires a prior Read and fails on new `/tmp` paths (see `references/component-handoff.md` for the heredoc pattern).
3. Run `find-field` → existing component object + pointer

```bash
node $SKILL_DIR/scripts/find-field.bundle.js \
  --content-model-file /tmp/content-model.json --name '<fieldName>'
```

4. Emit COMPONENT HANDOFF (update) with existing component + edit intent — see `references/component-handoff.md`
5. Receive updated component from `forms-content-modeler`
6. Run `diff-component` → replace (and add/remove) ops

```bash
node $SKILL_DIR/scripts/diff-component.bundle.js \
  --old '<existingComponentJson>' --new '<updatedComponentJson>'
```

7. Run `validate-patch`. Call `patch-aem-page-content`.
8. Call `get-aem-page-content` → confirm new value

## Intent disambiguation

| User says | Handle as |
|---|---|
| "make X required" (no condition) | Edit property: `required: true` |
| "make X required when Y is filled" | Rule workflow: VALIDATE_EXPRESSION → `fd:validate` |
| "always show tooltip" | Edit property: tooltip visibility flag |
