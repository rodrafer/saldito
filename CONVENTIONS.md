# General conventions

These rules don't depend on the stack: they apply to every project of mine, and **this file
is byte-identical in every repo**. If a rule changes it changes everywhere — edit it here and
copy the file across. There is no per-repo variation to reconcile, which is the whole reason
it is a file rather than a section: a copy cannot half-apply, and a marker-delimited edit
can.

What is specific to a project lives in that repo's `AGENTS.md`, next to whatever stack rules
its tooling injects. The two are written to be read together — this file says what the
practice is, `AGENTS.md` says what it comes to there.

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

## Reference material and who wins

Specs, design handoffs and prototypes arrive from outside and **are not edited**. They are
the copy of what was delivered and have to stay comparable against the original, so
corrections go in the repo's own notes, never into the source document.

**When two reference documents disagree, the repo says which one wins, and on what.** They
will disagree — they are written at different times by different people — and the arbitration
has to be settled once, in writing, rather than re-argued per conflict by whoever hits it. It
is rarely one document winning outright: the useful form names the axis, so a newer
specification can win on behaviour while the drawn artefact wins on appearance.

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
2. **Visual verification** — drive what you built and check it does on screen what it is
   supposed to, against the reference design if there is one. The screenshots are the
   record of having looked, not the point of looking.
