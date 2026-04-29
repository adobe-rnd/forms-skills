# forms-rule-creator

Creates and manages rules and events on AEM Adaptive Form fields via the Sites Content MCP API.

---

## Scripts

All bundles are pre-built in `scripts/` — no `npm install` required at runtime.

| Bundle | Purpose | Exit codes |
|---|---|---|
| `content-model-to-tree.bundle.js` | Content model → treeJson (input for rule engine) | 0=success, 1=error, 2=bad args |
| `validate-rule.bundle.js` | Validate rule AST / expression syntax | 0=valid, 1=invalid, 2=bad args |
| `generate-formula.bundle.js` | Compile rule AST → JSON Formula expression | 0=success, 1=error, 2=bad args |
| `parse-functions.bundle.js` | Parse custom function definitions | 0=success, 1=error, 2=bad args |
| `validate-merge.bundle.js` | Validate merged rule patch before applying | 0=valid, 1=invalid, 2=bad args |

> **Note:** `parse-functions.bundle.js` requires `scripts/vendor/custom-function-parser.js` to be present at runtime. All other bundles are self-contained.

---

## Building

Run after updating `@aemforms/rule-editor-transformer`:

```bash
cd forms-rule-creator
npm install
npm run build   # writes 5 bundles to scripts/, 3 bundles to ../forms-content-update/scripts/
```

Commit all updated `.bundle.js` files and `scripts/vendor/` files.

---

## Files

```
SKILL.md                                    Claude Code skill definition
scripts/
  content-model-to-tree.bundle.js           Content model → treeJson
  validate-rule.bundle.js                   Rule AST validator
  generate-formula.bundle.js               Rule AST → JSON Formula compiler
  parse-functions.bundle.js                 Custom function parser
  validate-merge.bundle.js                  Merged rule patch validator
  vendor/
    custom-function-parser.js               Required by parse-functions.bundle.js
agent-kb/                                   Rule authoring reference docs
grammar/                                    Grammar reference docs
reference/
  component-lookup.md                       How to resolve components from treeJson
  tools-reference.md                        CLI tool reference
```
