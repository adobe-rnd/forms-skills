## Task: Merge Plan for Content Authoring Skills into Forms Skills

## Folder/Directories
1. **content-authoring-skills** (source, to be merged in): `~/Documents/aem/codes/adobe-aem-forms/content-authoring-skill/`
2. **forms-skills** (target, current repo): `~/Documents/aem/codes/adobe-rnd/forms-skills/`

---

## Rename / Replace Mapping

| Current (forms-skills) | Action | New Name | Source |
|---|---|---|---|
| `forms-build` | Rename + restructure | `forms-content-author` | router from content-authoring-skills root `SKILL.md` |
| `forms-logic` | Drop entirely, replace | `forms-rule-creator` | content-authoring-skills `forms-rule-creator/` (full copy) |
| `forms-infra/references/sync-forms` | Drop, replace | `forms-infra/references/forms-content-update` | content-authoring-skills `forms-content-update/` |
| `forms-context` | Rename + refocus | `forms-context-management` | keep existing, refocus on agentic context |

---

## Current State Inventory

### forms-skills (target repo)

```
skills/
├── forms-analysis/
│   └── references/
│       ├── analyze-requirements/
│       ├── analyze-v1-form/
│       ├── create-screen-doc/
│       ├── jud-to-screen/
│       └── review-screen-doc/
├── forms-build/                    ← rename to forms-content-author
│   └── references/
│       ├── create-component/       ← rename to forms-custom-components
│       ├── create-form/            ← DROP
│       └── scaffold-form/          ← DROP
├── forms-context/                  ← rename to forms-context-management
│   └── references/
│       └── manage-context/
├── forms-infra/
│   ├── references/
│   │   ├── git-sandbox/
│   │   ├── setup-workspace/
│   │   ├── sync-eds-code/
│   │   └── sync-forms/             ← DROP, replaced by forms-content-update
│   └── scripts/
│       ├── eds-code-sync
│       ├── form-sync               ← DROP (with sync-forms)
│       └── git-sandbox
├── forms-integration/
│   └── references/
│       └── manage-apis/
├── forms-logic/                    ← DROP entirely
│   ├── references/
│   │   ├── add-rules/
│   │   ├── optimize-rules/
│   │   └── create-function/
│   └── scripts/
│       ├── parse-functions
│       ├── rule-grammar
│       ├── rule-save
│       ├── rule-validate
│       ├── rule-transform
│       └── rule_coder/__init__.py
├── forms-orchestrator/
│   ├── assets/
│   │   ├── error-handling.md
│   │   ├── guidelines.md
│   │   └── routing-table.md        ← UPDATE for new skill names
│   └── references/
│       ├── domain-registry/
│       └── planner/
└── forms-shared/
    └── scripts/
        ├── _resolve-workspace
        ├── api-manager
        ├── python3
        ├── setup.sh
        └── api_manager/
```

### content-authoring-skills (source repo)

```
content-authoring-skill/
├── SKILL.md                        ← root router → becomes forms-content-author SKILL.md
├── README.md                       ← documents sub-skill architecture + MCP setup
├── forms-rule-creator/             ← full copy into skills/forms-rule-creator/
│   ├── SKILL.md
│   ├── build.mjs                   ← builds all 7 bundles (4 rule-creator + 3 content-update)
│   ├── grammar/                    ← 8 rule grammar .md files
│   ├── agent-kb/                   ← 8 rule KB .md files
│   ├── references/
│   │   ├── component-lookup.md
│   │   └── tools-reference.md
│   └── scripts/
│       ├── src/                    ← TypeScript source
│       └── *.bundle.js             ← content-model-to-tree, generate-formula,
│                                      parse-functions, validate-merge, validate-rule
├── forms-content-generate/         ← copy into skills/forms-content-author/references/
│   ├── SKILL.md
│   ├── references/
│   │   ├── field-quirks.md
│   │   └── field-types.md
│   └── scripts/
│       └── *.bundle.js             ← check-name-collision, filter-definition,
│                                      get-component-def, resolve-component-type, validate-add
├── forms-content-update/           ← copy into skills/forms-infra/references/
│   ├── SKILL.md
│   ├── references/
│   │   ├── apply-rule-workflow.md
│   │   └── scripts.md
│   └── scripts/
│       ├── src/                    ← TypeScript source (built by forms-rule-creator/build.mjs)
│       └── *.bundle.js             ← apply-rule-patch, find-field, find-rule-refs,
│                                      list-form-fields, resolve-insert-position,
│                                      rewrite-rule-refs, validate-patch
├── lib/
│   └── content-model-walk.js       ← inlined by esbuild into bundles, not a runtime file
├── evals/                          ← KEEP structure as-is, copy to repo root
│   ├── package.json
│   ├── scripts/
│   │   ├── run-evals.js
│   │   └── run-llm-evals.js
│   ├── scenarios/                  ← 18 scenario directories
│   └── fixtures/                   ← 22 AEM content model fixtures
└── tmp/
    └── aem-sites-contentapi-mcp-server/   ← see MCP Server section below
```

---

## Final Target Structure (forms-skills after merge)

