# Saldito — Plan de implementación

Gestor de gastos compartidos. React + TypeScript + Next.js (App Router) + Tailwind v4 + Supabase.

Fuentes de verdad:

- **Funcional** → `design_handoff_saldito/ESPECIFICACION_FUNCIONAL.md`
- **Visual** → `design_handoff_saldito/Prototipo.dc.html` (manda sobre el README ante conflicto)
- **Sistema visual** → `design_handoff_saldito/README.md`

## Decisiones tomadas

| Tema                          | Decisión                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| Capa de datos                 | Híbrido: lectura en RSC, mutaciones por Server Actions, realtime solo en Plan y saldos |
| Tailwind                      | v4, CSS-first. Se traduce el `tailwind.config.ts` del handoff a `@theme inline`        |
| Alcance del primer entregable | Núcleo: cálculo → gastos → deudas → plan (fases 0–7)                                   |
| Auth                          | Email + contraseña **y** Google OAuth                                                  |

## Supuestos (decir si alguno no va)

- Gestor de paquetes **npm** (pnpm no está instalado en la máquina).
- Tests con **Vitest** + **fast-check** para los invariantes de redondeo.
- Validación de entrada con **Zod**, compartida entre Server Actions y formularios.
- Deploy en **Vercel**; Supabase gestionado.
- Cotización desde **dolarapi.com**, cacheada unos minutos del lado del servidor y
  **nunca persistida**; si falla, se omite la referencia sin bloquear nada.
- Generación de borradores recurrentes con **pg_cron** en Supabase.
- Trabajo en branches por fase, con PR por fase.

---

## Scaffolding feature-based

```
saldito/
├── app/
│   ├── layout.tsx                    # tokens + AmbientBackground + fuente Archivo
│   ├── (auth)/login | registro | recuperar | onboarding
│   ├── (app)/
│   │   ├── layout.tsx                # Sidebar desktop + BottomNav mobile
│   │   ├── page.tsx                  # Dashboard
│   │   ├── gastos/                   # page · nuevo · [id] · [id]/editar
│   │   ├── deudas/ · grupo/ · categorias/ · notificaciones/ · perfil/
│   └── api/cotizacion/route.ts
├── features/                         # una carpeta por dominio
│   ├── gastos/        components · hooks · actions.ts · queries.ts · schemas.ts
│   ├── deudas/        calculo/  ← algoritmos puros, sin dependencias
│   ├── plan/ · recurrencias/ · grupos/ · categorias/
│   ├── notificaciones/ · perfil/ · auth/
├── components/ui/                    # las 16 primitivas del handoff
├── lib/
│   ├── supabase/      client.ts · server.ts · middleware.ts
│   └── cn.ts · formato.ts · fechas.ts
├── types/
├── styles/            tokens.css · components.css · theme.css
├── supabase/          migrations/ · seed.sql
└── design_handoff_saldito/           # referencia, no se edita
```

**Regla estructural:** `features/deudas/calculo/` es TypeScript puro — no importa nada de
Next ni de Supabase. Así corre idéntico en los tests, en el servidor al renderizar y en el
cliente para los updates optimistas.

**Regla de estilo:** ningún hex hardcodeado. `tokens.css` sigue siendo la única fuente;
`theme.css` la expone a Tailwind v4 vía `@theme inline`.

---

## Fases

### Fase 0 — Bootstrap

- Vincular la carpeta local al repo `rodrafer/saldito` conservando `LICENSE`, `.gitignore` y `README.md` de `main`.
- Terminar de importar el handoff desde Claude Design: `components.css`, `tokens.json`,
  `README.md`, las 16 primitivas `.tsx`, `support.js` y los dos `.dc.html`.
- `create-next-app` (TS, App Router, Tailwind v4, ESLint) + estructura feature-based + paths en `tsconfig`.
- Vitest, Testing Library, Prettier, y CI en GitHub Actions (typecheck · lint · test · build).

### Fase 1 — Núcleo de cálculo, sin UI

- `types/` de dominio (ya importado del handoff).
- Algoritmos 2.1–2.7 de la spec en `features/deudas/calculo/`.
- Suite de tests con los invariantes que la propia spec marca como red de seguridad:
  - la suma de contribuciones y la del reparto dan **exactamente** el monto;
  - por moneda, la suma de todos los saldos del grupo es **cero**;
  - el saldo de cada persona coincide con `puso − consumió` **y** con la suma de sus deudas por par;
  - el plan produce a lo sumo `n − 1` movimientos por moneda y salda exacto.
- `lib/fechas.ts` para las franjas "Hoy / Esta semana / Antes".

> Esta fase es la que más barato sale hacer bien y más caro sale hacer mal. Va entera antes de cualquier pantalla.

### Fase 2 — Sistema de diseño

