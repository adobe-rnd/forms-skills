# Create Query Skill

## Purpose

This skill enables AI agents to translate natural language queries into structured RUM (Real User Monitoring) query objects for the `rum-query` CLI tool. The agent will extract date ranges, identify relevant facets, and construct proper filter objects based on user intent.

## Required Documentation

**IMPORTANT**: The agent MUST refer to these documentation files throughout the query creation process:

- **`facets.md`** (`@skills/rum-query/scripts/facets.md`) - Complete reference for all 13 available facets, their combiners, and usage examples
- **`checkpoints.md`** (`@skills/rum-query/scripts/checkpoints.md`) - Comprehensive list of all checkpoint types, their source/target properties, and use cases

**When to consult documentation**:
1. **Before selecting facets**: Check `facets.md` for available facets and their properties
2. **When identifying checkpoints**: Refer to `checkpoints.md` for all checkpoint types and their meanings
3. **For source/target values**: Use `checkpoints.md` to understand what source/target means for each checkpoint
4. **When uncertain about combiners**: Consult `facets.md` to see if a facet uses 'some' or 'every' logic
5. **For validation**: Cross-reference constructed queries with examples in both documents

## Input Format

The agent receives natural language queries that may include:
- **Time periods**: dates, relative times (last week, yesterday, January 2024)
- **Page/URL references**: specific pages, sections, or URL patterns
- **User segments**: device types, operating systems, traffic sources
- **Events/interactions**: clicks, form fills, page views, errors
- **UI elements**: buttons, links, forms, content blocks
- **Performance metrics**: LCP, CLS, INP, load times
- **Business goals**: conversions, engagement, traffic analysis

## Output Format

The agent must produce:
1. **Domain** (extracted or asked if not provided)
2. **Start Date** (ISO format: YYYY-MM-DD)
3. **End Date** (ISO format: YYYY-MM-DD)
4. **Query Object** (JSON filter object with facets)
5. **CLI Command** (ready-to-run command string)

---

## Quick Workflow Overview

```
User Query → Extract Dates → Identify Intent → Map to Facets → Construct Query → Generate CLI
                 ↓                  ↓                ↓               ↓
              [No docs]      [checkpoints.md]  [facets.md]    [facets.md]
                                                                  examples
```

**Key Principle**: Consult documentation BEFORE selecting facets, not after constructing the query.

---

## Step-by-Step Process

> **📚 Documentation Reminder**: Keep `facets.md` and `checkpoints.md` open throughout this process. You will need to refer to them at each step.

### Step 1: Extract Date Range

#### Common Date Patterns

| User Says | Interpretation |
|-----------|----------------|
| "yesterday" | Previous day |
| "last week" | Previous 7 days from yesterday |
| "this month" | Current calendar month (1st to today) |
| "last month" | Previous calendar month (full month) |
| "January 2024" | Specific month |
| "Q1 2024" | Jan 1 - Mar 31, 2024 |
| "between Jan 1 and Jan 31" | Specific range |
| "in the last 30 days" | 30 days ago to yesterday |

#### Date Extraction Rules

1. **Always use ISO format**: YYYY-MM-DD
2. **Default to yesterday as end date** if "today" not specified (avoids incomplete data)
3. **If no date mentioned**: Ask user or default to last 7 days
4. **Business days consideration**: If user says "last week" and it's Monday, they might mean previous Monday-Friday

**Example Extractions**:
```
Query: "Show me data from last week"
→ startDate: "2024-01-02", endDate: "2024-01-08" (if today is 2024-01-09)

Query: "January 2024 traffic"
→ startDate: "2024-01-01", endDate: "2024-01-31"

Query: "yesterday's errors"
→ startDate: "2024-01-08", endDate: "2024-01-08" (if today is 2024-01-09)
```

---

### Step 2: Identify User Intent

**Action**: Analyze the user's query and identify the primary analysis type.

