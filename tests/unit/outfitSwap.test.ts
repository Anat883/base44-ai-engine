import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { createDefaultGameState } from '@/lib/persistence/defaultState';

function resetStore() {
  useGameStore.setState({
    state: createDefaultGameState('test-player'),
    status: 'ready',
    offline: true,
    cloudEnabled: false,
  });
}

describe('outfit swapping via the dressing booth', () => {
  beforeEach(resetStore);

  it('only swaps the character outfit at the moment the curtain finishes closing (CHANGING), not before', () => {
    const { dispatchBoothEvent } = useGameStore.getState();
    const originalOutfitId =
      useGameStore.getState().state.characters['child_01'].outfitState.outfitId;

    dispatchBoothEvent({ type: 'ENTER', characterId: 'child_01' });
    dispatchBoothEvent({ type: 'SELECT_OUTFIT', outfitId: 'fancy_dress_01' });
    // Outfit must NOT change yet - the curtain hasn't closed.
    expect(useGameStore.getState().state.characters['child_01'].outfitState.outfitId).toBe(
      originalOutfitId,
    );

    dispatchBoothEvent({ type: 'CLOSE_CURTAIN' });
    expect(useGameStore.getState().state.characters['child_01'].outfitState.outfitId).toBe(
      originalOutfitId,
    );

    dispatchBoothEvent({ type: 'CURTAIN_CLOSED' }); // -> CHANGING: swap happens here, hidden by the curtain
    expect(useGameStore.getState().state.characters['child_01'].outfitState.outfitId).toBe(
      'fancy_dress_01',
    );

    dispatchBoothEvent({ type: 'CHANGE_COMPLETE' });
    dispatchBoothEvent({ type: 'CURTAIN_OPENED' });
    expect(useGameStore.getState().state.shop.dressingBoothState).toBe('COMPLETE');
    // Previous outfit is gone - the character now only reports the new one.
    expect(useGameStore.getState().state.characters['child_01'].outfitState.outfitId).toBe(
      'fancy_dress_01',
    );
  });

  it('leaves other characters completely untouched', () => {
    const { dispatchBoothEvent } = useGameStore.getState();
    const motherOutfitBefore =
      useGameStore.getState().state.characters['mother_01'].outfitState.outfitId;

    dispatchBoothEvent({ type: 'ENTER', characterId: 'child_01' });
    dispatchBoothEvent({ type: 'SELECT_OUTFIT', outfitId: 'fancy_dress_01' });
    dispatchBoothEvent({ type: 'CLOSE_CURTAIN' });
    dispatchBoothEvent({ type: 'CURTAIN_CLOSED' });

    expect(useGameStore.getState().state.characters['mother_01'].outfitState.outfitId).toBe(
      motherOutfitBefore,
    );
  });

  it('setCharacterOutfit (direct wardrobe action) updates only the targeted character', () => {
    useGameStore.getState().setCharacterOutfit('child_01', 'sweater_01');
    expect(useGameStore.getState().state.characters['child_01'].outfitState.outfitId).toBe(
      'sweater_01',
    );
  });
});
