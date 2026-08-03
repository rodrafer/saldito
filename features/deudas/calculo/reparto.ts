import type { Gasto } from '@/types';
import {
  montoDe,
  repartirEnPartesIguales,
  repartirProporcional,
  type Asignacion,
} from './redondeo';

/**
 * Cuánto le corresponde pagar a cada participante (especificación 2.2).
 *
 * La suma del resultado es **exactamente** `g.monto`.
 *
 * Los tres modos vienen del formulario de nuevo gasto:
 * - `iguales`: el total se parte en partes iguales entre los participantes.
 * - `porcentaje`: cada uno lleva su porcentaje; la validación exige que sumen 100.
 * - `montos`: cada uno lleva su monto explícito; la validación exige que sumen el total.
 */
export function repartoDeGasto(g: Gasto): Asignacion {
  const { participantes, monto, modoReparto, reparto } = g;
  if (participantes.length === 0) return {};

  if (modoReparto === 'montos' && reparto) {
    return Object.fromEntries(participantes.map((id) => [id, montoDe(reparto, id)]));
  }

  if (modoReparto === 'porcentaje' && reparto) {
    // Se reparte proporcional a los porcentajes en vez de calcular cada uno
    // contra 100. Si los porcentajes sumaran algo distinto de 100 —no debería
    // pasar, pero no queremos que un dato viejo rompa el saldo del grupo— el
    // reparto proporcional igual cierra exacto contra el monto.
    return repartirProporcional(
      monto,
      participantes.map((id) => ({ id, peso: montoDe(reparto, id) })),
    );
  }

  return repartirEnPartesIguales(monto, participantes);
}
