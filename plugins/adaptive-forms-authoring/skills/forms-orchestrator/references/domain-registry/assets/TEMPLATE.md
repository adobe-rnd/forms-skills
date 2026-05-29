---
name: <domain-id>
description: >
  <One-line purpose of this domain>
license: Apache-2.0
metadata:
  type: router
  author: Adobe
  version: "0.1"
  triggers:
    - <trigger keyword 1>
    - <trigger keyword 2>
    - <trigger keyword 3>
---

# <Domain Name> — Domain Router

> **Base pattern:** Forms-specific specialization of [`docs/architecture/skill-router-template.md`](../../../../../docs/architecture/skill-router-template.md).

**ID:** `<domain-id>`
**Description:** <One-line purpose of this domain>

This router does not implement — it delegates. Matches user intents to the correct skill within this domain.

---

## Routing

Choose one format:

**Option A — Simple routing table** (use when skills have clear non-overlapping intents):

First match wins.

| Intent | Examples | Skill |
|--------|----------|-------|
| <Intent category 1> | "<example phrase>", "<example phrase>" | `<skill-id-1>` |
| <Intent category 2> | "<example phrase>", "<example phrase>" | `<skill-id-2>` |

> If intent is ambiguous between two skills, present options to the user.

**Option B — State machine** (use when routing depends on workflow phase or sequential pipeline):

```dot
digraph <domain>_pipeline {
  rankdir=LR;
  node [shape=box];

  STATE_A [shape=doublecircle, label="STATE_A"];
  STATE_B [label="STATE_B"];
  DONE    [shape=doublecircle, label="DONE"];

  STATE_A -> STATE_B [label="condition"];
  STATE_B -> DONE    [label="condition"];
}
```

| State | Action | Exit → Next |
|-------|--------|-------------|
| **STATE_A** | <what happens> | <condition> → STATE_B |
| **STATE_B** | <what happens> | <condition> → DONE |

---

## Skills

| # | Skill | Path | Purpose |
|---|-------|------|---------|
| 1 | `<skill-id-1>` | `references/<skill-id-1>/SKILL.md` | <One-line purpose> |
| 2 | `<skill-id-2>` | `references/<skill-id-2>/SKILL.md` | <One-line purpose> |

---

## Guard Policies

| Policy | Rule |
|--------|------|
| `<policy-id>` | <What is forbidden and why> |

Remove this section if no domain-wide constraints apply.

---

## File Locations

| Asset | Path |
|-------|------|
| <Asset type> | `<canonical/path/pattern>` |

---

## Extending This Domain

### Adding a skill

1. Create `skills/forms-<domain-id>/references/<skill-name>/SKILL.md`
2. Add row to **Skills** table above
3. Add intent pattern to **Routing** section
4. Register in `references/domain-registry/SKILL.md` domain's skill list

### Creating a new domain from this template

1. Copy to `skills/forms-<domain-name>/SKILL.md`
2. Update YAML frontmatter — `name`, `description`, `triggers`
3. Fill Routing, Skills, Guard Policies, File Locations
4. Add domain entry in `references/domain-registry/SKILL.md`
