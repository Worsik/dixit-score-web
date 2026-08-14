import { addPlayer, removePlayer, MAX_PLAYERS } from './rules.js';
import { save, load } from './storage.js';
import { DEFAULT_COLOR } from './palette.js';

let state = {
  players: [],
  roundNumber: 1,
  addDialog: { isOpen: false, selectedColor: DEFAULT_COLOR },
  editDialog: { isOpen: false, playerId: null, selectedColor: DEFAULT_COLOR, confirmDelete: false },
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

export const clearMessage = () => update({ message: null });
