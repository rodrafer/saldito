import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { CURRENCIES, type Expense, type CurrencyId } from '@/types';
import { contributionsOfExpense } from './contributions';
import { splitOfExpense } from './split';
import { calculateDebts } from './debts';
import { calculateBalances } from './balances';
import { deriveTransfers } from './transfers';
import { GROUP_ID, group, members, partition, directBalance, sum } from '@/tests/factories';

/**
 * Invariants of the calculation core.
 *
 * The spec calls these out as the system's best safety net: if one breaks,
 * there's a rounding bug in the proportional attribution and someone ends up
 * overpaying. They're verified with property testing over randomly generated
 * expenses, because the cases that fail are exactly the ones you wouldn't
 * think to write by hand.
 */

const PEOPLE = ['ana', 'beto', 'caro', 'dani'] as const;
const HOUSE = group();
const MEMBERS = members([...PEOPLE]);

/** Non-empty subset of people, preserving order. */
const subset = fc
  .array(fc.boolean(), { minLength: PEOPLE.length, maxLength: PEOPLE.length })
  .map((flags) => {
    const chosen = PEOPLE.filter((_, i) => flags[i]);
    return chosen.length > 0 ? [...chosen] : [PEOPLE[0]];
  });

const cuts = fc.array(fc.double({ min: 0, max: 0.999, noNaN: true }), {
  minLength: PEOPLE.length,
  maxLength: PEOPLE.length,
});

/** Generates a valid expense according to the integrity rules of section 1.2. */
const arbitraryExpense = fc
  .record({
    id: fc.string({ minLength: 1, maxLength: 6 }),
    amount: fc.integer({ min: 1, max: 5_000_000 }),
    currency: fc.constantFrom<CurrencyId>(...CURRENCIES),
    payers: subset,
    participants: subset,
    paymentMode: fc.constantFrom('equal' as const, 'amounts' as const),
    splitMode: fc.constantFrom('equal' as const, 'percentage' as const, 'amounts' as const),
    paymentCuts: cuts,
    splitCuts: cuts,
  })
  .map(
    ({
      id,
      amount,
      currency,
      payers,
      participants,
      paymentMode,
      splitMode,
      paymentCuts,
      splitCuts,
    }): Expense => {
      const paymentAmounts = partition(amount, payers.length, paymentCuts);
      const contributions = Object.fromEntries(payers.map((p, i) => [p, paymentAmounts[i]]));

      let split: Record<string, number> | undefined;
      if (splitMode === 'amounts') {
        const parts = partition(amount, participants.length, splitCuts);
        split = Object.fromEntries(participants.map((p, i) => [p, parts[i]]));
      } else if (splitMode === 'percentage') {
        const parts = partition(100, participants.length, splitCuts);
        split = Object.fromEntries(participants.map((p, i) => [p, parts[i]]));
      }

      return {
        id,
        groupId: GROUP_ID,
        title: 'Expense',
        categoryId: 'c1',
        currency,
        amount,
        date: '2026-06-01T12:00:00.000Z',
        paymentMode,
        contributions,
        splitMode,
        participants,
        split,
        voided: false,
        history: [],
      };
    },
  );

const arbitraryExpenses = fc.array(arbitraryExpense, { minLength: 1, maxLength: 12 });

describe('per-expense invariants', () => {
  it('contributions sum to exactly the amount', () => {
    fc.assert(
      fc.property(arbitraryExpense, (e) => {
        expect(sum(contributionsOfExpense(e))).toBe(e.amount);
      }),
    );
  });

  it('the split sums to exactly the amount', () => {
    fc.assert(
      fc.property(arbitraryExpense, (e) => {
        expect(sum(splitOfExpense(e))).toBe(e.amount);
      }),
    );
  });

  it('no one receives or owes a negative amount', () => {
    fc.assert(
      fc.property(arbitraryExpense, (e) => {
        for (const amount of Object.values(contributionsOfExpense(e))) {
          expect(amount).toBeGreaterThanOrEqual(0);
        }
        for (const amount of Object.values(splitOfExpense(e))) {
          expect(amount).toBeGreaterThanOrEqual(0);
        }
      }),
    );
  });

  it('all amounts are integers: fractional money is never split', () => {
    fc.assert(
      fc.property(arbitraryExpense, (e) => {
        for (const amount of Object.values(splitOfExpense(e))) {
          expect(Number.isInteger(amount)).toBe(true);
        }
      }),
    );
  });
});

