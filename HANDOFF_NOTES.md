# Handoff notes

Differences found against the design material. `design_handoff_saldito/` is the reference
copy and is never edited; this file is where the divergences live.

Token and class names below are the repo's, which are in English while the handoff's are in
Spanish. `docs/glossary.md` maps the two.

## Resolved in Phase 2

The seven items found while importing, and what happened to each when the primitives were
ported to `components/ui/`.

| Component                                                  | What happened                                                       | How it was resolved                                                                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Toast`                                                    | Used `duration = 2400`, but spec section 9 sets **2600ms**          | Spec won. `TOAST_DURATION_MS = 2600`                                                                                                              |
| `Sheet`, `Modal`                                           | Didn't close on Escape; only `Dropdown` did                         | Radix Dialog. Escape, focus trap, focus restoration and scroll lock all come with it                                                              |
| `ListRow`                                                  | `onClick` on a `div`, without role or keyboard focus                | A clickable row is a `<button>`; a display-only row stays a `div` rather than becoming a button that does nothing                                 |
| `SegmentedControl`, `DropdownItem`, `BottomNav`, `Sidebar` | Clickable `div`s with `role`/`aria` but no keyboard support         | Radix ToggleGroup and DropdownMenu for the first two; `next/link` for the two navs, which are links and not buttons                               |
| `DonutChart`                                               | Hardcoded the hub gradient (`#24222A`…), `GAP = 17`, and the shadow | Shadows and the hub read tokens now. The hub gradient had no token, so `--sd-donut-hub` was added — see the finding on the two numeric ones below |
| `Sidebar`                                                  | Comment said "fixed gap of 88px"                                    | The real token is `--sd-sidebar-gap: 76px`. Comment rewritten in both the component and `components.css`                                          |
| `tokens.css`                                               | Pulled Archivo in with a Google Fonts `@import`                     | `next/font/google`, which self-hosts it. `--sd-font` now reads the `--font-archivo` that the root layout defines                                  |

### Verified, not a problem

- `Chip` doesn't apply an `sd-chip--active` class, but that's **fine**: `components.css`
  styles the state from the attribute selector. Radix adds `data-state`, which is now
  covered by the same rule — and it earns its keep, because a filter chip that is also a
  popover trigger has its `data-state` overwritten by the popover's open/closed. The
  `aria-pressed` selector is what keeps such a chip gold.

## Open divergences

Places where the three layers of the handoff — the README, `components.css`, and the
prototype — disagree with each other. The rule used throughout: **the prototype wins when
the difference is structural and would show up in a screenshot; `components.css` wins on
values it expresses as tokens and the prototype hardcodes.**

All of these were checked against **both `.dc.html` files rendered**, once `support.js`
arrived. Serve the folder and open them — `.claude/launch.json` has a `handoff-reference`
config that does exactly that.

### Taken from the prototype

- **`BottomNav` has no captions.** `components.css` defines `.sd-bottomnav__label` and the
  design-system page draws a 10.5px caption under each icon; the prototype's bar is icons
  only. Confirmed against the render — items are `flex: 1 1 0%`, 44px tall, 22px glyphs,
  radius 16, with no text node at all — and confirmed as intended for mobile. The caption
  became the accessible name, and `.sd-bottomnav__label` was dropped rather than left as
  dead CSS.
- **Rail padding is 10px and its items are 6px apart**, not the 8px `components.css` had.
  The render confirms 10px padding, 8px between rail groups, 6px within the item list, and
  a 44px icon box.
- **The FAB sits `-24px` above the bar with 8px of air on each side.** `components.css` said
  `margin-top: -26px` and nothing horizontal. The offset moved to `.sd-bottomnav__fab` so
  `.sd-fab` doesn't carry its own position.
- **The sheet is flat `--sd-surface` with no shadow**, against both the README and the
  design-system page, which assign the elevated gradient to "modales · sheets · menús".
  Rendering settled it: every one of the eight desktop modals in the prototype _does_ use
  the elevated gradient, so the flat sheet is a deliberate distinction between the two
  envelopes rather than an oversight. The handle stays on `--sd-border-strong`; the
  prototype's `#3A3740` is not a token and is three units away.
- **`.sd-row--action` sits on `--sd-surface-input`.** It was on the card gradient, which
  inside a sheet inverts the relationship: the rows read as raised cards over the sheet
  instead of wells sunk into it. That inversion is plainly visible side by side. The
  design-system page's standalone sample does use the gradient, but it sits on a card, not
  in a sheet.
- **Modal padding is 26px.** `components.css` said 22. Five of the eight modals in the
  prototype use 26 and the rest 24.

### Kept from `components.css`

- **`sd-sheet-up` runs 220ms on `cubic-bezier(.16,1,.3,1)`.** The prototype's inline style
  says 280ms on `(.2,.8,.2,1)`, but both the README and the design-system page publish the
  220ms figure, and there are tokens for it. Motion doesn't show in a screenshot, so the
  documented value wins.
- **The modal radius stays 16px.** All eight modals in the prototype use 18, but the radius
  scale documents "16 · modal" and there is no 18px token that isn't the rail's. Two pixels
  on a 480px corner. Raised for a designer's call and **confirmed at 16**: the token scale
  wins over an unanimous prototype when the gap is smaller than the cost of a token that
  exists only to hold it.
- **Near-miss colours were rounded to their token.** The prototype uses `#2A2831` for the
  rail border, `#2C2A31` for the bar's, and `#23222A` for the rail's footer rule — none of
  them tokens, all within a few units. The bar's border did move from `--sd-border-strong`
  to `--sd-border`, which is twice as close to what the prototype actually paints.
- **Rail labels are 14px**, the `--sd-fs-body-lg` token. Both prototype and design-system
  page say 13.5px, which is not on the type scale at all.

### Not covered by the handoff

- **The mobile/desktop breakpoint is 900px.** The handoff never names one: it describes
  "mobile 390×760" and "desktop" as two modes, and the prototype switches between them with
  a toggle rather than a media query. 900px is where the firm grid stops being cramped —
  76px of rail plus 40+40 of padding plus the 300px column and its 20px gap leave ~424px for
  the main column.
- **Focus is a 2px gold outline at 2px offset.** The README asks for "foco visible con borde
  dorado" and reserves `--sd-border-accent` for it, but no file in the handoff draws one.

## The import is complete

`support.js` arrived during phase 2 and both `.dc.html` files render. That matters more than
it sounds: the whole arbitration above had been done by reading source, and rendering
overturned three of the calls — the sheet's surface, the action row's, and the modal's
padding. Anything decided against the prototype from now on should be decided with it open.

To open them: `preview_start` the `handoff-reference` config in `.claude/launch.json`, which
serves `design_handoff_saldito/` over HTTP. `file://` won't do — the runtime is loaded with a
relative `<script src="./support.js">`.

The only piece still absent is `tokens/tokens.json`, tokens as data for generators, and that
one is deliberate: `tokens.css` is the source of truth.
