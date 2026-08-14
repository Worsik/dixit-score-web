import { t } from '../i18n.js';
import { renderPlayerCard } from './player-card.js';

export function renderGameScreen(state) {
  return `
    <header class="top-bar">
      <img src="icons/logo.png" alt="${t('app_name')}">
      <div class="top-bar-actions">
        <button class="button-text" data-action="new-game">${t('new_game')}</button>
        <button class="button-text" data-action="add-player">${t('add_player')}</button>
      </div>
    </header>
    <ul class="player-list">${state.players.map(renderPlayerCard).join('')}</ul>
    <footer class="bottom-bar">
      <button class="button-primary" data-action="scoring">
        ${t('scoring_button_round', state.roundNumber)}
      </button>
    </footer>
  `;
}
