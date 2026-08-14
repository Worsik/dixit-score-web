import { t } from '../i18n.js';
import { escapeHtml, withAlpha } from './html.js';

export function renderPlayerCard(player) {
  const roles = [
    player.isStoryteller ? t('storyteller') : null,
    player.isNextStoryteller ? t('next_storyteller') : null,
  ].filter(Boolean);

  return `
    <li class="player-card" data-player-id="${player.id}"
        style="background: ${withAlpha(player.color, 0.2)}">
      <div class="player-card-info">
        <span class="player-card-name">${escapeHtml(player.name)}</span>
        ${roles.map((role) => `<span class="player-card-role">${role}</span>`).join('')}
      </div>
      <span class="player-card-score">${player.score}</span>
    </li>
  `;
}
