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

## Form Types

Two form architectures are supported. Identify the correct type from the user's prompt **before** running any push command.

| Type | Trigger Phrases | CLI Flag |
|------|----------------|---------|
| EDS / Franklin (default) | "EDS form", "Franklin form", or no type specified | *(omit flag — default)* |
| Core Component | "core component form", "CC form", "adaptive form core component" | `--form-type core_component` |

The flag controls which JCR page structure is imported when creating the form shell on AEM (local env via Sling import). The form JSON content patched afterward is the same for both types.

## Tool Commands

| Action | Command |
|--------|---------|
| Pull form from AEM | `form-sync pull <form_path>` |
| Push EDS form to AEM | `form-sync push <form_path>` |
| Push Core Component form to AEM | `form-sync push <form_path> --form-type core_component` |
| List forms in folder | `form-sync list <dam_path>` |
| List and pull all | `form-sync list <dam_path> --pull` |
| Clear local form | `form-sync clear <form_path>` |
| Create new form | `form-sync create <folder_path> <form_name>` |
| Create fragment | `form-sync create-fragment <folder_path> <name>` |

## Workflow

### EDS / Franklin Forms (default)
1. **Configure** — set `AEM_HOST`, `AEM_TOKEN`, `GITHUB_URL`, `AEM_WRITE_PATHS` in `.env`
2. **Pull** — `form-sync pull <path>` to fetch form JSON to `repo/` or `refs/`
3. **Edit** — modify the local `.form.json` and `.rule.json` files
4. **Push** — `form-sync push <path>` to send changes back to AEM

### Core Component Adaptive Forms
Core Component forms do **not** require a GitHub workflow. There are no custom function files to deploy and no EDS component code. The full workflow is AEM-only:

1. **Configure** — `AEM_HOST`, `AEM_TOKEN`, and `AEM_WRITE_PATHS` in `.env` (no `GITHUB_URL` required for push)
2. **Scaffold locally** — `scaffold-form <form_name> --form-type core_component --output-dir repo/content/forms/af/<team>/<path>`
3. **Build form JSON** — add panels and fields using the `create-form` skill
4. **Add rules** — add business logic using the `add-rules` skill
5. **Register in metadata** — run `form-sync create <folder_path> <form_name>` once to register the form and create its AEM page shell
6. **Push** — `form-sync push <form_path> --form-type core_component` on every subsequent edit

**First-time push (new form at exact path, no suffix):**
```bash
form-sync push /content/forms/af/lovely/centene/my-form --form-type core_component --new --suffix ""
```
This creates the CC page structure via Sling import (replaces any existing EDS page at that path), then patches the form content into `jcr:content/guideContainer`.

**Subsequent pushes (update existing CC form):**
```bash
form-sync push /content/forms/af/lovely/centene/my-form --form-type core_component
```

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
| `FORM_SYNC_FORM_TYPE` | No | Form architecture: `eds` or `core_component` (default: `eds`) |

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