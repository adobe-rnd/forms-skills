# forms-auto-fix

Automated AEM Forms error diagnosis and repair. Two skills plus a small shared toolkit.

## Skills

### `fix-form-js-errors` — Frontend JS error fixing

End-to-end workflow for diagnosing and fixing AEM/EDS form JS errors. Queries optel telemetry, traces error origins through the impact-analyser graph, runs a user-gated fix plan, applies patches via sub-agents, gates the working tree through performance-bot, and raises a PR per affected repo.

Entry points:
- Form URL → telemetry-driven run
- Pasted JS stack frame / `TypeError` / `ReferenceError` → skips telemetry, goes straight to planning

### `fix-forms-java-errors` — Backend Java error fixing

Diagnoses and fixes backend Java errors in AEM Forms. Routes by user input:
- Pasted Java stack trace or `ClassName:line` → Fix mode
- Form URL alone → Telemetry mode
- API path + 4xx/5xx → API Error mode
- Journey UUID / "drill deeper" / Splunk keyword → Splunk mode

Uses the impact-analyser graph for repo routing.

## Shared toolkit

`shared/scripts/` — install / resolve / triage helpers used by both skills:

| Script | Purpose |
|---|---|
| `resolve-workspace.sh` | Ensures `${HOME}/form-auto-fix/{,runs}` exists. |
| `load-env.sh` | Sources `${HOME}/form-auto-fix/.env` and reports missing required vars. |
| `resolve-repo.sh` | Two-strategy repo discovery (cwd → `${HOME}/form-auto-fix/<name>`), with auto-clone fallback. |
| `resolve-ia.sh` | Installs the impact-analyser CLI, downloads the graph + config, handles the Node 20 ABI rewrite. |
| `ia-triage.sh` | Runs `ia triage` for one error with the AEM-clientlib URL rewrite + SQLite JsFunction fallback. |
| `perf-bot.sh` | Installs and runs `performance-bot --diff HEAD` against a repo's dirty working tree. |

`shared/references/` — markdown read on demand:
- `sub-agent-contract.md` — canonical JSON return shapes used by every sub-agent.
- `branch-and-commit.md` — fix-branch naming, commit message, push, PR.
- `ia-glossary.md` — IA flags, common failure modes, the AEM-clientlib gotcha.

---

## Workspace convention

Skill-specific artefacts (cloned repos, run outputs, env vars) live under **`${HOME}/form-auto-fix/`**:

```
${HOME}/form-auto-fix/
├── .env                         # SPLUNK_PASS, SPLUNK_USER, SPLUNK_HOST, etc.
├── <repo-name>/                 # auto-cloned target repos (shared by both skills)
└── runs/<slug>-<YYYY-MM-DD>/    # per-run output, sub-agent prompts, reports
```

Shared CLIs and graph data — independently usable outside these skills — live at their canonical paths:

```
${HOME}/.impact-analyser/
├── cli/index.js                 # IA CLI
├── impact-graph.sqlite          # graph DB
└── impact-analyser.config.yaml

${HOME}/.performance-bot/
└── index.js                     # perf-bot CLI
```

Both sets are auto-installed on first run. Run output never lands inside the user's repo.

---

## Prerequisites

| Tool | Required by | Notes |
|---|---|---|
| `git` | both | in PATH |
| `gh` | both | authenticated to `adobe-aem-forms`; run `gh auth status` |
| Node 20 | `fix-form-js-errors` + IA triage | bundled `better_sqlite3` is ABI 115; Node ≥ 21 → installed Node 20 via NVM is used automatically |
| Python 3 + `splunk-sdk` | `fix-forms-java-errors` Splunk / API Error modes | `pip install splunk-sdk` |

Auto-installed on first run (no manual setup):
- `impact-analyser` CLI → `~/.impact-analyser/cli/`
- `impact-graph.sqlite` + `impact-analyser.config.yaml` → `~/.impact-analyser/`
- `performance-bot` CLI → `~/.performance-bot/`

The `gh` CLI must have access to the `adobe-aem-forms` org. If you have multiple gh accounts, `resolve-ia.sh` auto-detects which one has access.

---

## Required `.claude/settings.json` permissions

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
      "Bash(bash plugins/forms-auto-fix/shared/scripts/*.sh *)",
      "Bash(node ~/.impact-analyser/cli/index.js *)",
      "Bash(node ~/.performance-bot/index.js *)",
      "Bash(sqlite3 *)",
      "Bash(mkdir -p ~/form-auto-fix*)",
      "Bash(mkdir -p ~/.impact-analyser*)",
      "Bash(mkdir -p ~/.performance-bot)",
      "Bash(tar -xzf /tmp/impact-analyser-cli-*)",
      "Bash(tar -xz -C ~/.impact-analyser*)",
      "Bash(tar -xz -C ~/.performance-bot)",
      "Bash(curl -fsSL https://github.com/adobe-aem-forms/performance-bot/*)",
      "Bash(python3 *)",
      "Bash(grep *)",
      "Bash(find *)",
      "Bash(sed *)",
      "Bash(awk *)",
      "Read(~/form-auto-fix/**)",
      "Read(~/.impact-analyser/**)",
      "Read(~/.performance-bot/**)",
      "Read(/tmp/**)"
    ]
  }
}
```
