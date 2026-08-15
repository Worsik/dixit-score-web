import {
  addPlayer, removePlayer, movePlayer as reorderPlayers, startNewGame, applyScores,
  scoreRound, pointsToDistribute as countPointsToDistribute, remainingBonusPoints,
  MAX_PLAYERS,
} from './rules.js';
import { save, load } from './storage.js';
import { DEFAULT_COLOR } from './palette.js';

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
  addDialog: { isOpen: false, selectedColor: DEFAULT_COLOR },
  editDialog: { isOpen: false, playerId: null, selectedColor: DEFAULT_COLOR, confirmDelete: false },
  scoringDialog: { ...EMPTY_SCORING },
  newGameMenuOpen: false,
  message: null,
};

const listeners = new Set();

export const getState = () => state;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Applies a patch, persists the game part and notifies subscribers.
function update(patch) {
  state = { ...state, ...patch };
  save({ players: state.players, roundNumber: state.roundNumber });
  listeners.forEach((listener) => listener());
}

/** Restores a stored game, if there is one. */
export function init() {
  const stored = load();
  if (stored) {
    state = { ...state, players: stored.players, roundNumber: stored.roundNumber };
  }
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
  update({
    players: addPlayer(state.players, newPlayer),
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

// --- New game ---

export const toggleNewGameMenu = (isOpen) => update({ newGameMenuOpen: isOpen });

export const startGameWith = (playerId) =>
  update({
    players: startNewGame(state.players, playerId),
    roundNumber: 1,
    newGameMenuOpen: false,
  });

export const clearMessage = () => update({ message: null });
