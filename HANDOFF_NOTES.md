# Handoff notes

Differences found while importing the design material. **To be resolved in Phase 2**, when
porting the primitives to `components/ui/`. Don't touch `design_handoff_saldito/`: it's the
reference copy and stays as it arrived.

## To fix when porting

| Component                                                  | What happens                                                          | How it's resolved                                                                                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Toast`                                                    | Uses `duration = 2400`, but spec section 9 sets **2600ms**            | Spec wins: default to 2600                                                                                                                   |
| `Sheet`, `Modal`                                           | Don't close on Escape; only `Dropdown` does                           | The spec and the README ask that Escape close **any** overlay                                                                                |
| `ListRow`                                                  | `onClick` on a `div`, without role or keyboard focus                  | Has to be keyboard-accessible when clickable                                                                                                 |
| `SegmentedControl`, `DropdownItem`, `BottomNav`, `Sidebar` | Same case: clickable `div` with `role`/`aria` but no keyboard support | Native element or `tabIndex` + keyboard handler                                                                                              |
| `DonutChart`                                               | Hardcodes the hub gradient (`#24222A`…), `GAP = 17`, and the shadow   | There are tokens for that: `--sd-donut-gap`, `--sd-donut-grosor`, `--sd-sh-donut`, `--sd-sh-donut-hub`. The handoff rule is no hardcoded hex |
| `Sidebar`                                                  | The comment says "fixed gap of 88px"                                  | The real token is `--sd-sidebar-hueco: 76px`. Stale comment                                                                                  |
| `tokens.css`                                               | Brings in the Archivo font via a Google Fonts `@import`               | Move to `next/font/google`: avoids the blocking request and the layout shift                                                                 |

## Verified, not a problem

- `Chip` doesn't apply an `sd-chip--activo` class, but that's **fine**: `components.css`
  styles the state with the attribute selector `.sd-chip[aria-pressed='true']`.

## Pending import

Still missing from the Claude Design project, because they're large files or low value for
the code:

- `Prototipo.dc.html` and `Sistema de diseño.dc.html` — **visual source of truth**. Needed
  before Phase 2.
- `tokens/tokens.json` — tokens as data, meant for generators. Not used: `tokens.css` is the
  source of truth.
- `support.js` — support script for the prototypes, not for the target stack.
