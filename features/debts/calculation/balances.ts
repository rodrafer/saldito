import {
  CURRENCIES,
  type Balances,
  type CurrencyId,
  type Debt,
  type Group,
  type Member,
  type UserId,
} from '@/types';

/**
 * Net balance of each member, split by currency (spec 2.5).
 *
 * Positive = owed to them. Negative = they owe. This is what the Dashboard
 * shows and what the settlement plan consumes to build the transfers.
 *
 * Invariants (covered by tests):
 * 1. For each currency, the sum of all balances in the group is **zero**.
 * 2. Each person's balance matches `paid in − consumed` calculated directly
 *    from the expenses. If the two paths don't match, there's a rounding bug
 *    in the proportional attribution of `debtsOfExpense`.
 */
export function calculateBalances(
  debts: readonly Debt[],
  group: Group,
  members: readonly Member[],
): Balances {
  const acc = new Map<CurrencyId, Map<UserId, number>>(CURRENCIES.map((c) => [c, new Map()]));

  for (const currency of CURRENCIES) {
    for (const member of members) {
      if (member.groupId !== group.id) continue;
      acc.get(currency)?.set(member.userId, 0);
    }
  }

  for (const d of debts) {
    const byCurrency = acc.get(d.currency);
    if (!byCurrency) continue;
    byCurrency.set(d.debtorId, (byCurrency.get(d.debtorId) ?? 0) - d.amount);
    byCurrency.set(d.creditorId, (byCurrency.get(d.creditorId) ?? 0) + d.amount);
  }

  return {
    ARS: Object.fromEntries(acc.get('ARS') ?? []),
    USD: Object.fromEntries(acc.get('USD') ?? []),
  };
}
