# Etapa 2 — Bodování a nová hra

> **Pro agentní pracovníky:** POVINNÝ SUB-SKILL: použij `superpowers:executing-plans`
> a implementuj plán úkol po úkolu. Kroky používají checkbox (`- [ ]`) syntaxi.

**Cíl:** Doplnit bodovací dialog o třech krocích a novou hru s výběrem vypravěče —
po dokončení jde odehrát celá partie Dixitu.

**Architektura:** Navazuje na etapu 1 beze změny přístupu. Bodovací logika už existuje
a je otestovaná v `js/rules.js`; tato etapa přidává stav dialogu a jeho vykreslení.

**Tech stack:** Vanilla JavaScript (ES2022, nativní ES moduly), bez buildu.
Testy `node --test`.

**Spec:** [`docs/SPEC.md`](../SPEC.md) kap. 3, 5.3–5.5, 6 · architektura
[`docs/DEV.md`](../DEV.md)

**Předloha:** `C:\Data\Projekty\#Android\DixitScore`, soubory
`ui/ScoringDialog.kt` a `presentation/GameViewModel.kt`.

---

## Globální omezení

Platí vše z etapy 1 (žádné závislosti, žádný build, jen `node:test`, nativní `<dialog>`,
komentáře anglicky, pravidlo 1:1, aktualizace `docs/CURRENT.md` po každém úkolu) a navíc:

- **Bodovací pravidla se nepřepisují.** `scoreRound`, `pointsToDistribute` a `applyScores`
  v `js/rules.js` jsou hotové a otestované — dialog je jen volá.
- **Průběžné body se nedrží ve stavu, počítají se při vykreslení** voláním `scoreRound()`.
  V kroku 1 se předává prázdné `bonusAssignments` (body bez bonusů), v kroku 3 skutečné.
  Tím se automaticky replikuje chování předlohy, kde krok 1 bonusy nezobrazuje.
- **Escapování** — každé jméno hráče přes `escapeHtml()` (AD-6).

---

## Struktura souborů této etapy

| Soubor | Změna | Odpovědnost |
|--------|-------|-------------|
| `js/rules.js` | rozšířit | `canConfirmBonusVotes()` — podmínka aktivního tlačítka |
| `test/rules.test.js` | rozšířit | testy pro `canConfirmBonusVotes` |
| `js/state.js` | rozšířit | stav a akce bodovacího dialogu a nové hry |
| `js/ui/scoring-dialog.js` | nový | vykreslení všech tří kroků |
| `js/ui/game-screen.js` | upravit | nabídka pro výběr vypravěče u „Nová hra" |
| `js/app.js` | upravit | napojení dialogu a nabídky |
| `index.html` | upravit | `<dialog id="scoring-dialog">` |
| `css/styles.css` | rozšířit | styly kroků a nabídky |

---

## Task 1: Podmínka pro potvrzení bonusů

**Files:**
- Modify: `js/rules.js`
- Test: `test/rules.test.js`

**Interfaces:**
- Produces: `canConfirmBonusVotes(pointsToDistribute, chosenIds, assignments): boolean`

- [ ] **Krok 1: Napiš selhávající testy**

Přidej na konec `test/rules.test.js` a doplň `canConfirmBonusVotes` do importu nahoře:

```js
test('bonusy nelze potvrdit, dokud zbývají nerozdané body', () => {
  assert.equal(canConfirmBonusVotes(2, ['b'], { b: 1 }), false);
});

test('bonusy nelze potvrdit, když vybraný hráč nemá ani bod', () => {
  assert.equal(canConfirmBonusVotes(2, ['b', 'c'], { b: 2, c: 0 }), false);
});

test('bonusy lze potvrdit, když jsou body rozdány a každý vybraný má aspoň bod', () => {
  assert.equal(canConfirmBonusVotes(2, ['b', 'c'], { b: 1, c: 1 }), true);
});

test('bez bodů k rozdělení a bez vybraných hráčů lze potvrdit', () => {
  assert.equal(canConfirmBonusVotes(0, [], {}), true);
});
```

- [ ] **Krok 2: Spusť testy a ověř, že selhávají**

Spusť: `node --test`
Očekávej: FAIL — `does not provide an export named 'canConfirmBonusVotes'`

