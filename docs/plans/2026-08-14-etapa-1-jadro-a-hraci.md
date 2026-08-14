# Etapa 1 — Jádro a správa hráčů

> **Pro agentní pracovníky:** POVINNÝ SUB-SKILL: použij `superpowers:subagent-driven-development`
> (doporučeno) nebo `superpowers:executing-plans` a implementuj plán úkol po úkolu.
> Kroky používají checkbox (`- [ ]`) syntaxi pro sledování postupu.

**Cíl:** Postavit otestované jádro aplikace (pravidla, persistence, stav, texty) a nad ním
obrazovku, na které lze přidávat, upravovat a mazat hráče — a která si je pamatuje.

**Architektura:** Jednosměrný tok stavu `akce → nový state → render(state) → DOM`.
Herní pravidla jsou čisté funkce bez DOM, psané TDD. UI jsou moduly, které dostanou stav
a vrátí HTML; textová pole jsou nekontrolovaná.

**Tech stack:** Vanilla JavaScript (ES2022, nativní ES moduly), bez frameworku a bez
build kroku. Testy `node --test` (Node 18+).

**Spec:** [`docs/SPEC.md`](../SPEC.md), architektura a rozhodnutí [`docs/DEV.md`](../DEV.md)

**Předloha:** `C:\Data\Projekty\#Android\DixitScore` — Android verze, ze které se
chování rekonstruuje. Při nejasnosti je zdrojem pravdy **ona**, ne intuice.

---

## Globální omezení

Platí pro každý úkol v tomto plánu:

- **Žádné běhové závislosti.** Aplikace nesmí importovat jedinou externí knihovnu.
- **Žádný bundler ani build krok.** Nativní ES moduly načítané prohlížečem.
- **Testy pouze `node --test`.** Žádný Jest, Vitest ani jiný runner.
- **Drag & drop výhradně Pointer Events.** HTML5 `draggable` je zakázané.
  (V této etapě se drag & drop neimplementuje — je v etapě 3.)
- **Dialogy nativním `<dialog>`.** Ne vlastní overlay.
- **Maximum hráčů: 12.** Konstanta `MAX_PLAYERS`.
- **Komentáře anglicky**, dokumentace a commity česky.
- **Funkce v `js/rules.js` jsou čisté** — žádný DOM, `localStorage`, `Date`, `crypto`.
- **Pravidlo 1:1.** Chování musí odpovídat Android předloze. Co vypadá jako chyba
  předlohy, se replikuje; vědomá odchylka patří do tabulky v `docs/SPEC.md`.
- **Po každém úkolu se aktualizuje `docs/CURRENT.md`.** Úkol, po kterém `CURRENT.md`
  nesedí, není hotový.

### Barevná paleta (přesné hodnoty)

```js
['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#800080',
 '#FFFFFF', '#888888', '#000000', '#A52A2A', '#FFC0CB', '#00FFFF']
```

Výchozí barva nového hráče je `#888888`.

### Barevné schéma

| Role | Hodnota |
|------|---------|
| pozadí / povrch | `#F6D58E` |
| text | `#1C1B1F` |
| obrys | `#79747E` |
| primární (tlačítka) | `#4A4A4A`, text bílý |
| chyba | `#B3261E` |

---

## Struktura souborů této etapy

| Soubor | Odpovědnost |
|--------|-------------|
| `package.json` | Jen `{"type":"module"}` — aby Node uměl číst `.js` jako ES moduly. Žádné závislosti. |
| `js/rules.js` | Herní pravidla. Čisté funkce. |
| `js/storage.js` | Serializace stavu a obal nad `localStorage`. |
| `js/i18n.js` | Texty en/cs a formátování zástupných hodnot. |
| `js/state.js` | Stav aplikace, akce, oznamování změn. |
| `js/ui/color-picker.js` | Paleta barev — sdílí ji dialog přidání i úpravy. |
| `js/ui/player-card.js` | Karta jednoho hráče. |
| `js/ui/game-screen.js` | Hlavní obrazovka: lišty a seznam hráčů. |
| `js/ui/add-player-dialog.js` | Dialog přidání hráče. |
| `js/ui/edit-player-dialog.js` | Dialog úpravy hráče + potvrzení smazání. |
| `js/app.js` | Bootstrap: načtení stavu, první render, odběr změn. |
| `index.html` | Kostra a `<dialog>` elementy. |
| `css/styles.css` | Téma, layout, safe-area. |
| `test/rules.test.js` | Testy pravidel. |
| `test/storage.test.js` | Testy serializace. |
| `test/i18n.test.js` | Testy formátování textů. |

**Mimo tuto etapu:** bodovací dialog, nová hra, přeskupení tažením, mřížka nad 6 hráčů,
manifest, service worker, nasazení.

---

## Task 1: Rotace vypravěče

**Files:**
- Create: `package.json`
- Create: `js/rules.js`
- Test: `test/rules.test.js`

**Interfaces:**
- Consumes: nic
- Produces:
  - `MAX_PLAYERS: number` (= 12)
  - `GRID_THRESHOLD: number` (= 6)
  - `updateStorytellerRoles(players: Player[], designatedId?: string|null): Player[]`

`Player = { id: string, name: string, color: string, score: number, isStoryteller: boolean, isNextStoryteller: boolean, turnOrder: number }`

- [ ] **Krok 1: Vytvoř `package.json`**

Node čte `.js` jako CommonJS, dokud mu neřekneš jinak. Bez tohoto souboru `import`
v testech spadne. Žádné závislosti sem nepatří a nikdy nesmí přibýt.

```json
{
  "name": "dixit-score-web",
  "private": true,
  "type": "module"
}
```

- [ ] **Krok 2: Napiš selhávající testy**

