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

## Corregido: el pseudocódigo de la especificación 2.3 rompe su propio invariante

**Esto conviene avisarlo a quien escribió la especificación.** El algoritmo de
`deudasDeGasto` tal como está en el documento viola el invariante que el mismo documento
señala como "la mejor red de seguridad del sistema": que el saldo de cada persona coincida
con `puso − consumió`.

Caso mínimo que lo rompe — lo encontró el property testing, no se nos habría ocurrido a mano:

> Un gasto de **2**. Caro y Dani ponen **1 cada uno** y lo consumen entre los dos por partes
> iguales, **1 cada uno**. Nadie debería quedar debiendo nada.
>
> El pseudocódigo procesa una fila por vez. La deuda de Caro (1) se reparte entre los dos
> pagadores: empate de 0,5 y 0,5, y el sobrante va al primero de la lista, o sea a Caro
> mismo — que después se descarta por ser la porción propia. La deuda de Dani (1) tiene el
> mismo empate y el sobrante también va a Caro, que esta vez sí sobrevive.
>
> Resultado: Dani le debe 1 a Caro. Pero `puso − consumió` da cero para los dos.

**La causa.** Redondear fila por fila garantiza que cada **fila** cierre exacto contra el
reparto, pero deja las **columnas** a la deriva respecto de lo que puso cada uno. Y el saldo
neto de una persona es exactamente `su columna − su fila`. Con un solo pagador el problema
no aparece, porque la única columna se lleva todo; por eso el prototipo nunca lo mostró.

**Cómo se resolvió.** `repartirMatriz`, en `features/deudas/calculo/redondeo.ts`, redondea la
matriz completa preservando los dos márgenes: primero ajusta las filas por mayor parte
fraccionaria, y después corrige las columnas moviendo unidades **dentro de una misma fila**,
que es lo único que no rompe lo ya ajustado. Con las columnas exactas, descartar la porción
propia deja el invariante intacto.

El resultado sigue siendo la atribución proporcional que pide la sección 1.4, y la pantalla
Deudas no cambia. Los invariantes están cubiertos con property testing en
`features/deudas/calculo/invariantes.test.ts`.

## Pendiente de importar

Del proyecto de Claude Design todavía faltan, porque son archivos grandes o de bajo valor
para el código:

- `Prototipo.dc.html` y `Sistema de diseño.dc.html` — **fuente de verdad visual**. Hacen
  falta antes de la Fase 2.
- `tokens/tokens.json` — tokens como datos, pensado para generadores. No los usamos:
  `tokens.css` es la fuente de verdad.
- `support.js` — script de soporte de los prototipos, no del stack objetivo.
