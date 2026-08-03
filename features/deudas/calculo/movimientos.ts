import { MONEDAS, type MonedaId, type Movimiento, type Saldos, type UsuarioId } from '@/types';

/** Generador de ids, inyectable para que los tests sean deterministas. */
export type GenerarId = () => string;

const idPorDefecto: GenerarId = () => crypto.randomUUID();

/**
 * Traduce saldos en el mínimo práctico de transferencias (especificación 2.6).
 *
 * Emparejamiento codicioso: el que más debe le paga al que más le deben, hasta
 * que no queda nadie en rojo. No es el óptimo teórico —encontrarlo es NP-difícil
 * y no vale la pena— pero produce a lo sumo `n − 1` movimientos y es el
 * comportamiento que el usuario ya vio en el prototipo.
 *
 * **No sustituir sin avisar:** el copy de la pantalla promete "el camino más
 * corto" y la gente compara el resultado contra lo que esperaba.
 *
 * Se corre una vez por moneda: ARS y USD se saldan por separado.
 */
export function derivarMovimientos(
  saldos: Readonly<Record<UsuarioId, number>>,
  moneda: MonedaId,
  generarId: GenerarId = idPorDefecto,
): Movimiento[] {
  // El umbral de media unidad descarta los saldos que el neteo ya consideró
  // despreciables, para no emitir un movimiento de $0.
  const deudores = Object.entries(saldos)
    .filter(([, v]) => v < -0.5)
    .map(([id, v]) => ({ id, restante: -v }))
    .sort((a, b) => b.restante - a.restante);

  const acreedores = Object.entries(saldos)
    .filter(([, v]) => v > 0.5)
    .map(([id, v]) => ({ id, restante: v }))
    .sort((a, b) => b.restante - a.restante);

  const movimientos: Movimiento[] = [];
  let i = 0;
  let j = 0;

  while (i < deudores.length && j < acreedores.length) {
    const monto = Math.min(deudores[i].restante, acreedores[j].restante);

    movimientos.push({
      id: generarId(),
      deudorId: deudores[i].id,
      acreedorId: acreedores[j].id,
      moneda,
      monto: Math.round(monto),
      hecho: false,
    });

    deudores[i].restante -= monto;
    acreedores[j].restante -= monto;
    if (deudores[i].restante < 0.5) i++;
    if (acreedores[j].restante < 0.5) j++;
  }

  return movimientos;
}

/**
 * Los movimientos de todas las monedas, en un solo plan.
 *
 * Un plan puede mezclar monedas (especificación 5.5), pero cada una se resuelve
 * por su cuenta: nunca se compensa una deuda en dólares con uno en pesos.
 */
export function derivarMovimientosDelGrupo(
  saldos: Saldos,
  generarId: GenerarId = idPorDefecto,
): Movimiento[] {
  return MONEDAS.flatMap((moneda) => derivarMovimientos(saldos[moneda] ?? {}, moneda, generarId));
}
