# Tooling — splitting the conventions, and the gaps that turned up in the split

`AGENTS.md` carried two documents: rules replicated verbatim in every repo under
`~/workspace`, and rules true only of Saldito, separated by a pair of HTML comments. They
are now two files. The e2e work in
[tooling-e2e-tests.md](tooling-e2e-tests.md) is what pushed it over — that PR grew the shared
half substantially, which made the propagation story worse and the seam more obviously a file
boundary pretending to be a comment.

## Why the split lands this way

### `AGENTS.md` could never have been the shared file

The obvious arrangement — `AGENTS.md` holds the universal rules, since it is the file every
agent reads first — is ruled out by its own first six lines. `<!-- BEGIN:nextjs-agent-rules -->`
is injected by tooling and describes the stack, so the file differs per repo by construction.
Whatever is byte-identical everywhere has to be something else.

So `CONVENTIONS.md` is the shared document and `AGENTS.md` keeps the injected block, the
Saldito rules, and pointers. That also matches what `AGENTS.md` is for as a cross-tool
convention: _this repo's_ instructions.

### The file boundary is the point, not a side effect

The markers were doing a job a filename does better. Propagating a change used to mean
finding `BEGIN`/`END` in each repo and replacing between them — an edit that can half-apply,
land in the wrong place, or silently drop a section if the markers drifted. It is now `cp`.
A copy cannot half-apply.

The markers are gone rather than kept "just in case". Keeping both a file boundary and a
marker pair would mean two things to maintain that claim the same authority.

### `CLAUDE.md` imports both explicitly

`@CONVENTIONS.md` then `@AGENTS.md`, in that order, rather than relying on `AGENTS.md`
importing the conventions and the nesting resolving. Two reasons: the behaviour does not
depend on how deep import resolution goes, and agents that read `AGENTS.md` without following
`@` at all still get a prose pointer in the first paragraph. General first, project second,
so the specific one is read last.

## What the split turned up

Moving text is the cheapest possible review of it. Three things did not survive the move
intact.

### A cross-reference had already gone stale

"Step 10 is not a formality: merging is the one step in this list that can't be undone" —
except merging became step 12 when the e2e step was inserted, and the approval gate it
actually refers to became step 11. It shipped that way in the previous PR: the numbered list
was renumbered and the prose referring to it was not.

Worth recording because it is the failure mode of numbered steps in general. A convention
that says "step N" acquires a second thing to keep in sync every time the list changes, and
nothing checks it.

**And then this PR did it five more times** — caught in its own self-review. Having written
the paragraph above, the first draft referred to "step 9 of the workflow", "step 3 of the
workflow", "condition 1", "the third condition", and "step 11 is not a formality", two of
them pointing across a file boundary where a renumbering would be even less visible.

So the rule is now stated rather than merely learned: **steps and conditions are referred to
by name whenever the reference is more than a line away from the list.** Names survive
reordering, numbers do not, and the reference costs nothing extra to read — "the workflow's
e2e step" is clearer than "step 3" even when step 3 is correct. Numbers are left only inside
the lists themselves, where the reader can see what they point at.

Knowing about a hazard and being immune to it are different things, which is the more general
lesson and the reason this is written down twice.

### Step 2 was named after its artefact rather than its purpose

It read "**Screenshots** of anything with visible impact". That describes an output, and an
agent optimising for it produces images. What is actually wanted is the check — does this do
on screen what it is supposed to — with the images as the record that someone looked.

Renamed to **Visual verification**, and given two explicit exits, which is the part that was
missing:

- it looks wrong → the fix step, with the screenshot as evidence of what wrong looked like;
- it is right, but nothing would have told you if it weren't → the e2e step.

That second exit connects two steps that were previously adjacent by accident. The e2e
trigger is "what you checked by hand that would fail silently", and step 2 is precisely when
an agent is checking things by hand — so the moment of discovery and the moment of decision
are now the same moment, instead of relying on someone remembering one step later.

### The e2e rules covered writing a test and nothing after

Raised in review, and it is the same shape as the gap the previous PR fixed. The conditions
say when to write one; nothing said what happens when the behaviour it guards changes.

Two cases, and only one of them is loud:

- **The test goes red.** Loud, so it looks handled — but the failure output does not say
  whether the behaviour or the assertion is wrong, and the tempting move is to make it green.
  Now: a red e2e test is a question, and a test rewritten to match an intended change gets
  **watched to fail again**, because an edited assertion has never been proven in its new
  form. The mutation rule had a hole exactly where tests get edited rather than written.
- **The test goes stale without going red.** Silent, and the more dangerous one. A test
  pinned to a surface the behaviour has left keeps passing while nothing guards the new
  surface. Now: the test moves with the behaviour, and where it cannot yet, it says at the
  top of its file where it is pinned and what would have to exist for it to move.

That second rule has a debtor here already: three of the overlay tests are pinned to
`/dev/kitchen-sink`, which is the migration row phases 4–5 carry in
[PLAN.md](../../PLAN.md).

## The cost figures came out of the conventions

The previous PR put `~26s locally, ~30s in CI` into the conventions, having already corrected
that paragraph twice for being wrong. The third correction is structural: **a conventions
file should not contain a measurement.** It is wrong within two phases, nothing triggers a
refresh, and a stale figure is quoted as current precisely because it is written where rules
live.

What replaced it:

- **The convention carries a threshold and its levers**, not a number — when the run stops
  being something you would happily wait for locally, parallel workers first, splitting the
  job second, and if neither helps the suite is testing things that did not earn it.
- **Measurements live in the notes of the PR that changed them.** A PR that adds to the
  suite records the run time before and after and what the increase bought. Only that PR pays
  the bookkeeping, and the trend is recoverable by reading the notes in order.

The general principle, which is worth more than the specific fix: **conventions carry budgets
and triggers, notes carry measurements.** It is how `PLAN.md` already works — every row has a
trigger rather than a status — and it is the difference between a document that ages and one
that expires.

## What went up, and what deliberately did not

Extracted to `CONVENTIONS.md`: what to capture is decided per PR; the harness is tracked and
the shot lists are not; captures, an assertion suite and visual regression are three tools
with three different costs; and reference material is not edited, with the repo naming which
document wins when two disagree.

The last one is stated as an axis rather than a winner, because that is what makes it
portable: here the spec wins on functionality and the prototype on visuals, and a rule saying
"the spec wins" would have been false as often as true.

**Left project-side on purpose:** anything naming `npm run shots`, the two configs, the four
capture techniques, the viewports, `/dev/kitchen-sink`, and the `activeHrefFor` example. A
shared file that accumulates rules not every repo needs is a shared file that stops being
read.

**Not extracted, though it looked extractable:** the "where things that get written go"
table. The shared `Implementation notes` section already carries that routing, and a second
statement of it in a different shape would be two places to correct.

## Propagating this

`CONVENTIONS.md` is byte-identical across repos and this is its first version, so the other
repos under `~/workspace` need the file copied in, their `AGENTS.md` reduced to the
project-specific half plus a pointer, and their `CLAUDE.md` importing both. Repos with no e2e
suite get the e2e section anyway — it is written to say when to acquire one, not to describe
one that exists.
