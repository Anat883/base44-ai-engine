import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

let client: SupabaseClient | null = null;

/**
 * Returns a Supabase client only when VITE_SUPABASE_URL /
 * VITE_SUPABASE_PUBLISHABLE_KEY are set, so the rest of the app can treat
 * "no backend configured" as a normal, non-error state and fall back to
 * local-only play.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!url || !publishableKey) return null;
  if (!client) {
    client = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}
