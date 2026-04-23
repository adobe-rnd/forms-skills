# Repo Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all `forms-*` modules under `skills/`, add `workspace.yaml`, update `.claude-plugin/plugin.json`, fix all cross-module script paths, and convert 9 routing SKILL.md files to read-only references.

**Architecture:** All 8 `forms-*` directories move to `skills/forms-*/` via `git mv` to preserve history. A new `workspace.yaml` manifest replaces the plugin.json skill enumeration (plugin.json is kept but updated). Path references in scripts, SKILL.md files, and config files are updated to reflect the new `skills/` prefix.

**Tech Stack:** bash (`git mv`), YAML, JSON, Markdown

---

## File Map

| File | Change |
|------|--------|
| `skills/` | Created by first `git mv` |
| `workspace.yaml` | New file at repo root |
| `.claude-plugin/plugin.json` | Paths updated, reduced to 18 skills |
| `package.json` | `validate` script path updated |
| `pyproject.toml` | 7 `where` paths get `skills/` prefix |
| `skills/forms-shared/scripts/python3` | `PROJECT_ROOT` depth + PYTHONPATH `skills/` prefix |
| `skills/forms-shared/scripts/setup.sh` | `PROJECT_ROOT` depth + BRIDGE_DIR `skills/` prefix |
| `skills/forms-orchestrator/SKILL.md` | Domain registry → Read not invoke |
| `skills/forms-orchestrator/assets/routing-table.md` | Step 1.5 script path + Step 5 Read + Plan Execution Flow |
| `skills/forms-orchestrator/assets/guidelines.md` | All `${CLAUDE_PLUGIN_ROOT}/forms-*` → `skills/forms-*` |
| `skills/forms-infra/references/setup-workspace/SKILL.md` | `CLAUDE_PLUGIN_ROOT` paths + `skills/` prefix |
| `skills/forms-infra/references/sync-eds-code/SKILL.md` | `CLAUDE_PLUGIN_ROOT` paths + `skills/` prefix |
| `skills/forms-logic/references/add-rules/SKILL.md` | `CLAUDE_PLUGIN_ROOT` paths + `skills/` prefix |

---

### Task 1: Move all `forms-*` modules under `skills/`

**Files:**
- Move: all 8 `forms-*` dirs → `skills/forms-*/`

- [ ] **Step 1: Run git mv for all 8 modules**

```bash
mkdir -p skills
git mv forms-analysis skills/forms-analysis
git mv forms-build skills/forms-build
git mv forms-context skills/forms-context
git mv forms-infra skills/forms-infra
git mv forms-integration skills/forms-integration
git mv forms-logic skills/forms-logic
git mv forms-orchestrator skills/forms-orchestrator
git mv forms-shared skills/forms-shared
```

- [ ] **Step 2: Verify the moves**

```bash
ls skills/
```
Expected output:
```
forms-analysis  forms-build  forms-context  forms-infra  forms-integration  forms-logic  forms-orchestrator  forms-shared
```

- [ ] **Step 3: Verify internal structure is intact on one module**

```bash
find skills/forms-orchestrator -maxdepth 2 -not -path '*/.git/*' | sort | head -20
```
Expected: same structure as before — `SKILL.md`, `DEPS.yaml`, `assets/`, `references/`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move forms-* modules under skills/"
```

---

### Task 2: Move `.envrc.example` into `skills/forms-infra/`

**Files:**
- Move: `.envrc.example` → `skills/forms-infra/.envrc.example`

- [ ] **Step 1: Move the file**

```bash
git mv .envrc.example skills/forms-infra/.envrc.example
```

- [ ] **Step 2: Verify**

```bash
ls skills/forms-infra/.envrc.example
```

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: move .envrc.example into skills/forms-infra/"
```

---

### Task 3: Create `workspace.yaml`

**Files:**
- Create: `workspace.yaml`

- [ ] **Step 1: Create the file**

Create `workspace.yaml` at the repo root with this exact content:

