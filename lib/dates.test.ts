import { describe, expect, it } from 'vitest';
import { groupByTimeBucket, timeBucketOf } from './dates';

const NOW = new Date('2026-07-15T10:00:00');

describe('timeBucketOf', () => {
  it('today’s stuff falls into "today", at any hour', () => {
    expect(timeBucketOf(new Date('2026-07-15T00:05:00'), NOW)).toBe('today');
    expect(timeBucketOf(new Date('2026-07-15T23:50:00'), NOW)).toBe('today');
  });

  it('yesterday late at night falls into "thisWeek", not "today"', () => {
    // Eleven hours passed, but it's a different calendar day: comparing by
    // hour difference would say "today" and would be confusing.
    expect(timeBucketOf(new Date('2026-07-14T23:00:00'), NOW)).toBe('thisWeek');
  });

  it('the last seven days are "thisWeek"', () => {
    expect(timeBucketOf(new Date('2026-07-09T12:00:00'), NOW)).toBe('thisWeek');
  });

  it('from the seventh day on it’s "before"', () => {
    expect(timeBucketOf(new Date('2026-07-08T12:00:00'), NOW)).toBe('before');
  });

  it('a future date counts as "today" instead of breaking', () => {
    expect(timeBucketOf(new Date('2026-07-20T12:00:00'), NOW)).toBe('today');
  });
});

describe('groupByTimeBucket', () => {
  it('groups in order and discards empty buckets', () => {
    const items = [
      { id: 'a', date: '2026-07-15T09:00:00' },
      { id: 'b', date: '2026-06-01T09:00:00' },
      { id: 'c', date: '2026-07-15T08:00:00' },
    ];

    expect(groupByTimeBucket(items, (i) => i.date, NOW)).toEqual([
      { bucket: 'today', label: 'Hoy', items: [items[0], items[2]] },
      { bucket: 'before', label: 'Antes', items: [items[1]] },
    ]);
  });

  it('with no items returns an empty list', () => {
    expect(groupByTimeBucket([], () => '2026-07-15', NOW)).toEqual([]);
  });
});
