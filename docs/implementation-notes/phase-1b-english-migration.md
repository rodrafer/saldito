# Phase 1b — English migration

**PR:** TBD · pure rename, no behavior change · 63 tests unchanged

Migrated the repo from Spanish to English: identifiers, comments, file/directory names,
and documentation. Motivation is readability — the repo should be legible to anyone who
doesn't speak Spanish. No logic changed; the same 63 tests pass with the same assertions.

---

## What moved

- `features/deudas/calculo/` → `features/debts/calculation/`, with every file renamed
  (`deudas.ts` → `debts.ts`, `redondeo.ts` → `rounding.ts`, etc.) via `git mv` so the diff
  reads as renames, not delete+add.
- The other empty feature placeholders (`deudas`, `categorias`, `gastos`, `grupos`,
  `notificaciones`, `perfil`, `recurrencias`) renamed to their English equivalents, since
  they're just `.gitkeep` scaffolding with no content to review.
- `lib/fechas.ts` → `lib/dates.ts`.
- `NOTAS_HANDOFF.md` → `HANDOFF_NOTES.md`.
- `docs/implementation-notes/phase-1-nucleo-calculo.md` →
  `phase-1-calculation-core.md`.

`design_handoff_saldito/` was left untouched, as required: it's the reference copy of
what design delivered and has to keep comparing against the original.

## What stayed in Spanish

- `ETIQUETA_FRANJA` / `TIME_BUCKET_LABEL` values (`'Hoy'`, `'Esta semana'`, `'Antes'`) —
  end-user copy, not identifiers. The type's literal keys (`'hoy'` → `'today'`, etc.) did
  get translated, since those are internal, not shown to anyone.
- `app/layout.tsx`'s `description` metadata and `lang="es-AR"` — same reason.
- Everything under `design_handoff_saldito/`.

## Findings

**The type literals for enums (`ModoPago`, `ModoReparto`, `Pantalla`,
`TipoNotificacion`) were themselves in Spanish and got translated too**
(`'iguales'` → `'equal'`, `'porcentaje'` → `'percentage'`, screen and notification-type
names). These aren't copy shown to a user — no UI exists yet to display them — so
translating them is consistent with "the repo is written in English," and it's cheaper to
do now than after screens start switching on these values.

**`Plan` was renamed to `SettlementPlan`.** The bare type name `Plan` reads fine in
Spanish next to `plan simplificado`, but in English "Plan" alone is too generic against
the rest of the domain vocabulary. The glossary maps "plan simplificado" → "settlement
plan," so the entity now matches the term it's named after.

**No import ended up broken.** The only files importing from
`features/deudas/calculo/` or `lib/fechas.ts` were within those same directories (their
own tests) — nothing under `app/` references them yet since there's no UI. That's why
`tsc --noEmit` came back clean on the first pass with no path-fixing needed beyond the
files that were directly rewritten.

## Added

- `docs/glossary.md` — maps the eleven spec terms called out for this migration
  (`gasto`→`expense`, `deuda`→`debt`, etc.) to their English code equivalents, so future
  reads of `ESPECIFICACION_FUNCIONAL.md` (which stays in Spanish forever) don't require
  re-deriving the mapping.
- A `## Model and effort` section in `AGENTS.md`'s `convenciones-generales` block,
  asking that every session check the active model/effort against the task at hand and
  flag mismatches before starting work. This block is meant to be copied verbatim to
  `~/workspace/liangong` in a separate PR to keep the two repos' shared conventions in
  sync — **flagged to the user to do that copy**, since it lives outside this repo.

## Verification

`npm run format:check && npm run lint && npm run typecheck && npm test && npm run build`
all pass. The 63 tests from Phase 1 pass unchanged — no assertion was touched, only
identifiers on both sides of each `expect(...)`.
