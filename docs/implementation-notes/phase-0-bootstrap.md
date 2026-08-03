# Phase 0 — Bootstrap

**PR:** [#1](https://github.com/rodrafer/saldito/pull/1) · Next 16.2.12 · React 19.2.4 · Tailwind v4

Get the project ready to write product code. No functionality yet: the app serves Next's
default template, which Phase 2 replaces when porting the design system.

---

## Findings

### The repo's `.gitignore` was the Visual Studio one

The repository was initialized with `VisualStudio.gitignore`, which has nothing to do with
the stack. It didn't ignore `.next/`, `/out`, `/build`, `.vercel`, or `.env*.local`: it was
only a matter of time before an entire build, or worse, an env file with Supabase
credentials, got committed.

Replaced with Next's. Added `.claude/settings.local.json`, which is each person's personal
config and was about to enter the repo.

### Next 16 renamed `middleware` to `proxy`

The file now goes at the root as `proxy.ts`, with the same API. **Matters for Phase 3:**
`@supabase/ssr`'s documentation still talks about `middleware.ts`, so it has to be translated
when we get there.

Next also warns that `proxy` isn't meant as full session management or an authorization
solution. The plan then: in `proxy.ts` only token refresh and some optimistic redirect, and
real authorization in Postgres's RLS policies, which is where it can't be bypassed.

### The app declared `lang="en"`

Caught while reviewing the PR before merging. `create-next-app`'s scaffold leaves
`<html lang="en">`, and Saldito is a Rioplatense Spanish app: screen readers were applying
English phonetics to the whole interface. Fixed to `es-AR`.

In the same spot, `title` and `description` were still `create-next-app`'s placeholders, so
"Create Next App" was what got published as the title.

---

## Decisions

### Tailwind v4 instead of the v3 the handoff shipped

The handoff delivers a `tailwind.config.ts` shaped for v3. v4 is still the right call: the
design system's tokens already live as CSS variables in `tokens.css`, which is exactly v4's
CSS-first model. The translation to `@theme inline` happens once, in Phase 2, rather than
starting on a version already in maintenance mode.

### `fast-check` from the start

Installed in Phase 0 even though there was nothing to test yet, betting that splitting
integers was going to need generative tests. The bet paid off: in Phase 1 it found two bugs
that wouldn't have occurred to us by hand.

### `vite-tsconfig-paths` isn't needed

Vitest 4 reports it as redundant: Vite already resolves `tsconfig` paths natively with
`resolve.tsconfigPaths`. Uninstalled.

---

## Known noise

`npm audit` reports three **high** vulnerabilities in `postcss` and `sharp`. Both are
transitive dependencies of Next itself, and the only "fix" npm offers is downgrading to
`next@9.3.3`, which obviously isn't an option. They'll resolve once Next bumps them. Nothing
to do on this end.

---

## Pending

Still need to import `Prototipo.dc.html` and `Sistema de diseño.dc.html` from the Claude
Design project. They're the visual source of truth and are needed **before Phase 2**.

`tokens.json` and `support.js` were skipped on purpose: the former is for generators we
don't use —`tokens.css` is the source of truth— and the latter belongs to the prototype, not
the target stack.
