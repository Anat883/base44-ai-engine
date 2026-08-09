import { describe, expect, it } from 'vitest';
import {
  applyAccessory,
  canAttachAccessory,
  canHoldItem,
  detachAccessory,
} from '@/game/systems/attachment';
import { ACCESSORIES } from '@/data';
import type { CharacterOutfitState } from '@/types/save';

const glasses = ACCESSORIES.find((a) => a.id === 'glasses_01')!;
const earrings = ACCESSORIES.find((a) => a.id === 'earrings_01')!;
const hairBow = ACCESSORIES.find((a) => a.id === 'hair_bow_01')!;

const baseOutfitState: CharacterOutfitState = {
  outfitId: 'casual_outfit_01',
  hairId: 'brown_01',
  hairColor: '',
  glassesId: null,
  earringsId: null,
  hairAccessoryId: null,
  faceAccessoryId: null,
  heldItemId: null,
};

describe('attachment slot validation', () => {
  it('routes each accessory to its correct anchor slot', () => {
    expect(applyAccessory(baseOutfitState, glasses).glassesId).toBe('glasses_01');
    expect(applyAccessory(baseOutfitState, earrings).earringsId).toBe('earrings_01');
    expect(applyAccessory(baseOutfitState, hairBow).hairAccessoryId).toBe('hair_bow_01');
  });

  it('never cross-wires an accessory into the wrong slot', () => {
    const withGlasses = applyAccessory(baseOutfitState, glasses);
    expect(withGlasses.earringsId).toBeNull();
    expect(withGlasses.hairAccessoryId).toBeNull();
  });

  it('detaches only the targeted slot', () => {
    let state = applyAccessory(baseOutfitState, glasses);
    state = applyAccessory(state, earrings);
    state = detachAccessory(state, 'glasses');
    expect(state.glassesId).toBeNull();
    expect(state.earringsId).toBe('earrings_01');
  });

  it('is immutable - never mutates the input state', () => {
    const before = { ...baseOutfitState };
    applyAccessory(baseOutfitState, glasses);
    expect(baseOutfitState).toEqual(before);
  });

  it('every seeded accessory reports a valid attachable slot', () => {
    for (const accessory of ACCESSORIES) {
      expect(canAttachAccessory(accessory)).toBe(true);
    }
  });

  it('gates held items on canHoldItems', () => {
    expect(canHoldItem({ canHoldItems: true })).toBe(true);
    expect(canHoldItem({ canHoldItems: false })).toBe(false);
  });
});