```yaml
skillpack: "1.0"
name: forms-skills

skills:
  - skills/forms-orchestrator
  - skills/forms-orchestrator/references/planner
  - skills/forms-analysis/references/analyze-requirements
  - skills/forms-analysis/references/analyze-v1-form
  - skills/forms-analysis/references/create-screen-doc
  - skills/forms-analysis/references/jud-to-screen
  - skills/forms-build/references/scaffold-form
  - skills/forms-build/references/create-form
  - skills/forms-build/references/create-component
  - skills/forms-logic/references/add-rules
  - skills/forms-logic/references/create-function
  - skills/forms-logic/references/optimize-rules
  - skills/forms-infra/references/setup-workspace
  - skills/forms-infra/references/sync-forms
  - skills/forms-infra/references/sync-eds-code
  - skills/forms-infra/references/git-sandbox
  - skills/forms-integration/references/manage-apis
  - skills/forms-context/references/manage-context
```

- [ ] **Step 2: Verify count**

```bash
grep "  - " workspace.yaml | wc -l
```
Expected: `18`

- [ ] **Step 3: Commit**

```bash
git add workspace.yaml
git commit -m "feat: add workspace.yaml skillpack manifest"
```

---

### Task 4: Update `.claude-plugin/plugin.json`

**Files:**
- Modify: `.claude-plugin/plugin.json`

The plugin.json must mirror `workspace.yaml` exactly — same 18 skills, same `skills/` prefix. The 9 reference files (domain routers + forms-shared + review-screen-doc) are excluded.

- [ ] **Step 1: Replace plugin.json content**

Replace the entire `skills` array in `.claude-plugin/plugin.json` with:

```json
{
  "name": "aem-forms",
  "version": "0.1.0",
  "description": "Skills for building AEM Adaptive Forms through AI conversation — create, validate, and deploy forms via natural language",
  "author": {
    "name": "Adobe"
  },
  "repository": "https://github.com/adobe/skills",
  "license": "Apache-2.0",
  "skills": [
    "./skills/forms-orchestrator",
    "./skills/forms-orchestrator/references/planner",
    "./skills/forms-analysis/references/analyze-requirements",
    "./skills/forms-analysis/references/analyze-v1-form",
    "./skills/forms-analysis/references/create-screen-doc",
    "./skills/forms-analysis/references/jud-to-screen",
    "./skills/forms-build/references/scaffold-form",
    "./skills/forms-build/references/create-form",
    "./skills/forms-build/references/create-component",
    "./skills/forms-logic/references/add-rules",
    "./skills/forms-logic/references/create-function",
    "./skills/forms-logic/references/optimize-rules",
    "./skills/forms-infra/references/setup-workspace",
    "./skills/forms-infra/references/sync-forms",
    "./skills/forms-infra/references/sync-eds-code",
    "./skills/forms-infra/references/git-sandbox",
    "./skills/forms-integration/references/manage-apis",
    "./skills/forms-context/references/manage-context"
  ],
  "keywords": [
    "adobe",
    "aem",
    "forms",
    "adaptive-forms"
  ]
}
```

- [ ] **Step 2: Verify count**

```bash
python3 -c "import json; d=json.load(open('.claude-plugin/plugin.json')); print(len(d['skills']))"
```
Expected: `18`

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/plugin.json
git commit -m "refactor: update plugin.json — skills/ paths, drop 9 reference entries"
```

---

### Task 5: Update `package.json` validate script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update the validate script**

In `package.json`, replace the `validate` script value:

Old:
```json
"validate": "find forms-* -name SKILL.md -not -path '*/.venv/*' -exec dirname {} \\; | xargs -I {} skills-ref validate {}"
```

New:
```json
"validate": "find skills/ -name SKILL.md -not -path '*/.venv/*' -exec dirname {} \\; | xargs -I {} skills-ref validate {}"
```

- [ ] **Step 2: Run validate to confirm it finds skills**

```bash
npm run validate 2>&1 | head -20
```
Expected: skill paths printed — all start with `skills/forms-*`

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "refactor: update validate script to scan skills/"
```

---

### Task 6: Update `pyproject.toml` paths

**Files:**
- Modify: `pyproject.toml`

The `[tool.setuptools.packages.find]` `where` list has 7 paths that need `skills/` prefix.

- [ ] **Step 1: Update the where list**

In `pyproject.toml`, replace the `[tool.setuptools.packages.find]` section:

