import { CURRENT_SAVE_VERSION, type GameState, type GameStateAnyVersion } from '@/types/save';
import { createDefaultGameState } from './defaultState';

type Migration = (state: GameStateAnyVersion) => GameStateAnyVersion;

/**
 * Keyed by the version a migration upgrades FROM. Add `1: upgradeV1ToV2`
 * etc. here when the save shape changes - never mutate old save data
 * in place, always return a new object.
 */
const MIGRATIONS: Record<number, Migration> = {};

/**
 * Upgrades an arbitrary stored save to the current schema. Falls back to a
 * fresh default save if the stored data is unrecognizable, rather than
 * crashing the game for the child.
 */
export function migrateSave(raw: unknown, playerId: string): GameState {
  if (!raw || typeof raw !== 'object' || !('saveVersion' in raw)) {
    return createDefaultGameState(playerId);
  }

  let state = raw as GameStateAnyVersion;
  let guard = 0;
  while (state.saveVersion < CURRENT_SAVE_VERSION && guard < 20) {
    const migrate = MIGRATIONS[state.saveVersion];
    if (!migrate) {
      return createDefaultGameState(playerId);
    }
    state = migrate(state);
    guard += 1;
  }

  if (state.saveVersion !== CURRENT_SAVE_VERSION) {
    return createDefaultGameState(playerId);
  }

  return state as unknown as GameState;
}
