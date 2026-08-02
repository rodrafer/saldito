# Especificación funcional — Saldito

Documento de comportamiento. Complementa a `README.md`, que cubre el sistema visual.
Ante una discrepancia entre este documento y `Prototipo.dc.html`, **manda el prototipo**
en lo visual y **manda este documento** en lo funcional: incluye decisiones posteriores
al prototipo que todavía no están reflejadas en él (ver sección 12).

Idioma de producto: **español rioplatense, voseo**. Se tutea al usuario con "vos"
("Cargá", "Registrá", "Poné"). Nunca "tú" ni "usted".

---

## 1. Modelo de dominio

### 1.1 Entidades

```ts
Usuario     { id, nombre, email, alias, appPago, monedaPreferida, tarjetas[] }
Grupo       { id, nombre, creadoPor, creadoEl }
Integrante  { usuarioId, grupoId, rol: 'admin' | 'miembro', activo, desactivadoEl? }
Tarjeta     { id, usuarioId, nombre, vencimiento }        // vencimiento MM/AA
Categoria   { id, grupoId | null, nombre, icono, color, fondo }

Gasto {
  id, grupoId, titulo, categoriaId, moneda, monto, fecha,

  // --- quién puso la plata (puede ser más de uno)
  modoPago: 'iguales' | 'montos',
  contribuciones: Record<UsuarioId, number>,   // suma exacta = monto

  // --- entre quiénes se reparte
  modoReparto: 'iguales' | 'porcentaje' | 'montos',
  participantes: UsuarioId[],
  reparto?: Record<UsuarioId, number>,

  // --- ciclo de vida
  anulado: boolean,
  anuladoPor?: UsuarioId,
  anuladoEl?: string,
  editadoEl?: string,
  historial: EdicionGasto[],
  recurrenciaId?: string,        // si nació de una recurrencia
  confirmadoPor?: UsuarioId[],   // quienes figuran como pagadores y ya confirmaron
}

EdicionGasto { fecha, autorId, cambios: Record<campo, { antes, despues }> }

Recurrencia {
  id, grupoId, titulo, categoriaId, moneda,
  montoSugerido?: number,        // referencia, nunca se aplica sola
  diaDelMes: number,             // 1–28
  modoPago, contribuciones, modoReparto, participantes, reparto?,
  activa: boolean, creadaPor, ultimaGeneracion?: string,
}

Notificacion { id, usuarioId, tipo, actorId?, texto, entidadId?, fecha, leida }

Plan {
  id, grupoId, estado: 'idle' | 'running' | 'completed',
  movimientos: Movimiento[],     // pueden mezclar monedas
  gastoIds: string[],
  iniciadoPor, iniciadoEl,
}
Movimiento { id, deudorId, acreedorId, moneda, monto, hecho, hechoPor?, hechoEl? }
```

**No existe la entidad Deuda.** Tampoco se guardan saldos ni deudas entre pares.
Todo se deriva de los gastos vigentes. Ver 1.4 y sección 2.

### 1.2 Reglas de integridad

- Un gasto pertenece a exactamente un grupo y no se puede mover entre grupos.
- `contribuciones` no puede estar vacío y su suma debe ser **exactamente** `monto`.
- Los pagadores no necesitan participar del reparto, ni los participantes haber pagado.
- `participantes` no puede estar vacío.
- Si el conjunto de pagadores es idéntico al de participantes y los montos coinciden
  persona por persona, el gasto no mueve saldos. Se registra igual y cuenta para totales.
- `monto` es un entero positivo, sin centavos: pesos enteros en ARS, dólares enteros en USD.
- Una categoría sólo se puede eliminar si no tiene gastos vigentes asociados.
- Un grupo necesita nombre no vacío y al menos dos integrantes activos.
- Un integrante inactivo no puede figurar como pagador ni participante de un gasto nuevo,
  pero sigue apareciendo en los históricos.

### 1.3 Monedas — saldos separados

**Decisión:** ARS y USD llevan saldos completamente separados. No se convierte nada.

- Cada gasto guarda su moneda y nunca se convierte al guardar.
- Los saldos, los movimientos y el plan simplificado se calculan **por moneda**.
- El usuario puede deber `$12.400` y a la vez tener a favor `US$ 80`: son dos saldos
  independientes que se saldan por separado.
- Símbolos: ARS `$`, USD `US$ ` (con espacio). Formato `toLocaleString('es-AR')`, sin decimales.

**Cotización.** Se consulta a un servicio externo, se muestra **siempre actualizada** y
**nunca se guarda** en el gasto. Sólo cumple una función informativa: al cargar un gasto en
USD se muestra la equivalencia estimada en ARS, y en el Dashboard puede mostrarse el saldo
en USD con su referencia en pesos. Esa cifra no participa de ningún cálculo de deuda.
Si el servicio falla, se omite la referencia; **nunca se muestra una cotización vieja**.

**Consecuencia de UI:** donde hoy hay un saldo, ahora puede haber dos. El Dashboard muestra
el saldo en la moneda con actividad; si hay ambas, se apilan con la de mayor monto arriba.
Las listas de Deudas se agrupan por moneda con un encabezado cuando hay más de una.

### 1.4 Deuda entre pares, proporcional al aporte

**Decisión de fondo:** la deuda se atribuye **entre pares de personas**, y cuando un gasto
tuvo varios pagadores, cada participante le debe a cada pagador **en proporción a lo que
ese pagador puso**.

Sea un gasto de total `T`. Los pagadores A y B pusieron las fracciones `m` y `n`
(`m + n = 1`). El reparto entre los participantes A, B y C asigna las fracciones
`x`, `y`, `z` de `T` (`x + y + z = 1`; pueden salir de partes iguales, de porcentajes,
de montos explícitos, o excluir a alguien con fracción cero).

Entonces:

- A puso `mT` y se le debe `mT`, aportado por A, B y C en `xmT`, `ymT`, `zmT`.
- B puso `nT` y se le debe `nT`, aportado por A, B y C en `xnT`, `ynT`, `znT`.

