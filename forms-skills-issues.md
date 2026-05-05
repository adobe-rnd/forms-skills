Issue 1:
-----------------------------------------------------------
While using forms-sync tool we encounter the following error:

```
Error: Missing environment variables: AEM_HOST, AEM_TOKEN
```

RCA: The PWD is correct but it's still not finding the .env. Let me check how the tool loads configuration.

-----------------------------------------------------------
Issue 2:
-----------------------------------------------------------
While using the form transformation tool, we encounter the following error:

```
Error: Bash(/Users/anirudhaggar/.claude/plugins/cache/adobe-skills/aem-forms/0.1.0/bin/rule-transform
      /Users/anirudhaggar/Documents/aem/codes/adobe-aem-forms/forms-skills-t…)
  ⎿  Error: Exit code 1
     Traceback (most recent call last):
       File "/Users/anirudhaggar/.claude/plugins/cache/adobe-skills/aem-forms/0.1.0/scripts/rule_coder/bridge/cli/jcr-to-crispr.py", line 17, in <module>
         from formsgenailib.core.form import (
         ...<2 lines>...
         )
     ModuleNotFoundError: No module named 'formsgenailib'
     {"success":false,"error":"Transform error: JCR to CRISPR conversion failed: spawnSync /bin/sh EPIPE","stack":"Error: JCR to CRISPR conversion failed: spawnSync
     /bin/sh EPIPE\n    at convertJcrToCrispr
     (/Users/anirudhaggar/.claude/plugins/cache/adobe-skills/aem-forms/0.1.0/scripts/rule_coder/bridge/cli/transform-form.js:119:15)\n    at transformFormJson
     (/Users/anirudhaggar/.claude/plugins/cache/adobe-skills/aem-forms/0.1.0/scripts/rule_coder/bridge/cli/transform-form.js:141:21)\n    at main
     (/Users/anirudhaggar/.claude/plugins/cache/adobe-skills/aem-forms/0.1.0/scripts/rule_coder/bridge/cli/transform-form.js:209:41)\n    at Object.<anonymous>
     (/Users/anirudhaggar/.claude/plugins/cache/adobe-skills/aem-forms/0.1.0/scripts/rule_coder/bridge/cli/transform-form.js:226:1)\n    at Module._compile
     (node:internal/modules/cjs/loader:1469:14)\n    at Module._extensions..js (node:internal/modules/cjs/loader:1548:10)\n    at Module.load
     (node:internal/modules/cjs/loader:1288:32)\n    at Module._load (node:internal/modules/cjs/loader:1104:12)\n    at Function.executeUserEntryPoint [as runMain]
     (node:internal/modules/run_main:174:12)\n    at node:internal/main/run_main_module:28:49"}
```
RCA: The error indicates that the Python module `formsgenailib` is missing. This module is likely a dependency for the form transformation tool. I will need to check the installation instructions for the tool and ensure that all required dependencies are installed, possibly via pip or another package manager.

The issue is that rule-transform can't build the context needed for FUNCTION_CALL rules because the formsgenailib module is missing. Let me fix that dependency.

-----------------------------------------------------------
Issue 3:
-----------------------------------------------------------
Error: The api-manager looks for specs in a specific directory. Let me create the OpenAPI YAML specs directly and then build the clients. I'll create all 5 API specs.

-----------------------------------------------------------
Issue 4:
-----------------------------------------------------------
form-sync tool is not used to push the form. The form is not pushed after every plan. We should ask the user if they want to push the form after the plan is generated. If yes, we can run the push command. This will ensure that the form is always in sync with the latest changes and avoid any discrepancies between local and AEM versions.


-----------------------------------------------------------
Issue 5:
-----------------------------------------------------------
Build stage was failing in the eds-code PR pipeline due to `package-lock.json` drift.

What happened:
- `eds-code-sync push` clones the repo, then runs `npm install` to install dependencies (needed so `npm run lint` and `npm run build:json` can execute).
- `npm install` modifies `package-lock.json` — the local Node.js (v24) resolved `picomatch@4.0.4` as a new transitive dependency, which wasn't in the original lock file (generated with a different Node version).
- The push tool commits ALL changes in the cloned repo — including the modified `package-lock.json`.
- CI runs `npm ci` (not `npm install`) — `npm ci` is strict and requires `package.json` and `package-lock.json` to be in exact sync. Since the lock file was modified by a different Node version, it fails with `Missing: picomatch@4.0.4`.

RCA: The `push` and `validate` commands used `npm install` which can modify `package-lock.json` when the local Node.js version differs from CI. The modified lock file was then committed, causing `npm ci` in CI to fail.

Resolution: Replaced `npm install` with `npm ci` in both `push.py` and `validate.py`. `npm ci` installs exactly what is recorded in `package-lock.json` without modifying it. Also updated docstrings in `cli.py`, and updated `SKILL.md` (sync-eds-code) — rewrote Lock-file Handling section, Critical Rules, Workflow, and Troubleshooting table.

Files changed:
- `sync-eds-code/scripts/eds_code_sync/push.py`
- `sync-eds-code/scripts/eds_code_sync/validate.py`
- `sync-eds-code/scripts/eds_code_sync/git_ops.py` (removed unused `restore_file` method)
- `sync-eds-code/scripts/eds_code_sync/cli.py`
- `sync-eds-code/SKILL.md`

