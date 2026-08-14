// Maximum number of players, mirrors the Android original.
export const MAX_PLAYERS = 12;

// Above this count the player list switches to a two-column grid.
export const GRID_THRESHOLD = 6;

/**
 * Recomputes the isStoryteller / isNextStoryteller flags.
 * Storyteller is: the designated one, else the current one, else the first player.
 */
export function updateStorytellerRoles(players, designatedId = null) {
  if (players.length === 0) return [];

  const storyteller =
    (designatedId && players.find((it) => it.id === designatedId)) ||
    players.find((it) => it.isStoryteller) ||
    players[0];

  const nextTurnOrder = (storyteller.turnOrder + 1) % players.length;

  return players.map((player) => ({
    ...player,
    isStoryteller: player.id === storyteller.id,
    isNextStoryteller: player.turnOrder === nextTurnOrder,
  }));
}
