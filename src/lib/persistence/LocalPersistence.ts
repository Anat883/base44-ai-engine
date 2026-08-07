import { openDB, type IDBPDatabase } from 'idb';
import type { GameState } from '@/types/save';
import type { GamePersistence } from './GamePersistence';
import { migrateSave } from './migrations';

const DB_NAME = 'doll-city';
const DB_VERSION = 1;
const STORE_NAME = 'game-saves';

function openGameDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

/**
 * IndexedDB-backed local save. This is the persistence layer that always
 * works, with or without a backend - the game must never depend on the
 * network to be playable.
 */
export class LocalPersistence implements GamePersistence {
  async load(playerId: string): Promise<GameState | null> {
    try {
      const db = await openGameDb();
      const raw = await db.get(STORE_NAME, playerId);
      db.close();
      if (!raw) return null;
      return migrateSave(raw, playerId);
    } catch (error) {
      console.warn('[LocalPersistence] load failed, starting fresh', error);
      return null;
    }
  }

  async save(state: GameState): Promise<void> {
    try {
      const db = await openGameDb();
      await db.put(STORE_NAME, state, state.playerId);
      db.close();
    } catch (error) {
      console.warn('[LocalPersistence] save failed', error);
    }
  }
}
