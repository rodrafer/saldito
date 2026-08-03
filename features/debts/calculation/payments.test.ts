import { describe, expect, it } from 'vitest';
import { paymentsFromTransfers, canVoidPayment } from './payments';
import { payment } from '@/tests/factories';
import type { Transfer } from '@/types';

const RECORDED = '2026-07-10T12:00:00.000Z';

describe('canVoidPayment', () => {
  const p = payment({ date: RECORDED, recordedBy: 'ana' });

  it('whoever recorded it can void it, within 24hs', () => {
    expect(canVoidPayment(p, 'ana', new Date('2026-07-10T20:00:00.000Z'))).toBe(true);
  });

  it('another person can not void it', () => {
    expect(canVoidPayment(p, 'beto', new Date('2026-07-10T20:00:00.000Z'))).toBe(false);
  });

  it('past 24hs it can no longer be done', () => {
    expect(canVoidPayment(p, 'ana', new Date('2026-07-11T12:00:01.000Z'))).toBe(false);
  });

  it('right at the 24hs limit it can no longer be done', () => {
    expect(canVoidPayment(p, 'ana', new Date('2026-07-11T12:00:00.000Z'))).toBe(false);
  });
});

describe('paymentsFromTransfers', () => {
  const transfers: Transfer[] = [
    {
      id: 'm1',
      debtorId: 'beto',
      creditorId: 'ana',
      currency: 'ARS',
      amount: 500,
      done: true,
      doneBy: 'ana',
      doneAt: RECORDED,
    },
    { id: 'm2', debtorId: 'caro', creditorId: 'ana', currency: 'ARS', amount: 300, done: false },
  ];

  it('only converts the transfers marked as done', () => {
    const payments = paymentsFromTransfers(transfers, 'g1', () => 'p1');

    expect(payments).toEqual([
      {
        id: 'p1',
        groupId: 'g1',
        debtorId: 'beto',
        creditorId: 'ana',
        currency: 'ARS',
        amount: 500,
        date: RECORDED,
        recordedBy: 'ana',
        confirmed: true,
      },
    ]);
  });

  it('payments from a plan are left confirmed: one of the two parties marked them', () => {
    const payments = paymentsFromTransfers(transfers, 'g1', () => 'p1');
    expect(payments[0].confirmed).toBe(true);
  });
});