Cada participante `P` debe en total `reparto[P]`, repartido entre los pagadores según
la fracción que cada uno aportó. La porción que alguien se debe a sí mismo se descarta:
se cancela sola.

**Por qué así.** Es la atribución que respeta el hecho económico —quien puso más plata
tiene más por recuperar— sin introducir convenciones arbitrarias. Y mantiene intacta la
estructura de deudas por par que ya tiene el prototipo: la pantalla Deudas · Por persona
sigue diciendo "Rocío te debe $8.000", con sus acciones de pago directas.

**Consistencia con el saldo neto.** El saldo neto de cada persona sigue siendo
`puso − consumió`, y **coincide exactamente** con la suma de sus deudas por par.
La demostración es directa: para A, lo que le deben menos lo que debe da
`m(T − reparto[A]) − reparto[A](1 − m) = mT − reparto[A]`.
Testear esta igualdad: es la mejor red de seguridad del sistema.

---

## 2. Algoritmos

Los cuatro algoritmos siguientes son el corazón funcional. Implementarlos con tests
unitarios antes que cualquier pantalla.

### 2.1 Contribuciones (`contribucionesDeGasto`)

Cuánto puso efectivamente cada pagador. La suma es **exactamente** el monto.

```ts
function contribucionesDeGasto(g: Gasto): Record<UsuarioId, number> {
  const pagadores = Object.keys(g.contribuciones);

  // montos explícitos: ya validados al guardar
  if (g.modoPago === 'montos') return { ...g.contribuciones };

  // partes iguales entre los pagadores elegidos
  const n = pagadores.length;
  const base = Math.floor(g.monto / n);
  let resto = g.monto - base * n;
  return Object.fromEntries(pagadores.map((id, i) => [id, base + (i < resto ? 1 : 0)]));
}
```

### 2.2 Reparto (`repartoDeGasto`)

Cuánto le corresponde pagar a cada participante. La suma es **exactamente** el monto.

```ts
function repartoDeGasto(g: Gasto): Record<UsuarioId, number> {
  const { participantes: p, monto, modoReparto: modo, reparto } = g;
  const n = p.length || 1;

  if (modo === 'montos' && reparto) {
    return Object.fromEntries(p.map(id => [id, reparto[id] ?? 0]));
  }

  if (modo === 'porcentaje' && reparto) {
    const out: Record<string, number> = {};
    const frac: { id: string; f: number }[] = [];
    let asignado = 0;
    for (const id of p) {
      const exacto = monto * (reparto[id] ?? 0) / 100;
      const piso = Math.floor(exacto);
      out[id] = piso;
      asignado += piso;
      frac.push({ id, f: exacto - piso });
    }
    let resto = monto - asignado;
    frac.sort((a, b) => b.f - a.f);                       // mayor parte fraccionaria primero
    for (let i = 0; i < frac.length && resto > 0; i++) { out[frac[i].id] += 1; resto--; }
    return out;
  }

  const base = Math.floor(monto / n);
  const resto = monto - base * n;
  return Object.fromEntries(p.map((id, i) => [id, base + (i < resto ? 1 : 0)]));
}
```

**Regla de redondeo, común a 2.1 y 2.2:** nunca se reparte un monto fraccionado.
El sobrante se asigna de a 1 unidad, en orden de la lista (modo iguales) o por mayor
parte fraccionaria (modo porcentaje). Garantiza que la suma cierre exacto y que nadie
pague de más por redondeo.

### 2.3 Deudas de un gasto (`deudasDeGasto`)

Reparte lo que debe cada participante entre los pagadores, en proporción a lo que puso
cada uno. Devuelve una matriz `deudor → acreedor → monto`.

```ts
function deudasDeGasto(g: Gasto): Record<UsuarioId, Record<UsuarioId, number>> {
  const puso  = contribucionesDeGasto(g);   // suma exacta = g.monto
  const debia = repartoDeGasto(g);          // suma exacta = g.monto
  const pagadores = Object.keys(puso);
  const out: Record<string, Record<string, number>> = {};

  for (const p of g.participantes) {
    const total = debia[p] ?? 0;
    if (total <= 0) continue;

    // Repartir `total` entre los pagadores, proporcional a puso[q] / g.monto.
    // Piso + reparto del resto por mayor parte fraccionaria: la suma cierra exacta.
    const exactos = pagadores.map(q => ({ q, e: total * puso[q] / g.monto }));
    const fila: Record<string, number> = {};
    let asignado = 0;
    for (const { q, e } of exactos) { const piso = Math.floor(e); fila[q] = piso; asignado += piso; }
    let resto = total - asignado;
    exactos.sort((a, b) => (b.e - Math.floor(b.e)) - (a.e - Math.floor(a.e)));
    for (let i = 0; i < exactos.length && resto > 0; i++) { fila[exactos[i].q] += 1; resto--; }

    for (const q of pagadores) {
      if (q === p) continue;            // la porción propia se cancela sola
      if (fila[q] <= 0) continue;
      (out[p] ??= {})[q] = (out[p]?.[q] ?? 0) + fila[q];
    }
  }
  return out;
}
```

**Invariante:** para cada participante `P`, la suma de su fila más su porción propia
descartada es exactamente `reparto[P]`.

### 2.4 Deudas del grupo (`calcularDeudas`)

Acumula las deudas de todos los gastos vigentes y las netea por par, **por moneda**.

