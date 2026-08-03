<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:convenciones-generales -->

# Convenciones generales

Estas reglas no dependen del stack: valen para todos mis proyectos y **este bloque se
replica igual en cada repo**. Si cambia una, cambia en todos. Lo específico de este proyecto
está más abajo.

## Idioma

**El repo se escribe en inglés**: identificadores, comentarios, documentación, mensajes de
commit y descripciones de PR. Es lo que permite que cualquier persona lea el repo sin
fricción.

Dos excepciones:

- **Los textos que ve el usuario final** van en el idioma del producto.
- **El material de referencia entregado por terceros** (handoffs de diseño,
  especificaciones) queda como llegó: se compara contra el original, y traducirlo lo rompe.

Cuando el dominio tenga vocabulario propio en otro idioma, va un glosario corto en el repo
que mapee los términos de la especificación a los del código.

## Arquitectura del scaffolding

**Feature-based: se agrupa por dominio, no por tipo de archivo.** Cada feature reúne lo
suyo —componentes, hooks, acciones, schemas, tipos— en vez de repartirlo entre carpetas
`components/`, `hooks/` y `services/` que crecen sin relación con el producto.

Sólo se comparte lo que de verdad usan varias features: primitivas de UI, utilidades y
tipos de dominio.

**La lógica de negocio pura va aislada, sin dependencias del framework.** Nada de imports
del router, del cliente de base de datos ni de componentes. Así corre idéntico en los
tests, en el servidor y en el cliente, y se puede razonar sin levantar la app.

## Commits

**Agrupados por tema. Nada de un commit gigante por tarea.** Si un cambio toca varias cosas
sin relación entre sí, van commits separados aunque hayan salido de la misma sesión.

Cada commit se tiene que poder revisar solo, y su mensaje explica **por qué**, no sólo qué.
Un `package.json` que suma una herramienta va con la configuración de esa herramienta, no
junto a todas las dependencias del proyecto.

Branches `feature/<slug>`, merge por **Squash & Merge**.

## Workflow para llevar código a `main`

En este orden:

1. **Verificación local** — los mismos checks que corre CI. CI todavía no puede correr: no
   hay push ni PR.
2. **Capturas** de todo lo que tenga impacto visible, comparando contra el diseño de
   referencia si lo hay.
3. **Corregir** lo que aparezca en 1 y 2.
4. **Escribir las notas de implementación.**
5. **Crear el PR**, con descripción acorde y enlace a esas notas.
6. **Auto-review del PR** — leer el propio diff como si fuera ajeno.
7. **Corregir** lo que salga del review, y **actualizar las notas** si cambió algo que valga
   la pena registrar.
8. **Guardar las capturas** donde corresponda y avisar para que se peguen en el PR.
9. **Último check de CI** en verde.
10. **Squash & Merge.**

Los pasos 7 y 8 generan commits nuevos, así que CI vuelve a correr sola. Si el review no
encontró nada, se dice explícitamente en vez de saltear el paso.

## Notas de implementación

Cada tarea que llega a `main` cierra con un documento en `docs/implementation-notes/`,
escrito **antes de abrir el PR** y enlazado desde su descripción.

Guardan lo que el código no puede contar solo: por qué se eligió un camino y no otro, qué se
descartó, qué se rompió en el intento. El diff muestra _qué_ cambió; las notas explican _por
qué_.

Lo que más valor tiene son **los hallazgos**: cuando la implementación contradice a la
especificación, cuando una herramienta se comporta distinto de lo esperado, o cuando un test
encuentra algo que nadie había previsto. Eso se pierde apenas termina la sesión si no queda
escrito.

No repiten lo que ya dice el código. Si algo se entiende leyendo el diff, no va.

<!-- END:convenciones-generales -->

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
