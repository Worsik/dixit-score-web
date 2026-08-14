const STORAGE_KEY = 'dixit-score';
const VERSION = 1;

/** Serializes the game state. UI state is deliberately left out. */
export function serialize({ players, roundNumber }) {
  return JSON.stringify({ v: VERSION, players, roundNumber });
}

/** Parses a stored record. Returns null for anything unusable. */
export function deserialize(json) {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (parsed?.v !== VERSION || !Array.isArray(parsed.players)) return null;
    return { players: parsed.players, roundNumber: parsed.roundNumber ?? 1 };
  } catch {
    return null;
  }
}

// Storage may throw (private mode, quota). Failing to persist must never break the app.
export function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(state));
  } catch {
    // Ignored on purpose - the app works, it just will not remember.
  }
}

export function load() {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}