```ts
type Deuda = { deudorId: string; acreedorId: string; moneda: MonedaId;
               monto: number; gastoIds: string[] };

function calcularDeudas(gastos: Gasto[], pagos: Pago[], grupo: Grupo): Deuda[] {
  const vigentes = gastos.filter(g =>
    g.grupoId === grupo.id && !g.anulado && !g.borrador);

  // acumulado[moneda][deudor][acreedor]
  const acc: Record<string, Record<string, Record<string, number>>> = { ARS: {}, USD: {} };
  const origen: Record<string, Record<string, string[]>> = {};

  for (const g of vigentes) {
    const m = deudasDeGasto(g);
    for (const p in m) for (const q in m[p]) {
      ((acc[g.moneda][p] ??= {})[q] = (acc[g.moneda][p]?.[q] ?? 0) + m[p][q]);
      ((origen[p] ??= {})[q] ??= []).push(g.id);
    }
  }

  // Los pagos registrados reducen la deuda del deudor hacia el acreedor
  for (const pg of pagos.filter(p => p.grupoId === grupo.id)) {
    (acc[pg.moneda][pg.deudorId] ??= {});
    acc[pg.moneda][pg.deudorId][pg.acreedorId] =
      (acc[pg.moneda][pg.deudorId][pg.acreedorId] ?? 0) - pg.monto;
  }

  // Netear por par y por moneda
  const out: Deuda[] = [];
  const ids = grupo.integrantes.map(i => i.usuarioId);
  for (const moneda of ['ARS', 'USD'] as const) {
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      const neto = (acc[moneda][a]?.[b] ?? 0) - (acc[moneda][b]?.[a] ?? 0);
      if (Math.abs(neto) < 1) continue;                    // umbral: menos de 1 se ignora
      out.push({
        deudorId:   neto > 0 ? a : b,
        acreedorId: neto > 0 ? b : a,
        moneda,
        monto: Math.round(Math.abs(neto)),
        gastoIds: [...new Set([...(origen[a]?.[b] ?? []), ...(origen[b]?.[a] ?? [])])],
      });
    }
  }
  return out;
}
```

**Puntos críticos:**

- El neteo es **por par y por moneda**. Si A le debe 100 a B y B le debe 30 a A, queda
  una sola deuda: A debe 70 a B.
- ARS y USD nunca se mezclan: dos personas pueden tener una deuda en cada moneda.
- Cada deuda arrastra los `gastoIds` que la originaron, para poder mostrar el detalle.
- Umbral de 1 unidad: diferencias menores se descartan para evitar deudas fantasma.

### 2.5 Saldo neto (`calcularSaldos`)

Derivado, usado en el Dashboard y como entrada del plan simplificado.

```ts
type Saldos = Record<MonedaId, Record<UsuarioId, number>>;

function calcularSaldos(deudas: Deuda[], grupo: Grupo): Saldos {
  const out: Saldos = { ARS: {}, USD: {} };
  for (const m of ['ARS', 'USD'] as const)
    for (const i of grupo.integrantes) out[m][i.usuarioId] = 0;

  for (const d of deudas) {
    out[d.moneda][d.deudorId]   -= d.monto;
    out[d.moneda][d.acreedorId] += d.monto;
  }
  return out;
}
```

**Invariantes a testear:**

1. Para cada moneda, la suma de todos los saldos del grupo es **cero**.
2. El saldo de cada persona coincide con `puso − consumió` calculado directo desde los
   gastos. Si las dos vías no dan lo mismo, hay un bug en el redondeo de 2.3.

### 2.6 Movimientos del plan (`derivarMovimientos`)

Traduce saldos en el mínimo práctico de transferencias. Se corre **una vez por moneda**.

```ts
function derivarMovimientos(saldos: Record<UsuarioId, number>, moneda: MonedaId): Movimiento[] {
  const deudores   = Object.entries(saldos).filter(([, v]) => v < -0.5)
                       .map(([id, v]) => ({ id, m: -v })).sort((a, b) => b.m - a.m);
  const acreedores = Object.entries(saldos).filter(([, v]) => v > 0.5)
                       .map(([id, v]) => ({ id, m:  v })).sort((a, b) => b.m - a.m);

  const mov: Movimiento[] = [];
  let i = 0, j = 0;
  while (i < deudores.length && j < acreedores.length) {
    const pago = Math.min(deudores[i].m, acreedores[j].m);
    mov.push({ id: uid(), deudorId: deudores[i].id, acreedorId: acreedores[j].id,
               moneda, monto: Math.round(pago), hecho: false });
    deudores[i].m -= pago;
    acreedores[j].m -= pago;
    if (deudores[i].m < 0.5) i++;
    if (acreedores[j].m < 0.5) j++;
  }
  return mov;
}
```

Emparejamiento codicioso: el que más debe le paga al que más le deben. No es el óptimo
teórico, pero produce a lo sumo `n − 1` movimientos por moneda y es el comportamiento que
el usuario ya vio. **No sustituirlo sin avisar**: el copy promete "el camino más corto".

### 2.7 Registrar un pago (`registrarPago`)

```ts
Pago { id, grupoId, deudorId, acreedorId, moneda, monto, fecha, registradoPor, confirmado }
```

- Lo registra **el acreedor** ("Registrar pago") o lo declara **el deudor** ("Ya pagué").
- Declarado por el deudor: `confirmado = false`, reduce la deuda igual, y al acreedor le
  llega una notificación con acción de confirmar.
- Registrado por el acreedor: `confirmado = true` directo.
- Se puede anular dentro de las 24hs por quien lo registró; después, sólo con un pago inverso.
- Un pago **no marca gastos como saldados**: reduce la deuda neta entre dos personas.
  Un gasto puede quedar parcialmente saldado y eso es correcto.

---

## 3. Gastos: edición, anulación y auditoría

### 3.1 Edición

**Decisión: edición libre, con recálculo completo y trazabilidad.**

- Cualquier integrante puede editar cualquier gasto del grupo (ver permisos, sección 8).
- Al guardar, los saldos se recalculan desde cero. No hay ajustes incrementales.
- Cada edición agrega una entrada a `historial` con autor, fecha y campos cambiados.
- El gasto queda marcado como editado y lo muestra en su detalle:
  *"Editado por {nombre} · {fecha}"*, con acceso al historial completo.

**Salvaguarda.** Si la edición cambia las deudas de personas que ya habían quedado a mano
o que participaron de pagos registrados:

1. Se notifica a cada afectado: *"{nombre} editó \"{gasto}\" — tu deuda cambió de {antes} a {después}"*.
2. Si hay un **plan en curso**, la edición se rechaza. Toast:
   *"No podés editar mientras el plan simplificado está en curso"* (⚠️).
   Hay que cancelar el plan o esperar a que termine.
