import { PALETTE, swatchFill } from '../palette.js';

export function renderColorPicker(selectedColor) {
  const swatches = PALETTE.map((color) => {
    const fill = swatchFill(color);
    const selected = color === selectedColor ? ' is-selected' : '';
    return `<button type="button" class="swatch${selected}" data-color="${color}"
              style="background: ${fill}" aria-label="${color}"></button>`;
  }).join('');

  return `<div class="color-picker">${swatches}</div>`;
}
