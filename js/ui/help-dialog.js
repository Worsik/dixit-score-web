import { t } from '../i18n.js';

/**
 * "How to play" - a walkthrough of one round, illustrated.
 *
 * The drawings are hand-written SVG rather than scans: the Dixit artwork is copyrighted,
 * and a handful of images would blow the offline cache budget we fought down in AD-10.
 * For explaining who played which card, abstract shapes read better than real art anyway.
 *
 * The example uses FOUR players on purpose. Three is the exception in the rules - seven
 * cards, two laid out each - so opening with it would teach the base flow wrong.
 */

/** Card faces and the back, defined once and stamped out with <use>. */
function renderSprite() {
  return `
    <svg class="help-sprite" width="0" height="0" aria-hidden="true">
      <defs>
        <symbol id="help-back" viewBox="0 0 44 62">
          <rect x="1" y="1" width="42" height="60" rx="5" fill="#4A4A4A"
                stroke="#1C1B1F" stroke-width="1.5"/>
          <circle cx="22" cy="31" r="9" fill="none" stroke="#F6D58E" stroke-width="1.5"/>
          <circle cx="22" cy="31" r="4" fill="#F6D58E"/>
        </symbol>
        <symbol id="help-c1" viewBox="0 0 44 62">
          <rect x="1" y="1" width="42" height="60" rx="5" fill="#EDE7F6"
                stroke="#1C1B1F" stroke-width="1.5"/>
          <circle cx="30" cy="17" r="7" fill="#7E6BA8"/>
          <path d="M5 48 L16 31 L27 48 Z" fill="#4F4370"/>
          <path d="M20 48 L29 36 L38 48 Z" fill="#9B8CC4"/>
        </symbol>
        <symbol id="help-c2" viewBox="0 0 44 62">
          <rect x="1" y="1" width="42" height="60" rx="5" fill="#E3F1EC"
                stroke="#1C1B1F" stroke-width="1.5"/>
          <ellipse cx="22" cy="34" rx="11" ry="14" fill="#F3EFE2"
                   stroke="#3E7A66" stroke-width="1.5"/>
          <path d="M6 52 Q22 40 38 52" fill="none" stroke="#3E7A66" stroke-width="2"/>
          <circle cx="22" cy="32" r="3" fill="#3E7A66"/>
        </symbol>
        <symbol id="help-c3" viewBox="0 0 44 62">
          <rect x="1" y="1" width="42" height="60" rx="5" fill="#FBEAD9"
                stroke="#1C1B1F" stroke-width="1.5"/>
          <circle cx="22" cy="26" r="10" fill="none" stroke="#B56A32" stroke-width="2"/>
          <path d="M22 26 L22 19 M22 26 L28 29" stroke="#B56A32" stroke-width="2"
                stroke-linecap="round"/>
          <rect x="10" y="43" width="24" height="10" rx="2" fill="#D89A63"/>
        </symbol>
        <symbol id="help-c4" viewBox="0 0 44 62">
          <rect x="1" y="1" width="42" height="60" rx="5" fill="#E7EEF8"
                stroke="#1C1B1F" stroke-width="1.5"/>
          <rect x="9" y="24" width="8" height="28" fill="#43618F"/>
          <rect x="19" y="16" width="8" height="36" fill="#5C7FB5"/>
          <rect x="29" y="30" width="7" height="22" fill="#8AA6D0"/>
          <circle cx="23" cy="9" r="4" fill="#43618F"/>
        </symbol>
        <symbol id="help-c5" viewBox="0 0 44 62">
          <rect x="1" y="1" width="42" height="60" rx="5" fill="#F7E6EE"
                stroke="#1C1B1F" stroke-width="1.5"/>
          <path d="M22 12 Q34 30 22 50 Q10 30 22 12 Z" fill="#B5578A"/>
          <circle cx="22" cy="31" r="4" fill="#F7E6EE"/>
        </symbol>
        <symbol id="help-c6" viewBox="0 0 44 62">
          <rect x="1" y="1" width="42" height="60" rx="5" fill="#FDF3D8"
                stroke="#1C1B1F" stroke-width="1.5"/>
          <circle cx="22" cy="31" r="14" fill="none" stroke="#A88320" stroke-width="1.5"/>
          <circle cx="22" cy="31" r="9" fill="none" stroke="#A88320" stroke-width="1.5"/>
          <circle cx="22" cy="31" r="4" fill="#A88320"/>
        </symbol>
      </defs>
    </svg>
  `;
}