3. La edición nunca revierte pagos ya registrados: los pagos son hechos, los gastos son datos.

### 3.2 Anulación

**Decisión: baja lógica, nunca borrado.** Un gasto compartido es un hecho social;
que desaparezca sin rastro genera desconfianza.

- `anulado = true` más autor y fecha. Deja de contar en saldos, totales y categorías.
- Sigue visible en el historial del grupo, atenuado y con la leyenda
  *"Anulado por {nombre} · {fecha}"*.
- Se puede filtrar la lista para ocultarlos (por defecto se ocultan los de más de 30 días).
- Se puede **restaurar** dentro de las 24hs por quien lo anuló.
- Mismas reglas que la edición respecto de un plan en curso.
- Al anular se notifica a todos los afectados.

Toasts: *"Gasto anulado — se avisó a los participantes"* (🗑️) ·
*"Gasto restaurado"* (↩️).

---

## 4. Gastos recurrentes

Alquiler, expensas y servicios se repiten todos los meses. La recurrencia guarda la
**forma** del gasto, no su monto.

### 4.1 Definición

- Frecuencia: **mensual únicamente** en esta versión. Se elige un `diaDelMes` de 1 a 28
  (evita los meses cortos; no hay lógica de "último día del mes").
- Guarda título, categoría, moneda, pagadores, participantes y modo de reparto.
- El **monto es variable**: puede haber un `montoSugerido` de referencia (el del mes
  anterior), pero nunca se aplica solo.
- Se crea desde un gasto existente ("Repetir todos los meses"). La administración
  (activar, pausar, eliminar) vive **inline en Grupo**, debajo de Integrantes: no hay
  pantalla ni modal aparte.

### 4.2 Generación

**Nada entra a los saldos sin que una persona lo valide.**

El día indicado se crea un **gasto en borrador**:

- No tiene monto, o tiene el sugerido marcado como provisorio.
- **No cuenta para saldos, totales ni deudas** mientras siga en borrador.
- Aparece arriba de todo en Gastos, con tratamiento visual de pendiente, y genera
  una notificación a los pagadores: *"Llegó el momento de cargar {título}"* (🔁).
- Al confirmarlo se completa el monto, se valida el reparto como cualquier gasto y
  recién ahí entra a los saldos.
- Si nadie lo confirma, a los 7 días se manda un recordatorio. A los 30 días el borrador
  se descarta y se avisa: *"Se descartó el borrador de {título}"*.
- **Nunca hay dos borradores abiertos de la misma recurrencia.** Si llega la fecha y el
  anterior sigue pendiente, no se genera uno nuevo: se refuerza el recordatorio.

### 4.3 Administración

Pantalla propia en Grupo. Cada recurrencia muestra título, día del mes, participantes y
el monto del último mes. Se puede pausar (`activa = false`), editar o eliminar.
Editar una recurrencia **no** modifica los gastos ya generados.

Toasts: *"{título} se va a repetir todos los meses"* (🔁) ·
*"Recurrencia pausada"* (⏸️) · *"Recurrencia eliminada"* (🗑️).

---

## 5. Ciclo de vida del plan simplificado

Con saldo neto, el plan pasa a ser el mecanismo central para saldar.
Es estado compartido del grupo, en tiempo real.

```
        ┌──────── iniciar ────────┐
        │                         ▼
     [idle] ◄──── cancelar ──── [running] ──── todos hechos ────► [completed]
        ▲                                                              │
        └────────────── "Ver saldos" / gasto nuevo ─────────────────────┘
```

### 5.1 `idle`

- Preview permanente de los movimientos derivados: *"{N} deudas cruzadas → {M} pagos"*.
- Copy: *"Juntamos todo lo que se deben en {grupo} y armamos el camino más corto para saldarlo. Nadie paga de más ni de menos."*
- Si hay deudas en ambas monedas, los movimientos se agrupan por moneda.
- Botón primario **Iniciar plan**. Sin deudas no inicia:
  toast *"No hay deudas para simplificar"* (ℹ️).
- En la pestaña Por persona, si el usuario tiene deudas, aparece un llamador punteado
  hacia el plan: *"Resuelve las deudas cruzadas con menos transferencias."*

### 5.2 `running`

Al iniciar se congelan los movimientos y la lista de gastos que los originaron.

- Toast: *"Plan simplificado iniciado — se avisó a todos"* (🔀).
- Cartel **⏳ Plan en curso** con quién lo inició y el texto
  *"Registrá o avisá cada movimiento. En cuanto estén todos hechos, el plan se cierra solo."*
- **Las deudas individuales quedan bloqueadas**: en Por persona, cada deuda incluida en el
  plan pierde sus acciones y muestra un cartel de bloqueo. Tampoco se pueden editar ni
  anular gastos. Cargar gastos nuevos **sí** está permitido.
- Acciones por movimiento, según el rol del usuario:

  | Rol | Acciones |
  |---|---|
  | Le tienen que pagar | **Recordar** (primaria) · **Registrar pago** |
  | Tiene que pagar | **Pagar → {app}** (primaria) · **Ya pagué** |
  | No participa | **Avisar a {deudor}** |

- Marcar un movimiento lo pone `hecho = true` y registra quién y cuándo. No se deshace.
- **Cualquier integrante puede cancelar el plan.** Vuelve a `idle`, descarta los
  movimientos no hechos, desbloquea todo y avisa a todos.
  Los movimientos ya marcados **quedan** como pagos registrados: son hechos.
  Toast: *"Plan cancelado — {n} pagos ya registrados se mantienen"* (✕).

### 5.3 Tiempo real y conflictos

El plan es estado compartido. Reglas:

- Los cambios se propagan en vivo a todos los integrantes que estén mirando la pantalla.
- Si dos personas marcan el mismo movimiento, **gana la primera**. A la segunda se le
  informa sin tratarlo como error: *"{nombre} ya lo había marcado"* (ℹ️).
- Si alguien cancela el plan mientras otro está marcando un movimiento, el marcado se
  descarta y se informa: *"{nombre} canceló el plan"* (ℹ️).
