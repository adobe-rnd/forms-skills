# CSS Anti-patterns — Lint Checklist

Run through this list before saving any screen CSS. Each item links to a hard rule.

## Token discipline

- **No magic colors.** Every color must reference a `--*` variable from `form.css` `:root` or a journey-scoped token. Inline hex/rgb/oklch values are flagged with `/* TODO: token? */`.
- **No magic spacing/font sizes.** Same rule applies to `padding`, `margin`, `gap`, `font-size`, `line-height`. If a value isn't in the token system, mark it with `/* TODO: token? */` and decide at session end whether to promote.
- **No hard-coded font-family.** Use `var(--font-family-default)` (already defined globally).

## DOM discipline

- **No new classes.** Do not add `class="..."` to the form's emitted HTML. Style only the classes AEM emits (see `aem-css-conventions.md`).
- **No element reordering** via CSS hacks (`order:`, `display: contents` to reparent). If layout requires reorder, use grid `grid-area` mapping on existing structure.
- **No inline styles** in JS that bypass the CSS file.

## Selector discipline

- **Scope to the screen panel.** Every screen-specific rule must start with `.field-{panelName}` (the screen's outer `panel-wrapper`) so it cannot bleed to other screens.
- **No global resets.** Avoid `*`, `body`, or unscoped `input { ... }` in screen CSS. Only `form.css` may set base styles.
- **No `!important`** unless overriding a third-party style. Increase specificity with stable classes instead (`.field-foo legend.field-label` beats `legend !important`).

## Visual quality

- **Contrast ≥ 4.5:1** for body text against background (WCAG AA). 3:1 for large text (≥ 18px / ≥ 14px bold).
- **Focus state always visible.** Never `outline: none` without replacing it with a visible alternative (box-shadow ring, border-color change).
- **Touch targets ≥ 44×44px** for inputs, buttons, radios, checkboxes on mobile.
- **No purple gradients, no gradient text, no neon glows.** These are AI-generated tells. Solid fills, deliberate accent only.
- **No nested cards more than one level deep.** A card inside a card inside a card is always wrong.
- **No drop-shadows on text.**
- **No transforms on body/main containers** — they break `position: fixed` for child overlays.

## Responsiveness

- **Mobile-first.** Default rules target ≤599px; use `@media (width >= 768px)` for tablet/desktop progressive enhancement.
- **No fixed widths > 360px** without a max-width fallback for narrow viewports.
- **Test at 320px, 375px, 768px, 1024px, 1440px.**

## Animation

- **Respect `prefers-reduced-motion`.** Wrap any non-trivial animation in `@media (prefers-reduced-motion: no-preference) { ... }`.
- **Transitions ≤ 200ms** for UI feedback; ≤ 400ms for entrance/exit. Anything longer feels broken.

## File hygiene

- **No commented-out code blocks.** If `form.css` has commented-out blocks (it does — many), do not propagate them into screen files. Decide: keep or remove.
- **One concern per file.** A screen file styles that screen, period. Cross-cutting concerns (typography scale, button variants) belong in `form.css` or a journey-level common file.
