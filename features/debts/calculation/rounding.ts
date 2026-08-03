import type { UserId } from '@/types';

/**
 * Splitting integers without losing or inventing units.
 *
 * Saldito doesn't handle cents: amounts are integers (whole pesos in ARS,
 * whole dollars in USD). So every time money has to be divided among people
 * there's a remainder, and what matters is that the sum closes exactly
 * against the total. If it doesn't close, someone overpays due to a rounding
 * error.
 *
 * The spec (sections 2.1 to 2.3) defines two different criteria to assign
 * that remainder, and they are not interchangeable:
 *
 * - **In list order**, when the split is in equal parts. All the pieces are
 *   worth the same, so there's nothing to break a tie on: the first ones in
 *   the list get an extra unit.
 * - **By largest fractional part**, when the split is proportional
 *   (percentages, or unequal contributions). Here there is a fair criterion:
 *   the unit goes to whoever was closest to deserving it.
 *
 * Implementation note: the accumulators are `Map` and only get converted to
 * an object at the end with `Object.fromEntries`. With a plain object, an id
 * called `valueOf` or `__proto__` would be read through the prototype
 * chain —`out[id] ?? 0` would return a function instead of zero— and the
 * split would end up wrong. `Object.fromEntries` defines own properties, so
 * the result is a normal, safe object.
 */

/** An integer amount assigned to a person. */
export type Allocation = Record<UserId, number>;

/**
 * Reads an amount from a user-provided record, ignoring anything that isn't
 * its own, numeric property.
 */
export function amountOf(record: Readonly<Record<string, number>> | undefined, id: UserId): number {
  if (!record || !Object.hasOwn(record, id)) return 0;
  const value = record[id];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Divides `total` into equal parts among `ids`. The remainder is assigned one
 * unit at a time, in list order.
 *
 * The sum of the result is exactly `total`.
 */
export function splitEqually(total: number, ids: readonly UserId[]): Allocation {
  if (ids.length === 0) return {};

  const base = Math.floor(total / ids.length);
  const remainder = total - base * ids.length;

  const out = new Map<UserId, number>();
  ids.forEach((id, i) => {
    // `id` can repeat if the caller passes duplicates: we accumulate instead
    // of overwriting, so the sum keeps closing.
    out.set(id, (out.get(id) ?? 0) + base + (i < remainder ? 1 : 0));
  });
  return Object.fromEntries(out);
}

/**
 * Divides `total` among the people in `weights`, in proportion to their
 * weight. The remainder is assigned one unit at a time, starting with
 * whoever ended up with the largest fractional part.
 *
 * The sum of the result is exactly `total`, regardless of the scale of the
 * weights: they are normalized against their own sum. If all weights are
 * zero (or the list is empty) there's no possible proportional criterion and
 * it falls back to equal parts, which is the only thing that keeps the sum
 * exact.
 */
export function splitProportionally(
  total: number,
  weights: readonly { id: UserId; weight: number }[],
): Allocation {
  if (weights.length === 0) return {};

  const totalWeight = weights.reduce((acc, p) => acc + p.weight, 0);
  if (totalWeight <= 0) {
    return splitEqually(
      total,
      weights.map((p) => p.id),
    );
  }

  const out = new Map<UserId, number>();
  let assigned = 0;
  const fractions: { id: UserId; fraction: number }[] = [];

  for (const { id, weight } of weights) {
    const exact = (total * weight) / totalWeight;
    const floor = Math.floor(exact);
    out.set(id, (out.get(id) ?? 0) + floor);
    assigned += floor;
    fractions.push({ id, fraction: exact - floor });
  }

  // Stable order: on a fractional-part tie, whoever comes first in the list
  // wins. Without this the result would depend on the engine's sort and the
  // tests would be flaky.
  fractions.sort((a, b) => b.fraction - a.fraction);

  let remainder = total - assigned;
  for (let i = 0; i < fractions.length && remainder > 0; i++) {
    const id = fractions[i].id;
    out.set(id, (out.get(id) ?? 0) + 1);
    remainder--;
  }
  return Object.fromEntries(out);
}

/** Grid of integers `row → column → amount`. Internal to the calculation module. */
export type Matrix = Record<UserId, Record<UserId, number>>;

/**
 * Splits a matrix of integers respecting **both margins at once**: each row
 * sums exactly its total and so does each column.
 *
 * This is needed to attribute debt when an expense had several payers. There
 * the rows are the participants (each one owes `split[q]`) and the columns
 * are the payers (each one is owed `paidIn[p]`). A person's net balance is
 * exactly `their column − their row`, so if the columns don't close exactly,
 * the group's balance stops adding to zero.
 *
 * Rounding row by row —which is what the spec's pseudocode suggests— only
 * guarantees the rows. With two people who put in and consume the same
 * amount, fractional-part ties always resolve in favor of the first in the
 * list, and a debt of one unit appears that doesn't actually exist. That's
 * why the split is done in two steps:
 *
 * 1. Floor of each cell, and each row's remainder by largest fractional
 *    part. Rows end up exact.
 * 2. Column correction: while one column is above its total and another is
 *    below, a unit is moved between them **within the same row**, which is
 *    what keeps the rows already adjusted in step 1 intact.
 *
 * Step 2 can always proceed: a column that's above its total has a sum
 * greater than zero, so at least one of its cells is worth at least one.
 */
export function splitMatrix(
  rows: readonly { id: UserId; total: number }[],
  columns: readonly { id: UserId; total: number }[],
): Matrix {
  if (rows.length === 0 || columns.length === 0) return {};

  const total = columns.reduce((acc, c) => acc + c.total, 0);
  if (total <= 0) {
    return Object.fromEntries(
      rows.map((f) => [f.id, Object.fromEntries(columns.map((c) => [c.id, 0]))]),
    );
  }

  // Step 1: floor per cell, and each row's remainder by largest fractional part.
  const cells = rows.map((f) => columns.map((c) => Math.floor((f.total * c.total) / total)));

  rows.forEach((f, i) => {
    const fractions = columns
      .map((c, j) => {
        const exact = (f.total * c.total) / total;
        return { j, fraction: exact - Math.floor(exact) };
      })
      .sort((a, b) => b.fraction - a.fraction);

    let remainder = f.total - cells[i].reduce((a, b) => a + b, 0);
    for (let k = 0; k < fractions.length && remainder > 0; k++) {
      cells[i][fractions[k].j] += 1;
      remainder--;
    }
  });

  // Step 2: correct the columns by moving units within the same row.
  const deviation = columns.map((c, j) => cells.reduce((acc, row) => acc + row[j], 0) - c.total);

  for (let over = 0; over < columns.length; over++) {
    while (deviation[over] > 0) {
      const under = deviation.findIndex((d) => d < 0);
      if (under === -1) break;

      const row = cells.findIndex((f) => f[over] >= 1);
      if (row === -1) break;

      cells[row][over] -= 1;
      cells[row][under] += 1;
      deviation[over] -= 1;
      deviation[under] += 1;
    }
  }

  return Object.fromEntries(
    rows.map((f, i) => [f.id, Object.fromEntries(columns.map((c, j) => [c.id, cells[i][j]]))]),
  );
}