- [ ] **Krok 3: Napiš implementaci**

```js
/**
 * Bonus votes may be confirmed only when every point has been handed out
 * and nobody on the list sits at zero.
 */
export function canConfirmBonusVotes(pointsToDistribute, chosenIds, assignments) {
  const assigned = Object.values(assignments).reduce((sum, value) => sum + value, 0);
  const everyoneScored = chosenIds.every((id) => (assignments[id] ?? 0) > 0);
  return assigned === pointsToDistribute && everyoneScored;
}
```

- [ ] **Krok 4: Spusť testy a ověř, že prochází**

Spusť: `node --test`
Očekávej: PASS, 39 testů

- [ ] **Krok 5: Aktualizuj `docs/CURRENT.md`** a commituj:

```bash
git add js/rules.js test/rules.test.js docs/CURRENT.md
git commit -m "Pravidla: podmínka pro potvrzení bonusových bodů"
```

---

## Task 2: Stav bodovacího dialogu a nové hry

**Files:**
- Modify: `js/state.js`

**Interfaces:**
- Produces akce: `openScoring()`, `closeScoring()`, `toggleVoter(playerId, isSelected)`,
  `selectAllVoters(isSelected)`, `confirmSelection()`, `backToSelection()`,
  `addBonusPlayer(playerId)`, `removeBonusPlayer(playerId)`, `incrementBonus(playerId)`,
  `decrementBonus(playerId)`, `confirmBonusVotes()`, `backFromSummary()`,
  `confirmScores()`, `toggleNewGameMenu(isOpen)`, `startGameWith(playerId)`

Tvar stavu, který přibude:

```js
scoringDialog: {
  isOpen: false,
  step: 'selection',          // 'selection' | 'bonus' | 'summary'
  storytellerId: null,
  voterIds: [],
  selectedIds: [],
  chosenForBonus: [],         // pořadí, ve kterém byli vybráni
  bonusAssignments: {},       // playerId -> počet bodů
  pointsToDistribute: 0,
},
newGameMenuOpen: false,
```

- [ ] **Krok 1: Rozšiř `js/state.js`**

Doplň import a počáteční stav, pak akce. Klíčové chování 1:1:

