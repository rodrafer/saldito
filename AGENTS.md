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

## Notas de implementación

Cada fase cierra con un documento en `docs/implementation-notes/phase-<n>-<slug>.md`,
escrito **antes de abrir el PR** y enlazado desde su descripción. Ver
`docs/implementation-notes/README.md` para qué va y qué no.

Lo que más importa registrar son los hallazgos: cuando la implementación contradice a la
especificación, cuando una herramienta se comporta distinto de lo esperado, o cuando un test
encuentra algo que nadie había previsto. Eso se pierde apenas termina la sesión.

Las discrepancias del **handoff de diseño** van aparte, en `NOTAS_HANDOFF.md`.

## Commits y PRs

Commits agrupados por tema, no un commit gigante por fase. Si un cambio toca varias cosas
sin relación entre sí, van commits separados aunque hayan salido de la misma sesión.

Trabajo en branches `feature/<slug>`, con PR por fase y merge por squash.

## Verificación visual

Desde la Fase 2, todo cambio con impacto visible se verifica con capturas antes de abrir el
PR, comparando contra el prototipo. Las copias finales van a
`~/Documents/Images/dev-screenshots/saldito/#<PR>-<slug>/` — ver `../CLAUDE.md` para el
detalle de la convención.

**No se commitean capturas al repo.** Se deja un placeholder `## Screenshots` en el body del
PR para que el usuario las pegue: GitHub las sube a su propio CDN y no pesan en cada clone.

Como las capturas se toman antes de que exista el número de PR, se usa el nombre de la
branch como slug y se renombra la carpeta después.

## Antes de dar algo por terminado

```bash
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```

Es lo mismo que corre CI.
