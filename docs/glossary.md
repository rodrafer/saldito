# Glossary

`design_handoff_saldito/ESPECIFICACION_FUNCIONAL.md` is reference material and stays in
Spanish forever (see [AGENTS.md](../AGENTS.md)). This maps its domain vocabulary to the
English identifiers used in the code, so reading the spec against the code doesn't require
re-deriving the mapping every time.

| Spec term (Spanish) | Code term (English) |
| ------------------- | ------------------- |
| gasto               | expense             |
| deuda               | debt                |
| saldo               | balance             |
| reparto             | split               |
| pagador             | payer               |
| contribución        | contribution        |
| plan simplificado   | settlement plan     |
| anulado             | voided              |
| borrador            | draft               |
| recurrencia         | recurrence          |
| movimiento          | transfer            |
| integrante          | member              |

## Design system

The handoff's `tokens.css`, `components.css` and `tailwind.config.ts` name everything in
Spanish. The repo's copies are in English (see [PLAN.md](../PLAN.md) for why the original
decision to keep the Spanish was reversed), so the two no longer read alike.

That matters in exactly one direction: when a design revision arrives, it arrives with the
handoff's names. `design_handoff_saldito/` is never edited, so these tables are what lets a
new token be matched against the one it replaces. They are the whole reason the rename is
safe to have done.

Names the rename left alone aren't listed: `--sd-surface`, `--sd-r-*`, `--sd-sp-*`,
`.sd-card`, `.sd-btn`, every keyframe. The `--sd-` / `sd-` prefix is the brand, not the
language, and stays either way.

### Tokens

| Handoff (Spanish)           | Repo (English)               |
| --------------------------- | ---------------------------- |
| `--sd-bg-lienzo`            | `--sd-bg-canvas`             |
| `--sd-bg-hueco`             | `--sd-bg-well`               |
| `--sd-surface-elevada`      | `--sd-surface-elevated`      |
| `--sd-surface-sutil`        | `--sd-surface-subtle`        |
| `--sd-surface-grad-elevada` | `--sd-surface-grad-elevated` |
| `--sd-surface-grad-dorada`  | `--sd-surface-grad-gold`     |
| `--sd-surface-grad-rosa`    | `--sd-surface-grad-pink`     |
| `--sd-border-fuerte`        | `--sd-border-strong`         |
| `--sd-border-sutil`         | `--sd-border-subtle`         |
| `--sd-border-acento`        | `--sd-border-accent`         |
| `--sd-text-secundario`      | `--sd-text-secondary`        |
| `--sd-text-atenuado`        | `--sd-text-muted`            |
| `--sd-text-deshabilitado`   | `--sd-text-disabled`         |
| `--sd-text-sobre-dorado`    | `--sd-text-on-gold`          |
| `--sd-dorado`               | `--sd-gold`                  |
| `--sd-dorado-claro`         | `--sd-gold-light`            |
| `--sd-dorado-profundo`      | `--sd-gold-deep`             |
| `--sd-dorado-tenue`         | `--sd-gold-faint`            |
| `--sd-dorado-texto`         | `--sd-gold-text`             |
| `--sd-dorado-grad`          | `--sd-gold-grad`             |
| `--sd-dorado-a10`           | `--sd-gold-a10`              |
| `--sd-dorado-a08`           | `--sd-gold-a08`              |
| `--sd-positivo`             | `--sd-positive`              |
| `--sd-positivo-bg`          | `--sd-positive-bg`           |
| `--sd-negativo`             | `--sd-negative`              |
| `--sd-negativo-profundo`    | `--sd-negative-deep`         |
| `--sd-negativo-bg`          | `--sd-negative-bg`           |
| `--sd-negativo-tinte`       | `--sd-negative-tint`         |
| `--sd-bloom-dorado`         | `--sd-bloom-gold`            |
| `--sd-bloom-rosa`           | `--sd-bloom-pink`            |
| `--sd-bloom-dorado-desktop` | `--sd-bloom-gold-desktop`    |
| `--sd-bloom-rosa-desktop`   | `--sd-bloom-pink-desktop`    |
| `--sd-fw-medio`             | `--sd-fw-medium`             |
| `--sd-fs-subtitulo`         | `--sd-fs-subtitle`           |
| `--sd-fs-titulo`            | `--sd-fs-title`              |
| `--sd-fs-titulo-sm`         | `--sd-fs-title-sm`           |
| `--sd-fs-titulo-lg`         | `--sd-fs-title-lg`           |
| `--sd-track-ancho`          | `--sd-track-wide`            |
| `--sd-track-titular`        | `--sd-track-heading`         |
| `--sd-sh-sutil`             | `--sd-sh-subtle`             |
| `--sd-sh-dispositivo`       | `--sd-sh-device`             |
| `--sd-sh-rail-abierto`      | `--sd-sh-rail-open`          |
| `--sd-donut-grosor`         | `--sd-donut-thickness`       |
| `--sd-dur-instante`         | `--sd-dur-instant`           |
| `--sd-dur-rapido`           | `--sd-dur-fast`              |
| `--sd-dur-lento`            | `--sd-dur-slow`              |
| `--sd-ease-salida`          | `--sd-ease-out`              |
| `--sd-transicion-hover`     | `--sd-transition-hover`      |
| `--sd-sidebar-hueco`        | `--sd-sidebar-gap`           |
| `--sd-sidebar-aire`         | `--sd-sidebar-inset`         |
| `--sd-col-derecha`          | `--sd-col-right`             |

