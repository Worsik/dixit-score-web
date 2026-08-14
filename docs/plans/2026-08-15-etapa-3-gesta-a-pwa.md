# Etapa 3 — Gesta, PWA a nasazení

> **Pro agentní pracovníky:** POVINNÝ SUB-SKILL: použij `superpowers:executing-plans`.

**Cíl:** Doplnit přeskupení hráčů tažením, mřížku nad 6 hráčů a PWA vrstvu — po dokončení
je aplikace instalovatelná na plochu telefonu a funguje offline.

**Spec:** [`docs/SPEC.md`](../SPEC.md) kap. 4.1, 10 · [`docs/DEV.md`](../DEV.md) AD-3, kap. 7

**Předloha:** `ui/ReorderableList.kt` a `ui/GameScreen.kt`.

---

## Globální omezení

Platí vše z etap 1 a 2. Navíc:

- **HTML5 Drag and Drop API je zakázané** (AD-3). Výhradně Pointer Events.
- **Během tažení se nepřekresluje** (AD-2, výjimka 2). Stav se mění až na `pointerup`.
- **Service worker se píše ručně**, negeneruje. Je to část, které má autor rozumět.

---

## Task 1: Přeskupení tažením

**Files:**
- Create: `js/ui/reorderable-list.js`
- Modify: `js/app.js`, `css/styles.css`

**Interfaces:**
- Produces: `attachReorder(listElement, { onMove, isEnabled }): void`

### Návrh gesta

Odpovídá `detectDragGesturesAfterLongPress` z předlohy:

1. `pointerdown` na kartě → spustí se časovač **500 ms**
2. Pohyb o víc než **10 px** před vypršením časovač zruší — uživatel scrolluje, netáhne
3. Po vypršení začíná tažení: `setPointerCapture`, karta dostane třídu `is-dragging`
4. `pointermove` posouvá kartu přes `transform: translateY()`. Když její střed překročí
   střed sousední karty, **přesune se v DOM** mezi sourozenci a posun se dopočítá tak,
   aby karta pod prstem nepoškočila
5. `pointerup` → z pozice v DOM se spočítá cílový index a zavolá se `onMove(from, to)`,
   což teprve změní stav a vyvolá překreslení

**Proč přesun v DOM a ne ve stavu:** během gesta se nesmí překreslovat (AD-2). Karty
si tedy po dobu tažení spravuje tenhle modul sám a stav se dozví výsledek až na konci.

### Scrollování versus tažení

`touch-action: none` by tažení umožnil, ale **zabil by scrollování seznamu prstem**.
Řešení: karty mají `touch-action: pan-y` a modul si registruje `touchmove` s
`{ passive: false }`, ve kterém volá `preventDefault()` **jen když tažení běží**.
Protože prst musel 500 ms stát, prohlížeč do té doby scrollování nezahájil a gesto
se stihne převzít.

- [ ] **Krok 1: Napiš `js/ui/reorderable-list.js`**

```js
const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 10;

/**
 * Long-press drag reordering built on Pointer Events.
 * HTML5 drag and drop is not used - it does not work on touch devices at all.
 */
export function attachReorder(list, { onMove, isEnabled }) {
  let card = null;          // the card being dragged
  let pointerId = null;
  let timer = null;
  let startY = 0;           // pointer Y that corresponds to zero displacement
  let downY = 0;
  let fromIndex = -1;
  let dragging = false;
  let justDragged = false;  // suppresses the click that follows a drag

  const cards = () => [...list.children];

  function cancelPending() {
    clearTimeout(timer);
    timer = null;
  }

  function beginDrag() {
    dragging = true;
    card.classList.add('is-dragging');
    card.setPointerCapture(pointerId);
  }

  function endDrag() {
    cancelPending();
    if (!dragging) { card = null; return; }

    dragging = false;
    card.classList.remove('is-dragging');
    card.style.transform = '';

    const toIndex = cards().indexOf(card);
    card = null;
    justDragged = true;

    if (toIndex !== -1 && toIndex !== fromIndex) onMove(fromIndex, toIndex);
  }

  list.addEventListener('pointerdown', (event) => {
    if (!isEnabled()) return;
    const target = event.target.closest('[data-player-id]');
    if (!target) return;

    card = target;
    pointerId = event.pointerId;
    downY = event.clientY;
    startY = event.clientY;
    fromIndex = cards().indexOf(card);
    timer = setTimeout(beginDrag, LONG_PRESS_MS);
  });

  list.addEventListener('pointermove', (event) => {
    if (!card) return;

    // Moving before the long press fires means the user is scrolling, not dragging.
    if (!dragging) {
      if (Math.abs(event.clientY - downY) > MOVE_TOLERANCE_PX) {
        cancelPending();
        card = null;
      }
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

  // touch-action: pan-y keeps scrolling alive; this stops it once a drag is underway.
  list.addEventListener('touchmove', (event) => {
    if (dragging) event.preventDefault();
  }, { passive: false });

  list.addEventListener('pointerup', endDrag);
  list.addEventListener('pointercancel', endDrag);

  // A drag must not also open the edit dialog.
  list.addEventListener('click', (event) => {
    if (!justDragged) return;
    justDragged = false;
    event.stopPropagation();
    event.preventDefault();
  }, true);
}
```

