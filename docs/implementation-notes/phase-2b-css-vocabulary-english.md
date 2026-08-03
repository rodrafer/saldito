# Phase 2b — CSS vocabulary to English

Cross-cutting, not a phase: tokens, component classes, Tailwind theme keys and every
remaining TS/CSS comment go from Spanish to English. Queued in
[PLAN.md](../../PLAN.md)'s cross-cutting table to land **before phase 3**, so no new screen
gets written against the old names.

The reason it happened at all is in PLAN.md under phase 2 — the premise that both `.dc.html`
files were written against the token names turned out to be false. That's a scope decision
and it stays there. What follows is what the rename itself turned up.

## Findings

### The mapping the glossary needed was the inverse of the one it had

The old `docs/glossary.md` mapped `sd-btn--primario` → `variant="primary"`: a seam between
two halves of this repo. That table is gone, because the seam is gone — props and classes now
spell the same word.

What replaced it is a table nobody would have thought to write before: repo name ← handoff
name. `design_handoff_saldito/` is never edited and its tokens stay Spanish forever, so the
day a design revision arrives it will arrive naming `--sd-dorado-tenue`. Without the table
there is no way to tell which of our tokens it means. The rename is only safe because that
mapping is written down; it is the deliverable, not documentation of the deliverable.

### `hueco` was two different words

The handoff uses it for `--sd-bg-hueco` (a dark, recessed surface) and `--sd-sidebar-hueco`
(the 76px of layout the rail is positioned against). Nothing in the Spanish distinguishes
them; a mechanical rename to one English word would have kept them looking related. They
became `--sd-bg-well` and `--sd-sidebar-gap`.

This is the one case where translating **improved** the vocabulary rather than just moving
it, and it is also the one the automated checks could never have flagged: both names resolve,
both render, and the confusion is entirely in the reader's head.

### Two theme keys now shadow a Tailwind default, on purpose

The literal translations of `--tracking-ancho` and `--ease-salida` are `--tracking-wide` and
`--ease-out`, both of which Tailwind v4 already defines. The alternatives were to invent a
non-literal name (`--tracking-caps`, `--ease-exit`) to dodge the collision.

Shadowing won. `theme.css` already replaces the whole `--radius-*` and `--text-*` scales with
the design system's, so the file's existing contract is "one name, one value, whichever file
you write it in" — and a name that means two different things depending on where it appears
is worse than a redefined default. Worth knowing when reading motion code: `ease-out` here is
an expo curve, not Tailwind's mild one.

### The verification that mattered wasn't the test suite

63 tests pass without touching an assertion, which proves the rename didn't reach the
calculation core — but the calculation core has no CSS in it, so that was never in doubt.
`typecheck` and `build` catch a renamed class only where TypeScript sees the string, which is
never: `cn('sd-btn--primary')` is just a string.

What actually catches a half-applied rename is that a `var(--sd-…)` pointing at a token that
no longer exists resolves to the empty string and silently drops the declaration. So the check
was run in the browser: collect every `--sd-*` referenced across the loaded stylesheets, and
assert each one resolves against `.sd-app`. 116 referenced, 0 unresolved. That is the
assertion this change needed, and no part of the CI pipeline makes it.

Worth keeping in mind for any future token work: a typo'd custom property is not an error
anywhere in this stack. It's a missing background.

### The kitchen sink splits down the middle, and the line isn't "where the text sits"

The page is dev-only scaffolding written in Spanish throughout. Its explanatory prose goes to
English; its sample data — `Ferretería — canilla`, `Agustín`, `Pagó Rocío · hace 2 días` —
stays Spanish, because translated it stops standing in for product content and the page stops
comparing against `Sistema de diseño.dc.html`.

The line that actually worked is **what the text is**, not which slot it sits in. Some strings
rendered _inside_ a primitive are design-system vocabulary rather than product copy — the
surface swatch captions (`modals · sheets · menus`), the `Disabled` and `Block` buttons that
name a prop, `Row with no onClick — not a button`. Those went to English while the row beside
them stayed Spanish. A rule based on position would have gotten every one of them backwards.

## Decided, and recorded in PLAN.md

- **URL paths stay Spanish** (`/gastos`, `/deudas`, `/grupo`), and so do the route folders
  that produce them. A path is an identifier and something the user reads, types and shares,
  which puts it under AGENTS.md's "text the end user sees" exception. Route components stay
  English: `app/(app)/gastos/page.tsx` exports `ExpensesPage`. The two languages meet on a
  file boundary rather than inside a name.
- PLAN.md's scaffolding tree was corrected to match — it had been drawn with English route
  folders that the code never had.

## Left as-is, deliberately

- **`docs/implementation-notes/phase-2-design-system.md`** still names the Spanish tokens. It
  is a record of what happened in that phase, so it carries a pointer to the mapping instead
  of being rewritten. A note that quietly agrees with the present isn't a record.
- **User-visible Spanish**: nav labels, `aria-label="Navegación principal"`, the fallback
  `Dialog.Title`, `ActionsSheet`, `PlaceholderScreen`, `TIME_BUCKET_LABEL`, the root
  `metadata.description`, `lang="es-AR"`.
- **`HANDOFF_NOTES.md`'s quotation** of the handoff README ("foco visible con borde dorado")
  — quoted reference material.
- **The `--sd-` / `sd-` prefix**, which is the brand rather than the language.

## Verified

`format:check · lint · typecheck · test · build` all green; 63/63 tests with no assertion
edited; `build` emits the same four routes as before.

By hand in the browser, since a rename of this shape is invisible to all of the above:

- Desktop 1280×800 — dashboard renders with the rail, the active item on its gold gradient,
  both ambient blooms, and the firm grid.
- Kitchen sink — all four card tones keep their gradients, the type scale is intact,
  `tracking-wide` still spaces the uppercase label, badges and the donut keep their semantic
  colours.
- Sheet opened from the kitchen sink — flat surface, handle, action rows sunk into the
  surface, gold focus ring on the first row. Console clean.
- Mobile 375×812 on `/gastos` — bottom bar with its blur, active item on gold at 10%, FAB
  with the gold gradient and its glow, rail correctly absent.
- Every `--sd-*` referenced in the loaded CSS resolves (116/116).
