import {
  addPlayer, removePlayer, movePlayer as reorderPlayers, startNewGame, applyScores,
  scoreRound, pointsToDistribute as countPointsToDistribute, remainingBonusPoints,
  updateStorytellerRoles, MAX_PLAYERS,
} from './rules.js';
import { save, load } from './storage.js';
import { remember, loadKnown, saveKnown } from './known-players.js';
import { DEFAULT_COLOR, nextFreeColor } from './palette.js';

const EMPTY_SCORING = {
  isOpen: false,
  step: 'selection',        // 'selection' | 'bonus' | 'summary'
  storytellerId: null,
  voterIds: [],
  selectedIds: [],
  chosenForBonus: [],       // in the order they were picked
  bonusAssignments: {},     // playerId -> points
  pointsToDistribute: 0,
};

let state = {
  players: [],
  roundNumber: 1,
  knownPlayers: [],         // names offered in the add dialog, most recent first
  undo: null,               // { players, roundNumber } from before the last change
  addDialog: { isOpen: false, selectedColor: DEFAULT_COLOR },
  editDialog: { isOpen: false, playerId: null, selectedColor: DEFAULT_COLOR, confirmDelete: false },
  scoringDialog: { ...EMPTY_SCORING },
  // Roster being composed before the first game; real players exist only on confirm,
  // so cancelling leaves no trace.
  setupDialog: { isOpen: false, draft: [] },
  newGameMenuOpen: false,
  message: null,
};

const listeners = new Set();

export const getState = () => state;

/** Everything that makes up the game itself; the rest of the state is UI. */
const GAME_KEYS = ['players', 'roundNumber'];

/**
 * Takes back the last change - any change, not just scoring.
 *
 * One level only: this is for the mis-tap at the table, not for browsing history.
 * The snapshot is deliberately NOT persisted - keeping it would mean changing the format
 * of the stored game, and `storage.js` throws the whole record away on a version
 * mismatch (AD-12). A reload therefore drops the undo (AD-13).
 */
export function undoLast() {
  if (!state.undo) return;
  update({ players: state.undo.players, roundNumber: state.undo.roundNumber, undo: null });
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Applies a patch, persists the game part and notifies subscribers.
 *
 * The undo point is taken here, in one place, rather than in every action: a patch that
 * touches the game becomes undoable, a patch that only opens a dialog or shows a toast
 * does not. A patch may still set `undo` itself - that is how undoLast() avoids
 * recording its own restore and turning undo into a toggle.
 */
function update(patch) {
  const touchesGame = GAME_KEYS.some((key) => key in patch);
  const undo = 'undo' in patch
    ? patch.undo
    : touchesGame
      ? { players: state.players, roundNumber: state.roundNumber }
      : state.undo;

  state = { ...state, ...patch, undo };
  save({ players: state.players, roundNumber: state.roundNumber });
  listeners.forEach((listener) => listener());
}

/** Restores a stored game, if there is one, plus the remembered names. */
export function init() {
  const stored = load();
  if (stored) {
    state = { ...state, players: stored.players, roundNumber: stored.roundNumber };
  }
  // Kept under its own storage key, so a change here can never damage a saved game.
  state = { ...state, knownPlayers: loadKnown() };
}

// --- Add player ---

export function openAddDialog() {
  if (state.players.length >= MAX_PLAYERS) {
    update({ message: 'max_players_reached' });
    return;
  }
  update({ addDialog: { isOpen: true, selectedColor: DEFAULT_COLOR } });
}

export const closeAddDialog = () =>
  update({ addDialog: { ...state.addDialog, isOpen: false } });

export const setAddColor = (color) =>
  update({ addDialog: { ...state.addDialog, selectedColor: color } });

export function confirmAddPlayer(name) {
  if (!name.trim()) return;
  const newPlayer = {
    id: crypto.randomUUID(),
    name: name.trim(),
    color: state.addDialog.selectedColor,
    score: 0,
    isStoryteller: false,
    isNextStoryteller: false,
    turnOrder: state.players.length,
  };
  // Remembered on adding, not on renaming - a rename would also record every typo
  // made on the way to the final name.
  const knownPlayers = remember(state.knownPlayers, newPlayer);
  saveKnown(knownPlayers);

  update({
    players: addPlayer(state.players, newPlayer),
    knownPlayers,
    addDialog: { ...state.addDialog, isOpen: false },
  });
}

// --- Edit player ---

export function openEditDialog(playerId) {
  const player = state.players.find((it) => it.id === playerId);
  if (!player) return;
  update({
    editDialog: { isOpen: true, playerId, selectedColor: player.color, confirmDelete: false },
  });
}

export const closeEditDialog = () =>
  update({ editDialog: { ...state.editDialog, isOpen: false, confirmDelete: false } });

export const setEditColor = (color) =>
  update({ editDialog: { ...state.editDialog, selectedColor: color } });

export function confirmEditPlayer(name, score) {
  const { playerId, selectedColor } = state.editDialog;
  if (!name.trim()) return;
  const parsed = Number.parseInt(score, 10);
  update({
    players: state.players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            name: name.trim(),
            color: selectedColor,
            score: Number.isNaN(parsed) ? player.score : parsed,
          }
        : player
    ),
    editDialog: { ...state.editDialog, isOpen: false },
  });
}