**Reference**: Consult `checkpoints.md` to understand which checkpoints relate to the user's intent.

Map the query to one or more analysis types:

| Intent Type | Keywords/Phrases | Primary Facets | See Documentation |
|-------------|------------------|----------------|-------------------|
| **Page Analysis** | "page", "URL", "section", "/home" | `url` | facets.md - url facet |
| **Device/Platform** | "mobile", "desktop", "iOS", "Android" | `userAgent` | facets.md - userAgent facet |
| **Traffic Sources** | "from Google", "referrer", "traffic source" | `enter.source` | checkpoints.md - enter checkpoint |
| **User Behavior** | "clicks", "interactions", "engagement" | `checkpoint`, `click.source` | checkpoints.md - click checkpoint |
| **Form Analysis** | "form", "signup", "submission", "fills" | `fill.source`, `formsubmit` | checkpoints.md - fill, formsubmit |
| **Content Engagement** | "viewed", "scrolled to", "content blocks" | `viewblock.source`, `viewmedia.target` | checkpoints.md - viewblock, viewmedia |
| **Performance** | "slow", "LCP", "load time", "performance" | `checkpoint` (lcp, cls, inp, ttfb) | checkpoints.md - Performance section |
| **Errors** | "errors", "bugs", "404", "broken" | `checkpoint` (error, 404), `error` | checkpoints.md - error, 404 |
| **Conversions** | "conversions", "checkout", "purchase", "buy" | Multiple facets for funnel | Both documents |

---

### Step 3: Map Intent to Facets

**Action**: Select specific facets based on identified intent.

**Reference**:
- **Primary source**: `facets.md` - Lists all 13 available facets with descriptions, combiners, and examples
- **Supporting source**: `checkpoints.md` - For checkpoint-specific facets (*.source, *.target)

**Process**:
1. Check `facets.md` "Available Facets" section for facet names and what they do
2. Review the facet's combiner type (some vs every) in `facets.md`
3. For checkpoint facets, verify in `checkpoints.md` that the checkpoint has the source/target you need
4. Use examples from both documents to validate your facet selection

Below is a quick reference, but **always verify against the full documentation**:

#### Page & Device Facets

**`url`** - Use when query mentions specific pages
- "homepage", "/home" → `{"url": ["/home"]}`
- "checkout pages" → `{"url": ["/checkout"]}`
- "product pages" → `{"url": ["/products/*"]}` (note: use actual paths)
- "exclude admin" → `{"!url": ["/admin"]}`

**`userAgent`** - Use for device/platform filtering
- "mobile users" → `{"userAgent": ["mobile"]}`
- "iOS devices" → `{"userAgent": ["ios"]}`
- "desktop on Windows" → `{"userAgent": ["desktop", "windows"]}`
- "exclude bots" → `{"!userAgent": ["bot"]}`

#### Event Facets

**`checkpoint`** - Use for specific event types
- "clicks" → `{"checkpoint": ["click"]}`
- "form fills" → `{"checkpoint": ["fill"]}`
- "errors" → `{"checkpoint": ["error"]}`
- "with performance data" → `{"checkpoint": ["lcp", "cls", "inp"]}`
- "without errors" → `{"!checkpoint": ["error"]}`

#### Interaction Facets

**`click.source`** - Use for specific element clicks
- "buy button clicks" → `{"click.source": [".buy-button"]}`
- "CTA clicks" → `{"click.source": [".cta-button", ".cta"]}`
- Note: May need to ask user for CSS selectors if not clear

**`click.target`** - Use for click destinations
- "clicks to checkout" → `{"click.target": ["/checkout"]}`
- "external link clicks" → `{"click.target": ["https://"]}`

**`fill.source`** - Use for form field interactions
- "email field fills" → `{"fill.source": ["input[name='email']"]}`
- "form interactions" → `{"checkpoint": ["fill"]}` (broader)

**`viewblock.source`** - Use for content block visibility
- "hero banner views" → `{"viewblock.source": ["hero"]}`
- "viewed features section" → `{"viewblock.source": ["features"]}`

