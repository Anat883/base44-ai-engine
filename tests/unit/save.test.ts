import { describe, expect, it } from 'vitest';
import { CURRENT_SAVE_VERSION } from '@/types/save';
import { createDefaultGameState } from '@/lib/persistence/defaultState';
import { migrateSave } from '@/lib/persistence/migrations';
import { LocalPersistence } from '@/lib/persistence/LocalPersistence';

describe('createDefaultGameState', () => {
  it('produces a well-formed save at the current version', () => {
    const state = createDefaultGameState('player-1');
    expect(state.saveVersion).toBe(CURRENT_SAVE_VERSION);
    expect(state.playerId).toBe('player-1');
    expect(Object.keys(state.characters).length).toBeGreaterThan(0);
    expect(state.editableHouse.furniture.length).toBeGreaterThan(0);
  });
});

describe('save version migration', () => {
  it('passes current-version data straight through unchanged', () => {
    const original = createDefaultGameState('player-1');
    const migrated = migrateSave(original, 'player-1');
    expect(migrated).toEqual(original);
  });

  it('falls back to a fresh default save for unrecognized/corrupt data instead of crashing', () => {
    const migrated = migrateSave({ garbage: true }, 'player-2');
    expect(migrated.saveVersion).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.playerId).toBe('player-2');
  });

  it('falls back to default for null/undefined input', () => {
    expect(migrateSave(null, 'player-3').playerId).toBe('player-3');
    expect(migrateSave(undefined, 'player-3').playerId).toBe('player-3');
  });

  it('falls back to default for an unknown future save version rather than corrupting state', () => {
    const future = { ...createDefaultGameState('player-4'), saveVersion: CURRENT_SAVE_VERSION + 1 };
    const migrated = migrateSave(future, 'player-4');
    expect(migrated.saveVersion).toBe(CURRENT_SAVE_VERSION);
  });

  it('falls back to default for an old version with no registered migration path', () => {
    const old = { ...createDefaultGameState('player-5'), saveVersion: 0 };
    const migrated = migrateSave(old, 'player-5');
    expect(migrated.saveVersion).toBe(CURRENT_SAVE_VERSION);
  });
});

describe('save serialization round-trip (LocalPersistence / IndexedDB)', () => {
  it('saves and loads back an equivalent state', async () => {
    const persistence = new LocalPersistence();
    const state = createDefaultGameState('round-trip-player');
    state.characters['child_01'].outfitState.outfitId = 'fancy_dress_01';

    await persistence.save(state);
    const loaded = await persistence.load('round-trip-player');

    expect(loaded).not.toBeNull();
    expect(loaded?.characters['child_01'].outfitState.outfitId).toBe('fancy_dress_01');
    expect(loaded?.saveVersion).toBe(CURRENT_SAVE_VERSION);
  });

  it('returns null for a player with no saved data', async () => {
    const persistence = new LocalPersistence();
    const loaded = await persistence.load('never-seen-before');
    expect(loaded).toBeNull();
  });
});
