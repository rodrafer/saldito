# Handoff — Saldito

**Saldito** — las cuentas de la casa, sin vueltas.

## Nombres

| | |
|---|---|
| Marca | **Saldito** |
| Repo GitHub | `saldito` |
| Carpeta local | `saldito/` |
| Paquetes | `@saldito/web`, `@saldito/ui` |
| Dominio | `saldito.app` |
| Prefijo de tokens | `--sd-` (variables CSS) y `sd-` (clases) |

## Resumen

App para registrar y saldar gastos compartidos entre convivientes o grupos.
Permite cargar un gasto, repartirlo entre integrantes (partes iguales, porcentajes
o montos explícitos), ver el saldo de cada persona, simplificar las deudas del grupo
y registrar pagos. Multi-moneda (ARS / USD), multi-grupo, en español rioplatense.

## Sobre los archivos de este paquete

Los archivos HTML incluidos son **referencias de diseño creadas en HTML** —
prototipos que muestran la apariencia y el comportamiento buscados, **no código
de producción para copiar tal cual**.

La tarea es **recrear estos diseños en el stack objetivo: React + TypeScript + Next.js
(App Router)**, usando los patrones y librerías ya establecidos en ese repo.
Los archivos `.tsx` y `.css` de este paquete sí están escritos para el stack objetivo
y pueden usarse como punto de partida directo, adaptándolos a las convenciones del proyecto.

## Documentos de este paquete

- **`README.md`** (este archivo) — sistema visual: tokens, componentes, layout, estados. Responde *cómo se ve*.
- **`ESPECIFICACION_FUNCIONAL.md`** — comportamiento: algoritmos, saldos, plan simplificado, flujos, copy, casos borde y permisos. Responde *qué hace*. **Leerlo antes de implementar cualquier lógica.**

> ✅ **El prototipo ya cubre las decisiones de producto.** Multi-pagador, saldos separados por moneda, detalle con historial, edición de gastos y recurrentes (lista + borrador a confirmar) están dibujados. En lo funcional manda `ESPECIFICACION_FUNCIONAL.md`; en lo visual, el prototipo.

> **Última revisión visual (agosto 2026):** rail lateral colapsable por hover, despegado 8px del borde y con el ítem activo sin borde, donut en SVG con segmentos separados y tooltip (se eliminó el gráfico de barras y su toggle), recurrentes inline en Grupo, aviso de borrador en la columna derecha de Gastos desktop, y blooms propios de desktop — el dorado centrado horizontalmente.

## Fidelidad

**Alta fidelidad (hi-fi).** Colores, tipografía, espaciados, radios, sombras,
estados y microinteracciones son definitivos. La UI debe recrearse fielmente.
Cuando haya conflicto entre este README y el prototipo, **manda el prototipo**.

---

## Stack objetivo y estructura sugerida

```
app/
  layout.tsx            # importa tokens.css + components.css, envuelve en <AmbientBackground>
  (app)/
    page.tsx            # Dashboard / Inicio
    gastos/page.tsx
    deudas/page.tsx
    grupo/page.tsx
    notificaciones/page.tsx
    perfil/page.tsx
    categorias/page.tsx
    gastos/nuevo/page.tsx
    gastos/[id]/page.tsx        # detalle con historial
    gastos/[id]/editar/page.tsx
components/ui/          # primitivas de este paquete
lib/                    # cn(), formato de moneda
types/                  # tipos de dominio
tokens/                 # tokens.css, components.css, tokens.json, tailwind.config.ts
```

**Tokens como fuente de verdad.** `tokens/tokens.css` define todas las variables CSS.
`tokens/components.css` define las clases de componente que consumen esas variables.
`tokens/tailwind.config.ts` mapea los mismos tokens a Tailwind para quien prefiera utilidades.
No hardcodear hex en los componentes: usar siempre `var(--sd-*)`.

---

## Sistema visual

### Principios

1. **Oscuro con luz cálida.** Un único tema oscuro. El color aparece por acento
   (dorado) o por señal semántica (verde / rosa), nunca como decoración de fondo.
2. **Profundidad por degradado, no por borde.** Toda superficie usa un degradado a 155°,
   más claro arriba-izquierda. Los bordes son estructurales y sutiles.
3. **El dorado es escaso.** Marca acción primaria, selección y foco. Como máximo un
   elemento con degradado dorado sólido por vista.
