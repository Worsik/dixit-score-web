import { t } from '../i18n.js';
import { GRID_THRESHOLD } from '../rules.js';
import { renderPlayerCard } from './player-card.js';
import { escapeHtml } from './html.js';

/** Dropdown for picking who starts the new game as storyteller. */
function renderNewGameMenu(state) {
  if (state.openMenu !== 'new-game') return '';
  const items = state.players.map((player) => `
    <li><button type="button" class="menu-item" data-new-game-player="${player.id}">
      ${escapeHtml(player.name)}
    </button></li>
  `).join('');
  return `<ul class="menu-items">${items}</ul>`;
}

/**
 * Everything that is not reached every round. As text buttons these would each cost a row -
 * the actions column is a column, so a fourth action meant a taller bar, not a wider one.
 */
function renderOverflowMenu(state) {
  if (state.openMenu !== 'overflow') return '';

  // Left out while the roster is empty: the main button then reads "New game" too and
  // opens the very same dialog, so the item would be the same word twice on one screen.
  const newGame = state.players.length === 0 ? '' : `
    <li class="menu-separator" role="separator"></li>
    <li><button type="button" class="menu-item" data-action="setup">${t('new_game')}</button></li>
  `;

  return `
    <ul class="menu-items">
      <li><button type="button" class="menu-item" data-action="add-player">
        ${t('add_player')}
      </button></li>
      <li><button type="button" class="menu-item" data-action="help">
        ${t('help_button')}
      </button></li>
      ${newGame}
    </ul>
  `;
}

export function renderGameScreen(state) {
  // With nobody on the list there is no storyteller to pick, so the button opens the
  // setup dialog instead of an empty menu; with players it resets the scores as before.
  const isFirstGame = state.players.length === 0;

  return `
    <header class="top-bar">
      <img src="icons/logo.jpg" alt="${t('app_name')}">
      <div class="top-bar-actions">
        <div class="menu">
          <button class="button-text" data-action="${isFirstGame ? 'setup' : 'new-game'}">
            ${isFirstGame ? t('new_game') : t('next_game')}
          </button>
          ${renderNewGameMenu(state)}
        </div>
        <div class="top-bar-icons">
          <!-- Undo stays out of the menu on purpose: it is the recovery from a mis-tap,
               and one that has to be hunted for is no longer a recovery. -->
          ${state.undo ? `<button class="icon-button" data-action="undo"
                            aria-label="${t('undo_button')}"
                            title="${t('undo_hint')}">&#8630;</button>` : ''}
          <div class="menu">
            <button class="icon-button" data-action="overflow"
                    aria-label="${t('menu_button')}" title="${t('menu_button')}">&#8942;</button>
            ${renderOverflowMenu(state)}
          </div>
        </div>
      </div>
    </header>
    <ul class="player-list${state.players.length > GRID_THRESHOLD ? ' is-grid' : ''}">
      ${state.players.map(renderPlayerCard).join('')}
    </ul>
    <footer class="bottom-bar">
      <!-- Without players there is no storyteller and openScoring() would do nothing at
           all; a disabled button says so instead of looking broken. -->
      <button class="button-primary" data-action="scoring"
              ${state.players.length === 0 ? `disabled title="${t('no_players_for_scoring')}"` : ''}>
        ${t('scoring_button_round', state.roundNumber)}
      </button>
    </footer>
  `;
}