Old:
```toml
[tool.setuptools.packages.find]
where = [
    "forms-shared/scripts",
    "forms-build/references/create-form/scripts",
    "forms-build/references/scaffold-form/scripts",
    "forms-infra/references/sync-forms/scripts",
    "forms-infra/references/sync-eds-code/scripts",
    "forms-infra/references/git-sandbox/scripts",
    "forms-integration/references/manage-apis/scripts",
]
```

New:
```toml
[tool.setuptools.packages.find]
where = [
    "skills/forms-shared/scripts",
    "skills/forms-build/references/create-form/scripts",
    "skills/forms-build/references/scaffold-form/scripts",
    "skills/forms-infra/references/sync-forms/scripts",
    "skills/forms-infra/references/sync-eds-code/scripts",
    "skills/forms-infra/references/git-sandbox/scripts",
    "skills/forms-integration/references/manage-apis/scripts",
]
```

- [ ] **Step 2: Verify syntax**

```bash
python3 -c "import tomllib; tomllib.load(open('pyproject.toml','rb')); print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add pyproject.toml
git commit -m "refactor: update pyproject.toml package paths to skills/"
```

---

### Task 7: Fix `python3` wrapper script

**Files:**
- Modify: `skills/forms-shared/scripts/python3`

`PLUGIN_ROOT` resolves to `skills/forms-shared/`. `PROJECT_ROOT` is currently set one level up (`skills/`) but must be two levels up (repo root). PYTHONPATH entries also need `skills/` prefix.

- [ ] **Step 1: Update `python3` wrapper**

Replace the path resolution block and PYTHONPATH in `skills/forms-shared/scripts/python3`:

Old block (lines 18–19, 37–43):
```bash
PLUGIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_ROOT="$(cd "$PLUGIN_ROOT/.." && pwd)"
...
PLUGIN_PYTHONPATH="$PLUGIN_ROOT/scripts"
PLUGIN_PYTHONPATH="$PLUGIN_PYTHONPATH:$PROJECT_ROOT/forms-infra/references/sync-forms/scripts"
PLUGIN_PYTHONPATH="$PLUGIN_PYTHONPATH:$PROJECT_ROOT/forms-infra/references/sync-eds-code/scripts"
PLUGIN_PYTHONPATH="$PLUGIN_PYTHONPATH:$PROJECT_ROOT/forms-infra/references/git-sandbox/scripts"
PLUGIN_PYTHONPATH="$PLUGIN_PYTHONPATH:$PROJECT_ROOT/forms-build/references/create-form/scripts"
PLUGIN_PYTHONPATH="$PLUGIN_PYTHONPATH:$PROJECT_ROOT/forms-build/references/scaffold-form/scripts"
PLUGIN_PYTHONPATH="$PLUGIN_PYTHONPATH:$PROJECT_ROOT/forms-integration/references/manage-apis/scripts"
```

New:
```bash
PLUGIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_ROOT="$(cd "$PLUGIN_ROOT/../.." && pwd)"
...
PLUGIN_PYTHONPATH="$PLUGIN_ROOT/scripts"
PLUGIN_PYTHONPATH="$PLUGIN_PYTHONPATH:$PROJECT_ROOT/skills/forms-infra/references/sync-forms/scripts"
PLUGIN_PYTHONPATH="$PLUGIN_PYTHONPATH:$PROJECT_ROOT/skills/forms-infra/references/sync-eds-code/scripts"
PLUGIN_PYTHONPATH="$PLUGIN_PYTHONPATH:$PROJECT_ROOT/skills/forms-infra/references/git-sandbox/scripts"
PLUGIN_PYTHONPATH="$PLUGIN_PYTHONPATH:$PROJECT_ROOT/skills/forms-build/references/create-form/scripts"
PLUGIN_PYTHONPATH="$PLUGIN_PYTHONPATH:$PROJECT_ROOT/skills/forms-build/references/scaffold-form/scripts"
PLUGIN_PYTHONPATH="$PLUGIN_PYTHONPATH:$PROJECT_ROOT/skills/forms-integration/references/manage-apis/scripts"
```

- [ ] **Step 2: Verify PROJECT_ROOT resolves correctly**

```bash
bash -c 'PLUGIN_ROOT="$(cd "$(dirname "skills/forms-shared/scripts/python3")/.." && pwd)"; PROJECT_ROOT="$(cd "$PLUGIN_ROOT/../.." && pwd)"; echo "$PROJECT_ROOT"'
```
Expected: absolute path to repo root (same as `pwd`)

