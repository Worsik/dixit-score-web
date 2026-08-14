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

/** How many bonus points are up for distribution: one per voter who guessed wrong. */
export function pointsToDistribute(voterIds, selectedIds) {
  return voterIds.filter((id) => !selectedIds.includes(id)).length;
}

/**
 * Dixit round scoring.
 * All or nobody guessed  -> storyteller 0, every voter +2.
 * Somebody but not all   -> storyteller +3, correct voters +3, the rest 0.
 * Bonus votes are added on top in both cases.
 */
export function scoreRound({ voterIds, selectedIds, bonusAssignments = {} }) {
  const allGuessed = selectedIds.length === voterIds.length && voterIds.length > 0;
  const noneGuessed = selectedIds.length === 0;
  const flatRound = allGuessed || noneGuessed;

  const voterPoints = {};
  for (const id of voterIds) {
    const base = flatRound ? 2 : (selectedIds.includes(id) ? 3 : 0);
    voterPoints[id] = base + (bonusAssignments[id] ?? 0);
  }

  return { storytellerPoints: flatRound ? 0 : 3, voterPoints };
}

/** Rewrites turnOrder to match the position in the array. */
export function reindexTurnOrder(players) {
  return players.map((player, index) => ({ ...player, turnOrder: index }));
}

/** Appends a player at the end of the turn order. */
export function addPlayer(players, newPlayer) {
  return updateStorytellerRoles(reindexTurnOrder([...players, newPlayer]));
}

/** Removes a player; if they were the storyteller, the designated next one takes over. */
export function removePlayer(players, playerId) {
  const removed = players.find((it) => it.id === playerId);
  const successorId = removed?.isStoryteller
    ? players.find((it) => it.isNextStoryteller)?.id ?? null
    : null;

  const remaining = reindexTurnOrder(players.filter((it) => it.id !== playerId));
  return updateStorytellerRoles(remaining, successorId);
}

/** Moves a player from one position to another and reindexes. */
export function movePlayer(players, from, to) {
  const reordered = [...players];
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);
  return updateStorytellerRoles(reindexTurnOrder(reordered));
}

/** Resets all scores and makes the chosen player the storyteller. */
export function startNewGame(players, storytellerId) {
  const reset = players.map((player) => ({ ...player, score: 0 }));
  return updateStorytellerRoles(reset, storytellerId);
}

/** Adds the round's points and hands the storyteller role to the designated next player. */
export function applyScores(players, { storytellerId, storytellerPoints, voterPoints }) {
  const scored = players.map((player) => ({
    ...player,
    score: player.score +
      (player.id === storytellerId ? storytellerPoints : voterPoints[player.id] ?? 0),
  }));

  const successorId = scored.find((it) => it.isNextStoryteller)?.id ?? null;
  return updateStorytellerRoles(scored, successorId);
}
