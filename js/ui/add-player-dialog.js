import { t } from '../i18n.js';
import { renderColorPicker } from './color-picker.js';

export function renderAddPlayerDialog(state) {
  return `
    <form method="dialog" class="dialog-body">
      <h2>${t('add_new_player_title')}</h2>
      <label class="field">
        <span>${t('player_name_label')}</span>
        <input type="text" id="add-name" autocomplete="off">
      </label>
      ${renderColorPicker(state.addDialog.selectedColor)}
      <div class="dialog-actions">
        <button type="button" class="button-text" data-action="add-cancel">
          ${t('cancel_button')}
        </button>
        <button type="button" class="button-primary" data-action="add-confirm" disabled>
          ${t('add_button')}
        </button>
      </div>
    </form>
  `;
}
