# Phase 2 — Design system and app shell

The tokens, the 16 primitives, the shell, and `/dev/kitchen-sink`. First phase with pixels,
so the first where the handoff gets compared against something running.

Scope decisions taken before the work are in [PLAN.md](../../PLAN.md). Divergences from the
handoff are in [HANDOFF_NOTES.md](../../HANDOFF_NOTES.md). What follows is what the
implementation itself turned up.

## Findings

### `asChild` fails silently when the child doesn't forward props

The one that cost the most. `FilterMenuTrigger` wraps a `Chip` in `Popover.Trigger asChild`,
and the menu simply never opened — no error, no warning, correct-looking markup.

`asChild` clones the child element with Radix's props merged in: the click handler,
`aria-expanded`, the id it anchors to, the ref. `Chip` destructured only the props it knew
about and dropped the rest, so all of that went nowhere. The DOM told the story:

```
Acciones ▾   type=button class=… aria-haspopup=menu aria-expanded=false data-state=closed
Impuestos ▾  type=button aria-pressed=true data-state=on class=sd-chip
```

`Button` worked because it already spread `...props`; `Chip` didn't. Both `Chip` and
`ListRow` now type their props off the underlying element and forward the rest — and they
have to keep doing so, because nothing in the type system or the linter catches this. The
symptom is always "the overlay doesn't open", never a stack trace.

A pleasant side effect confirmed the layered selectors were right: a filter chip that is
also a popover trigger has its `data-state` **overwritten** by the popover's `open`/`closed`,
so the `[data-state='on']` rule stops matching. `[aria-pressed='true']` is what keeps such a
chip gold.

### Exit animations don't need `forceMount`

The brief expected the closing animation to be cut off without `forceMount`. It isn't:
Radix's `Presence` reads the computed `animation-name`, and when it changes on close it holds
the element mounted until `animationend`. Verified — `data-state="closed"` with
`sd-sheet-down` running, then unmount.

What it *does* require is that **enter and exit use different `animation-name`s**. `Presence`
decides an exit animation is running by comparing the previous name to the current one; a
single keyframe played in reverse looks like "no change" and the element unmounts
instantly. Hence `sd-sheet-down`, `sd-fade-out` and `sd-pop-out` alongside their entrances.

The modal needed its own pair rather than the shared `sd-pop-in`: it's centred with
`translate(-50%, -50%)`, and a keyframe that animates `transform` without carrying that
translation along throws it into the corner for the duration.

### Radix restores focus to `Dialog.Trigger` and to nothing else

`Sheet` and `Modal` are driven by `open`/`onOpenChange` so they can be opened from anywhere —
a row, a menu item, a keyboard shortcut — which means they never render a `Dialog.Trigger`.
Radix's modal `Dialog` calls `preventDefault()` on the close event, cancelling the focus
scope's own restore, and then focuses `triggerRef`. With no trigger that's a no-op, so focus
landed on `<body>`: back to the top of the page after every sheet.

This is precisely the class of bug Radix was brought in to prevent, and no screenshot would
ever have shown it.

`useReturnFocus` fixes it by capturing the opener in `onOpenAutoFocus` — which the focus
scope fires *before* it moves focus into the dialog, so `document.activeElement` is still the
opener at that point — and restoring it in `onCloseAutoFocus`. No effects, no ordering to get
wrong.

### The shell has to be exactly one viewport tall

The handoff anchors every overlay with `position: absolute` against the app container. That
only behaves if the container is the viewport's size, so `.sd-app` is `100dvh` with
`overflow: hidden` and the content column scrolls inside it. It also mirrors the prototype,
whose content area is its own scroll region.

The first version gave `.sd-contenido` only `flex: 1`, which distributes *width* in the
shell's row and says nothing about height. Outside the shell — the kitchen sink, which has no
`AppShell` — the column grew to its content and `.sd-app` clipped it: a 2900px page with no
way to scroll. It needs `height: 100%` as well.

### Hover-only expansion was a CSS problem, not a state problem

The handoff drove the rail's expansion from `useState` plus `onMouseEnter`/`onMouseLeave`,
which leaves it permanently collapsed for anyone on a keyboard. `:hover, :focus-within` on
the gap element does the same job in CSS and hands over the keyboard equivalent for free —
tabbing into the rail opens it. No state, no effect, no hydration.

### The two numeric donut tokens can't be read from CSS

`--sd-donut-grosor` and `--sd-donut-gap` both feed the `stroke-dasharray` arithmetic, which
runs during render. Reading a custom property out of the cascade needs a mounted element, so
the server and the client would disagree on the first paint. They're mirrored as
`DONUT_THICKNESS` and `DONUT_GAP` in `DonutChart.tsx` with a comment pointing back at the
tokens. Changing one without the other is the failure mode to watch for; everything the CSS
*can* express — the hub gradient, both shadows — reads `var(--sd-*)`.

The arc maths also moved to a module-level `toArcs`. The running total was being mutated
inside `.map()` during render, which the React Compiler lint rule rejects outright.

### `pageExtensions` keeps the kitchen sink out of production

`next.config.ts` only counts `*.dev.tsx` as a page in development, so
`app/dev/kitchen-sink/page.dev.tsx` isn't a route in a production build — it doesn't 404 at
runtime, it never exists. Confirmed against `next build`, which lists four routes and no
`/dev`. Typecheck and lint still cover the file.

## What could not be verified

**Neither `.dc.html` renders.** `support.js` is missing from the handoff — `<x-dc>` is a
custom element it defines, and every `{{ … }}` binding needs its runtime. Both files were
compared by reading their source, which is exact for values (the design-system page is plain
inline styles, and the prototype's markup and its style strings are both legible) but is not
the same as putting the two side by side. Flagged in HANDOFF_NOTES.md; worth exporting.

## Verified by hand

Keyboard, at 1280×800 and 390×760:

- Tab into the rail expands it; the gold focus ring is visible; the content doesn't reflow.
- Sheet and modal: Escape closes, focus is trapped while open, focus returns to the opener,
  the rest of the app goes `aria-hidden` and the scroll locks — and all of it unwinds on
  close.
- Filter menu: the search box takes focus on open and **keeps it while typing**, which is the
  whole reason it's a Popover and not a DropdownMenu. Escape closes it and focus goes back to
  the chip.
- Overlays portal into `.sd-app`, not `document.body`: the sheet's bottom edge is the app's
  bottom edge, and the menu is 300px anchored to its own chip.

One caveat on how this was checked: in a hidden browser tab Chrome doesn't dispatch
`animationend`, so `Presence` stays suspended and an overlay looks stuck open. It isn't —
forcing a paint completes the unmount. Anything timing-dependent has to be verified against a
tab that is actually rendering.

## Left for later

- The rail's header and footer slots (group picker, new expense, notifications, profile) are
  props on `Sidebar` and nothing fills them yet — they need the group and auth data from
  phase 3.
- `ActionsSheet`'s three rows close the sheet and go nowhere. Their destinations are built in
  phases 4 and 5. The sheet exists now because the FAB belongs to the shell, and a button
  that does nothing can't be compared against the prototype.
- The four screens behind the nav are placeholders on the firm grid, so the layout gets
  checked before there's content to hide behind.
