import { getSupabaseClient } from './client';

/**
 * Ensures an anonymous Supabase session exists and returns its user id, or
 * null if Supabase isn't configured / reachable. No personal information is
 * ever collected - this is Supabase Auth's built-in anonymous sign-in.
 */
export async function ensureAnonymousSession(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user.id) {
      return sessionData.session.user.id;
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('[auth] anonymous sign-in failed, staying offline', error);
      return null;
    }
    return data.user?.id ?? null;
  } catch (error) {
    console.warn('[auth] anonymous sign-in threw, staying offline', error);
    return null;
  }
}
