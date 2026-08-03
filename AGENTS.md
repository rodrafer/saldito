<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Convenciones de Saldito

## Fuentes de verdad

| Pregunta                 | Documento                                            |
| ------------------------ | ---------------------------------------------------- |
| Qué hace el producto     | `design_handoff_saldito/ESPECIFICACION_FUNCIONAL.md` |
| Cómo se ve               | `design_handoff_saldito/Prototipo.dc.html`           |
| Sistema visual           | `design_handoff_saldito/README.md`                   |
| Alcance y orden de fases | `PLAN.md`                                            |

Ante conflicto entre la especificación funcional y el prototipo: **manda la especificación
en lo funcional y el prototipo en lo visual**. La especificación es posterior e incluye
decisiones que el prototipo todavía no refleja.

`design_handoff_saldito/` es material de referencia: **no se edita**. Es la copia de lo que
entregó diseño y tiene que seguir comparándose contra el original.

## Dónde van las cosas que se escriben

| Qué                                 | Dónde                                           |
| ----------------------------------- | ----------------------------------------------- |
| Hallazgos de una fase               | `docs/implementation-notes/phase-<n>-<slug>.md` |
| Discrepancias del handoff de diseño | `NOTAS_HANDOFF.md`                              |
| Alcance y orden de fases            | `PLAN.md`                                       |

Una fase cierra con su nota de implementación. Ver
`docs/implementation-notes/README.md` para qué va y qué no.

## Particularidades del proyecto

**Las deudas y los saldos son derivados.** Se calculan desde los gastos vigentes y **nunca**
se persisten. Tampoco se guarda la cotización del dólar: se consulta fresca y sólo se usa
como referencia informativa.

**`features/deudas/calculo/` es TypeScript puro.** No importa nada de Next ni de Supabase,
así que corre idéntico en los tests, en el servidor al renderizar y en el cliente para los
updates optimistas. Mantenerlo así.

**Ningún hex hardcodeado.** `tokens.css` es la única fuente de color, tipografía y
espaciado; los componentes usan siempre `var(--sd-*)`.

**ARS y USD nunca se mezclan.** Saldos, deudas y plan simplificado se calculan por moneda
separada. Los montos son enteros: no hay centavos.

La verificación visual arranca en la Fase 2, comparando contra `Prototipo.dc.html`.

## Antes de dar algo por terminado

```bash
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```

Es lo mismo que corre CI.
