import type { Expense } from '@/types';
import { amountOf, splitEqually, type Allocation } from './rounding';

/**
 * How much each payer actually put in (spec 2.1).
 *
 * The sum of the result is **exactly** `e.amount`. That invariant is what
 * holds up everything else: `debtsOfExpense` splits the debt in proportion
 * to these contributions, so if a unit is missing or extra here, the
 * group's net balance stops adding to zero.
 */
export function contributionsOfExpense(e: Expense): Allocation {
  const payers = Object.keys(e.contributions);
  if (payers.length === 0) return {};

  // Explicit amounts: already validated from the form (their sum has to
  // match the exact total, see spec 6.4).
  if (e.paymentMode === 'amounts') {
    return Object.fromEntries(payers.map((id) => [id, amountOf(e.contributions, id)]));
  }

  // Equal parts among the chosen payers.
  return splitEqually(e.amount, payers);
}
