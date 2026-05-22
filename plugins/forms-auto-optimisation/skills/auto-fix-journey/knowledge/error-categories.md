---
name: error-categories
description: Named category patterns for Splunk result grouping and the analyst-narrative output format for the auto-fix-journey skill.
---

# Error Category Naming Rules

Group raw `(short_class, error_summary/err_code)` rows into named categories. Rows with the same root cause belong in one category even if `short_class` differs slightly.

| Pattern | Category name |
|---------|--------------|
| `JourneyHelperServiceImpl` + statusCode / downstream call | **MDM / Downstream API** |
| `prepareJourneyMetaData Exception` | **Journey State Corruption** |
| `FormsRelationServiceImpl Error finding dependency` | **Form Fragment Config** |
| `AdaptiveFormDataServlet` | **Form Data Servlet / Path Encoding** |
| `NullPointerException` in prefill classes | **Prefill / Missing Journey Context** |
| Unknown Java exception class | Named after the class (e.g., **MyServiceImpl Exception**) |

---

# Analyst-Narrative Output Format

Use this exact format for aggregated views (Mode A and Mode B).

## Opening line

```
Got the results. Here's a summary of what Splunk found in the last __HOURS__h on __HOST__:
```

## One block per category (numbered)

```
---

**N. <Category Name> — <short pattern description>** *(<total occurrences> occurrences — <severity hint: systemic / recurring / sporadic>)*

<One-sentence explanation of what this error pattern means and its likely root cause.>

| Class | Error pattern | Count | Last seen |
|-------|---------------|-------|-----------|
| <short_class> | <error_summary trimmed to 80 chars> | <n> | <last_seen> |

```
[<last_seen timestamp>] *ERROR* <short_class>
<error_summary — first 200 chars>
```

```

Severity hints:
- **systemic** — > 1 000 occurrences or affects every journey
- **recurring** — 100–1 000 occurrences, appears consistently
- **sporadic** — < 100 occurrences, intermittent

## Closing sections (always include)

```
---

**Most actionable items:**
1. **<Category N>** — <specific recommended action>
2. **<Category M>** — <specific recommended action>
[up to 3 items — only include categories with > 100 occurrences or clear fix path]

---

Would you like me to drill deeper into any of these? I can run a per-category breakdown showing volume by hour, distribution across hosts, and sample journey IDs. Just say "drill deeper into #N" or "drill deeper into all".
```
