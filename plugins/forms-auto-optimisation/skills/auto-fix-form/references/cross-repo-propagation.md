---
name: cross-repo-propagation
description: How auto-fix-form propagates an approved fix to dependent repos identified by the impact-analyser graph. Loaded only when the primary fix succeeded and IA returned dependent repos.
type: reference
---

# Cross-Repo Fix Propagation

Best-effort phase that runs **after** the primary repo's working tree is fully patched (Phase 4 errors + Phase 5 perf-bot fixes) and **before** the commit. Never blocks the primary PR — if anything in this flow fails, the primary commit + PR still happen.

## When to invoke

Only when **all** of these hold:

- `IA_UNAVAILABLE` is empty (resolve-ia.sh succeeded).
- The primary repo's working tree has at least one applied patch.
- `ia analyse` produced a non-empty JSON output (see Step 1 below).

If any condition fails, skip straight to commit/push/PR and add a one-line "cross-repo propagation skipped" note to the PR body.

## Step 1 — Run `ia analyse` and capture JSON

```bash
RUN_DIR="${FORM_AUTO_FIX_RUNS}/<form-slug>-<TODAY>"
IA_DIFF="$RUN_DIR/ia-diff-files.txt"
IA_JSON="$RUN_DIR/impact-analysis.json"
IA_MD="$RUN_DIR/impact-analysis.md"

git -C "$REPO_PATH" diff --name-only HEAD \
  | while IFS= read -r f; do echo "$REPO_PATH/$f"; done > "$IA_DIFF"

eval $IA_CMD analyse $IA_CONFIG_FLAG \
  --diff "$IA_DIFF" \
  $IA_GRAPH_FLAG $IA_CONCEPT_ONLY \
  --format json > "$IA_JSON" 2>"$RUN_DIR/ia-stderr.txt"

node -e "
  const d = JSON.parse(require('fs').readFileSync('$IA_JSON','utf8'));
  require('fs').writeFileSync('$IA_MD', d.markdown || '');
" 2>/dev/null
```

`IA_JSON` feeds Step 2; `IA_MD` is embedded verbatim in the PR body's "Impact Analysis" section.

## Step 2 — Extract impacted repos

```bash
IMPACTED=$(node -e "
  const d = JSON.parse(require('fs').readFileSync('$IA_JSON','utf8'));
  const repos = new Set();
  (d.codeChanges || []).forEach(c => {
    if (c.props?.repo) repos.add(c.props.repo);
    const seg = (c.id || '').split('/')[0];
    if (seg && !seg.includes('.')) repos.add(seg);
  });
  (d.affectedForms || []).forEach(f => {
    if (Array.isArray(f) && f[1]) repos.add(String(f[1]).split('/')[0]);
  });
  repos.delete('$(basename "$REPO_PATH")');
  console.log([...repos].filter(Boolean).join('\n'));
" 2>/dev/null)
```

Empty list → skip the rest of this file.

## Step 3 — Resolve a local clone per impacted repo

For each `REPO_NAME` in `$IMPACTED`:

```bash
eval "$(bash ../../shared/scripts/resolve-repo.sh --name "$REPO_NAME" \
        --clone-url "$(extract_clone_url_from_ia_config "$REPO_NAME")")"
```

`extract_clone_url_from_ia_config` is a tiny helper the skill body inlines (5 lines of `node -e` reading `$IA_CONFIG`). If `REPO_SOURCE == "ask"`, the repo is recorded as "Clone failed — manual check needed" in the PR body and the loop moves on.

## Step 4 — Spawn cross-repo fix sub-agents

For each `(REPO_NAME, REPO_PATH)`, spawn one sub-agent per error in `allErrors[]` using `assets/cross-repo-fix-sub-agent-prompt.md`. The prompt is seeded with:

- The full `error` entry from `allErrors[]`.
- The approved plan entry (`root_cause`, `approach`).
- The primary repo's applied patch (as **reference only** — sub-agent must not copy verbatim).
- The IA trail explaining why this repo is connected.
- `REPO_PATH` as the search root.

Parallelism: different repos → parallel; same repo, different errors → sequential (re-read between).

Return JSON per `shared/references/sub-agent-contract.md`.

## Step 5 — Apply patches to dependent repos (no commit yet)

Same loop as the primary repo: `Read` → verify `old_string` uniqueness → `Edit`. Track `crossFixedFiles[REPO_NAME]`. `needs_review` results go to `crossRepoNeedsReview[REPO_NAME]`.

## Step 6 — Perf-bot gate per dependent repo

```bash
bash ../../shared/scripts/perf-bot.sh --mode run --repo "$REPO_PATH"
```

Max 3 iterations, same loop as the primary perf-bot gate (see `references/perf-bot-violations.md`). Skip silently if perf-bot is unavailable — the fix still ships.

## Step 7 — Commit, push, PR per dependent repo

Follow `shared/references/branch-and-commit.md`. The PR body mirrors the primary PR's structure with these section overrides:

1. **Origin** — link to the primary PR + IA graph trail.
2. **Errors fixed** — same table format.
3. **Performance-bot** — violations fixed or "0 violations".
4. **Impact Analysis** — excerpt from `IA_MD` covering this specific repo's D1 trail.
5. **Manual review needed** — `crossRepoNeedsReview[REPO_NAME]`.
6. **Test plan** — focused on the forms/journeys IA identified as reached by this repo.

## Failure handling

| Situation | Action |
|---|---|
| `ia analyse` exits non-zero | Skip this whole file; note in primary PR. |
| `$IMPACTED` is empty | Primary PR notes "no dependent repos identified". |
| Clone fails for a repo | List as "Clone failed — manual check needed". |
| Cross-repo sub-agent returns `needs_review` | Add to `crossRepoNeedsReview[REPO_NAME]`. |
| `old_string` not unique | Re-spawn once with wider context; second failure → `needs_review`. |
| `git push` fails for a dependent repo | `crossRepoNeedsReview[REPO_NAME] += "branch not pushed"`. |
