# Tooling — Playwright and the scripted screenshot run

Cross-cutting item from `PLAN.md`, due before phase 3's captures. Phase 2's eleven shots
came from a throwaway Node script driving Chrome over CDP; it lived in a session scratchpad
and no longer exists, so this is a rewrite against the same eleven states, not a move.

**This is not the e2e suite.** Nothing asserts anything and nothing runs in CI. E2E stays a
separate item in the plan, landing with phase 3's auth.

## Why a name that isn't `phase-<n>-`

The notes convention is one file per phase. This belongs to no phase — that is the whole
point of the "Cross-cutting work" table — and filing it as `phase-2c-` would put screenshot
tooling under the design system, where nobody looking for it would think to check.
`docs/implementation-notes/README.md` now names the cross-cutting case explicitly.

## Shape

`@playwright/test` as the runner rather than the bare `playwright` library. Three things it
brings that would otherwise be hand-written: `webServer` starts `next dev` and tears it
down, `projects` carry the two viewports without either shot file knowing about the other,
and `--project` / `-g` make it cheap to iterate on one shot.

The destination directory can't be a Playwright argument — its CLI reads bare arguments as
test-file filters — so `tools/screenshots/run.mjs` takes it, exports it as `SHOTS_OUT`, and
forwards everything after it untouched. It also expands a leading `~`, which the shell won't
do inside the quotes the convention's `#` in the folder name forces.

Shot names are English now (`02-desktop-rail-expanded`, not `02-desktop-rail-expandido`).
Phase 2's PR predates the vocabulary migration; the numbering and the framing are unchanged,
so the two sets still line up shot for shot.

## Findings

**`deviceScaleFactor` in the shared `use` block is silently discarded.** A project's `use`
merges over the shared one key by key, and every `devices[…]` preset sets
`deviceScaleFactor` itself — so spreading a preset inside a project resets it to 1 with no
warning. The run looked correct and produced 1280×800 PNGs where phase 2's were 2560×1600.
Nothing in the output says which of the two you got; the only tell is the file dimensions.
It now lives on each project, past the spread.

**The pointer stays where the last click left it, and hover states go into the shot.** The
mobile actions sheet opened under the FAB, which left the cursor resting on its third row:
the capture came out with one row in the gold hover state, a combination no user is ever in.
`shot()` parks the pointer at the top-right corner before capturing. Top-_left_ would have
been worse than doing nothing — that is the rail's hover zone, and it would have expanded
the rail in every desktop shot.

**Programmatic focus can't produce the shot that proves keyboard focus.** Shot 02 exists to
show the gold ring on the rail. The ring is `:focus-visible`, which Chromium grants on
keyboard-driven focus and withholds from `element.focus()` — so the obvious way to write it
yields an expanded rail with no ring, and the shot quietly stops proving its own caption.
It presses Tab until the rail item is `document.activeElement`.

**Clicking is not framing.** Playwright scrolls only far enough to click, which for the
filter menu meant a viewport cut through the middle of the card above and the popover
wherever it happened to land. Any shot whose subject is reached by clicking needs its own
`scrollIntoView` first; the click then finds the element already on screen and moves nothing.

## What the self-review changed

Every finding above is the same failure mode: **the run stays green and the picture stops
being true.** There are no assertions here, so nothing else notices. The review went looking
for the rest of that class and found three:

- The Tab loop in shot 02 gave up after five presses and captured whatever it had, which is
  a collapsed rail with no ring — a picture of the bug the shot exists to prove is fixed. It
  now throws.
- A page that threw mid-capture produced a normal-looking PNG. Errors are collected per shot
  and fail it.
- Shot 10's clip repeated `390` and `760` as literals while the viewport is set in the
  config, so changing one would have silently cropped the other. It measures.

## Left for later

- The set is phase 2's eleven. Each phase from here adds its own, and the older ones stay so
  a reviewer can see what a change did to a screen that wasn't the point of the PR.
- Nothing compares two runs. Playwright ships `toHaveScreenshot` with a diff report, which
  would turn this into visual regression testing — a different commitment, and one that
  needs a baseline in the repo. Not now, and not without deciding where the PNGs live.