const HAND = `
  <svg class="help-art" viewBox="0 0 320 118" role="img" aria-hidden="true">
    <g transform="translate(96 30)">
      <g transform="rotate(-24 22 62)"><use href="#help-c1" width="44" height="62"/></g>
      <g transform="rotate(-14 22 62) translate(16 0)"><use href="#help-c2" width="44" height="62"/></g>
      <g transform="rotate(-5 22 62) translate(32 0)"><use href="#help-c3" width="44" height="62"/></g>
      <g transform="rotate(5 22 62) translate(48 0)"><use href="#help-c4" width="44" height="62"/></g>
      <g transform="rotate(14 22 62) translate(64 0)"><use href="#help-c5" width="44" height="62"/></g>
      <g transform="rotate(24 22 62) translate(80 0)"><use href="#help-c6" width="44" height="62"/></g>
    </g>
  </svg>
`;

const CLUE = `
  <svg class="help-art" viewBox="0 0 320 120" role="img" aria-hidden="true">
    <rect x="14" y="20" width="164" height="34" rx="17" fill="#FFFDF6"
          stroke="#1C1B1F" stroke-width="1.5"/>
    <path d="M56 54 L64 68 L72 54 Z" fill="#FFFDF6" stroke="#1C1B1F" stroke-width="1.5"/>
    <path d="M58 54 L70 54" stroke="#FFFDF6" stroke-width="3"/>
    <text x="96" y="42" text-anchor="middle" font-size="13" font-style="italic"
          fill="#1C1B1F">„Mám narozeniny!“</text>
    <g transform="translate(214 24)"><use href="#help-c2" width="62" height="88"/></g>
  </svg>
`;

const PASSING = `
  <svg class="help-art" viewBox="0 0 320 104" role="img" aria-hidden="true">
    <g transform="translate(14 20)"><use href="#help-back" width="44" height="62"/></g>
    <g transform="translate(94 20)"><use href="#help-back" width="44" height="62"/></g>
    <g transform="translate(174 20)"><use href="#help-back" width="44" height="62"/></g>
    <path d="M226 51 L262 51" stroke="#1C1B1F" stroke-width="2" stroke-linecap="round"/>
    <path d="M255 45 L262 51 L255 57" fill="none" stroke="#1C1B1F" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(268 20)"><use href="#help-c2" width="44" height="62"/></g>
  </svg>
`;

const LAYOUT = `
  <svg class="help-art" viewBox="0 0 320 112" role="img" aria-hidden="true">
    <g transform="translate(20 10)"><use href="#help-c4" width="52" height="73"/></g>
    <g transform="translate(96 10)"><use href="#help-c2" width="52" height="73"/></g>
    <g transform="translate(172 10)"><use href="#help-c5" width="52" height="73"/></g>
    <g transform="translate(248 10)"><use href="#help-c1" width="52" height="73"/></g>
    <g font-size="13" fill="#1C1B1F" text-anchor="middle">
      <text x="46" y="102">1</text>
      <text x="122" y="102">2</text>
      <text x="198" y="102">3</text>
      <text x="274" y="102">4</text>
    </g>
  </svg>
`;

/**
 * The tokens are drawn still in their owners' hands, BELOW the cards - not sitting on
 * them. Tokens already placed would show the reveal, not the secret vote, and would
 * illustrate exactly the habit this step warns about: put your token straight onto the
 * card and you have told everyone else the answer.
 *
 * Token colours come from the player palette, painted with the same 20% wash as cards.
 */
