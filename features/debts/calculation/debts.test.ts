import { describe, expect, it } from 'vitest';
import { calculateDebts, debtsOfExpense } from './debts';
import { calculateBalances } from './balances';
import { expense, group, members, payment } from '@/tests/factories';

const HOUSE = group();
const THREE = members(['ana', 'beto', 'caro']);

describe('debtsOfExpense', () => {
  it('with a single payer, each participant owes their part', () => {
    const e = expense({
      amount: 900,
      contributions: { ana: 900 },
      participants: ['ana', 'beto', 'caro'],
    });

    expect(debtsOfExpense(e)).toEqual({
      beto: { ana: 300 },
      caro: { ana: 300 },
    });
  });

  it('splits the debt among several payers, in proportion to what each one put in', () => {
    // Ana put in 600 and Beto 400. All three consume in equal parts.
    // Each participant owes each payer according to that 60/40 proportion.
    const e = expense({
      amount: 1000,
      paymentMode: 'amounts',
      contributions: { ana: 600, beto: 400 },
      participants: ['ana', 'beto', 'caro'],
    });

    expect(debtsOfExpense(e)).toEqual({
      // Ana consumes 334; her own portion (200) cancels itself out.
      ana: { beto: 134 },
      // Beto consumes 333; his own portion (133) cancels itself out.
      beto: { ana: 200 },
      caro: { ana: 200, beto: 133 },
    });
  });

  it('a payer who doesn’t participate still gets their share', () => {
    const e = expense({
      amount: 1000,
      contributions: { ana: 1000 },
      participants: ['beto', 'caro'],
    });

    expect(debtsOfExpense(e)).toEqual({
      beto: { ana: 500 },
      caro: { ana: 500 },
    });
  });

  it('returns the raw matrix: netting by pair is calculateDebts’s job', () => {
    // Each one put in exactly what they consumed, so the expense doesn't move
    // balances. But at the level of a single expense the two debts still
    // exist facing each other: they only cancel out when netting the pair in
    // calculateDebts.
    const e = expense({
      amount: 1000,
      paymentMode: 'amounts',
      contributions: { ana: 500, beto: 500 },
      splitMode: 'amounts',
      participants: ['ana', 'beto'],
      split: { ana: 500, beto: 500 },
    });

    expect(debtsOfExpense(e)).toEqual({
      ana: { beto: 250 },
      beto: { ana: 250 },
    });
    expect(calculateDebts([e], [], HOUSE, members(['ana', 'beto']))).toEqual([]);
  });

  it('whoever ends up with a zero split owes nothing', () => {
    const e = expense({
      amount: 1000,
      contributions: { ana: 1000 },
      splitMode: 'amounts',
      participants: ['ana', 'beto', 'caro'],
      split: { ana: 0, beto: 1000, caro: 0 },
    });

    expect(debtsOfExpense(e)).toEqual({ beto: { ana: 1000 } });
  });

  it('ignores an expense with no amount', () => {
    expect(debtsOfExpense(expense({ amount: 0 }))).toEqual({});
  });
});

