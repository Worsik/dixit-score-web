import { t } from '../i18n.js';
import { renderColorPicker } from './color-picker.js';
import { suggest } from '../known-players.js';
import { escapeHtml, withAlpha } from './html.js';

/** Tiles with recently used names. Tapping one fills in the name and the colour. */
function renderSuggestions(state) {
  const known = suggest(state.knownPlayers, state.players);
  if (!known.length) return '';

  const tiles = known.map((player) => `
    <button type="button" class="known-player" data-known-name="${escapeHtml(player.name)}"
            data-known-color="${player.color}"
            style="background: ${withAlpha(player.color, 0.2)}">
      ${escapeHtml(player.name)}
    </button>
  `).join('');

  return `
    <div class="known-players">
      <span class="known-players-label">${t('recent_players')}</span>
      <div class="known-players-tiles">${tiles}</div>
    </div>
  `;
}

export function renderAddPlayerDialog(state) {
  return `
    <form method="dialog" class="dialog-body">
      <!-- The heading takes the initial focus. showModal() would otherwise focus the
           first tile, which looks like a selection - and before the tiles existed it
           focused the name field and opened the keyboard over them. -->
      <h2 tabindex="-1" autofocus>${t('add_new_player_title')}</h2>
      ${renderSuggestions(state)}
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
