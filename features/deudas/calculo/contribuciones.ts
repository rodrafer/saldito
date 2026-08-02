import type { Gasto } from '@/types';
import { montoDe, repartirEnPartesIguales, type Asignacion } from './redondeo';

/**
 * Cuánto puso efectivamente cada pagador (especificación 2.1).
 *
 * La suma del resultado es **exactamente** `g.monto`. Ese invariante es el que
 * sostiene todo lo demás: `deudasDeGasto` reparte la deuda en proporción a
 * estas contribuciones, así que si acá sobra o falta una unidad, el saldo neto
 * del grupo deja de dar cero.
 */
export function contribucionesDeGasto(g: Gasto): Asignacion {
  const pagadores = Object.keys(g.contribuciones);
  if (pagadores.length === 0) return {};

  // Montos explícitos: ya vienen validados desde el formulario (su suma tiene
  // que dar el total exacto, ver especificación 6.4).
  if (g.modoPago === 'montos') {
    return Object.fromEntries(pagadores.map((id) => [id, montoDe(g.contribuciones, id)]));
  }

  // Partes iguales entre los pagadores elegidos.
  return repartirEnPartesIguales(g.monto, pagadores);
}
