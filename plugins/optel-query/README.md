# optel-query

Query and analyze AEM Operational Telemetry (RUM) data from SLICC or Claude Code. Two skills:

- **`optel-query`** — builds RUM queries and executes them via `optel-query.jsh`.
- **`optel-analyze-errors`** — dedupes and analyzes JavaScript errors from RUM query output.

## Installation

### SLICC

Mount this repo into SLICC's VFS or install via `upskill`. Both skills are auto-discovered. The two `.jsh` scripts are callable by basename once discovered.

### Claude Code (Node 18+)

```bash
cd skills/optel-query/scripts
npm install
```

Then invoke:

```bash
node skills/optel-query/scripts/optel-query.jsh <domain> <start> <end> [opts]
```

## Environment

Set in SLICC's UI or via your shell:

- `DOMAINKEY_FILE` — path to a JSON map `{"<domain>": "<key>"}`. Required for the query script; it reads this before every query and writes new admin-fetched keys back.
- `RUM_ADMIN_KEY` — optional. If set, the script will try to fetch a missing domain key via the admin API.

## Usage

See [Claude.md](./Claude.md) for the full workflow and layout. Per-skill guidance lives in each skill's `SKILL.md`:

- [`skills/optel-query/SKILL.md`](./skills/optel-query/SKILL.md)
- [`skills/optel-analyze-errors/SKILL.md`](./skills/optel-analyze-errors/SKILL.md)

### Examples

```bash
# Page views, last week (auto-picks hourly granularity)
node skills/optel-query/scripts/optel-query.jsh example.com 2026-04-08 2026-04-15 --output /tmp/out.json

# Top URLs, last 30 days (auto-picks daily granularity)
node skills/optel-query/scripts/optel-query.jsh example.com 2026-03-16 2026-04-15 --facet-values url

# Core Web Vitals with series
node skills/optel-query/scripts/optel-query.jsh example.com 2026-04-08 2026-04-15 --series lcp,cls,inp

# Force full-fidelity bundles on a 30-day range
node skills/optel-query/scripts/optel-query.jsh example.com 2026-03-16 2026-04-15 --interval hourly
```