**`viewmedia.target`** - Use for media visibility
- "hero image views" → `{"viewmedia.target": ["/images/hero.jpg"]}`

#### Traffic & Navigation Facets

**`enter.source`** - Use for traffic source analysis
- "from Google" → `{"enter.source": ["search:google"]}`
- "social media traffic" → `{"enter.source": ["social:"]}`
- "direct traffic" → `{"enter.source": ["direct"]}`

**`navigate.source`** - Use for internal navigation
- "navigation menu usage" → `{"navigate.source": [".nav-menu"]}`

#### Error Facets

**`error`** - Use for combined error details (source | target)
- "payment script errors" → Discover values first with `--facet-values error`
- Format: `"errorSource | errorTarget"`
- Example: `{"error": ["/scripts/payment.js | TypeError"]}`
- "404 errors" → `{"checkpoint": ["404"]}`

---

### Step 4: Construct Query Object

**Reference**:
- **`facets.md`** - "Understanding Combiners" section explains 'some' vs 'every' logic
- **`facets.md`** - Each facet listing shows its combiner type and examples
- **`facets.md`** - "Common Filter Patterns" section for complete examples

#### Combining Facets

**IMPORTANT**: Before constructing queries, check `facets.md` to verify each facet's combiner type.

**AND Logic Across Facets**: Different facets are always combined with AND
```javascript
{
  "userAgent": ["mobile"],
  "url": ["/checkout"],
  "checkpoint": ["click"]
}
// Means: mobile AND /checkout AND has clicks
```

**Logic Within Facet Values**: Depends on the facet's combiner (check `facets.md`)

**`some` combiner facets** (OR within values):
- `userAgent`, `error`, `click.source`, `click.target`, `fill.source`, `loadresource.source`, `viewmedia.target`

```javascript
{"userAgent": ["mobile", "tablet"]}
// Means: mobile OR tablet
```

**`every` combiner facets** (AND within values):
- `url`, `checkpoint`, `navigate.source`, `enter.source`, `viewblock.source`

```javascript
{"checkpoint": ["click", "fill"]}
// Means: has click AND has fill
```

**Verification**: Always cross-reference with the combiner information in `facets.md` for each facet you use.

#### Query Construction Examples

**Example 1: Mobile Users on Checkout**
```
User: "Show me mobile users on the checkout page last week"

Analysis:
- Date: last week → calculate 7 days ago to yesterday
- Device: mobile → userAgent: ["mobile"]
- Page: checkout → url: ["/checkout"]

Query Object:
{
  "userAgent": ["mobile"],
  "url": ["/checkout"]
}
```

**Example 2: Form Abandonment**
```
User: "Find users who started but didn't submit the contact form in January"

Analysis:
- Date: January → "2024-01-01" to "2024-01-31"
- Intent: Form abandonment → has fill but not formsubmit
- Positive: checkpoint: ["fill"]
- Negative: !checkpoint: ["formsubmit"]

Query Object:
{
  "checkpoint": ["fill"],
  "!checkpoint": ["formsubmit"]
}
```

**Example 3: Traffic Source Analysis**
```
User: "Compare Google vs Facebook traffic for homepage yesterday"

Analysis:
- Date: yesterday
- Page: homepage → url: ["/home"]
- Sources: Google and Facebook → enter.source

Query Object:
{
  "url": ["/home"],
  "checkpoint": ["enter"],
  "enter.source": ["search:google", "social:facebook"]
}

Note: This uses every combiner, so it finds users from BOTH sources.
For separate analysis, run two queries or use broader filter.
```

**Example 4: Buy Button Effectiveness**
```
User: "How many people clicked the buy button and went to checkout this month?"

Analysis:
- Date: this month → calculate month start to today
- Event: clicks → checkpoint: ["click"]
- Element: buy button → click.source: [".buy-button"]
- Destination: checkout → click.target: ["/checkout"]

Query Object:
{
  "checkpoint": ["click"],
  "click.source": [".buy-button"],
  "click.target": ["/checkout"]
}
```

