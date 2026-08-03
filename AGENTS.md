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
and PR descriptions. That's what lets anyone read the repo without friction.

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

## Workflow to ship code to `main`

In this order:

1. **Local verification** — the same checks CI runs. CI can't run yet: there's no push or
   PR.
2. **Screenshots** of anything with visible impact, compared against the reference design
   if there is one.
3. **Fix** whatever comes up in 1 and 2.
4. **Write the implementation notes.**
5. **Open the PR**, with a matching description and a link to those notes.
6. **Self-review the PR** — read your own diff as if it were someone else's.
7. **Fix** whatever comes out of the review, and **update the notes** if something worth
   recording changed.
8. **Save the screenshots** where they belong and flag it so they get pasted into the PR.
9. **Final CI check** green.
10. **Ask for explicit approval to merge**, and wait for it. Never merge on your own
    initiative, however green everything looks.
11. **Squash & Merge**, once that approval is given.

Steps 7 and 8 produce new commits, so CI runs again on its own. If the review found
nothing, that's said explicitly instead of skipping the step.

**Every screenshot in a PR carries a heading and a line saying what to look at.** A wall of
images is work for the reviewer: they have to infer what each one is meant to prove and
whether it proves it. The heading names the state — which screen, which viewport, which
overlay open — and the line points at the specific thing that changed, so a reviewer can
tell agreement from oversight without reading the diff first. The body of the PR carries
those headings before the screenshots exist, each with a marker where the image goes.

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

## Before calling something done

```bash
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```

Same as what CI runs.
