import type { GameState } from '@/types/save';
import { LocalPersistence } from './LocalPersistence';
import { SupabasePersistence } from '@/lib/supabase/SupabasePersistence';
import { ensureAnonymousSession } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getOrCreateLocalPlayerId, setLocalPlayerId } from './playerId';
import { createDefaultGameState } from './defaultState';

export type { GamePersistence } from './GamePersistence';
export { createDefaultGameState } from './defaultState';

const local = new LocalPersistence();
const cloud = new SupabasePersistence();

export interface PersistenceSession {
  playerId: string;
  state: GameState;
  cloudEnabled: boolean;
  /** Fire-and-forget save to local storage (always) + cloud (best effort). */
  save: (state: GameState) => void;
}

function newerOf(a: GameState | null, b: GameState | null): GameState | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a.updatedAt).getTime() >= new Date(b.updatedAt).getTime() ? a : b;
}

/**
 * Boots the save system: local-first, with an opportunistic anonymous
 * Supabase sync layered on top when env vars are present and the network is
 * reachable. Never throws - worst case the child plays on a fresh local
 * save.
 */
export async function initPersistence(): Promise<PersistenceSession> {
  const localPlayerId = getOrCreateLocalPlayerId();
  const cloudUserId = isSupabaseConfigured ? await ensureAnonymousSession() : null;
  const playerId = cloudUserId ?? localPlayerId;

  if (cloudUserId && cloudUserId !== localPlayerId) {
    setLocalPlayerId(cloudUserId);
  }

  const [localState, cloudState] = await Promise.all([
    local.load(playerId),
    cloudUserId ? cloud.load(playerId) : Promise.resolve(null),
  ]);

  const resolved = newerOf(localState, cloudState) ?? createDefaultGameState(playerId);

  // Make sure both stores agree on the resolved state before play begins.
  void local.save(resolved);
  if (cloudUserId) void cloud.save(resolved);

  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let pending: GameState | null = null;

  const flush = () => {
    if (!pending) return;
    const state = pending;
    pending = null;
    void local.save(state);
    if (cloudUserId) void cloud.save(state);
  };

  const save = (state: GameState) => {
    pending = state;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 500);
  };

  return { playerId, state: resolved, cloudEnabled: Boolean(cloudUserId), save };
}
