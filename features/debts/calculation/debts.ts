import {
  CURRENCIES,
  type Debt,
  type Expense,
  type Group,
  type Member,
  type CurrencyId,
  type Payment,
  type UserId,
} from '@/types';
import { contributionsOfExpense } from './contributions';
import { splitOfExpense } from './split';
import { amountOf, splitMatrix } from './rounding';

/** Matrix `debtor → creditor → amount` within a single expense. */
export type DebtMatrix = Record<UserId, Record<UserId, number>>;

/**
 * Debts an expense generates, person against person (spec 2.3).
 *
 * When an expense had several payers, each participant owes each payer **in
 * proportion to what that payer put in**. It's the attribution that respects
 * the economic fact —whoever put in more money has more to recover— without
 * inventing conventions, and it keeps the per-pair debt structure that the
 * Debts screen needs ("Rocío owes you $8,000", with its payment action).
 *
 * The portion someone owes to themselves is discarded: it cancels itself out.
 */
export function debtsOfExpense(e: Expense): DebtMatrix {
  if (e.amount <= 0) return {};

  const paidIn = contributionsOfExpense(e);
  const owed = splitOfExpense(e);
  const payers = Object.keys(paidIn);
  if (payers.length === 0) return {};

  // Rows: what each participant owes. Columns: what's owed to each payer.
  // Rounded preserving both margins, because a person's net balance is
  // exactly `their column − their row`: if the columns don't close against
  // what each one put in, the group's balances don't add to zero.
  const matrix = splitMatrix(
    e.participants.map((p) => ({ id: p, total: amountOf(owed, p) })),
    payers.map((q) => ({ id: q, total: amountOf(paidIn, q) })),
  );

  const out: DebtMatrix = {};

  for (const participant of e.participants) {
    for (const creditor of payers) {
      if (creditor === participant) continue; // own portion cancels itself out

      const amount = matrix[participant]?.[creditor] ?? 0;
      if (amount <= 0) continue;

      out[participant] ??= {};
      out[participant][creditor] = (out[participant][creditor] ?? 0) + amount;
    }
  }

  return out;
}

/** Accumulated `currency → debtor → creditor → amount`. */
type Accumulator = Map<UserId, Map<UserId, number>>;

function addTo(acc: Accumulator, debtor: UserId, creditor: UserId, amount: number) {
  let row = acc.get(debtor);
  if (!row) {
    row = new Map();
    acc.set(debtor, row);
  }
  row.set(creditor, (row.get(creditor) ?? 0) + amount);
}

function readFrom(acc: Accumulator, debtor: UserId, creditor: UserId): number {
  return acc.get(debtor)?.get(creditor) ?? 0;
}

/**
 * Current debts of the group, netted by pair and by currency (spec 2.4).
 *
 * Always derived from the expenses: there's no Debt entity and nothing is
 * persisted. If A owes 100 to B and B owes 30 to A, only one debt remains:
 * A owes 70 to B.
 *
 * ARS and USD are **never mixed**. Two people can have a debt in each
 * currency and they're settled separately (spec 1.3).
 *
 * `members` is received separately because `Group` doesn't contain them:
 * they're their own entity, just as in the database. All of them are taken,
 * **including the inactive ones**: a deactivated person still shows up in
 * history and can't leave the group with open debts, so their balances have
 * to keep counting.
 */
export function calculateDebts(
  expenses: readonly Expense[],
  payments: readonly Payment[],
  group: Group,
  members: readonly Member[],
): Debt[] {
  const current = expenses.filter((e) => e.groupId === group.id && !e.voided && !e.draft);

  const acc = new Map<CurrencyId, Accumulator>(CURRENCIES.map((c) => [c, new Map()]));
  // The expenses that originated each debt, to be able to show its detail.
  // Kept by currency: the same pair might owe money in ARS and in USD from
  // different expenses, and mixing the origins would show expenses that
  // don't correspond.
  const origin = new Map<CurrencyId, Map<UserId, Map<UserId, string[]>>>(
    CURRENCIES.map((c) => [c, new Map()]),
  );

  for (const e of current) {
    const matrix = debtsOfExpense(e);
    const accCurrency = acc.get(e.currency);
    const originCurrency = origin.get(e.currency);
    if (!accCurrency || !originCurrency) continue; // unknown currency: ignored

    for (const [debtor, row] of Object.entries(matrix)) {
      for (const [creditor, amount] of Object.entries(row)) {
        addTo(accCurrency, debtor, creditor, amount);

        let byCreditor = originCurrency.get(debtor);
        if (!byCreditor) {
          byCreditor = new Map();
          originCurrency.set(debtor, byCreditor);
        }
        byCreditor.set(creditor, [...(byCreditor.get(creditor) ?? []), e.id]);
      }
    }
  }

  // Recorded payments reduce the debtor's debt toward the creditor.
  // Payments declared by the debtor and not yet confirmed count too: they
  // reduce the debt just the same, and the creditor confirms them later
  // (spec 2.7).
  for (const payment of payments) {
    if (payment.groupId !== group.id) continue;
    const accCurrency = acc.get(payment.currency);
    if (!accCurrency) continue;
    addTo(accCurrency, payment.debtorId, payment.creditorId, -payment.amount);
  }

  const ids = members.filter((m) => m.groupId === group.id).map((m) => m.userId);
  const out: Debt[] = [];

  for (const currency of CURRENCIES) {
    const accCurrency = acc.get(currency);
    const originCurrency = origin.get(currency);
    if (!accCurrency || !originCurrency) continue;

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        const net = readFrom(accCurrency, a, b) - readFrom(accCurrency, b, a);

        // One-unit threshold: smaller differences are discarded so as not to
        // leave $1 phantom debts that nobody's going to pay. Since all
        // amounts are integers, in practice this only discards zero.
        if (Math.abs(net) < 1) continue;

        out.push({
          debtorId: net > 0 ? a : b,
          creditorId: net > 0 ? b : a,
          currency,
          amount: Math.round(Math.abs(net)),
          expenseIds: [
            ...new Set([
              ...(originCurrency.get(a)?.get(b) ?? []),
              ...(originCurrency.get(b)?.get(a) ?? []),
            ]),
          ],
        });
      }
    }
  }

  return out;
}