- La UI aplica los cambios de forma optimista y revierte si el servidor rechaza.

### 5.4 Cierre automático

Cuando todos los movimientos quedan hechos:

1. Se registran los pagos correspondientes (sección 2.7) y se recalculan las deudas.
2. Si **no quedan deudas** → `completed`, pantalla de felicitación con confeti:
   *"¡Felicitaciones! El plan simplificado se completó — no quedan deudas pendientes en {grupo}."*
   Toast: *"¡Plan completado! Todos quedaron a mano"* (🎉).
3. Si **quedan deudas** (por gastos cargados durante el plan) → vuelve a `idle`.
   Toast: *"Plan completado. Quedan deudas nuevas por saldar"* (✓).

### 5.5 Casos borde del plan

- **Gasto nuevo durante un plan en curso:** se carga normalmente y genera deuda, pero no
  se agrega al plan; los movimientos están congelados. Esa deuda queda visible y
  desbloqueada en Por persona, y se resuelve en el cierre (5.4, punto 3).
- **Cambio de grupo:** el plan es por grupo y sigue corriendo. Cambiar de grupo no lo
  cancela; al volver, sigue donde estaba.
- **Planes simultáneos:** un solo plan activo por grupo. Un plan puede incluir movimientos
  de ambas monedas.

---

## 6. Flujos por pantalla

### 6.1 Autenticación

**Login** — email + contraseña, botón de Google, recuperar contraseña
(*"Te enviamos un link para recuperarla"* ✉️) y acceso a crear cuenta.
Ingreso exitoso → Dashboard, toast *"¡Hola de nuevo, {nombre}!"* (👋).

**Onboarding** — creación de cuenta y primer grupo, por pasos.
Termina en el Dashboard del grupo recién creado.

> El prototipo no valida credenciales. Definir validación por campo, mensajes de error
> y estados de carga en la implementación.

### 6.2 Dashboard

1. **Tu saldo neto** en el grupo activo, display-lg, con signo y color semántico.
   Si hay saldos en ambas monedas se apilan, con el de mayor monto primero.
   Copy: *"Te deben"* / *"Debés"* / *"Estás a mano"*.
2. **Total del grupo** por categoría en **donut de segmentos separados**. Al pasar el
   mouse sobre un segmento se engrosa, el resto se atenúa y aparece un tooltip con
   categoría, monto, porcentaje y período. Sin vista alternativa de barras.
   Sólo gastos vigentes; los borradores de recurrencias no cuentan.
3. Si hay borradores pendientes de confirmar, **aviso clicable**.
4. Si hay un plan en curso, **aviso clicable** hacia Deudas.
5. **Actividad reciente**, agrupada por franja ("Hoy", "Esta semana", "Antes").
6. **Accesos rápidos**.

Desktop: grid `1fr 300px` con el resumen por integrante en la columna derecha.

### 6.3 Gastos

**Lista.** Ícono de categoría · título · pagadores y franja temporal · monto.
Con varios pagadores se muestra *"Pagaron {A} y {B}"*, o *"{A} +2"* si son más de dos.
Los anulados van atenuados, con su leyenda y sin acciones.
Los borradores de recurrencia van arriba de todo, destacados.

**Filtros.** Chips **en una sola línea con scroll horizontal**: Todos · Categoría · Pagó · Moneda.

- Cada chip abre un menú **anclado a sí mismo**, de 300px.
- Un solo menú abierto a la vez.
- Los menús largos incluyen buscador.
- "Todos" limpia los tres filtros. Se combinan con AND.
- El filtro "Pagó" matchea si la persona está entre los pagadores, aunque no sea el único.

**Acciones por gasto:** ver detalle, editar, anular, repetir todos los meses.
Cuando el gasto genera deuda a favor o en contra del usuario, también ofrece las
acciones de pago (registrar, recordar, pagar, ya pagué), como en el prototipo.
Con varios pagadores, la acción de pago apunta al pagador que corresponda según 1.4.

**Modo selección.** Se mantiene para registrar varios pagos de una vez y para anular
varios gastos.

### 6.4 Nuevo gasto

Formulario de un solo scroll:

1. **Monto** con selector de moneda. Se descartan los no-dígitos y se formatea en vivo.
   En USD se muestra la equivalencia estimada, con la cotización del momento.
2. **Descripción** — si queda vacía, se guarda como `"Gasto"`.
3. **Categoría** — chips horizontales.
4. **Quién pagó** — chips por integrante (multi-selección) más un control segmentado
   *Iguales · Montos*:
   - **Iguales**: el total se divide en partes iguales entre los pagadores elegidos.
   - **Montos**: cada pagador declara cuánto puso; la suma debe dar el total exacto.
   - Por defecto viene seleccionado el usuario como único pagador, en modo Iguales.
5. **Entre quiénes** — chips por integrante. El usuario viene preseleccionado.
6. **Cómo se reparte** — control segmentado *Iguales · Porcentaje · Montos*.

**Validación** (bloquea el guardado):

| Bloque | Válido cuando | Ayuda |
|---|---|---|
| Monto | `> 0` | — |
| Pagó · Iguales | ≥1 pagador | *"{A} y {B} ponen {$} cada uno"* |
| Pagó · Montos | suma = monto | *"asignado ✓"* / *"falta {$}"* / *"sobra {$}"* |
| Reparto · Iguales | — | *"{$} para cada uno"* |
| Reparto · Porcentaje | suma = 100 | *"100% asignado ✓"* / *"falta {x}%"* / *"sobra {x}%"* |
| Reparto · Montos | suma = monto | *"asignado ✓"* / *"falta {$}"* / *"sobra {$}"* |

Al cambiar de modo o de personas, los valores se recalculan con el default.
El botón **Guardar** queda deshabilitado mientras algo no cierre; si se toca igual:
*"Todavía falta cerrar la división"* (⚠️) o *"Falta definir quién puso cuánto"* (⚠️).