`test/rules.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateStorytellerRoles, MAX_PLAYERS, GRID_THRESHOLD } from '../js/rules.js';

// Test helper: builds a player with sensible defaults.
const p = (id, turnOrder, over = {}) => ({
  id, name: id, color: '#888888', score: 0,
  isStoryteller: false, isNextStoryteller: false, turnOrder, ...over
});

test('konstanty odpovídají předloze', () => {
  assert.equal(MAX_PLAYERS, 12);
  assert.equal(GRID_THRESHOLD, 6);
});

test('prázdný seznam vrátí prázdný seznam', () => {
  assert.deepEqual(updateStorytellerRoles([]), []);
});

test('bez vypravěče se jím stane první hráč', () => {
  const result = updateStorytellerRoles([p('a', 0), p('b', 1), p('c', 2)]);
  assert.equal(result[0].isStoryteller, true);
  assert.equal(result[1].isNextStoryteller, true);
  assert.equal(result[2].isNextStoryteller, false);
});

test('stávající vypravěč zůstává, další je následující v pořadí', () => {
  const result = updateStorytellerRoles([
    p('a', 0), p('b', 1, { isStoryteller: true }), p('c', 2)
  ]);
  assert.equal(result[1].isStoryteller, true);
  assert.equal(result[2].isNextStoryteller, true);
});

test('další vypravěč přeteče na začátek seznamu', () => {
  const result = updateStorytellerRoles([
    p('a', 0), p('b', 1), p('c', 2, { isStoryteller: true })
  ]);
  assert.equal(result[2].isStoryteller, true);
  assert.equal(result[0].isNextStoryteller, true);
});

test('určený vypravěč přebije stávajícího', () => {
  const result = updateStorytellerRoles(
    [p('a', 0, { isStoryteller: true }), p('b', 1), p('c', 2)], 'c'
  );
  assert.equal(result[2].isStoryteller, true);
  assert.equal(result[0].isStoryteller, false);
  assert.equal(result[0].isNextStoryteller, true);
});

test('u jediného hráče je vypravěč zároveň dalším vypravěčem', () => {
  const result = updateStorytellerRoles([p('a', 0)]);
  assert.equal(result[0].isStoryteller, true);
  assert.equal(result[0].isNextStoryteller, true);
});

test('neexistující určený vypravěč se ignoruje', () => {
  const result = updateStorytellerRoles([p('a', 0), p('b', 1, { isStoryteller: true })], 'zzz');
  assert.equal(result[1].isStoryteller, true);
});
```

- [ ] **Krok 3: Spusť testy a ověř, že selhávají**

Spusť: `node --test`
Očekávej: FAIL — `Cannot find module '../js/rules.js'`

- [ ] **Krok 4: Napiš minimální implementaci**

`js/rules.js`:

```js
// Maximum number of players, mirrors the Android original.
export const MAX_PLAYERS = 12;

// Above this count the player list switches to a two-column grid.
export const GRID_THRESHOLD = 6;

/**
 * Recomputes the isStoryteller / isNextStoryteller flags.
 * Storyteller is: the designated one, else the current one, else the first player.
 */
export function updateStorytellerRoles(players, designatedId = null) {
  if (players.length === 0) return [];

  const storyteller =
    (designatedId && players.find((it) => it.id === designatedId)) ||
    players.find((it) => it.isStoryteller) ||
    players[0];

  const nextTurnOrder = (storyteller.turnOrder + 1) % players.length;

  return players.map((player) => ({
    ...player,
    isStoryteller: player.id === storyteller.id,
    isNextStoryteller: player.turnOrder === nextTurnOrder,
  }));
}
```

- [ ] **Krok 5: Spusť testy a ověř, že prochází**

Spusť: `node --test`
Očekávej: PASS, 8 testů

- [ ] **Krok 6: Aktualizuj dokumentaci**

V `docs/DEV.md` do kapitoly 4 (Testování) doplň odstavec:

```markdown
Kořenový `package.json` obsahuje výhradně `{"type":"module"}`. Bez něj Node čte `.js`
jako CommonJS a `import` v testech selže. **Nesmí do něj nikdy přibýt závislost** —
neruší AD-5, protože do prohlížeče se nedostane a aplikace ho k běhu nepotřebuje.
```

V `docs/CURRENT.md` přesuň položku pro `js/rules.js` z „Zbývá" do „Hotovo" a uprav
„Další krok".

- [ ] **Krok 7: Commit**

```bash
git add package.json js/rules.js test/rules.test.js docs/DEV.md docs/CURRENT.md
git commit -m "Pravidla: rotace vypravěče"
```

---

## Task 2: Bodování kola

**Files:**
- Modify: `js/rules.js`
- Test: `test/rules.test.js`

**Interfaces:**
- Consumes: `updateStorytellerRoles` z Tasku 1
- Produces:
  - `pointsToDistribute(voterIds: string[], selectedIds: string[]): number`
  - `scoreRound({ voterIds, selectedIds, bonusAssignments }): { storytellerPoints: number, voterPoints: Record<string, number> }`

- [ ] **Krok 1: Napiš selhávající testy**

Přidej na konec `test/rules.test.js`:

```js
import { pointsToDistribute, scoreRound } from '../js/rules.js';

test('uhodli všichni: vypravěč 0, každý hlasující +2', () => {
  const result = scoreRound({ voterIds: ['b', 'c'], selectedIds: ['b', 'c'] });
  assert.equal(result.storytellerPoints, 0);
  assert.deepEqual(result.voterPoints, { b: 2, c: 2 });
});

test('neuhodl nikdo: vypravěč 0, každý hlasující +2', () => {
  const result = scoreRound({ voterIds: ['b', 'c'], selectedIds: [] });
  assert.equal(result.storytellerPoints, 0);
  assert.deepEqual(result.voterPoints, { b: 2, c: 2 });
});

test('uhodl někdo: vypravěč +3, kdo uhodl +3, kdo neuhodl 0', () => {
  const result = scoreRound({ voterIds: ['b', 'c', 'd'], selectedIds: ['b'] });
  assert.equal(result.storytellerPoints, 3);
  assert.deepEqual(result.voterPoints, { b: 3, c: 0, d: 0 });
});

test('bonusové body se přičítají k základu', () => {
  const result = scoreRound({
    voterIds: ['b', 'c'], selectedIds: ['b'], bonusAssignments: { b: 1, c: 2 }
  });
  assert.deepEqual(result.voterPoints, { b: 4, c: 2 });
});

test('bez hlasujících dá vypravěči 0 a prázdné body', () => {
  const result = scoreRound({ voterIds: [], selectedIds: [] });
  assert.equal(result.storytellerPoints, 0);
  assert.deepEqual(result.voterPoints, {});
});

test('bodů k rozdělení je tolik, kolik hlasujících neuhodlo', () => {
  assert.equal(pointsToDistribute(['b', 'c', 'd'], ['b']), 2);
  assert.equal(pointsToDistribute(['b', 'c'], []), 2);
  assert.equal(pointsToDistribute(['b', 'c'], ['b', 'c']), 0);
});
```

- [ ] **Krok 2: Spusť testy a ověř, že selhávají**

Spusť: `node --test`
Očekávej: FAIL — `scoreRound is not a function`

- [ ] **Krok 3: Napiš minimální implementaci**

Přidej do `js/rules.js`:

```js
/** How many bonus points are up for distribution: one per voter who guessed wrong. */
export function pointsToDistribute(voterIds, selectedIds) {
  return voterIds.filter((id) => !selectedIds.includes(id)).length;
}

/**
 * Dixit round scoring.
 * All or nobody guessed  -> storyteller 0, every voter +2.
 * Somebody but not all   -> storyteller +3, correct voters +3, the rest 0.
 * Bonus votes are added on top in both cases.
 */
export function scoreRound({ voterIds, selectedIds, bonusAssignments = {} }) {
  const allGuessed = selectedIds.length === voterIds.length && voterIds.length > 0;
  const noneGuessed = selectedIds.length === 0;
  const flatRound = allGuessed || noneGuessed;

  const voterPoints = {};
  for (const id of voterIds) {
    const base = flatRound ? 2 : (selectedIds.includes(id) ? 3 : 0);
    voterPoints[id] = base + (bonusAssignments[id] ?? 0);
  }

  return { storytellerPoints: flatRound ? 0 : 3, voterPoints };
}
```

