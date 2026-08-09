import type { Vector2 } from '@/types/save';

export const SHOP_BUILDING_ID = 'clothing_shop_01';

/**
 * Where shop-floor characters start out - shared by defaultState (fresh save)
 * and Clean Up (shop). Spaced ~300-340px apart so the larger
 * (CharacterView SCALE = 1.7) dolls, at ~210px wide, don't overlap, and kept
 * clear of the dressing booth zone (x=980-1220).
 */
export const SHOP_CHARACTER_POSITIONS: Record<string, Vector2> = {
  child_01: { x: 200, y: 560 },
  father_01: { x: 540, y: 580 },
  grandfather_01: { x: 840, y: 560 },
};
