import type { GiftEntity } from '@/types/entities';

/** YYYY-MM-DD in the player's local timezone - safe for "once per calendar day" checks. */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * A new gift may be claimed once the calendar day has changed since the
 * last claim - and never while an unclaimed/unopened gift is already
 * pending, which is what actually protects against duplicate claims caused
 * by repeated renders/clicks (the date check alone would not).
 */
export function isDailyGiftAvailable(
  lastGiftDate: string | null,
  pendingGiftId: string | null,
  now: Date = new Date(),
): boolean {
  if (pendingGiftId) return false;
  if (!lastGiftDate) return true;
  return lastGiftDate !== localDateKey(now);
}

/** Deterministic-shape weighted random pick from the configured gift pool. */
export function pickGiftFromPool(
  pool: GiftEntity[],
  random: () => number = Math.random,
): GiftEntity {
  if (pool.length === 0) {
    throw new Error('Gift pool is empty');
  }
  const totalWeight = pool.reduce((sum, gift) => sum + Math.max(gift.poolWeight, 0), 0);
  if (totalWeight <= 0) {
    return pool[Math.floor(random() * pool.length)];
  }
  let roll = random() * totalWeight;
  for (const gift of pool) {
    roll -= Math.max(gift.poolWeight, 0);
    if (roll <= 0) return gift;
  }
  return pool[pool.length - 1];
}
