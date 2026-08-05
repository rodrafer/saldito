# Tooling — E2E tests, and the shipping workflow that grew a step

Cross-cutting work from the table in [PLAN.md](../../PLAN.md), landing before phase 3
instead of with it. Why it moved, and what it covers, is a scope decision and lives
[in the plan](../../PLAN.md#e2e-scope-decided-before-the-work). The criteria for writing a
new one are in [AGENTS.md](../../AGENTS.md). What follows is what the implementation turned
up.

## Findings

### Registering a listener and triggering the thing it listens for is a race you lose

The one that cost the most, and the only test in the suite that failed for a reason that
wasn't the code.

`exitAnimationOf` checks the phase-2 invariant that a closing overlay animates before it
unmounts. The obvious shape is to hold the promise an `evaluate` returns and close while it
is in flight:

```ts
const started = content.evaluate(
  (el) => new Promise((resolve) => el.addEventListener('animationstart', …)),
);
await close();          // ← Escape gets there first
return started;
```

It never caught the animation. `Locator.evaluate` is not one round-trip: the locator has to
be resolved over the wire before the function runs at all, and the un-awaited call was still
resolving when the keypress landed. The listener attached to an element whose exit animation
had already started.

What makes this worth writing down is the failure mode, not the fix. It fails as
`(no exit animation started)` — **exactly** what a genuinely missing exit animation looks
like. The first read is "Radix regressed", the second is "the CSS lost a keyframe", and the
third, much later, is that the test never watched. Registration has to happen in an awaited
call, with the promise parked on `window` and read back afterwards.

The instrumented run that settled it is worth quoting, because it also confirms phase 2's
account of `Presence` mechanically:

```
animationstart  sd-sheet-up    state=open
animationcancel sd-sheet-up    state=closed
animationstart  sd-sheet-down  state=closed
animationend    sd-sheet-down  state=closed
```

The enter animation is **cancelled**, not finished, and the exit is a genuinely new
animation. That is precisely why the two keyframes need different names: a single one played
in reverse produces no `animationcancel`/`animationstart` pair for `Presence` to notice.

### The suite was mutation-tested, and that is the only reason to believe it

Eighteen passing tests prove nothing on their own — a locator that silently matches nothing,
an assertion on an attribute that is absent either way, and the run is just as green. Each
load-bearing behaviour was broken on purpose and the suite re-run:

| Mutation                                              | Caught by                         |
| ----------------------------------------------------- | --------------------------------- |
| `{...returnFocus}` dropped from `Sheet`               | 1 test — focus restoration        |
| `useOverlayContainer` returns `null` (portal to body) | 3 tests — all three portal tests  |
| `activeHrefFor` frozen at `/`                         | 2 tests — both route walks        |
| the rail's gap expands with it, pushing content       | 1 test — the reflow assertion     |
| a stray `console.error` in `AppShell`                 | 2 tests — via the fixture         |
| `Sheet`'s dialog made non-modal                       | 2 tests — the trap, and inertness |

Only the intended tests failed each time. The point of an e2e test here is to catch a silent
failure, and a test that cannot fail is itself one — which is why this stopped being a habit
and became a rule in `AGENTS.md`: **a new e2e test is not done until it has been watched to
fail.**

The last row is why. It was run during the self-review, and the **focus-trap test passed it**
— the mutation removed the trap and the test did not notice. What follows is the reason.

### `loop` and `trapped` are different props, and tabbing cannot tell them apart

The focus test walked twelve tabs and asserted focus never left the dialog. That passed on a
dialog with no trap at all, because Radix's `FocusScope` takes `loop` and `trapped`
separately and its Tab handler runs when **either** is set:

```js
if (!loop && !trapped) return; // react-focus-scope/dist/index.mjs
```

A non-modal `Dialog.Content` passes `trapFocus: false` but keeps looping, so Tab still cycles
at the edges and a Tab-only walk sees exactly what a real trap looks like. What only the trap
does is install the `focusin` listener that recaptures focus moved by anything else — a stray
`.focus()` from an effect, a late autofocus, a click on the content behind.

So the check is now two halves, `expectFocusLoopsIn` and `expectFocusRecapturedFrom`, and the
mutation fails both the trap test and the inertness test. The general lesson is the one the
mutation run exists to surface: a test can assert a true statement and still be blind to the
thing it was written for.

### `getByRole` cannot see into an `aria-hidden` subtree

Writing the recapture half turned up a second one immediately. The obvious way to reach a
control behind the overlay is
`page.locator('main.sd-content').getByRole('button').first()`, and it matches **nothing**:
while a dialog is open the rest of the app is `aria-hidden="true"`, and Playwright's role
engine skips those subtrees exactly as an assistive technology would.

Which is the inertness working, and useless when the whole point is to poke at what is
behind. A CSS locator gets there; a role locator never will. Worth knowing before spending
an afternoon on a locator that is behaving correctly.

### Radix's inertness is three separate mechanisms, and they are worth pinning down

Rather than guess at what "focus trap and scroll lock" leave in the DOM, a throwaway probe
read it. While a dialog is open:

- `body[data-scroll-locked="1"]`, plus `overflow: hidden` and `pointer-events: none` inline;
- `main.sd-content` gets `aria-hidden="true"` — the app container's other children, not the
  container;
- the content lands as a **direct child of `.sd-app`**, with no portal wrapper. The popover
  does have Radix's positioning wrapper, which is why the filter menu's portal test asserts
  `closest('.sd-app')` while the dialogs assert on `parentElement`.

These are Radix implementation details and could move on a major upgrade. That is an
argument for the tests, not against them: the upgrade that changes them is exactly when
someone needs to be told.

### The unwind is a better test than the lock

Asserting that the app goes `aria-hidden` while a sheet is open is the obvious half. The
half that would actually ship broken is the other one — an overlay that closes without
restoring it leaves every later screen invisible to a screen reader, with nothing on screen
to suggest it. Both directions are asserted for that reason, and the same goes for the
scroll lock.

### The error fixture found nothing, which is the useful result

Every test fails if its page logged a `console.error` or threw. Across all four routes, both
viewports and the kitchen sink, the baseline is silent — no hydration mismatch, and no dev
server noise that needed allowlisting. That matters more than it sounds: an assertion that
starts out dirty gets an exception, the exception gets widened, and within two phases it
asserts nothing. Starting clean is what makes it a gate.

## Decisions taken while building

### `playwright.config.ts` is the e2e suite; the captures moved to `playwright.shots.config.ts`

The two runs needed separate configs. Which one keeps the default name is a real choice,
because `npx playwright test` with no arguments is what anyone types first — and until now
that wrote PNGs into `.screenshots/`. The suite that gates a merge should be what a bare
invocation runs, so the capture config took the explicit name and `run.mjs` passes
`--config` (it has to; without it a capture run would execute the tests).

This renames a file that landed one PR ago, which is churn. It is worth it once, now, rather
than after the habit sets.

### `e2e/`, not `tests/`

`tests/` is Vitest's, and its include glob is
`{features,lib,components,app,tests}/**/*.{test,spec}.{ts,tsx}` — a spec file written there
would be collected by both runners, and the jsdom half can never pass. A top-level directory
costs nothing and makes the split structural instead of a naming convention nobody
remembers.

### It runs against `next dev`, and that is temporary

Sheet, modal and filter menu have no caller in the app: their only surface is
`/dev/kitchen-sink`, which `pageExtensions` keeps out of a production build entirely. So the
suite runs against the dev server, which is not what ships. **Phases 4 and 5 are when this
should be revisited** — once there are real filter rows and real modals, the whole suite can
move to `next build && next start`.

### No retries, in either config

A test that passes on the second attempt has told you nothing, and a retry turns that into a
green tick. Traces on failure are the trade — enough to diagnose a CI-only failure without
pretending it didn't happen. Three consecutive local runs came in at 26.1s, 26.4s and 26.2s
with no flakes, which is the number to compare against if that ever changes.

### CI gets a job, not a step

The e2e run needs `next dev`, not the build, so it has nothing to wait for and does not queue
behind `verify`. It also keeps the two red states legible: "a behaviour broke" and "lint
failed" should not be the same tick.

**It is not free, and the first draft of this note claimed it was.** "Runs in parallel, so it
costs no wall clock" is only true of a job that finishes inside the one it runs alongside.
This one does not: `verify` takes 39s and the e2e job 1m15s, so the e2e job _is_ the critical
path now and the pipeline went from ~40s to ~1m15s. Parallelism buys back `verify`'s 39s, not
the e2e run's own.

Measured across the three CI runs this branch produced, rather than quoted from one:

| Step                  | Run 1 (cold cache) | Run 2 | Run 3 |
| --------------------- | ------------------ | ----- | ----- |
| setup-node + `npm ci` | 20s                | 14s   | 18s   |
| Cache restore         | 3s                 | 3s    | 3s    |
| Chromium install      | 19s                | 11s   | 20s   |
| **The tests**         | **30s**            | 29s   | 31s   |
| **Whole job**         | 1m15s              | 1m2s  | 1m16s |

**The suite is the only stable number in that table.** Everything around it swings by up to
9s between identical runs, and the cold/warm cache distinction explains none of it — run 3
had a warm cache and the slowest Chromium step of the three. So the honest figures are: the
tests cost **~30s**, the job costs **~1m–1m15s**, and the pipeline's critical path moves from
`verify`'s ~45s to roughly that. Anything more precise is reporting runner noise.

Worth recording because two earlier drafts of this note got it wrong in the same way — first
claiming the parallel job was free, then predicting a warm-cache steady state instead of
waiting for one. A number measured once is an anecdote.

The `--with-deps` flag on the Chromium install is part of that 11–20s: it runs its `apt` step
whether or not the binary is cached, so the cache saves the ~130MB download and not the
dependency check. Dropping it would buy some of that back — ubuntu-latest ships most of those
libraries — at the cost of the run failing on a missing shared object the day the image
changes. Kept deliberately: that is a failure nobody can reproduce locally.

## The workflow change

`AGENTS.md` grows step 3, between the screenshots and the fix, and the old steps 5–11
renumber. It sits there rather than inside step 1 because it is a different kind of check:
step 1 is cheap and unconditional, while this one needs a browser binary `npm ci` doesn't
install and only says anything about changes it can reach. Next to the screenshots, both
browser passes happen together and their findings land on the same fix step.

Step 1's wording changed with it — it used to promise "the same checks CI runs", which stops
being true the moment CI has a second job.

### The criteria had no trigger, which made them unreachable

Caught in review, after the suite was already green. The three conditions answer "does this
behaviour qualify?" — but every mention of e2e in the workflow was about **running** the
suite, and the conditions themselves sat inside a section an agent only opens if it is
already thinking about e2e tests. Nothing ever posed the question.

The concrete failure: phase 4 builds the real filter row with its search field, which is the
behaviour `overlays.spec.ts` covers today against the kitchen sink. An agent runs
`npm run test:e2e`, it passes — it is still testing the kitchen sink — step 3 is satisfied,
and the real filter row ships uncovered with every box honestly ticked.

Which is the failure mode `PLAN.md` names about itself: _anything with no trigger belongs in
nobody's plan_. So the trigger is now explicit, and it is deliberately not a new ritual:

> **If you checked it by hand in a browser and it would fail silently, it earns a test.**

It fires where an agent already is — steps 2 and 3 put you in front of the running app — and
it is self-liquidating, because the hand-verification list shrinks each time it is used. It
is also the honest description of how this suite came to exist: phase 2's "verified by hand"
list was its specification.

The same paragraph now says that a repo with no suite should start one on the first
qualifying behaviour, rather than at a phase boundary. That is this task's own mistake
written down: the trigger said "phase 3, with auth", and the behaviours were sitting there
unguarded the whole time.

### The mutation check is a rule now, not an anecdote

Watching a new test fail is a completion criterion, not a nicety, and the reason is three
sections up: a test satisfied all three conditions, passed, and asserted the wrong half of
Radix's focus handling. The rule asks for the mutation and what it caught to be named in the
PR description, which is what makes it checkable by someone else instead of a claim.

> **All of this is inside the `convenciones-generales` block, replicated verbatim in every
> repo under `~/workspace`, and it needs propagating.** The conditions and the trigger moved
> up there in full; what stayed project-side is only what those rules come to _here_ — the
> `activeHrefFor` example, the pointer at `e2e/support.ts`, the traps, and the cost. Writing
> the generic half so it reads correctly in a repo with no suite yet was the work: it has to
> tell you when to acquire one, not describe one you don't have.

## Left for later

- **Auth flows**, which is what the row's original trigger was about. Phase 3 adds them; the
  suite is there by then.
- **Move onto a production build** once phases 4–5 give the overlays real callers.
- **Visual regression** is still unbuilt and still has no trigger. It is neither this suite
  nor the capture run: baselines in the repo and an approval flow are a third commitment.
- **`activeHrefFor`** — `/gastos/nuevo` lighting up Gastos — is a pure function with no
  nested route to exercise it yet. It belongs to Vitest the day one exists, not here.
