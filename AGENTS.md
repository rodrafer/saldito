<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Saldito conventions

**The general conventions are in [`CONVENTIONS.md`](CONVENTIONS.md)** — language, scaffolding,
commits, the workflow to ship to `main`, e2e tests, implementation notes, and model and
effort. That file is byte-identical in every repo under `~/workspace`; this one is only what
is true of Saldito. Both are loaded, and they are meant to be read together.

## Sources of truth

| Question              | Document                                             |
| --------------------- | ---------------------------------------------------- |
| What the product does | `design_handoff_saldito/ESPECIFICACION_FUNCIONAL.md` |
| How it looks          | `design_handoff_saldito/Prototipo.dc.html`           |
| Visual system         | `design_handoff_saldito/README.md`                   |
| Scope and phase order | `PLAN.md`                                            |

On conflict between the functional spec and the prototype: **the spec wins on
functionality, the prototype wins on visuals**. The spec is more recent and includes
decisions the prototype doesn't reflect yet.

`design_handoff_saldito/` is reference material: **it's not edited**. It's the copy of
what design delivered and has to keep being compared against the original.

## Where things that get written go

| What                                  | Where                                           |
| ------------------------------------- | ----------------------------------------------- |
| Findings from a phase                 | `docs/implementation-notes/phase-<n>-<slug>.md` |
| Discrepancies from the design handoff | `HANDOFF_NOTES.md`                              |
| Scope and phase-order decisions       | `PLAN.md`                                       |

A phase closes with its implementation note. See
`docs/implementation-notes/README.md` for what goes there and what doesn't.

## Project specifics

**Debts and balances are derived.** They're calculated from current expenses and
**never** persisted. The dollar exchange rate isn't persisted either: it's fetched fresh
and used only as an informational reference.

**`features/debts/calculation/` is pure TypeScript.** It doesn't import anything from
Next or Supabase, so it runs identically in tests, on the server when rendering, and on
the client for optimistic updates. Keep it that way.

**No hardcoded hex.** `tokens.css` is the only source of color, typography, and spacing;
components always use `var(--sd-*)`.

**ARS and USD are never mixed.** Balances, debts, and the settlement plan are calculated
per currency, separately. Amounts are integers: there are no cents.

Visual verification starts in Phase 2, comparing against `Prototipo.dc.html`.

## Generating the screenshots

```bash
npm run shots -- <output-dir> [playwright flags]
```

