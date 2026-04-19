# Running AEM Forms skill evals

The evals runner lives in the [`crispy-garbanzo`](../../../../anirudhaggar_adobe/crispy-garbanzo) sibling repo and is installed here as a `file:` dependency.

## One-time setup

```bash
npm install
```

This installs `crispy-garbanzo` from `../../anirudhaggar_adobe/crispy-garbanzo` (relative to this repo root).

## Run a skill's evals

```bash
npx crispy-garbanzo --skill <path-to-skill-dir>
```

Example — create-component:

```bash
npx crispy-garbanzo \
  --skill skills/aem/forms/forms-orchestrator/references/domain-registry/references/build/references/create-component
```

## Approve current results as the new baseline

```bash
npx crispy-garbanzo --skill <path> --approve
```

## Where things live

- Per-skill config, scenarios, and baseline: `<skill>/evals/`
- Shared AEM fixtures (e.g. `form-repo`): ship with `crispy-garbanzo` under `fixtures/aem/`
- Runner code and CLI: in `crispy-garbanzo`
