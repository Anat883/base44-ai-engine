import type { GameState } from '@/types/save';

/**
 * Storage-agnostic save contract. LocalPersistence (IndexedDB) always works;
 * SupabasePersistence is layered on top opportunistically when configured
 * and reachable. Callers should never need to know which one is active.
 */
export interface GamePersistence {
  load(playerId: string): Promise<GameState | null>;
  save(state: GameState): Promise<void>;
}

export class PersistenceError extends Error {}
