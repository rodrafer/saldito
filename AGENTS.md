<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:convenciones-generales -->

# General conventions

These rules don't depend on the stack: they apply to all my projects and **this block is
replicated identically in every repo**. If one changes, it changes everywhere. What's
specific to this project is further below.

## Language

**The repo is written in English**: identifiers, comments, documentation, commit messages,
and PR titles and descriptions. That's what lets anyone read the repo without friction.

This covers the PR even when the conversation that produced it happened in another language,
which is the case it actually gets missed in.

Two exceptions:

- **Text the end user sees** goes in the product's language.
- **Reference material delivered by third parties** (design handoffs, specs) stays as it
  arrived: it's compared against the original, and translating it breaks that.

When the domain has its own vocabulary in another language, a short glossary goes in the
repo mapping the spec's terms to the code's.

## Scaffolding architecture

**Feature-based: grouped by domain, not by file type.** Each feature gathers its own —
components, hooks, actions, schemas, types— instead of spreading them across
`components/`, `hooks/`, and `services/` folders that grow disconnected from the product.

Only what's genuinely used by several features is shared: UI primitives, utilities, and
domain types.

**Pure business logic is isolated, with no framework dependencies.** No imports from the
router, the database client, or components. That way it runs identically in tests, on the
server, and on the client, and can be reasoned about without spinning up the app.

## Commits

**Grouped by topic. No giant single commit per task.** If a change touches several
unrelated things, separate commits go out even if they came from the same session.

Each commit has to be reviewable on its own, and its message explains **why**, not just
what. A `package.json` that adds a tool goes with that tool's config, not lumped in with
every dependency in the project.

Branches `feature/<slug>`, merged via **Squash & Merge**.

**Once merged, the branch goes — local and remote.** Nothing is lost by deleting it: GitHub
keeps `refs/pull/<n>/head` pointing at the pre-squash tip indefinitely, so the PR page still
shows every individual commit and the branch can be restored from there. What is lost by
keeping them is the ability to read `git branch -r` and see what is actually in flight.

Squash & Merge replays the work as one new commit, so the branch's own commits are never
ancestors of `main`. `git branch -d` will refuse on that basis and `git branch -D` is the
correct call — the one case where that flag doesn't mean "I am discarding unmerged work".

**`git branch -r` is a local cache, not the remote.** Remote-tracking refs survive the branch
they track: delete a branch on GitHub and the local `origin/…` entry stays until something
prunes it, so the list reads as stale branches that no longer exist. Before claiming anything
about what's in flight, `git fetch --prune`, or ask the remote directly with
`git ls-remote --heads origin`.

## Workflow to ship code to `main`

In this order:

1. **Local verification** — the fast checks CI runs: format, lint, types, unit tests, build.
   CI can't run yet: there's no push or PR.
2. **Screenshots** of anything with visible impact, compared against the reference design
   if there is one.
3. **The e2e suite**, if the repo has one and the change touches anything it can reach.
4. **Fix** whatever comes up in 1, 2 and 3.
5. **Write the implementation notes.**
6. **Open the PR**, with a matching description, a link to those notes, and **assigned to
   me** — an unassigned PR has nobody waiting on it, and it's the assignee list that says
   whose turn it is.
7. **Self-review the PR** — read your own diff as if it were someone else's.
8. **Fix** whatever comes out of the review, and **update the notes and the PR description**
   if something worth recording changed.
9. **Save the screenshots** where they belong and flag it so they get pasted into the PR.
10. **Final CI check** green.
11. **Ask for explicit approval to merge**, and wait for it. Never merge on your own
    initiative, however green everything looks.
12. **Squash & Merge**, once that approval is given.

Steps 8 and 9 produce new commits, so CI runs again on its own. If the review found
nothing, that's said explicitly instead of skipping the step.

**The e2e run is its own step because it is a different kind of check, not because it is
slow.** Steps 1 and 2 are cheap and apply to every change; step 3 needs a browser binary
that `npm ci` doesn't install and a dev server it starts itself, and it only says anything
about changes it can actually reach — a migration or a pure calculation gets nothing out of
it. Sitting next to the screenshots is where it belongs: both drive the same browser, so
they get run in one pass and their findings land together on step 4. What is _not_ optional
is running it when the change is in reach of the suite. It gates the merge either way; the
only question is whether the red arrives before the push or after it.

**Every screenshot in a PR carries a heading and a line saying what to look at.** A wall of
images is work for the reviewer: they have to infer what each one is meant to prove and
whether it proves it. The heading names the state — which screen, which viewport, which
overlay open — and the line points at the specific thing that changed, so a reviewer can
tell agreement from oversight without reading the diff first. The body of the PR carries
those headings before the screenshots exist, each with a marker where the image goes.

**Every PR description carries a `## Review guide`.** It says what order to read the files
in, why that order, and what can be skipped. The point is to spend the reviewer's attention
where it changes the outcome: start at the file that carries the decision, not at the top of
the alphabet, and name outright the parts that are mechanical, generated, or the same edit
repeated — a PR where twenty of twenty-five files are one rename applied over and over should
say so, instead of letting the reviewer discover it on file eleven. Saying "skip these" is
the part that makes it a guide rather than an index.

