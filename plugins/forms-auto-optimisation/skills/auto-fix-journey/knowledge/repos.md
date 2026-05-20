---
name: repos
description: Maps Java package prefixes to git repository URLs and local clone paths. Used by auto-fix-journey Step 7 to locate source files for backend AEM Forms classes found in Splunk logs.
---

# Repository Manifest

One-time setup: fill in the entries below. Each row maps a Java package prefix to a git repo.
When `short_class` is found in Splunk results, the skill matches its full class name against
`java_package_prefix` to determine which repo to clone.

## Package → Repo map

| java_package_prefix | git_url | local_clone_path | branch |
|---------------------|---------|-----------------|--------|
| `com.hdfc.aem.forms` | `https://github.com/hdfc/aem-forms-core` | `/tmp/aem-forms-core` | `main` |
| `com.hdfc.journey` | `https://github.com/hdfc/journey-service` | `/tmp/journey-service` | `main` |

> **Add rows here as new repos are encountered.** The skill will ask for a repo URL the first
> time it encounters a `short_class` whose package prefix does not match any row, and will
> append the new entry automatically.

---

## How the skill uses this file

This file is a **fallback only** — the skill prefers impact-analyser (`ia triage`) to route errors to repos and files. This file is consulted when IA is unavailable or triage produces no output.

1. The skill matches `SHORT_CLASS` / `FULL_CLASS` against `java_package_prefix`.
2. If a match is found and `local_clone_path` is set and valid: uses it directly.
3. If `local_clone_path` is missing or the path is not a valid git repo: asks the user for the local clone path — **never auto-clones**.
4. If no match: asks the user for the repo URL and branch, then appends a new row here.
5. Source file is located with: `find <local_clone_path> -name "<short_class>.java" -not -path "*/test/*"`.

---

## Notes

- If `local_clone_path` is missing or invalid but `git_url` is set, the skill auto-clones to `~/auto-fix-journey-clones/<repo-name>` and updates this entry.
- If no row matches the error class at all, the skill asks for the git URL once, clones automatically, then appends a new row here.
- The skill never force-pushes and always creates a fix branch (`fix/auto-fix-journey-<slug>-<date>`).
- Keep `branch` set to the base branch the PR should target.