- [ ] **Krok 4: Spusť testy a ověř, že prochází**

Spusť: `node --test`
Očekávej: PASS, 14 testů

- [ ] **Krok 5: Aktualizuj `docs/CURRENT.md`** — do „Hotovo" přidej „bodování kola".

- [ ] **Krok 6: Commit**

```bash
git add js/rules.js test/rules.test.js docs/CURRENT.md
git commit -m "Pravidla: bodování kola včetně bonusů"
```

---

## Task 3: Správa seznamu hráčů

**Files:**
- Modify: `js/rules.js`
- Test: `test/rules.test.js`

**Interfaces:**
- Consumes: `updateStorytellerRoles` z Tasku 1
- Produces:
  - `reindexTurnOrder(players: Player[]): Player[]`
  - `addPlayer(players: Player[], newPlayer: Player): Player[]`
  - `removePlayer(players: Player[], playerId: string): Player[]`
  - `movePlayer(players: Player[], from: number, to: number): Player[]`
  - `startNewGame(players: Player[], storytellerId: string): Player[]`
  - `applyScores(players, { storytellerId, storytellerPoints, voterPoints }): Player[]`

- [ ] **Krok 1: Napiš selhávající testy**

Přidej na konec `test/rules.test.js`:

```js
import {
  reindexTurnOrder, addPlayer, removePlayer, movePlayer, startNewGame, applyScores
} from '../js/rules.js';

test('přepočet pořadí přepíše turnOrder na index v poli', () => {
  const result = reindexTurnOrder([p('a', 7), p('b', 3), p('c', 9)]);
  assert.deepEqual(result.map((it) => it.turnOrder), [0, 1, 2]);
});

test('nový hráč jde na konec pořadí a role se přepočítají', () => {
  const result = addPlayer([p('a', 0, { isStoryteller: true })], p('b', 99));
  assert.deepEqual(result.map((it) => it.id), ['a', 'b']);
  assert.equal(result[1].turnOrder, 1);
  assert.equal(result[0].isStoryteller, true);
  assert.equal(result[1].isNextStoryteller, true);
});

test('smazání hráče přepočítá pořadí', () => {
  const result = removePlayer([p('a', 0), p('b', 1), p('c', 2)], 'b');
  assert.deepEqual(result.map((it) => it.id), ['a', 'c']);
  assert.deepEqual(result.map((it) => it.turnOrder), [0, 1]);
});

test('smazání vypravěče předá roli označenému dalšímu', () => {
  const players = [
    p('a', 0, { isStoryteller: true }),
    p('b', 1, { isNextStoryteller: true }),
    p('c', 2)
  ];
  const result = removePlayer(players, 'a');
  assert.equal(result.find((it) => it.id === 'b').isStoryteller, true);
});

test('smazání posledního hráče vrátí prázdný seznam', () => {
  assert.deepEqual(removePlayer([p('a', 0)], 'a'), []);
});

test('přesun hráče přeskládá pořadí', () => {
  const result = movePlayer([p('a', 0), p('b', 1), p('c', 2)], 0, 2);
  assert.deepEqual(result.map((it) => it.id), ['b', 'c', 'a']);
  assert.deepEqual(result.map((it) => it.turnOrder), [0, 1, 2]);
});

test('nová hra vynuluje skóre a nastaví vybraného vypravěče', () => {
  const players = [
    p('a', 0, { score: 12, isStoryteller: true }),
    p('b', 1, { score: 7 })
  ];
  const result = startNewGame(players, 'b');
  assert.deepEqual(result.map((it) => it.score), [0, 0]);
  assert.equal(result[1].isStoryteller, true);
  assert.equal(result[0].isNextStoryteller, true);
});

test('zápis bodů přičte body a posune vypravěče na označeného dalšího', () => {
  const players = [
    p('a', 0, { score: 5, isStoryteller: true }),
    p('b', 1, { score: 5, isNextStoryteller: true }),
    p('c', 2, { score: 5 })
  ];
  const result = applyScores(players, {
    storytellerId: 'a', storytellerPoints: 3, voterPoints: { b: 3, c: 0 }
  });
  assert.deepEqual(result.map((it) => it.score), [8, 8, 5]);
  assert.equal(result[1].isStoryteller, true);
  assert.equal(result[2].isNextStoryteller, true);
});
```

- [ ] **Krok 2: Spusť testy a ověř, že selhávají**

Spusť: `node --test`
Očekávej: FAIL — `reindexTurnOrder is not a function`

- [ ] **Krok 3: Napiš minimální implementaci**

Přidej do `js/rules.js`:

```js
/** Rewrites turnOrder to match the position in the array. */
export function reindexTurnOrder(players) {
  return players.map((player, index) => ({ ...player, turnOrder: index }));
}

/** Appends a player at the end of the turn order. */
export function addPlayer(players, newPlayer) {
  return updateStorytellerRoles(reindexTurnOrder([...players, newPlayer]));
}

/** Removes a player; if they were the storyteller, the designated next one takes over. */
export function removePlayer(players, playerId) {
  const removed = players.find((it) => it.id === playerId);
  const successorId = removed?.isStoryteller
    ? players.find((it) => it.isNextStoryteller)?.id ?? null
    : null;

  const remaining = reindexTurnOrder(players.filter((it) => it.id !== playerId));
  return updateStorytellerRoles(remaining, successorId);
}

/** Moves a player from one position to another and reindexes. */
export function movePlayer(players, from, to) {
  const reordered = [...players];
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);
  return updateStorytellerRoles(reindexTurnOrder(reordered));
}

/** Resets all scores and makes the chosen player the storyteller. */
export function startNewGame(players, storytellerId) {
  const reset = players.map((player) => ({ ...player, score: 0 }));
  return updateStorytellerRoles(reset, storytellerId);
}

/** Adds the round's points and hands the storyteller role to the designated next player. */
export function applyScores(players, { storytellerId, storytellerPoints, voterPoints }) {
  const scored = players.map((player) => ({
    ...player,
    score: player.score +
      (player.id === storytellerId ? storytellerPoints : voterPoints[player.id] ?? 0),
  }));

  const successorId = scored.find((it) => it.isNextStoryteller)?.id ?? null;
  return updateStorytellerRoles(scored, successorId);
}
```

- [ ] **Krok 4: Spusť testy a ověř, že prochází**

Spusť: `node --test`
Očekávej: PASS, 22 testů

- [ ] **Krok 5: Aktualizuj `docs/CURRENT.md`** — `js/rules.js` je hotový celý.

- [ ] **Krok 6: Commit**

```bash
git add js/rules.js test/rules.test.js docs/CURRENT.md
git commit -m "Pravidla: správa hráčů, nová hra, zápis bodů"
```

