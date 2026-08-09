import { describe, expect, it } from 'vitest';
import {
  dressingBoothReducer,
  INITIAL_BOOTH_STATE,
  canCloseCurtain,
  canSelectOutfit,
  isAnimating,
} from '@/game/interactions/dressingBoothMachine';

describe('dressingBoothReducer', () => {
  it('walks the full happy path: enter -> select -> close -> change -> open -> complete', () => {
    let state = INITIAL_BOOTH_STATE;

    state = dressingBoothReducer(state, { type: 'ENTER', characterId: 'child_01' });
    expect(state.state).toBe('CHARACTER_INSIDE');
    expect(state.characterId).toBe('child_01');

    state = dressingBoothReducer(state, { type: 'SELECT_OUTFIT', outfitId: 'fancy_dress_01' });
    expect(state.state).toBe('OUTFIT_SELECTED');
    expect(state.selectedOutfitId).toBe('fancy_dress_01');

    state = dressingBoothReducer(state, { type: 'CLOSE_CURTAIN' });
    expect(state.state).toBe('CURTAIN_CLOSING');

    state = dressingBoothReducer(state, { type: 'CURTAIN_CLOSED' });
    expect(state.state).toBe('CHANGING');

    state = dressingBoothReducer(state, { type: 'CHANGE_COMPLETE' });
    expect(state.state).toBe('CURTAIN_OPENING');

    state = dressingBoothReducer(state, { type: 'CURTAIN_OPENED' });
    expect(state.state).toBe('COMPLETE');

    state = dressingBoothReducer(state, { type: 'EXIT' });
    expect(state).toEqual(INITIAL_BOOTH_STATE);
  });

  it('ignores events that are invalid for the current state (no-op, not a crash)', () => {
    const empty = dressingBoothReducer(INITIAL_BOOTH_STATE, {
      type: 'SELECT_OUTFIT',
      outfitId: 'x',
    });
    expect(empty).toEqual(INITIAL_BOOTH_STATE);

    const inside = dressingBoothReducer(INITIAL_BOOTH_STATE, { type: 'ENTER', characterId: 'a' });
    const stillInside = dressingBoothReducer(inside, { type: 'CLOSE_CURTAIN' });
    expect(stillInside).toEqual(inside);
  });

  it('locks out every event during animation phases except the driving one', () => {
    let state = dressingBoothReducer(INITIAL_BOOTH_STATE, { type: 'ENTER', characterId: 'a' });
    state = dressingBoothReducer(state, { type: 'SELECT_OUTFIT', outfitId: 'x' });
    state = dressingBoothReducer(state, { type: 'CLOSE_CURTAIN' });
    expect(state.state).toBe('CURTAIN_CLOSING');

    const blocked = dressingBoothReducer(state, { type: 'EXIT' });
    expect(blocked).toEqual(state);

    const blockedSelect = dressingBoothReducer(state, { type: 'SELECT_OUTFIT', outfitId: 'y' });
    expect(blockedSelect).toEqual(state);
  });

  it('allows picking a different outfit again after COMPLETE', () => {
    let state = dressingBoothReducer(INITIAL_BOOTH_STATE, { type: 'ENTER', characterId: 'a' });
    state = { ...state, state: 'COMPLETE' };
    state = dressingBoothReducer(state, { type: 'SELECT_OUTFIT', outfitId: 'new_outfit' });
    expect(state.state).toBe('OUTFIT_SELECTED');
    expect(state.selectedOutfitId).toBe('new_outfit');
  });
});

describe('dressing booth UI guards', () => {
  it('canSelectOutfit / canCloseCurtain / isAnimating agree with the reducer states', () => {
    expect(canSelectOutfit('CHARACTER_INSIDE')).toBe(true);
    expect(canSelectOutfit('EMPTY')).toBe(false);
    expect(canCloseCurtain('OUTFIT_SELECTED')).toBe(true);
    expect(canCloseCurtain('CHARACTER_INSIDE')).toBe(false);
    expect(isAnimating('CHANGING')).toBe(true);
    expect(isAnimating('COMPLETE')).toBe(false);
  });
});
