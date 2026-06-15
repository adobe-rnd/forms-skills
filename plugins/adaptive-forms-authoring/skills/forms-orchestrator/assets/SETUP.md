# Workspace Setup

You help users set up and configure a new AEM Forms workspace through a guided, conversational flow — directory creation, credential collection, system checks, and first-run validation.

> **Token handling:** Bearer tokens contain characters (`+`, `/`, `=`, etc.) that get mangled when pasted into terminal prompts. **Always** write placeholder lines in `.env` and ask the user to paste tokens directly into the file — never collect tokens through the conversation.

## When to Use

- User just installed the plugin and needs to set up a workspace
- User needs to configure AEM credentials
- User asks "how do I get started?" or "what do I need to set up?"
- User wants to create a new project from scratch
- User needs to verify system requirements (Node.js, Python, git)
- User is troubleshooting credential or connectivity issues

**Do NOT use for:** Building forms, adding rules, or any task that assumes the workspace is already set up — use the appropriate skill instead.

## Critical Rules

1. **Confirm EDS repo root first** — the very first thing you do is verify the user is in their EDS repo root (check for `package.json` and `blocks/form/` in cwd)
2. **Workspace name is fixed as `.skills-workspace`** — do not ask the user to choose a name
3. **Write `FORMS_WORKSPACE` and `FORMS_EDS_ROOT` to `.env` immediately after creating the directory** — these are the first lines of `.env` and are how every CLI tool finds the workspace and the EDS repo
4. **Collect non-sensitive values conversationally** — ask for URLs and paths one at a time in the conversation
5. **Never collect tokens through the conversation** — for `AEM_TOKEN`, write a clearly marked placeholder line in `.env` and tell the user to open the file and paste the value directly. Terminal escaping corrupts tokens.
6. **Never hardcode credentials** — always write to `.env`; never commit `.env` to version control
7. **Verify system requirements** — confirm Node.js 18+ and Python 3.10+ are available
8. **Test AEM credentials after collecting them** — use a curl check to verify AEM connectivity
9. **Accept "skip"** — if the user doesn't have a value yet, write a placeholder comment and move on

## Interactive Setup Flow

Execute these steps in order. This is a conversation — wait for the user's response after each prompt.

### Step 1: Confirm EDS repo root

Check that the current working directory is the EDS repo root:

```bash
ls package.json blocks/form/ 2>/dev/null
```

If both exist, confirm to the user:
> "I can see `package.json` and `blocks/form/` — this looks like your EDS repo root. I'll create the workspace here."

If they do NOT exist, ask the user:
> "Please open your EDS repo root in the terminal (the directory that contains `package.json` and `blocks/form/`) and run this skill again."

### Step 2: Create workspace and write FORMS_WORKSPACE to .env

Create the `.skills-workspace` directory **inside the current working directory** (the EDS repo root):

```bash
mkdir -p .skills-workspace/{refs/apis,.agent,journeys}
mkdir -p .claude
```

Then immediately write the absolute paths into `.skills-workspace/.env` as the first entries:

```
# ── Workspace ────────────────────────────────────────────
FORMS_WORKSPACE=<cwd>/.skills-workspace
FORMS_EDS_ROOT=<cwd>
```

**Then create `CLAUDE.md` in the workspace root.**

First, resolve the plugin root path:

```bash
echo "${CLAUDE_PLUGIN_ROOT}"
```

Then write `.skills-workspace/CLAUDE.md` using the resolved path (substitute `<plugin-root>` with the actual value printed above):

```markdown
# AEM Forms Workspace

## Plugin

**AEM Forms plugin root:** `<plugin-root>`

When working with AEM Forms skills in this workspace, always read skill files from the path above. Do NOT read from any source code repository or any other path. Never assume skill file paths — verify they exist under the plugin root first.

## Session Pre-Flight

At the start of every new session, verify AEM connectivity before any form work:

```bash
source "$FORMS_WORKSPACE/.env" && \
  curl -sf -o /dev/null -H "Authorization: Bearer $AEM_TOKEN" "${AEM_HOST}/api/assets.json" \
  && echo "AEM OK" || echo "AEM FAIL — check AEM_HOST and AEM_TOKEN in .env"
