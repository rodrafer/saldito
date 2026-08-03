import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { splitEqually, splitMatrix, splitProportionally } from './rounding';
import { partition, sum } from '@/tests/factories';

describe('splitEqually', () => {
  it('divides exactly when the amount is a multiple of the number of people', () => {
    expect(splitEqually(900, ['ana', 'beto', 'caro'])).toEqual({
      ana: 300,
      beto: 300,
      caro: 300,
    });
  });

  it('assigns the remainder one unit at a time, in list order', () => {
    // 1000 / 3 = 333.33: 1 is left over, and it goes to the first in the list.
    expect(splitEqually(1000, ['ana', 'beto', 'caro'])).toEqual({
      ana: 334,
      beto: 333,
      caro: 333,
    });
  });

  it('returns empty with no people, instead of dividing by zero', () => {
    expect(splitEqually(1000, [])).toEqual({});
  });

  it('the sum always closes exactly against the total', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 8 }),
        (total, ids) => {
          expect(sum(splitEqually(total, ids))).toBe(total);
        },
      ),
    );
  });

  it('no one gets more than a one-unit difference from another', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 8 }),
        (total, ids) => {
          const parts = Object.values(splitEqually(total, ids));
          expect(Math.max(...parts) - Math.min(...parts)).toBeLessThanOrEqual(1);
        },
      ),
    );
  });
});

describe('splitProportionally', () => {
  it('splits according to each one’s weight', () => {
    expect(
      splitProportionally(1000, [
        { id: 'ana', weight: 75 },
        { id: 'beto', weight: 25 },
      ]),
    ).toEqual({ ana: 750, beto: 250 });
  });

  it('gives the remainder to whoever had the largest fractional part', () => {
    // 100 split into three equal parts: 33.33 each. They all tie on
    // fractional part, so the first one wins by stable order.
    const out = splitProportionally(100, [
      { id: 'ana', weight: 1 },
      { id: 'beto', weight: 1 },
      { id: 'caro', weight: 1 },
    ]);
    expect(out).toEqual({ ana: 34, beto: 33, caro: 33 });
  });

  it('is indifferent to the scale of the weights', () => {
    const withPercentages = splitProportionally(7777, [
      { id: 'ana', weight: 30 },
      { id: 'beto', weight: 70 },
    ]);
    const withAmounts = splitProportionally(7777, [
      { id: 'ana', weight: 3000 },
      { id: 'beto', weight: 7000 },
    ]);
    expect(withPercentages).toEqual(withAmounts);
  });

  it('falls back to equal parts when all weights are zero', () => {
    expect(
      splitProportionally(10, [
        { id: 'ana', weight: 0 },
        { id: 'beto', weight: 0 },
      ]),
    ).toEqual({ ana: 5, beto: 5 });
  });

  it('whoever has zero weight receives nothing', () => {
    const out = splitProportionally(1000, [
      { id: 'ana', weight: 100 },
      { id: 'beto', weight: 0 },
    ]);
    expect(out).toEqual({ ana: 1000, beto: 0 });
  });

  it('the sum always closes exactly against the total', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 8 }),
        fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 8, maxLength: 8 }),
        (total, ids, rawWeights) => {
          const weights = ids.map((id, i) => ({ id, weight: rawWeights[i] ?? 0 }));
          expect(sum(splitProportionally(total, weights))).toBe(total);
        },
      ),
    );
  });

  it('never assigns negative amounts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 6 }),
        fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 6, maxLength: 6 }),
        (total, ids, rawWeights) => {
          const weights = ids.map((id, i) => ({ id, weight: rawWeights[i] ?? 0 }));
          for (const amount of Object.values(splitProportionally(total, weights))) {
            expect(amount).toBeGreaterThanOrEqual(0);
          }
        },
      ),
    );
  });
});

describe('splitMatrix', () => {
  it('splits proportionally when the division is exact', () => {
    const m = splitMatrix(
      [
        { id: 'p1', total: 600 },
        { id: 'p2', total: 400 },
      ],
      [
        { id: 'c1', total: 500 },
        { id: 'c2', total: 500 },
      ],
    );

    expect(m).toEqual({
      p1: { c1: 300, c2: 300 },
      p2: { c1: 200, c2: 200 },
    });
  });

  it('keeps the columns exact even with rounding ties', () => {
    // The case that broke the invariant: two people who put in and consume
    // the same amount. Rounding row by row produced a debt of one unit.
    const m = splitMatrix(
      [
        { id: 'caro', total: 1 },
        { id: 'dani', total: 1 },
      ],
      [
        { id: 'caro', total: 1 },
        { id: 'dani', total: 1 },
      ],
    );

    expect(m.caro.caro + m.dani.caro).toBe(1); // caro's column
    expect(m.caro.dani + m.dani.dani).toBe(1); // dani's column
  });

  it('a column with a zero total receives nothing', () => {
    const m = splitMatrix(
      [{ id: 'p1', total: 100 }],
      [
        { id: 'c1', total: 100 },
        { id: 'c2', total: 0 },
      ],
    );

    expect(m.p1).toEqual({ c1: 100, c2: 0 });
  });

  it('rows and columns close exactly against their totals', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.array(fc.double({ min: 0, max: 0.999, noNaN: true }), { minLength: 5, maxLength: 5 }),
        fc.array(fc.double({ min: 0, max: 0.999, noNaN: true }), { minLength: 5, maxLength: 5 }),
        (total, nRows, nColumns, rowCuts, columnCuts) => {
          const rows = partition(total, nRows, rowCuts).map((t, i) => ({
            id: `f${i}`,
            total: t,
          }));
          const columns = partition(total, nColumns, columnCuts).map((t, j) => ({
            id: `c${j}`,
            total: t,
          }));

          const m = splitMatrix(rows, columns);

          for (const f of rows) {
            expect(sum(m[f.id])).toBe(f.total);
          }
          for (const c of columns) {
            const column = rows.reduce((acc, f) => acc + m[f.id][c.id], 0);
            expect(column).toBe(c.total);
          }
        },
      ),
    );
  });

  it('never produces negative cells', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.array(fc.double({ min: 0, max: 0.999, noNaN: true }), { minLength: 5, maxLength: 5 }),
        fc.array(fc.double({ min: 0, max: 0.999, noNaN: true }), { minLength: 5, maxLength: 5 }),
        (total, nRows, nColumns, rowCuts, columnCuts) => {
          const rows = partition(total, nRows, rowCuts).map((t, i) => ({
            id: `f${i}`,
            total: t,
          }));
          const columns = partition(total, nColumns, columnCuts).map((t, j) => ({
            id: `c${j}`,
            total: t,
          }));

          for (const row of Object.values(splitMatrix(rows, columns))) {
            for (const cell of Object.values(row)) {
              expect(cell).toBeGreaterThanOrEqual(0);
            }
          }
        },
      ),
    );
  });
});
