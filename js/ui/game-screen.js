import { t } from '../i18n.js';
import { GRID_THRESHOLD } from '../rules.js';
import { renderPlayerCard } from './player-card.js';
import { escapeHtml } from './html.js';

/** Dropdown for picking who starts the new game as storyteller. */
function renderNewGameMenu(state) {
  if (!state.newGameMenuOpen) return '';
  const items = state.players.map((player) => `
    <li><button type="button" class="menu-item" data-new-game-player="${player.id}">
      ${escapeHtml(player.name)}
    </button></li>
  `).join('');
  return `<ul class="menu-items">${items}</ul>`;
}

export function renderGameScreen(state) {
  return `
    <header class="top-bar">
      <img src="icons/logo.jpg" alt="${t('app_name')}">
      <div class="top-bar-actions">
        <div class="menu">
          <button class="button-text" data-action="new-game">${t('new_game')}</button>
          ${renderNewGameMenu(state)}
        </div>
        <button class="button-text" data-action="add-player">${t('add_player')}</button>
        ${state.undo ? `<button class="button-text" data-action="undo"
                          title="${t('undo_hint')}">&#8630; ${t('undo_button')}</button>` : ''}
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
