const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 10;

/**
 * Long-press drag reordering built on Pointer Events.
 * HTML5 drag and drop is deliberately not used - it does not fire on touch devices.
 *
 * Works both for the single column and for the two-column grid. The original Android app
 * only supports the column ("Dragging not supported in grid view" in GameScreen.kt);
 * on the web the grid is reachable too, so above six players the order is not frozen.
 *
 * The container is the stable element (#app); the list inside it is rebuilt on every
 * render, so everything is resolved lazily.
 */
export function attachReorder(container, { onMove }) {
  let card = null;          // the card being dragged
  let list = null;          // its parent, resolved at pointerdown
  let pointerId = null;
  let timer = null;
  let startX = 0;           // pointer position matching zero displacement
  let startY = 0;
  let downY = 0;
  let fromIndex = -1;
  let isGrid = false;
  let dragging = false;
  let justDragged = false;  // suppresses the click that follows a drag

  const cards = () => (list ? [...list.children] : []);

  function reset() {
    clearTimeout(timer);
    timer = null;
    card = null;
    list = null;
    dragging = false;
  }

  function beginDrag() {
    dragging = true;
    card.classList.add('is-dragging');
    card.setPointerCapture(pointerId);
  }

  function endDrag() {
    if (!dragging) {
      reset();
      return;
    }

    card.classList.remove('is-dragging');
    card.style.transform = '';
    const toIndex = cards().indexOf(card);
    justDragged = true;
    reset();

    if (toIndex !== -1 && toIndex !== fromIndex) onMove(fromIndex, toIndex);
  }

  /**
   * The first sibling that sits after the pointer in reading order - that is where the
   * dragged card belongs. In a single column only the vertical axis matters; in the grid
   * a whole row is skipped first, then the position within the row decides.
   */
  function insertionTarget(x, y) {
    return cards().find((sibling) => {
      if (sibling === card) return false;
      const rect = sibling.getBoundingClientRect();

      if (!isGrid) return y < rect.top + rect.height / 2;

      if (y < rect.top) return true;      // sibling sits on a row below the pointer
      if (y > rect.bottom) return false;  // sibling sits on a row above the pointer
      return x < rect.left + rect.width / 2;
    }) ?? null;
  }

  /** Keeps the card under the finger after the layout shift caused by reordering. */
  function moveInDom(target, x, y) {
    const beforeTop = card.offsetTop;
    const beforeLeft = card.offsetLeft;
    list.insertBefore(card, target);
    startY += card.offsetTop - beforeTop;
    startX += card.offsetLeft - beforeLeft;
    applyTransform(x, y);
  }

  function applyTransform(x, y) {
    // A single column never moves sideways - the original does not either.
    const dx = isGrid ? x - startX : 0;
    card.style.transform = `translate(${dx}px, ${y - startY}px)`;
  }

  container.addEventListener('pointerdown', (event) => {
    const target = event.target.closest('[data-player-id]');
    if (!target) return;

    // Clear here rather than waiting for a click: a cancelled gesture produces no
    // click at all, and a stale flag would swallow the next legitimate tap.
    justDragged = false;

    card = target;
    list = target.parentElement;
    isGrid = list.classList.contains('is-grid');
    pointerId = event.pointerId;
    downY = event.clientY;
    startX = event.clientX;
    startY = event.clientY;
    fromIndex = cards().indexOf(card);
    timer = setTimeout(beginDrag, LONG_PRESS_MS);
  });

  container.addEventListener('pointermove', (event) => {
    if (!card) return;

    // Movement before the long press fires means scrolling, not dragging.
    if (!dragging) {
      if (Math.abs(event.clientY - downY) > MOVE_TOLERANCE_PX) reset();
      return;
    }

    applyTransform(event.clientX, event.clientY);

    const target = insertionTarget(event.clientX, event.clientY);
    if (target !== card.nextSibling) moveInDom(target, event.clientX, event.clientY);
  });

  // touch-action: pan-y keeps the list scrollable; this stops scrolling once a drag runs.
  container.addEventListener('touchmove', (event) => {
    if (dragging) event.preventDefault();
  }, { passive: false });

  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', endDrag);

  // A drag must not also open the edit dialog.
  container.addEventListener('click', (event) => {
    if (!justDragged) return;
    justDragged = false;
    event.stopPropagation();
    event.preventDefault();
  }, true);
}