- [ ] **Step 3: Commit**

```bash
git add skills/forms-shared/scripts/python3
git commit -m "fix(python3): update PROJECT_ROOT depth and PYTHONPATH for skills/ move"
```

---

### Task 8: Fix `setup.sh` script

**Files:**
- Modify: `skills/forms-shared/scripts/setup.sh`

Same `PROJECT_ROOT` depth issue. `BRIDGE_DIR` also needs `skills/` prefix.

- [ ] **Step 1: Update path resolution in `setup.sh`**

Replace the path resolution block (lines 43–47):

Old:
```bash
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPTS_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$PLUGIN_ROOT/.." && pwd)"
VENV_PATH="$PROJECT_ROOT/.venv"
BRIDGE_DIR="$PROJECT_ROOT/forms-logic/scripts/rule_coder/bridge"
```

New:
```bash
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPTS_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$PLUGIN_ROOT/../.." && pwd)"
VENV_PATH="$PROJECT_ROOT/.venv"
BRIDGE_DIR="$PROJECT_ROOT/skills/forms-logic/scripts/rule_coder/bridge"
```

- [ ] **Step 2: Verify PROJECT_ROOT resolves correctly**

```bash
bash -c 'SCRIPTS_DIR="$(cd "$(dirname "skills/forms-shared/scripts/setup.sh")" && pwd)"; PLUGIN_ROOT="$(cd "$SCRIPTS_DIR/.." && pwd)"; PROJECT_ROOT="$(cd "$PLUGIN_ROOT/../.." && pwd)"; echo "$PROJECT_ROOT"'
```
Expected: absolute path to repo root

- [ ] **Step 3: Commit**

```bash
git add skills/forms-shared/scripts/setup.sh
git commit -m "fix(setup.sh): update PROJECT_ROOT depth and BRIDGE_DIR for skills/ move"
```

---

### Task 9: Update `${CLAUDE_PLUGIN_ROOT}` paths in orchestrator assets

**Files:**
- Modify: `skills/forms-orchestrator/assets/guidelines.md`
- Modify: `skills/forms-orchestrator/assets/routing-table.md`

- [ ] **Step 1: Update `guidelines.md` — script path examples and Available Scripts table**

In `skills/forms-orchestrator/assets/guidelines.md`:

Replace the three example lines under "Script & Path Resolution":
```
"${CLAUDE_PLUGIN_ROOT}/forms-shared/scripts/<tool-name>" <args>
"${CLAUDE_PLUGIN_ROOT}/forms-logic/scripts/<tool-name>" <args>
"${CLAUDE_PLUGIN_ROOT}/forms-infra/scripts/<tool-name>" <args>
```
→
```
"${CLAUDE_PLUGIN_ROOT}/skills/forms-shared/scripts/<tool-name>" <args>
"${CLAUDE_PLUGIN_ROOT}/skills/forms-logic/scripts/<tool-name>" <args>
"${CLAUDE_PLUGIN_ROOT}/skills/forms-infra/scripts/<tool-name>" <args>
```

Replace Rule 2 description:
```
Scripts live in the owning module: `forms-shared/scripts/`, `forms-logic/scripts/`, `forms-infra/scripts/`.
```
→
```
Scripts live in the owning module: `skills/forms-shared/scripts/`, `skills/forms-logic/scripts/`, `skills/forms-infra/scripts/`.
```

Replace all 9 rows in the Available Scripts table — old prefix `${CLAUDE_PLUGIN_ROOT}/forms-` → new prefix `${CLAUDE_PLUGIN_ROOT}/skills/forms-`:
```
| `eds-code-sync`    | `${CLAUDE_PLUGIN_ROOT}/skills/forms-infra/scripts/eds-code-sync` |
| `form-sync`        | `${CLAUDE_PLUGIN_ROOT}/skills/forms-infra/scripts/form-sync` |
| `rule-transform`   | `${CLAUDE_PLUGIN_ROOT}/skills/forms-logic/scripts/rule-transform` |
| `rule-validate`    | `${CLAUDE_PLUGIN_ROOT}/skills/forms-logic/scripts/rule-validate` |
| `rule-save`        | `${CLAUDE_PLUGIN_ROOT}/skills/forms-logic/scripts/rule-save` |
| `rule-grammar`     | `${CLAUDE_PLUGIN_ROOT}/skills/forms-logic/scripts/rule-grammar` |
| `parse-functions`  | `${CLAUDE_PLUGIN_ROOT}/skills/forms-logic/scripts/parse-functions` |
| `api-manager`      | `${CLAUDE_PLUGIN_ROOT}/skills/forms-shared/scripts/api-manager` |
| `git-sandbox`      | `${CLAUDE_PLUGIN_ROOT}/skills/forms-infra/scripts/git-sandbox` |
```

