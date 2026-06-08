---
name: forms-style-screen
description: >
  Use when styling a specific AEM EDS form screen or fragment to match a visual
  design — iterates CSS against the live form in Chrome using design screenshots
  and/or a Figma URL as sources of truth. Injects an in-page feedback widget for
  annotation-driven iteration. All CSS is scoped to the target screen or fragment
  and written to $FORMS_EDS_ROOT/blocks/form/styles/{journey}/form.css (screen)
  or $FORMS_EDS_ROOT/styles/fragments/{name}.css (fragment). NOT for form structure or fields —
  use forms-author. NOT for business rules — use forms-rule-author.
license: Apache-2.0
metadata:
  type: skill
  author: Adobe
  version: "0.1"
  triggers:
    - style screen
    - style form
    - style fragment
    - match design
    - figma styling
    - design screenshot
    - screen styling
    - iterative styling
    - live styling
    - css iteration
    - style journey
    - visual design
    - form appearance
    - form theme
    - form css
---

# Forms Style Screen

## Overview

Style a single AEM Forms screen by reading user-supplied design screenshots, opening the live form in Chrome, isolating the target screen by hiding its siblings, and iterating CSS against user feedback collected through an injected in-page widget. All styling for a journey lives in one file: `$FORMS_EDS_ROOT/blocks/form/styles/{journey}/form.css`. Output rules are scoped under the screen's panel selector (e.g. `.field-personal-details-panel`) so they don't bleed across screens.

## When to use

- "Style this screen — here's the form URL and the screenshots"
- "The live form doesn't match the design — fix this screen, [design.png]"
- "Iterate on the styling for this screen, I'll point out what's off"
- Any time the user attaches one or more screenshots and wants the live render adjusted to match

Do not use this skill for:
- Form structure / fields → `/forms-author`
- Business logic → `/forms-rule-author`
- Custom JS components → `/forms-custom-components`
- General CSS questions unrelated to a specific screen

## Inputs

The skill expects these from the user:

1. **Form URL** — the URL where the live form is rendering (e.g. `http://localhost:3000/content/forms/af/forms-team/form/pl/etb-wo-v11`).
2. **Screen identifier** — a short name or slug for the screen, e.g. `01-account-selection`, `account-selection`, or a fragment name. Used to locate the target fieldset in the rendered DOM. The journey name is derived from the form URL or the path of the screenshots if attached from the journey folder.
   - **If a journey is in context** (spec or plan files exist at `$FORMS_WORKSPACE/journeys/<journey>/`): read `spec.md` first to enumerate available screens and fragments. Present the list to the user and ask which screen to style — do not force them to recall the exact slug.
3. **One of: a Figma URL OR design screenshot(s)** — the design reference. The skill needs at least one of these to know what to style toward.
   - **Figma URL (preferred)** — a `figma.com/design/{fileKey}/...?node-id={nodeId}` URL pointing at the screen's frame in Figma **for the viewport currently being styled** (desktop OR mobile, not both at once — see "Responsive viewports" below). When provided, the skill calls the `figma` MCP (see `references/figma-mcp.md`) to extract exact colors, spacing, typography, and border-radius. The skill also calls `mcp__figma__get_figma_image` once to render the frame as a PNG to use as visual reference — **so user-supplied screenshots become optional in this mode.**
   - **Design screenshot(s)** — image attachments (PNG/JPG) showing the intended visual design. Required only when no Figma URL is provided. Even with a Figma URL, screenshots are still useful for capturing *states the static frame doesn't show* (e.g. modal open, dropdown expanded, error state, hover) — attach them when you have those.

**Before proceeding, explicitly confirm the form URL with the user — do not infer or assume it from session context, prior conversation, or any other source.** If the form URL is missing, ask for it directly. If both the Figma URL and screenshots are missing, ask for at least one before proceeding. Do not guess any URL. Without a Figma URL, fall back to screenshot-only mode (less precise; pixel-sampling colors carries ±1–3 hex point error from JPG compression).

## Responsive viewports

A screen typically has separate Figma frames for desktop and mobile. **Default workflow: do one viewport at a time, sequentially.** Don't ask the user for both URLs upfront unless they offer.

**Rationale:**
- `/style-screen` is annotation-heavy. Desktop spacing/colors will shift across rounds, and any mobile CSS written upfront would need re-aligning. Iterating one viewport at a time minimises rework.
- Each `get_figma_node` call returns ~100k–200k chars of design data. Holding both viewports' data in context for the whole session doubles overhead even when only one is in active use.
- Mobile and desktop reason about layout very differently (multi-col grids vs. 1-col stacks, fixed widths vs. fluid). Easier to handle one mental model at a time.

**Workflow per viewport:**
1. **First pass — desktop** (or whichever viewport the user starts with). Run the full skill workflow (steps 1–9). Land base CSS without any `@media` queries — it'll be the desktop default.
2. **Second pass — mobile**. User shares the mobile Figma URL in a new invocation. The skill:
   - Resolves mobile values via the figma MCP just like desktop.
   - Resizes the Chrome viewport to a typical mobile width (e.g. 390px) using `chrome-devtools__resize_page` or `chrome-devtools__emulate` so the rendered form actually reflects mobile layout.
   - Adds `@media (max-width: 768px) { ... }` blocks at the bottom of the existing fragment/journey CSS — does NOT rewrite the desktop rules.
   - Iterates with the widget at mobile viewport.