Playwright starts `next dev` on its own, runs whatever shot files are present and writes
`<output-dir>/<name>.png`. The browser binary isn't a dependency — `npx playwright install
chromium`, once per machine.

**What to capture is decided per PR.** There is no standard set to reproduce and no fixed
list of dimensions to walk. Take the shots that show the thing this PR builds actually
working — plus whatever you needed rendered to believe it while building, which is usually
the same set arrived at from the other direction. A tightened margin is one shot. A new
screen with an overlay, an empty state and a mobile envelope is four or five.

**The shot files are not tracked.** `tools/screenshots/*.shots.ts` is gitignored: the session
that needs captures writes them, runs them, and lets them go. Nothing in CI runs these, so a
tracked shot file would rot silently — it scrolls to a heading by name, or opens an overlay
through a button that later moves — and the person who finds out is whoever tried to reuse it
months later. What a capture proves belongs to the PR that took it, and the images are
already in that PR's description.

What _is_ tracked is the harness, because it isn't per-PR and doesn't rot:
`playwright.shots.config.ts` and `tools/screenshots/shot.ts`. `shot.ts` opens with the four
techniques that aren't obvious — arriving at focus by keyboard so `:focus-visible` applies,
framing before clicking, waiting on an overlay by role and name, and clipping to a band —
and carries `settle`, `tabTo` and `clipOf`. Read it before writing a shot file; the shape is
`test.use(DESKTOP)` or `test.use(MOBILE)`, `goto`, `settle`, `shot`.

**Where the copies end up, and how each one is presented in the PR, is step 9 of the workflow
above.**

It has to run against `next dev`, not a build: `/dev/kitchen-sink` is a page only in
development.

**This is not the e2e suite and it is not in CI.** Nothing here asserts anything — the
captures are for a reviewer to look at, and a failing capture run should not block a merge.
The e2e suite is the opposite commitment on every axis; it lives in `e2e/` and is described
below. Comparing one capture run against another is visual regression testing, which is a
third tool again with a different cost (baselines in the repo, an approval flow, its own
flakiness), and it has not landed.

## E2E tests

```bash
npm run test:e2e
```

Playwright starts `next dev` on its own and runs `e2e/*.spec.ts`. Same browser prerequisite
as the captures — `npx playwright install chromium`, once per machine. It is a separate
config from the screenshot run: `playwright.config.ts` is the suite, and it owns the default
name so a bare `npx playwright test` runs tests rather than writing PNGs.

**What earns a test, and when to ask the question, is in the general conventions above.**
What follows is what those rules come to in this repo.

Read `e2e/support.ts` before writing one. It carries the viewports, the two navigation
locators, `parkPointer`, `tabTo`, `expectFocusLoopsIn`, `expectFocusRecapturedFrom`, and the
fixture that fails any test whose page logged an error.

`activeHrefFor` is the standing example of condition 3: the rule that `/gastos/nuevo` still
lights up Gastos is a pure function over a string, so it belongs to Vitest the day a nested
route exists. What the suite checks instead is the half the function cannot be asked — that
the pathname reaches the component at all after a client-side navigation.

Condition 1's counterpart here is the capture run. Spacing, colour and gradients are its job,
never this suite's, and `waitForTimeout` is the specific fixed wait that must not appear.

### The traps, all paid for already

- **A hidden tab never dispatches `animationend`**, so Radix's `Presence` stays suspended and
  an overlay looks stuck open with nothing wrong. Headless is fine — every headless page
  reports as visible — but `--headed` with more than one worker puts pages in background
  windows. Debug with `--headed --workers=1`. This cost phase 2 an hour.
- **Register a listener in an awaited call before triggering what it listens for.** Holding
  the promise an `evaluate` returns and acting while it is in flight loses the race: the
  locator still has to be resolved over the wire. See `exitAnimationOf` in
  `e2e/overlays.spec.ts` — the failure looks exactly like the feature being broken.
- **Park the pointer.** Playwright leaves the mouse at (0, 0), which on desktop is on top of
  the rail — and the rail expands on `:hover` as readily as on `:focus-within`. A keyboard
  test can pass on a hover it never asked for.
- **Tabbing does not prove a focus trap.** Radix's `FocusScope` takes `loop` and `trapped` as
  separate props and runs its Tab handler when either is set, so a dialog that only loops is
  indistinguishable from one that traps as long as you navigate by Tab. Assert both halves —
  `expectFocusLoopsIn` and `expectFocusRecapturedFrom`.
- **`getByRole` cannot see into an `aria-hidden` subtree**, because Playwright's role engine
  skips them the way an assistive technology does. While an overlay is open that is the whole
  rest of the app, so anything reaching _behind_ the overlay needs a CSS locator. The role
  query matching nothing there is the inertness working, not a bug to chase.

### Where it runs, and what that costs

Against `next dev`, because sheet, modal and filter menu have no caller outside
`/dev/kitchen-sink` and `pageExtensions` keeps that page out of a build entirely. **Once
phases 4 and 5 ship real filter rows and real modals, move the suite onto
`next build && next start`** and test what actually ships.

It runs as its own CI job, parallel to `verify` so it never queues behind it — but it is the
slower of the two and therefore the pipeline's critical path, so what the suite costs is what
the pipeline costs. **The numbers are deliberately not written down here**: the measured cost
of each increase lives in the implementation notes of the PR that caused it, per
[`CONVENTIONS.md`](CONVENTIONS.md#what-the-suite-costs-and-what-to-do-when-it-costs-too-much).
`docs/implementation-notes/tooling-e2e-tests.md` is the baseline.

**No retries**, here or in the capture config: a test that passes on the second try is one
nobody can read a result from. Traces are kept on failure instead, and CI uploads the report.

## Before calling something done

```bash
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```

Plus `npm run test:e2e` when the change is in reach of the suite — step 3 of the workflow.
Both are what CI runs, across its two jobs.
