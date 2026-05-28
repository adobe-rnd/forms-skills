---
name: branch-and-commit
description: Fix-branch naming, commit message structure, push, and PR-raising rules shared by auto-fix-form and auto-fix-journey.
type: reference
---

# Branch, Commit, Push, PR

## Fix-branch naming

```
fix/auto-fix-<slug>-<YYYY-MM-DD>
```

`<slug>` is:
- `auto-fix-form`: the last non-empty path segment of `FORM_URL`, slugified. Fallback: `$(basename "$REPO_PATH")`.
- `auto-fix-journey`: the `SHORT_CLASS` of the throw site, slugified.

If the branch already exists on remote, append `-v2`, `-v3`, … :

```bash
FIX_BRANCH="fix/auto-fix-${SLUG}-${TODAY}"
_v=2
while git -C "$REPO" ls-remote --exit-code --heads origin "$FIX_BRANCH" >/dev/null 2>&1; do
  FIX_BRANCH="fix/auto-fix-${SLUG}-${TODAY}-v${_v}"
  _v=$((_v + 1))
done
```

## Creating the branch

```bash
git -C "$REPO" checkout "$BASE_BRANCH"
git -C "$REPO" pull origin "$BASE_BRANCH"
git -C "$REPO" checkout -b "$FIX_BRANCH"

# Verify before any commit
CURRENT=$(git -C "$REPO" rev-parse --abbrev-ref HEAD)
[[ "$CURRENT" == fix/auto-fix-* ]] || { echo "ABORT: HEAD is $CURRENT"; exit 1; }
```

`BASE_BRANCH` is the repo's default branch unless the user supplied one — resolve with `git symbolic-ref refs/remotes/origin/HEAD | sed 's|refs/remotes/origin/||'`.

## Staging

Only stage orchestrator-tracked files. Never `git add -A` / `git add .`:

```bash
echo "$FIXED_FILES" | xargs -I{} git -C "$REPO" add -- {}
```

## Commit message

```
fix: <N> form errors + <M> perf-bot violations on <form page name>

Repo: <basename $REPO>
Errors fixed:
- <file:line> — <explanation>
- ...

Performance-bot violations fixed (--diff HEAD):
- <file:line> — <type> — <explanation>
- ...
```

For `auto-fix-journey`, the structure is:

```
fix: auto-fix <N> backend errors in AEM Forms journey

Errors fixed:
- <ClassName:line> — <explanation>
- ...
```

## Push

```bash
git -C "$REPO" push -u origin "$FIX_BRANCH"
```

On push failure: print the failing command, do not retry, surface in PR body's "Manual review needed" as `branch not pushed`.

## PR

```bash
ORG_REPO=$(gh repo view "$REPO" --json nameWithOwner -q .nameWithOwner 2>/dev/null \
           || git -C "$REPO" remote get-url origin \
              | sed -E 's#(git@|https://)github.com[:/]##; s#\.git$##')

gh pr create \
  --repo "$ORG_REPO" \
  --base "$BASE_BRANCH" \
  --head "$FIX_BRANCH" \
  --title "<title>" \
  --body "$(cat <<'EOF'
<body — see skill-specific PR template>
EOF
)"
```

If `gh` is not installed or fails, print the compare URL instead:
`https://github.com/$ORG_REPO/compare/$BASE_BRANCH...$FIX_BRANCH`

## Pre-conditions (the only rule table)

| Tool call | Pre-condition |
|---|---|
| `Edit` / `Write` (source file) | Plan approved AND `HEAD` is a `fix/auto-fix-*` branch AND patch came from sub-agent JSON |
| `git commit` | Perf-bot ran (auto-fix-form) OR Java fix applied (auto-fix-journey) AND `HEAD` is the fix branch |
| `git push` | `git commit` succeeded |
| `gh pr create` | `git push` succeeded (or the fallback compare URL is being printed) |
