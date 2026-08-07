import type { AccessoryEntity, AccessorySlot, CharacterEntity } from '@/types/entities';
import type { CharacterOutfitState } from '@/types/save';

/** Maps each accessory slot to the outfit-state field it writes to. */
const SLOT_FIELD: Record<AccessorySlot, keyof CharacterOutfitState> = {
  glasses: 'glassesId',
  earrings: 'earringsId',
  hairAccessory: 'hairAccessoryId',
  faceAccessory: 'faceAccessoryId',
  bag: 'heldItemId',
};

export function slotFieldFor(slot: AccessorySlot): keyof CharacterOutfitState {
  return SLOT_FIELD[slot];
}

/** True if dropping `accessory` on a character is a valid attach action. */
export function canAttachAccessory(accessory: AccessoryEntity): boolean {
  return accessory.slot in SLOT_FIELD;
}

/** True if `character` is allowed to hold items in their hand at all. */
export function canHoldItem(character: Pick<CharacterEntity, 'canHoldItems'>): boolean {
  return character.canHoldItems;
}

/**
 * Applies an accessory to an outfit state immutably, routing it to the
 * correct anchor slot (e.g. glasses -> face/glasses anchor). Returns the
 * original state unchanged if the accessory has no valid slot.
 */
export function applyAccessory(
  outfitState: CharacterOutfitState,
  accessory: AccessoryEntity,
): CharacterOutfitState {
  if (!canAttachAccessory(accessory)) return outfitState;
  const field = slotFieldFor(accessory.slot);
  return { ...outfitState, [field]: accessory.id };
}

/** Removes whatever accessory currently occupies the given slot. */
export function detachAccessory(
  outfitState: CharacterOutfitState,
  slot: AccessorySlot,
): CharacterOutfitState {
  const field = slotFieldFor(slot);
  return { ...outfitState, [field]: null };
}
