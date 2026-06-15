---
name: fix-classification
description: Error-to-fix-type classification tables and page-level/repo-search fix strategies for the fix-form-js-errors skill.
type: reference
---

# Fix-Type Classification

## By fileUrl pattern

Used in Phase 2C (Mode B) and Phase 2A (telemetry) of `fix-form-js-errors`.

| Condition | Fix type |
|-----------|----------|
| `fileUrl` ends in `.js` (not minified) | JS-file fix |
| `fileUrl` is a page URL (no `.js`, line 1) | Page-level fix |
| No URL, filename given | Repo-search fix |
| `fileUrl` ends in `.min.js` or filename contains a hash | Minified JS ⚠️ — skip, flag, suggest source maps |
| Network error / CDN failure | Skip |
| 3rd-party URL (adobedtm.com, etc.) | Skip |

## Telemetry deduplication (Phase 2A)

Merge entries with the **same message + file** (different line/casing). Sum `count`. Prefer the entry with the higher count as the canonical record.

## Page-level fix strategy

These are ReferenceErrors where `file` is a page URL (no `.js`), typically `line: 1`. A symbol is called from an inline `<script>` or HTML event attribute but never defined.

Before spawning the sub-agent, grep the repo:

```bash
grep -r "<MISSING_SYMBOL>" <REPO_PATH> --include="*.js" --include="*.html" -l
```

| grep result | Fix |
|-------------|-----|
| Found with call but no definition | Add `typeof` guard at the call site |
| Definition exists, call is in inline HTML | Guard the inline call |
| Not found anywhere | Add defensive stub: `window.SYMBOL = window.SYMBOL \|\| function () {};` near top of `scripts/scripts.js` |

Pass the grep results to the sub-agent with the page URL instead of a `.js` URL.

## Repo-search fix strategy

Used when no URL is present but a filename is given.

```bash
find <REPO_PATH> -name "<file>" -not -path "*/node_modules/*"
```

- Single match → proceed as a standard JS-file sub-agent using the local path.
- Multiple matches → show the list to the user and ask which to use.
