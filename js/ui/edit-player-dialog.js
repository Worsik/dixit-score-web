import { t } from '../i18n.js';
import { renderColorPicker } from './color-picker.js';
import { escapeHtml } from './html.js';

export function renderEditPlayerDialog(state) {
  const player = state.players.find((it) => it.id === state.editDialog.playerId);
  if (!player) return '';

  // The heading takes the initial focus on purpose: showModal() would otherwise focus the
  // name field, and the on-screen keyboard would cover the palette and the score editor.
  // Editing a player is usually about the score or the colour, not about renaming.
  return `
    <form method="dialog" class="dialog-body">
      <h2 tabindex="-1" autofocus>${t('edit_player_title')}</h2>
      <label class="field">
        <span>${t('player_name_label')}</span>
        <input type="text" id="edit-name" value="${escapeHtml(player.name)}" autocomplete="off">
      </label>
      ${renderColorPicker(state.editDialog.selectedColor)}
      <hr>
      <div class="score-editor">
        <span>${t('edit_score_button')}</span>
        <button type="button" class="button-primary" data-action="score-down"
                aria-label="-">&#9660;</button>
        <input type="text" inputmode="numeric" id="edit-score" value="${player.score}">
        <button type="button" class="button-primary" data-action="score-up"
                aria-label="+">&#9650;</button>
      </div>
      <div class="dialog-actions">
        <button type="button" class="button-text button-danger" data-action="edit-delete">
          ${t('delete_button')}
        </button>
        <button type="button" class="button-text" data-action="edit-cancel">
          ${t('cancel_button')}
        </button>
        <button type="button" class="button-primary" data-action="edit-confirm">
          ${t('save_button')}
        </button>
      </div>
    </form>
  `;
}

export function renderConfirmDeleteDialog(player) {
  return `
    <form method="dialog" class="dialog-body">
      <h2>${t('delete_player_confirmation_title')}</h2>
      <p>${escapeHtml(t('delete_player_confirmation_message', player.name))}</p>
      <div class="dialog-actions">
        <button type="button" class="button-text" data-action="delete-cancel">
          ${t('cancel_button')}
        </button>
        <button type="button" class="button-primary button-delete" data-action="delete-confirm">
          ${t('delete_button')}
        </button>
      </div>
    </form>
  `;
}
