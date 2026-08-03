# Implementation notes

One document per phase, written **when the phase closes**, alongside its PR.

## What they're for

They keep what the code can't tell on its own: why one path was chosen over another, what
was discarded, what broke along the way, and what's left pending. The diff shows _what_
changed; these notes explain _why_.

What's most valuable are the **findings**: when the implementation contradicts the spec,
when a tool behaves differently than expected, or when a test finds something no one had
anticipated. That's lost as soon as the session ends if it doesn't get written down.

## Convention

- One file per phase: `phase-<n>-<slug>.md`. Work from the "Cross-cutting work" table in
  `PLAN.md` belongs to no phase and is named for what it is instead —
  `tooling-<slug>.md` — rather than being filed under whichever phase it happened to
  follow.
- Written before opening the PR, and the PR links it.
- Doesn't repeat what the code or the spec already says. If something is clear from reading
  the diff, it doesn't go here.
- Findings useful to someone else —a bug in the spec, a decision that needs to be
  checked— are marked explicitly so they don't get lost.

## What doesn't go here

- **Design handoff discrepancies** → `HANDOFF_NOTES.md`, at the root.
- **Scope and phase-order decisions** → `PLAN.md`, at the root.