4. **Densidad alta, jerarquía por peso.** Tipografías chicas con pesos 600/700 en lugar
   de tamaños grandes; los números son lo único que crece.
5. **Mismo contenido, distinto envase.** Cada flujo tiene una versión mobile (bottom sheet,
   barra flotante) y una desktop (modal, sidebar). Nunca contenido exclusivo de una.

### Color

**Fondos y superficies**

| Token | Valor | Uso |
|---|---|---|
| `--sd-bg-app` | `#111013` | Fondo base de la app |
| `--sd-surface` | `#1B1A1F` | Superficie plana (segmented, píldoras) |
| `--sd-surface-elevada` | `#16151A` | Base de modales y menús |
| `--sd-surface-input` | `#111013` | Fondo de campos |
| `--sd-surface-grad` | `linear-gradient(155deg,#2A2732,#1C1A21 48%,#101015)` | **Tarjeta estándar** |
| `--sd-surface-grad-elevada` | `linear-gradient(155deg,#26232E,#19181E 48%,#0E0D12)` | Modales, sheets, dropdowns |
| `--sd-surface-grad-dorada` | `linear-gradient(155deg,#40371D,#2B2515 50%,#1B1709)` | Estado seleccionado / hover de acción |
| `--sd-surface-grad-rosa` | `linear-gradient(155deg,#341C24,#211317 50%,#140A0E)` | Estado deudor / alerta suave |

**Bordes:** `--sd-border #28262D` (default) · `--sd-border-fuerte #34323A` (flotantes) · `--sd-border-acento #EFC75E` (foco).

**Texto:** `#F0EFEA` primario · `#C7C4CC` secundario · `#88858C` atenuado ·
`#56535C` deshabilitado · `#211804` sobre dorado.

**Acento dorado:** `#EFC75E` base · `#F4D77C` claro · `#DCA637` profundo ·
`#57491F` tenue (bordes) · degradado de acción `linear-gradient(135deg,#F4D77C,#DCA637)`.

**Semánticos:** positivo `#7BB47A` (te deben) · negativo `#E38799` (debés) ·
profundo `#8C2F41` · fondos al 10–18% de opacidad.

**Overlays:** modal `rgba(11,10,13,.65)` · sheet `rgba(11,10,13,.72)` · nav `rgba(24,23,28,.82)` + blur 18px.

### Luminiscencia ambiente

Dos gradientes radiales fijos en el contenedor raíz, **nunca por pantalla**:

```css
background:
  radial-gradient(140% 68% at 50% 85%, rgba(239,199,94,.15) 0%, rgba(220,166,55,.06) 45%, rgba(17,16,19,0) 78%),
  radial-gradient(85% 45% at 8% -6%, rgba(227,135,153,.20) 0%, rgba(17,16,19,0) 62%),
  #111013;
```

La dorada se centra al 85% de la altura y se derrama por los laterales, disolviéndose
cerca del centro de la pantalla. La rosa entra desde arriba a la izquierda.

### Tipografía

**Archivo** (Google Fonts), pesos 400 / 500 / 600 / 700. Sin segunda familia.

| Rol | Tamaño | Peso | Uso |
|---|---|---|---|
| display-lg | 48px | 600 | Saldo principal del dashboard |
| display | 40px | 600 | Montos destacados |
| titulo-lg | 24px | 600 | Título de pantalla (desktop) |
| titulo | 19px | 600 | Título de pantalla (mobile) |
| titulo-sm | 16px | 600 | Título de modal |
| subtitulo | 15px | 600 | Título de sheet, encabezados de sección |
| body-lg | 14px | 500/600 | Texto de fila, inputs, sidebar |
| body | 13px | 600 | Ítems de menú, links de acción |
| body-sm | 12.5px | 700 | Chips |
| label | 12px | 600 | Etiquetas, metadatos |
| caption | 11.5px | 600/700 | Badges, botones chicos |
| micro | 10.5px | 600 | Labels de la barra inferior |

Labels de sección en mayúsculas con `letter-spacing: .06em` y color atenuado.
Los montos van con `toLocaleString('es-AR')`; nunca decimales salvo en USD.

### Espaciado, radios y sombras

Escala de espaciado en pasos de 2px: 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 26 · 32 · 40.
Padding de tarjeta 14px, de sección mobile 22px horizontal, desktop `36px 40px`.

Radios: 6 (chico) · 8 (botón sm) · 10 (botón, input, sidebar) · 12 (**tarjeta**) ·
14 (fila de acción, dropdown) · 16 (modal) · 24 (sheet) · 28 (barra inferior) · 100px (píldora).

