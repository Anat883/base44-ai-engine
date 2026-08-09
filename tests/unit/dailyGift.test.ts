import { describe, expect, it } from 'vitest';
import { isDailyGiftAvailable, localDateKey, pickGiftFromPool } from '@/features/gifts/dailyGift';
import { GIFTS } from '@/data';

describe('daily gift eligibility', () => {
  it('is available on a fresh save (no last claim, nothing pending)', () => {
    expect(isDailyGiftAvailable(null, null)).toBe(true);
  });

  it('is NOT available while a gift is pending, regardless of date', () => {
    expect(isDailyGiftAvailable(null, 'cat_bag_01')).toBe(false);
    expect(isDailyGiftAvailable('2020-01-01', 'cat_bag_01')).toBe(false);
  });

  it('is not available again on the same calendar day', () => {
    const today = new Date('2026-08-07T18:00:00');
    expect(isDailyGiftAvailable(localDateKey(today), null, today)).toBe(false);
  });

  it('becomes available again once the calendar day changes', () => {
    const claimedAt = new Date('2026-08-06T23:59:00');
    const nextMorning = new Date('2026-08-07T00:05:00');
    expect(isDailyGiftAvailable(localDateKey(claimedAt), null, nextMorning)).toBe(true);
  });

  it('resists duplicate-claim spam from repeated renders on the same tick', () => {
    // Simulates a component re-rendering many times in the same instant:
    // once a claim sets pendingGiftId, every subsequent check must refuse.
    const now = new Date();
    expect(isDailyGiftAvailable(null, null, now)).toBe(true);
    const afterClaim = isDailyGiftAvailable(localDateKey(now), 'panda_bag_01', now);
    expect(afterClaim).toBe(false);
  });
});

describe('pickGiftFromPool', () => {
  it('only ever returns gifts from the given pool', () => {
    for (let i = 0; i < 50; i += 1) {
      const gift = pickGiftFromPool(GIFTS, () => i / 50);
      expect(GIFTS.map((g) => g.id)).toContain(gift.id);
    }
  });

  it('respects weighting at the extremes (random()=0 picks the first weighted item)', () => {
    const gift = pickGiftFromPool(GIFTS, () => 0);
    expect(gift.id).toBe(GIFTS[0].id);
  });

  it('throws on an empty pool rather than silently returning nothing', () => {
    expect(() => pickGiftFromPool([])).toThrow();
  });
});
