/**
 * Núcleo de cálculo de Saldito — especificación funcional, sección 2.
 *
 * TypeScript puro: no importa nada de Next ni de Supabase. Corre idéntico en los
 * tests, en el servidor al renderizar y en el cliente para los updates
 * optimistas. Mantenerlo así.
 *
 * Las deudas y los saldos son **derivados**: se calculan desde los gastos
 * vigentes, nunca se persisten.
 */

export { contribucionesDeGasto } from './contribuciones';
export { repartoDeGasto } from './reparto';
export { deudasDeGasto, calcularDeudas, type MatrizDeuda } from './deudas';
export { calcularSaldos } from './saldos';
export { derivarMovimientos, derivarMovimientosDelGrupo, type GenerarId } from './movimientos';
export { puedeAnularPago, pagosDeMovimientos, HORAS_PARA_ANULAR_PAGO } from './pagos';
export type { Asignacion } from './redondeo';

// `redondeo.ts` no se re-exporta: repartir enteros preservando sumas es un
// detalle de cómo estos algoritmos evitan perder unidades, no algo que una
// pantalla deba llamar por su cuenta. Sus tests lo importan directo.