/**
 * Hands the storyteller role to the edited player.
 * Without this the role could only be set when starting a new game, which zeroes every
 * score - so a forgotten round used to cost the whole game.
 */
export function makeStoryteller() {
  const { playerId } = state.editDialog;
  if (!state.players.some((it) => it.id === playerId)) return;
  update({
    players: updateStorytellerRoles(state.players, playerId),
    editDialog: { ...state.editDialog, isOpen: false },
  });
}

export const askDeleteConfirm = () =>
  update({ editDialog: { ...state.editDialog, confirmDelete: true } });

export const cancelDeleteConfirm = () =>
  update({ editDialog: { ...state.editDialog, confirmDelete: false } });

export function confirmDeletePlayer() {
  update({
    players: removePlayer(state.players, state.editDialog.playerId),
    editDialog: { ...state.editDialog, isOpen: false, confirmDelete: false },
  });
}

/** Reorders players after a drag; roles are recomputed from the new turn order. */
export const movePlayer = (from, to) =>
  update({ players: reorderPlayers(state.players, from, to) });

// --- Scoring ---

/** Scoring needs a storyteller; with no players the button does nothing. */
export function openScoring() {
  const storyteller = state.players.find((it) => it.isStoryteller);
  if (!storyteller) return;
  update({
    scoringDialog: {
      ...EMPTY_SCORING,
      isOpen: true,
      storytellerId: storyteller.id,
      voterIds: state.players.filter((it) => it.id !== storyteller.id).map((it) => it.id),
    },
  });
}

export const closeScoring = () =>
  update({ scoringDialog: { ...state.scoringDialog, isOpen: false } });

export function toggleVoter(playerId, isSelected) {
  const { selectedIds } = state.scoringDialog;
  const next = isSelected
    ? [...selectedIds, playerId]
    : selectedIds.filter((id) => id !== playerId);
  update({ scoringDialog: { ...state.scoringDialog, selectedIds: next } });
}

export const selectAllVoters = (isSelected) =>
  update({
    scoringDialog: {
      ...state.scoringDialog,
      selectedIds: isSelected ? [...state.scoringDialog.voterIds] : [],
    },
  });

/** True when every voter guessed the storyteller's card. */
function everyoneGuessed({ voterIds, selectedIds }) {
  return selectedIds.length === voterIds.length && voterIds.length > 0;
}

export function confirmSelection() {
  const { voterIds, selectedIds } = state.scoringDialog;
  const allGuessed = everyoneGuessed(state.scoringDialog);

  // When everybody guessed there is nothing to distribute - skip straight to the summary.
  update({
    scoringDialog: {
      ...state.scoringDialog,
      step: allGuessed ? 'summary' : 'bonus',
      pointsToDistribute: allGuessed ? 0 : countPointsToDistribute(voterIds, selectedIds),
      chosenForBonus: [],
      bonusAssignments: {},
    },
  });
}

export const backToSelection = () =>
  update({ scoringDialog: { ...state.scoringDialog, step: 'selection' } });

/**
 * Picking a player hands them their first point straight away - wanting exactly one
 * point is the common case, so the extra tap was pure friction.
 * The tiles are disabled once nothing is left, so this should not be reachable then;
 * the guard is there so the budget cannot be exceeded by any other route.
 */
export function addBonusPlayer(playerId) {
  const { chosenForBonus, bonusAssignments, pointsToDistribute } = state.scoringDialog;
  if (chosenForBonus.includes(playerId)) return;
  if (remainingBonusPoints(pointsToDistribute, bonusAssignments) <= 0) return;

  update({
    scoringDialog: {
      ...state.scoringDialog,
      chosenForBonus: [...chosenForBonus, playerId],
      bonusAssignments: { ...bonusAssignments, [playerId]: 1 },
    },
  });
}

