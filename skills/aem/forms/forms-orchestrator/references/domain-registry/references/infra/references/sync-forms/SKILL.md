---
name: sync-forms
description: >
  Bidirectional sync for AEM Adaptive Forms between AEM Author and local workspace.
  Pulls form JSON definitions from AEM, pushes local edits back via Universal Editor API,
  and manages a metadata registry tracking local-to-remote mappings. Supports forms and
  fragments, content path allowlisting, and multiple environments (local SDK, stage, prod).
  Triggers: form sync, pull form, push form, sync form, create form on AEM, create fragment,
  list forms, form-sync, adaptive form sync.
type: skill
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
allowed-tools: Read, Write, Edit, Bash
---

# Form Sync

You synchronize AEM Adaptive Form definitions between an AEM Author instance and the local workspace using the `form-sync` CLI.

## When to Use

- Pulling a form or fragment from AEM Author to local files
- Pushing local form edits back to AEM
- Listing available forms in an AEM DAM folder
- Creating a new empty form or fragment on AEM
- Resetting a local form to a clean state

## Critical Rules

1. **Always use the `form-sync` CLI** — do not manually create or edit form sync metadata
2. **Check AEM credentials first** — `AEM_HOST` and `AEM_TOKEN` (or `AEM_USERNAME` + `AEM_PASSWORD`) must be set in `.env`
3. **Respect allowlisted paths** — `AEM_WRITE_PATHS` controls which AEM paths can be written to
4. **Pull before editing** — always pull the latest version before making changes
5. **Rules are separated** — `pull` splits rules/events into a companion `.rule.json` file with UUID references

## Tool Commands

| Action | Command |
|--------|---------|
| Pull form from AEM | `form-sync pull <form_path>` |
| Push form to AEM | `form-sync push <form_path>` |
| List forms in folder | `form-sync list <dam_path>` |
| List and pull all | `form-sync list <dam_path> --pull` |
| Clear local form | `form-sync clear <form_path>` |
| Create new form | `form-sync create <folder_path> <form_name>` |
| Create fragment | `form-sync create-fragment <folder_path> <name>` |

## Workflow

1. **Configure** — set `AEM_HOST`, `AEM_TOKEN`, `GITHUB_URL`, `AEM_WRITE_PATHS` in `.env`
2. **Pull** — `form-sync pull <path>` to fetch form JSON to `repo/` or `refs/`
3. **Edit** — modify the local `.form.json` and `.rule.json` files
4. **Push** — `form-sync push <path>` to send changes back to AEM

## Environment

Create `.env` in project root:

```
AEM_HOST=https://author.aem.example.com
AEM_TOKEN=your-bearer-token
GITHUB_URL=https://github.com/owner/repo
AEM_WRITE_PATHS=/content/dam/formsanddocuments/my-project
FORM_SYNC_ENV=prod
```

| Variable | Required | Description |
|----------|----------|-------------|
| `AEM_HOST` | Yes | AEM Author instance URL |
| `AEM_TOKEN` | Yes* | Bearer token for AEM auth |
| `AEM_USERNAME` | Yes* | Basic auth username (alternative to token) |
| `AEM_PASSWORD` | Yes* | Basic auth password (alternative to token) |
| `GITHUB_URL` | Yes | GitHub repository URL |
| `AEM_WRITE_PATHS` | Yes | Comma-separated allowlist of writable AEM paths |
| `FORM_SYNC_ENV` | No | Environment: `local`, `stage`, or `prod` (default: `prod`) |

*Either `AEM_TOKEN` or `AEM_USERNAME`+`AEM_PASSWORD` must be provided.

## File Structure

```
<workspace>/
├── repo/
│   └── content/forms/af/        # Mirrors AEM content path — forms pulled here
│       └── <team>/<path>/
│           ├── <form-name>.form.json
│           └── <form-name>.rule.json
├── refs/
│   ├── metadata.json            # Fragment registry
│   ├── <fragment>.form.json     # Fragment content
│   └── <fragment>.rule.json     # Fragment rules
└── .env                         # AEM credentials
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Auth failure | Check `AEM_HOST` and `AEM_TOKEN` in `.env` |
| Write denied | Ensure path is in `AEM_WRITE_PATHS` allowlist |
| Stale local form | Run `form-sync pull` to get latest from AEM |
| Push creates duplicate | Check `metadata.json` for correct path mapping |