```
/
├── evals/                          ← copied from content-authoring-skills evals/ (same structure)
│   ├── package.json
│   ├── scripts/
│   ├── scenarios/
│   └── fixtures/
│
└── skills/
    ├── forms-orchestrator/         ← pure router, NO implementation logic
    │   ├── assets/
    │   │   ├── routing-table.md    ← UPDATE for new skill names
    │   │   ├── guidelines.md
    │   │   └── error-handling.md
    │   └── references/
    │       ├── domain-registry/
    │       └── planner/
    │
    ├── forms-analysis/             ← no change
    │
    ├── forms-content-author/       ← renamed from forms-build
    │   ├── SKILL.md                ← from content-authoring-skills root SKILL.md
    │   └── references/
    │       ├── forms-content-generate/   ← from content-authoring-skills (with scripts/)
    │       └── forms-custom-components/  ← renamed from create-component
    │
    ├── forms-integration/          ← update SKILL.md triggers for new skill names only
    │   └── references/
    │       └── manage-apis/
    │
    ├── forms-rule-creator/         ← full copy from content-authoring-skills, replaces forms-logic
    │   ├── SKILL.md
    │   ├── build.mjs
    │   ├── grammar/
    │   ├── agent-kb/
    │   ├── references/
    │   └── scripts/
    │
    ├── forms-context-management/   ← renamed from forms-context
    │   └── references/
    │       └── manage-context/     ← update: agentic context, session state, reports
    │
    ├── forms-shared/               ← no structural change
    │   └── scripts/
    │
    └── forms-infra/
        ├── references/
        │   ├── git-sandbox/
        │   ├── setup-workspace/    ← update: add MCP server setup instructions
        │   ├── sync-eds-code/
        │   └── forms-content-update/   ← from content-authoring-skills (with scripts/)
        └── scripts/
            ├── eds-code-sync
            └── git-sandbox
```

---

## MCP Server

The `forms-content-update` skill talks to AEM through the **Sites Content MCP server**. The server is not vendored — setup instructions live in `forms-infra/references/setup-workspace/SKILL.md`, mirroring the setup section from content-authoring-skills README exactly.

Both options must be documented and available to the user:

**Default — AEM as a Cloud Service (HTTP transport):**
```bash
claude mcp add --transport http aem-sites-content \
  https://mcp.adobeaemcloud.com/adobe/mcp/content
# Auth: IMS OAuth (browser login opens automatically)
```

**Alternative — Local AEM (SDK / Quickstart):**
```bash
claude mcp add aem-sites-content -- node /tmp/aem-sites-contentapi-mcp-server/build/index.js
# Env vars for the MCP server process:
#   AEM_AUTHOR_URL=http://localhost:4502
#   AEM_AUTHOR_AUTH_PARAMETER=admin:admin
#   ASSETS_ACCESS_TOKEN=dummy
```

For local setup the user also needs to:
1. Build and place `aem-sites-contentapi-mcp-server` at `/tmp/` (source: `content-authoring-skills/tmp/`)
2. Install `core-forms-components-examples-all-3.0.150.zip` via CRX Package Manager
3. Install `default-site.zip` via CRX Package Manager (provides `/content/forms/af/default-site/blank-form` as the `create-form` template source)

Restart Claude Code after adding the MCP server in either setup.

---

## Migration Steps ✅ COMPLETE

### Step 1 — forms-content-author (rename forms-build) ✅
- [x] Renamed `skills/forms-build/` → `skills/forms-content-author/`
- [x] Replaced root `SKILL.md` with router from content-authoring-skills root `SKILL.md`
- [x] Copied `forms-content-generate/` as direct subdir (not in references/) — preserves `$SKILL_DIR` paths
- [x] Copied `forms-content-update/` as direct subdir (not in forms-infra) — **see architectural note**
- [x] Renamed `references/create-component/` → `references/forms-custom-components/`
- [x] Deleted `references/create-form/` and `references/scaffold-form/`

> **Architectural note:** `forms-content-update` was placed as a direct subdirectory of `forms-content-author/` rather than `forms-infra/references/`. The SKILL.md uses `$SKILL_DIR/forms-content-update/scripts/...` where `$SKILL_DIR` = the directory of the invoked SKILL.md. Moving it to a separate skill directory would break all script path references. It remains architecturally co-located with the orchestrator as designed in content-authoring-skills.

### Step 2 — forms-rule-creator (replace forms-logic) ✅
- [x] Deleted `skills/forms-logic/` entirely
- [x] Copied `forms-rule-creator/` from content-authoring-skills to `skills/forms-rule-creator/` (full copy, no node_modules)

### Step 3 — forms-infra update ✅
- [x] Deleted `skills/forms-infra/references/sync-forms/`
- [x] Deleted `skills/forms-infra/scripts/form-sync`
- [x] Updated `setup-workspace` SKILL.md: added Sites Content MCP setup section (Cloud Service default + Local AEM alternative)
- [x] Updated `forms-infra/SKILL.md`: removed sync-forms from routing/skills/locations tables, updated triggers and description

### Step 4 — forms-context-management (rename forms-context) ✅
- [x] Renamed `skills/forms-context/` → `skills/forms-context-management/`
- [x] Updated `SKILL.md`: name, description, triggers, heading, ID updated
- [x] Updated `manage-context` SKILL.md: agentic context focus, progress report section, new triggers added

### Step 5 — forms-orchestrator routing table update ✅
- [x] Updated `assets/routing-table.md`: domain name references, stale form-sync deploy section replaced with MCP note
- [x] Updated `references/domain-registry/SKILL.md`: domain IDs and paths updated for all three renames
- [x] Updated `assets/guidelines.md`: script paths, script table, config file references updated

### Step 6 — forms-integration ✅
- [x] Updated `SKILL.md` dependencies: `logic` → `rule-creator`
- [x] Updated `manage-apis/SKILL.md`: `create-function` reference → `forms-rule-creator`

### Step 7 — Evals ✅
- [x] Copied `evals/` from content-authoring-skills to repo root (package.json, scripts/, scenarios/ with 18 dirs, fixtures/ with 22 files)

### Step 8 — lib/ ✅
- [x] No action needed — `lib/content-model-walk.js` is inlined by esbuild at build time
