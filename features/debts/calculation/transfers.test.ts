import { describe, expect, it } from 'vitest';
import { deriveTransfers, deriveGroupTransfers } from './transfers';

/** Predictable ids, to be able to compare the full result. */
function sequentialIds() {
  let n = 0;
  return () => `m${n++}`;
}

describe('deriveTransfers', () => {
  it('resolves a simple case with a single payment', () => {
    expect(deriveTransfers({ ana: 500, beto: -500 }, 'ARS', sequentialIds())).toEqual([
      { id: 'm0', debtorId: 'beto', creditorId: 'ana', currency: 'ARS', amount: 500, done: false },
    ]);
  });

  it('whoever owes the most pays whoever is owed the most', () => {
    // Caro owes 800, Dani owes 200. Ana is owed 700, Beto 300.
    const transfers = deriveTransfers(
      { ana: 700, beto: 300, caro: -800, dani: -200 },
      'ARS',
      sequentialIds(),
    );

    expect(
      transfers.map(({ debtorId, creditorId, amount }) => ({ debtorId, creditorId, amount })),
    ).toEqual([
      { debtorId: 'caro', creditorId: 'ana', amount: 700 },
      { debtorId: 'caro', creditorId: 'beto', amount: 100 },
      { debtorId: 'dani', creditorId: 'beto', amount: 200 },
    ]);
  });

  it('produces no transfers when everyone is already even', () => {
    expect(deriveTransfers({ ana: 0, beto: 0 }, 'ARS', sequentialIds())).toEqual([]);
  });

  it('produces at most n − 1 transfers', () => {
    const transfers = deriveTransfers(
      { ana: 300, beto: 100, caro: -150, dani: -250 },
      'ARS',
      sequentialIds(),
    );

    expect(transfers.length).toBeLessThanOrEqual(3);
  });
});

describe('deriveGroupTransfers', () => {
  it('resolves each currency separately, without offsetting one against another', () => {
    const transfers = deriveGroupTransfers(
      {
        ARS: { ana: 1000, beto: -1000 },
        USD: { ana: -50, beto: 50 },
      },
      sequentialIds(),
    );

    expect(transfers).toHaveLength(2);
    expect(transfers.find((t) => t.currency === 'ARS')).toMatchObject({
      debtorId: 'beto',
      creditorId: 'ana',
      amount: 1000,
    });
    expect(transfers.find((t) => t.currency === 'USD')).toMatchObject({
      debtorId: 'ana',
      creditorId: 'beto',
      amount: 50,
    });
  });
});
