# Fase 0 — Bootstrap

**PR:** [#1](https://github.com/rodrafer/saldito/pull/1) · Next 16.2.12 · React 19.2.4 · Tailwind v4

Dejar el proyecto listo para escribir código de producto. Sin funcionalidad todavía: la app
sirve la plantilla por defecto de Next, que la Fase 2 reemplaza al portar el sistema de
diseño.

---

## Hallazgos

### El `.gitignore` del repo era el de Visual Studio

El repositorio venía inicializado con `VisualStudio.gitignore`, que no tiene nada que ver
con el stack. No ignoraba `.next/`, `/out`, `/build`, `.vercel` ni `.env*.local`: era
cuestión de tiempo hasta commitear un build entero o, peor, un archivo de entorno con
credenciales de Supabase.

Reemplazado por el de Next. Se sumó `.claude/settings.local.json`, que es configuración
personal de cada persona y estaba por entrar al repo.

### Next 16 renombró `middleware` a `proxy`

El archivo ahora va en la raíz como `proxy.ts`, con la misma API. **Importa para la Fase 3:**
la documentación de `@supabase/ssr` sigue hablando de `middleware.ts`, así que hay que
traducirla al llegar.

Next además advierte que `proxy` no está pensado como gestión de sesión completa ni como
solución de autorización. El plan queda entonces: en `proxy.ts` sólo el refresco de token y
alguna redirección optimista, y la autorización real en las políticas RLS de Postgres, que
es donde no se puede eludir.

### La app declaraba `lang="en"`

Detectado al revisar el PR antes de mergear. El scaffold de `create-next-app` deja
`<html lang="en">`, y Saldito es una app en español rioplatense: los lectores de pantalla
le aplicaban fonética inglesa a toda la interfaz. Corregido a `es-AR`.

En el mismo lugar, `title` y `description` seguían siendo los placeholders de
`create-next-app`, así que "Create Next App" era lo que se publicaba como título.

---

## Decisiones

### Tailwind v4 en lugar de la v3 que traía el handoff

El handoff entrega un `tailwind.config.ts` con la forma de la v3. Igual conviene v4: los
tokens del sistema de diseño ya viven como variables CSS en `tokens.css`, que es
exactamente el modelo CSS-first de la v4. La traducción a `@theme inline` se hace una sola
vez, en la Fase 2, contra arrancar sobre una versión ya en mantenimiento.

### `fast-check` desde el arranque

Se instaló en la Fase 0 aunque no había nada que testear todavía, apostando a que el
reparto de enteros iba a necesitar tests generativos. La apuesta pagó: en la Fase 1
encontró dos bugs que no se nos habrían ocurrido a mano.

### `vite-tsconfig-paths` no hace falta

Vitest 4 lo reporta como redundante: Vite ya resuelve los paths de `tsconfig` de forma
nativa con `resolve.tsconfigPaths`. Se desinstaló.

---

## Ruido conocido

`npm audit` reporta tres vulnerabilidades **high** en `postcss` y `sharp`. Las dos son
dependencias transitivas del propio Next, y el único "fix" que ofrece npm es bajar a
`next@9.3.3`, que obviamente no es una opción. Se resuelven cuando Next las bumpee. No hay
nada que hacer de este lado.

---

## Pendiente

Faltan importar `Prototipo.dc.html` y `Sistema de diseño.dc.html` desde el proyecto de
Claude Design. Son la fuente de verdad visual y hacen falta **antes de la Fase 2**.

`tokens.json` y `support.js` se saltearon a propósito: el primero es para generadores que
no usamos —`tokens.css` es la fuente de verdad— y el segundo es del prototipo, no del stack
objetivo.
