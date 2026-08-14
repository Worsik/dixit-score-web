const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 10;

/**
 * Long-press drag reordering built on Pointer Events.
 * HTML5 drag and drop is deliberately not used - it does not fire on touch devices.
 *
 * The container is the stable element (#app); the list inside it is rebuilt on every
 * render, so everything is resolved lazily.
 */
export function attachReorder(container, { onMove, isEnabled }) {
  let card = null;          // the card being dragged
  let list = null;          // its parent, resolved at pointerdown
  let pointerId = null;
  let timer = null;
  let startY = 0;           // pointer Y matching zero displacement
  let downY = 0;
  let fromIndex = -1;
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

  container.addEventListener('pointerdown', (event) => {
    if (!isEnabled()) return;
    const target = event.target.closest('[data-player-id]');
    if (!target) return;

    // Clear here rather than waiting for a click: a cancelled gesture produces no
    // click at all, and a stale flag would swallow the next legitimate tap.
    justDragged = false;

    card = target;
    list = target.parentElement;
    pointerId = event.pointerId;
    downY = event.clientY;
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

    const offset = event.clientY - startY;
    card.style.transform = `translateY(${offset}px)`;

    // offsetTop ignores the transform, so it is the layout position we can reason about.
    const center = card.offsetTop + offset + card.offsetHeight / 2;
    const others = cards().filter((it) => it !== card);
    const target = others.find((it) => center < it.offsetTop + it.offsetHeight / 2) ?? null;

    if (target !== card.nextSibling) {
      const before = card.offsetTop;
      list.insertBefore(card, target);
      // Keep the card under the finger after the layout shift.
      startY += card.offsetTop - before;
      card.style.transform = `translateY(${event.clientY - startY}px)`;
    }
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
