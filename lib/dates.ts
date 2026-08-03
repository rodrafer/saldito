/** Time buckets to group recent activity (spec 6.2). */
export type TimeBucket = 'today' | 'thisWeek' | 'before';

export const TIME_BUCKET_LABEL: Record<TimeBucket, string> = {
  today: 'Hoy',
  thisWeek: 'Esta semana',
  before: 'Antes',
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function atMidnight(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/**
 * Which bucket a date falls into relative to `now`.
 *
 * Compared by calendar day, not by hour difference: an expense from
 * yesterday at 23:00 has to say "Esta semana" even though barely two hours
 * have passed. "Esta semana" is the last 7 days, not the running week.
 */
export function timeBucketOf(date: string | Date, now: Date = new Date()): TimeBucket {
  const day = atMidnight(new Date(date));
  const today = atMidnight(now);
  const daysAgo = Math.round((today.getTime() - day.getTime()) / ONE_DAY_MS);

  if (daysAgo <= 0) return 'today';
  if (daysAgo < 7) return 'thisWeek';
  return 'before';
}

/**
 * Groups items by bucket, preserving entry order within each one and
 * discarding empty buckets.
 */
export function groupByTimeBucket<T>(
  items: readonly T[],
  dateOf: (item: T) => string | Date,
  now: Date = new Date(),
): { bucket: TimeBucket; label: string; items: T[] }[] {
  const groups: Record<TimeBucket, T[]> = { today: [], thisWeek: [], before: [] };
  for (const item of items) groups[timeBucketOf(dateOf(item), now)].push(item);

  return (['today', 'thisWeek', 'before'] as const)
    .filter((b) => groups[b].length > 0)
    .map((b) => ({ bucket: b, label: TIME_BUCKET_LABEL[b], items: groups[b] }));
}
