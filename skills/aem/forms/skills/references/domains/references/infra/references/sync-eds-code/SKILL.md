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
- Opening a pull request for code changes
- Checking GitHub token validity and repo access
- Inspecting active file mapping rules

## Critical Rules

1. **Always use the `eds-code-sync` CLI** — do not manually clone or push to the repo
2. **Check GitHub credentials first** — `GITHUB_REPO` and `GITHUB_TOKEN` must be set in `.env`
3. **Sync before editing** — always `sync` first to get the latest code from the repo
4. **Push to branches** — never push directly to main; always use `push --branch <name>`
5. **Preview with `--pr`** — use `push --branch <name> --pr` to auto-open a pull request
6. **Re-sync after PR merge** — after the user merges a PR, run `eds-code-sync sync` before starting any new work so the local `code/` directory reflects the latest main branch

## Tool Commands

| Action | Command |
|--------|---------|
| Sync repo to local | `eds-code-sync sync` |
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
4. **Push** — `eds-code-sync push --branch feature-name --pr` to push and open PR

## Deploy & Resync Lifecycle

When a plan or phase modifies EDS code (files in the `code/` directory), follow this lifecycle at plan completion:

### 1. Push changes and open a PR

```
eds-code-sync push --branch <plan-name-or-feature> --pr
```

Use a descriptive branch name derived from the plan or feature (e.g., `plan-03-business-rules`, `add-prefill-logic`).

### 2. Ask the user to review and merge

> "I've pushed the code changes and opened a PR. Please review and merge it when ready. Let me know once it's merged so we can continue."

Wait for the user to confirm the merge. Do not proceed to the next plan until the PR is merged.

### 3. Re-sync before the next plan

Once the user confirms the merge, re-sync the local `code/` directory:

```
eds-code-sync sync
```

This pulls the merged main branch so the workspace reflects the latest state — including any review changes the user or reviewers may have made during the PR.

> **Why re-sync?** The user or other reviewers may modify code during PR review. Re-syncing ensures the agent works with the actual merged code, not a stale local copy.

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

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Auth failure | Run `eds-code-sync test` to verify token and repo access |
| Stale code | Run `eds-code-sync sync` to pull latest |
| Branch already exists | Delete it first with `eds-code-sync delete-branch --branch <name>` |
| Wrong files synced | Check mapping with `eds-code-sync show-mapping` |