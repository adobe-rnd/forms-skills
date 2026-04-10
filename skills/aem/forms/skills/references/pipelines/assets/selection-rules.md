---
name: pipeline-selection-rules
description: >
  Rules for selecting and executing a pipeline once matched.
---

# Pipeline Selection Rules

## Selection Algorithm

1. **Explicit pipeline request** — user names a pipeline by ID or title → select it directly
2. **Trigger match** — user intent matches patterns in the Intent Routing table (in `pipelines/SKILL.md`) → select the pipeline
3. **Active plan resume** — `.agent/handover.md` has a 🔵 Active plan → resume that plan's pipeline
4. **Ambiguous** — multiple pipelines match → present options, let user choose
5. **No match** — not a pipeline concern; orchestrator falls through to domain routing

---

## What to Do When Selected

Once a pipeline is selected:

1. Read the pipeline file (e.g., `references/build-journey.md`)
2. Identify the current phase — either the first phase (new pipeline run) or the phase indicated by the active plan
3. Each phase declares a **domain** and **skill** — hand off to the Domain Registry to resolve and execute
4. After each plan completes, follow the pipeline's **checkpoint rules** (defined in the pipeline file)
5. When all plans are ✅ Done, follow the pipeline's **completion rules** (typically: archive to `.agent/history.md`)