```js
import {
  addPlayer, removePlayer, startNewGame, applyScores, scoreRound,
  pointsToDistribute as countPointsToDistribute, MAX_PLAYERS,
} from './rules.js';

// --- Bodování ---

export function openScoring() {
  const storyteller = state.players.find((it) => it.isStoryteller);
  if (!storyteller) return;              // žádní hráči -> tlačítko nedělá nic
  update({
    scoringDialog: {
      isOpen: true,
      step: 'selection',
      storytellerId: storyteller.id,
      voterIds: state.players.filter((it) => it.id !== storyteller.id).map((it) => it.id),
      selectedIds: [],
      chosenForBonus: [],
      bonusAssignments: {},
      pointsToDistribute: 0,
    },
  });
}

export const closeScoring = () =>
  update({ scoringDialog: { ...state.scoringDialog, isOpen: false } });

export function toggleVoter(playerId, isSelected) {
  const { selectedIds } = state.scoringDialog;
  const next = isSelected
    ? [...selectedIds, playerId]
    : selectedIds.filter((id) => id !== playerId);
  update({ scoringDialog: { ...state.scoringDialog, selectedIds: next } });
}

export const selectAllVoters = (isSelected) =>
  update({
    scoringDialog: {
      ...state.scoringDialog,
      selectedIds: isSelected ? [...state.scoringDialog.voterIds] : [],
    },
  });

export function confirmSelection() {
  const { voterIds, selectedIds } = state.scoringDialog;
  const allGuessed = selectedIds.length === voterIds.length && voterIds.length > 0;

  // Uhodli-li všichni, krok s bonusy se přeskočí rovnou na souhrn.
  update({
    scoringDialog: {
      ...state.scoringDialog,
      step: allGuessed ? 'summary' : 'bonus',
      pointsToDistribute: allGuessed ? 0 : countPointsToDistribute(voterIds, selectedIds),
      chosenForBonus: allGuessed ? [] : [],
      bonusAssignments: allGuessed ? {} : {},
    },
  });
}

export const backToSelection = () =>
  update({ scoringDialog: { ...state.scoringDialog, step: 'selection' } });

export function addBonusPlayer(playerId) {
  if (state.scoringDialog.chosenForBonus.includes(playerId)) return;
  update({
    scoringDialog: {
      ...state.scoringDialog,
      chosenForBonus: [...state.scoringDialog.chosenForBonus, playerId],
    },
  });
}

export function removeBonusPlayer(playerId) {
  const assignments = { ...state.scoringDialog.bonusAssignments };
  delete assignments[playerId];
  update({
    scoringDialog: {
      ...state.scoringDialog,
      chosenForBonus: state.scoringDialog.chosenForBonus.filter((id) => id !== playerId),
      bonusAssignments: assignments,
    },
  });
}

export function incrementBonus(playerId) {
  const { bonusAssignments, pointsToDistribute } = state.scoringDialog;
  const assigned = Object.values(bonusAssignments).reduce((sum, v) => sum + v, 0);
  if (assigned >= pointsToDistribute) return;
  update({
    scoringDialog: {
      ...state.scoringDialog,
      bonusAssignments: {
        ...bonusAssignments, [playerId]: (bonusAssignments[playerId] ?? 0) + 1
      },
    },
  });
}

export function decrementBonus(playerId) {
  const { bonusAssignments } = state.scoringDialog;
  if ((bonusAssignments[playerId] ?? 0) <= 0) return;
  update({
    scoringDialog: {
      ...state.scoringDialog,
      bonusAssignments: {
        ...bonusAssignments, [playerId]: bonusAssignments[playerId] - 1
      },
    },
  });
}

export const confirmBonusVotes = () =>
  update({ scoringDialog: { ...state.scoringDialog, step: 'summary' } });

/**
 * Back from the summary. Mirrors the original: the bonus assignments are NOT reset,
 * so returning to the bonus step shows them again.
 */
export function backFromSummary() {
  const { voterIds, selectedIds } = state.scoringDialog;
  const allGuessed = selectedIds.length === voterIds.length && voterIds.length > 0;
  update({
    scoringDialog: { ...state.scoringDialog, step: allGuessed ? 'selection' : 'bonus' },
  });
}

export function confirmScores() {
  const { storytellerId, voterIds, selectedIds, bonusAssignments } = state.scoringDialog;
  const { storytellerPoints, voterPoints } =
    scoreRound({ voterIds, selectedIds, bonusAssignments });

  update({
    players: applyScores(state.players, { storytellerId, storytellerPoints, voterPoints }),
    roundNumber: state.roundNumber + 1,
    scoringDialog: { ...state.scoringDialog, isOpen: false },
  });
}

// --- Nová hra ---

export const toggleNewGameMenu = (isOpen) => update({ newGameMenuOpen: isOpen });

export const startGameWith = (playerId) =>
  update({
    players: startNewGame(state.players, playerId),
    roundNumber: 1,
    newGameMenuOpen: false,
  });
```

- [ ] **Krok 2: Ověř, že testy pořád prochází**

Spusť: `node --test` → PASS, 39 testů

- [ ] **Krok 3: Aktualizuj `docs/CURRENT.md`** a commituj:

```bash
git add js/state.js docs/CURRENT.md
git commit -m "Stav: akce bodovacího dialogu a nové hry"
```

---

## Task 3: Vykreslení bodovacího dialogu

**Files:**
- Create: `js/ui/scoring-dialog.js`
- Modify: `index.html` (přidat `<dialog id="scoring-dialog">`)
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `scoreRound`, `canConfirmBonusVotes` z `rules.js`; `escapeHtml`, `withAlpha`
- Produces: `renderScoringDialog(state): string`

Modul vykresluje podle `state.scoringDialog.step` jeden ze tří kroků.

- [ ] **Krok 1: Krok „výběr"**

Nahoře „Vypravěč: *jméno*" s jeho průběžným `+N`, otázka, třístavové zaškrtávátko
„Všichni", oddělovač, seznam hlasujících se zaškrtávátkem a `+N`.
Tlačítka **Zrušit** / **Potvrdit**.

Průběžné body se počítají `scoreRound({ voterIds, selectedIds })` — **bez bonusů**.

Třístavovost checkboxu „Všichni" nejde nastavit v HTML; `indeterminate` je vlastnost
DOM, kterou musí `js/app.js` nastavit po každém překreslení:

