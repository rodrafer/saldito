import { CURRENCIES, type Balances, type CurrencyId, type Transfer, type UserId } from '@/types';

/** Id generator, injectable so tests are deterministic. */
export type GenerateId = () => string;

const defaultIdGenerator: GenerateId = () => crypto.randomUUID();

/**
 * Translates balances into the practical minimum of transfers (spec 2.6).
 *
 * Greedy pairing: whoever owes the most pays whoever is owed the most, until
 * no one is left in the red. It's not the theoretical optimum —finding it is
 * NP-hard and not worth it— but it produces at most `n − 1` transfers and is
 * the behavior the user already saw in the prototype.
 *
 * **Do not replace without asking:** the screen's copy promises "the
 * shortest path" and people compare the result against what they expected.
 *
 * Runs once per currency: ARS and USD are settled separately.
 */
export function deriveTransfers(
  balances: Readonly<Record<UserId, number>>,
  currency: CurrencyId,
  generateId: GenerateId = defaultIdGenerator,
): Transfer[] {
  // The half-unit threshold discards balances that the netting already
  // considered negligible, so as not to emit a $0 transfer.
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < -0.5)
    .map(([id, v]) => ({ id, remaining: -v }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0.5)
    .map(([id, v]) => ({ id, remaining: v }))
    .sort((a, b) => b.remaining - a.remaining);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].remaining, creditors[j].remaining);

    transfers.push({
      id: generateId(),
      debtorId: debtors[i].id,
      creditorId: creditors[j].id,
      currency,
      amount: Math.round(amount),
      done: false,
    });

    debtors[i].remaining -= amount;
    creditors[j].remaining -= amount;
    if (debtors[i].remaining < 0.5) i++;
    if (creditors[j].remaining < 0.5) j++;
  }

  return transfers;
}

/**
 * The transfers for all currencies, in a single plan.
 *
 * A plan can mix currencies (spec 5.5), but each one is resolved on its own:
 * a debt in dollars is never offset with one in pesos.
 */
export function deriveGroupTransfers(
  balances: Balances,
  generateId: GenerateId = defaultIdGenerator,
): Transfer[] {
  return CURRENCIES.flatMap((currency) =>
    deriveTransfers(balances[currency] ?? {}, currency, generateId),
  );
}