```

- **AEM FAIL / 401 Unauthorized** — AEM bearer token expired. Regenerate from AEM Developer Console → Integrations → Local Token, paste into `.env` as `AEM_TOKEN`.
- **Network error** — wrong `AEM_HOST` or no internet. Verify the URL and connectivity.

Most mid-session failures trace back to a credential problem that was already present at session start but went undetected.

## Workspace Setup Checklist

After the pre-flight passes, verify in order:
1. Plugin is loaded — run `/reload-plugins` if skills are not responding.
2. Credentials are filled in — `.env` has no `<paste-...>` placeholder values.
3. AEM connectivity passes (covered by pre-flight above).

## Deployment Checklist

Before deploying EDS code changes, always verify:
1. Bearer token is valid — regenerate from AEM Developer Console → Integrations → Local Token if you get 401.
2. Files are placed in `blocks/form/` under the EDS repo root (`$FORMS_EDS_ROOT`).
3. `package-lock.json` is not modified — never commit lockfile changes.
4. Run `npm run lint` in `$FORMS_EDS_ROOT` and fix all violations before committing.

## Code Style

When implementing form UI components, prefer component-based approaches over direct DOM manipulation. Ask the user before choosing between design alternatives (dropdown vs autocomplete, toast patterns, wizard layouts, etc.).

## Form Validation

Use `constraintMessages` carefully and validate against the content model before patching. For validation rules, test with a small subset first — never apply bulk rules without incremental validation.
```

**Then create `.claude/settings.json` at the EDS repo root with Claude Code hooks:**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'file=$(jq -r \".tool_input.file_path // empty\" <<< \"$CLAUDE_HOOK_INPUT\" 2>/dev/null); [[ \"$file\" == *package-lock.json ]] && { echo \"Blocked: do not modify package-lock.json\" >&2; exit 2; } || exit 0'"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'cmd=$(jq -r \".tool_input.command // empty\" <<< \"$CLAUDE_HOOK_INPUT\" 2>/dev/null); if echo \"$cmd\" | grep -q \"git commit\"; then lint_dir=\"$CLAUDE_PROJECT_DIR\"; if [ -f \"$lint_dir/package.json\" ]; then cd \"$lint_dir\" && npm run lint || exit 2; fi; fi'"
          }
        ]
      }
    ]
  }
}
```

These hooks:
- **Block `package-lock.json` writes** — exits 2 (blocked) if any Write or Edit targets a `package-lock.json` file.
- **Run lint before `git commit`** — intercepts Bash `git commit` calls, runs `npm run lint` in `$CLAUDE_PROJECT_DIR` (the EDS repo root, where `package.json` lives), and blocks the commit (exit 2) if lint fails.

> **Important:** `.claude/settings.json` must be at the EDS repo root (not inside `.skills-workspace/`) so Claude Code picks up the hooks when the user opens the EDS repo.

Confirm to the user:
> "Created workspace at `<cwd>/.skills-workspace`. Now let's configure your credentials."

**IMPORTANT:** `FORMS_WORKSPACE` must be the first entry in `.env`. Every CLI tool reads this value from `.env` to resolve the workspace directory. All subsequent credentials are appended below it in the same file.

### Step 3: Collect credentials one by one

Ask for each value individually. After the user provides a value, confirm it and move to the next. Follow this exact order:

#### Required credentials

Collect these in two passes: **conversational values** first, then **token placeholders**.

**Pass 1 — Ask in conversation (safe to paste in terminal):**

| # | Variable | What to ask | Help text |
|---|----------|-------------|-----------|
| 1 | `AEM_HOST` | "What is your AEM Author URL?" | Pattern: `https://author-pXXXX-eYYYY.adobeaemcloud.com`. Find it in Cloud Manager → Program → Environment → Author URL. |

**Pass 2 — Write placeholder, user pastes directly into `.env`:**

| # | Variable | Placeholder written to `.env` | Instructions to give user |
|---|----------|-------------------------------|---------------------------|
| 3 | `AEM_TOKEN` | `AEM_TOKEN=<paste-your-bearer-token-here>` | "Open `.env` in your editor and replace `<paste-your-bearer-token-here>` with your AEM bearer token. Get it from Developer Console → Integrations → Local Token → Get Local Development Token. Tokens expire after 24h." |

> **Why not paste tokens in the chat?** Bearer tokens contain special characters (`+`, `/`, `=`) that are silently corrupted by terminal escaping when pasted into a conversation prompt. Pasting directly into the `.env` file bypasses the terminal entirely and preserves the token exactly as-is.