`hueco` is the one word that didn't survive as a single term: `--sd-bg-hueco` is a recessed
surface (`well`) and `--sd-sidebar-hueco` is reserved layout space (`gap`). Same word in the
handoff, two meanings, and translating both the same way would have hidden that.

### Component classes

| Handoff (Spanish)        | Repo (English)         |
| ------------------------ | ---------------------- |
| `.sd-avatar--icono`      | `.sd-avatar--icon`     |
| `.sd-badge--positivo`    | `.sd-badge--positive`  |
| `.sd-badge--negativo`    | `.sd-badge--negative`  |
| `.sd-btn--primario`      | `.sd-btn--primary`     |
| `.sd-btn--secundario`    | `.sd-btn--secondary`   |
| `.sd-btn--fantasma`      | `.sd-btn--ghost`       |
| `.sd-btn--peligro`       | `.sd-btn--danger`      |
| `.sd-btn--bloque`        | `.sd-btn--block`       |
| `.sd-card--elevada`      | `.sd-card--elevated`   |
| `.sd-card--dorada`       | `.sd-card--gold`       |
| `.sd-card--rosa`         | `.sd-card--pink`       |
| `.sd-card--plano`        | `.sd-card--flat`       |
| `.sd-chip--activo`       | `.sd-chip--active`     |
| `.sd-chip-fila`          | `.sd-chip-row`         |
| `.sd-row--accion`        | `.sd-row--action`      |
| `.sd-row--estatico`      | `.sd-row--static`      |
| `.sd-row__cuerpo`        | `.sd-row__body`        |
| `.sd-row__titulo`        | `.sd-row__title`       |
| `.sd-row__detalle`       | `.sd-row__detail`      |
| `.sd-dropdown__buscador` | `.sd-dropdown__search` |
| `.sd-sheet__titulo`      | `.sd-sheet__title`     |
| `.sd-modal__titulo`      | `.sd-modal__title`     |
| `.sd-sidebar-hueco`      | `.sd-sidebar-gap`      |
| `.sd-sidebar__icono`     | `.sd-sidebar__icon`    |
| `.sd-sidebar__pie`       | `.sd-sidebar__footer`  |
| `.sd-pantalla`           | `.sd-screen`           |
| `.sd-contenido`          | `.sd-content`          |

Component props now match their class: `variant="primary"` writes `.sd-btn--primary`,
`tone="gold"` writes `.sd-card--gold`. The table that used to map the two is gone — it was
the seam, and the seam is what got removed.

### Tailwind theme keys

From the handoff's `tailwind.config.ts`, translated into `@theme inline` in
[styles/theme.css](../styles/theme.css). Each key generates the utility of the same name
(`--color-text-muted` → `text-text-muted`).

| Handoff (Spanish)             | Repo (English)             |
| ----------------------------- | -------------------------- |
| `--color-borde`               | `--color-border`           |
| `--color-borde-fuerte`        | `--color-border-strong`    |
| `--color-borde-sutil`         | `--color-border-subtle`    |
| `--color-borde-acento`        | `--color-border-accent`    |
| `--color-texto`               | `--color-text`             |
| `--color-texto-secundario`    | `--color-text-secondary`   |
| `--color-texto-atenuado`      | `--color-text-muted`       |
| `--color-texto-deshabilitado` | `--color-text-disabled`    |
| `--color-texto-dorado`        | `--color-text-on-gold`     |
| `--color-dorado`              | `--color-gold`             |
| `--color-dorado-claro`        | `--color-gold-light`       |
| `--color-dorado-profundo`     | `--color-gold-deep`        |
| `--color-dorado-tenue`        | `--color-gold-faint`       |
| `--color-positivo`            | `--color-positive`         |
| `--color-negativo`            | `--color-negative`         |
| `--color-negativo-profundo`   | `--color-negative-deep`    |
| `--color-surface-elevada`     | `--color-surface-elevated` |
| `--color-surface-sutil`       | `--color-surface-subtle`   |
| `--text-subtitulo`            | `--text-subtitle`          |
| `--text-titulo`               | `--text-title`             |
| `--text-titulo-sm`            | `--text-title-sm`          |
| `--text-titulo-lg`            | `--text-title-lg`          |
| `--tracking-ancho`            | `--tracking-wide`          |
| `--tracking-titular`          | `--tracking-heading`       |
| `--shadow-sutil`              | `--shadow-subtle`          |
| `--ease-salida`               | `--ease-out`               |

Two of these now shadow a Tailwind default: `tracking-wide` (0.06em, not 0.025em) and
`ease-out` (an expo curve, not Tailwind's mild one). That's deliberate and consistent with
what `theme.css` already did to the `--radius-*` and `--text-*` scales — the design system
replaces Tailwind's scales rather than sitting beside them, so a name means one thing
whichever file it's written in.

The custom `@utility` names moved with them: `bg-surface-grad-elevada` →
`bg-surface-grad-elevated`, `bg-surface-grad-dorada` → `bg-surface-grad-gold`,
`bg-surface-grad-rosa` → `bg-surface-grad-pink`, `bg-dorado-grad` → `bg-gold-grad`,
`bg-bloom-dorado` → `bg-bloom-gold`, `bg-bloom-rosa` → `bg-bloom-pink`.
