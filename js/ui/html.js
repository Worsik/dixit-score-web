/** Escapes user-entered text before it goes into innerHTML. */
export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

/** Turns #RRGGBB into rgba() at the given alpha. */
export function withAlpha(hex, alpha) {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255, g = (value >> 8) & 255, b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