const VOTING = `
  <svg class="help-art" viewBox="0 0 320 148" role="img" aria-hidden="true">
    <g transform="translate(20 4)"><use href="#help-c4" width="52" height="73"/></g>
    <g transform="translate(96 4)"><use href="#help-c2" width="52" height="73"/></g>
    <g transform="translate(172 4)"><use href="#help-c5" width="52" height="73"/></g>
    <g transform="translate(248 4)"><use href="#help-c1" width="52" height="73"/></g>
    <g font-size="12" fill="#1C1B1F" text-anchor="middle">
      <text x="46" y="94">1</text>
      <text x="122" y="94">2</text>
      <text x="198" y="94">3</text>
      <text x="274" y="94">4</text>
    </g>

    <line x1="8" y1="106" x2="312" y2="106" stroke="#79747E" stroke-width="1.5"
          stroke-dasharray="5 4"/>

    <g stroke="#1C1B1F" stroke-width="1.5" text-anchor="middle" font-size="12">
      <circle cx="80" cy="126" r="12" fill="#0000FF33"/>
      <text x="80" y="131" stroke="none" fill="#1C1B1F">2</text>
      <path d="M63 137 Q80 150 97 137" fill="none" stroke-linecap="round"/>

      <circle cx="160" cy="126" r="12" fill="#FFFF0033"/>
      <text x="160" y="131" stroke="none" fill="#1C1B1F">2</text>
      <path d="M143 137 Q160 150 177 137" fill="none" stroke-linecap="round"/>

      <circle cx="240" cy="126" r="12" fill="#FF000033"/>
      <text x="240" y="131" stroke="none" fill="#1C1B1F">4</text>
      <path d="M223 137 Q240 150 257 137" fill="none" stroke-linecap="round"/>
    </g>
  </svg>
`;

const SCORING = `
  <svg class="help-art" viewBox="0 0 320 132" role="img" aria-hidden="true">
    <g font-size="11" fill="#1C1B1F">
      <rect x="8" y="6" width="304" height="36" rx="8" fill="#FFFDF6" stroke="#79747E"/>
      <text x="18" y="22">Uhodli všichni, nebo nikdo</text>
      <text x="18" y="36" fill="#4A4A4A">vypravěč 0 · ostatní +2</text>
      <rect x="8" y="48" width="304" height="36" rx="8" fill="#FFFDF6" stroke="#79747E"/>
      <text x="18" y="64">Uhodl někdo, ale ne všichni</text>
      <text x="18" y="78" fill="#4A4A4A">vypravěč +3 · kdo uhodl +3</text>
      <rect x="8" y="90" width="304" height="36" rx="8" fill="none" stroke="#79747E"
            stroke-dasharray="4 3"/>
      <text x="18" y="106">Navíc</text>
      <text x="18" y="120" fill="#4A4A4A">+1 za každý hlas na tvou vlastní kartu</text>
    </g>
  </svg>
`;

const STEPS = [
  ['help_step1', HAND],
  ['help_step2', CLUE],
  ['help_step3', PASSING],
  ['help_step4', LAYOUT],
  ['help_step5', VOTING],
  ['help_step6', SCORING],
];

function renderStep([key, art], index) {
  return `
    <li class="help-step">
      <span class="help-num">${index + 1}</span>
      <h3>${t(`${key}_title`)}</h3>
      <p>${t(`${key}_text`)}</p>
      ${art}
    </li>
  `;
}

function renderNote(key) {
  return `
    <section class="help-note">
      <h3>${t(`${key}_title`)}</h3>
      <p>${t(`${key}_text`)}</p>
    </section>
  `;
}

export function renderHelpDialog() {
  return `
    <form method="dialog" class="dialog-body">
      <!-- The heading takes the initial focus; there is no text field here, but a focused
           Close button would read as the point of the dialog (AD-4). -->
      <h2 tabindex="-1" autofocus>${t('help_title')}</h2>
      ${renderSprite()}
      <div class="help-scroll">
        <p class="help-intro">${t('help_intro')}</p>
        <ol class="help-steps">${STEPS.map(renderStep).join('')}</ol>
        ${renderNote('help_round')}
        ${renderNote('help_end')}
        ${renderNote('help_three')}
      </div>
      <div class="dialog-actions">
        <button type="button" class="button-primary" data-action="help-close">
          ${t('help_close')}
        </button>
      </div>
    </form>
  `;
}