**Example 5: Error-Free High Engagement**
```
User: "Show product pages with high engagement and no errors last week"

Analysis:
- Date: last week
- Pages: products → url: ["/products"]
- Engagement: viewed content + clicks → checkpoint: ["viewblock", "click"]
- No errors: exclude errors → !checkpoint: ["error"]

Query Object:
{
  "url": ["/products"],
  "checkpoint": ["viewblock", "click"],
  "!checkpoint": ["error"]
}
```

---

### Step 5: Generate CLI Command

Format: `node cli.js <domain> <startDate> <endDate> [options]`

**Template**:
```bash
node cli.js {DOMAIN} {START_DATE} {END_DATE} --query '{QUERY_JSON}' [--format {FORMAT}]
```

**Example Commands**:

```bash
# Simple query
node cli.js example.com 2024-01-01 2024-01-31

# With filter
node cli.js example.com 2024-01-01 2024-01-31 --query '{"url":["/home"]}'

# Complex filter
node cli.js example.com 2024-01-01 2024-01-31 \
  --query '{"userAgent":["mobile"],"checkpoint":["click"],"url":["/checkout"]}'

# With output format
node cli.js example.com 2024-01-01 2024-01-31 \
  --query '{"checkpoint":["error"]}' \
  --format json
```

---

## Common Query Patterns

### 1. Page Performance
```
Query: "How did the homepage perform last week?"
Facets: url, checkpoint (lcp, cls, inp)
{
  "url": ["/home"],
  "checkpoint": ["lcp", "cls", "inp"]
}
```

### 2. Mobile Conversion Funnel
```
Query: "Mobile users who viewed, clicked, and filled forms on checkout"
Facets: userAgent, url, checkpoint
{
  "userAgent": ["mobile"],
  "url": ["/checkout"],
  "checkpoint": ["viewblock", "click", "fill"]
}
```

### 3. Traffic Quality
```
Query: "Organic traffic with low bounce rate (has engagement)"
Facets: enter.source, checkpoint (exclude navigate)
{
  "enter.source": ["search:"],
  "checkpoint": ["click", "viewblock"]
}
```

### 4. Error Monitoring
```
Query: "JavaScript errors on payment pages"
Facets: url, checkpoint, error
{
  "url": ["/payment", "/checkout"],
  "checkpoint": ["error"]
}
```

### 5. Content Engagement
```
Query: "Users who viewed hero and features sections"
Facets: viewblock.source, checkpoint
{
  "checkpoint": ["viewblock"],
  "viewblock.source": ["hero", "features"]
}
```

---

## Handling Ambiguity

### When to Ask for Clarification

1. **Ambiguous dates**: "recently", "a while ago" → Ask for specific range
2. **Vague element references**: "the button" → Ask for CSS selector or description
3. **Multiple possible interpretations**: "traffic" could mean all visits or just external referrers
4. **Missing domain**: Always required, ask if not provided

### Smart Defaults

1. **Date range**: Default to last 7 days if not specified
2. **Format**: Default to "summary" unless user wants data for further analysis
3. **Broad before narrow**: Start with broader facets, suggest refinements
4. **Exclude bots**: Consider adding `{"!userAgent": ["bot"]}` by default for traffic analysis

---

## Validation Rules

**Action**: Before generating the command, validate against documentation.

**References**:
- **`facets.md`** - "Summary" section lists all valid facets
- **`facets.md`** - Each facet section shows combiner and negative support
- **`checkpoints.md`** - "Quick Reference Table" shows which checkpoints have source/target

### Validation Checklist