describe('group invariants', () => {
  it('per currency, the sum of all balances in the group is zero', () => {
    fc.assert(
      fc.property(arbitraryExpenses, (expenses) => {
        const debts = calculateDebts(expenses, [], HOUSE, MEMBERS);
        const balances = calculateBalances(debts, HOUSE, MEMBERS);

        for (const currency of CURRENCIES) {
          expect(sum(balances[currency])).toBe(0);
        }
      }),
    );
  });

  it('each person’s balance matches paid in − consumed', () => {
    // This is the invariant the spec marks as the most important: it
    // contrasts the long path (debt by pair, with its proportional rounding)
    // against the direct calculation from the expenses. If they differ,
    // debtsOfExpense's rounding is losing or inventing units.
    fc.assert(
      fc.property(arbitraryExpenses, (expenses) => {
        const debts = calculateDebts(expenses, [], HOUSE, MEMBERS);
        const balances = calculateBalances(debts, HOUSE, MEMBERS);

        for (const currency of CURRENCIES) {
          for (const person of PEOPLE) {
            expect(balances[currency][person]).toBe(
              directBalance(expenses, currency, person, contributionsOfExpense, splitOfExpense),
            );
          }
        }
      }),
    );
  });

  it('each person’s balance matches the sum of their debts by pair', () => {
    fc.assert(
      fc.property(arbitraryExpenses, (expenses) => {
        const debts = calculateDebts(expenses, [], HOUSE, MEMBERS);
        const balances = calculateBalances(debts, HOUSE, MEMBERS);

        for (const currency of CURRENCIES) {
          for (const person of PEOPLE) {
            const byPair = debts
              .filter((d) => d.currency === currency)
              .reduce((acc, d) => {
                if (d.creditorId === person) return acc + d.amount;
                if (d.debtorId === person) return acc - d.amount;
                return acc;
              }, 0);

            expect(balances[currency][person]).toBe(byPair);
          }
        }
      }),
    );
  });

  it('a debt never ends up with a negative amount or debtor equal to creditor', () => {
    fc.assert(
      fc.property(arbitraryExpenses, (expenses) => {
        for (const d of calculateDebts(expenses, [], HOUSE, MEMBERS)) {
          expect(d.amount).toBeGreaterThan(0);
          expect(d.debtorId).not.toBe(d.creditorId);
        }
      }),
    );
  });
});

describe('settlement plan invariants', () => {
  it('the transfers settle each person exactly', () => {
    fc.assert(
      fc.property(arbitraryExpenses, (expenses) => {
        const debts = calculateDebts(expenses, [], HOUSE, MEMBERS);
        const balances = calculateBalances(debts, HOUSE, MEMBERS);

        for (const currency of CURRENCIES) {
          let n = 0;
          const transfers = deriveTransfers(balances[currency], currency, () => `m${n++}`);

          const effect: Record<string, number> = {};
          for (const person of PEOPLE) effect[person] = 0;
          for (const t of transfers) {
            effect[t.debtorId] += t.amount;
            effect[t.creditorId] -= t.amount;
          }

          for (const person of PEOPLE) {
            expect(balances[currency][person] + effect[person]).toBe(0);
          }
        }
      }),
    );
  });

  it('produces at most n − 1 transfers per currency', () => {
    fc.assert(
      fc.property(arbitraryExpenses, (expenses) => {
        const debts = calculateDebts(expenses, [], HOUSE, MEMBERS);
        const balances = calculateBalances(debts, HOUSE, MEMBERS);

        for (const currency of CURRENCIES) {
          let n = 0;
          const transfers = deriveTransfers(balances[currency], currency, () => `m${n++}`);
          expect(transfers.length).toBeLessThanOrEqual(PEOPLE.length - 1);
        }
      }),
    );
  });

  it('no one ends up paying themselves', () => {
    fc.assert(
      fc.property(arbitraryExpenses, (expenses) => {
        const debts = calculateDebts(expenses, [], HOUSE, MEMBERS);
        const balances = calculateBalances(debts, HOUSE, MEMBERS);

        for (const currency of CURRENCIES) {
          let n = 0;
          for (const t of deriveTransfers(balances[currency], currency, () => `m${n++}`)) {
            expect(t.debtorId).not.toBe(t.creditorId);
            expect(t.amount).toBeGreaterThan(0);
          }
        }
      }),
    );
  });
});
