import type { Expense, Group, Member, CurrencyId, Payment, UserId } from '@/types';

export const GROUP_ID = 'g1';

export function group(over: Partial<Group> = {}): Group {
  return {
    id: GROUP_ID,
    name: 'Casa',
    createdBy: 'ana',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

export function members(ids: readonly UserId[], groupId = GROUP_ID): Member[] {
  return ids.map((userId, i) => ({
    userId,
    groupId,
    role: i === 0 ? 'admin' : 'member',
    active: true,
  }));
}

let seq = 0;

export function expense(over: Partial<Expense> = {}): Expense {
  seq += 1;
  return {
    id: `expense-${seq}`,
    groupId: GROUP_ID,
    title: 'Expense',
    categoryId: 'c1',
    currency: 'ARS',
    amount: 1000,
    date: '2026-06-01T12:00:00.000Z',
    paymentMode: 'equal',
    contributions: { ana: 1000 },
    splitMode: 'equal',
    participants: ['ana'],
    voided: false,
    history: [],
    ...over,
  };
}

export function payment(over: Partial<Payment> = {}): Payment {
  seq += 1;
  return {
    id: `payment-${seq}`,
    groupId: GROUP_ID,
    debtorId: 'beto',
    creditorId: 'ana',
    currency: 'ARS',
    amount: 100,
    date: '2026-06-02T12:00:00.000Z',
    recordedBy: 'ana',
    confirmed: true,
    ...over,
  };
}

/**
 * Splits `total` into `n` non-negative integers that sum to exactly `total`.
 *
 * Uses cuts along a segment, deliberately: it's an algorithm **independent**
 * of the production one. If we generated the partitions with
 * `splitProportionally` the tests would be validating the code against
 * itself.
 */
export function partition(total: number, n: number, rawCuts: readonly number[]): number[] {
  if (n <= 0) return [];
  if (n === 1) return [total];

  const cuts = rawCuts
    .slice(0, n - 1)
    .map((c) => Math.floor(c * total))
    .sort((a, b) => a - b);

  while (cuts.length < n - 1) cuts.push(total);

  const points = [0, ...cuts, total];
  return Array.from({ length: n }, (_, i) => points[i + 1] - points[i]);
}

/** Sum of the values of an allocation. */
export function sum(allocation: Record<string, number>): number {
  return Object.values(allocation).reduce((a, b) => a + b, 0);
}

/**
 * A person's balance calculated directly from the expenses: what they put in
 * minus what they consumed. It's the second calculation path that
 * `calculateBalances`'s result is contrasted against.
 */
export function directBalance(
  expenses: readonly Expense[],
  currency: CurrencyId,
  userId: UserId,
  contributionsOfExpense: (e: Expense) => Record<string, number>,
  splitOfExpense: (e: Expense) => Record<string, number>,
): number {
  return expenses
    .filter((e) => e.currency === currency && !e.voided && !e.draft)
    .reduce(
      (acc, e) => acc + (contributionsOfExpense(e)[userId] ?? 0) - (splitOfExpense(e)[userId] ?? 0),
      0,
    );
}
