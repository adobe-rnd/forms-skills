# Model Compatibility

## Goal

Maintain consistent skill and tool performance across different AI models while preserving the ability to benefit from stronger models when they are available.

This matters because the same skill can behave differently across models. In recent usage, `Sonnet 4.6` and `Opus 4.6` both completed the work, but `Opus 4.6` tended to resolve issues faster and with fewer corrective turns. The compatibility goal is not to force identical behavior. The goal is to keep skills reliable, predictable, and recoverable across model tiers.

## Core Principle

Design skills so that weaker or faster models still succeed through structure, while stronger models can use their extra reasoning capacity without depending on hidden intuition.

In practice, this means:

- put workflow-critical rules in explicit instructions, not implied context
- reduce ambiguity in skill routing, file paths, and expected outputs
- prefer deterministic scripts and validators for fragile operations
- define checkpoints where the model must validate before proceeding
- treat model quality differences as an optimization problem, not a correctness dependency

## What Changes Across Models

Different models usually vary on these axes:

| Dimension | Lower performing model behavior | Higher performing model behavior | Compatibility response |
| --- | --- | --- | --- |
| Instruction following | More likely to skip implied steps | More likely to infer missing steps correctly | Make required steps explicit and ordered |
| Tool selection | May choose the wrong skill or use tools too early | Usually routes more accurately | Narrow the trigger conditions and required prechecks |
| Error recovery | May stop at the first failure or ask too early | More likely to diagnose and retry | Encode retry rules and fallback behavior in the skill |
| Context handling | More likely to lose constraints in long sessions | Better at preserving multi-step context | Keep skills compact and split reference material cleanly |
| Output quality | More likely to produce partial or approximate artifacts | More likely to produce complete outputs | Use validation gates and acceptance criteria |

## Compatibility Strategy

### 1. Optimize for the weakest supported model

Write the skill so it succeeds on the least capable model you expect to use regularly. If the skill only works well on a stronger model, the skill is underspecified.

This usually means:

- explicit step order
- explicit file locations
- explicit stop conditions
- explicit validation commands
- explicit success criteria

### 2. Move fragile behavior out of prompts

If a task is repeatedly done wrong, it should not remain as free-text guidance only.

Prefer these moves:

- prompt instruction -> checklist
- checklist -> template
- template -> script
- script -> validator or guardrail

Examples:

- plugin path resolution should be a hard rule, not a suggestion
- form schema checks should be validated by tooling, not by model judgment alone
- deploy readiness should depend on concrete checks such as token validity, lint status, and file placement

### 3. Separate behavior requirements from execution steps

A model performs better when the skill distinguishes between:

- what must be true
- how to implement it
- how to verify it

A compact plan or skill should therefore include:

- `Behavior Requirements`
- `Implementation Notes`
- `Steps to Execute`
- `Acceptance Criteria`

This reduces failure modes where a model jumps into implementation before understanding the expected behavior.

### 4. Add enforced checkpoints

Long workflows degrade more on weaker models. Break them into checkpoints with required validation.

Recommended checkpoint pattern:

1. resolve inputs and paths
2. show or confirm plan
3. generate artifact
4. validate artifact
5. only then continue to deploy or the next phase

### 5. Keep the skill body small

Larger models tolerate bloated skills better. Smaller models degrade faster when the skill mixes routing rules, domain reference material, and implementation detail in one place.

Use progressive disclosure:

- keep `SKILL.md` focused on workflow and constraints
- move detailed examples to `references/`
- move deterministic operations to `scripts/`
- keep templates in `assets/`

## Model-Specific Guidance

| Model tier | Recommended use | Risk | Mitigation |
| --- | --- | --- | --- |
| Fast / lower-cost models | Setup, scaffolding, narrow edits, repetitive transforms | Missed constraints, weaker recovery, more drift in long sessions | Use strict checklists, short phases, validator-backed tasks |
| Strong reasoning models | Ambiguous workflows, debugging, recovery, multi-file planning, failure analysis | Higher token cost | Reserve for high-ambiguity or failure-prone phases |

For your current experience:

- `Opus 4.6` is better suited for ambiguous planning, issue diagnosis, and recovery-heavy sessions.
- `Sonnet 4.6` can still be effective for structured execution if the skill and plan are explicit enough.
- The system should not require `Opus 4.6` for correctness. It should only benefit from it for speed, fewer retries, and better judgment.

## Skill Design Rules

Use these rules when writing or revising skills:

| Rule | Why |
| --- | --- |
| Put non-negotiable rules near the top of the skill | Reduces early routing and setup mistakes |
| State exact file paths and path resolution rules | Prevents model-dependent path guessing |
| Use numbered steps for workflow order | Weaker models follow explicit sequences more reliably |
| Require validation before deploy or handoff | Prevents partial success from being treated as completion |
| Prefer tables for structured specs | Reduces interpretation variance across models |
| Prefer small reusable skills over one overloaded skill | Limits context drift |
| Include fallback instructions for known failures | Improves recovery without user intervention |

