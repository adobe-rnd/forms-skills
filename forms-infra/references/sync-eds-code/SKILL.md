---
name: sync-eds-code
description: >
  Syncs Edge Delivery Services (EDS) Forms front-end code between a GitHub repository
  and a local workspace. Clones the repo, applies configurable file-mapping to extract
  form-related source files into a local code/ directory, and can push changes back by
  creating branches, committing, and optionally opening PRs.
  Triggers: eds code sync, eds sync, sync code, push code, github sync, edge delivery code,
  eds-code-sync, form components, form code, blocks/form.
type: skill
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
allowed-tools: Read, Write, Edit, Bash
---

# EDS Code Sync

You synchronize Edge Delivery Services form code between a GitHub repository and the local workspace using the `eds-code-sync` CLI.

## When to Use

- Syncing EDS form code from a GitHub repo to local `code/` directory
- Pushing local code changes back to GitHub on a new branch
- Validating local code changes before pushing
- Opening a pull request for code changes
- Checking GitHub token validity and repo access
- Inspecting active file mapping rules

## Critical Rules

1. **Always use the `eds-code-sync` CLI** — do not manually clone or push to the repo
2. **Check GitHub credentials first** — `GITHUB_REPO` and `GITHUB_TOKEN` must be set in `.env`
3. **Sync before editing** — always `sync` first to get the latest code from the repo
4. **Push to branches** — never push directly to main; always use `push --branch <name>`
5. **Validate before pushing** — after editing files in `code/`, always run `eds-code-sync validate` to catch lint errors and dependency issues before pushing. The local `code/` directory does not contain `package.json` or lint configs — the validate command handles this by cloning the repo, applying your changes, and running `npm ci` + `npm run lint` automatically
6. **Preview with `--pr`** — use `push --branch <name> --pr` to auto-open a pull request
7. **Re-sync after PR merge** — after the user merges a PR, run `eds-code-sync sync` before starting any new work so the local `code/` directory reflects the latest main branch

## Tool Commands

| Action | Command |
|--------|---------|
| Sync repo to local | `eds-code-sync sync` |
| Validate local changes | `eds-code-sync validate` |
| Push to branch | `eds-code-sync push --branch <name>` |
| Push + open PR | `eds-code-sync push --branch <name> --pr` |
| Test GitHub access | `eds-code-sync test` |
| Show file mapping | `eds-code-sync show-mapping` |
| Delete remote branch | `eds-code-sync delete-branch --branch <name>` |
| Generate .env template | `eds-code-sync init` |

## Workflow

1. **Configure** — set `GITHUB_REPO` and `GITHUB_TOKEN` in `.env`
2. **Sync** — `eds-code-sync sync` to clone and map files to `./code`
3. **Edit** — modify files in `code/` directory
4. **Validate** — `eds-code-sync validate` to verify changes pass `npm ci` and `npm run lint`
5. **Push** — `eds-code-sync push --branch feature-name --pr` to push and open PR

## Deploy & Resync Lifecycle

When a plan or phase modifies EDS code (files in the `code/` directory), follow this lifecycle at plan completion:

### 1. Validate the changes

Before pushing, validate the EDS code using the CLI:

```
"${CLAUDE_PLUGIN_ROOT}/forms-infra/scripts/eds-code-sync" validate --verbose
```

This clones the EDS repository, applies your local `code/` changes on top, runs `npm ci` and `npm run lint`, and reports any errors.

If validation fails, fix the issues in the `code/` directory and re-run `validate` until it passes.

> **Why validate?** The local `code/` directory only contains a mapped subset of the EDS repository — it has no `package.json`, no lint config, and no `node_modules`. You cannot run `npm install` or `npm run lint` directly in `code/`. The `validate` command handles this by working against the full cloned repo. This catches syntax errors, dependency issues, and style violations before they reach the PR.

> **Note:** The `push` command also runs lint automatically, but validating first lets you catch and fix errors before committing.

### 2. Push changes and open a PR

