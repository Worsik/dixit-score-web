import { t } from '../i18n.js';
import { scoreRound, canConfirmBonusVotes } from '../rules.js';
import { escapeHtml, withAlpha } from './html.js';

/** Renders whichever of the three steps is current. */
export function renderScoringDialog(state) {
  const byId = new Map(state.players.map((player) => [player.id, player]));
  const { step } = state.scoringDialog;

  if (step === 'selection') return renderSelection(state, byId);
  if (step === 'bonus') return renderBonusVotes(state, byId);
  return renderSummary(state, byId);
}

// --- Step 1: who guessed the storyteller's card ---

function renderSelection(state, byId) {
  const { storytellerId, voterIds, selectedIds } = state.scoringDialog;
  // Deliberately without bonuses - the original does not show them in this step either.
  const { storytellerPoints, voterPoints } = scoreRound({ voterIds, selectedIds });

  const allSelected = selectedIds.length === voterIds.length && voterIds.length > 0;
  const noneSelected = selectedIds.length === 0;
  const triState = allSelected ? 'on' : noneSelected ? 'off' : 'indeterminate';

  const rows = voterIds.map((id) => `
    <li class="scoring-row">
      <label>
        <input type="checkbox" data-voter="${id}" ${selectedIds.includes(id) ? 'checked' : ''}>
        ${escapeHtml(byId.get(id).name)}
      </label>
      <span>+${voterPoints[id]}</span>
    </li>
  `).join('');

  return `
    <form method="dialog" class="dialog-body">
      <h2>${t('scoring_dialog_title')}</h2>
      <div class="scoring-row">
        <span>${t('scoring_dialog_storyteller_label')}
              ${escapeHtml(byId.get(storytellerId)?.name ?? '')}</span>
        <span>+${storytellerPoints}</span>
      </div>
      <p>${t('scoring_dialog_question')}</p>
      <label class="scoring-select-all">
        <input type="checkbox" id="select-all-voters" data-state="${triState}"
               ${allSelected ? 'checked' : ''}>
        ${t('select_all')}
      </label>
      <hr>
      <ul class="scoring-list">${rows}</ul>
      <div class="dialog-actions">
        <button type="button" class="button-text" data-action="scoring-cancel">
          ${t('cancel_button')}
        </button>
        <button type="button" class="button-primary" data-action="selection-confirm">
          ${t('confirm_button')}
        </button>
      </div>
    </form>
  `;
}

// --- Step 2: bonus votes for one's own card ---

function renderBonusVotes(state, byId) {
  const { voterIds, chosenForBonus, bonusAssignments, pointsToDistribute } = state.scoringDialog;
  const assigned = Object.values(bonusAssignments).reduce((sum, value) => sum + value, 0);
  const pointsLeft = pointsToDistribute - assigned;

  // Candidates are all voters - including those who guessed right.
  const candidates = voterIds.filter((id) => !chosenForBonus.includes(id));

  const tiles = candidates.map((id) => {
    const player = byId.get(id);
    return `<button type="button" class="bonus-tile" data-bonus-add="${id}"
              style="background: ${withAlpha(player.color, 0.2)}">
              ${escapeHtml(player.name)}
            </button>`;
  }).join('');

  const rows = chosenForBonus.map((id) => {
    const player = byId.get(id);
    const points = bonusAssignments[id] ?? 0;
    return `
      <li class="bonus-row" style="background: ${withAlpha(player.color, 0.2)}">
        <button type="button" class="icon-button" data-bonus-remove="${id}"
                aria-label="${t('scoring_bonus_votes_remove_player')}">&#128465;</button>
        <span class="bonus-name">${escapeHtml(player.name)}</span>
        <button type="button" class="icon-button" data-bonus-down="${id}"
                aria-label="-" ${points <= 0 ? 'disabled' : ''}>&#9660;</button>
        <span class="bonus-points">${points}</span>
        <button type="button" class="icon-button" data-bonus-up="${id}"
                aria-label="+" ${pointsLeft <= 0 ? 'disabled' : ''}>&#9650;</button>
      </li>
    `;
  }).join('');

  const assignSection = chosenForBonus.length === 0 ? '' : `
    <hr>
    <p class="label">${t('scoring_bonus_votes_assign_points')}</p>
    <ul class="bonus-list">${rows}</ul>
  `;

  const canConfirm = canConfirmBonusVotes(pointsToDistribute, chosenForBonus, bonusAssignments);

  return `
    <form method="dialog" class="dialog-body">
      <h2>${t('scoring_bonus_votes_title')}</h2>
      <p>${t('scoring_bonus_votes_points_to_distribute', pointsLeft)}</p>
      <p class="label">${t('scoring_bonus_votes_select_card')}</p>
      <div class="bonus-grid">${tiles}</div>
      ${assignSection}
      <div class="dialog-actions">
        <button type="button" class="button-text" data-action="bonus-back">
          ${t('back_button')}
        </button>
        <button type="button" class="button-primary" data-action="bonus-confirm"
                ${canConfirm ? '' : 'disabled'}>
          ${t('confirm_button')}
        </button>
      </div>
    </form>
  `;
}

// --- Step 3: summary ---

function renderSummary(state, byId) {
  const { storytellerId, voterIds, selectedIds, bonusAssignments } = state.scoringDialog;
  // Here the bonuses ARE included.
  const { storytellerPoints, voterPoints } =
    scoreRound({ voterIds, selectedIds, bonusAssignments });

  const storyteller = byId.get(storytellerId);
  const rows = voterIds.map((id) => {
    const player = byId.get(id);
    return `
      <li class="summary-row" style="background: ${withAlpha(player.color, 0.2)}">
        <span>${escapeHtml(player.name)}</span>
        <span>+${voterPoints[id]}</span>
      </li>
    `;
  }).join('');

  return `
    <form method="dialog" class="dialog-body">
      <h2>${t('scoring_dialog_title')}</h2>
      <ul class="summary-list">
        <li class="summary-row is-storyteller"
            style="background: ${withAlpha(storyteller?.color ?? '#888888', 0.2)}">
          <span>${escapeHtml(storyteller?.name ?? '')}</span>
          <span>+${storytellerPoints}</span>
        </li>
      </ul>
      <hr>
      <ul class="summary-list">${rows}</ul>
      <div class="dialog-actions">
        <button type="button" class="button-text" data-action="summary-back">
          ${t('back_button')}
        </button>
        <button type="button" class="button-primary" data-action="summary-confirm">
          ${t('confirm_button')}
        </button>
      </div>
    </form>
  `;
}
