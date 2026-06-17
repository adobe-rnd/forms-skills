---
name: ia-glossary
description: Impact-analyser CLI flags, common failure modes, and AEM-clientlib triage gotchas. Read when a triage or analyse call returns empty or fails unexpectedly.
type: reference
---

# Impact-Analyser Glossary

The `ia` CLI is installed and invoked through `shared/scripts/resolve-ia.sh`. This reference covers the things the skill body should never have to inline.

## Invocation rule

```bash
eval $IA_CMD <subcommand> <args>
```

`IA_CMD` may be `ia` (when on PATH) or `node /path/to/cli/index.js` (after auto-install). Because the second form contains a space, **always** use `eval $IA_CMD …` — bare `$IA_CMD …` makes zsh/bash treat the whole string as the executable name and fails with "no such file or directory".

## Key subcommands

| Command | Purpose | Required flags |
|---|---|---|
| `ia triage` | Map an error to graph nodes (repo, file, symbol chain) | `--graph` + (`--stack-trace <file>` OR `--symbol <suffix>`) |
| `ia analyse` | Blast-radius of a set of changed files | `--diff <file>` + (`--graph` for D1/D3 OR `--concept-only` for D2-only) |

`--config <yaml>` is optional for `analyse`; the run still produces D1/D2/D3 sections when the graph is present.

## AEM clientlib gotchas

### Minified URLs are never in the graph

Form telemetry reports URLs like:

```
https://applyonline.example.com/etc.clientlibs/HDFC_PLForms/clientlibs/foo.min.ACSHASH<hash>.js
```

The graph stores **source paths**, not the AEM-served minified URLs. Rewrite before triaging:

```
/etc.clientlibs/{app}/clientlibs/{lib}.min.ACSHASH<hash>.js
  →  {app}/ui.apps/src/main/content/jcr_root/apps/{app}/clientlibs/{lib}/js/
```

`shared/scripts/ia-triage.sh` does this rewrite.

### `--symbol <bareFunctionName>` always returns unresolved

`ia triage --symbol` only resolves `JavaClass`, `OSGiService`, and file-path suffixes. A bare JS function name like `showPreviewScreen` is **never** matched — JsFunction nodes use IDs of the form `{Repo}/path/to/file.js#functionName`.

Correct sequence for clientlib JS errors:

1. Extract the function name from the stack frame (`showPreviewScreen@https://...`).
2. Query the graph SQLite for a JsFunction node matching that name:
   ```sql
   SELECT id FROM nodes
   WHERE id LIKE '%#showPreviewScreen' AND type='JsFunction'
   LIMIT 1;
   ```
3. Strip `#functionName` to get the source `.js` path.
4. Use the last three path segments as the `--symbol` value (e.g. `clientlib-personal-loan/js/bre3.js`) — this **is** a file suffix and resolves.
5. Fall back to path-based `--stack-trace` triage if the SQLite lookup finds nothing.

`shared/scripts/ia-triage.sh` implements this fallback chain.

## Concept-only mode

When the graph is unavailable (download failed, no `.cache/impact-graph.sqlite`):

```bash
eval $IA_CMD analyse --diff <file> --concept-only
```

D1 (code-impact) and D3 (form/journey) sections will be empty. D2 (concept matching) still runs against the diff.

## Node ABI 115

The pre-built CLI bundles `better_sqlite3` compiled for Node 20 (ABI 115). Running under Node ≥ 21 crashes with `MODULE_VERSION mismatch`. `resolve-ia.sh` detects this and rewrites `IA_CMD` to use an NVM-installed Node 20 binary. If no Node 20 is present, the script surfaces a clear `unavailable` reason and the skill degrades to "no triage / no impact analysis".