Sombras: `sutil` `0 2px 8px rgba(0,0,0,.6)` · `card` `0 6px 16px rgba(0,0,0,.45)` ·
`dropdown` `0 20px 40px rgba(0,0,0,.5)` · `modal` `0 24px 60px rgba(0,0,0,.5)` ·
`nav` `0 14px 34px rgba(0,0,0,.55)` · `fab` `0 8px 22px rgba(239,199,94,.38), 0 0 0 5px rgba(24,23,28,.9)`.

### Movimiento

| Nombre | Duración | Easing | Uso |
|---|---|---|---|
| hover | 150ms | ease | color, fondo, borde, transform |
| `sd-fade-in` | 180ms | ease | overlays |
| `sd-pop-in` | 180ms | `cubic-bezier(.16,1,.3,1)` | dropdowns, modales |
| `sd-screen-in` | 220ms | `cubic-bezier(.16,1,.3,1)` | cambio de pantalla (fade + 8px) |
| `sd-sheet-up` | 220ms | `cubic-bezier(.16,1,.3,1)` | bottom sheet |
| `sd-toast-in` | 220ms | `cubic-bezier(.16,1,.3,1)` | confirmaciones |

Respetar `prefers-reduced-motion` (ya contemplado en `tokens.css`).

---

## Componentes

Todos entregados en `components/ui/`. Cada uno consume clases de `components.css`.

| Componente | Props clave | Notas de comportamiento |
|---|---|---|
| `Button` | `variante`, `tamano`, `bloque` | `primario` con degradado dorado, máximo uno por vista. Hover: brillo +8% y −1px. Active: `scale(.97)` |
| `Card` | `tono`, `plano` | Tonos `neutral` / `elevada` / `dorada` / `rosa`. Radio 12px, borde 1px |
| `Chip` + `ChipFila` | `activo` | Activo = degradado dorado. **La fila nunca hace wrap**: scroll horizontal en mobile |
| `SegmentedControl` | `opciones`, `valor` | 2–3 opciones. En desktop se fija a 300px para alinear con la columna derecha |
| `Avatar` / `IconoCategoria` | `nombre` / `icono` | Inicial sobre superficie dorada. Categorías = emoji, sin librería de íconos |
| `Input` | `label` | Foco marcado sólo con borde dorado |
| `Badge` | `tono` | `positivo` te deben · `negativo` debés |
| `ListRow` | `izquierda`, `titulo`, `detalle`, `derecha`, `accion` | Alto mínimo 44px. `accion`: hover dorado completo + `translateX(3px)` |
| `Dropdown` / `DropdownItem` | `abierto`, `ancho` | **Anclado al disparador**, no a la fila. Cierra por click afuera y Escape |
| `Sheet` | `abierto`, `titulo` | Patrón mobile. Handle de 38×4px arriba |
| `Modal` | `abierto`, `ancho` | Equivalente desktop del Sheet, 420px por defecto |
| `BottomNav` | `items`, `activa`, `onFab` | Píldora flotante con blur, despegada 16px del borde. FAB centrado, `margin-top:-26px` |
| `Sidebar` | `items`, `activa` | Rail de 64px despegado 8px del borde, se expande a 212px por hover, superpuesto al contenido. Activo con degradado dorado diagonal, **sin borde** |
| `Toast` | `mensaje`, `icono` | Se autocierra a los 2.4s |
| `DonutChart` | `segmentos`, `periodo`, `centro` | SVG con segmentos separados y extremos redondeados. Hover: engorda el segmento, atenúa el resto y muestra tooltip |
| `AmbientBackground` | — | Envuelve la app entera. Un solo uso, en el layout raíz |

---

## Pantallas

### Dashboard / Inicio
Saldo neto del usuario en display-lg, con signo y color semántico. Debajo, tarjeta de
total del grupo con **donut por categoría** (segmentos separados, hover con tooltip). Luego actividad reciente
(últimos gastos) y accesos rápidos. Desktop: grid `1fr 300px` con resumen por integrante
en la columna derecha.

### Gastos
Lista de gastos con fila = ícono de categoría + título + pagador + monto.
Arriba, **fila de filtros en una sola línea con scroll horizontal**: Todos · Categoría ·
Pagó · Moneda. Cada filtro con menú desplegable anclado a su propio chip (300px de ancho,
con buscador cuando la lista es larga). Modo selección múltiple para registrar pagos en lote.

