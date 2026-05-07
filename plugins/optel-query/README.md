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

### SLICC

Open **Settings → Environment Variables** in SLICC's UI and add:

| Variable | Value |
|---|---|
| `DOMAINKEY_FILE` | Absolute path to your keys file, e.g. `/home/user/.rum/domainkeys.json` |
| `RUM_ADMIN_KEY` | *(optional)* Your RUM admin token |

The keys file must exist before you run a query. Create it with at least an empty object if you have no keys yet — the script will populate it on first use when `RUM_ADMIN_KEY` is set:

```bash
echo '{}' > ~/.rum/domainkeys.json
```

### Shell (Claude Code / local)

```bash
# Create the keys file once (skip if it already exists)
mkdir -p ~/.rum
echo '{}' > ~/.rum/domainkeys.json

# Export for the current session
export DOMAINKEY_FILE=~/.rum/domainkeys.json
export RUM_ADMIN_KEY=<your-admin-token>   # optional
```

To make them permanent, add both `export` lines to your `~/.zshrc` (or `~/.bashrc`).

#### Key file format

```json
{
  "example.com": "abc123...",
  "another-site.com": "xyz789..."
}
```

The script reads this file before every query. When `RUM_ADMIN_KEY` is set and a domain is missing, the script fetches the key from the admin API and writes it back automatically.

- `DOMAINKEY_FILE` — **required**. Path to the JSON domain-key map described above.
- `RUM_ADMIN_KEY` — optional. If set, the script will fetch a missing domain key via the admin API and cache it in `DOMAINKEY_FILE`.

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