-----------------------------------------------------------
Issue 6:
-----------------------------------------------------------
`aem-psi-check` was failing in the eds-code PR because the PR description was missing a preview URL.

What happened:
- AEM EDS repos have an `aem-psi-check` CI gate that validates PR descriptions.
- It requires a preview URL in the PR body matching this pattern:
  ```
  URL for testing:

  - https://<branch>--<repo>--<owner>.aem.page/
  ```
- The `eds-code-sync push --pr` command created a PR with a generic body that didn't include the test URL, so it always failed this check.

RCA: The auto-generated PR body only contained file count, branch name, and base branch — no AEM preview URL. The `aem-psi-check` CI gate rejected it every time.

Resolution: Updated `push.py` to auto-generate the preview URL from the branch name, repo, and owner (extracted from `config.github_repo`) and include it in the PR body under a `URL for testing:` section. Added documentation in `SKILL.md` (sync-eds-code) with a new "AEM PSI Check & PR Body" section and a troubleshooting row.

Files changed:
- `sync-eds-code/scripts/eds_code_sync/push.py`
- `sync-eds-code/SKILL.md`

-----------------------------------------------------------
Issue 7:
-----------------------------------------------------------
Script path resolution was broken — `CLAUDE_PLUGIN_ROOT` path was missing `forms-orchestrator/` segment.

What happened:
- SKILL.md files referenced scripts as `${CLAUDE_PLUGIN_ROOT}/scripts/eds-code-sync`.
- `CLAUDE_PLUGIN_ROOT` resolves to the plugin root (`forms/`, where `.claude-plugin/` lives).
- But the scripts actually live under `forms/forms-orchestrator/scripts/`, not `forms/scripts/`.
- This caused `no such file or directory` errors when the agent tried to run any CLI tool.

RCA: All SKILL.md files used `${CLAUDE_PLUGIN_ROOT}/scripts/...` but the scripts directory is nested one level deeper under `forms-orchestrator/`. The path was missing the `forms-orchestrator/` segment.

Resolution: Updated all `${CLAUDE_PLUGIN_ROOT}/scripts/...` references to `${CLAUDE_PLUGIN_ROOT}/forms-orchestrator/scripts/...` across all affected SKILL.md files.

Files changed:
- `sync-eds-code/SKILL.md` — 3 paths fixed (validate, push, sync)
- `setup-workspace/SKILL.md` — 2 paths fixed (test, sync)
- `add-rules/SKILL.md` — 7 paths fixed (rule-transform, parse-functions, api-manager ×2, rule-validate, rule-save ×2, rule-grammar)

-----------------------------------------------------------
Issue 8:
-----------------------------------------------------------
`setup-workspace/SKILL.md` contained hardcoded example paths with `/Users/alice/projects`.

What happened:
- Step 2 of the setup flow included an example with a hardcoded absolute path:
  `FORMS_WORKSPACE=/Users/alice/projects/loan-app`
- While "alice" is a fictional user, hardcoded absolute paths in skill documentation can mislead the agent into using literal paths instead of dynamically resolved ones.

RCA: The SKILL.md used a concrete example path instead of the generic `<cwd>/<name>` placeholder that was already defined earlier in the same step.

Resolution: Removed the hardcoded `/Users/alice/projects/loan-app` example block and replaced the confirmation message with the generic `<cwd>/<name>` placeholder, which is already explained in the `.env` template block above it.

Files changed:
- `setup-workspace/SKILL.md`

-----------------------------------------------------------
Issue 9:
-----------------------------------------------------------
No guideline existed for how SKILL.md files should reference CLI scripts, leading to broken path resolution.

What happened:
- Claude Code injects a `Base directory for this skill:` header into each skill at runtime, pointing to the skill's own directory on disk.
- The agent was resolving script paths relative to this base directory (e.g., navigating up 7 levels with `../../../../../../..`), producing absolute paths tied to the developer's source repo.
- These paths don't exist on other users' machines where the plugin is installed from the cache.
- There was no documented guideline telling skill authors (or the agent) to use `${CLAUDE_PLUGIN_ROOT}` instead of the skill base directory for script paths.

RCA: Missing contribution guideline. Skill authors and the agent had no documented rule for how to reference scripts. The skill base directory (injected by Claude Code) is meant for resolving skill-local assets (`assets/`, `references/`), not for locating scripts that live at `forms-orchestrator/scripts/`.

Resolution: Added a "Script & Path Resolution" section to `guidelines.md` (agent-facing) and a "Script References in SKILL.md" section to `contribution-guide.md` (developer-facing). Both enforce these rules:
1. Always use `${CLAUDE_PLUGIN_ROOT}/forms-orchestrator/scripts/<tool>` for script paths.
2. Never construct script paths from the skill's base directory.
3. Never hardcode absolute paths — no `/Users/...` in any SKILL.md.
4. Use relative paths only for skill-local assets within the skill's own directory tree.

Files changed:
- `forms-orchestrator/assets/guidelines.md`
- `domain-registry/assets/contribution-guide.md`