**Bring both URLs upfront only when** the mobile layout fundamentally differs from desktop in structure (carousel vs. grid, drawer vs. inline panel, hamburger vs. tab bar) — i.e. layout differences that need structural CSS decisions, not just sizing tweaks. In that case, ask the user up front and pull both `get_figma_node` responses before drafting CSS.

**Mobile-pass tips:**
- Mobile @media rules should override only the values that differ — don't redeclare every rule.
- Common things to override: section/legend padding, font sizes, grid `grid-template-columns: 1fr`, button widths to `100%`, fragment root `padding`.
- Reuse the same selectors as desktop so the override map is obvious in code review.
- The desktop ↔ mobile values often share a token (e.g. `--section-padding`). If three or more values differ, consider extracting them as journey-scoped tokens at the top of `$FORMS_EDS_ROOT/styles/{journey}/form.css` and switching them in the `@media` block — fewer rules to maintain.

## Prerequisites

- The form is running and reachable at the given URL.
- `chrome-devtools` MCP is available.
- For Figma-enhanced mode: `figma` MCP must be running. `FIGMA_API_KEY` must be set in `$FORMS_EDS_ROOT/.env`. If a tool call fails with "FIGMA_API_KEY not set" or "Build artifact not found", tell the user to add `FIGMA_API_KEY=<your-key>` to `$FORMS_EDS_ROOT/.env`.

## CRITICAL: Widget re-injection rule

The feedback widget is a runtime-injected DOM artifact — it lives only in the current page's JavaScript context. **Any full page reload destroys it.** Pending annotations in `window.__styleFeedback` are also lost.

**The rule: any time the page reloads in Chrome, the widget MUST be re-injected before doing anything else.** No exceptions.

This applies whenever:
- You call `navigate_page` (even to the same URL).
- You trigger a reload via `evaluate_script` (`location.reload()`, `location.href = ...`).
- The user manually refreshes Chrome and tells you they did.
- The page reloads on its own (form-submit, auth redirect, network blip, dev-server HMR full-reload).
- Chrome DevTools is opened/closed in a way that re-renders.
- Any time you take a screenshot and the toolbar is missing from the top-right corner.

**Mandatory recovery sequence after any reload (in this exact order):**
1. `wait_for` the form to render (`.form` or `main .form form`).
2. Re-run the isolation step (step 4) — `data-visible` toggles do not survive reload either.
3. Re-inject the widget by reading `assets/feedback-widget.js` and pasting it into `evaluate_script`.
4. Verify with `evaluate_script: () => !!window.__styleScreenWidget` returning `true`.
5. Only then take a screenshot or interact further.

**Detection check before every screenshot or annotation read:** run `evaluate_script: () => !!window.__styleScreenWidget`. If it returns `false`, the page reloaded since you last touched it — stop and run the recovery sequence above before continuing.

**Lost-annotation handling:** if the user had pending annotations and the page reloaded before the skill consumed them, tell the user immediately ("the page reloaded — your N pending annotations were lost, please re-pick them") rather than silently moving on.

**Prefer non-reload iteration:** for fast styling iteration, prefer the live `<style>`-tag injection pattern (inject CSS into the page directly via `evaluate_script`) over a full reload. Only do a full reload when you specifically need to verify the on-disk CSS is loading via `customStylesPath`. This minimizes how often you pay the re-injection + lost-annotation cost.

## Workflow

### 1. Load context

**First — resolve journey context from workspace documents:**

If `$FORMS_WORKSPACE` is set, check for a journey spec and the relevant plan:

1. List `$FORMS_WORKSPACE/journeys/` to find available journeys. If more than one, ask the user which journey this screen belongs to.
2. Read `$FORMS_WORKSPACE/journeys/<journey>/spec.md` — extract:
   - **Screen list** (`## Screens` section) — screen names, slugs, and field catalogs per screen. Use this to confirm or suggest the screen identifier if the user hasn't specified one.
   - **Fragment list** — any fragment screens noted in the spec.
   - **Journey name** — from the directory name or spec header. This resolves `{journey}` in all CSS file paths below.
   - **`## Style` section** — design token values captured during analysis (rough reference; Figma MCP or screenshots are authoritative for exact values).
3. Read the matching plan file from `$FORMS_WORKSPACE/journeys/<journey>/plans/` (e.g. `NN-screen-<name>.md` or `NN-fragment-<name>.md`) if it exists — it contains the intended fieldset class name, layout intent, and any CSS notes from the planner. This is the primary source for the expected `field-*` selector.

If no workspace or spec exists, fall back to deriving journey and screen names from the form URL and user input.

