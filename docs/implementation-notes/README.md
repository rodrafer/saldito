# Notas de implementación

Un documento por fase, escrito **al cerrar la fase**, junto con su PR.

## Para qué sirven

Guardan lo que el código no puede contar por sí solo: por qué se eligió un camino y no
otro, qué se descartó, qué se rompió en el intento, y qué queda pendiente. El diff muestra
_qué_ cambió; estas notas explican _por qué_.

Lo que más valor tiene son los hallazgos: cuando la implementación contradice a la
especificación, cuando una herramienta se comporta distinto de lo esperado, o cuando un
test encuentra algo que nadie había previsto. Eso se pierde apenas termina la sesión si no
queda escrito.

## Convención

- Un archivo por fase: `phase-<n>-<slug>.md`.
- Se escribe antes de abrir el PR, y el PR lo enlaza.
- No repite lo que ya dice el código ni la especificación. Si algo se entiende leyendo el
  diff, no va acá.
- Los hallazgos que le sirven a otra persona —un bug en la especificación, una decisión
  que hay que consultar— se marcan explícitamente para que no se pierdan.

## Qué no va acá

- **Discrepancias del handoff de diseño** → `NOTAS_HANDOFF.md`, en la raíz.
- **Decisiones de alcance y orden de fases** → `PLAN.md`, en la raíz.
