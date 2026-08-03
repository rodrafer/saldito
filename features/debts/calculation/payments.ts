import type { Payment, Transfer, UserId } from '@/types';

/** Window to void a just-recorded payment (spec 2.7). */
export const HOURS_TO_VOID_PAYMENT = 24;

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Whether a payment can still be voided (spec 2.7).
 *
 * Only whoever recorded it can void it, and only within 24hs. Past that
 * window the payment is a done deal: the only way to reverse it is to record
 * an inverse payment, which is recorded as such.
 */
export function canVoidPayment(payment: Payment, userId: UserId, now: Date = new Date()): boolean {
  if (payment.recordedBy !== userId) return false;

  const elapsed = (now.getTime() - new Date(payment.date).getTime()) / ONE_HOUR_MS;
  return elapsed >= 0 && elapsed < HOURS_TO_VOID_PAYMENT;
}

/**
 * Converts transfers marked as done into recorded payments (spec 5.4).
 *
 * Used when closing a plan, and also when cancelling it: transfers already
 * marked **stay** as payments, because that money actually moved. Cancelling
 * a plan discards what's pending, not what already happened.
 */
export function paymentsFromTransfers(
  transfers: readonly Transfer[],
  groupId: string,
  generateId: () => string = () => crypto.randomUUID(),
): Payment[] {
  return transfers
    .filter((t) => t.done)
    .map((t) => ({
      id: generateId(),
      groupId,
      debtorId: t.debtorId,
      creditorId: t.creditorId,
      currency: t.currency,
      amount: t.amount,
      date: t.doneAt ?? new Date().toISOString(),
      recordedBy: t.doneBy ?? t.creditorId,
      // Marking a transfer requires one of the two parties to do it, so it
      // doesn't stay pending confirmation the way a loose "already paid" does.
      confirmed: true,
    }));
}