- [ ] **Step 2: Update `routing-table.md` — Step 1.5 script path**

In `skills/forms-orchestrator/assets/routing-table.md`, replace the script path in Step 1.5:

Old:
```bash
"${CLAUDE_PLUGIN_ROOT}/forms-infra/scripts/eds-code-sync" test
```

New:
```bash
"${CLAUDE_PLUGIN_ROOT}/skills/forms-infra/scripts/eds-code-sync" test
```

- [ ] **Step 3: Verify no old paths remain in orchestrator assets**

```bash
grep -r "PLUGIN_ROOT}/forms-" skills/forms-orchestrator/assets/
```
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add skills/forms-orchestrator/assets/guidelines.md skills/forms-orchestrator/assets/routing-table.md
git commit -m "fix(orchestrator): update CLAUDE_PLUGIN_ROOT script paths to skills/"
```

---

### Task 10: Update `${CLAUDE_PLUGIN_ROOT}` paths in leaf SKILL.md files

**Files:**
- Modify: `skills/forms-infra/references/setup-workspace/SKILL.md`
- Modify: `skills/forms-infra/references/sync-eds-code/SKILL.md`
- Modify: `skills/forms-logic/references/add-rules/SKILL.md`

- [ ] **Step 1: Update `setup-workspace/SKILL.md`**

In `skills/forms-infra/references/setup-workspace/SKILL.md`, replace all occurrences of:
```
${CLAUDE_PLUGIN_ROOT}/forms-infra/scripts/
```
with:
```
${CLAUDE_PLUGIN_ROOT}/skills/forms-infra/scripts/
```

- [ ] **Step 2: Update `sync-eds-code/SKILL.md`**

In `skills/forms-infra/references/sync-eds-code/SKILL.md`, replace all occurrences of:
```
${CLAUDE_PLUGIN_ROOT}/forms-infra/scripts/
```
with:
```
${CLAUDE_PLUGIN_ROOT}/skills/forms-infra/scripts/
```

- [ ] **Step 3: Update `add-rules/SKILL.md`**

In `skills/forms-logic/references/add-rules/SKILL.md`, replace all occurrences of:
- `${CLAUDE_PLUGIN_ROOT}/forms-logic/scripts/` → `${CLAUDE_PLUGIN_ROOT}/skills/forms-logic/scripts/`
- `${CLAUDE_PLUGIN_ROOT}/forms-shared/scripts/` → `${CLAUDE_PLUGIN_ROOT}/skills/forms-shared/scripts/`

- [ ] **Step 4: Verify no old paths remain in any SKILL.md**

```bash
grep -r "PLUGIN_ROOT}/forms-" skills/
```
Expected: no output

- [ ] **Step 5: Commit**

```bash
git add skills/forms-infra/references/setup-workspace/SKILL.md \
        skills/forms-infra/references/sync-eds-code/SKILL.md \
        skills/forms-logic/references/add-rules/SKILL.md
