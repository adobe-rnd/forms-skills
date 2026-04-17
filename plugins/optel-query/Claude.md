# optel-query

A pair of skills for querying and analyzing AEM Operational Telemetry (RUM) data, runnable in both SLICC and Claude Code (Node 18+).

## Skills

- **`skills/optel-query/`** — builds structured RUM queries and executes them via the bundled `optel-query.jsh` script. Auto-activates for RUM/analytics questions.
- **`skills/optel-analyze-errors/`** — analyzes JavaScript errors from RUM query output, using `improved-error-similarity.jsh` to deduplicate across browsers.

## Running

**SLICC:** both skills are auto-discovered when this repo is mounted into the VFS (or installed via `upskill`). The two `.jsh` scripts are callable by basename from any directory.

**Claude Code / Node (18+):**
```bash
cd skills/optel-query/scripts && npm install
node skills/optel-query/scripts/optel-query.jsh <domain> <start> <end> [opts]
node skills/optel-analyze-errors/scripts/improved-error-similarity.jsh <input.json> <output-prefix>
```

## Environment

- `DOMAINKEY_FILE` (required for the query script) — path to a JSON map `{"<domain>": "<key>"}`. Read before each query; new keys fetched via admin are written back.
- `RUM_ADMIN_KEY` (optional) — admin token used to fetch a missing domain key. If unset and the domain is not in `DOMAINKEY_FILE`, the script errors.

## Workflow

1. **Parse** the user's question: domain, date range, subject, expected output.
2. **Build** a structured query using the query-building guidance in `skills/optel-query/SKILL.md`.
3. **Execute** via `optel-query.jsh`; persist the result under `output/<use-case-folder>/`.
4. **Parse** the JSON. For error reporting, run the result through the `optel-analyze-errors` skill.
5. **Answer** directly with supporting numbers.

## Layout

```
Readme.md
Claude.md                          # this file
Agents.md                          # pointer → Claude.md
skills/
├── optel-query/
│   ├── SKILL.md
│   ├── references/                # facets, checkpoints, series, examples (load on demand)
│   └── scripts/
│       ├── optel-query.jsh
│       └── package.json
└── optel-analyze-errors/
    ├── SKILL.md
    └── scripts/
        └── improved-error-similarity.jsh
evals/                             # agent-level behavior tests
```

## Notes

- This is no longer a Claude Code plugin — there is no `.claude-plugin/` manifest and no `/query` slash command.
- The loader handles any date range via internal chunking. Do not split windows in the agent. Use `--interval` on the CLI to override auto-granularity only when the user explicitly asks for full-fidelity data.
