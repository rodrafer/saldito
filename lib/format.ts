import type { CurrencyId } from '@/types';

const SYMBOL: Record<CurrencyId, string> = { ARS: '$', USD: 'US$' };

/** Formats an amount with its currency symbol, es-AR style. */
export function formatAmount(amount: number, currency: CurrencyId = 'ARS'): string {
  return SYMBOL[currency] + Math.abs(amount).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

/** The amount with an explicit sign: used for balances and debts.
 *  The minus is U+2212, not a hyphen — it lines up with the digits. */
export function formatBalance(amount: number, currency: CurrencyId = 'ARS'): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
  return sign + formatAmount(amount, currency);
}

/** Avatar initials: a single uppercase letter. */
export function initial(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase();
}
