# Saldito — Implementation plan

Shared expense manager. React + TypeScript + Next.js (App Router) + Tailwind v4 + Supabase.

Sources of truth:

- **Functional** → `design_handoff_saldito/ESPECIFICACION_FUNCIONAL.md`
- **Visual** → `design_handoff_saldito/Prototipo.dc.html` (wins over the README on conflict)
- **Visual system** → `design_handoff_saldito/README.md`

## Decisions made

| Topic                   | Decision                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------- |
| Data layer              | Hybrid: reads in RSC, mutations via Server Actions, realtime only on Plan and balances |
| Tailwind                | v4, CSS-first. The handoff's `tailwind.config.ts` is translated to `@theme inline`     |
| First deliverable scope | Core: calculation → expenses → debts → plan (phases 0–7)                               |
| Auth                    | Email + password **and** Google OAuth                                                  |
| Screenshots             | **Playwright.** The harness is tracked; the shot files are per-PR and are not          |
| URL paths               | **Stay in Spanish** (`/gastos`, `/deudas`, `/grupo`) — they are text the user reads    |

## Assumptions (flag if any don't work)

- **npm** as package manager (pnpm isn't installed on the machine).
- Tests with **Vitest** + **fast-check** for the rounding invariants.
- Input validation with **Zod**, shared between Server Actions and forms.
- Deploy on **Vercel**; managed Supabase.
- Exchange rate from **dolarapi.com**, cached a few minutes server-side and **never
  persisted**; if it fails, the reference is omitted without blocking anything.
- Recurring drafts generated with **pg_cron** on Supabase.
- Work in per-phase branches, with a PR per phase.

---

## Feature-based scaffolding

```
saldito/
├── app/
│   ├── layout.tsx                    # tokens + AmbientBackground + Archivo font
│   ├── (auth)/login | signup | recover | onboarding
│   ├── (app)/
│   │   ├── layout.tsx                # desktop Sidebar + mobile BottomNav
│   │   ├── page.tsx                  # Dashboard
│   │   ├── gastos/                   # page · new · [id] · [id]/edit
│   │   ├── deudas/ · grupo/ · categorias/ · notificaciones/ · perfil/
│   └── api/exchange-rate/route.ts
├── features/                         # one folder per domain
│   ├── expenses/      components · hooks · actions.ts · queries.ts · schemas.ts
│   ├── debts/          calculation/  ← pure algorithms, no dependencies
│   ├── plan/ · recurrences/ · groups/ · categories/
│   ├── notifications/ · profile/ · auth/
├── components/ui/                    # the handoff's 16 primitives
├── lib/
│   ├── supabase/      client.ts · server.ts · middleware.ts
│   └── cn.ts · format.ts · dates.ts
├── types/
├── styles/            tokens.css · components.css · theme.css
├── supabase/          migrations/ · seed.sql
└── design_handoff_saldito/           # reference, not edited
```

**Structural rule:** `features/debts/calculation/` is pure TypeScript — it doesn't import
anything from Next or Supabase. That way it runs identically in tests, on the server when
rendering, and on the client for optimistic updates.

**Style rule:** no hardcoded hex. `tokens.css` remains the only source; `theme.css` exposes
it to Tailwind v4 via `@theme inline`. Token, class and theme-key names are English; the
mapping back to the handoff's Spanish is in `docs/glossary.md`.

**Route rule:** URL segments stay in Spanish, and so do the route folders that produce them.
A path is an identifier _and_ something the user reads, types and shares, which puts it under
the "text the end user sees" exception in `AGENTS.md` — the handoff's README proposes these
paths, the product is for Argentine users, and changing a URL after launch costs redirects
forever. The route handler and the component it exports are English as usual: `app/(app)/gastos/page.tsx`
exports `ExpensesPage`. This is the one place the two languages meet, and it meets on the
file boundary rather than inside a name.

---

## Phases

### Phase 0 — Bootstrap

- Link the local folder to the `rodrafer/saldito` repo, keeping `LICENSE`, `.gitignore`, and
  `README.md` from `main`.
- Finish importing the handoff from Claude Design: `components.css`, `tokens.json`,
  `README.md`, the 16 `.tsx` primitives, `support.js`, and the two `.dc.html` files.
- `create-next-app` (TS, App Router, Tailwind v4, ESLint) + feature-based structure + paths
  in `tsconfig`.
- Vitest, Testing Library, Prettier, and CI on GitHub Actions (typecheck · lint · test ·
  build).

### Phase 1 — Calculation core, no UI

- Domain `types/` (already imported from the handoff).
- Spec algorithms 2.1–2.7 in `features/debts/calculation/`.
- Test suite with the invariants the spec itself calls out as the safety net:
  - the sum of contributions and of the split give **exactly** the amount;
  - per currency, the sum of all balances in the group is **zero**;
  - each person's balance matches `paid in − consumed` **and** the sum of their debts by
    pair;
  - the plan produces at most `n − 1` transfers per currency and settles exactly.
- `lib/dates.ts` for the "Today / This week / Before" buckets.

> This phase is the cheapest to get right and the most expensive to get wrong. It goes
> entirely before any screen.

### Phase 2 — Design system

- `tokens.css` + `components.css` + `theme.css`; Archivo font via `next/font`.
- **Radix as the behavioral layer, styling stays ours.** The design is hi-fi and final, so a
  styled library (MUI, Ant Design) would be fought rather than used. What a headless library
  does buy is the part no screenshot can verify: focus trap, focus restoration, scroll lock,
  stacked dismissable layers, keyboard navigation.
  - `react-dialog` → `Modal` and `Sheet`
  - `react-popover` → filter menus, which carry a search field
  - `react-dropdown-menu` → pure action menus, no text input
  - `react-toggle-group` / `react-toggle` → `SegmentedControl` and chips
  - `Button`, `Card`, `Badge`, `Avatar`, `ListRow`, `DonutChart` and `AmbientBackground` stay
    hand-rolled: a library adds nothing there.
- Port the 16 primitives, adapting them to the repo's conventions.
- `AmbientBackground` in the root layout (single use) with its mobile and desktop blooms.
- Shell: collapsible side rail (64px → 212px on hover, fixed 76px gap, active without
  border) and a floating bottom bar with a FAB.
- Helper for the firm `1fr 300px` grid with a 20px gap, mandatory on every desktop screen.
- `/dev/kitchen-sink` route (dev only) to compare against `Sistema de diseño.dc.html`.

Decided before starting the phase:

- **The CSS vocabulary stays as delivered; English stops at the TypeScript boundary.** Token
  and class names (`--sd-text-atenuado`, `.sd-btn--primario`) keep the handoff's spelling,
  Spanish included. React components, props, and types are ours, so they go to English, and
  `docs/glossary.md` carries the mapping.

  > **Reversed after the phase shipped, and now done.** The reasoning above rested on the two
  > `.dc.html` files being written against the token names. They aren't: the prototype never
  > mentions `--sd-*` at all — it is inline hex end to end — and the design-system page
  > mentions it twice, once in prose and once as the caption of a single swatch. With that
  > gone there is no case for a half-translated codebase, and the glossary table was evidence
  > of the problem rather than a fix for it. Tokens, classes and theme keys are in English as
  > of the `feature/css-vocabulary-english` branch; `docs/glossary.md` now maps the repo's
  > names back to the handoff's, which is the only direction that still needs a mapping.

- **The app shell is a `100dvh` container that scrolls internally**, not a page that grows.
  The handoff anchors every overlay with `position: absolute` against the app container
  rather than the viewport; that only behaves if the container is the viewport's size. It
  also matches the prototype, whose content column is its own scroll area. This is what
  Radix's `container` prop gets pointed at.
- **On `BottomNav`, the prototype overrides `components.css`.** The prototype's bar is icons
  only; `components.css` and the design-system page draw a label under each icon. The
  handoff's own tiebreaker is explicit — "ante cualquier duda, manda el prototipo" — so the
  labels become accessible names rather than visible text, and `components.css` is corrected
  to match.
- **`@radix-ui/react-visually-hidden` joins the five packages above.** `Dialog.Title` is
  mandatory for accessibility, but the handoff's `Sheet` treats its title as optional; when
  none is given the title still has to exist, just not visibly.

### Phase 3 — Supabase: schema, RLS, and auth

- Migrations for every entity. Debts, balances, and the exchange rate are **not**
  persisted.
- Modeling contributions and the split: a child table per person, so the "Paid by" filter
  and referential integrity work without unpacking jsonb.
- RLS on every table, based on group membership.
- Constraints and triggers reflecting the integrity rules from section 1.2.
- Session middleware, login, signup, recovery, Google OAuth, and onboarding.
- `seed.sql` with the prototype's fixtures.

### Phase 4 — Expenses

- List grouped by time bucket, voided ones dimmed, drafts on top.
- Single-line filter row with horizontal scroll; each chip opens its own 300px menu
  anchored to itself, with a search box when the list is long; combined with AND.
- Expense detail with history (new screen, not in the prototype).
- New expense: multi-payer (Equal · Amounts) + split (Equal · Percentage · Amounts), with
  all the validation and help copy from section 6.4.
- Editing, voiding with a 24hs restore window, and edit history.
- Multi-select mode.
- `/api/exchange-rate` for the estimated ARS equivalence.

### Phase 5 — Per-person debts and payments

- Grouped by currency, semantic badges, copyable alias.
- Actions by role: Record payment · Remind · Pay via {app} · Already paid.
- Recording, declaring, and confirming payments, with a 24hs void window.
- Debt detail with the expenses that originated it.
- Reminder screen.

### Phase 6 — Settlement plan and realtime

- State machine `idle → running → completed`.
- On start, transfers and source expenses are frozen.
- Individual debts and editing/voiding blocked while it runs; logging expenses stays
  allowed.
- Realtime with conflict resolution: first one wins, and the second is informed without
  treating it as an error.
- Optimistic updates with rollback if the server rejects.
- Automatic close, with the two outcomes (no debts → congratulations; new debts → back to
  idle).

### Phase 7 — Dashboard

- Net balance stacked by currency, largest amount on top.
- SVG `DonutChart`: separated segments with rounded ends; on hover the segment thickens,
  dims the rest, and shows a tooltip.
- Clickable notices for pending drafts and a plan in progress.
- Recent activity, quick actions, and a per-member summary in the right column.

---

## Second batch

### Phase 8 — Recurrences

Defined from an existing expense, monthly draft generation via cron, confirmation, a
7-day reminder, discard at 30, and the rule that no recurrence ever has two open drafts.
Managed inline within Group.

### Phase 9 — Group, categories, profile, notifications

Editable name, members and cards, invite by link, member removal blocked while owing,
category CRUD, profile with card management, and the notification tray with its embedded
actions.

### Phase 10 — Polish

Empty states, skeletons shaped like the real content, error handling, accessibility
(golden focus, `aria-*`, Escape closes overlays), `prefers-reduced-motion`, responsive QA
against the prototype, and deploy.

---

## Cross-cutting work

Things that have to happen but belong to no phase: tooling, conventions, and debts that cut
across the whole repo. A phase is a shippable slice of product with a place in the order;
these have neither, and forcing them into the nearest phase is how they end up somewhere
that has nothing to do with them.

Each one carries **when it has to land** — that's what stops this becoming a list nobody
reads. Anything with no trigger doesn't belong here; it belongs in nobody's plan.

| What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Trigger                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| ~~**Playwright as a devDependency, with the screenshot run scripted in the repo.** Phase 2's captures came from a throwaway CDP script that lives in a scratchpad and dies with the session.~~ **Done** before phase 3: `npm run shots -- <dir>`. What is tracked is the harness — `playwright.shots.config.ts` and `tools/screenshots/shot.ts`, which fix the viewports, the 2× scale, font readiness and the four capture techniques that aren't obvious. The shot files themselves are gitignored: **which shots a PR takes is that PR's call**, and nothing runs an old set, so tracking one only lets it rot. The original wording here asked for the same shots re-run every phase, which was visual regression testing by another name; that belongs to the e2e row below. How to run it is in `AGENTS.md`.                                                                                            |
| ~~**E2E tests on the same Playwright, wired into CI.** Different commitment from the screenshots and worth keeping separate: it adds CI time, a class of flakiness the suite doesn't have today, and a budget every later phase has to carry. It also changes the shipping workflow, which grows an e2e step — that edit to `AGENTS.md` lands with the tests, not before, so the convention never describes a suite that doesn't exist.~~ **Done** before phase 3, on the shell rather than on an auth flow — see the scope note below. **Visual regression still belongs here** if it ever happens: baselines committed to the repo and an approval flow are that kind of commitment, and nothing about it fits either a capture run whose output a human looks at once or an e2e suite that asserts behaviour. It has no trigger, so it stays a sentence in this row rather than becoming a row of its own. | ~~Phase 3, with auth~~ — landed early, on the shell |
| ~~**Translate the CSS vocabulary to English** — tokens, class names, and the Tailwind theme keys. See the reversal note under phase 2.~~ **Done**, along with every TS and CSS comment, before phase 3. Mapping back to the handoff is in `docs/glossary.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ~~Before phase 3~~ — landed                         |

### E2E scope, decided before the work

The trigger above named phase 3 and an auth flow, on the reasoning that a flow worth
driving end to end is one that crosses a real boundary. That was the wrong thing to wait
for. The behaviours with no other net are already here, in the shell: **everything phase 2
signed off by hand** — focus trapped inside an overlay and returned to its opener, Escape,
the rail expanding for a keyboard, a search field that keeps focus while it is typed into,
overlays portalled into `.sd-app` rather than `document.body`. Every one of them needs a
real browser, none is reachable from Vitest and jsdom, and all of them fail silently: the
symptom is focus in the wrong place, never a stack trace. Waiting for auth would have meant
carrying them on a hand-verification list across four more phases.

So the suite lands now, against the shell, and covers:

- navigation across the four routes, with `aria-current` following the pathname;
- the rail expanding on tab-in, with the content column not moving;
- Escape, focus trap and focus restoration on sheet and modal, plus the scroll lock and the
  `aria-hidden` on the rest of the app while one is open;
- the filter menu's search field keeping focus while typing, and Escape returning focus to
  its chip;
- overlays portalling into `.sd-app`;
- exactly one navigation envelope per viewport, and the FAB opening the actions sheet;
- no console errors or unhandled exceptions on any route — which is where a hydration
  mismatch would surface, and the reason `AppShell` renders both envelopes instead of
  measuring the window;
- the exit animation running before the element unmounts.

Two consequences worth stating up front, because they set what later phases inherit:

- **It runs against `next dev`, not a production build.** Half of what is listed above has
  no surface outside `/dev/kitchen-sink`, and `pageExtensions` means that page does not
  exist in a build. Once phases 4 and 5 ship real filter rows and real modals, the suite can
  move onto `next build && next start` and test what actually ships.
- **Auth flows are still phase 3's to add**, and they are what the original trigger was
  about. Nothing here replaces that; the suite simply exists by the time they arrive.

## Identified risks

- **Rounding.** This is where the user's trust breaks. Mitigated with Phase 1 fully done
  and generative tests before any screen.
- **Derived calculation on every request.** Deriving debts from all current expenses is
  correct and what the spec calls for, but scales linearly with the group's history. If a
  group grows large, cache the derived result — never persist it as the source of truth.
- **Realtime and RSC don't mix well when combined.** That's why realtime stays scoped to
  Plan and balances, with an explicit limit on what it subscribes to.
- **Four screens aren't drawn** (detail with history, editing, recurrence management,
  draft confirmation). They're built with the existing visual vocabulary, without
  inventing new patterns.
