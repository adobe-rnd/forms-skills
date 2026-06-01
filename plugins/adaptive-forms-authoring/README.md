# adaptive-forms-authoring plugin

Create, edit, and manage AEM Adaptive Forms through conversation — describe a form in plain English and let the agent build it directly on your AEM Cloud Service instance via the Sites Content MCP API.

## Prerequisites

| Requirement | Why |
|-------------|-----|
| Node.js 18+ | Runs the component resolver, patch validator, and rule builder scripts |
| AEM as a Cloud Service instance | Target environment for form creation and editing |

## Install

### 1. Register the marketplace and install the plugin

```
/plugin marketplace add adobe-rnd/forms-skills
/plugin install adaptive-forms-authoring@forms-skills
```

Restart Claude Code after installing.

### 2. Add the AEM Sites Content MCP server

The plugin communicates with AEM through the Sites Content MCP API. Add it once per machine:

**AEM as a Cloud Service:**
```bash
claude mcp add --transport http aem-sites-content https://mcp.adobeaemcloud.com/adobe/mcp/content
```

**Local AEM (localhost:4502):**
```bash
claude mcp add aem-sites-content -- node /tmp/aem-sites-contentapi-mcp-server/build/index.js
```
Set env vars: `AEM_AUTHOR_URL=http://localhost:4502` and `AEM_AUTHOR_AUTH_PARAMETER=admin:admin`

Restart Claude Code after adding the MCP server.

## First use

The first time you make a request in a new session, Claude will start an OAuth browser flow to authorize access to your AEM instance:

1. A browser URL is printed — open it and sign in with your Adobe ID
2. If the browser shows a connection error on the redirect page, paste the full URL from the address bar back into Claude
3. Once authorized, the MCP tools become available and Claude proceeds automatically

Authentication is per-session — you repeat this once each time you restart Claude Code.

## Usage

Just describe what you want in plain English:

```
Create a personal loan application form with fields for name, email, phone, loan amount, and income.
```

```
Add a dropdown for loan purpose to the personal loan form.
```

```
Make the income field required and add a rule to show it only when loan amount is above 50000.
```

Claude will:
1. Discover your AEM environments and ask which one to use (first time only)
2. Find a suitable form template to copy from
3. Show a concrete proposal — field names, types, panel structure — and wait for your confirmation
4. Apply all changes in a single patch to AEM
5. Return the editor URL so you can open the form immediately

## Skills

| Skill | Trigger phrases |
|-------|----------------|
| `forms-author` | create form, add field, add panel, change property, delete field, move field, set required, set submit action, apply rule, show/hide, validate, calculate |
| `forms-content-modeler` | (invoked automatically by `forms-author` when building component JSON) |
| `forms-rule-author` | (invoked automatically by `forms-author` when generating business rules) |

## Plugin layout

```
plugins/adaptive-forms-authoring/
├── .claude-plugin/plugin.json
├── README.md
└── skills/
    ├── forms-author/           # orchestrator — page resolution, MCP calls, workflow routing
    │   ├── SKILL.md
    │   ├── scripts/            # find-field, resolve-insert-position, validate-patch, build-insert-ops, …
    │   └── references/
    │       └── workflows/      # add-field, edit-field, delete-field, create-form, …
    ├── forms-content-modeler/  # builds validated component JSON from a definition + intent
    │   ├── SKILL.md
    │   ├── scripts/            # resolve-component-type, filter-definition, get-component-def, validate-add, …
    │   └── references/
    ├── forms-rule-author/      # generates fd:rules / fd:events from natural language + form definition
    │   ├── SKILL.md
    │   └── scripts/
    └── tests/
```

## How it works

```
User Intent
    │
    ▼
forms-author          ← resolves page, plans changes, calls AEM MCP
    ├── forms-content-modeler   ← resolves component types, builds + validates component JSON
    └── forms-rule-author       ← generates AEM Forms rule expressions
```

`forms-author` is the entry point. It resolves which AEM page to work on, proposes a plan for user confirmation, then delegates component building to `forms-content-modeler` and rule generation to `forms-rule-author`. All AEM reads and writes go through the Sites Content MCP API.

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