```
"${CLAUDE_PLUGIN_ROOT}/forms-infra/scripts/eds-code-sync" push --branch <plan-name-or-feature> --pr
```

Use a descriptive branch name derived from the plan or feature (e.g., `plan-03-business-rules`, `add-prefill-logic`).

### 3. Ask the user to review and merge

> "I've pushed the code changes and opened a PR. Please review and merge it when ready. Let me know once it's merged so we can continue."

Wait for the user to confirm the merge. Do not proceed to the next plan until the PR is merged.

### 4. Re-sync before the next plan

Once the user confirms the merge, re-sync the local `code/` directory:

```
"${CLAUDE_PLUGIN_ROOT}/forms-infra/scripts/eds-code-sync" sync
```

This pulls the merged main branch so the workspace reflects the latest state — including any review changes the user or reviewers may have made during the PR.

> **Why re-sync?** The user or other reviewers may modify code during PR review. Re-syncing ensures the agent works with the actual merged code, not a stale local copy.

## Lock-file Handling

The `push` and `validate` commands use `npm ci` (not `npm install`) to install dependencies inside the temporary clone. `npm ci` installs exactly what is recorded in `package-lock.json` without modifying it, so the committed lock file is never altered by the tool.

> **Tip:** If you still see CI lock-file errors, make sure the `package-lock.json` checked into the repo was generated with the same Node.js major version used by CI (check `.node-version` or the CI workflow file).

## AEM PSI Check & PR Body

AEM EDS repositories typically include an `aem-psi-check` CI gate that validates the pull-request description. It requires a **preview URL** in the PR body matching this pattern:

```
URL for testing:

- https://<branch>--<repo>--<owner>.aem.page/
```

**Automatic inclusion:** When you use `push --pr`, the tool now auto-generates the correct preview URL from the branch name, repository, and owner (all derived from `GITHUB_REPO` in `.env`) and includes it in the PR body. No manual editing is needed.

If the check still fails, verify that:
- The branch name doesn't contain characters that break the URL (use lowercase alphanumeric and hyphens)
- The repository has AEM EDS preview enabled

## Environment

Create `.env` in project root:

```
GITHUB_REPO=owner/repo-name
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_BRANCH=main
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_REPO` | Yes | GitHub repository (e.g., `owner/repo`) |
| `GITHUB_TOKEN` | Yes | GitHub PAT with `repo` scope |
| `GITHUB_BRANCH` | No | Branch to sync from (default: `main`) |

## File Mapping

The `sync` command maps EDS repo files to the local `code/` directory:

| Repo Path | Local Path |
|-----------|------------|
| `blocks/form/form.js` | `code/forms.js` |
| `blocks/form/components/` | `code/components/` |
| `blocks/form/mappings.js` | `code/mappings.js` |
| `blocks/form/api-clients/` | `code/api-clients/` |

Custom mappings can be provided via `--mapping` flag.

> **Important:** Only the mapped files above are synced. The local `code/` directory does not contain `package.json`, lint configs, or other repo root files. Use `eds-code-sync validate` to run npm-based validations.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Auth failure | Run `eds-code-sync test` to verify token and repo access |
| Stale code | Run `eds-code-sync sync` to pull latest |
| Lint errors before push | Run `eds-code-sync validate --verbose` to see detailed lint output, fix issues in `code/`, then re-validate |
| Branch already exists | Delete it first with `eds-code-sync delete-branch --branch <name>` |
| Wrong files synced | Check mapping with `eds-code-sync show-mapping` |
| CI fails with lock-file error | The tool uses `npm ci` which never modifies `package-lock.json`. If it still fails, ensure the lock file in the repo was generated with the same Node.js version as CI |
| aem-psi-check fails on PR | The `push --pr` command auto-includes the AEM preview URL. If you created the PR manually, add `URL for testing:\n\n- https://<branch>--<repo>--<owner>.aem.page/` to the PR body |
| Can't run npm in code/ | This is expected — `code/` has no `package.json`. Use `eds-code-sync validate` instead |