**Then read in parallel:**
- The design screenshot(s) provided by the user — used for **layout intent, component composition, and visual sanity-check**. Look at all of them together (e.g. default state, selected state, modal open) before drafting any CSS.
- `$FORMS_EDS_ROOT/blocks/form/form.css` — read for **selector patterns, layout conventions, and existing spacing/typography tokens only**. Do NOT use any color token values from this file (e.g. `--button-primary-color`, `--form-label-color`). Token values in `form.css` may not match the design.
- `$FORMS_EDS_ROOT/blocks/form/styles/{journey}/form.css` if it exists — the existing journey CSS.
- `references/aem-css-conventions.md` (in this skill) — the AEM EDS class-emission rules.
- `references/figma-mcp.md` (in this skill) — how to call the `figma` MCP if a Figma URL is provided.

Do not infer CSS conventions from any other file. The AEM doc is the only source for selector patterns.

### 1a. Resolve Figma values (only if a Figma URL was provided)

If the user provided a Figma URL, parse `fileKey` and `nodeId` from it (`figma.com/design/{fileKey}/...?node-id={nodeId}` — note the dash in `0-1` becomes a colon `0:1` for the API, e.g. `node-id=403-333` → `nodeId="403:333"`). Then call:

1. `mcp__figma__get_figma_node_count` first (cheap) — confirms the node is a frame-sized one and not a whole page/canvas. If the returned count or frame name suggests it's a page-level node, stop and ask the user to share a frame-level URL (right-click frame → "Copy link to selection") before doing the heavier calls.
2. `mcp__figma__get_figma_node` with `{ fileKey, nodeId }` — returns the target frame's exact fills (colors), strokes, cornerRadius, effects (shadows), auto-layout padding/itemSpacing, typography (fontFamily/fontWeight/fontSize/letterSpacing/lineHeight), and absoluteBoundingBox.
3. `mcp__figma__get_figma_image` with `{ fileKey, nodeId, format: "png", scale: 1 }` — renders the frame as a PNG and returns a URL. Download to a workspace temp dir and read it as the **design visual reference** for this session. This replaces user-supplied screenshots when none were attached. (If the user did attach screenshots, treat both: MCP-rendered frame for the canonical layout, user screenshots for state variants like modal-open / hover / error.)
4. `mcp__figma__get_figma_styles` with `{ fileKey }` — returns published color/text/effect styles for the file (named tokens, e.g. "Primary/Blue → #1C3FCA"). Skip if the file is large and times out — the named-style mapping is a nice-to-have, not required.
5. (Optional, large frames) `mcp__figma__get_figma_document_tree` with `{ fileKey, nodeId, limit: 100 }` — paginated child traversal for sub-component values.

Cache the resolved values in working memory for the rest of the session — the screen is small enough that one or two MCP calls suffice. If a tool call fails with "FIGMA_API_KEY not set" or "Build artifact not found", stop and tell the user to add `FIGMA_API_KEY=<your-key>` to `$FORMS_EDS_ROOT/.env`. If the Figma URL was *not* provided, skip this step entirely; screenshot-only flow still works (less precise).

### 2. Decide target mode: top-level screen or fragment

Two modes the skill operates in. Determine which by inspecting the rendered DOM (after step 3 below) or by asking the user if ambiguous.

| Mode | When | CSS file | Where it loads from |
|---|---|---|---|
| **Screen-wrapper** | Identifier matches a top-level form fieldset like `field-screen1accountselectionwrapper` | `$FORMS_EDS_ROOT/blocks/form/styles/{journey}/form.css`, sectioned by screen | Form-level `customStylesPath` |
| **Fragment** | Identifier matches a fragment fieldset like `field-customerdetailsfragment` | `$FORMS_EDS_ROOT/blocks/form/styles/fragments/{fragmentName}.css`, one file per fragment | Fragment's own `customStylesPath` **and** an `@import` in the journey form.css |

### 2a. Wire `customStylesPath`

The runtime decorator (`$FORMS_EDS_ROOT/blocks/form/decorateForm.js`) reads `formDef.properties.customStylesPath` and `loadCSS()`'s it.

**Step 0 — Verify `decorateForm.js` supports `customStylesPath`**

