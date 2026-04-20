# Forms Skills Issues

## Issues

| Issue | Status | Problem | RCA | Resolution / Next Step | Files Changed |
| --- | --- | --- | --- | --- | --- |
| 1 | Resolved | `forms-sync` fails with `Missing environment variables: AEM_HOST, AEM_TOKEN` | `.env` is not being discovered even though `PWD` is correct | Code audit confirmed `.env` discovery is already correct — `config.py` uses `python-dotenv` with three-tier fallback (cwd → find_dotenv → FORMS_WORKSPACE env var) | `form_sync/config.py` (pre-existing fix) |
| 2 | Resolved | `rule-transform` fails with `ModuleNotFoundError: No module named 'formsgenailib'` | Required Python dependency `formsgenailib` is missing, so `FUNCTION_CALL` rule context cannot be built | Code audit confirmed `formsgenailib` is vendored under `scripts/rule_coder/bridge/vendor/` and injected via `sys.path` before import | `rule_coder/bridge/cli/jcr-to-crispr.py` (pre-existing fix) |
| 3 | Resolved | `api-manager` cannot find specs in the expected directory | Specs are expected in a specific directory, but they are missing | Code audit confirmed `config.py` defines `refs/apis/generated/spec/` correctly and handles empty spec lists gracefully | `api_manager/config.py` (pre-existing fix) |
| 4 | Resolved | Form is not pushed automatically after plan generation | `form-sync` is not used to push the form after each plan | Updated plan template to require an explicit ask before pushing; updated Conventions to make the ask mandatory | `references/planner/assets/plan-template.md` |
| 5 | Resolved | EDS PR pipeline build failed due to `package-lock.json` drift | `push` and `validate` used `npm install`, which modified the lockfile under a different Node version | Replaced `npm install` with `npm ci`; updated docs and removed an unused helper | `sync-eds-code/scripts/eds_code_sync/push.py`, `sync-eds-code/scripts/eds_code_sync/validate.py`, `sync-eds-code/scripts/eds_code_sync/git_ops.py`, `sync-eds-code/scripts/eds_code_sync/cli.py`, `sync-eds-code/SKILL.md` |
| 6 | Resolved | `aem-psi-check` failed because the PR description lacked a preview URL | Auto-generated PR body did not include the required AEM preview URL | Updated PR body generation to include `URL for testing:` with a computed preview URL; updated docs | `sync-eds-code/scripts/eds_code_sync/push.py`, `sync-eds-code/SKILL.md` |
| 7 | Resolved | Script path resolution was broken | `CLAUDE_PLUGIN_ROOT` references missed the `forms-orchestrator/` path segment | Updated all script references to `${CLAUDE_PLUGIN_ROOT}/forms-orchestrator/scripts/...` | `sync-eds-code/SKILL.md`, `setup-workspace/SKILL.md`, `add-rules/SKILL.md` |
| 8 | Resolved | `setup-workspace/SKILL.md` had hardcoded `/Users/alice/projects` paths | Hardcoded absolute example path could mislead the agent into using a literal path | Replaced the hardcoded example with the generic `<cwd>/<name>` placeholder | `setup-workspace/SKILL.md` |
| 9 | Resolved | No guideline existed for how SKILL.md files should reference CLI scripts | Missing contribution guidance caused incorrect path construction from the skill base directory | Added path-resolution guidance for script references and absolute path avoidance | `forms-orchestrator/assets/guidelines.md`, `domain-registry/assets/contribution-guide.md` |
| 10 | Resolved | `create-function` and related skills have documentation gaps around runtime entry points and event-driven UI patterns | Skill docs are incomplete or misleading about `functions.js`, checkbox requirements, date values, and transient UI patterns | Updated all affected skill docs — see Documentation Gaps table below | Multiple (see below) |

## Documentation Gaps

| Gap | Skill | What's Missing | Status | Files Changed |
| --- | --- | --- | --- | --- |
| No transient UI patterns | `create-form` | How to implement toasts, modals, and loading spinners in EDS forms | Resolved | `add-rules/SKILL.md` (event-driven UI section), `create-component/SKILL.md` (modal/overlay section) |
| No modal/overlay examples | `create-component` | Only field-type extensions are shown, not standalone UI components | Resolved | `create-component/SKILL.md` — added "Modal / Overlay Components" section with panel base, decorate() template, and visibility wiring guidance |
| No event-to-UI examples | `add-rules` | How custom events trigger UI components such as modals and toasts | Resolved | `add-rules/SKILL.md` — added "Event-Driven UI Patterns" section with toast and modal patterns |
| `functions.js` entry point | `create-function` | Docs say the form script is "loaded by runtime", but `functions.js` is the real entry point | Resolved | `create-function/SKILL.md` — added callout clarifying `customFunctionsPath` is the sole runtime entry point, `functions.js` is the conventional filename |
| Date-input value format | `create-form` / `field-types` | Missing note that `$value` is ISO `YYYY-MM-DD`, not the display format | Resolved | `field-types.md` — added `$value` format note to `date-input` row and Constraints section |
| Checkbox enum requirement | `create-form` / `field-types` | Missing note that single checkboxes need `enum` / `enumNames` | Resolved | `field-types.md` — added `enum`/`enumNames` requirement to `checkbox` row and Constraints section |
| Plain-text valid properties | `create-form` / `field-types` | Missing clarification that `jcr:title` is invalid for plain-text | Resolved | `field-types.md` — added note in Constraints section that `plain-text` uses `value` for content, not `jcr:title` |