1. ✅ **Date format**: Both dates in YYYY-MM-DD format
2. ✅ **Date logic**: startDate <= endDate
3. ✅ **Facet names**: Cross-check against `facets.md` - only 12 valid facets exist
4. ✅ **JSON syntax**: Properly escaped quotes, valid JSON structure
5. ✅ **Combiner awareness**: Verify in `facets.md` if facet uses 'some' or 'every'
6. ✅ **Negative facets**: Check `facets.md` - only 4 facets support negation (url, userAgent, checkpoint, error)
7. ✅ **Checkpoint properties**: Verify in `checkpoints.md` that checkpoint has the source/target you're filtering on
8. ✅ **Example validation**: Compare your query structure with examples in `facets.md` "Common Filter Patterns"

---

## Complete Example Workflow

**User Query**: "Show me iOS users who clicked the signup button but didn't complete the form last month on the signup page"

**Agent Process with Documentation References**:

1. **Extract Date**:
   - "last month" → Calculate previous calendar month
   - If today is 2024-02-15, then: "2024-01-01" to "2024-01-31"

2. **Identify Intent** (Consult `checkpoints.md`):
   - Device: iOS
   - Event: clicked button, didn't submit
   - Page: signup page
   - Intent: Form abandonment analysis
   - **Check**: `checkpoints.md` → click, fill, formsubmit checkpoints exist ✓

3. **Map to Facets** (Consult both documents):

   **From `facets.md`**:
   - Device: `userAgent: ["ios"]` - Combiner: 'some' ✓
   - Page: `url: ["/signup"]` - Combiner: 'every' ✓
   - `checkpoint` facet exists with negative support ✓

   **From `checkpoints.md` Quick Reference Table**:
   - click checkpoint has source ✓ → can use `click.source`
   - fill checkpoint has source ✓ → implied by checkpoint filter
   - formsubmit checkpoint exists ✓ → can use negative filter

   **Facet Selection**:
   - Device: `userAgent: ["ios"]`
   - Page: `url: ["/signup"]`
   - Events: `checkpoint: ["click", "fill"]` (requires BOTH per 'every' combiner)
   - Button: `click.source: [".signup-button"]` (confirm selector with user)
   - NOT submitted: `!checkpoint: ["formsubmit"]` (negative supported per `facets.md`)

4. **Construct Query** (Validate with `facets.md` examples):
```json
{
  "userAgent": ["ios"],
  "url": ["/signup"],
  "checkpoint": ["click", "fill"],
  "click.source": [".signup-button"],
  "!checkpoint": ["formsubmit"]
}
```

5. **Generate Command**:
```bash
node cli.js example.com 2024-01-01 2024-01-31 \
  --query '{"userAgent":["ios"],"url":["/signup"],"checkpoint":["click","fill"],"click.source":[".signup-button"],"!checkpoint":["formsubmit"]}'
```

6. **Response to User**:
```
I'll analyze iOS users who clicked the signup button but didn't complete
the form on the signup page during January 2024.

Command:
node cli.js example.com 2024-01-01 2024-01-31 \
  --query '{"userAgent":["ios"],"url":["/signup"],"checkpoint":["click","fill"],"click.source":[".signup-button"],"!checkpoint":["formsubmit"]}'

This query filters for:
- iOS devices only
- Signup page (/signup)
- Users who clicked the signup button
- Users who started filling the form
- Excludes users who completed submission

Would you like me to run this or modify any filters?
```

---

## Required Documentation Reference

### Primary Documents (MUST CONSULT)

**`facets.md`** - `@skills/rum-query/scripts/facets.md`
- **Purpose**: Complete reference for all filterable facets
- **Key Sections**:
  - "Available Facets" (1-13) - All facet definitions
  - "Understanding Combiners" - some vs every logic
  - "Common Filter Patterns" - 8 proven query patterns
  - "Quick Reference: Facets by Category" - Find facets by purpose
  - "Summary" - Lists all 13 facets and which support negation
- **When to use**:
  - Before selecting ANY facet
  - To verify combiner type
  - To check negative support
  - For example queries

