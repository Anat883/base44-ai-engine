import type { Vector2 } from '@/types/save';

export const SHOP_BUILDING_ID = 'clothing_shop_01';

/** Where shop-floor characters start out - shared by defaultState (fresh save) and Clean Up (shop). */
export const SHOP_CHARACTER_POSITIONS: Record<string, Vector2> = {
  child_01: { x: 260, y: 560 },
  father_01: { x: 420, y: 580 },
  grandfather_01: { x: 900, y: 560 },
};
