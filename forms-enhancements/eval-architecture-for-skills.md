# Eval Framework for Agentic Skill Repos

A two-layer testing strategy for repositories that contain LLM-driven skills: deterministic script evals that run on every PR, and LLM-judged agentic evals that run nightly. Applicable to any repo where an LLM follows structured instructions, calls tools, and invokes helper scripts to accomplish tasks.

---

## Table of Contents

1. [Why Eval Agentic Skills?](#why-eval-agentic-skills)
2. [Architecture Overview](#architecture-overview)
3. [Layer 1: Script Evals](#layer-1-script-evals)
4. [Layer 2: LLM Evals](#layer-2-llm-evals)
5. [Fixture System](#fixture-system)
6. [CI/CD Integration](#cicd-integration)
7. [Design Principles](#design-principles)
8. [Getting Started — Step by Step](#getting-started--step-by-step)
9. [Appendix: Reference Implementation](#appendix-reference-implementation)

---

## Why Eval Agentic Skills?

Traditional unit tests cover deterministic code. But agentic skills have two distinct failure modes:

1. **Script bugs** — a validation script rejects valid input, a transformation produces wrong output. These are deterministic and testable with classic input/output assertions.
2. **Instruction regressions** — after editing `SKILL.md`, the agent starts routing requests to the wrong sub-skill, calling tools in the wrong order, or producing semantically incorrect outputs. These are non-deterministic and invisible to unit tests.

The eval framework addresses both with a layered approach: fast deterministic tests for scripts, and LLM-judged agentic tests for instruction-driven behavior.

---

## Architecture Overview

Agentic skills typically have two layers of logic:

- **Instruction files** (`SKILL.md` or equivalent) that tell the LLM what to do, when to call tools, and how to orchestrate multi-step workflows.
- **Helper scripts** (bundled CLIs, serverless functions, or any deterministic executable) that the LLM invokes for validation, data transformation, lookups, and other non-LLM work.

The eval framework tests both independently:

```
                          ┌──────────────────────────────────┐
                          │         Skill Repository         │
                          │                                  │
                          │   SKILL.md (agent instructions)  │
                          │   scripts/ (deterministic CLIs)  │
                          │   references/ knowledge-base/    │
                          └──────────┬───────────┬───────────┘
                                     │           │
                    ┌────────────────┘           └────────────────┐
                    ▼                                             ▼
          ┌─────────────────┐                          ┌─────────────────┐
          │  Layer 1: Script│                          │  Layer 2: LLM   │
          │  Evals          │                          │  Evals          │
          │                 │                          │                 │
          │  Deterministic  │                          │  Agentic loop   │
          │  No API calls   │                          │  Mock ext. tools│
          │  Every PR       │                          │  Real scripts   │
          │  < 1 minute     │                          │  Judge rubrics  │
          │                 │                          │  Nightly        │
          └─────────────────┘                          └─────────────────┘
```

**Why two layers?**

| Concern | Script Evals | LLM Evals |
|---|---|---|
| What breaks | Script logic, data contracts | Intent routing, workflow orchestration, semantic correctness |
| Cost per run | Zero (no API calls) | ~$0.10–$1.00 per scenario (model dependent) |
| Determinism | Fully deterministic | Stochastic (optimistic retry handles variance) |
| Speed | Seconds | Minutes |
| When to run | Every push, every PR | Nightly schedule, manual trigger |

---

## Layer 1: Script Evals

### Purpose

Test every helper script in isolation: give it fixture inputs, assert on exit code and output structure. No LLM, no network, no API keys needed.

This layer catches regressions in the deterministic parts of your skill — the validation logic, data transformations, lookup functions, and any other scripts the agent invokes during its workflow.

### Scenario Format

Each scenario is a JSON file in `evals/scenarios/<category>/<nn>-<name>.json`:

```json
{
  "id": "validate-input-happy-path",
  "description": "Valid input passes validation and returns normalized output",
  "script": "scripts/validate-input.bundle.js",
  "args": {
    "--input": "@fixtures/valid-input.json",
    "--schema": "fixture:schema.json"
  },
  "expectedExitCode": 0,
  "expectedOutput": {
    "valid": true,
    "errors": []
  }
}
```

**Fields:**

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique scenario identifier |
| `description` | Yes | Human-readable description of what is being tested |
| `script` | Yes | Relative path from skill root to the executable script |
| `args` | Yes | Named CLI arguments. Values support fixture references (see below) |
| `positionalArgs` | No | Array of positional arguments passed before named flags |
| `expectedExitCode` | Yes | Expected process exit code (0 for success, 1 for validation errors) |
| `expectedOutput` | No | Partial JSON structure to match against stdout. Omit to only check exit code |

### Fixture References in Args

Two prefixes resolve fixture files differently, supporting different CLI calling conventions:

| Prefix | Resolves to | Use case |
|---|---|---|
| `@fixtures/file.json` | Inline JSON string (file contents read into the arg value) | For flags that accept a JSON string directly |
| `fixture:file.json` | Absolute file path to the fixture | For flags that accept a file path |

Anything without a prefix is passed through as-is.

### Deep Partial Matching

Output validation uses partial matching rather than exact equality:

- **Objects**: every key in `expectedOutput` must exist and match in the actual output; extra keys in actual are ignored.
- **Arrays**: element-wise partial match by index; actual may have additional elements.
- **Primitives**: exact equality.

This is intentional — scripts often return metadata fields (timing, version, debug info) that shouldn't break tests when they change. You assert on the fields you care about and ignore the rest.

### Runner Implementation

The script eval runner is ~190 lines of vanilla Node.js with zero dependencies:

1. **Discovery**: recursively finds all `.json` files under `evals/scenarios/`, skips any with `"type": "llm"`.
2. **Resolution**: expands `@fixtures/` and `fixture:` prefixes in arg values.
3. **Execution**: spawns each script with `child_process.spawnSync` (configurable timeout, default 15s).
4. **Assertion**: checks exit code, then runs partial match on parsed stdout vs. `expectedOutput`.
5. **Reporting**: colored pass/fail per scenario, failure details, summary line.
6. **Filtering**: `--filter <substring>` runs only matching scenario paths.

```bash
# Run all script evals
node evals/scripts/run-evals.js

# Run only scenarios matching "validate"
node evals/scripts/run-evals.js --filter validate
```

### What to Cover

Write script evals for every helper script your skill provides. Minimum coverage:

| Pattern | What to assert | Example |
|---|---|---|
| **Happy path** | Valid inputs produce expected output structure | Input validation returns `{ valid: true }` |
| **Validation errors** | Invalid inputs exit with code 1, return structured errors | Missing required field returns `{ valid: false, errors: [...] }` |
| **Edge cases** | Empty inputs, boundary values, missing optional fields | Empty array input returns empty result, not a crash |
| **Disambiguation** | When a script resolves ambiguous input, test the resolution logic | Multiple candidates with a hint selects the right one |

---

## Layer 2: LLM Evals

### Purpose

Test end-to-end skill behavior: does the agent classify intent correctly, call the right tools in the right order, and produce semantically correct outputs? These run the actual skill instructions against a Claude model in an agentic tool-calling loop, with external tools mocked and local scripts executed for real.

### Scenario Format

```json
{
  "id": "routes-to-correct-handler",
  "type": "llm",
  "description": "A create request routes to the creation workflow, not the update workflow",
  "userMessage": "Create a new contact form with name and email fields",
  "toolResponses": {
    "list-resources": {
      "items": [{ "id": "site-1", "title": "Main Site" }]
    },
    "get-resource": "@fixtures/empty-resource.json",
    "update-resource": { "status": "ok" }
  },
  "rubric": [
    {
      "id": "invokes-create-not-update",
      "description": "The model calls the create-resource tool (not update-resource) as the first mutation",
      "required": true
    },
    {
      "id": "includes-both-fields",
      "description": "The creation payload includes both a name field and an email field",
      "required": true
    },
    {
      "id": "confirms-result",
      "description": "The model fetches the resource after creation to confirm it was created",
      "required": false
    }
  ]
}
```

**Fields:**

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique scenario identifier |
| `type` | Yes | Must be `"llm"` — this is how the LLM runner distinguishes from script scenarios |
| `description` | Yes | What behavior is being tested and why it matters |
| `userMessage` | Yes | Natural language request sent as the first user turn |
| `toolResponses` | Yes | Map of tool name to mock response. Supports `@fixtures/` references. File tools and shell execution run for real — only external/MCP tools are mocked |
| `rubric` | Yes | Array of criteria the judge evaluates the transcript against |

**Rubric criteria:**

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Short kebab-case identifier |
| `description` | Yes | Detailed description of what to check. Be specific — this is the judge's only guidance |
| `required` | No | Default `true`. Set to `false` for bonus/nice-to-have criteria that don't block pass/fail |

### Runner Implementation

The LLM eval runner orchestrates three phases per scenario:

#### Phase 1: System Prompt Construction

Loads the skill's instruction files and concatenates them. This gives the agent model the same instructions it would have in a real session. If your skill has sub-skills, knowledge bases, or grammar files, include those too:

```javascript
const INSTRUCTION_PATHS = [
  path.join(SKILL_DIR, 'SKILL.md'),
  // Sub-skill instructions, knowledge-base articles, etc.
];

function buildSystemPrompt() {
  return INSTRUCTION_PATHS
    .map(p => fs.readFileSync(p, 'utf8'))
    .join('\n\n---\n\n');
}
```

#### Phase 2: Agentic Loop

The runner calls the Anthropic Messages API in a loop (configurable max turns, default 12), providing mock tool implementations:

```
User message → Agent model → tool_use → dispatch → tool_result → Agent model → ...
```

**Tool dispatch logic:**

| Tool category | Behavior |
|---|---|
| Shell execution (`bash`) | Actually executes the command. Helper scripts run for real |
| File tools (`Read`, `Write`, `Glob`, `Grep`) | Real filesystem operations against the skill repo |
| External/MCP tools | Returns mock response from the scenario's `toolResponses`. Returns an error if no mock is configured |

This hybrid approach — real scripts, mocked external services — tests the actual computation pipeline while keeping tests reproducible, offline, and free from external service dependencies.

#### Phase 3: Judge Evaluation

A separate, typically stronger model evaluates the full transcript against each rubric criterion:

```
Judge receives:
  - User's original message
  - Full transcript (assistant messages, tool_use calls, tool_result responses)
  - Rubric criteria list

Judge returns:
  [
    { "id": "criterion-id", "passed": true, "reason": "The model called X before Y" },
    { "id": "other-criterion", "passed": false, "reason": "Expected X but model did Y" }
  ]
```

The scenario passes if **all `required: true` criteria** pass.

### Optimistic Retry

LLM outputs are stochastic. A scenario runs up to `EVAL_ATTEMPTS` times (default: 2) and passes on the first success. This prevents false failures from random model variance without masking real regressions.

- If a scenario passes on attempt 1, no retry needed.
- If it fails on attempt 1 but passes on attempt 2, it's treated as a pass (stochastic variance).
- If it fails on all attempts, it's a real regression.

Override for stricter CI: `EVAL_ATTEMPTS=3`

### Auth Configuration

The runner auto-detects auth (first match wins):

| Priority | Env Var | Backend | Typical Use |
|---|---|---|---|
| 1 | `ANTHROPIC_API_KEY` | Direct Anthropic API | Local development |
| 2 | `AWS_BEARER_TOKEN_BEDROCK` | Bedrock bearer token | Manual CI |
| 3 | AWS credential chain | Bedrock SigV4 | CI with OIDC role assumption |

Extend this chain if your organization uses a different LLM provider or gateway.

### Model Selection

| Role | Purpose | Recommendation |
|---|---|---|
| Agent | Runs the skill in the agentic loop | Smallest model that can follow your instructions. If Haiku can do it, your instructions are clear enough |
| Judge | Evaluates the transcript against rubric criteria | At least as capable as the agent. A stronger judge (e.g., Sonnet judging Haiku) increases eval reliability |

Both are configurable via environment variables (`EVAL_AGENT_MODEL`, `EVAL_JUDGE_MODEL`).

Using a small agent model intentionally is a design choice: it keeps costs low and exposes instruction ambiguities that a stronger model would paper over. If Haiku struggles with your skill, the instructions need work — not a bigger model.

### What to Cover

Focus on behaviors that are instruction-driven and non-deterministic:

| Category | What to Test | Example |
|---|---|---|
| **Routing** | Intent classification, sub-skill dispatch | Does a "create" request route to the create workflow, not update? |
| **Semantic correctness** | Mapping user intent to the right data structures | Does "make X visible when Y" produce a visibility rule, not a change handler? |
| **Workflow invariants** | Multi-step orchestration rules | Are batch operations sent as a single API call, not one per item? |
| **Parameter resolution** | Correct derivation of IDs, paths, references | Does the agent resolve a human-readable path to an internal ID before using it? |
| **Error handling** | Graceful degradation when tools return errors | Does the agent ask for clarification instead of retrying with the same bad input? |
| **Guardrails** | Things the agent must NOT do | The agent must not invent fields that weren't in the user's request |

---

## Fixture System

All test data lives in `evals/fixtures/` and represents real (or realistic) data from the target system. Fixtures are shared across both eval layers.

### Organizing Fixtures

Group fixtures by what they represent, not which test uses them:

| Category | Description | Used by |
|---|---|---|
| **Domain objects** | Core data structures your skill operates on (forms, pages, documents, configs) | Script evals (input data), LLM evals (mock read responses) |
| **Schemas/definitions** | Type definitions, component schemas, API specs | Script evals (validation input) |
| **API responses** | Full responses from external services including metadata (eTag, pagination, etc.) | LLM evals (mock tool responses) |
| **Derived structures** | Transformed outputs used as intermediate data (trees, indexes, lookups) | Script evals (expected output comparison) |
| **Error cases** | Invalid inputs, malformed structures, edge-case data | Script evals (validation error scenarios) |

### Design Guidelines

1. **Use real data.** Export actual objects from your target system. Synthetic data hides edge cases — unexpected nulls, inconsistent casing, extra metadata fields.
2. **Keep fixtures small.** A 3-item collection tests the same logic as a 30-item collection. Small fixtures make failure messages readable and tests fast.
3. **Share across layers.** The same domain object serves as input to a script eval and as a mock API response in an LLM eval. One source of truth.
4. **Version with the repo.** When the target system's data format changes, update fixtures and re-run evals. Fixture drift is a signal that your skill may need updating.
5. **Name descriptively.** `content-model-contact-us.json` beats `test-data-1.json`. The fixture name should tell you what it contains without opening it.

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Evals

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * *'   # Nightly at 02:00 UTC

jobs:
  # ── Layer 1: Runs on every push and PR ───────────────────────────
  script-evals:
    name: Script Evals
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Run script evals
        run: node evals/scripts/run-evals.js

  # ── Layer 2: Nightly + manual only (cost control) ───────────────
  llm-evals:
    name: LLM Evals
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
    permissions:
      id-token: write    # For OIDC-based auth (Bedrock, etc.)
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Configure auth for your LLM provider.
      # Example: AWS Bedrock with OIDC role assumption
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.LLM_PROVIDER_ROLE_ARN }}
          aws-region: ${{ secrets.LLM_PROVIDER_REGION || 'us-east-1' }}

      - name: Install LLM eval deps
        working-directory: evals
        run: npm ci
      - name: Run LLM evals
        working-directory: evals
        run: node scripts/run-llm-evals.js
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Script evals on every PR | Zero cost, fast feedback, catches regressions immediately |
| LLM evals on schedule only | Cost control — each run makes multiple LLM API calls. Manual trigger (`workflow_dispatch`) available for pre-merge verification when needed |
| OIDC for cloud LLM auth | No long-lived secrets stored in CI. Short-lived tokens minted per run |
| Separate `evals/package.json` | LLM eval deps (SDK for your LLM provider) stay isolated from the skill itself. Script evals have zero deps |

---

## Design Principles

### 1. Push logic into deterministic scripts

Every piece of logic that *can* be a script *should* be a script. Validation, data transformation, lookups, type resolution, schema checking — these are all deterministic. Deterministic scripts get deterministic tests (Layer 1), which are fast, free, and reliable. The LLM is left with intent classification, orchestration, and natural language understanding — the things only an LLM can do.

This principle also improves the skill itself: the more logic lives in scripts, the more predictable and testable the overall system becomes.

### 2. Mock the boundary, execute the logic

LLM evals mock external service calls (MCP tools, APIs) but execute internal scripts for real. This tests the actual computation pipeline end-to-end while keeping tests reproducible and offline. If a script has a bug, both layers catch it — Layer 1 catches it faster.

The boundary between "real" and "mocked" should match the boundary between "your code" and "external services." Everything inside your repo runs for real; everything outside returns a fixture.

### 3. Judge with rubrics, not string matching

LLM output is non-deterministic. Don't assert on exact text, specific tool call order, or message count. Instead, define rubric criteria that describe the *behavior* you expect, and let a judge model evaluate the full transcript. This approach:

- Handles rephrased text, reordered tool calls, and extra assistant messages gracefully.
- Catches semantic failures that pattern matching misses ("called the right tool but with the wrong parameter").
- Produces human-readable failure reasons from the judge.

**Writing good rubric criteria:**

- Be specific: "The model calls `create-resource` before `update-resource`" not "The model does things in the right order."
- State what to check AND what would be wrong: "Uses visibility rule, NOT change handler."
- Write as if briefing a human reviewer who has never seen your skill.
- Mark nice-to-have criteria as `required: false` so they don't block CI on non-critical behaviors.

### 4. Optimistic retry handles stochasticity

A scenario that fails once might pass on the next run due to LLM randomness. Running 2–3 attempts and passing on the first success prevents false failures without masking real regressions. If a scenario fails on all attempts, it's a real problem worth investigating.

### 5. Use the smallest viable agent model

If your skill instructions are clear enough for Haiku, they're clear enough for any model. Testing with a smaller agent model:

- Keeps eval costs low (critical for nightly runs).
- Exposes instruction ambiguities that a stronger model would silently work around.
- Proves that your skill's intelligence lives in the instructions and scripts, not in model capability.

If an eval only passes with Opus but fails with Haiku, the fix is usually better instructions, not a bigger model.

### 6. Fixtures are real data

Use data exported from the actual target system, not hand-crafted synthetics. Real data contains edge cases (unexpected nulls, inconsistent casing, extra fields) that synthetic data misses. Keep fixtures small but realistic — a 3-item collection exercises the same code paths as a 30-item collection.

### 7. Separate cost tiers

Script evals are free and run on every PR — they're the first line of defense. LLM evals cost money and run nightly — they catch instruction regressions and integration issues. This tiered approach gives fast feedback on code changes while still testing the full agentic loop regularly.

Don't run LLM evals on every PR unless you have budget and tolerance for occasional stochastic failures in PR checks.

---

## Getting Started — Step by Step

### Step 1: Directory Structure

Create this layout in your skill repo:

```
your-skill/
  SKILL.md                        # Skill instructions
  scripts/                        # Helper scripts (bundled CLIs, etc.)
  evals/
    package.json                  # LLM eval deps only (e.g., @anthropic-ai/sdk)
    scripts/
      run-evals.js                # Script eval runner
      run-llm-evals.js            # LLM eval runner
    fixtures/                     # Shared test data
      domain-object-a.json
      api-response-b.json
    scenarios/
      <script-category>/          # One dir per script
        01-happy-path.json
        02-validation-error.json
      <behavior-category>/        # One dir per behavior concern
        01-routes-correctly.json   (type: "llm")
        02-handles-error.json      (type: "llm")
```

### Step 2: Write the Script Eval Runner

The script eval runner is generic. Copy the reference implementation and update three values:

1. **`SKILL_DIR`** — absolute path to your repo root.
2. **`FIXTURES_DIR`** — path to your fixtures directory.
3. **Timeout** — adjust if your scripts need more than 15 seconds.

The core functions (`findScenarios`, `resolveArg`, `partialMatch`, `runScenario`) work unchanged for any script-based skill. The full implementation is ~190 lines with zero dependencies.

### Step 3: Write Script Eval Scenarios

For each helper script, write at least:

1. One happy-path scenario (valid input, `expectedExitCode: 0`, check output structure).
2. One error scenario (invalid input, `expectedExitCode: 1`, check error structure).

```json
{
  "id": "my-script-valid-input",
  "description": "Valid input returns normalized result",
  "script": "scripts/my-script.bundle.js",
  "args": {
    "--data": "@fixtures/valid-data.json",
    "--format": "json"
  },
  "expectedExitCode": 0,
  "expectedOutput": {
    "status": "ok",
    "normalized": true
  }
}
```

### Step 4: Write the LLM Eval Runner

The LLM eval runner requires more customization. Key areas to adapt:

**System prompt construction** — point to your instruction files:

```javascript
const INSTRUCTION_PATHS = [
  path.join(SKILL_DIR, 'SKILL.md'),
  // Add sub-skill, knowledge-base, or reference file paths
];
```

**Tool declarations** — declare the tools your skill uses. File tools (`Read`, `Write`, `Glob`, `Grep`) and `bash` can be kept as-is for real execution. Add your external/MCP tools with their schema — these will be mocked from scenario fixtures:

```javascript
const TOOLS = [
  // File tools — keep as-is, execute for real
  { name: 'Read', description: '...', input_schema: { /* ... */ } },
  { name: 'bash', description: '...', input_schema: { /* ... */ } },
  // Your external tools — mocked from toolResponses
  { name: 'your-api-tool', description: '...', input_schema: { /* ... */ } },
];
```

**Tool dispatch** — the loop dispatches tool calls. The pattern is:
- `bash` → `execSync` (real execution)
- `Read`/`Write`/`Glob`/`Grep` → real filesystem operations
- Everything else → look up in `toolResponses`, return mock or error

**Auth and models** — configure for your LLM provider and select agent/judge models.

### Step 5: Write LLM Eval Scenarios

For each critical behavior, write a scenario that:

1. Sends a realistic `userMessage`.
2. Provides mock responses for every external tool the agent might call.
3. Defines rubric criteria for the specific behavior being tested.

Start with these categories:

| Category | First scenario to write |
|---|---|
| Routing | Does a [type A] request route to handler A, not handler B? |
| Correctness | Does [user intent X] produce [data structure Y], not [common mistake Z]? |
| Workflow | When doing multi-step operation, does step 2 use the output of step 1? |

### Step 6: Add CI

Add the GitHub Actions workflow (or equivalent for your CI provider):

- **Script evals**: run on every push/PR, no secrets needed.
- **LLM evals**: run on schedule + manual trigger, configure auth for your LLM provider.
- Keep LLM eval deps isolated in `evals/package.json`.

---

## Appendix: Reference Implementation

The `forms-content-authoring` repository contains a complete working implementation of this framework. It tests an AEM Forms content-authoring skill with three sub-skills, 15 bundled CLI scripts, and MCP-based tool integrations.

### Files

All paths are relative to the repo root (`/Users/anirudhaggar/Documents/aem/codes/adobe-aem-forms/content-authoring-skill`):

| File | Purpose | Lines |
|---|---|---|
| [`/evals/scripts/run-evals.js`](/Users/anirudhaggar/Documents/aem/codes/adobe-aem-forms/content-authoring-skill/evals/scripts/run-evals.js) | Script eval runner | ~190, zero deps |
| [`/evals/scripts/run-llm-evals.js`](/Users/anirudhaggar/Documents/aem/codes/adobe-aem-forms/content-authoring-skill/evals/scripts/run-llm-evals.js) | LLM eval runner | ~590, one dep (`@anthropic-ai/bedrock-sdk`) |
| [`/evals/scenarios/`](/Users/anirudhaggar/Documents/aem/codes/adobe-aem-forms/content-authoring-skill/evals/scenarios) | 27 script + 10 LLM scenarios | |
| [`/evals/fixtures/`](/Users/anirudhaggar/Documents/aem/codes/adobe-aem-forms/content-authoring-skill/evals/fixtures) | 13 shared fixture files | |
| [`/evals/package.json`](/Users/anirudhaggar/Documents/aem/codes/adobe-aem-forms/content-authoring-skill/evals/package.json) | LLM eval deps (isolated from skill) | |
| [`/.github/workflows/evals.yml`](/Users/anirudhaggar/Documents/aem/codes/adobe-aem-forms/content-authoring-skill/.github/workflows/evals.yml) | CI pipeline | |

### Script Eval Coverage (27 scenarios)

Organized by script, covering happy paths and error cases:

| Script | Scenarios | What's tested |
|---|---|---|
| `check-name-collision` | 2 | Name uniqueness validation |
| `content-model-to-tree` | 1 | Data structure transformation |
| `filter-definition` | 1 | Schema filtering/slimming |
| `find-field` | 3 | Field lookup by name (found, not-found, multi-name) |
| `find-rule-refs` | 2 | Cross-reference scanning |
| `generate-formula` | 1 | AST-to-formula compilation |
| `get-component-def` | 1 | Schema profile extraction |
| `list-form-fields` | 2 | Flat listing with metadata |
| `resolve-component-type` | 2 | Type resolution with disambiguation |
| `resolve-insert-position` | 2 | Position calculation |
| `rewrite-rule-refs` | 1 | Reference rewriting after rename |
| `validate-add` | 2 | Object validation against schema |
| `validate-merge` | 2 | Compound structure validation |
| `validate-patch` | 3 | Patch operation type-checking |
| `validate-rule` | 2 | Grammar validation |

### LLM Eval Coverage (10 scenarios)

Organized by behavior concern:

| Category | Scenarios | What's tested |
|---|---|---|
| **Routing** | 5 | Path resolution, not-found handling, intent classification (add-field vs. add-rule vs. compound) |
| **Semantic correctness** | 3 | Rule-type mapping: show/hide maps to visibility rule (not change handler), on-change maps to change handler, required-when maps to validation rule |
| **Workflow invariants** | 2 | Batch operations use single API call; post-mutation workflows re-fetch state before next step |

### Model Configuration

| Role | Direct API default | Bedrock default |
|---|---|---|
| Agent | `claude-haiku-4-5-20251001` | `us.anthropic.claude-3-5-haiku-20241022-v1:0` |
| Judge | `claude-sonnet-4-6` | `us.anthropic.claude-3-5-haiku-20241022-v1:0` |
