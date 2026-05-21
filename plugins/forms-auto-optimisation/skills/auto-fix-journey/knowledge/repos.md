---
name: repos
description: Maps Java package prefixes to git repository URLs and local clone paths. Used by auto-fix-journey Step 7 to locate source files for backend AEM Forms classes found in Splunk logs.
---

# Repository Manifest

No pre-population needed — the skill auto-populates this file as it encounters new repos.
`local_clone_path` always points to `~/auto-fix-journey-clones/<repo-name>` (the skill's
standard landing zone); never hardcode user-specific paths like `/tmp/` or `~/Desktop/`.

## Package → Repo map

| java_package_prefix | git_url | local_clone_path | branch |
|---------------------|---------|-----------------|--------|

> Rows are appended automatically when the skill resolves a new repo. Do not add `/tmp/` or
> other session-scoped paths — they will be invalid on the next run.

---

## How the skill uses this file

This file is a **fallback only** — the skill prefers impact-analyser (`ia triage`) to route errors to repos and files. This file is consulted when IA is unavailable or triage produces no output.

1. The skill matches `SHORT_CLASS` / `FULL_CLASS` against `java_package_prefix`.
2. If a match is found and `local_clone_path` is set and valid: uses it directly.
3. If `local_clone_path` is missing or the path is not a valid git repo: searches `$HOME` broadly with `find $HOME -maxdepth 6 -type d -name <repo>`, then auto-clones to `~/auto-fix-journey-clones/<repo>` using `git_url`. Only asks the user if both strategies fail.
4. If no match: asks the user for the repo URL and branch, then appends a new row here.
5. Source file is located with: `find <local_clone_path> -name "<short_class>.java" -not -path "*/test/*"`.

---

## Notes

- If `local_clone_path` is missing or invalid but `git_url` is set, the skill auto-clones to `~/auto-fix-journey-clones/<repo-name>` and updates this entry.
- If no row matches the error class at all, the skill asks for the git URL once, clones automatically, then appends a new row here.
- The skill never force-pushes and always creates a fix branch (`fix/auto-fix-journey-<slug>-<date>`).
- Keep `branch` set to the base branch the PR should target.
