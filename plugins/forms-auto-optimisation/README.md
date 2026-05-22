# forms-auto-optimisation

Automated AEM Forms error diagnosis and repair. Contains two skills:

## Skills

### `auto-fix-form` — Frontend JS Error Fixing

End-to-end workflow for diagnosing and fixing AEM/EDS form errors. Queries optel telemetry for frontend JS errors, presents them for user selection, uses the impact-analyser graph to trace error origins across the repo landscape, generates a fix plan the user iterates on until approved, applies patches through parallel sub-agents, gates through `performance-bot --diff`, runs blast-radius impact analysis to propagate analogous fixes into dependent repos, and raises a PR per repo.

**Entry points:**
- Provide a form URL → skill queries optel for errors automatically
- Provide a stack trace directly → skips telemetry, goes straight to planning

### `auto-fix-journey` — Backend Java Error Fixing

Diagnoses and fixes backend Java errors in AEM Forms. Four entry points: (1) Telemetry mode — provide a form URL, skill queries optel for API errors and lets user select which to fix; (2) Fix mode — provide a stack trace or class+line; (3) API Error mode — provide an API path or error label (e.g. "High API Errors"), skill queries Splunk; (4) Splunk mode — explicit log exploration.

Uses the impact-analyser graph for repo/file routing and runs post-fix blast-radius analysis.

---

## Prerequisites

| Tool | Required by | Notes |
|------|------------|-------|
| `git` | both skills | must be in PATH |
| `gh` CLI | both skills | must be authenticated to `adobe-aem-forms` org — run `gh auth status` |
| Node 20 | auto-fix-form | used by `impact-analyser` CLI; avoid Node 22+ due to `better-sqlite3` ABI issues |
| Python 3 + `splunk-sdk` | auto-fix-journey (Splunk mode only) | `pip install splunk-sdk` |

**Auto-installed on first run** (no manual setup needed):
- `impact-analyser` CLI — cached at `~/.impact-analyser/`
- `performance-bot` CLI — cached at `~/.performance-bot/`
- `impact-graph.sqlite` — downloaded to `~/.impact-analyser/`

The `gh` CLI must have access to `adobe-aem-forms` org repositories. If you have multiple GitHub accounts, the skills auto-detect which account has access.

---

## Required `.claude/settings.json` Permissions

Add the following to your project's `.claude/settings.json` to avoid permission prompts:

```json
{
  "permissions": {
    "allow": [
      "Bash(git *)",
      "Bash(gh release *)",
      "Bash(gh pr *)",
      "Bash(gh auth *)",
      "Bash(gh repo *)",
      "Bash(git clone *)",
      "Bash(node ~/.impact-analyser/cli/index.js *)",
      "Bash(sqlite3 *)",
      "Bash(mkdir -p ~/.impact-analyser*)",
      "Bash(tar -xzf /tmp/impact-analyser-cli-*)",
      "Bash(curl -L https://github.com/adobe-aem-forms/performance-bot/releases/latest/download/performance-bot-cli.tar.gz)",
      "Bash(tar -xz -C ~/.performance-bot)",
      "Bash(mkdir -p ~/.performance-bot)",
      "Bash(node ~/.performance-bot/index.js *)",
      "Bash(python3 *)",
      "Bash(grep *)",
      "Bash(find *)",
      "Bash(sed *)",
      "Bash(awk *)",
      "Read(~/.impact-analyser/**)",
      "Read(~/.performance-bot/**)",
      "Read(/tmp/**)"
    ]
  }
}
```
