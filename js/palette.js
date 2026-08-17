// Player colours, mirrors the Android original: two rows of six.
export const PALETTE = [
  '#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#800080',
  '#FFFFFF', '#888888', '#000000', '#A52A2A', '#FFC0CB', '#00FFFF',
];

export const DEFAULT_COLOR = '#888888';

// White and black are rendered opaque, everything else at 20% - as in the original.
export const OPAQUE_COLORS = ['#FFFFFF', '#000000'];

/**
 * How a palette colour is painted wherever it is shown as a sample.
 *
 * The 20% wash is what the player card ends up looking like, so a swatch drawn at full
 * strength shows a different colour than the one being picked - #0000FF reads as solid
 * blue on its own but turquoise at 20%. Kept here, in one place, because it was
 * previously inlined in the colour picker and got out of step with the setup dialog.
 *
 * 0x33 of 255 is exactly 0.2, so this matches withAlpha(color, 0.2).
 */
export function swatchFill(color) {
  return OPAQUE_COLORS.includes(color) ? color : `${color}33`;
}

/**
 * The first palette colour nobody is using yet.
 *
 * Used when building a roster: picking a colour for each of six players by hand is
 * exactly the friction the setup dialog exists to remove. Passing `afterColor` starts
 * the search behind that colour, which is how tapping a swatch cycles to the next one.
 *
 * With every colour taken - possible at twelve players - it falls back to the first,
 * because refusing to return a colour would be worse than a duplicate.
 */
export function nextFreeColor(usedColors, afterColor = null) {
  const start = PALETTE.indexOf(afterColor) + 1;

  for (let step = 0; step < PALETTE.length; step += 1) {
    const color = PALETTE[(start + step) % PALETTE.length];
    if (!usedColors.includes(color)) return color;
  }
  return PALETTE[0];
}