**Confirmación de pagadores.** Si el gasto declara pagadores además del usuario que lo
carga, a cada uno le llega una notificación: *"{nombre} cargó \"{gasto}\" y figurás como
que pusiste {$}"*, con acciones **Confirmar** y **No fui yo**.
El gasto **cuenta en los saldos desde el momento en que se carga** —no espera confirmación—
pero muestra un indicador de pendiente hasta que todos confirmen.
Si alguien responde "No fui yo", se notifica a quien lo cargó para que lo corrija.

Al guardar: *"Gasto guardado — se avisó a los participantes"* (✓).

### 6.5 Deudas

Control segmentado **Por persona / Plan simplificado**, alineado a la columna de 300px.

**Por persona** — una tarjeta por contraparte con deuda neta distinta de cero:
avatar, nombre, monto con color semántico, alias copiable y las acciones de pago.
Se mantiene tal cual está en el prototipo.
Con deudas en ambas monedas se agrupa por moneda, con encabezado.
Estado vacío: todos a mano.

Acciones por fila, según el rol del usuario:

| Rol | Acciones |
|---|---|
| Le deben | **Registrar pago** · **Recordar** |
| Debe | **Pagar → {app}** · **Ya pagué** |

Tocar una fila abre el detalle con los gastos que originaron esa deuda.
El botón *Seleccionar* sólo se habilita si hay pagos por recibir; si no:
*"No hay pagos por recibir para registrar"* (ℹ️).

**Plan simplificado** — sección 5 completa.

### 6.6 Recordar

Avatar, monto, mensaje editable pre-armado y opciones de envío (link de pago, WhatsApp,
copiar link). Incluye recordatorio recurrente por día de la semana y hora.
Al enviar: *"Recordatorio enviado a {nombre}"* (👋).

### 6.7 Grupo

- Nombre editable en línea (desktop) o por sheet (mobile). Sólo admin.
- **Integrantes**: cada persona con sus tarjetas (nombre del titular + vencimiento MM/AA).
  Los inactivos van al final, atenuados, con la leyenda *"Ya no participa"*.
- **Invitación**: link copiable y compartir por WhatsApp. Sólo admin.
- **Gastos recurrentes** inline, debajo de Integrantes: borradores pendientes primero
  (con monto sugerido y acceso a confirmar), después las recurrencias activas con su
  interruptor y su baja. Estado vacío cuando no hay ninguna.
- Accesos a **Categorías** y app de pago preferida.
- Selector de grupo activo, con el activo primero.

**Sacar a alguien del grupo.** Sólo admin, y sólo si esa persona no tiene **ninguna deuda
abierta, en ninguna moneda**. Si no: *"{nombre} no puede salir con deudas abiertas"* (⚠️),
con acceso directo al plan simplificado.
Al desactivar: `activo = false`, deja de aparecer en selectores de gastos nuevos,
sigue en los históricos. Toast: *"{nombre} ya no participa del grupo"* (✓).
Un admin puede reactivarlo.

**Salir por decisión propia:** mismas reglas. Nadie se va debiendo.

### 6.8 Categorías

ABM completo. Cada fila con emoji, nombre y uso (*"{n} gastos · {total}"* o
*"sin gastos todavía"*). Editar abre sheet/modal con selector de emoji (8 opciones) y nombre.
Nombre vacío → *"Sin nombre"*. Eliminar sólo sin gastos vigentes:
*"Categoría \"{nombre}\" eliminada"* (🗑️).

### 6.9 Notificaciones

Lista con punto rosa pulsante en los no leídos. Algunas traen acción embebida
(confirmar que pusiste plata, confirmar un pago, cargar un recurrente, pagar, copiar alias).
Acción global *Marcar todas como leídas*.

Tipos: gasto nuevo · te asignaron como pagador · gasto editado · gasto anulado ·
pago declarado · pago confirmado · recurrente pendiente · plan iniciado ·
movimiento marcado · plan cancelado · plan completado · recordatorio · cambios del grupo.

Desktop: grid `1fr 300px`, columna derecha vacía, mantenida por consistencia.

### 6.10 Perfil

Datos personales, **gestión de tarjetas** (agregar / editar / eliminar; requiere nombre y
vencimiento, si no: *"Completá nombre y vencimiento"* ⚠️), preferencias de moneda y app de
pago, accesos de cuenta y cierre de sesión (*"Cerraste sesión"*).

### 6.11 Menú de acciones (FAB)

1. **Cargar un gasto** → formulario en limpio.
2. **Registrar un pago** → submenú: *Una deuda entera* (Deudas en modo selección) o
   *Un pago de gastos* (Gastos en modo selección).
3. **Recordar un pago** → selector de a quién recordarle.

Todas las filas usan la variante de acción: hover dorado completo (fondo, borde y texto)
más desplazamiento de 3px.

---

## 7. Estados vacíos, carga y error

### 7.1 Estados vacíos

| Pantalla | Cuándo | Qué mostrar |
|---|---|---|
| Dashboard | Grupo sin gastos | Invitación a cargar el primero, con acción directa |
| Gastos | Sin gastos | Igual que el anterior |
| Gastos | Filtros sin resultados | *"No hay gastos con estos filtros"* + limpiar |
| Deudas · Por persona | Sin deudas | Estado positivo: todos a mano |
| Deudas · Plan | Sin deudas cruzadas | Se bloquea Iniciar plan; toast informativo |
| Grupo · Recurrentes | Ninguna | Explicación breve + crear la primera desde un gasto |
| Categorías | Categoría sin uso | *"sin gastos todavía"* en la fila |
| Notificaciones | Sin avisos | Estado vacío neutro |
| Grupo | Un solo integrante activo | Destacar la invitación |

Los estados vacíos nunca culpan al usuario y siempre ofrecen la acción siguiente.

### 7.2 Carga

Esqueletos con la forma real del contenido: las mismas tarjetas con el fondo de superficie,
sin texto. **No spinners centrados.** El saldo del Dashboard y los totales se muestran
recién cuando el cálculo terminó: nunca un número parcial que después salta.

### 7.3 Error

- **Acciones optimistas**: marcar un movimiento, registrar un pago, confirmar un borrador
  y marcar notificaciones se aplican al instante y se revierten si el servidor falla.