**A mermaid diagram goes in when the PR introduces or rewires relationships between
modules** — and stays out otherwise. It has to show what the diff doesn't make obvious: a
dependency through context, a new seam, who calls the new thing, and **the untouched files
the new code leans on**, which are precisely the ones a diff never mentions. A diagram that
restates the changed-file list is redundant with what GitHub already shows above it.

Deliberately not mandatory. Nothing verifies a diagram against the code, so it rots faster
than prose, and a wrong architecture diagram is worse than none because it gets believed. On
a mechanical change or a contained fix, leave it out.

**The title and description describe the PR as it stands, not as it was opened.** Anything
that lands afterwards — review fixes, a scope that grew, work that rode along — updates the
description whenever it changes what a reviewer should expect to find, and updates the
**title** too once the title has stopped naming what is actually in there. A description that
only matches the first push is worse than a thin one, because it still gets read as current.

**`🤖 Generated with [Claude Code](https://claude.com/claude-code)` goes last, always.**
Appending a new section is the easy way to bury it mid-body; every rewrite puts it back at
the bottom.

Step 10 is not a formality: merging is the one step in this list that can't be undone
quietly, and it's the last chance to catch something the automated checks can't see. A green
pipeline says the code runs, not that it's the right code.

## Implementation notes

Every task that lands on `main` closes with a document in
`docs/implementation-notes/`, written **before opening the PR** and linked from its
description.

They keep what the code can't tell on its own: why one path was chosen over another, what
was discarded, what broke along the way. The diff shows _what_ changed; the notes explain
_why_.

What's most valuable are the **findings**: when the implementation contradicts the spec,
when a tool behaves differently than expected, or when a test finds something no one had
anticipated. That's lost as soon as the session ends if it doesn't get written down.

They don't repeat what the code already says. If something is clear from reading the diff,
it doesn't go here.

**Notes are not where scope changes get recorded.** A decision taken _before_ the work —
adding a dependency, dropping something from the phase, changing the approach — belongs in
the planning document, because that's what the next session reads to know what to build. A
plan that only gets corrected in hindsight is stale from the moment the work starts.

The line is when the decision happened, not how important it was:

- **Decided in advance** → planning document, stated as scope. The notes then carry the
  reasoning and whatever the implementation actually revealed about it.
- **Discovered while implementing** → notes. That's a finding.

When a decision changes the scope of a phase, say so and update the plan before writing
code, rather than letting the notes absorb it later.

## Model and effort

**At the start of every session**, before anything else, check the active model against
what the task actually needs. The model is visible in the system prompt; the effort level
often is not — when it isn't, ask rather than assume.

If they don't match the task, say so and recommend the change **before** starting work.

**Prefer switching in place over discarding the session.** The cost of switching is a
prompt-cache invalidation, which scales with accumulated context: on the first turn it is
nearly free, after an hour of work it is not. Only suggest starting over when the wrong
setup already produced substantive work — that work stays in context and anchors whatever
comes next.

**When handing off a prompt for a new session** — or whenever it becomes clear one is
about to start — recommend a model and effort level for it, with one line of reasoning.

The criterion is how much reasoning depth the task demands and how good the automated
verification is, not the size of the diff. A thousand-line migration covered by tests
needs less than a twenty-line change to money-splitting logic.

<!-- END:convenciones-generales -->

# Saldito conventions

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

Read `e2e/support.ts` before writing one. It carries the viewports, the two navigation
locators, `parkPointer`, `tabTo` and `expectFocusTrappedIn`, and the fixture that fails any
test whose page logged an error.

### What earns an e2e test

Three conditions, and it takes all three:

1. **Only a real browser can prove it.** Focus, portalling, CSS-driven layout, scroll
   locking, animation lifecycles, hydration. If jsdom can see it, Vitest is cheaper, faster
   and easier to read — put it there.
2. **It fails silently.** No exception, no red, nothing a reviewer would notice on the
   screen: focus landing on `<body>` instead of the opener, an overlay anchored to the wrong
   box, a search field that quietly stops receiving keystrokes. A behaviour that fails loudly
   already has a reporter.
3. **Nothing cheaper already covers it.** A pure function reachable from a unit test is a
   unit test even when it drives something visual. `activeHrefFor` — the rule that
   `/gastos/nuevo` still lights up Gastos — is the standing example: it belongs to Vitest the
   day a nested route exists, and what the e2e suite checks instead is that the pathname
   reaches the component at all after a client-side navigation.

**What doesn't earn one:** anything a screenshot answers better (spacing, colour, gradients
— those are the capture run's), the happy path of a function already under unit test, and
anything needing a fixed wait to pass. A test that needs `waitForTimeout` is a test that
hasn't found what it is really waiting for; the web-first assertions retry on their own, and
if none of them expresses the condition, that is the thing to fix.

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

The whole run is ~26s locally including the dev server's own start-up, and ~29s in CI. It
runs as a job parallel to `verify` so it does not queue behind it, but it is the slower of
the two and therefore the pipeline's critical path: **~1m2s of wall clock against `verify`'s
42s**, of which under half is the suite. **No retries**, here or
in the capture config: a test that passes on the second try is one nobody can read a result
from. Traces are kept on failure instead, and CI uploads the report.

## Before calling something done

```bash
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```

Plus `npm run test:e2e` when the change is in reach of the suite — step 3 of the workflow.
Both are what CI runs, across its two jobs.
