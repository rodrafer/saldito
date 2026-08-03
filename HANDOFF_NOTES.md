# Handoff notes

Differences found against the design material. `design_handoff_saldito/` is the reference
copy and is never edited; this file is where the divergences live.

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
| `Sidebar`                                                  | Comment said "fixed gap of 88px"                                    | The real token is `--sd-sidebar-hueco: 76px`. Comment rewritten in both the component and `components.css`                                        |
| `tokens.css`                                               | Pulled Archivo in with a Google Fonts `@import`                     | `next/font/google`, which self-hosts it. `--sd-font` now reads the `--font-archivo` that the root layout defines                                  |

### Verified, not a problem

- `Chip` doesn't apply an `sd-chip--activo` class, but that's **fine**: `components.css`
  styles the state from the attribute selector. Radix adds `data-state`, which is now
  covered by the same rule — and it earns its keep, because a filter chip that is also a
  popover trigger has its `data-state` overwritten by the popover's open/closed. The
  `aria-pressed` selector is what keeps such a chip gold.

## Open divergences

Places where the three layers of the handoff — the README, `components.css`, and the
prototype — disagree with each other. The rule used throughout: **the prototype wins when
the difference is structural and would show up in a screenshot; `components.css` wins on
values it expresses as tokens and the prototype hardcodes.** Worth a designer's call.

### Taken from the prototype

- **`BottomNav` has no captions.** `components.css` defines `.sd-bottomnav__label` and the
  design-system page draws a 10.5px caption under each icon; the prototype's bar is icons
  only, `flex: 1`, 44px tall, 22px glyphs. The handoff's own tiebreaker is explicit —
  _"ante cualquier duda, manda el prototipo"_ — so the caption became the accessible name
  instead of visible text, and `.sd-bottomnav__label` was dropped rather than left as dead
  CSS. **This is the one worth confirming**: it's the most visible difference between the
  two documents, and the design-system page is not obviously the older of the two.
- **Rail padding is 10px and its items are 6px apart**, not the 8px `components.css` had.
  The prototype and the design-system page agree with each other here.
- **The FAB sits `-24px` above the bar with 8px of air on each side.** `components.css` said
  `margin-top: -26px` and nothing horizontal. Since the whole bar follows the prototype, so
  does this; the offset moved to `.sd-bottomnav__fab` so `.sd-fab` doesn't carry its own
  position.

### Kept from `components.css`

- **The sheet uses the elevated gradient**, not the flat `#1B1A1F` the prototype paints. The
  design-system page names that gradient for "modales · sheets · menús" explicitly, and the
  prototype's sheet also drops the shadow and uses a non-token handle colour (`#3A3740`) —
  three signs it predates the token layer.
- **`sd-sheet-up` runs 220ms on `cubic-bezier(.16,1,.3,1)`.** The prototype's inline style
  says 280ms on `(.2,.8,.2,1)`, but both the README and the design-system page publish the
  220ms figure, and there are tokens for it. Motion doesn't show in a screenshot, so the
  documented value wins.
- **`.sd-row--accion` keeps the surface gradient.** The prototype's action rows in the FAB
  sheet are flat `#111013`; the design-system page's action row uses the gradient.
- **Near-miss colours were rounded to their token.** The prototype uses `#2A2831` for the
  rail border, `#2C2A31` for the bar's, and `#23222A` for the rail's footer rule — all
  within a couple of units of `--sd-border` / `--sd-border-fuerte`, none of them tokens. The
  no-hardcoded-hex rule wins over a difference nobody can see.
- **Rail labels are 14px**, the `--sd-fs-body-lg` token. Both prototype and design-system
  page say 13.5px, which is not on the type scale at all.

### Not covered by the handoff

- **The mobile/desktop breakpoint is 900px.** The handoff never names one: it describes
  "mobile 390×760" and "desktop" as two modes, and the prototype switches between them with
  a toggle rather than a media query. 900px is where the firm grid stops being cramped —
  76px of rail plus 40+40 of padding plus the 300px column and its 20px gap leave ~424px for
  the main column.
- **Focus is a 2px gold outline at 2px offset.** The README asks for "foco visible con borde
  dorado" and reserves `--sd-border-acento` for it, but no file in the handoff draws one.

## Still missing from the import

- **`support.js`** — without it neither `.dc.html` renders: `<x-dc>` is a custom element that
  script defines, and every `{{ … }}` binding needs its runtime. Both files were compared by
  reading their source instead, which is exact for the design-system page (plain inline
  styles) and for the prototype's markup, but means **nobody has yet seen the reference
  rendered side by side with the build**. Worth exporting from the Claude Design project.
- `tokens/tokens.json` — tokens as data, for generators. Not used: `tokens.css` is the
  source of truth.