- [ ] **Krok 2: Napoj v `js/app.js`**

Zavolat jednou po prvním renderu na `#app` (delegovaně přes seznam), s
`isEnabled: () => getState().players.length <= GRID_THRESHOLD` a
`onMove: movePlayer`. Do `state.js` přibude akce `movePlayer(from, to)` volající
stejnojmennou funkci z `rules.js`.

**Pozor:** `#app` se překresluje celé, takže `attachReorder` nelze navěsit na `<ul>`,
který zanikne. Navěs ho na `#app` a uvnitř pracuj s aktuálním `.player-list`.

- [ ] **Krok 3: Styly**

```css
.player-card { touch-action: pan-y; user-select: none; -webkit-touch-callout: none; }
.player-card.is-dragging { box-shadow: 0 8px 16px rgba(0,0,0,.3); z-index: 1; position: relative; }
```

- [ ] **Krok 4: Ověř** — tažením přeskupit hráče, pořadí se propíše do stavu i po F5,
      role vypravěče se přepočítá, krátké klepnutí pořád otevírá úpravu.

---

## Task 2: Mřížka nad 6 hráčů

**Files:** `js/ui/game-screen.js`, `css/styles.css`

- [ ] Nad `GRID_THRESHOLD` (6) dostane seznam třídu `is-grid` a vykreslí se
      do **2 sloupců**; tažení je v tomto režimu vypnuté (`isEnabled` to už řeší).
- [ ] Ověř přepnutí na 7. hráči a zpět na 6.

---

## Task 3: Ikony a manifest

**Files:** `icons/`, `manifest.webmanifest`, `index.html`

- [ ] Vygeneruj z předlohy `app/src/main/res/mipmap-xxxhdpi/ds_launcher.png`
      ikony **192×192** a **512×512** a favicon **32×32**
- [ ] Zmenši `icons/logo.png` — 379 kB je na offline cache zbytečně moc
- [ ] `manifest.webmanifest` podle `SPEC.md` kap. 10
- [ ] Do `index.html` odkaz na manifest, `theme-color`, `apple-touch-icon` a favicon

## Task 4: Service worker

**Files:** `sw.js`, `js/app.js`

- [ ] Cache-first pro app shell, verzovaný název cache, úklid starých při `activate`
- [ ] Registrace v `app.js`, ošetřená tak, aby absence podpory nerozbila aplikaci
- [ ] Ověř: v DevTools zapnout offline → aplikace naběhne a je plně funkční

## Task 5: Nápověda pro instalaci na iOS

- [ ] Safari instalaci sama nenabídne — zobraz nenápadnou nápovědu
      „Sdílet → Přidat na plochu" jen na iOS a jen když aplikace neběží ve standalone
      režimu (`navigator.standalone === false`)

## Task 6: Nasazení

- [ ] Zapnout GitHub Pages nad větví `master` — **vyžaduje souhlas člověka**,
      je to zveřejnění na veřejné adrese
- [ ] Ověřit, že service worker naběhne přes HTTPS
- [ ] Doplnit adresu do `README.md`

## Task 7: Uzavření etapy

- [ ] `node --test` zelené
- [ ] Aktualizovat `docs/CURRENT.md`, `docs/DEV.md`, `README.md`
- [ ] **Ruční akceptace na skutečném Androidu i iPhonu** — instalace na plochu,
      offline běh, tažení prstem, celé kolo bodování