After writing the placeholders, tell the user:
> "I've written your `.env` file with a placeholder line for `AEM_TOKEN`. Please open `.skills-workspace/.env` in your editor and paste the actual value on that line. Let me know when you're done and I'll test the connection."

#### Optional credentials

Offer these but don't require them:

| Variable | Default | What to ask |
|----------|---------|-------------|
| `AEM_FORM_CONFIG_PATH` | inherited from template | "What is the AEM Configuration path to use for your forms? (optional — skip to inherit from the blank form template)" |

#### Handling "skip" or "I'll do it later"

If the user says skip for any variable (including non-token values), write it as a commented placeholder:

```
# AEM_HOST=<your-aem-author-url>
```

And note to the user which values are still pending. Token placeholders are always written as uncommented lines with `<paste-...>` markers — the user replaces the marker with the real value.

#### Handling alternative auth

If the user says they use basic auth instead of a bearer token:
- Skip `AEM_TOKEN`
- Ask for `AEM_USERNAME` and `AEM_PASSWORD` instead

### Step 4: Write `.env`

Copy `env.sample` from the plugin assets directory to `.skills-workspace/.env`:

```bash
cp "${CLAUDE_PLUGIN_ROOT}/skills/forms-orchestrator/assets/env.sample" .skills-workspace/.env
```

Then substitute the collected values in-place — replace `<absolute-path>`, `<collected-value>`, and placeholder markers with actual values gathered in Step 3. For tokens, leave the `<paste-...>` marker as-is — the user will paste directly into the file.

After writing the file, tell the user to open it and paste their token:
> "I've saved your `.env` file. One value needs your attention — open `.skills-workspace/.env` in your editor and replace the placeholder marker for `AEM_TOKEN` with your actual token. Let me know when you're done."

**Never echo secrets back** to the user. Do not read or print token values from `.env` after the user has pasted them.

Wait for the user to confirm they've pasted the token before proceeding to Step 5.

### Step 5: Verify system requirements

Check that required tools are available:

```
node --version    # must be v18+
python3 --version # must be 3.10+
git --version
```

If any are missing, tell the user exactly what to install and from where.

### Step 6: Test AEM connectivity

Run from the workspace:

```bash
source .skills-workspace/.env && \
  curl -sf -o /dev/null -H "Authorization: Bearer $AEM_TOKEN" "${AEM_HOST}/api/assets.json" \
  && echo "AEM OK" || echo "AEM connectivity check failed"
```

If it fails:
- Identify which credential is wrong from the error message
- If it's a **token** issue (401/403): tell the user to open `.env` and re-paste the token directly. Do NOT ask them to paste it in the conversation — terminal escaping will corrupt it.
- If it's a **non-token** issue (wrong URL, etc.): ask for the corrected value conversationally, update `.env`
- Re-test

### Step 7: Add `.skills-workspace` to EDS repo's `.gitignore`

The workspace folder must not be tracked by the EDS repo's git:

```bash
echo '.skills-workspace' >> .gitignore
```

Confirm to the user:
> "Added `.skills-workspace` to `.gitignore` so the workspace is not tracked by the EDS repo."

### Step 8: Confirm and hand off

> "Your workspace is ready at `<cwd>/.skills-workspace`. The EDS repo root is `<cwd>` — all form code changes go directly into `blocks/form/` here. What would you like to build?"

## System Requirements

| Requirement | Minimum | Why |
|-------------|---------|-----|
| Node.js | 18+ | Runs the form validator, rule transformer, and rule save tools |
| Python | 3.10+ | Runs rule validation scripts |
| `git` | on PATH | Version control for EDS code changes in the repo |


## Sites Content MCP Server

The `forms-author` skill communicates with AEM through the Sites Content MCP server. Add it once per environment — restart Claude Code after adding.

### AEM as a Cloud Service (default)

```bash
claude mcp add --transport http aem-sites-content \
  https://mcp.adobeaemcloud.com/adobe/mcp/content
```

Auth is IMS OAuth — a browser login window opens automatically on first use.

### Local AEM SDK / Quickstart (alternative)

**Step 1 — Add the MCP server**

```bash
claude mcp add aem-sites-content -- node /tmp/aem-sites-contentapi-mcp-server/build/index.js
```

Set these environment variables for the MCP server process:

```
AEM_AUTHOR_URL=http://localhost:4502
AEM_AUTHOR_AUTH_PARAMETER=admin:admin
ASSETS_ACCESS_TOKEN=dummy
```

