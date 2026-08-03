import type { Expense } from '@/types';
import { amountOf, splitEqually, splitProportionally, type Allocation } from './rounding';

/**
 * How much each participant owes to pay (spec 2.2).
 *
 * The sum of the result is **exactly** `e.amount`.
 *
 * The three modes come from the new-expense form:
 * - `equal`: the total is split into equal parts among the participants.
 * - `percentage`: each one carries their percentage; validation requires them to add up to 100.
 * - `amounts`: each one carries their explicit amount; validation requires them to add up to the total.
 */
export function splitOfExpense(e: Expense): Allocation {
  const { participants, amount, splitMode, split } = e;
  if (participants.length === 0) return {};

  if (splitMode === 'amounts' && split) {
    return Object.fromEntries(participants.map((id) => [id, amountOf(split, id)]));
  }

  if (splitMode === 'percentage' && split) {
    // Split proportional to the percentages instead of calculating each one
    // against 100. If the percentages added up to something other than
    // 100 —shouldn't happen, but we don't want old data to break the
    // group's balance— the proportional split still closes exactly against
    // the amount.
    return splitProportionally(
      amount,
      participants.map((id) => ({ id, weight: amountOf(split, id) })),
    );
  }

  return splitEqually(amount, participants);
}