3. **The e2e suite**, if the repo has one and the change is in reach of it — and whether
   anything you just verified by hand belongs _in_ it. See [E2E tests](#e2e-tests).
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

The review-fix and screenshot-saving steps produce new commits, so CI runs again on its own. If the review found
nothing, that's said explicitly instead of skipping the step.

(Steps are referred to by name rather than number wherever the reference is more than a line
away from the list. A numbered list acquires a second thing to keep in sync every time it
changes, and nothing checks it — which is exactly how a stale "step 10" survived a
renumbering.)

**Visual verification is a check, and it has two exits.** Taking pictures is not the job — establishing
that the thing behaves as intended is, and the images are what lets someone else confirm it
without rebuilding your branch. So it produces findings like any other check:

- **It looks wrong** → **Fix**, with the screenshot as the evidence of what wrong looked like.
- **It is right, but nothing would have told you if it weren't** → **the e2e suite**. A behaviour you
  had to check by eye, that fails without an error, is the definition of what earns an e2e
  test — and you are already in the browser, which is the cheapest moment to notice.

That second exit is why the two sit together, rather than the visual pass being an
afterthought once the code is written.

**The e2e run is its own step because it is a different kind of check, not because it is
slow.** Local verification and the visual pass are cheap and apply to every change; this one needs a browser binary
that `npm ci` doesn't install and a dev server it starts itself, and it only says anything
about changes it can actually reach — a migration or a pure calculation gets nothing out of
it. Sitting next to the screenshots is where it belongs: both drive the same browser, so
they get run in one pass and their findings land together on **Fix**. What is _not_ optional
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

The approval step is not a formality: merging is the one step in this list that can't be undone
quietly, and it's the last chance to catch something the automated checks can't see. A green
pipeline says the code runs, not that it's the right code.

## Screenshots

The captures a PR carries. How they are taken is the repo's business; what follows holds
regardless of tooling.

**What to capture is decided per PR.** There is no standard set to reproduce and no fixed
list of dimensions to walk. Take the shots that show the thing this PR builds actually
working — plus whatever you needed rendered to believe it while building, which is usually
the same set arrived at from the other direction. A tightened margin is one shot. A new
screen with an overlay, an empty state and a mobile envelope is four or five.

**The harness is tracked; the shot lists are not.** Whatever fixes viewports, scaling, font
readiness and the techniques that aren't obvious is durable and belongs in the repo. The
per-PR script that walks a particular screen does not: nothing in CI runs it, so it rots
silently — it scrolls to a heading by name, or opens an overlay through a button that later
moves — and the person who finds out is whoever tried to reuse it months later. What a
capture proves belongs to the PR that took it, and the images are already in that PR's
description.

**Captures, an assertion suite, and visual regression are three different tools.** They get
collapsed constantly, so: a capture run asserts nothing and a human looks at its output once,
which is why it must never gate a merge. An e2e suite asserts, gates, and pays CI time for
the privilege. Visual regression compares one run against another, and its cost is neither of
the above — baselines committed to the repo, an approval flow for every intended change, and
a flakiness budget of its own. Wanting the first is not a reason to acquire the third.

## E2E tests

Not every repo needs an e2e suite and none should have one by default. This is when a
behaviour deserves one — the part that gets forgotten, which is when to ask the question at
all — and what happens to it afterwards.

### Verifying by hand is the trigger

**If you checked it by hand in a browser and it would fail silently, it earns a test.**

That is the whole trigger, and it fires where you already are: steps 2 and 3 put you in front
of the running app, and whatever you find yourself clicking through is by definition what
nothing else covers. A suite grown this way _replaces_ a hand-verification list instead of
accumulating next to one.

The inverse carries as much weight. A behaviour nobody thought to check by hand either fails
loudly or doesn't matter yet, and neither earns a test.

**If the repo has no suite, this is when to start one.** The first behaviour that meets the
conditions below is the reason to add the harness — not a phase boundary, not a milestone,
not a "flow worth driving end to end". Waiting for one of those is how a list of silent
failures ends up carried by hand for months.

### What earns one

Three, and it takes all three:

1. **Only a real browser can prove it.** Focus, portalling, CSS-driven layout, scroll
   locking, animation lifecycles, hydration. If a jsdom-based unit test can see it, that is
   cheaper, faster and easier to read — put it there.
2. **It fails silently.** No exception, no red, nothing a reviewer would notice on the
   screen: focus landing on `<body>` instead of the opener, an overlay anchored to the wrong
   box, a search field that quietly stops receiving keystrokes. A behaviour that fails loudly
   already has a reporter.
3. **Nothing cheaper already covers it.** A pure function reachable from a unit test stays a
   unit test even when what it drives is visual. The e2e half is only what the function
   cannot be asked directly — that its result reaches the DOM at all.

**What doesn't earn one:** anything a screenshot answers better (spacing, colour, gradients),
the happy path of a function already under unit test, and anything needing a fixed wait to
pass. A test that needs a sleep hasn't found what it is really waiting for; web-first
assertions retry on their own, and if none of them expresses the condition, that is the thing
to fix.

### A test is not done until it has been watched to fail

Write it, break the behaviour on purpose, watch it go red for the reason you expect, put the
code back.

Not a formality. A test can satisfy all three conditions, pass, and still assert nothing: a
locator that silently matches nothing is green, an assertion on an attribute that is absent
either way is green, and a check can be watching a weaker behaviour that happens to travel
with the one it names. Nothing else detects that, and what it produces is a suite that grows
while its coverage doesn't.

Name the mutation and what it caught in the PR description. That is what makes this checkable
by someone else rather than a claim.

### When the behaviour changes, so does the test

Writing a test is the easy half. Two things go wrong afterwards, and only one of them is
loud.

**A red e2e test is a question, not a chore.** It means the behaviour and the assertion
disagree, and nothing in the failure says which one is wrong. Answer that first. If the
change was intended, the test is rewritten and then **watched to fail again** — an assertion
edited to match new behaviour has never been proven in its new form, and "I made it green" is
the exact move that turns a suite into decoration. If the change was not intended, the test
just did its job and the code is what changes.

**A test can also go stale without going red**, which is the dangerous half. When a behaviour
moves — a new component, a real screen replacing a scaffold, a route that relocates — a test
pinned to the old surface keeps passing while nothing guards the new one. It reports green on
something nobody ships. So the test moves with the behaviour, and if it cannot yet, **the
test says where it is pinned and why**, in a comment at the top of the file naming what would
have to exist for it to move. A shelf life nobody wrote down is a shelf life nobody honours.

### What the suite costs, and what to do when it costs too much

The suite runs on every push, so its time is a standing charge on every change anyone makes
afterwards — which makes it the one thing here that gets worse on its own.

**No fixed number belongs in this file.** It would be wrong within two phases, nothing
triggers a refresh, and a stale figure gets quoted as current precisely because it is written
where rules live. What belongs here is the threshold and the levers:

- A PR that **adds to the suite** records the run time before and after in its implementation
  notes, and what the increase bought. Only that PR pays the bookkeeping, and the trend stays
  recoverable by reading the notes in order.
- When the run stops being something you would happily wait for locally, that is the signal —
  not a number someone has to remember. **Parallel workers first**, since most suites start
  serial for reasons that stop applying; **splitting the job second.**
- If neither helps, the suite is testing things that did not earn it. Re-read the conditions,
  not the config.

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
