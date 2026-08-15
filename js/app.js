import {
  getState, subscribe, init,
  openAddDialog, closeAddDialog, setAddColor, confirmAddPlayer,
  openEditDialog, closeEditDialog, setEditColor, confirmEditPlayer,
  askDeleteConfirm, cancelDeleteConfirm, confirmDeletePlayer,
  openScoring, closeScoring, toggleVoter, selectAllVoters, confirmSelection,
  backToSelection, addBonusPlayer, removeBonusPlayer, incrementBonus, decrementBonus,
  confirmBonusVotes, backFromSummary, confirmScores,
  toggleNewGameMenu, startGameWith, movePlayer,
  clearMessage,
} from './state.js';
import { t } from './i18n.js';
import { attachReorder } from './ui/reorderable-list.js';
import { renderGameScreen } from './ui/game-screen.js';
import { renderAddPlayerDialog } from './ui/add-player-dialog.js';
import { renderEditPlayerDialog, renderConfirmDeleteDialog } from './ui/edit-player-dialog.js';
import { renderScoringDialog } from './ui/scoring-dialog.js';
import { syncDialog } from './ui/dialog.js';

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const addDialog = document.querySelector('#add-dialog');
const editDialog = document.querySelector('#edit-dialog');
const confirmDeleteDialog = document.querySelector('#confirm-delete-dialog');
const scoringDialog = document.querySelector('#scoring-dialog');

// --- Rendering ---

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

  syncDialog(scoringDialog, state.scoringDialog.isOpen, () => renderScoringDialog(state));
  refreshTriStateCheckbox();

  if (state.message) showToast(t(state.message));
}

// "indeterminate" is a DOM property, not an attribute - it cannot come from the markup.
function refreshTriStateCheckbox() {
  const box = scoringDialog.querySelector('#select-all-voters');
  if (box) box.indeterminate = box.dataset.state === 'indeterminate';
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
  if (event.target.closest('[data-action="add-player"]')) return openAddDialog();
  if (event.target.closest('[data-action="scoring"]')) return openScoring();

  if (event.target.closest('[data-action="new-game"]')) {
    return toggleNewGameMenu(!getState().newGameMenuOpen);
  }

  const menuChoice = event.target.closest('[data-new-game-player]');
  if (menuChoice) return startGameWith(menuChoice.dataset.newGamePlayer);

  const card = event.target.closest('[data-player-id]');
  if (card) openEditDialog(card.dataset.playerId);
});

// Clicking anywhere else closes the new game menu, like the original dropdown.
document.addEventListener('click', (event) => {
  if (!getState().newGameMenuOpen) return;
  if (event.target.closest('.menu')) return;
  toggleNewGameMenu(false);
});

// --- Add player dialog ---

addDialog.addEventListener('input', () =>
  refreshConfirmState(addDialog, 'add-name', 'add-confirm'));

addDialog.addEventListener('click', (event) => {
  // A recent-name tile fills the uncontrolled input directly; setAddColor then
  // re-renders, and syncDialog carries the value we just wrote across the render.
  const known = event.target.closest('[data-known-name]');
  if (known) {
    addDialog.querySelector('#add-name').value = known.dataset.knownName;
    return setAddColor(known.dataset.knownColor);
  }

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

// --- Scoring dialog ---

scoringDialog.addEventListener('change', (event) => {
  const { voter } = event.target.dataset;
  if (voter) return toggleVoter(voter, event.target.checked);
  if (event.target.id === 'select-all-voters') {
    // Clicking while fully checked clears the selection, otherwise it selects everyone.
    selectAllVoters(event.target.dataset.state !== 'on');
  }
});

scoringDialog.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const d = button.dataset;

  if (d.bonusAdd) return addBonusPlayer(d.bonusAdd);
  if (d.bonusRemove) return removeBonusPlayer(d.bonusRemove);
  if (d.bonusUp) return incrementBonus(d.bonusUp);
  if (d.bonusDown) return decrementBonus(d.bonusDown);

  switch (d.action) {
    case 'scoring-cancel': return closeScoring();
    case 'selection-confirm': return confirmSelection();
    case 'bonus-back': return backToSelection();
    case 'bonus-confirm': return confirmBonusVotes();
    case 'summary-back': return backFromSummary();
    case 'summary-confirm': return confirmScores();
  }
});

scoringDialog.addEventListener('submit', (event) => event.preventDefault());

scoringDialog.addEventListener('close', () => {
  if (getState().scoringDialog.isOpen) closeScoring();
});

// --- Drag reordering ---

// Attached to #app, which survives re-renders; the list inside it does not.
// Works in both layouts - the column and the two-column grid.
attachReorder(app, { onMove: movePlayer });

// --- PWA ---

// Registration failing must never break the app - it only means no offline mode.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

/**
 * Safari never offers to install a web app, so iOS users need telling.
 * Shown only on iOS and only while the app runs in a browser tab.
 */
function showIosInstallHint() {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = navigator.standalone === true
    || window.matchMedia('(display-mode: standalone)').matches;
  if (!isIos || isStandalone) return;

  const hint = document.querySelector('#ios-hint');
  hint.textContent = t('ios_install_hint');
  hint.hidden = false;
  hint.addEventListener('click', () => { hint.hidden = true; });
}

// --- Start ---

init();
subscribe(render);
render();
showIosInstallHint();