The server source is available at [github.com/adobe/aem-sites-contentapi-mcp-server](https://github.com/adobe/aem-sites-contentapi-mcp-server). Build it and place the output at `/tmp/aem-sites-contentapi-mcp-server/build/index.js`.

**Step 2 — Install the forms components package**

1. Open `http://localhost:4502/crx/packmgr`
2. Upload and install `core-forms-components-examples-all-3.0.150.zip`

This installs the `forms-components-examples` component group that all Adaptive Form fields depend on.

**Step 3 — Install the content package**

1. Open `http://localhost:4502/crx/packmgr`
2. Upload and install `default-site.zip`

This creates:
- `/content/forms/af/default-site/` — the default site root
- `/conf/forms/default-site/settings/wcm/templates/af-blank-v2` — the blank form template
- `/content/forms/af/default-site/blank-form` — use this as the template source when `forms-author` asks for a template page path

Restart Claude Code after adding the MCP server in either setup.

## Figma MCP Server

The `forms-style-screen` skill uses the Figma MCP server to extract exact design values (colors, spacing, typography) from Figma URLs. This is optional — screenshot-only mode works without it.

### Setup

**Step 1 — Add `FIGMA_API_KEY` to `.env`**

```
# ── Figma (optional — required for forms-style-screen Figma-enhanced mode) ──
FIGMA_API_KEY=<paste-your-figma-api-key-here>
```

Generate a key at [figma.com/settings](https://www.figma.com/settings) → Security → Personal access tokens. Paste directly into `.env` — do not paste in the conversation.

**Step 2 — Add the MCP server**

```bash
claude mcp add figma -- npx -y figma-developer-mcp --figma-api-key=$FIGMA_API_KEY
```

Or if the Figma MCP is already registered in `.mcp.json`, ensure `FIGMA_API_KEY` is set in `$FORMS_EDS_ROOT/.env` before starting Claude Code.

Restart Claude Code after adding. The MCP is optional — if not configured, `forms-style-screen` falls back to screenshot-only mode (±1–3 hex point color accuracy from JPG compression).

## Workspace Directory Structure

```
<eds-repo-root>/                   ← EDS GitHub repo (user's working directory)
├── .claude/
│   └── settings.json              ← Claude Code hooks: blocks package-lock.json edits, runs lint before git commit
├── .gitignore                     ← must contain .skills-workspace
├── blocks/form/                   ← Edit EDS form code directly here
│   ├── functions.js
│   ├── mappings.js
│   ├── scripts/
│   ├── api-clients/
│   └── components/
├── package.json
└── .skills-workspace/             ← agent workspace (gitignored from EDS repo)
    ├── .env                       ← FORMS_WORKSPACE + FORMS_EDS_ROOT + AEM creds
    ├── CLAUDE.md                  ← Claude Code guidance: plugin path, checklists, conventions
    ├── .agent/                    ← Agent memory — handover, history, session log
    │   ├── handover.md
    │   ├── history.md
    │   └── sessions.md
    ├── refs/
    │   ├── metadata.json          ← Fragment registry
    │   └── apis/                  ← OpenAPI 3.0 YAML specs and generated clients
    └── journeys/
        └── <journey>/             ← One directory per journey
            ├── spec.md            ← Journey spec produced by forms-analysis
            └── plans/             ← Execution plans generated by planner
                ├── 01-screen.md
                ├── 02-rules.md
                └── ...
```

### What each directory is for

| Directory | Purpose |
|-----------|---------|
| `blocks/form/` | EDS form code — edit directly in the EDS repo (scripts, api-clients, components) |
| `.skills-workspace/refs/` | Read-only references — fragment registry and API specs |
| `.skills-workspace/journeys/` | One sub-directory per journey — contains `spec.md` and `plans/` with execution plans |
| `.skills-workspace/.agent/` | Agent memory — handover state, history, and session log for continuity across sessions |

## Workspace Resolution

All CLI tools shipped with the plugin auto-resolve the workspace directory by reading `FORMS_WORKSPACE` from `.env`. This value is written during Step 2 of this setup flow. If the value is not found, tools fall back to the current working directory.

**Resolution order (first match wins):**

1. **`FORMS_WORKSPACE` already in environment** — e.g. exported by the caller
2. **`FORMS_WORKSPACE` read from `.env` in cwd** — written during this setup flow
3. **Fall back to cwd** — backwards-compatible default

> **Key point:** `FORMS_WORKSPACE` must be the first entry in `.env`. `FORMS_EDS_ROOT` points to the EDS repo root where EDS code lives.

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `FORMS_WORKSPACE` | Yes (auto) | Absolute path to `.skills-workspace/` root — first line of `.env`, written during setup, read by all tools |
| `FORMS_EDS_ROOT` | Yes (auto) | Absolute path to EDS repo root — parent of `.skills-workspace/`; all EDS code (`blocks/form/`) lives here |
| `AEM_HOST` | Yes | AEM Cloud Service Author URL |
| `AEM_FORM_CONFIG_PATH` | No | JCR path to AEM configuration node used for forms (e.g. `/conf/forms/default-site`). If unset, config is inherited from the blank form template page. |
| `AEM_TOKEN` | Yes* | Bearer token from AEM Developer Console |
| `AEM_USERNAME` | Yes* | Basic auth username (alternative to token) |
| `AEM_PASSWORD` | Yes* | Basic auth password (alternative to token) |
| `FIGMA_API_KEY` | No | Figma personal access token — required for `forms-style-screen` Figma-enhanced mode |
| `DEBUG` | No | Set to `true` to enable rule bridge debug output |

*Either `AEM_TOKEN` or `AEM_USERNAME` + `AEM_PASSWORD` must be provided.

## CLI Tools Reference

| Tool | Location | Purpose |
|------|----------|---------|
| `transform-jcr.jsh` | `skills/forms-rule-author/scripts/` | Transform JCR form JSON for rule editing |
| `transform-content-model.jsh` | `skills/forms-rule-author/scripts/` | Transform content model JSON for rule editing |
| `validate-rule.jsh` | `skills/forms-rule-author/scripts/` | Validate rule AST against grammar |
| `generate-formula.jsh` | `skills/forms-rule-author/scripts/` | Compile rule AST → JSON Formula |
| `merge-formula.jsh` | `skills/forms-rule-author/scripts/` | Merge compiled formula back into form |
| `parse-functions.jsh` | `skills/forms-rule-author/scripts/` | Parse custom function JSDoc annotations |

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `node: command not found` | Node.js not installed | Install Node.js 18+ from [nodejs.org](https://nodejs.org) |
| `python3: command not found` | Python not installed | Install Python 3.10+ from [python.org](https://python.org) |
| `AEM_HOST not set` | Missing `.env` or missing variable | Re-run setup or manually add `AEM_HOST` to `.env` |
| Tool reads wrong `.env` | `FORMS_WORKSPACE` missing from `.env` | Add `FORMS_WORKSPACE=/absolute/path/.skills-workspace` as the first line of `.env` |
| Tool writes files in wrong directory | `FORMS_WORKSPACE` missing from `.env` | Add `FORMS_WORKSPACE=/absolute/path/.skills-workspace` as the first line of `.env` |
| `401 Unauthorized` from AEM | Token expired or invalid | Regenerate bearer token from AEM Developer Console |
| Form not found via MCP | Wrong JCR path | Use `get-aem-pages(authorPath: "<path>")` to discover the correct pageId first |
| `.env` committed to git | Security risk | Add `.env` to `.skills-workspace/.gitignore` immediately; rotate all exposed credentials |
| Hooks not firing | `.claude/settings.json` in wrong location | Make sure `.claude/settings.json` is at the EDS repo root, not inside `.skills-workspace/` |

## Headless Workspace Validation

To validate an already-configured workspace non-interactively (e.g. from a CI script or at the start of a session), run Claude in print mode from the workspace directory:

```bash
claude -p "Validate my AEM EDS Forms workspace. Check:
1. The aem-forms plugin is installed — list all available skills.
2. The .env file exists and has non-placeholder values for AEM_HOST and AEM_TOKEN.
3. Run an AEM connectivity check: source .skills-workspace/.env && curl -sf -o /dev/null -H \"Authorization: Bearer \$AEM_TOKEN\" \"\${AEM_HOST}/api/assets.json\" && echo AEM OK.
Report a status table with columns: Check | Status (PASS/FAIL) | Action needed." \
  --allowedTools "Read,Bash,Glob,Grep"
```

This is useful for:
- **Session start** — paste once to confirm the workspace is healthy before starting work
- **CI pre-flight** — run before automated form generation to surface expired tokens or missing credentials early
- **Debugging** — if a session is behaving unexpectedly, re-run this to rule out environment problems

The command exits non-zero if Claude encounters an error, so it can be gated in scripts. Credentials are read from `.env` and never printed.
