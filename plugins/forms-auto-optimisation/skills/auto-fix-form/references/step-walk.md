# Step-Walk Polling Loop

Used by **Phase 2B** of the `auto-fix-form` skill (Mode A only) when the form is multi-step. This is the orchestrator-side loop that walks the user through each panel, collects errors per step, and times out gracefully.

## Setup (run once after live-debug-form Step 2)

Install a **DOM MutationObserver** (not form-model subscriptions — those are wiped on panel re-init) that watches `style`, `class`, `hidden`, `data-visible`, `aria-hidden` attributes on `document.documentElement`. It records each top-level panel's first visibility transition to `window.__stepLog[]` and captures global errors to `window.__capturedErrors[]`.

Build `PANEL_MAP` from the actual panel IDs returned by the resolver — never hardcode panel names.

Reinstall the observer after any cross-domain navigation (whenever the form redirects to an off-domain page and back).

Once setup is done, proceed immediately to STATE 1.

## Four states

### STATE 1 — ACTION NEEDED (before each wait)
Read current panel fields and buttons via live-debug-form Diagnostic B + `take_snapshot`. Print a clearly formatted block showing:

- Panel name
- Fields (label, type, required)
- Primary button label

All values from the live form — **never hardcoded**.

Print a one-line action prompt at the end of the block: "Action: complete this step in the browser — I will continue automatically when the form transitions. Type `proceed` / `stop` / `skip` / `next phase` only to exit early." Do NOT interpret the panel content. Every panel of a multi-step form expects user input; that is what the polling loop waits for.

### STATE 2 — WAITING
Print a one-line status immediately after STATE 1.

### STATE 3 — Poll
Run 30-second `evaluate_script` polling windows in a loop (Chrome DevTools MCP timeout is shorter than 5 min). Each round checks `window.__stepLog.length`.

- `transitioned: true` → STATE 4a.
- `timedOut: true` → print `⏳ Still waiting…`, start the next round.
- 10 consecutive timeouts (≈ 5 min total) → STATE 4b.
- User keyword (`proceed` / `stop` / `skip` / `next phase`) → STATE 4b.

No other exit. Do not exit because: the panel needs data the agent does not have, the panel content "looks like a gate", the console shows errors, or the step has no telemetry match.

If the execution context is destroyed (cross-domain nav):
1. Call `list_pages`, take a snapshot.
2. Show an ACTION NEEDED block for the external page.
3. Poll `list_pages` every 30 s until back on the form domain.
4. Reinstall the observer.

### STATE 4a — DETECTED
Print transition info (new panel, steps done so far). Run Diagnostic F to collect errors on this step; tag each with the panel name. Loop to STATE 1 for the next panel.

### STATE 4b — PAUSED
Print:
- Completed panels (from `window.__stepLog`)
- Not-reached panels (from `window.__stepMap` filtered by `__stepLog`)

Compute not-reached **dynamically** — never hardcode. Proceed to Phase 2.M (merge) with errors collected so far, and on to Phase 3 (plan generation).

## User-driven exit

If the user types `proceed`, `stop`, `skip`, or `next phase`: stop polling immediately, print STATE 4b, and proceed to Phase 2.M (merge) → Phase 3 (plan generation). These polling-loop exit words are unrelated to the Phase 3 plan-iteration commands.
