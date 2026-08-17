import { t } from '../i18n.js';
import { suggest } from '../known-players.js';
import { MAX_PLAYERS } from '../rules.js';
import { swatchFill } from '../palette.js';
import { escapeHtml, withAlpha } from './html.js';

/** Recent names, minus anyone already on the roster being composed. */
function renderSuggestions(known) {
  if (!known.length) return '';

  const tiles = known.map((player) => `
    <button type="button" class="known-player" data-setup-known="${escapeHtml(player.name)}"
            data-setup-color="${player.color}"
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

/** The roster so far. The swatch is a button - tapping it cycles to the next colour. */
function renderDraft(draft, hasSuggestions) {
  // On the very first run there are no tiles above, so pointing at them would be a lie.
  if (!draft.length) {
    return `<p class="setup-empty">${t(hasSuggestions ? 'setup_empty' : 'setup_empty_first')}</p>`;
  }

  const rows = draft.map((player, index) => `
    <li class="setup-row">
      <button type="button" class="setup-swatch" data-setup-cycle="${index}"
              style="background: ${swatchFill(player.color)}"
              aria-label="${t('setup_change_color')}"></button>
      <span class="setup-name">${escapeHtml(player.name)}</span>
      <button type="button" class="icon-button" data-setup-remove="${index}"
              aria-label="${t('setup_remove_player')}">&#10005;</button>
    </li>
  `).join('');

  return `<ul class="setup-list">${rows}</ul>`;
}

export function renderSetupDialog(state) {
  const { draft } = state.setupDialog;
  const isFull = draft.length >= MAX_PLAYERS;
  const known = suggest(state.knownPlayers, draft);

  return `
    <form method="dialog" class="dialog-body">
      <!-- The heading takes the initial focus, so the keyboard does not open over the
           recent-player tiles - the same reason as in the other dialogs (AD-4). -->
      <h2 tabindex="-1" autofocus>${t('new_game')}</h2>
      ${renderSuggestions(known)}
      ${renderDraft(draft, known.length > 0)}
      <div class="setup-add">
        <input type="text" id="setup-name" autocomplete="off"
               placeholder="${t('player_name_label')}" ${isFull ? 'disabled' : ''}>
        <button type="button" class="button-text" data-action="setup-add" disabled>
          ${t('add_button')}
        </button>
      </div>
      <div class="dialog-actions">
        <button type="button" class="button-text" data-action="setup-cancel">
          ${t('cancel_button')}
        </button>
        <button type="button" class="button-primary" data-action="setup-confirm"
                ${draft.length === 0 ? 'disabled' : ''}>
          ${t('setup_start_button')}
        </button>
      </div>
    </form>
  `;
}
