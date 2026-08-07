import type { ShopState } from '@/types/save';

export type DressingBoothState = ShopState['dressingBoothState'];

export type DressingBoothEvent =
  | { type: 'ENTER'; characterId: string }
  | { type: 'SELECT_OUTFIT'; outfitId: string }
  | { type: 'CLOSE_CURTAIN' }
  | { type: 'CURTAIN_CLOSED' }
  | { type: 'CHANGE_COMPLETE' }
  | { type: 'CURTAIN_OPENED' }
  | { type: 'EXIT' };

export interface DressingBoothMachineState {
  state: DressingBoothState;
  characterId: string | null;
  selectedOutfitId: string | null;
}

export const INITIAL_BOOTH_STATE: DressingBoothMachineState = {
  state: 'EMPTY',
  characterId: null,
  selectedOutfitId: null,
};

/**
 * Pure reducer for the dressing-booth curtain interaction. Kept independent
 * of Phaser/React/the store so it's trivially unit-testable and so the UI
 * can never desync from "what the animation is actually doing" - invalid
 * events during a locked animation phase are simply ignored (booth state is
 * returned unchanged).
 */
export function dressingBoothReducer(
  current: DressingBoothMachineState,
  event: DressingBoothEvent,
): DressingBoothMachineState {
  switch (current.state) {
    case 'EMPTY':
      if (event.type === 'ENTER') {
        return {
          state: 'CHARACTER_INSIDE',
          characterId: event.characterId,
          selectedOutfitId: null,
        };
      }
      return current;

    case 'CHARACTER_INSIDE':
      if (event.type === 'SELECT_OUTFIT') {
        return { ...current, state: 'OUTFIT_SELECTED', selectedOutfitId: event.outfitId };
      }
      if (event.type === 'EXIT') {
        return INITIAL_BOOTH_STATE;
      }
      return current;

    case 'OUTFIT_SELECTED':
      if (event.type === 'SELECT_OUTFIT') {
        return { ...current, selectedOutfitId: event.outfitId };
      }
      if (event.type === 'CLOSE_CURTAIN') {
        return { ...current, state: 'CURTAIN_CLOSING' };
      }
      if (event.type === 'EXIT') {
        return INITIAL_BOOTH_STATE;
      }
      return current;

    case 'CURTAIN_CLOSING':
      // Locked: only the animation-driven event may proceed.
      if (event.type === 'CURTAIN_CLOSED') {
        return { ...current, state: 'CHANGING' };
      }
      return current;

    case 'CHANGING':
      if (event.type === 'CHANGE_COMPLETE') {
        return { ...current, state: 'CURTAIN_OPENING' };
      }
      return current;

    case 'CURTAIN_OPENING':
      if (event.type === 'CURTAIN_OPENED') {
        return { ...current, state: 'COMPLETE' };
      }
      return current;

    case 'COMPLETE':
      if (event.type === 'SELECT_OUTFIT') {
        return { ...current, state: 'OUTFIT_SELECTED', selectedOutfitId: event.outfitId };
      }
      if (event.type === 'EXIT') {
        return INITIAL_BOOTH_STATE;
      }
      return current;

    default:
      return current;
  }
}

export function canSelectOutfit(state: DressingBoothState): boolean {
  return state === 'CHARACTER_INSIDE' || state === 'OUTFIT_SELECTED' || state === 'COMPLETE';
}

export function canCloseCurtain(state: DressingBoothState): boolean {
  return state === 'OUTFIT_SELECTED';
}

export function isAnimating(state: DressingBoothState): boolean {
  return state === 'CURTAIN_CLOSING' || state === 'CHANGING' || state === 'CURTAIN_OPENING';
}