Before checking whether the property is set, confirm the runtime actually handles it. Read `$FORMS_EDS_ROOT/blocks/form/decorateForm.js` (or `form.js` if `decorateForm.js` doesn't exist) and search for `customStylesPath`.

- **Found** — support is present. Continue to the CSS link check below.
- **Not found** — the runtime doesn't handle `customStylesPath`. Add the following block to the decorator, immediately after the form definition is fetched and before the form is rendered:

  ```js
  if (formDef?.properties?.customStylesPath) {
    await loadCSS(formDef.properties.customStylesPath);
  }
  ```

  `loadCSS` is already imported in `form.js` / `decorateForm.js` — do not add a new import. If it is not imported, add: `import { loadCSS } from '../../scripts/aem.js';`. Confirm with the user before editing this file.

**First — check if already wired** via Chrome DevTools before touching anything:

```js
evaluate_script: () =>
  [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map(l => l.href)
    .filter(h => h.includes('blocks/form/styles'))
```

If the expected CSS path appears in the result, skip this step entirely.

**If missing — STOP and invoke `forms-author`.** Do NOT call Sites Content MCP directly. Tell the user:

> "`customStylesPath` is not set on this form. Switching to `forms-author` to wire it before continuing."

Hand off to `forms-author` with this exact request:

> "Set `customStylesPath` to `/blocks/form/styles/{journey}/form.css` on the form root container."  
> (Fragment mode: `/blocks/form/styles/fragments/{fragmentName}.css` on the fragment root container.)

`forms-author` owns all AEM content mutations — do not bypass it. Return here once `forms-author` confirms the property is set.

After the handoff completes, reload the form and re-run the CSS link check above to confirm it's loading.

**Runtime behavior** (important to understand):
- When a fragment is embedded inside a form/journey, only the **form's** `customStylesPath` is processed. The fragment's own `customStylesPath` is dormant in that context — its styles reach the page through the journey form.css `@import` chain (step 2b).
- The fragment-level `customStylesPath` only matters when the fragment is previewed standalone (rare). Setting it is good hygiene so the fragment is self-styled in any preview surface, but no double-loading happens during normal journey rendering.

### 2b. (Fragment mode only) Wire the journey @import

Fragments must also be imported into a journey form.css so they're styled when consumed inside that journey. Ask the user:

> Which journey's form.css should import this fragment? (e.g. `etbwo`)

Then add this near the top of `$FORMS_EDS_ROOT/blocks/form/styles/{journey}/form.css`:
```css
@import url('../fragments/{fragmentName}.css');
```

If the user confirms the fragment is used by multiple journeys, repeat the import in each journey's form.css. If the @import line is already present, skip.

### 3. Open the live form

Use chrome-devtools MCP:
1. `navigate_page` to the form URL.
2. `wait_for` the form to render (`.form` or `main .form form` selector).
3. `take_snapshot` to inspect the rendered DOM tree.

### 3a. Confirm dev-server availability

**Ask the user explicitly before writing any CSS:**

> "Are local file changes reflected in the form at this URL? (i.e. is `aem up` or an equivalent dev server running against `$FORMS_EDS_ROOT`, so that saving a CSS file reloads it in the browser?)"

Record the answer as a session flag: **`local-reload: yes`** or **`local-reload: no`**.

This determines the iteration mode for the rest of the session:

| Mode | When | Iteration strategy |
|---|---|---|
| **Live-reload mode** | `local-reload: yes` | Write CSS to disk → reload → verify. On-disk file is always up to date. |
| **Injection-only mode** | `local-reload: no` | Inject CSS via `<style>` tag into the page for iteration. **Do NOT write to disk until step 9.** At step 9, write all accumulated CSS to disk at once. |

**Injection-only mode — live `<style>` injection pattern:**

```js
evaluate_script: () => {
  let el = document.getElementById('__style-screen-preview');
  if (!el) {
    el = document.createElement('style');
    el.id = '__style-screen-preview';
    document.head.appendChild(el);
  }
  el.textContent = `/* paste full CSS here */`;
}
```

Replace the full content of the `#__style-screen-preview` `<style>` tag on every iteration — don't append. This avoids stale rules accumulating and mirrors what the on-disk file will contain. The tag is lost on reload, so re-inject it (along with the widget) after any reload.

> **Do not ask about dev-server availability again** once the user answers — the flag is fixed for the session.

### 4. Identify and isolate the target

The form renders screens and fragments as nested `<fieldset>` elements with stable `field-*` classes:
- Top-level screens: `field-{name}wrapper` (e.g. `field-screen1accountselectionwrapper`)
- Fragments: `field-{name}fragment` (e.g. `field-customerdetailsfragment`)

To find and isolate the target:

1. Match the user's **identifier** against `field-*` classes anywhere in the form. Use `evaluate_script` to list candidates with their classes, parent context, and legend text. Heuristic:
   - Class ending in `wrapper` → screen-wrapper mode
   - Class ending in `fragment` → fragment mode
   - If both/neither match: present candidates and ask user to pick mode and target
2. Find the matched fieldset's nearest top-level screen-wrapper ancestor (so we can isolate at the screen-wrapper level even if the user is targeting a fragment inside it).
2. Use `evaluate_script` to:
   - Set `data-visible="true"` on the target fieldset.
   - Set `data-visible="false"` on every sibling fieldset.
   - `$FORMS_EDS_ROOT/blocks/form/form.css` already hides `[data-visible="false"]` outside edit-mode (`form:not(.edit-mode) [data-visible="false"] { display: none !important; }`), so the sibling screens disappear immediately.
3. If the form is wrapped in a wizard, this is generally enough — the wizard's own `.current-wizard-step` filtering still works alongside the data-visible toggle.

Save the original `data-visible` state of each fieldset (read it before changing) so the skill can restore it at end-of-session.

### 5. Inject the widget and capture the "before" state

1. `evaluate_script` to inject `assets/feedback-widget.js` (read the file, paste contents into the script).
2. Verify injection succeeded: `evaluate_script: () => !!window.__styleScreenWidget` must return `true`. If `false`, retry.
3. `take_screenshot` of the full viewport — this is the "before" screenshot for round 0.

> Reminder: from this point forward, the **Widget re-injection rule** above is in force for the rest of the session. Any subsequent reload requires the full recovery sequence before any other action.

### 6. First-pass styling

Compare the user-supplied design screenshot(s) to the "before" screenshot. Look at all provided design screenshots together to understand the full intended state (default, selected, modal-open, etc.). Identify the differences. Read the rendered DOM via `take_snapshot` to confirm the exact selectors emitted for this target.

**Where to write the CSS depends on mode (see step 2):**

- **Screen-wrapper mode** → append a sectioned block to `$FORMS_EDS_ROOT/blocks/form/styles/{journey}/form.css`:
  ```css
  /* ===== 02-personal-details ===== */
  .field-personal-details-panel {
    /* rules scoped under the screen's panel selector */
  }
  ```
- **Fragment mode** → write the entire file at `$FORMS_EDS_ROOT/blocks/form/styles/fragments/{fragmentName}.css`:
  ```css
  /* Fragment: customer-details
   * Imported into one or more journey form.css files via @import.
   */
  .field-customerdetailsfragment {
    /* rules scoped under the fragment's outer selector so they cannot bleed
       into other fragments or screens */
  }
  ```

Whichever mode, every rule must:
- Be wrapped under the target's outer `field-*` selector (panel for screens, fragment for fragments).
- **Source-of-truth precedence for values:**
  1. **Figma MCP** (when URL was provided in step 1a) — authoritative for colors, padding, margin, spacing, typography, border-radius, shadows. Hardcode the exact hex/px value from the MCP response. If the value matches a published Figma style name (from `get_figma_styles`), record the name as a comment, e.g. `color: #1C3FCA; /* Primary/Blue */`.
  2. **Design screenshot** — fallback for any value the MCP did not resolve, and authoritative for layout intent (alignment, stacking, what's beside what).
  3. **`form.css` tokens** — only when the resolved value (Figma or screenshot) exactly matches an existing `--form-*` token. Never assume a token value matches the design without verification.
- Never write `var(--button-primary-color)` or any other color token unless you have verified that the token's resolved value exactly matches the design's value. When in doubt, hardcode and mark `/* TODO: token? */`.
- Follow `references/aem-css-conventions.md`.
- Adhere to `references/anti-patterns.md`.

**After writing first-pass CSS — branch on session flag from step 3a:**

- **`local-reload: yes`** — write to disk, reload the page, re-isolate (step 4), re-inject the widget, take a new screenshot.
- **`local-reload: no`** — do NOT write to disk yet. Instead, inject the full CSS via the `#__style-screen-preview` `<style>` tag (see step 3a pattern). Take a screenshot. The disk file stays untouched until step 9.

### 6.5. Self-critique pass (autonomous — before asking the user)

After the first-pass CSS lands and the page reloads, conduct a structured self-critique **before** presenting the widget to the user. The goal is to close the obvious gap between "CSS written" and "design matched" in the same turn — so the user's annotation round starts from a close baseline rather than a rough first draft.

**Run through this checklist in order:**

**1. Screenshot vs. Figma / reference image**
`take_screenshot` and compare it side-by-side with the Figma render (saved to `/tmp/figma-*.png` in step 1a) or the user's design screenshots. List every visual delta you can see: wrong border color, card too narrow, text too light, spacing too large, etc.

**2. Verify computed styles on key elements**
For each structural element you wrote CSS for, run `evaluate_script` to call `getComputedStyle(el)` and confirm the values are actually applying. Do not assume CSS written = CSS applied. Check:

```js
evaluate_script: () => {
  const el = document.querySelector('.field-yourpanel');
  const cs = getComputedStyle(el);
  return { border: cs.border, padding: cs.padding, margin: cs.margin,
           display: cs.display, maxWidth: cs.maxWidth, alignSelf: cs.alignSelf };
}
```

Focus on: `border`/`borderColor`, `padding`, `margin`, `maxWidth`, `display`, `alignSelf`, `rowGap`.

**3. Specificity audit — known form.css traps**
Check each rule you wrote against the traps in the **CSS Specificity Traps** section below. For every rule that touches `.panel-wrapper` descendants, confirm you have the `main .form form` prefix.

**4. Gap / spacing investigation**
If elements are further apart than Figma shows, measure with `getBoundingClientRect()`:

```js
evaluate_script: () => ({
  bottomOfA: Math.round(document.querySelector('.field-a')?.getBoundingClientRect().bottom),
  topOfB:    Math.round(document.querySelector('.field-b')?.getBoundingClientRect().top),
})
```

Then diagnose: excessive `margin` on a panel-wrapper item, non-zero `rowGap` on the parent grid, or `align-self: stretch` on a grid item expanding it beyond its content. Fix with explicit `margin: 0`, `row-gap: 0`, or `align-self: start`.

**5. Hidden / conditional panels**
Click through every interaction state the screen exposes. Trigger each conditional panel (select a card, toggle a radio, fill a required field) and screenshot the result. Common states to verify: image-choice `.selected`, radio `:has(input:checked)`, any panel that becomes visible after a value is picked.

**Self-annotation pattern**
Add your own critiques to the widget buffer so there's an audit trail:

```js
evaluate_script: () => {
  const el = document.querySelector('.field-somepanel');
  const r = el?.getBoundingClientRect() ?? {};
  window.__styleFeedback.push({
    id: 'a-' + Date.now() + '-auto',
    selector: '.field-somepanel',
    bbox: { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) },
    comment: 'auto-critique: [describe the delta and suspected cause, e.g. "computed border-color is #e0e0e0, expected #xxx — form.css fieldset trap"]',
    status: 'pending',
    ts: Date.now(),
  });
  return window.__styleFeedback.length;
}
```

Fix each issue exactly as in step 8, then mark it done. After the autonomous pass, tell the user: "Self-critique found N issues, fixed N. Here's the current render — use 🎯 Pick to annotate anything that's still off."

---

## CSS Specificity Traps

These `form.css` rules silently win the cascade and override your CSS. Know them before writing any rule, and check computed styles after writing to confirm your rule actually applied.

### Trap 1 — `fieldset fieldset` default border

```css
/* form.css */
main .form form fieldset fieldset {
  border: 1px solid var(--form-card-border-color); /* = #e0e0e0 */
  border-radius: var(--form-card-border-radius);   /* = 4px */
}
```

Every nested `<fieldset>` (i.e., every inner panel/fragment) gets a gray border and 4px radius unless you override it. Your rule `.field-mypanel .field-childpanel { border: 1px solid #ecedf3; }` has specificity (0,2,0) which beats (0,1,3) — **so the prefix-less rule usually wins** — but if the computed value is still wrong, add the `main .form form` prefix or use `border: none`.

For **intermediate wrapper panels** that should have no visible border at all, always add `border: none` explicitly. They will silently pick up the gray border otherwise.

### Trap 2 — `.panel-wrapper` layout rule

```css
/* form.css */
main .form form .panel-wrapper {
  display: grid;
  grid-template-columns: repeat(var(--form-columns, 12), minmax(0, 1fr));
  /* also sets padding, row-gap */
}
```

Specificity: **(0,2,2)**. Any layout override on a `.panel-wrapper` descendant (setting `grid-template-columns`, `display`, `padding`, `gap`) **must include the `main .form form` prefix** to reach (0,3,2) or higher and win.

### Trap 3 — `.panel-wrapper` default margins

Form.css applies `margin: 20px` (or a token equivalent) to items inside certain containers. When you see a large unexplained gap between two panels, check `getComputedStyle(el).marginTop` and `marginBottom`. Fix with `margin: 0` on the element — add it to your base rule, not as an afterthought.

### Trap 4 — Field wrapper `max-width`

```css
/* form.css (approximate) */
.field-wrapper { max-width: Xpx; }
```

When a button or input doesn't stretch to fill its container despite `width: 100%`, check `getComputedStyle(wrapper).maxWidth`. The form may cap field wrappers at ~272px. Fix with `max-width: none` on the wrapper:

```css
.field-mypanel .field-somebtn {
  max-width: none;
}
```

### Trap 5 — `align-self: stretch` on grid items

In a CSS Grid container (all `.panel-wrapper` elements), grid items stretch to fill the row height by default. An intermediate wrapper panel will appear much taller than its content if there's other content in the same grid row. Fix with `align-self: start` on the wrapper:

```css
main .form form .field-mypanel .field-intermediatewrapper {
  align-self: start;
}
```

### Trap 6 — `flex-wrap: wrap` in AEM panel-wrappers

AEM may render some containers as `display: flex; flex-direction: row; flex-wrap: wrap`. Children with `width: 100%` (or whose computed width equals the container width) wrap naturally to their own row, appearing visually stacked even though flex-direction is `row`. This is expected — the layout is working correctly. When diagnosing "why are these side-by-side instead of stacked" (or vice versa), check `flex-wrap` and the children's computed widths first.

### Diagnostic pattern — unknown gap

When a gap between elements is larger than expected:

```js
evaluate_script: () => {
  const a = document.querySelector('.field-panelA');
  const b = document.querySelector('.field-panelB');
  const aCs = getComputedStyle(a), bCs = getComputedStyle(b);
  return {
    aBottom: Math.round(a.getBoundingClientRect().bottom),
    bTop:    Math.round(b.getBoundingClientRect().top),
    gap:     Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom),
    aMarginBottom: aCs.marginBottom,
    bMarginTop:    bCs.marginTop,
    parentRowGap:  getComputedStyle(a.parentElement).rowGap,
    aAlignSelf:    aCs.alignSelf,
    aHeight:       Math.round(a.getBoundingClientRect().height),
  };
}
```

Typical causes: `aMarginBottom` or `bMarginTop` is `20px` (form.css default), `parentRowGap` is non-zero, or `aHeight` is much larger than the content inside (→ `align-self: stretch`).

---

### 7. Annotation loop

Tell the user the widget is ready:

> Widget injected. Click 🎯 **Pick** to highlight elements you want to fix and add a comment. When done, click 📤 **Send** and tell me you're ready.

When the user says they're ready, read **only pending** annotations (do NOT clear the buffer):

```js
evaluate_script: () => window.__styleScreen.pending()
```

Each annotation has shape `{ id, selector, xpath, bbox, comment, status, ts, doneTs? }` where:
- `id` is a unique stable identifier (e.g. `a-1730000000000-x7k2n`). Always use this for `markDone`, never the selector.
- `status` is `'pending'` until you mark it done.
- Multiple annotations can share the same `selector` — that's intentional (the user may leave several distinct comments on the same element).

The buffer is preserved — done items stay in `window.__styleFeedback` (struck-through in the widget list) so the user has audit history and the skill won't reprocess them.

Also `take_screenshot` again so each annotation's `bbox` lines up with a real rendering.

For each pending annotation, **first classify it** before attempting any fix:

| Annotation intent | Resolution |
|---|---|
| Color, typography, spacing, border, shadow, background, opacity | CSS — handle in this skill |
| Column width / field taking too much or too little horizontal space | CSS — `grid-column: span N` on `.field-{name}` scoped under the panel selector |
| Field order / position wrong (field A should be above/below field B) | **Form model** — delegate to `forms-author` |
| Fields should be grouped into a new panel / panel should be removed | **Form model** — delegate to `forms-author` |
| Field missing entirely / extra field present | **Form model** — delegate to `forms-author` |

**For form-model annotations — delegation pattern:**
1. Mark the annotation with a comment: `"[needs forms-author: <description>]"` using `markDone(id)` so the widget audit trail records it.
2. Tell the user exactly what structural change is needed:
   > "This needs a form model change — invoking `forms-author` to [move field X above Y / group fields A and B into a panel / ...]."
3. STOP and invoke `forms-author` with the exact request. Do NOT attempt CSS workarounds for structural issues.
4. After `forms-author` confirms the change, reload the form, re-isolate (step 4), re-inject the widget (step 5), then continue the annotation loop.

**For CSS annotations** — map the comment to a CSS change. **First check whether a Figma URL is in scope (from step 1a) — if yes, look up the value via the `figma` MCP rather than asking the user.**

- "padding too tight" / "spacing off" → if Figma URL: call `mcp__figma__get_figma_node` for the parent auto-layout frame and read `paddingLeft/Right/Top/Bottom` and `itemSpacing` exactly. Otherwise: estimate from the screenshot and ask the user to confirm.
- "wrong font weight" / "wrong font size" → if Figma URL: read the node's `style.fontWeight` / `style.fontSize` from the MCP response. Otherwise: read it off the screenshot and confirm with the user.
- "off color" → if Figma URL: read the node's `fills[0].color` (RGBA) from the MCP response and convert to hex. Otherwise: ask the user for the exact hex from Figma — never guess by reading a `--form-*` token value from `form.css`.
- "wrong border radius" / "shadow off" → if Figma URL: read `cornerRadius` and `effects[]` from the MCP response. Otherwise: confirm with the user.
- "field too wide / too narrow" → apply `grid-column: span N` (where N is 1–12) on `.field-{name}` scoped under the panel selector. Verify with `getComputedStyle` after injection.

### 8. Apply changes, mark annotations done, and reload

1. Edit the appropriate file for the mode:
   - **Screen-wrapper mode**: the section in `$FORMS_EDS_ROOT/blocks/form/styles/{journey}/form.css`.
   - **Fragment mode**: `$FORMS_EDS_ROOT/blocks/form/styles/fragments/{fragmentName}.css`.
2. **Mark every annotation just processed as done** by id. Multiple annotations may share a selector, so always identify by `id`:
   ```js
   evaluate_script: () => window.__styleScreen.markManyDone(["a-...","a-...","a-..."])
   // pass the ids of the annotations that were turned into CSS edits
   ```
   For a single one use `markDone(id)`. To mark every pending as done in one shot, use `markAllDone()`. Do NOT call `clear()` or `purgeDone()` unless the user explicitly asks.
3. Apply changes — branch on session flag from step 3a:
   - **`local-reload: yes`** — edit the on-disk CSS file, then reload the page. Follow the **Widget re-injection rule** at the top — `wait_for` the form, re-isolate (step 4), re-inject the widget, verify `window.__styleScreenWidget === true` before doing anything else.
   - **`local-reload: no`** — update the `#__style-screen-preview` `<style>` tag via `evaluate_script` (replace full content, do not append). Do NOT reload. Widget and annotations survive. Disk file stays untouched until step 9.

Tell the user what changed in one or two sentences (e.g. "applied 3 fixes, 0 pending"). Loop back to step 7 unless they say done.

### 9. End-of-session cleanup

When the user says they're done with this screen:
1. Search the screen's section for `/* TODO: token? */` comments. Group them, ask the user whether each new value should be promoted to:
   - `$FORMS_EDS_ROOT/blocks/form/form.css` `:root` (truly global), or
   - journey-scoped tokens at the top of `$FORMS_EDS_ROOT/blocks/form/styles/{journey}/form.css`, or
   - kept inline (one-off).
2. Remove any `!important` that crept in unless explicitly justified.
3. Verify the section passes the anti-patterns checklist.
4. Restore the original `data-visible` state on the fieldsets (using the saved values from step 4) so the form behaves normally if the user keeps the tab open.
5. **If `local-reload: no` (injection-only mode)** — write the accumulated CSS from the `#__style-screen-preview` `<style>` tag to the appropriate on-disk file now (read `el.textContent` via `evaluate_script` and write it). Tell the user: "CSS was iterated in injection-only mode — writing to disk now. Start `aem up` (or your dev server) and reload the form to verify the on-disk file looks correct."
6. Print: the journey form.css path, the section header for this screen, and a short summary of what changed. Confirm `customStylesPath` is set on the form so the CSS will load automatically (no manual `@import` needed).

### 9a. Pre-commit QA gate

Before committing any CSS files, run lint in the EDS repo:

```bash
cd $FORMS_EDS_ROOT && npm run lint
```

Fix any violations. **Do not commit if lint fails** — the pre-commit hook in `$FORMS_EDS_ROOT/.claude/settings.json` will also block the commit automatically, but running lint explicitly here catches issues before the hook fires.

> **Note:** AEM content changes (form field definitions, `customStylesPath` property) made via `forms-author` and Sites Content MCP are **live immediately** — no commit needed for those. Only EDS code changes (CSS files in `$FORMS_EDS_ROOT/blocks/form/styles/`) need to be committed.

### 9b. Commit and push EDS code changes

After lint passes, stage and commit only the CSS files written in this session:

```bash
git add blocks/form/styles/{journey}/form.css
# or for fragment mode:
git add blocks/form/styles/fragments/{fragmentName}.css
# if decorateForm.js was modified in step 2a:
git add blocks/form/decorateForm.js
```

Then commit:

```bash
git commit -m "style({journey}): apply {screen-name} screen CSS"
```

After committing, tell the user:

> "CSS committed. To go live, push this branch and create a PR — `git push` and then `gh pr create` (or raise a PR in GitHub). EDS will pick up the changes after merge."

**Do not push or create a PR automatically.** Both actions are user-triggered.

## File layout

```
$FORMS_EDS_ROOT/blocks/form/
├── form.css                              # global tokens + base styles. NOT modified by this skill.
└── styles/
    ├── {journey}/
    │   └── form.css                      # journey CSS: screen sections + @imports of any
    │                                     # fragments used by this journey
    └── fragments/
        ├── customerDetailsScreen-v1.css  # one file per fragment
        ├── etbaccountselectionscreen.css
        └── ...
```

**Two file conventions:**

- `$FORMS_EDS_ROOT/styles/{journey}/form.css` — top-level screen sections + `@import` lines for any fragments used in the journey. The journey's form.css is what AEM actually loads at runtime via the form's root `customStylesPath`.
- `$FORMS_EDS_ROOT/styles/fragments/{fragmentName}.css` — one file per fragment. Reaches the page via the journey form.css `@import`. The fragment's own `customStylesPath` is set as good hygiene (covers standalone fragment preview) but stays dormant when the fragment is embedded inside a journey — no double-loading.

Fragments can be reused across journeys; the per-fragment file ensures the same styling applies wherever the fragment renders. Per-fragment rules are scoped under `.field-{fragmentName}fragment` so they cannot bleed across screens or other fragments.

## Bundled resources

### `assets/feedback-widget.js`

The injected widget. Reads as a single self-executing script. Skill loads its contents and passes them to `evaluate_script` via chrome-devtools MCP. Provides:
- 🎯 Pick mode (hover-highlight + click + comment box)
- 📋 Annotation list (review and remove pending items)
- 📤 Send (sets `window.__styleFeedbackReady = true` and exposes `window.__styleFeedback` for the skill to read)

### `references/aem-css-conventions.md`

The AEM EDS Forms class-emission rules. **Always consult before writing a selector.** Covers field-name-to-class derivation, type wrapper classes, panel/wizard structure, state attributes, the grid system, and the cards pattern.

### `references/anti-patterns.md`

The pre-save lint checklist. Covers token discipline, DOM discipline, selector discipline, visual quality, responsiveness, animation, and file hygiene. Run through this before saving any screen rules.

### `references/widget-recovery.md`

How to bring the widget back if it's been minimized, destroyed, or wiped by a page reload. Read when the user says "the widget is gone" or "I closed the widget". Includes a bookmarklet for self-service re-injection without needing Claude.

### `references/figma-mcp.md`

How to call the `figma` MCP (Adobe-AIFoundations/adobe-mcp-servers) to extract exact design values from a Figma URL. Covers URL → fileKey/nodeId parsing, the four tools used by this skill, RGBA-to-hex conversion, and what to do when the MCP isn't running.

## What this skill does NOT do

- Modify form structure **directly** — field order, panel nesting, field add/delete are delegated to `forms-author` when detected in annotations (see step 7 classification table).
- Add custom JS components — that's `forms-custom-components`.
- Change the global tokens in `$FORMS_EDS_ROOT/blocks/form/form.css` `:root` without explicit user confirmation in step 9.
- Introduce new classes into the form's emitted DOM. AEM owns the markup; styling works with what's emitted.
- Solve the LHS / CSS-imports problem. Out of scope for now.
