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

CSS tokens and class names keep the handoff's own spelling, Spanish included (see
[PLAN.md](../PLAN.md) for why). English stops at the TypeScript boundary, so a component's
props and its classes don't always read the same. This is that seam.

| Token / class          | React prop         |
| ---------------------- | ------------------ |
| `sd-btn--primario`     | `variant="primary"` |
| `sd-btn--secundario`   | `variant="secondary"` |
| `sd-btn--fantasma`     | `variant="ghost"`  |
| `sd-btn--peligro`      | `variant="danger"` |
| `sd-btn--bloque`       | `block`            |
| `sd-card--elevada`     | `tone="elevated"`  |
| `sd-card--dorada`      | `tone="gold"`      |
| `sd-card--rosa`        | `tone="pink"`      |
| `sd-card--plano`       | `flat`             |
| `sd-badge--positivo`   | `tone="positive"`  |
| `sd-badge--negativo`   | `tone="negative"`  |
| `sd-row--accion`       | `action`           |

Words that appear in token names and nowhere in the code: `dorado` (gold, the accent),
`atenuado` (muted, on text), `hueco` (the gap the rail is reserved), `lienzo` (canvas),
`pantalla` (screen), `pie` (footer), `sutil` (subtle), `fuerte` (strong).
