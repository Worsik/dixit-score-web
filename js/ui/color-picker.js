import { PALETTE, OPAQUE_COLORS } from '../palette.js';

export function renderColorPicker(selectedColor) {
  const swatches = PALETTE.map((color) => {
    const fill = OPAQUE_COLORS.includes(color) ? color : `${color}33`;
    const selected = color === selectedColor ? ' is-selected' : '';
    return `<button type="button" class="swatch${selected}" data-color="${color}"
              style="background: ${fill}" aria-label="${color}"></button>`;
  }).join('');

  return `<div class="color-picker">${swatches}</div>`;
}
