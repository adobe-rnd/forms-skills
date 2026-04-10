---
name: pipeline-contribution-guide
description: >
  How to add, remove, or deprecate pipelines in the registry.
---

# Pipeline Contribution Guide

## Pipeline Template

All pipeline definition files must follow the standard pipeline template:

[`templates/pipeline-template.md`](templates/pipeline-template.md)

---

## Adding a New Pipeline

1. **Copy the template:** [`templates/pipeline-template.md`](templates/pipeline-template.md) → `references/<pipeline-name>.md`
2. **Update frontmatter:** Set `name`, `description`, `type: pipeline`
3. **Define the phase graph:** Add/remove/reorder phases, define gates on edges
4. **Fill in phase definitions:** Domain, skill, input, output, gate for each phase
5. **Define checkpoint rules:** Post-plan is the default; opt in to post-phase if needed
6. **Register in the Catalog table** in `pipelines/SKILL.md` — add a row with ID, name, file link, and purpose
7. **Add intent patterns** to the Intent Routing table in `pipelines/SKILL.md`
8. **Update the orchestrator** `SKILL.md` if the new pipeline introduces new routing logic

---

## Removing / Deprecating a Pipeline

1. Remove the row from the Catalog table in `pipelines/SKILL.md`
2. Remove the intent patterns from the Intent Routing table in `pipelines/SKILL.md`
3. Move the pipeline file from `references/` to a `references/_archive/` subfolder (do not delete — history matters)
4. If any `.agent/handover.md` references the pipeline, update the active journey status