- **Error de red**: toast con tono del producto y opción de reintentar.
  Nunca un modal bloqueante para algo recuperable.
- **Conflicto**: ver 5.3. Se informa, no se trata como error.
- **Cotización caída**: se omite la referencia en ARS sin bloquear nada.

---

## 8. Permisos

**Modelo plano.** Un grupo de convivientes no necesita jerarquía sobre los gastos:
la confianza ya está dada y la trazabilidad (historial, avisos) alcanza como control.

| Acción | Quién |
|---|---|
| Cargar un gasto | Cualquier integrante activo |
| Editar o anular cualquier gasto | Cualquier integrante activo |
| Confirmar que pusiste plata | Sólo quien figura como pagador |
| Registrar el cobro de un pago | Sólo el acreedor |
| Declarar "ya pagué" | Sólo el deudor |
| Confirmar un pago declarado | Sólo el acreedor |
| Iniciar o cancelar el plan | Cualquier integrante activo |
| Marcar un movimiento como hecho | Las dos partes; cualquiera puede "avisar" |
| Crear y administrar recurrencias | Cualquier integrante activo |
| ABM de categorías | Cualquier integrante activo |
| Renombrar el grupo | **Admin** |
| Invitar integrantes | **Admin** |
| Desactivar o reactivar integrantes | **Admin** |
| Eliminar el grupo | **Admin** |
| Ceder el rol de admin | **Admin** |

Admin es quien creó el grupo; puede designar a otros. Un grupo siempre tiene al menos
un admin: el último no puede ceder su rol sin designar reemplazo.

---

## 9. Copy de referencia

Los textos del prototipo son definitivos salvo indicación contraria.

### Toasts

| Disparador | Texto | Ícono |
|---|---|---|
| Guardar gasto | Gasto guardado — se avisó a los participantes | ✓ |
| Reparto incompleto | Todavía falta cerrar la división | ⚠️ |
| Pagadores sin cerrar | Falta definir quién puso cuánto | ⚠️ |
| Editar gasto | Gasto actualizado — se avisó a los afectados | ✓ |
| Editar con plan en curso | No podés editar mientras el plan simplificado está en curso | ⚠️ |
| Anular gasto | Gasto anulado — se avisó a los participantes | 🗑️ |
| Restaurar gasto | Gasto restaurado | ↩️ |
| Registrar un pago | Pago de {nombre} registrado · {monto} | ✓ |
| Declarar un pago | Marcado como pagado — a la espera de que {nombre} lo confirme | ✓ |
| Confirmar un pago | Pago de {nombre} confirmado | ✓ |
| Abrir app de pago | Abriendo {app}… | 💸 |
| Iniciar plan | Plan simplificado iniciado — se avisó a todos | 🔀 |
| Cancelar plan | Plan cancelado — {n} pagos ya registrados se mantienen | ✕ |
| Movimiento ya marcado | {nombre} ya lo había marcado | ℹ️ |
| Plan cancelado por otro | {nombre} canceló el plan | ℹ️ |
| Plan completado sin saldos | ¡Plan completado! Todos quedaron a mano | 🎉 |
| Plan completado con deudas | Plan completado. Quedan deudas nuevas por saldar | ✓ |
| Sin deudas para simplificar | No hay deudas para simplificar | ℹ️ |
| Sin pagos por recibir | No hay pagos por recibir para registrar | ℹ️ |
| Registrar pago de un gasto | Pago registrado — gasto saldado | ✓ |
| Registrar varios pagos | Pagos registrados · {total} | ✓ |
| Crear recurrencia | {título} se va a repetir todos los meses | 🔁 |
| Pausar recurrencia | Recurrencia pausada | ⏸️ |
| Eliminar recurrencia | Recurrencia eliminada | 🗑️ |
| Descartar borrador | Se descartó el borrador de {título} | ℹ️ |
| Enviar recordatorio | Recordatorio enviado a {nombre} | 👋 |
| Copiar alias | Alias {alias} copiado | 📋 |
| Crear grupo | Grupo "{nombre}" creado | 🎉 |
| Sacar integrante con deudas | {nombre} no puede salir con deudas abiertas | ⚠️ |
| Desactivar integrante | {nombre} ya no participa del grupo | ✓ |
| Eliminar categoría | Categoría "{nombre}" eliminada | 🗑️ |
| Guardar tarjeta | Tarjeta guardada | ✓ |
| Eliminar tarjeta | Tarjeta eliminada | 🗑 |
| Falta dato de tarjeta | Completá nombre y vencimiento | ⚠️ |
| Cambiar app de pago | {app} es ahora tu app de pago | ✓ |
| Marcar notificaciones leídas | Notificaciones marcadas como leídas | ✓ |
| Login | ¡Hola de nuevo, {nombre}! | 👋 |
| Logout | Cerraste sesión | ✓ |
| Recuperar contraseña | Te enviamos un link para recuperarla | ✉️ |
| Grupo inválido | Poné un nombre y al menos otro integrante | ⚠️ |

Duración **2600ms**, autocierre, uno a la vez: el nuevo reemplaza al anterior.

### Textos largos

- Plan, preview: *"Juntamos todo lo que se deben en {grupo} y armamos el camino más corto para saldarlo. Nadie paga de más ni de menos."*
- Plan, en curso: *"Registrá o avisá cada movimiento. En cuanto estén todos hechos, el plan se cierra solo."*
- Plan, antes de iniciar: *"Cualquier integrante puede iniciarlo o cancelarlo. Mientras corre, las deudas que integra quedan bloqueadas."*
- Plan, al cancelar: *"Se descartan los movimientos que falten. Los pagos ya registrados se mantienen."*
- Plan completado: *"El plan simplificado se completó — no quedan deudas pendientes en {grupo}."*
- Llamador al plan: *"Resuelve las deudas cruzadas con menos transferencias."*
- Recurrente pendiente: *"Llegó el momento de cargar {título}. Poné el monto de este mes y listo."*
- Confirmación de pagador: *"{nombre} cargó \"{gasto}\" y figurás como que pusiste {$}."*
- Gasto editado: *"{nombre} editó \"{gasto}\" — tu deuda cambió de {antes} a {después}."*