- `tokens.css` + `components.css` + `theme.css`; fuente Archivo por `next/font`.
- Portar las 16 primitivas, adaptándolas a las convenciones del repo.
- `AmbientBackground` en el layout raíz (uso único) con sus blooms mobile y desktop.
- Shell: rail lateral colapsable (64px → 212px por hover, hueco fijo 76px, activo sin borde)
  y barra inferior flotante con FAB.
- Helper para el grid firme `1fr 300px` con gap 20px, obligatorio en toda pantalla desktop.
- Ruta `/dev/kitchen-sink` (solo en dev) para comparar contra `Sistema de diseño.dc.html`.

### Fase 3 — Supabase: esquema, RLS y auth

- Migraciones de todas las entidades. **No** se persisten deudas, saldos ni cotización.
- Modelado de contribuciones y reparto: tabla hija por persona, para que el filtro "Pagó"
  y la integridad referencial funcionen sin desarmar jsonb.
- RLS en cada tabla, apoyada en pertenencia al grupo.
- Constraints y triggers que reflejen las reglas de integridad de la sección 1.2.
- Middleware de sesión, login, registro, recuperación, Google OAuth y onboarding.
- `seed.sql` con los fixtures del prototipo.

### Fase 4 — Gastos

- Lista con agrupación por franja, anulados atenuados, borradores arriba.
- Fila de filtros en una sola línea con scroll horizontal; cada chip abre su propio menú
  de 300px anclado a sí mismo, con buscador cuando la lista es larga; se combinan con AND.
- Detalle de gasto con historial (pantalla nueva, no está en el prototipo).
- Nuevo gasto: multi-pagador (Iguales · Montos) + reparto (Iguales · Porcentaje · Montos),
  con toda la validación y los mensajes de ayuda de la sección 6.4.
- Edición, anulación con restauración a 24hs, e historial de cambios.
- Modo selección múltiple.
- `/api/cotizacion` para la equivalencia estimada en ARS.

### Fase 5 — Deudas por persona y pagos

- Agrupado por moneda, badges semánticos, alias copiable.
- Acciones según rol: Registrar pago · Recordar · Pagar → {app} · Ya pagué.
- Registro, declaración y confirmación de pagos, con anulación a 24hs.
- Detalle de una deuda con los gastos que la originaron.
- Pantalla Recordar.

### Fase 6 — Plan simplificado y tiempo real

- Máquina de estados `idle → running → completed`.
- Al iniciar se congelan movimientos y gastos de origen.
- Bloqueo de deudas individuales y de edición/anulación mientras corre; cargar gastos sigue permitido.
- Realtime con resolución de conflictos: gana el primero, y al segundo se le informa sin tratarlo como error.
- Updates optimistas con reversión si el servidor rechaza.
- Cierre automático, con las dos salidas (sin deudas → felicitación; con deudas nuevas → vuelve a idle).

### Fase 7 — Dashboard

- Saldo neto apilado por moneda, con el de mayor monto arriba.
- `DonutChart` en SVG: segmentos separados con extremos redondeados; al pasar el mouse
  engorda el segmento, atenúa el resto y muestra tooltip.
- Avisos clicables de borradores pendientes y de plan en curso.
- Actividad reciente, accesos rápidos, y resumen por integrante en la columna derecha.

---

## Segunda tanda

### Fase 8 — Recurrentes

Definición desde un gasto existente, generación mensual del borrador por cron,
confirmación, recordatorio a 7 días, descarte a 30, y la regla de nunca dos borradores
abiertos de la misma recurrencia. Administración inline en Grupo.

### Fase 9 — Grupo, categorías, perfil, notificaciones

Nombre editable, integrantes y tarjetas, invitación por link, baja de integrantes bloqueada
con deudas abiertas, ABM de categorías, perfil con gestión de tarjetas, y la bandeja de
notificaciones con sus acciones embebidas.

### Fase 10 — Pulido

Estados vacíos, esqueletos con la forma real del contenido, manejo de errores,
accesibilidad (foco dorado, `aria-*`, Escape cierra overlays), `prefers-reduced-motion`,
QA responsive contra el prototipo, y deploy.

---

## Riesgos identificados

- **Redondeo.** Es donde se rompe la confianza del usuario. Mitigado con la Fase 1 completa
  y tests generativos antes de cualquier pantalla.
- **Cálculo derivado en cada request.** Derivar deudas de todos los gastos vigentes es
  correcto y es lo que pide la spec, pero escala linealmente con el historial del grupo.
  Si un grupo se pone grande, cachear el resultado derivado — nunca persistirlo como verdad.
- **Realtime y RSC conviven mal si se mezclan.** Por eso el realtime queda acotado a Plan y
  saldos, con un límite explícito de qué se suscribe.
- **Cuatro pantallas no están dibujadas** (detalle con historial, edición, administración de
  recurrentes, confirmación de borrador). Se construyen con el vocabulario visual existente,
  sin inventar patrones nuevos.
