# figma MCP — extracting design values from a Figma URL

This skill uses the Adobe-AIFoundations Figma MCP server to pull exact design values (colors, padding, typography, etc.) directly from Figma. The MCP requires `FIGMA_API_KEY` to be set in `$FORMS_EDS_ROOT/.env`.

## When to use it

Whenever the user provides a Figma URL alongside the design screenshots. The MCP is the source of truth for *values* — colors, spacing, typography, border-radius, shadows. Screenshots remain the source for layout intent.

If no Figma URL was provided, skip the MCP entirely. Don't pester the user for one.

## One viewport at a time

A Figma URL points at *one* frame for *one* viewport (desktop or mobile). The skill processes them sequentially — desktop in one invocation, mobile in a follow-up — not both at once. See "Responsive viewports" in `SKILL.md` for the rationale and second-pass workflow.

When the user invokes the skill with a Figma URL, treat it as the viewport they want now. If they later share a mobile URL, that's the second pass — write `@media (max-width: 768px) { ... }` overrides in the same fragment/journey CSS file, do not redeclare desktop rules.

## Parsing a Figma URL

A Figma node URL looks like:

```
https://www.figma.com/design/{fileKey}/{file-name}?node-id={nodeId}&p=f
```

Extract:
- **fileKey**: the path segment after `/design/` (e.g. `XdAdIn5VAs7t95HEKGYPDA`).
- **nodeId**: the value of the `node-id` query param. **Convert dashes to colons** before passing to the MCP — `node-id=403-333` becomes `nodeId="403:333"`.

The MCP tools also accept the full URL as `fileKey` and will extract the parts themselves, but explicit parsing is more predictable.

## Tools used by this skill

All tools are exposed under the `figma` server name. Tool names appear as `mcp__figma__<tool>` in the harness.

### `get_figma_node`

Primary call. Returns layout, styling, and structure for a specific node.

```js
mcp__figma__get_figma_node({
  fileKey: "XdAdIn5VAs7t95HEKGYPDA",
  nodeId: "403:333"
})
```

Useful fields in the response:
- `fills[]` — fill paints. For a SOLID fill, `fills[0].color` is `{ r, g, b, a }` (each 0–1). Convert to hex (see below).
- `strokes[]`, `strokeWeight` — borders.
- `cornerRadius` — border-radius in px.
- `effects[]` — shadows. Drop shadow = `{ type: "DROP_SHADOW", color, offset: {x,y}, radius, spread }`.
- `paddingLeft`, `paddingRight`, `paddingTop`, `paddingBottom` — auto-layout padding (only set when `layoutMode` is `HORIZONTAL` or `VERTICAL`).
- `itemSpacing` — auto-layout gap.
- `layoutMode`, `primaryAxisAlignItems`, `counterAxisAlignItems` — flex equivalents (`HORIZONTAL` ≈ `flex-direction: row`).
- `style` — typography. Keys: `fontFamily`, `fontWeight` (numeric), `fontSize` (px), `letterSpacing`, `lineHeightPx` or `lineHeightPercent`.
- `absoluteBoundingBox` — `{ x, y, width, height }`.
- `styles` — references to published styles by ID (cross-reference with `get_figma_styles`).

### `get_figma_styles`

Returns the file's published color/text/effect styles — i.e. named design tokens.

```js
mcp__figma__get_figma_styles({ fileKey: "XdAdIn5VAs7t95HEKGYPDA" })
```

Useful for: when a node's `styles.fill` references an ID like `"S:abc123"`, look up the friendly name (e.g. `"Primary/Blue"`) and the resolved hex. Record the name in a CSS comment next to the value.

### `get_figma_document_tree`

Paginated traversal of a node's full subtree. Use only when `get_figma_node` doesn't give enough depth (e.g. a screen with many children whose individual values you also need).

```js
mcp__figma__get_figma_document_tree({
  fileKey: "XdAdIn5VAs7t95HEKGYPDA",
  nodeId: "403:333",
  limit: 100,
  offset: 0,
  includeImages: false
})
```

Set `includeImages: false` for styling work — image URLs aren't needed and bloat the response. Use the response's `Total nodes` count to decide whether to paginate further.

### `get_figma_image` (rarely used)

Renders a node as PNG/JPG/SVG. The user-supplied screenshot already covers this purpose, so only call this if the user explicitly asks for a fresh render or the screenshot is missing a state.

## Converting Figma colors to CSS hex

`fills[0].color` is `{ r, g, b, a }` with each channel as a 0–1 float. To convert:

```
hex = "#" + [r, g, b].map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("")
```

If `a < 1`, prefer `rgba(r*255, g*255, b*255, a)` over hex+alpha for readability.

Worked example: `{ r: 0.109, g: 0.247, b: 0.792, a: 1 }` → `#1C3FCA`.

## Failure modes

If a tool call returns `"FIGMA_API_KEY not set"`, `"Build artifact not found"`, or the MCP isn't registered:

1. Stop the styling loop.
2. Tell the user: "The figma MCP isn't ready. Ensure `FIGMA_API_KEY` is set in `$FORMS_EDS_ROOT/.env` (generate at figma.com/settings → Security → Personal access tokens), then restart Claude Code."
3. Resume in screenshot-only mode if they want to keep going without it.

If the response contains a 403 or "node not found":
- 403: the PAT doesn't have view access to that file. User must be invited to the Figma file or use a different PAT.
- Node not found: the `nodeId` is wrong. Re-parse the URL; remember dashes become colons.

## Cost discipline

- One `get_figma_node` per styled section is usually enough. Cache the result; don't re-fetch on every annotation.
- Skip `get_figma_document_tree` for small frames — it's a token sink.
- Don't pull the full file tree to "explore" — go directly to the nodeId from the user's URL.
- **Never call `get_figma_node` on a canvas/page-level nodeId** (the URLs Figma generates from "Copy link" at the page level have `node-id=0-1` or similar). The response can be tens of millions of characters and will blow up your context. If the user's URL points at a canvas, call `get_figma_node_count` first to enumerate the page IDs, then ask the user which specific frame they're styling — or instruct them to open the frame in Figma and use right-click → "Copy link to selection" so the URL has a frame-level node-id.