---

## 10. Estado de la aplicación

En Next con App Router, la pantalla la resuelve el router.

**Servidor / persistido**
`usuario`, `grupos`, `integrantes`, `gastos`, `pagos`, `recurrencias`, `categorias`,
`notificaciones`, `plan`, `tarjetas`.

**Tiempo real** — `plan` y sus movimientos. También conviene propagar gastos nuevos y
pagos para que los saldos no queden viejos en pantalla.

**Cliente, por sesión** — `grupoActivo` (persistir entre sesiones), `viewport`.

**Cliente, efímero** — `filtroCategoria`, `filtroPagador`, `filtroMoneda`,
`menuAbierto` (uno solo), `busqueda`, `modoSeleccion`, `seleccion`, `sheetAbierto`,
`toast`, `tipoGrafico`, `borradorGasto`.

**Derivado, nunca guardado** — `deudas` (por par y por moneda), `saldos` (por moneda),
`movimientosSugeridos`, `totalGrupo`, `totalesPorCategoria`, `cotizacion`.

### Invariantes

1. Abrir un menú cierra cualquier otro menú abierto.
2. Navegar cierra sheets, menús, modo selección y edición en línea.
3. Cambiar de grupo resetea pestaña, filtros y selección — **pero no el plan**, que sigue corriendo.
4. El borrador de gasto se descarta al salir del formulario sin guardar.
5. Para cada moneda, la suma de los saldos del grupo es cero, y el saldo de cada persona
   coincide con la suma de sus deudas por par.

---

## 11. Casos borde

| Caso | Comportamiento |
|---|---|
| Gasto donde un pagador no participa | Válido. Todos los participantes le deben su parte proporcional |
| Gasto donde un participante no pagó nada | Válido y habitual. Debe su parte a cada pagador |
| Gasto con varios pagadores | Cada participante le debe a cada pagador en proporción a lo que puso. Ver 1.4 |
| Pagadores = participantes con montos idénticos | Válido, no genera deuda. Cuenta para totales |
| Monto que no divide exacto | El sobrante se asigna de a 1 unidad. Ver 2.1, 2.2 y 2.3 |
| Deuda neta menor a 1 unidad | Se descarta |
| Gastos en distinta moneda | Deudas, saldos y plan se calculan por separado. Ver 1.3 |
| Editar un gasto viejo | Permitido, recalcula todo y avisa a los afectados. Ver 3.1 |
| Editar con plan en curso | Rechazado |
| Anular un gasto | Baja lógica, restaurable 24hs. Ver 3.2 |
| Gasto nuevo con plan en curso | Se carga y afecta saldos, no entra al plan. Ver 5.5 |
| Integrante con deudas abiertas que quiere salir | Bloqueado hasta saldar. Ver 6.7 |
| Integrante inactivo con gastos históricos | Sigue visible en históricos, fuera de selectores nuevos |
| Dos personas marcan el mismo movimiento | Gana la primera. Ver 5.3 |
| Recurrente cuyo borrador anterior sigue abierto | No se genera uno nuevo. Ver 4.2 |
| Recurrente con día 29, 30 o 31 | No existe: el día se limita a 1–28 |
| Cotización no disponible | Se omite la referencia, no bloquea nada |
| Categoría con gastos | No se puede eliminar |
| Grupo con un solo integrante activo | No debería poder crearse. Ver 1.2 |

Ya no quedan casos sin definir. Cualquier situación nueva que aparezca durante la
implementación se consulta antes de resolverla por cuenta propia.

---

## 12. Diferencias entre el prototipo y esta especificación

El prototipo es anterior a las decisiones de las secciones 1.3, 1.4, 3, 4 y 8.
Donde difieran, **manda este documento en lo funcional y el prototipo en lo visual**.

| Tema | Prototipo | Especificación |
|---|---|---|
| Pagador | Siempre el usuario, uno solo | Varios pagadores, con modo Iguales o Montos |
| Deuda | Atribuida entre pares, un solo pagador | Entre pares, proporcional al aporte de cada pagador |
| USD | Fuera del cálculo de deudas | Saldo propio, independiente de ARS |
| Cotización | Hardcodeada en $1.100 | Servicio externo, siempre fresca, nunca guardada |
| Eliminar gasto | No existe | Baja lógica con restauración |
| Editar gasto | No existe | Libre, con recálculo, historial y avisos |
| Recurrentes | No existen | Mensuales, con borrador a confirmar |
| Salida del grupo | No existe | Bloqueada con saldos abiertos |
| Plan | Estado local | Estado compartido en tiempo real |

La pantalla **Deudas se mantiene tal como está en el prototipo**: la atribución proporcional
preserva la estructura por par, con sus acciones de pago directas.

**Pantallas nuevas a diseñar** (no están en el prototipo): detalle de gasto con historial,
edición de gasto, administración de recurrencias, confirmación de borrador recurrente.
Construirlas con los componentes y patrones existentes; no inventar vocabulario visual nuevo.

---

## 13. Orden de implementación

1. Tokens, layout raíz con `AmbientBackground`, navegación mobile y desktop.
2. Modelo de datos y fixtures (los del prototipo sirven de base).
3. **Algoritmos 2.1 a 2.7 con tests unitarios.** Testear el invariante de suma cero y la
   coincidencia entre saldo neto y suma de deudas por par.
4. Gastos: lista, filtros, detalle.
5. Nuevo gasto: multi-pagador + los tres modos de reparto, con toda su validación.
6. Edición, anulación e historial.
7. Deudas: por persona.
8. Plan simplificado completo, con tiempo real.
9. Dashboard con el donut por categoría y su tooltip.
10. Recurrentes: definición, generación de borradores y confirmación.
11. Grupo, categorías, perfil, notificaciones.
12. Autenticación y onboarding.

Los pasos 3 a 8 son el núcleo del producto; el resto es superficie.
