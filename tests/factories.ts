import type { Gasto, Grupo, Integrante, MonedaId, Pago, UsuarioId } from '@/types';

export const GRUPO_ID = 'g1';

export function grupo(over: Partial<Grupo> = {}): Grupo {
  return {
    id: GRUPO_ID,
    nombre: 'Casa',
    creadoPor: 'ana',
    creadoEl: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

export function integrantes(ids: readonly UsuarioId[], grupoId = GRUPO_ID): Integrante[] {
  return ids.map((usuarioId, i) => ({
    usuarioId,
    grupoId,
    rol: i === 0 ? 'admin' : 'miembro',
    activo: true,
  }));
}

let seq = 0;

export function gasto(over: Partial<Gasto> = {}): Gasto {
  seq += 1;
  return {
    id: `gasto-${seq}`,
    grupoId: GRUPO_ID,
    titulo: 'Gasto',
    categoriaId: 'c1',
    moneda: 'ARS',
    monto: 1000,
    fecha: '2026-06-01T12:00:00.000Z',
    modoPago: 'iguales',
    contribuciones: { ana: 1000 },
    modoReparto: 'iguales',
    participantes: ['ana'],
    anulado: false,
    historial: [],
    ...over,
  };
}

export function pago(over: Partial<Pago> = {}): Pago {
  seq += 1;
  return {
    id: `pago-${seq}`,
    grupoId: GRUPO_ID,
    deudorId: 'beto',
    acreedorId: 'ana',
    moneda: 'ARS',
    monto: 100,
    fecha: '2026-06-02T12:00:00.000Z',
    registradoPor: 'ana',
    confirmado: true,
    ...over,
  };
}

/**
 * Parte `total` en `n` enteros no negativos que suman exactamente `total`.
 *
 * Usa cortes en un segmento, a propósito: es un algoritmo **independiente** del
 * de producción. Si generáramos las particiones con `repartirProporcional` los
 * tests estarían validando el código contra sí mismo.
 */
export function particion(total: number, n: number, cortesRaw: readonly number[]): number[] {
  if (n <= 0) return [];
  if (n === 1) return [total];

  const cortes = cortesRaw
    .slice(0, n - 1)
    .map((c) => Math.floor(c * total))
    .sort((a, b) => a - b);

  while (cortes.length < n - 1) cortes.push(total);

  const puntos = [0, ...cortes, total];
  return Array.from({ length: n }, (_, i) => puntos[i + 1] - puntos[i]);
}

/** Suma de los valores de una asignación. */
export function suma(asignacion: Record<string, number>): number {
  return Object.values(asignacion).reduce((a, b) => a + b, 0);
}

/**
 * Saldo de una persona calculado directo desde los gastos: lo que puso menos lo
 * que consumió. Es la segunda vía de cálculo contra la que se contrasta el
 * resultado de `calcularSaldos`.
 */
export function saldoDirecto(
  gastos: readonly Gasto[],
  moneda: MonedaId,
  usuarioId: UsuarioId,
  contribucionesDeGasto: (g: Gasto) => Record<string, number>,
  repartoDeGasto: (g: Gasto) => Record<string, number>,
): number {
  return gastos
    .filter((g) => g.moneda === moneda && !g.anulado && !g.borrador)
    .reduce(
      (acc, g) =>
        acc + (contribucionesDeGasto(g)[usuarioId] ?? 0) - (repartoDeGasto(g)[usuarioId] ?? 0),
      0,
    );
}