---

## Task 4: Persistence

**Files:**
- Create: `js/storage.js`
- Test: `test/storage.test.js`

**Interfaces:**
- Consumes: nic
- Produces:
  - `serialize({ players, roundNumber }): string`
  - `deserialize(json: string): { players, roundNumber } | null`
  - `save({ players, roundNumber }): void`
  - `load(): { players, roundNumber } | null`

- [ ] **Krok 1: Napiš selhávající testy**

`test/storage.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serialize, deserialize } from '../js/storage.js';

const sample = {
  players: [{
    id: 'a', name: 'Petr', color: '#FF0000', score: 5,
    isStoryteller: true, isNextStoryteller: false, turnOrder: 0
  }],
  roundNumber: 3
};

test('serializace a zpětné načtení vrátí ekvivalentní stav', () => {
  assert.deepEqual(deserialize(serialize(sample)), sample);
});

test('serializovaný záznam nese číslo verze', () => {
  assert.equal(JSON.parse(serialize(sample)).v, 1);
});

test('stav UI se neukládá', () => {
  const stored = JSON.parse(serialize({ ...sample, addDialog: { isOpen: true } }));
  assert.equal(stored.addDialog, undefined);
});

test('neznámá verze se ignoruje', () => {
  assert.equal(deserialize('{"v":99,"players":[],"roundNumber":1}'), null);
});

test('poškozený JSON se ignoruje', () => {
  assert.equal(deserialize('{tohle není json'), null);
});

test('prázdný vstup se ignoruje', () => {
  assert.equal(deserialize(null), null);
  assert.equal(deserialize(''), null);
});

test('záznam bez pole hráčů se ignoruje', () => {
  assert.equal(deserialize('{"v":1,"roundNumber":1}'), null);
});
```

- [ ] **Krok 2: Spusť testy a ověř, že selhávají**

Spusť: `node --test`
Očekávej: FAIL — `Cannot find module '../js/storage.js'`

- [ ] **Krok 3: Napiš minimální implementaci**

`js/storage.js`:

```js
const STORAGE_KEY = 'dixit-score';
const VERSION = 1;

/** Serializes the game state. UI state is deliberately left out. */
export function serialize({ players, roundNumber }) {
  return JSON.stringify({ v: VERSION, players, roundNumber });
}

/** Parses a stored record. Returns null for anything unusable. */
export function deserialize(json) {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (parsed?.v !== VERSION || !Array.isArray(parsed.players)) return null;
    return { players: parsed.players, roundNumber: parsed.roundNumber ?? 1 };
  } catch {
    return null;
  }
}

// Storage may throw (private mode, quota). Failing to persist must never break the app.
export function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(state));
  } catch {
    // Ignored on purpose - the app works, it just will not remember.
  }
}

export function load() {
  try {
    return deserialize(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}
```

- [ ] **Krok 4: Spusť testy a ověř, že prochází**

Spusť: `node --test`
Očekávej: PASS, 29 testů

- [ ] **Krok 5: Aktualizuj `docs/CURRENT.md`** — `js/storage.js` hotový.

- [ ] **Krok 6: Commit**

```bash
git add js/storage.js test/storage.test.js docs/CURRENT.md
git commit -m "Persistence: serializace stavu a obal nad localStorage"
```

---

## Task 5: Texty

**Files:**
- Create: `js/i18n.js`
- Test: `test/i18n.test.js`

**Interfaces:**
- Consumes: nic
- Produces: `t(key: string, ...args): string`

Texty se přebírají z předlohy: `app/src/main/res/values/strings.xml` (en) a
`values-cs/strings.xml` (cs). **Nevymýšlej vlastní znění** — opiš je.

- [ ] **Krok 1: Napiš selhávající testy**

`test/i18n.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { t, translate, STRINGS } from '../js/i18n.js';

test('vrátí text v požadovaném jazyce', () => {
  assert.equal(translate('cs', 'add_player'), 'Přidat hráče');
  assert.equal(translate('en', 'add_player'), 'Add Player');
});

test('neznámý jazyk spadne zpět na angličtinu', () => {
  assert.equal(translate('de', 'add_player'), 'Add Player');
});

test('dosadí poziční argumenty', () => {
  assert.equal(translate('en', 'scoring_button_round', 3), 'Scoring for round 3');
  assert.ok(translate('cs', 'delete_player_confirmation_message', 'Petr').includes('Petr'));
});

test('neznámý klíč vrátí klíč sám', () => {
  assert.equal(translate('en', 'tohle_neexistuje'), 'tohle_neexistuje');
});

test('oba jazyky mají stejnou sadu klíčů', () => {
  assert.deepEqual(Object.keys(STRINGS.en).sort(), Object.keys(STRINGS.cs).sort());
});

test('t je funkce', () => {
  assert.equal(typeof t, 'function');
});
```

- [ ] **Krok 2: Spusť testy a ověř, že selhávají**

Spusť: `node --test`
Očekávej: FAIL — `Cannot find module '../js/i18n.js'`

- [ ] **Krok 3: Napiš minimální implementaci**

`js/i18n.js` — všech 31 klíčů, opsaných doslova z předlohy:

```js
export const STRINGS = {
  en: {
    app_name: 'Dixit Score',
    new_game: 'New Game',
    add_player: 'Add Player',
    storyteller: 'Storyteller',
    next_storyteller: 'Next Storyteller',
    add_new_player_title: 'Add New Player',
    edit_player_title: 'Edit Player',
    player_name_label: 'Player Name',
    add_button: 'Add',
    save_button: 'Save',
    cancel_button: 'Cancel',
    delete_button: 'Delete',
    back_button: 'Back',
    delete_player_confirmation_title: 'Delete Player',
    delete_player_confirmation_message:
      'Are you sure you want to delete %1$s? This action cannot be undone.',
    scoring_button: 'Scoring',
    scoring_button_round: 'Scoring for round %1$d',
    edit_score_button: 'Edit Score',
    scoring_dialog_title: 'Round Scoring',
    scoring_dialog_question: "Which players guessed the storyteller's card?",
    scoring_dialog_storyteller_label: 'Storyteller:',
    scoring_bonus_votes_title: 'Bonus Points',
    scoring_bonus_votes_question: 'Whose card received bonus votes?',
    scoring_bonus_votes_points_to_distribute: 'Points to distribute: %1$d',
    scoring_bonus_votes_select_card: 'Select players whose cards received votes:',
    scoring_bonus_votes_assign_points: 'Assign points:',
    scoring_bonus_votes_remove_player: 'Remove player from bonus list',
    select_all: 'Everyone',
    confirm_button: 'Confirm',
    edit_score_dialog_title: 'Edit Scores',
    max_players_reached: 'You have reached the maximum number of players',
  },
  cs: {
    app_name: 'Dixit Skóre',
    new_game: 'Nová hra',
    add_player: 'Přidat hráče',
    storyteller: 'Vypravěč',
    next_storyteller: 'Další vypravěč',
    add_new_player_title: 'Přidat nového hráče',
    edit_player_title: 'Upravit hráče',
    player_name_label: 'Jméno hráče',
    add_button: 'Přidat',
    save_button: 'Uložit',
    cancel_button: 'Zrušit',
    delete_button: 'Smazat',
    back_button: 'Zpět',
    delete_player_confirmation_title: 'Smazat hráče',
    delete_player_confirmation_message:
      'Opravdu si přejete smazat hráče %1$s? Tuto akci nelze vrátit.',
    scoring_button: 'Hodnocení',
    scoring_button_round: 'Hodnocení pro %1$d. kolo',
    edit_score_button: 'Upravit skóre',
    scoring_dialog_title: 'Bodování kola',
    scoring_dialog_question: 'Kteří hráči poznali vypravěčovu kartu?',
    scoring_dialog_storyteller_label: 'Vypravěč:',
    scoring_bonus_votes_title: 'Bonusové body',
    scoring_bonus_votes_question: 'Čí karta dostala bonusové hlasy?',
    scoring_bonus_votes_points_to_distribute: 'Zbývá rozdělit: %1$d b.',
    scoring_bonus_votes_select_card: 'Vyberte hráče, jejichž karty dostaly hlasy:',
    scoring_bonus_votes_assign_points: 'Přiřaďte body:',
    scoring_bonus_votes_remove_player: 'Odebrat hráče ze seznamu',
    select_all: 'Všichni',
    confirm_button: 'Potvrdit',
    edit_score_dialog_title: 'Upravit skóre',
    max_players_reached: 'Dosáhli jste maximálního počtu hráčů',
  },
};

const FALLBACK = 'en';

/** Replaces %1$s / %1$d placeholders with positional arguments. */
function format(template, args) {
  return template.replace(/%(\d+)\$[sd]/g, (_, index) => String(args[index - 1] ?? ''));
}

/** Translates into an explicit language. Exported for testing. */
export function translate(lang, key, ...args) {
  const dictionary = STRINGS[lang] ?? STRINGS[FALLBACK];
  const template = dictionary[key] ?? STRINGS[FALLBACK][key];
  if (template === undefined) return key;
  return args.length ? format(template, args) : template;
}

const currentLang = (globalThis.navigator?.language ?? FALLBACK).slice(0, 2);

/** Translates into the browser language. */
export const t = (key, ...args) => translate(currentLang, key, ...args);
```

- [ ] **Krok 4: Spusť testy a ověř, že prochází**

Spusť: `node --test`
Očekávej: PASS, 35 testů

- [ ] **Krok 5: Aktualizuj `docs/CURRENT.md`** — `js/i18n.js` hotový.

- [ ] **Krok 6: Commit**

```bash
git add js/i18n.js test/i18n.test.js docs/CURRENT.md
git commit -m "Texty: slovník en/cs převzatý z předlohy"
```

---

## Task 6: Stav aplikace

**Files:**
- Create: `js/palette.js`
- Create: `js/state.js`

**Interfaces:**
- Consumes: `rules.js` (Task 1–3), `storage.js` (Task 4)
- Produces: `PALETTE: string[]`, `DEFAULT_COLOR: string` (v `js/palette.js`)
- Produces:
  - `getState(): State`
  - `subscribe(listener: () => void): () => void`
  - `init(): void`
  - Akce: `openAddDialog()`, `closeAddDialog()`, `setAddColor(color)`,
    `confirmAddPlayer(name)`, `openEditDialog(playerId)`, `closeEditDialog()`,
    `setEditColor(color)`, `confirmEditPlayer(name, score)`,
    `askDeleteConfirm()`, `cancelDeleteConfirm()`, `confirmDeletePlayer()`

Bez testů — je to tenká vrstva nad otestovanými pravidly. Testuje se ručně přes UI.

- [ ] **Krok 1: Vytvoř `js/palette.js`**

Paletu potřebuje stav (výchozí barva) i UI (vykreslení). Aby existovala na jednom místě,
má vlastní modul.

```js
// Player colours, mirrors the Android original: two rows of six.
export const PALETTE = [
  '#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#800080',
  '#FFFFFF', '#888888', '#000000', '#A52A2A', '#FFC0CB', '#00FFFF',
];

export const DEFAULT_COLOR = '#888888';

// White and black are rendered opaque, everything else at 20% - as in the original.
export const OPAQUE_COLORS = ['#FFFFFF', '#000000'];
```

- [ ] **Krok 2: Napiš `js/state.js`**

```js
import { addPlayer, removePlayer, updateStorytellerRoles, MAX_PLAYERS } from './rules.js';
import { save, load } from './storage.js';
import { DEFAULT_COLOR } from './palette.js';

let state = {
  players: [],
  roundNumber: 1,
  addDialog: { isOpen: false, selectedColor: DEFAULT_COLOR },
  editDialog: { isOpen: false, playerId: null, selectedColor: DEFAULT_COLOR, confirmDelete: false },
  message: null,
};

const listeners = new Set();

export const getState = () => state;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Applies a patch, persists the game part and notifies subscribers.
function update(patch) {
  state = { ...state, ...patch };
  save({ players: state.players, roundNumber: state.roundNumber });
  listeners.forEach((listener) => listener());
}

/** Restores a stored game, if there is one. */
export function init() {
  const stored = load();
  if (stored) {
    state = { ...state, players: stored.players, roundNumber: stored.roundNumber };
  }
}

// --- Add player ---

export function openAddDialog() {
  if (state.players.length >= MAX_PLAYERS) {
    update({ message: 'max_players_reached' });
    return;
  }
  update({ addDialog: { isOpen: true, selectedColor: DEFAULT_COLOR } });
}

export const closeAddDialog = () =>
  update({ addDialog: { ...state.addDialog, isOpen: false } });

export const setAddColor = (color) =>
  update({ addDialog: { ...state.addDialog, selectedColor: color } });

export function confirmAddPlayer(name) {
  if (!name.trim()) return;
  const newPlayer = {
    id: crypto.randomUUID(),
    name: name.trim(),
    color: state.addDialog.selectedColor,
    score: 0,
    isStoryteller: false,
    isNextStoryteller: false,
    turnOrder: state.players.length,
  };
  update({
    players: addPlayer(state.players, newPlayer),
    addDialog: { ...state.addDialog, isOpen: false },
  });
}

// --- Edit player ---

export function openEditDialog(playerId) {
  const player = state.players.find((it) => it.id === playerId);
  if (!player) return;
  update({
    editDialog: { isOpen: true, playerId, selectedColor: player.color, confirmDelete: false },
  });
}

export const closeEditDialog = () =>
  update({ editDialog: { ...state.editDialog, isOpen: false, confirmDelete: false } });

export const setEditColor = (color) =>
  update({ editDialog: { ...state.editDialog, selectedColor: color } });

export function confirmEditPlayer(name, score) {
  const { playerId, selectedColor } = state.editDialog;
  if (!name.trim()) return;
  const parsed = Number.parseInt(score, 10);
  update({
    players: state.players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            name: name.trim(),
            color: selectedColor,
            score: Number.isNaN(parsed) ? player.score : parsed,
          }
        : player
    ),
    editDialog: { ...state.editDialog, isOpen: false },
  });
}

export const askDeleteConfirm = () =>
  update({ editDialog: { ...state.editDialog, confirmDelete: true } });

export const cancelDeleteConfirm = () =>
  update({ editDialog: { ...state.editDialog, confirmDelete: false } });

export function confirmDeletePlayer() {
  update({
    players: removePlayer(state.players, state.editDialog.playerId),
    editDialog: { ...state.editDialog, isOpen: false, confirmDelete: false },
  });
}

export const clearMessage = () => update({ message: null });
```