## Tooling Rules

To preserve compatibility across models, tools should carry more of the correctness burden.

Prefer tools that:

- validate outputs deterministically
- fail with specific and actionable errors
- produce structured output instead of prose
- make file/path assumptions explicit
- can be re-run safely

Good candidates for tool-backed validation:

- form schema validation
- path and workspace checks
- auth token verification
- lint and formatting checks
- deployment readiness checks

## Performance Roster

To maintain a roster of skill performance across models, evaluate the same plan with the same set of skills and compare the results using a small, repeatable scorecard.

The two core metrics are:

1. response acceptance ratio
2. execution time for the same plan and skills

### 1. Response acceptance ratio

This measures how often the model produces a response or action that you accept without requiring a rejection or correction.

Use this formula:

`acceptance ratio = accepted responses / total responses`

Where:

- `accepted responses` means a response, action, or proposed step was accepted and used as-is
- `rejected responses` means the response had to be corrected, retried, replaced, or discarded
- `total responses = accepted responses + rejected responses`

Example:

- accepted responses: `8`
- rejected responses: `2`
- acceptance ratio: `8 / 10 = 0.80`

This metric is useful because it captures how much supervision a model needs to complete the same workflow.

### 2. Execution time

This measures how long each model takes to complete the same plan while using the same set of skills.

Use this formula:

`execution time = plan completion timestamp - plan start timestamp`

Measure time consistently:

- use the same plan file
- use the same input requirements
- use the same skills and tools
- start timing when execution of the plan begins
- stop timing when the plan reaches its defined completion point

This metric is useful because a model may be accurate but still slower due to extra retries, longer reasoning, or less efficient recovery.

## Recommended Comparison Table

Use a single row per model and plan execution.

| Model | Plan | Skills Used | Accepted | Rejected | Acceptance Ratio | Start Time | End Time | Execution Time | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Opus 4.6` | `Plan 03` | `create-form`, `add-rules` | 9 | 1 | 0.90 | 10:00 | 10:18 | 18 min | Resolved validation issue without help |
| `Sonnet 4.6` | `Plan 03` | `create-form`, `add-rules` | 7 | 3 | 0.70 | 10:00 | 10:29 | 29 min | Needed correction on rule ordering |

## Interpreting The Roster

Use the roster to answer these questions:

- Which model has the highest acceptance ratio for a given plan type?
- Which model completes the same plan faster?
- Which skills cause the most rejections across models?
- Which plan types require a stronger model to avoid supervision overhead?

Read the metrics together, not in isolation:

- high acceptance ratio and low execution time indicates strong fit
- high acceptance ratio and high execution time indicates reliable but slower execution
- low acceptance ratio and low execution time indicates fast but supervision-heavy behavior
- low acceptance ratio and high execution time indicates poor fit for that workflow

## Evaluation Framework

When testing a skill against multiple models, compare them using the same task and score them on these criteria:

| Criterion | Question |
| --- | --- |
| Accuracy | Did the model produce the correct artifact? |
| Completion | Did it complete the full workflow without stalling? |
| Recovery | Did it recover from errors without excessive intervention? |
| Instruction fidelity | Did it follow path rules, validation rules, and stop conditions? |
| Efficiency | How many turns, retries, or corrections were needed? |
| Token cost | Was the quality improvement worth the extra cost? |
| Acceptance ratio | How often were responses accepted without correction? |
| Execution time | How long did the same plan take to complete? |

A practical rule:

- if a stronger model is only slightly better, improve the skill structure
- if a stronger model is dramatically better, the skill is likely depending on implicit reasoning
- if acceptance ratio is low across all models, the skill or plan is underspecified
- if execution time varies widely with similar acceptance ratio, the difference is mainly efficiency, not correctness

## Recommended Operating Model

Use a tiered approach:

1. Default to the cheaper or faster model for structured, validated workflows.
2. Escalate to the stronger model for ambiguous planning, debugging, and recovery-heavy work.
3. Feed the lessons from stronger-model sessions back into the skill so the weaker model improves over time.
4. Track the acceptance ratio and execution time per model so routing decisions are based on evidence instead of preference.

That creates a loop where model differences expose skill gaps, and the skill becomes more robust after each revision.

## Practical Decision Standard

A skill is model-compatible when:

- it succeeds reliably on the baseline supported model
- stronger models improve speed and quality, not basic correctness
- validation catches incorrect outputs before deployment
- known failure cases have explicit recovery guidance
- token growth stays bounded because the skill remains compact
- the performance roster shows acceptable acceptance ratio and execution time for the intended workflow

## Recommendation For Forms Skills

For the forms skills and tools, keep the current architecture but revise skills and plan templates to be more model-resilient:

- tighten plan structure so behavior, constraints, and execution are separate
- move repeated operational checks into scripts or validators
- keep routing skills thin and explicit
- use stronger models selectively for planning and recovery
- maintain a performance roster for each important plan type and skill combination
- measure success by reduced retries, improved acceptance ratio, and reduced execution time, not just final completion