### Nuevo gasto
Flujo de carga: monto (con selector de moneda y equivalencia estimada en ARS),
descripción, categoría, quién pagó, entre quiénes se reparte, y modo de reparto
(iguales / porcentaje / montos). Validación: la suma del reparto debe cerrar contra el total.

### Deudas
Toggle `Por persona` / `Plan simplificado`, alineado a la columna de 300px del contenido.
Por persona: lista de saldos con badge positivo/negativo y acción de registrar pago.
Plan simplificado: mínimo de transferencias que salda el grupo, en panel de 300px.

### Grupo
Nombre editable en línea, lista de integrantes con sus tarjetas (nombre + vencimiento MM/AA
por tarjeta), invitación por link, **gastos recurrentes inline debajo de Integrantes**
(borradores pendientes primero, después las recurrencias activas con su interruptor),
y accesos a categorías y app de pago preferida.

### Notificaciones
Lista de avisos con estado leído/no leído (punto rosa pulsante).
Desktop: grid `1fr 300px` — la columna derecha va vacía, pero **se mantiene** por consistencia.

### Perfil
Datos de la persona, gestión completa de tarjetas (agregar / editar / eliminar),
preferencias de moneda y app de pago, y cierre de sesión.

### Categorías
CRUD de categorías: emoji, nombre y uso acumulado. Sólo se pueden borrar las que
no tengan gastos asociados. Desktop: mismo grid `1fr 300px`, con la lista a la
izquierda, el botón de nueva categoría alineado sobre la columna derecha y las
reglas de borrado en el panel de 300px.

---

## Layout y responsive

**Mobile:** 390×760 de referencia. Contenido con `padding: 0 22px`, reserva inferior
de 96px por la barra flotante. Pantallas con `animation: sd-screen-in`.

**Desktop:** rail lateral despegado 8px del borde (hueco fijo de 76px) + área de contenido. **Regla firme: toda pantalla desktop
usa `grid-template-columns: 1fr 300px` con `gap: 20px`**, incluso cuando la columna
derecha queda vacía. Los encabezados de pantalla comparten ese mismo grid, de modo que
los controles de la derecha se alinean exactamente con el panel de abajo.

Target táctil mínimo: 44px. Texto nunca por debajo de 10.5px.

---

## Estado

Estado local por pantalla, sin librería externa. Variables principales:

- `pantalla` — ruta activa (en Next lo resuelve el router)
- `grupoActivo` — id del grupo; todas las listas filtran por él
- `gastos`, `integrantes`, `categorias`, `notificaciones` — colecciones de dominio
- `filtroCategoria` / `filtroPagador` / `filtroMoneda` — filtros de Gastos
- `menuAbierto` — id del dropdown abierto (uno solo a la vez)
- `modoSeleccion` + `seleccion` — selección múltiple para pagos en lote
- `sheet` / `modal` — overlay activo
- `toast` — confirmación efímera

Las deudas y el plan simplificado son **derivados** de `gastos`: calcularlos, no guardarlos.

## Accesibilidad

Contraste mínimo AA sobre el fondo oscuro. Foco visible con borde dorado.
`aria-current="page"` en navegación, `aria-pressed` en chips, `aria-selected` en
segmented y menús, `role="dialog"` + `aria-modal` en sheets y modales,
`role="status"` en toasts. Escape cierra cualquier overlay.

## Assets

Sin imágenes ni librería de íconos. Los íconos de categoría son **emoji** provistos por
el sistema operativo. La única dependencia externa es la fuente **Archivo** de Google Fonts.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `ESPECIFICACION_FUNCIONAL.md` | Comportamiento, algoritmos, flujos, copy, casos borde y permisos |
| `Prototipo.dc.html` | Prototipo interactivo completo, mobile + desktop. Fuente de verdad visual |
| `Sistema de diseño.dc.html` | Documentación visual del sistema (esta guía, renderizada) |
| `tokens/tokens.css` | Variables CSS. Importar primero |
| `tokens/components.css` | Clases de componente |
| `tokens/tokens.json` | Tokens como datos, para generadores |
| `tokens/tailwind.config.ts` | Mapeo a Tailwind |
| `components/ui/*.tsx` | Primitivas React + TypeScript |
| `lib/`, `types/` | Utilidades y tipos de dominio |

Para abrir los `.dc.html`: doble click, funcionan directamente en el navegador.