- [ ] **Krok 3: Ověř, že testy pořád prochází**

Spusť: `node --test`
Očekávej: PASS, 35 testů (state.js testy nemá, ale nesmí nic rozbít)

- [ ] **Krok 4: Aktualizuj `docs/CURRENT.md`** — `js/palette.js` a `js/state.js` hotové.

- [ ] **Krok 5: Commit**

```bash
git add js/palette.js js/state.js docs/CURRENT.md
git commit -m "Stav aplikace: akce pro správu hráčů a napojení persistence"
```

---

## Task 7: Kostra a téma

**Files:**
- Create: `index.html`
- Create: `css/styles.css`
- Create: `js/app.js`
- Copy: `icons/logo.png` (z předlohy `app/src/main/res/drawable/dixit_score_logo.png`)

**Interfaces:**
- Consumes: `state.js` (Task 6), `i18n.js` (Task 5)
- Produces: `render()` v `app.js`, globální DOM kotvy `#app`, `#add-dialog`,
  `#edit-dialog`, `#confirm-delete-dialog`

Konec tohoto úkolu: v prohlížeči je vidět béžová obrazovka s logem, horní lištou
a dolní lištou. Seznam hráčů je prázdný.

- [ ] **Krok 1: Zkopíruj logo**

```bash
mkdir -p icons
cp "/c/Data/Projekty/#Android/DixitScore/app/src/main/res/drawable/dixit_score_logo.png" icons/logo.png
```

- [ ] **Krok 2: Vytvoř `index.html`**

```html
<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Dixit Score</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div id="app"></div>
  <div id="toast" role="status" aria-live="polite"></div>
  <dialog id="add-dialog"></dialog>
  <dialog id="edit-dialog"></dialog>
  <dialog id="confirm-delete-dialog"></dialog>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Krok 3: Vytvoř `css/styles.css`**

```css
:root {
  --background: #F6D58E;
  --on-background: #1C1B1F;
  --outline: #79747E;
  --primary: #4A4A4A;
  --on-primary: #FFFFFF;
  --error: #B3261E;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--background);
  color: var(--on-background);
  font-family: system-ui, sans-serif;
  /* Keeps content clear of the notch and the home indicator. */
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
           env(safe-area-inset-bottom) env(safe-area-inset-left);
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.top-bar img { height: 150px; }

.top-bar-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.player-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;
  margin: 0;
  list-style: none;
}

.bottom-bar {
  display: flex;
  justify-content: center;
  padding: 12px;
  background: var(--primary);
}

button {
  font: inherit;
  cursor: pointer;
}

.button-primary {
  background: var(--primary);
  color: var(--on-primary);
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
}

.button-text {
  background: none;
  border: none;
  color: var(--on-background);
  padding: 8px 12px;
}

.button-danger { color: var(--error); }
```

- [ ] **Krok 4: Vytvoř `js/app.js`**

```js
import { getState, subscribe, init } from './state.js';
import { t } from './i18n.js';
import { renderGameScreen } from './ui/game-screen.js';

const app = document.querySelector('#app');

function render() {
  const state = getState();
  app.innerHTML = renderGameScreen(state);
  document.title = t('app_name');
}

init();
subscribe(render);
render();
```

- [ ] **Krok 5: Vytvoř dočasnou `js/ui/game-screen.js`**

Plná verze je Task 8; teď jen tolik, aby stránka naběhla:

```js
import { t } from '../i18n.js';

export function renderGameScreen(state) {
  return `
    <header class="top-bar">
      <img src="icons/logo.png" alt="Dixit Score">
      <div class="top-bar-actions">
        <button class="button-text" data-action="new-game">${t('new_game')}</button>
        <button class="button-text" data-action="add-player">${t('add_player')}</button>
      </div>
    </header>
    <ul class="player-list"></ul>
    <footer class="bottom-bar">
      <button class="button-primary" data-action="scoring">
        ${t('scoring_button_round', state.roundNumber)}
      </button>
    </footer>
  `;
}
```

- [ ] **Krok 6: Ověř v prohlížeči**

```bash
python -m http.server 8000
```

Otevři `http://localhost:8000`.
Očekávej: béžová stránka, logo vlevo nahoře, vpravo dvě textová tlačítka, dole tmavá
lišta s tlačítkem „Bodování za kolo 1". V konzoli žádná chyba.

- [ ] **Krok 7: Aktualizuj `docs/CURRENT.md`** — kostra a téma hotové.

- [ ] **Krok 8: Commit**

```bash
git add index.html css/styles.css js/app.js js/ui/game-screen.js icons/logo.png docs/CURRENT.md
git commit -m "Kostra aplikace: HTML, téma a první render"
```

---

## Task 8: Karta hráče a seznam

**Files:**
- Create: `js/ui/html.js`
- Create: `js/ui/player-card.js`
- Modify: `js/ui/game-screen.js`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `renderGameScreen(state)` z Tasku 7
- Produces:
  - `escapeHtml(text: string): string`, `withAlpha(hex: string, alpha: number): string`
    (v `js/ui/html.js`)
  - `renderPlayerCard(player): string`

Mřížka nad 6 hráčů a tažení jsou **etapa 3** — teď vždy jednoduchý svislý seznam.

- [ ] **Krok 1: Vytvoř `js/ui/html.js`**

Jména hráčů zadává uživatel a dostávají se do `innerHTML`. Bez escapování je to
XSS díra — jméno `<img onerror=...>` by se spustilo.

```js
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
```

- [ ] **Krok 2: Vytvoř `js/ui/player-card.js`**

```js
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
```

- [ ] **Krok 3: Napoj seznam v `js/ui/game-screen.js`**

Nahraď `<ul class="player-list"></ul>` za:

```js
`<ul class="player-list">${state.players.map(renderPlayerCard).join('')}</ul>`
```

a nahoře doplň `import { renderPlayerCard } from './player-card.js';`

- [ ] **Krok 4: Doplň styly do `css/styles.css`**