describe('calculateDebts', () => {
  it('nets the crossed debts of the same pair into one', () => {
    const expenses = [
      expense({ amount: 200, contributions: { ana: 200 }, participants: ['beto'] }),
      expense({ amount: 60, contributions: { beto: 60 }, participants: ['ana'] }),
    ];

    const debts = calculateDebts(expenses, [], HOUSE, members(['ana', 'beto']));

    expect(debts).toEqual([
      {
        debtorId: 'beto',
        creditorId: 'ana',
        currency: 'ARS',
        amount: 140,
        expenseIds: expect.any(Array),
      },
    ]);
  });

  it('never mixes currencies: the same pair can owe in each one', () => {
    const expenses = [
      expense({
        currency: 'ARS',
        amount: 1000,
        contributions: { ana: 1000 },
        participants: ['beto'],
      }),
      expense({ currency: 'USD', amount: 80, contributions: { beto: 80 }, participants: ['ana'] }),
    ];

    const debts = calculateDebts(expenses, [], HOUSE, members(['ana', 'beto']));

    expect(debts).toHaveLength(2);
    expect(debts.find((d) => d.currency === 'ARS')).toMatchObject({
      debtorId: 'beto',
      creditorId: 'ana',
      amount: 1000,
    });
    expect(debts.find((d) => d.currency === 'USD')).toMatchObject({
      debtorId: 'ana',
      creditorId: 'beto',
      amount: 80,
    });
  });

  it('each debt only carries the expenses of its own currency', () => {
    const inPesos = expense({
      id: 'e-pesos',
      currency: 'ARS',
      amount: 1000,
      contributions: { ana: 1000 },
      participants: ['beto'],
    });
    const inDollars = expense({
      id: 'e-dolares',
      currency: 'USD',
      amount: 80,
      contributions: { beto: 80 },
      participants: ['ana'],
    });

    const debts = calculateDebts([inPesos, inDollars], [], HOUSE, members(['ana', 'beto']));

    expect(debts.find((d) => d.currency === 'ARS')?.expenseIds).toEqual(['e-pesos']);
    expect(debts.find((d) => d.currency === 'USD')?.expenseIds).toEqual(['e-dolares']);
  });

  it('recorded payments reduce the debt', () => {
    const expenses = [
      expense({ amount: 1000, contributions: { ana: 1000 }, participants: ['beto'] }),
    ];
    const payments = [payment({ debtorId: 'beto', creditorId: 'ana', amount: 400 })];

    const debts = calculateDebts(expenses, payments, HOUSE, members(['ana', 'beto']));

    expect(debts).toHaveLength(1);
    expect(debts[0]).toMatchObject({ debtorId: 'beto', creditorId: 'ana', amount: 600 });
  });

  it('a declared, unconfirmed payment also reduces the debt', () => {
    const expenses = [
      expense({ amount: 1000, contributions: { ana: 1000 }, participants: ['beto'] }),
    ];
    const payments = [payment({ amount: 1000, recordedBy: 'beto', confirmed: false })];

    expect(calculateDebts(expenses, payments, HOUSE, members(['ana', 'beto']))).toEqual([]);
  });

  it('excludes voided expenses and recurrence drafts', () => {
    const expenses = [
      expense({
        amount: 1000,
        contributions: { ana: 1000 },
        participants: ['beto'],
        voided: true,
      }),
      expense({
        amount: 500,
        contributions: { ana: 500 },
        participants: ['beto'],
        draft: true,
      }),
    ];

    expect(calculateDebts(expenses, [], HOUSE, members(['ana', 'beto']))).toEqual([]);
  });

  it('ignores expenses from other groups', () => {
    const expenses = [
      expense({
        groupId: 'other',
        amount: 1000,
        contributions: { ana: 1000 },
        participants: ['beto'],
      }),
    ];

    expect(calculateDebts(expenses, [], HOUSE, members(['ana', 'beto']))).toEqual([]);
  });

  it('keeps counting the debts of a deactivated member', () => {
    // No one leaves the group owing money: if their debts disappeared from
    // the calculation, the rule that blocks leaving would have nothing to
    // stop it with.
    const expenses = [
      expense({ amount: 1000, contributions: { ana: 1000 }, participants: ['beto'] }),
    ];
    const withInactive = members(['ana', 'beto']).map((m) =>
      m.userId === 'beto' ? { ...m, active: false, deactivatedAt: '2026-07-01T00:00:00.000Z' } : m,
    );

    const debts = calculateDebts(expenses, [], HOUSE, withInactive);

    expect(debts).toHaveLength(1);
    expect(debts[0]).toMatchObject({ debtorId: 'beto', amount: 1000 });
  });

  it('discards debts that fully cancel out', () => {
    const expenses = [
      expense({ amount: 500, contributions: { ana: 500 }, participants: ['beto'] }),
      expense({ amount: 500, contributions: { beto: 500 }, participants: ['ana'] }),
    ];

    expect(calculateDebts(expenses, [], HOUSE, members(['ana', 'beto']))).toEqual([]);
  });
});

describe('the example from spec 1.4', () => {
  // Ana puts in 600, Beto 400, and all three consume in equal parts.
  const e = expense({
    amount: 1000,
    paymentMode: 'amounts',
    contributions: { ana: 600, beto: 400 },
    participants: ['ana', 'beto', 'caro'],
  });

  it('the net balance matches paid in − consumed', () => {
    const debts = calculateDebts([e], [], HOUSE, THREE);
    const balances = calculateBalances(debts, HOUSE, THREE);

    // Ana put in 600 and consumed 334. Beto put in 400 and consumed 333.
    // Caro put in nothing and consumed 333.
    expect(balances.ARS).toEqual({ ana: 266, beto: 67, caro: -333 });
  });

  it('the group’s balances add up to zero', () => {
    const debts = calculateDebts([e], [], HOUSE, THREE);
    const balances = calculateBalances(debts, HOUSE, THREE);

    expect(Object.values(balances.ARS).reduce((a, b) => a + b, 0)).toBe(0);
  });
});
