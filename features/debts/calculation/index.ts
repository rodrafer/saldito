/**
 * Saldito's calculation core — functional spec, section 2.
 *
 * Pure TypeScript: doesn't import anything from Next or Supabase. Runs
 * identically in tests, on the server when rendering, and on the client for
 * optimistic updates. Keep it that way.
 *
 * Debts and balances are **derived**: calculated from current expenses,
 * never persisted.
 */

export { contributionsOfExpense } from './contributions';
export { splitOfExpense } from './split';
export { debtsOfExpense, calculateDebts, type DebtMatrix } from './debts';
export { calculateBalances } from './balances';
export { deriveTransfers, deriveGroupTransfers, type GenerateId } from './transfers';
export { canVoidPayment, paymentsFromTransfers, HOURS_TO_VOID_PAYMENT } from './payments';
export type { Allocation } from './rounding';

// `rounding.ts` isn't re-exported: splitting integers while preserving sums
// is a detail of how these algorithms avoid losing units, not something a
// screen should call on its own. Its tests import it directly.
