import type { MonedaId } from '@/types';

const SIMBOLO: Record<MonedaId, string> = { ARS: '$', USD: 'US$' };

/** Formatea un monto con el símbolo de la moneda, en formato es-AR. */
export function formatearMonto(monto: number, moneda: MonedaId = 'ARS'): string {
  return SIMBOLO[moneda] + Math.abs(monto).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

/** Devuelve el monto con signo explícito: usado en saldos y deudas. */
export function formatearSaldo(monto: number, moneda: MonedaId = 'ARS'): string {
  const signo = monto > 0 ? '+' : monto < 0 ? '−' : '';
  return signo + formatearMonto(monto, moneda);
}

/** Iniciales para avatares: una sola letra, en mayúscula. */
export function inicial(nombre: string): string {
  return (nombre.trim()[0] ?? '?').toUpperCase();
}
