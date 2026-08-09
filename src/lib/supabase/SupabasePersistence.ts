import type { GameState } from '@/types/save';
import type { GamePersistence } from '@/lib/persistence/GamePersistence';
import { migrateSave } from '@/lib/persistence/migrations';
import { getSupabaseClient } from './client';

interface GameSaveRow {
  user_id: string;
  save_version: number;
  state: unknown;
}

/**
 * Cloud sync layered on top of local save. Every failure here is swallowed
 * and logged (dev only) rather than surfaced to the child - offline play
 * must always keep working.
 */
export class SupabasePersistence implements GamePersistence {
  async load(playerId: string): Promise<GameState | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('game_saves')
        .select('user_id, save_version, state')
        .eq('user_id', playerId)
        .maybeSingle<GameSaveRow>();

      if (error || !data) return null;
      return migrateSave(data.state, playerId);
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[SupabasePersistence] load failed', error);
      return null;
    }
  }

  async save(state: GameState): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('game_saves').upsert(
        {
          user_id: state.playerId,
          save_version: state.saveVersion,
          state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (error && import.meta.env.DEV) {
        console.warn('[SupabasePersistence] save failed', error);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[SupabasePersistence] save threw', error);
    }
  }
}
