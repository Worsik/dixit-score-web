const STORAGE_KEY = 'dixit-known-players';

/** How many names are kept. Older ones fall off, so nothing needs deleting by hand. */
export const MAX_REMEMBERED = 20;

/** How many tiles the add dialog offers - more would not fit on a phone. */
export const MAX_SUGGESTIONS = 8;

const sameName = (a, b) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

/**
 * Puts a player at the front of the remembered list.
 * A name already known keeps its single entry, moves to the front and takes the
 * colour just used - the last spelling and the last colour win.
 */
export function remember(known, { name, color }) {
  const trimmed = name.trim();
  if (!trimmed) return known;

  const rest = known.filter((it) => !sameName(it.name, trimmed));
  return [{ name: trimmed, color }, ...rest].slice(0, MAX_REMEMBERED);
}

/** Names to offer, most recently used first, minus everyone already in the game. */
export function suggest(known, playersInGame) {
  return known
    .filter((it) => !playersInGame.some((player) => sameName(player.name, it.name)))
    .slice(0, MAX_SUGGESTIONS);
}

/**
 * Parses the stored list. Broken entries are dropped one by one rather than
 * discarding everything - losing the whole list over a single bad record would be
 * a poor trade for a convenience feature.
 */
export function parseKnown(json) {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((it) => typeof it?.name === 'string' && typeof it?.color === 'string');
  } catch {
    return [];
  }
}

// Storage may throw (private mode, quota). Failing to remember must never break the app.
export function saveKnown(known) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(known));
  } catch {
    // Ignored on purpose - names just will not be offered next time.
  }
}

export function loadKnown() {
  try {
    return parseKnown(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}