```css
.player-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid var(--outline);
  border-radius: 12px;
}

.player-card-info { display: flex; flex-direction: column; }
.player-card-name { font-size: 1.5rem; }
.player-card-role { font-size: 0.75rem; }
.player-card-score { font-size: 2rem; }
```

- [ ] **Krok 5: Ověř v prohlížeči**

Do konzole vlož:

```js
const { getState } = await import('./js/state.js');
getState().players.push({ id: '1', name: 'Petr', color: '#FF0000', score: 7,
  isStoryteller: true, isNextStoryteller: true, turnOrder: 0 });
location.reload();
```

Jednodušší ověření je počkat na Task 9 a přidat hráče dialogem. Minimálně ověř, že
stránka nespadla a seznam je prázdný `<ul>`.

- [ ] **Krok 6: Aktualizuj `docs/CURRENT.md`.**

- [ ] **Krok 7: Commit**

```bash
git add js/ui/html.js js/ui/player-card.js js/ui/game-screen.js css/styles.css docs/CURRENT.md
git commit -m "UI: karta hráče a seznam"
```

---

## Task 9: Přidání hráče

**Files:**
- Create: `js/ui/color-picker.js`
- Create: `js/ui/add-player-dialog.js`
- Modify: `js/app.js`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `state.js` akce `openAddDialog`, `closeAddDialog`, `setAddColor`,
  `confirmAddPlayer`, `clearMessage`; `PALETTE` a `OPAQUE_COLORS` z `js/palette.js` (Task 6)
- Produces:
  - `renderColorPicker(selectedColor: string): string`
  - `renderAddPlayerDialog(state): string`

- [ ] **Krok 1: Vytvoř `js/ui/color-picker.js`**

Paleta se **neduplikuje** — importuje se z `js/palette.js` založené v Tasku 6.

```js
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
```

- [ ] **Krok 2: Vytvoř `js/ui/add-player-dialog.js`**

```js
import { t } from '../i18n.js';
import { renderColorPicker } from './color-picker.js';

export function renderAddPlayerDialog(state) {
  return `
    <form method="dialog" class="dialog-body">
      <h2>${t('add_new_player_title')}</h2>
      <label class="field">
        <span>${t('player_name_label')}</span>
        <input type="text" id="add-name" autocomplete="off">
      </label>
      ${renderColorPicker(state.addDialog.selectedColor)}
      <div class="dialog-actions">
        <button type="button" class="button-text" data-action="add-cancel">
          ${t('cancel_button')}
        </button>
        <button type="button" class="button-primary" data-action="add-confirm" disabled>
          ${t('add_button')}
        </button>
      </div>
    </form>
  `;
}
```

- [ ] **Krok 3: Napoj dialog v `js/app.js`**

```js
import { getState, subscribe, init, openAddDialog, closeAddDialog,
         setAddColor, confirmAddPlayer, clearMessage } from './state.js';
import { t } from './i18n.js';
import { renderGameScreen } from './ui/game-screen.js';
import { renderAddPlayerDialog } from './ui/add-player-dialog.js';

const app = document.querySelector('#app');
const addDialog = document.querySelector('#add-dialog');

function render() {
  const state = getState();
  app.innerHTML = renderGameScreen(state);
  document.title = t('app_name');

  if (state.addDialog.isOpen) {
    addDialog.innerHTML = renderAddPlayerDialog(state);
    if (!addDialog.open) addDialog.showModal();
  } else if (addDialog.open) {
    addDialog.close();
  }

  if (state.message) showToast(t(state.message));
}

// Stands in for the Android Snackbar. Not alert() - that blocks and looks nothing like it.
let toastTimer = null;
function showToast(text) {
  const toast = document.querySelector('#toast');
  toast.textContent = text;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    clearMessage();
  }, 3000);
}

// The name input is uncontrolled - only its emptiness drives the confirm button.
addDialog.addEventListener('input', (event) => {
  if (event.target.id !== 'add-name') return;
  addDialog.querySelector('[data-action="add-confirm"]').disabled =
    !event.target.value.trim();
});

addDialog.addEventListener('click', (event) => {
  const action = event.target.dataset.action;
  const color = event.target.dataset.color;
  if (color) setAddColor(color);
  if (action === 'add-cancel') closeAddDialog();
  if (action === 'add-confirm') confirmAddPlayer(addDialog.querySelector('#add-name').value);
});

// Esc closes a native <dialog> without going through our state.
addDialog.addEventListener('close', () => {
  if (getState().addDialog.isOpen) closeAddDialog();
});

app.addEventListener('click', (event) => {
  if (event.target.dataset.action === 'add-player') openAddDialog();
});

init();
subscribe(render);
render();
```

**Pozor:** výběr barvy překreslí dialog, což smaže rozepsané jméno. Ošetři to tak, že
`setAddColor` neprovede plný render dialogu — po překreslení vrať hodnotu zpět:
před `addDialog.innerHTML = ...` si ulož `addDialog.querySelector('#add-name')?.value`
a po překreslení ji nastav zpět.

- [ ] **Krok 4: Doplň styly**

```css
dialog {
  border: none;
  border-radius: 16px;
  background: var(--background);
  color: var(--on-background);
  max-width: 90vw;
}
dialog::backdrop { background: rgba(0, 0, 0, 0.4); }

.dialog-body { display: flex; flex-direction: column; gap: 16px; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field input { padding: 8px; font-size: 1rem; }

.color-picker {
  display: grid;
  grid-template-columns: repeat(6, 40px);
  gap: 8px;
  justify-content: space-evenly;
}

.swatch {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--outline);
}
.swatch.is-selected { border: 2px solid var(--on-background); }

/* Stand-in for the Android Snackbar. */
#toast {
  position: fixed;
  left: 50%;
  bottom: calc(80px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  background: #322F35;
  color: #F5EFF7;
  padding: 12px 16px;
  border-radius: 8px;
  max-width: 90vw;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
#toast.is-visible { opacity: 1; }
```

- [ ] **Krok 5: Ověř v prohlížeči**

Očekávej:
- „Přidat hráče" otevře dialog; „Přidat" je zašedlé, dokud nenapíšeš jméno
- výběr barvy zvýrazní kolečko **a nesmaže rozepsané jméno**
- potvrzení přidá kartu hráče do seznamu, označenou jako „Vypravěč"
- obnovení stránky (F5) hráče zachová
- po přidání 12. hráče se při dalším pokusu objeví hláška místo dialogu

- [ ] **Krok 6: Aktualizuj `docs/CURRENT.md`.**

- [ ] **Krok 7: Commit**

```bash
git add js/ui/color-picker.js js/ui/add-player-dialog.js js/app.js css/styles.css docs/CURRENT.md
git commit -m "UI: dialog přidání hráče s paletou barev"
```

---

## Task 10: Úprava a smazání hráče

**Files:**
- Create: `js/ui/edit-player-dialog.js`
- Modify: `js/app.js`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `state.js` akce `openEditDialog`, `closeEditDialog`, `setEditColor`,
  `confirmEditPlayer`, `askDeleteConfirm`, `cancelDeleteConfirm`, `confirmDeletePlayer`
