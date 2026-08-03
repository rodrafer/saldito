# Notas sobre el handoff

Diferencias detectadas al importar el material de diseño. **A resolver en la Fase 2**,
al portar las primitivas a `components/ui/`. No tocar `design_handoff_saldito/`: es la
copia de referencia y queda como llegó.

## A corregir al portar

| Componente                                                 | Qué pasa                                                                 | Cómo se resuelve                                                                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `Toast`                                                    | Usa `duracion = 2400`, pero la sección 9 de la spec fija **2600ms**      | Manda la spec: default a 2600                                                                                                               |
| `Sheet`, `Modal`                                           | No cierran con Escape; sólo `Dropdown` lo hace                           | La spec y el README piden que Escape cierre **cualquier** overlay                                                                           |
| `ListRow`                                                  | `onClick` sobre un `div`, sin rol ni foco de teclado                     | Debe ser accesible por teclado cuando es clicable                                                                                           |
| `SegmentedControl`, `DropdownItem`, `BottomNav`, `Sidebar` | Mismo caso: `div` clicable con `role`/`aria` pero sin soporte de teclado | Elemento nativo o `tabIndex` + handler de teclado                                                                                           |
| `DonutChart`                                               | Hardcodea el degradado del hub (`#24222A`…), `GAP = 17` y la sombra      | Hay tokens para eso: `--sd-donut-gap`, `--sd-donut-grosor`, `--sd-sh-donut`, `--sd-sh-donut-hub`. La regla del handoff es no hardcodear hex |
| `Sidebar`                                                  | El comentario dice "hueco fijo de 88px"                                  | El token real es `--sd-sidebar-hueco: 76px`. Comentario desactualizado                                                                      |
| `tokens.css`                                               | Trae la fuente Archivo por `@import` de Google Fonts                     | Pasar a `next/font/google`: evita el request bloqueante y el layout shift                                                                   |

## Verificado, no es un problema

- `Chip` no aplica una clase `sd-chip--activo`, pero **está bien**: `components.css` estiliza
  el estado con el selector de atributo `.sd-chip[aria-pressed='true']`.

## Pendiente de importar

Del proyecto de Claude Design todavía faltan, porque son archivos grandes o de bajo valor
para el código:

- `Prototipo.dc.html` y `Sistema de diseño.dc.html` — **fuente de verdad visual**. Hacen
  falta antes de la Fase 2.
- `tokens/tokens.json` — tokens como datos, pensado para generadores. No los usamos:
  `tokens.css` es la fuente de verdad.
- `support.js` — script de soporte de los prototipos, no del stack objetivo.
