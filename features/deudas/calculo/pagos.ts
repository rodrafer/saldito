import type { Movimiento, Pago, UsuarioId } from '@/types';

/** Ventana para dar de baja un pago recién registrado (especificación 2.7). */
export const HORAS_PARA_ANULAR_PAGO = 24;

const UNA_HORA_MS = 60 * 60 * 1000;

/**
 * Si un pago todavía se puede anular (especificación 2.7).
 *
 * Sólo lo puede anular quien lo registró, y sólo dentro de las 24hs. Pasada esa
 * ventana el pago es un hecho consumado: la única forma de revertirlo es
 * registrar un pago inverso, que queda asentado como tal.
 */
export function puedeAnularPago(
  pago: Pago,
  usuarioId: UsuarioId,
  ahora: Date = new Date(),
): boolean {
  if (pago.registradoPor !== usuarioId) return false;

  const transcurridas = (ahora.getTime() - new Date(pago.fecha).getTime()) / UNA_HORA_MS;
  return transcurridas >= 0 && transcurridas < HORAS_PARA_ANULAR_PAGO;
}

/**
 * Convierte los movimientos marcados como hechos en pagos registrados
 * (especificación 5.4).
 *
 * Se usa al cerrar un plan, y también al cancelarlo: los movimientos ya
 * marcados **se mantienen** como pagos, porque esa plata efectivamente se
 * movió. Cancelar un plan descarta lo que falta, no lo que ya pasó.
 */
export function pagosDeMovimientos(
  movimientos: readonly Movimiento[],
  grupoId: string,
  generarId: () => string = () => crypto.randomUUID(),
): Pago[] {
  return movimientos
    .filter((m) => m.hecho)
    .map((m) => ({
      id: generarId(),
      grupoId,
      deudorId: m.deudorId,
      acreedorId: m.acreedorId,
      moneda: m.moneda,
      monto: m.monto,
      fecha: m.hechoEl ?? new Date().toISOString(),
      registradoPor: m.hechoPor ?? m.acreedorId,
      // Marcar un movimiento requiere que una de las dos partes lo haga, así que
      // no queda pendiente de confirmación como sí lo está un "ya pagué" suelto.
      confirmado: true,
    }));
}