export function removeBonusPlayer(playerId) {
  const bonusAssignments = { ...state.scoringDialog.bonusAssignments };
  delete bonusAssignments[playerId];
  update({
    scoringDialog: {
      ...state.scoringDialog,
      chosenForBonus: state.scoringDialog.chosenForBonus.filter((id) => id !== playerId),
      bonusAssignments,
    },
  });
}

export function incrementBonus(playerId) {
  const { bonusAssignments, pointsToDistribute } = state.scoringDialog;
  if (remainingBonusPoints(pointsToDistribute, bonusAssignments) <= 0) return;
  update({
    scoringDialog: {
      ...state.scoringDialog,
      bonusAssignments: {
        ...bonusAssignments, [playerId]: (bonusAssignments[playerId] ?? 0) + 1,
      },
    },
  });
}

export function decrementBonus(playerId) {
  const { bonusAssignments } = state.scoringDialog;
  if ((bonusAssignments[playerId] ?? 0) <= 0) return;
  update({
    scoringDialog: {
      ...state.scoringDialog,
      bonusAssignments: {
        ...bonusAssignments, [playerId]: bonusAssignments[playerId] - 1,
      },
    },
  });
}

export const confirmBonusVotes = () =>
  update({ scoringDialog: { ...state.scoringDialog, step: 'summary' } });

/**
 * Back from the summary. Mirrors the original: bonus assignments are NOT reset,
 * so returning to the bonus step shows them again.
 */
export function backFromSummary() {
  update({
    scoringDialog: {
      ...state.scoringDialog,
      step: everyoneGuessed(state.scoringDialog) ? 'selection' : 'bonus',
    },
  });
}

export function confirmScores() {
  const { storytellerId, voterIds, selectedIds, bonusAssignments } = state.scoringDialog;
  const { storytellerPoints, voterPoints } =
    scoreRound({ voterIds, selectedIds, bonusAssignments });

  update({
    players: applyScores(state.players, { storytellerId, storytellerPoints, voterPoints }),
    roundNumber: state.roundNumber + 1,
    scoringDialog: { ...state.scoringDialog, isOpen: false },
  });
}

// --- Setup dialog (first game, empty roster) ---

const draftColors = (draft, except = -1) =>
  draft.filter((_, index) => index !== except).map((it) => it.color);

export const openSetupDialog = () => update({ setupDialog: { isOpen: true, draft: [] } });

export const closeSetupDialog = () =>
  update({ setupDialog: { ...state.setupDialog, isOpen: false } });

/** Adds a name to the roster. Without a colour it takes the first free one. */
export function addDraftPlayer(name, color = null) {
  const { draft } = state.setupDialog;
  const trimmed = name.trim();
  if (!trimmed || draft.length >= MAX_PLAYERS) return;

  update({
    setupDialog: {
      ...state.setupDialog,
      draft: [...draft, { name: trimmed, color: color ?? nextFreeColor(draftColors(draft)) }],
    },
  });
}

export function removeDraftPlayer(index) {
  update({
    setupDialog: {
      ...state.setupDialog,
      draft: state.setupDialog.draft.filter((_, it) => it !== index),
    },
  });
}

/** Tapping the swatch moves the player to the next colour nobody else has. */
export function cycleDraftColor(index) {
  const { draft } = state.setupDialog;
  const current = draft[index];
  if (!current) return;

  update({
    setupDialog: {
      ...state.setupDialog,
      draft: draft.map((it, at) => at === index
        ? { ...it, color: nextFreeColor(draftColors(draft, index), it.color) }
        : it),
    },
  });
}

/**
 * Turns the roster into real players. The first one ends up as storyteller, because
 * that is what updateStorytellerRoles() does with a fresh list - no special case needed.
 */
export function confirmSetup() {
  const { draft } = state.setupDialog;
  if (draft.length === 0) return;

  const players = draft.reduce((acc, { name, color }) => addPlayer(acc, {
    id: crypto.randomUUID(),
    name,
    color,
    score: 0,
    isStoryteller: false,
    isNextStoryteller: false,
    turnOrder: acc.length,
  }), []);

  const knownPlayers = draft.reduce(remember, state.knownPlayers);
  saveKnown(knownPlayers);

  update({
    players,
    roundNumber: 1,
    knownPlayers,
    setupDialog: { isOpen: false, draft: [] },
  });
}

// --- New game ---

export const toggleNewGameMenu = (isOpen) => update({ newGameMenuOpen: isOpen });

export const startGameWith = (playerId) =>
  update({
    players: startNewGame(state.players, playerId),
    roundNumber: 1,
    newGameMenuOpen: false,
  });

export const clearMessage = () => update({ message: null });