```js
const selectAll = scoringDialog.querySelector('#select-all-voters');
if (selectAll) {
  selectAll.indeterminate = selectAll.dataset.state === 'indeterminate';
}
```

- [ ] **Krok 2: Krok „bonusy"**

„Zbývá rozdělit: *N* b." (odpočet), popisek, mřížka o **3 sloupcích** s kandidáty,
kteří ještě nebyli vybráni (kandidáti = **všichni hlasující**, i ti co uhodli).
Pod tím — jen pokud je někdo vybraný — oddělovač, popisek „Přiřaďte body:" a řádky
s ikonou koše, jménem, **−**, počtem a **+**.

- **−** neaktivní při nule, **+** neaktivní když nezbývají body
- **Potvrdit** aktivní jen podle `canConfirmBonusVotes()`
- **Zpět** vrací na krok 1

- [ ] **Krok 3: Krok „souhrn"**

Vypravěč nahoře tučně na svém barevném podkladu s `+N`, oddělovač, pod ním hlasující
se svými `+N`. Tady se `scoreRound()` volá **včetně** `bonusAssignments`.
Tlačítka **Zpět** / **Potvrdit**.

- [ ] **Krok 4: Doplň `<dialog id="scoring-dialog"></dialog>` do `index.html`**

- [ ] **Krok 5: Doplň styly** pro `.scoring-row`, `.bonus-grid` (3 sloupce),
      `.bonus-row`, `.summary-row`.

- [ ] **Krok 6: Commit**

```bash
git add js/ui/scoring-dialog.js index.html css/styles.css docs/CURRENT.md
git commit -m "UI: bodovací dialog o třech krocích"
```

---

## Task 4: Napojení dialogu a nabídky nové hry

**Files:**
- Modify: `js/app.js`
- Modify: `js/ui/game-screen.js`
- Modify: `css/styles.css`

- [ ] **Krok 1: Nabídka pro výběr vypravěče**

V `game-screen.js` pod tlačítkem „Nová hra" vykresli nabídku se seznamem hráčů,
pokud `state.newGameMenuOpen`. Výběrem hráče začne nová hra.

- [ ] **Krok 2: Napoj bodovací dialog v `app.js`**

Stejným vzorem jako ostatní dialogy: `syncDialog` bez textových polí (bodovací dialog
žádná nemá), delegace kliknutí přes `data-action`, `close` událost vrací stav.

- [ ] **Krok 3: Ověř v prohlížeči celý průběh kola**

- [ ] Tlačítko „Hodnocení pro 1. kolo" otevře dialog s vypravěčem
- [ ] Zaškrtnutí části hlasujících → vypravěč `+3`, zaškrtnutí všech → `+0` a všichni `+2`
- [ ] „Všichni" má tři stavy a chová se podle předlohy
- [ ] Uhodli-li všichni, krok s bonusy se přeskočí
- [ ] V kroku bonusů nejde potvrdit, dokud nejsou body rozdány a každý vybraný nemá bod
- [ ] Návrat ze souhrnu zachová rozdělené bonusy
- [ ] Potvrzení zapíše body, zvýší kolo a posune vypravěče
- [ ] Zrušení nezapíše nic
- [ ] „Nová hra" → výběr hráče vynuluje skóre, nastaví kolo na 1 a vypravěče

- [ ] **Krok 4: Commit**

```bash
git add js/app.js js/ui/game-screen.js css/styles.css docs/CURRENT.md
git commit -m "UI: napojení bodování a nové hry"
```

---

## Task 5: Uzavření etapy

- [ ] **Krok 1:** `node --test` — všechny testy zelené
- [ ] **Krok 2:** Projdi ruční kontrolu z Tasku 4 a navíc okrajové stavy ze `SPEC.md` kap. 6
      (jediný hráč projde bodováním bez hlasujících; bez hráčů tlačítko nedělá nic)
- [ ] **Krok 3:** Zapiš do `docs/DEV.md` rozhodnutí, která padla mimo plán,
      a do `docs/SPEC.md` objevené odchylky
- [ ] **Krok 4:** Uzavři etapu v `docs/CURRENT.md`, další krok = plán etapy 3
- [ ] **Krok 5:** Commit
