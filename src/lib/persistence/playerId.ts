const PLAYER_ID_KEY = 'doll-city:player-id';

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `player_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Tiny local metadata (just an id, no personal info) kept in localStorage so
 * a returning anonymous player's save can be found again. Falls back to an
 * in-memory id if localStorage is unavailable (private browsing, etc.).
 */
export function getOrCreateLocalPlayerId(): string {
  try {
    const existing = localStorage.getItem(PLAYER_ID_KEY);
    if (existing) return existing;
    const created = randomId();
    localStorage.setItem(PLAYER_ID_KEY, created);
    return created;
  } catch {
    return randomId();
  }
}

export function setLocalPlayerId(id: string): void {
  try {
    localStorage.setItem(PLAYER_ID_KEY, id);
  } catch {
    // ignore - non-critical
  }
}
