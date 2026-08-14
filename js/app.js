import {
  getState, subscribe, init,
  openAddDialog, closeAddDialog, setAddColor, confirmAddPlayer,
  openEditDialog, closeEditDialog, setEditColor, confirmEditPlayer,
  askDeleteConfirm, cancelDeleteConfirm, confirmDeletePlayer,
  clearMessage,
} from './state.js';
import { t } from './i18n.js';
import { renderGameScreen } from './ui/game-screen.js';
import { renderAddPlayerDialog } from './ui/add-player-dialog.js';
import { renderEditPlayerDialog, renderConfirmDeleteDialog } from './ui/edit-player-dialog.js';

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const addDialog = document.querySelector('#add-dialog');
const editDialog = document.querySelector('#edit-dialog');
const confirmDeleteDialog = document.querySelector('#confirm-delete-dialog');

// --- Rendering ---

/**
 * Re-renders a dialog while keeping uncontrolled text inputs intact.
 * Without this, picking a colour would wipe a half-typed name.
 */
function syncDialog(dialog, isOpen, renderContent, inputIds = []) {
  if (!isOpen) {
    if (dialog.open) dialog.close();
    return;
  }

  const saved = inputIds.map((id) => dialog.querySelector(`#${id}`)?.value);
  dialog.innerHTML = renderContent();
  inputIds.forEach((id, index) => {
    const input = dialog.querySelector(`#${id}`);
    if (input && saved[index] !== undefined) input.value = saved[index];
  });

  if (!dialog.open) dialog.showModal();
}

/** Confirm buttons stay disabled while the name is empty. */
function refreshConfirmState(dialog, nameId, action) {
  const input = dialog.querySelector(`#${nameId}`);
  const button = dialog.querySelector(`[data-action="${action}"]`);
  if (input && button) button.disabled = !input.value.trim();
}

function render() {
  const state = getState();

  app.innerHTML = renderGameScreen(state);
  document.title = t('app_name');

  syncDialog(addDialog, state.addDialog.isOpen,
    () => renderAddPlayerDialog(state), ['add-name']);
  refreshConfirmState(addDialog, 'add-name', 'add-confirm');

  syncDialog(editDialog, state.editDialog.isOpen,
    () => renderEditPlayerDialog(state), ['edit-name', 'edit-score']);
  refreshConfirmState(editDialog, 'edit-name', 'edit-confirm');

  const editedPlayer = state.players.find((it) => it.id === state.editDialog.playerId);
  syncDialog(confirmDeleteDialog, state.editDialog.confirmDelete && Boolean(editedPlayer),
    () => renderConfirmDeleteDialog(editedPlayer));

  if (state.message) showToast(t(state.message));
}

// Stands in for the Android Snackbar. Not alert() - that blocks and looks nothing like it.
let toastTimer = null;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    clearMessage();
  }, 3000);
}

// --- Main screen ---

app.addEventListener('click', (event) => {
  if (event.target.closest('[data-action="add-player"]')) {
    openAddDialog();
    return;
  }
  const card = event.target.closest('[data-player-id]');
  if (card) openEditDialog(card.dataset.playerId);
});

// --- Add player dialog ---

addDialog.addEventListener('input', () =>
  refreshConfirmState(addDialog, 'add-name', 'add-confirm'));

addDialog.addEventListener('click', (event) => {
  const { action, color } = event.target.dataset;
  if (color) setAddColor(color);
  if (action === 'add-cancel') closeAddDialog();
  if (action === 'add-confirm') confirmAddPlayer(addDialog.querySelector('#add-name').value);
});

// Enter inside the form means "confirm", not "close without saving".
addDialog.addEventListener('submit', (event) => {
  event.preventDefault();
  confirmAddPlayer(addDialog.querySelector('#add-name').value);
});

addDialog.addEventListener('close', () => {
  if (getState().addDialog.isOpen) closeAddDialog();
});

// --- Edit player dialog ---

editDialog.addEventListener('input', () =>
  refreshConfirmState(editDialog, 'edit-name', 'edit-confirm'));

editDialog.addEventListener('click', (event) => {
  const { action, color } = event.target.dataset;
  const scoreInput = editDialog.querySelector('#edit-score');

  if (color) return setEditColor(color);

  // The score field is uncontrolled - the buttons nudge the DOM value directly.
  if (action === 'score-up' || action === 'score-down') {
    const current = Number.parseInt(scoreInput.value, 10) || 0;
    scoreInput.value = current + (action === 'score-up' ? 1 : -1);
    return;
  }

  if (action === 'edit-cancel') closeEditDialog();
  if (action === 'edit-delete') askDeleteConfirm();
  if (action === 'edit-confirm') {
    confirmEditPlayer(editDialog.querySelector('#edit-name').value, scoreInput.value);
  }
});

editDialog.addEventListener('submit', (event) => {
  event.preventDefault();
  confirmEditPlayer(
    editDialog.querySelector('#edit-name').value,
    editDialog.querySelector('#edit-score').value
  );
});

editDialog.addEventListener('close', () => {
  if (getState().editDialog.isOpen) closeEditDialog();
});

// --- Delete confirmation ---

confirmDeleteDialog.addEventListener('click', (event) => {
  const { action } = event.target.dataset;
  if (action === 'delete-cancel') cancelDeleteConfirm();
  if (action === 'delete-confirm') confirmDeletePlayer();
});

confirmDeleteDialog.addEventListener('submit', (event) => event.preventDefault());

confirmDeleteDialog.addEventListener('close', () => {
  if (getState().editDialog.confirmDelete) cancelDeleteConfirm();
});

// --- Start ---

init();
subscribe(render);
render();