**`checkpoints.md`** - `@skills/rum-query/scripts/checkpoints.md`
- **Purpose**: Comprehensive list of all checkpoint event types
- **Key Sections**:
  - Checkpoint categories (Performance, Navigation, Interaction, etc.)
  - "Quick Reference Table" - Shows which checkpoints have source/target
  - "Using Checkpoints in Filters" - Filter examples
  - "Best Practices for Agents" - Usage guidelines
- **When to use**:
  - To identify checkpoint types for user's query
  - To verify if checkpoint has source or target property
  - To understand checkpoint categories
  - For checkpoint-specific filtering

### Supporting Documents (Reference as needed)

**`USAGE.md`** - `@skills/rum-query/scripts/USAGE.md`
- Common use cases with complete CLI examples
- Output format options
- Troubleshooting guide

**`Readme.md`** - `@skills/rum-query/scripts/Readme.md`
- CLI command structure
- Installation and setup
- Environment variables

---

## Critical Reminders

🔴 **DO NOT** guess facet names - check `facets.md` (only 13 exist)
🔴 **DO NOT** assume checkpoint properties - verify in `checkpoints.md` Quick Reference Table
🔴 **DO NOT** assume combiner type - check `facets.md` for each facet
🟢 **DO** consult examples in both documents before constructing queries
🟢 **DO** validate your query against the patterns in `facets.md`

---

## Agent Checklist

**Action**: Complete this checklist before presenting a query to the user.

**Documentation Check**: Have you consulted both `facets.md` and `checkpoints.md`?

### Pre-Query Validation

- [ ] **Documentation Reviewed**: Checked `facets.md` for facet properties and `checkpoints.md` for checkpoint types
- [ ] **Dates extracted**: Both in YYYY-MM-DD format
- [ ] **Domain identified**: Either extracted from query or asked user
- [ ] **Intent mapped**: User goal mapped to analysis type using checkpoint categories from `checkpoints.md`
- [ ] **Facets validated**: All facet names exist in `facets.md` (only 13 valid facets)
- [ ] **Combiners checked**: Verified in `facets.md` whether each facet uses 'some' or 'every'
- [ ] **Checkpoint source/target verified**: Cross-referenced with `checkpoints.md` Quick Reference Table
- [ ] **Negative facets**: Only used with supported facets (url, userAgent, checkpoint, error) per `facets.md`
- [ ] **JSON syntax**: Properly formatted and escaped
- [ ] **CLI command**: Follows proper format with correct escaping
- [ ] **Example comparison**: Query structure matches patterns in `facets.md` "Common Filter Patterns"
- [ ] **User explanation**: Clear explanation of what the query filters for
- [ ] **Next steps**: Offered to run query or modify filters

---

## Tips for Agents

### Documentation Usage

1. **Always consult first**: Before selecting any facet, check `facets.md` to verify it exists and understand its combiner
2. **Verify checkpoints**: Use `checkpoints.md` Quick Reference Table to confirm source/target availability
3. **Learn from examples**: Study the "Common Filter Patterns" in `facets.md` for proven query structures
4. **Double-check combiners**: The difference between 'some' (OR) and 'every' (AND) is critical - verify in `facets.md`

### Query Construction

5. **Start broad**: If unsure, start with fewer facets and suggest refinements
6. **Explain combiners**: Tell user if they're filtering for AND vs OR logic (reference the facet's combiner from docs)
7. **Suggest alternatives**: If query seems overly restrictive, suggest loosening filters
8. **Performance awareness**: Large date ranges may take longer
9. **Validate assumptions**: Confirm CSS selectors and exact URLs with user
10. **Format for user**: Offer JSON format for programmatic use, summary for quick insights
11. **Follow-up queries**: Suggest related analyses based on results

### When in Doubt

- **Check facets.md**: For facet names, combiners, and negative support
- **Check checkpoints.md**: For checkpoint types and their properties
- **Compare with examples**: Both documents have extensive examples - use them!