- Produces:
  - `renderEditPlayerDialog(state): string`
  - `renderConfirmDeleteDialog(player): string`

- [ ] **Krok 1: Vytvoř `js/ui/edit-player-dialog.js`**

```js
import { t } from '../i18n.js';
import { renderColorPicker } from './color-picker.js';
import { escapeHtml } from './html.js';

export function renderEditPlayerDialog(state) {
  const player = state.players.find((it) => it.id === state.editDialog.playerId);
  if (!player) return '';

  return `
    <form method="dialog" class="dialog-body">
      <h2>${t('edit_player_title')}</h2>
      <label class="field">
        <span>${t('player_name_label')}</span>
        <input type="text" id="edit-name" value="${escapeHtml(player.name)}" autocomplete="off">
      </label>
      ${renderColorPicker(state.editDialog.selectedColor)}
      <hr>
      <div class="score-editor">
        <span>${t('edit_score_button')}</span>
        <button type="button" class="button-primary" data-action="score-down">&#9660;</button>
        <input type="text" inputmode="numeric" id="edit-score" value="${player.score}">
        <button type="button" class="button-primary" data-action="score-up">&#9650;</button>
      </div>
      <div class="dialog-actions">
        <button type="button" class="button-text button-danger" data-action="edit-delete">
          ${t('delete_button')}
        </button>
        <button type="button" class="button-text" data-action="edit-cancel">
          ${t('cancel_button')}
        </button>
        <button type="button" class="button-primary" data-action="edit-confirm">
          ${t('save_button')}
        </button>
      </div>
    </form>
  `;
}

export function renderConfirmDeleteDialog(player) {
  return `
    <form method="dialog" class="dialog-body">
      <h2>${t('delete_player_confirmation_title')}</h2>
      <p>${escapeHtml(t('delete_player_confirmation_message', player.name))}</p>
      <div class="dialog-actions">
        <button type="button" class="button-text" data-action="delete-cancel">
          ${t('cancel_button')}
        </button>
        <button type="button" class="button-primary button-delete" data-action="delete-confirm">
          ${t('delete_button')}
        </button>
      </div>
    </form>
  `;
}
```

- [ ] **Krok 2: Napoj v `js/app.js`**

Stejným vzorem jako Task 9: otevřít/zavřít podle `state.editDialog.isOpen`,
delegovat kliknutí přes `data-action`, po překreslení vracet hodnoty
`#edit-name` a `#edit-score`.

Tlačítka skóre pracují přímo s DOM, nikoli se stavem:

```js
editDialog.addEventListener('click', (event) => {
  const action = event.target.dataset.action;
  const scoreInput = editDialog.querySelector('#edit-score');
  const current = Number.parseInt(scoreInput?.value, 10) || 0;

  if (action === 'score-up') scoreInput.value = current + 1;
  if (action === 'score-down') scoreInput.value = current - 1;
  if (event.target.dataset.color) setEditColor(event.target.dataset.color);
  if (action === 'edit-cancel') closeEditDialog();
  if (action === 'edit-delete') askDeleteConfirm();
  if (action === 'edit-confirm') {
    confirmEditPlayer(editDialog.querySelector('#edit-name').value, scoreInput.value);
  }
});

app.addEventListener('click', (event) => {
  const card = event.target.closest('[data-player-id]');
  if (card) openEditDialog(card.dataset.playerId);
});
```

Potvrzovací dialog se otevírá podle `state.editDialog.confirmDelete`.

- [ ] **Krok 3: Doplň styly**

```css
.score-editor {
  display: flex;
  align-items: center;
  gap: 8px;
}
.score-editor span { flex: 1; }
.score-editor button { width: 48px; height: 48px; padding: 0; }
.score-editor input { width: 80px; text-align: center; padding: 8px; font-size: 1rem; }

.button-delete { background: var(--error); }
```

- [ ] **Krok 4: Ověř v prohlížeči**

Očekávej:
- klepnutí na kartu otevře dialog s předvyplněným jménem, barvou a skóre
- ▲ / ▼ mění skóre o 1; nesmyslná hodnota v poli se čte jako 0
- „Uložit" se změnami se projeví na kartě
- „Uložit" s prázdným jménem neudělá nic
- „Smazat" vyvolá potvrzení se jménem hráče; potvrzení hráče odstraní
- smazání vypravěče předá roli tomu, kdo byl „Další vypravěč"
- vše přežije obnovení stránky

- [ ] **Krok 5: Aktualizuj `docs/CURRENT.md`.**

- [ ] **Krok 6: Commit**

```bash
git add js/ui/edit-player-dialog.js js/app.js css/styles.css docs/CURRENT.md
git commit -m "UI: úprava a smazání hráče"
```

---

## Task 11: Uzavření etapy

**Files:**
- Modify: `docs/CURRENT.md`
- Modify: `docs/DEV.md` (pokud během implementace padlo rozhodnutí)
- Modify: `README.md` (pokud se změnil způsob spuštění)

- [ ] **Krok 1: Spusť celou testovou sadu**

Spusť: `node --test`
Očekávej: PASS, všechny testy

- [ ] **Krok 2: Projdi ruční kontrolu**

- [ ] Přidání hráče včetně výběru barvy
- [ ] Limit 12 hráčů zobrazí hlášku
- [ ] Úprava jména, barvy a skóre
- [ ] Smazání hráče s potvrzením
- [ ] Smazání vypravěče předá roli dalšímu
- [ ] Prázdné jméno nejde uložit ani přidat
- [ ] Rozehraná hra přežije obnovení stránky
- [ ] V konzoli není jediná chyba

- [ ] **Krok 3: Zapiš do dokumentace, co se během implementace zjistilo**

Do `docs/DEV.md` každé technické rozhodnutí, které padlo mimo plán — rozhodnutí,
důvod, důsledky. Do `docs/SPEC.md` každou objevenou odchylku od předlohy.

- [ ] **Krok 4: Uzavři etapu v `docs/CURRENT.md`**

Přesuň všechny položky etapy 1 do „Hotovo", nastav „Další krok" na
„Sestavit plán etapy 2 — bodovací dialog a nová hra" a doplň řádek do logu změn.

- [ ] **Krok 5: Commit**

```bash
git add docs/
git commit -m "Etapa 1 uzavřena: jádro a správa hráčů"
```

---

## Co je v dalších etapách

**Etapa 2 — Bodování:** bodovací dialog o třech krocích (výběr, bonusové body, souhrn),
nová hra s výběrem vypravěče, rotace vypravěče v UI. Konec: dá se odehrát celá hra.

**Etapa 3 — Gesta, PWA a nasazení:** přeskupení hráčů tažením (Pointer Events),
mřížka nad 6 hráčů, manifest, service worker, ikony, iOS specifika, nasazení na
GitHub Pages, ruční akceptace na Androidu i iPhonu.