git commit -m "fix(skills): update CLAUDE_PLUGIN_ROOT script paths to skills/"
```

---

### Task 11: Update orchestrator routing instructions (Read not invoke)

**Files:**
- Modify: `skills/forms-orchestrator/SKILL.md`
- Modify: `skills/forms-orchestrator/assets/routing-table.md`

- [ ] **Step 1: Update `SKILL.md` — Registries table**

In `skills/forms-orchestrator/SKILL.md`, update the Registries table row for Domain Registry:

Old:
```markdown
| **Domain Registry** | [`references/domain-registry/SKILL.md`](references/domain-registry/SKILL.md) | Catalogs domains and skills, matches intents to domains, resolves plan step targets to executable skills |
```

New:
```markdown
| **Domain Registry** | [`references/domain-registry/SKILL.md`](references/domain-registry/SKILL.md) | Catalogs domains and skills, matches intents to domains, resolves plan step targets to executable skills. **Read this file — do not invoke it as a skill.** |
```

Also update the architecture diagram description reference and Quick Reference table footer note. Replace:
```markdown
| Domain registry | `references/domain-registry/SKILL.md` |
| Domain routers | `references/domain-registry/references/<domain>/SKILL.md` |
```
with:
```markdown
| Domain registry (read) | `references/domain-registry/SKILL.md` |
| Domain routers (read)  | `references/domain-registry/references/<domain>/SKILL.md` |
```

- [ ] **Step 2: Update `routing-table.md` — Step 5 routing instruction**

In `skills/forms-orchestrator/assets/routing-table.md`, replace Step 5 description:

Old:
```markdown
Route to the **Domain Registry** at `references/domain-registry/SKILL.md`. The registry has an Intent → Domain Routing table.
```

New:
```markdown
**Read** `references/domain-registry/SKILL.md`. The registry has an Intent → Domain Routing table. Do not invoke it as a skill — use the Read tool to access its content.
```

Also update the Plan Execution Flow section — replace:
```markdown
Resolve skill via Domain Registry
  (references/domain-registry/SKILL.md → references/domain-registry/references/<domain>/SKILL.md)
```
with:
```markdown
Resolve skill via Domain Registry
  Read references/domain-registry/SKILL.md → Read references/domain-registry/references/<domain>/SKILL.md
  (use Read tool — these are reference files, not invocable skills)
```

And in Step Resolution (item 3):
Old:
```markdown
Route to the domain's router SKILL.md → the domain router invokes the specific skill
```
New:
```markdown
Read the domain's router SKILL.md → the domain router's routing table identifies the specific skill to invoke
```

- [ ] **Step 3: Verify no stray "invoke" language for domain-registry in orchestrator files**

```bash
grep -n "invoke.*domain-registry\|invoke.*domain.*SKILL\|Skill.*domain-registry" \
  skills/forms-orchestrator/SKILL.md \
  skills/forms-orchestrator/assets/routing-table.md
```
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add skills/forms-orchestrator/SKILL.md skills/forms-orchestrator/assets/routing-table.md
git commit -m "refactor(orchestrator): domain-registry and domain routers are Read, not invoked"
```

---

### Task 12: Final validation

- [ ] **Step 1: Run validate across all skills**

```bash
npm run validate 2>&1
```
Expected: all skills report `Valid skill: ...` with no errors.

- [ ] **Step 2: Verify workspace.yaml and plugin.json are in sync**

```bash
python3 -c "
import json, re
plugin = json.load(open('.claude-plugin/plugin.json'))
ws = open('workspace.yaml').read()
ws_skills = [l.strip().lstrip('- ') for l in ws.splitlines() if l.strip().startswith('- ')]
plugin_skills = [s.lstrip('./') for s in plugin['skills']]
print('workspace.yaml:', len(ws_skills))
print('plugin.json:   ', len(plugin_skills))
missing = set(ws_skills) - set(plugin_skills)
extra   = set(plugin_skills) - set(ws_skills)
print('missing from plugin.json:', missing or 'none')
print('extra in plugin.json:    ', extra or 'none')
"
```
Expected:
```
workspace.yaml: 18
plugin.json:    18
missing from plugin.json: none
extra in plugin.json:     none
```

- [ ] **Step 3: Verify no old `forms-*` root paths remain in config files**

```bash
grep -r "\"./forms-\|find forms-\|where.*\"forms-" .claude-plugin/plugin.json package.json pyproject.toml 2>/dev/null
```
Expected: no output

- [ ] **Step 4: Verify skillpack build works**

```bash
skillpack pack --embed-deps skills/forms-orchestrator -v 0.2.0 -o dist/forms-orchestrator-0.2.0.skillpack 2>&1
```
Expected: exits 0, produces `dist/forms-orchestrator-0.2.0.skillpack`

- [ ] **Step 5: Final commit**

```bash
git add -A
git status
```
Expected: working tree clean (all changes already committed in prior tasks).

If clean:
```bash
echo "All tasks complete."
```
