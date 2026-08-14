# SPEC — Dixit Score Web

Technická specifikace: *co* se staví, včetně akceptačních kritérií.
Architektura a zdůvodnění rozhodnutí jsou v [`DEV.md`](DEV.md), produktový pohled
v [`PRD.md`](PRD.md).

**Předloha:** [`Worsik/dixit-score`](https://github.com/Worsik/dixit-score), commit `280bed9`
(Kotlin + Jetpack Compose). Cílem je **funkční parita 1:1**.

---

## 1. Rozsah

### V rozsahu

- Funkční parita s APK verzí 1:1 — chování, texty, barvy, rozvržení
- Instalace na plochu telefonu, offline běh
- Persistence rozehrané hry
- Lokalizace en + cs
- Nasazení na GitHub Pages

### Mimo rozsah

Tmavý motiv (předloha ho nemá), undo, historie kol, serverová část, účty, synchronizace
mezi zařízeními, jazyky nad rámec en/cs, automatizované testy UI a gest.

### Vědomé odchylky od předlohy

| # | Předloha | Web | Důvod |
|---|----------|-----|-------|
| 1 | Hláška při 13. hráči zobrazí číselné ID resource (chyba v `GameViewModel.kt:245`) | Zobrazí text hlášky | Replikovat chybu nemá hodnotu ani pro srovnání |
| 2 | Bez persistence — po zabití procesu je hra pryč | Hra se ukládá a obnovuje | Na webu je zahození stránky na pozadí mnohem častější než u APK; bez toho by web byl u stolu prakticky horší |

**Jiné odchylky nejsou přípustné.** Cokoli dalšího, co se během implementace bude jevit
jako chyba předlohy, se **replikuje** a zapíše do této tabulky — nerozhoduje se za pochodu.

---

## 2. Datový model

```js
Player = {
  id,                // string, crypto.randomUUID()
  name,              // string
  color,             // string, hex z palety
  score,             // number, výchozí 0
  isStoryteller,     // boolean
  isNextStoryteller, // boolean
  turnOrder          // number, index v pořadí
}
```

```js
state = {
  players: [],       // Player[]
  roundNumber: 1,
  addDialog:     { isOpen, selectedColor },
  editDialog:    { isOpen, playerId, selectedColor, confirmDelete },
  scoringDialog: { isOpen, step, storytellerId, voters, selectedVoterIds,
                   storytellerPendingPoints, bonusCandidates,
                   playersGettingBonusPoints, bonusAssignments, pointsToDistribute }
}
```

`voters` je pole `{ playerId, pendingPoints }`. Rozepsaná jména a skóre ve stavu nejsou —
textová pole jsou nekontrolovaná (viz AD-2 v [`DEV.md`](DEV.md)).

Maximální počet hráčů je **12**.

---

## 3. Herní pravidla

Implementuje `js/rules.js` jako čisté funkce. **Píše se TDD.**

### 3.1 Rotace vypravěče

`updateStorytellerRoles(players, designated?)`:

1. Prázdný seznam → prázdný výsledek
2. Vypravěč = `designated` (dohledaný podle `id`), jinak stávající `isStoryteller`,
   jinak první hráč
3. `nextTurnOrder = (storyteller.turnOrder + 1) % players.length`
4. Každý hráč dostane `isStoryteller = (id === storyteller.id)` a
   `isNextStoryteller = (turnOrder === nextTurnOrder)`

### 3.2 Bodování kola

Vypravěč nehlasuje. `voters` = všichni kromě vypravěče.

```
allGuessed  = selected.length === voters.length && voters.length > 0
noneGuessed = selected.length === 0
```

| Situace | Vypravěč | Hlasující |
|---------|----------|-----------|
| Uhodli **všichni** nebo **nikdo** | **0** | každý **+2** |
| Uhodl někdo, ale ne všichni | **+3** | kdo uhodl **+3**, kdo neuhodl **0** |

K tomu se přičítají bonusové body (3.3).

### 3.3 Bonusové hlasy

- **Počet bodů k rozdělení** = počet hlasujících, kteří **ne**uhodli
- **Kandidáti** = všichni hlasující, tedy **i ti, kteří uhodli**; vypravěč nikdy
- Uhodli-li **všichni**, krok s bonusy se **přeskočí** rovnou na souhrn
- Bod lze přidat jen dokud zbývá co rozdat; odebrat jen pokud hráč nějaký má

### 3.4 Přepočet pořadí

`reindexTurnOrder(players)` — po smazání hráče a po přeskupení seznamu se `turnOrder`
přepíše na index v poli.

---

## 4. Chování obrazovky

### 4.1 Hlavní obrazovka

**Horní lišta:** logo vlevo (výška 150 px), vpravo pod sebou **Nová hra** (ikona Refresh)
a **Přidat hráče** (ikona +).

- **Nová hra** rozbalí nabídku se seznamem všech hráčů. Výběrem hráče začne nová hra:
  skóre všech na **0**, kolo na **1**, vybraný hráč vypravěčem.
- **Přidat hráče** při **≥ 12 hráčích** dialog **neotevře** a zobrazí hlášku
  „Dosáhli jste maximálního počtu hráčů" (odchylka #1).

**Seznam hráčů:**

- **≤ 6 hráčů** → svislý seznam s přeskupením tažením
- **> 6 hráčů** → mřížka o **2 sloupcích, bez tažení**

**Karta hráče:** pozadí = barva hráče na **20 % krytí**, obrys 1 px. Vlevo jméno, pod ním
případně „Vypravěč" / „Další vypravěč" drobným písmem. Vpravo skóre velkým písmem.
Klepnutí otevře dialog úpravy.

**Dolní lišta:** vystředěné tlačítko s ikonou hvězdy a textem `scoring_button_round` —
cs „Hodnocení pro *N*. kolo", en „Scoring for round *N*".

> **Texty se opisují doslova** z `values/strings.xml` a `values-cs/strings.xml`.
> Citace v této kapitole jsou informativní; závazný je obsah zdrojových souborů.

### 4.2 Paleta barev

| Řada | Barvy |
|------|-------|
| 1 | červená `#FF0000`, oranžová `#FFA500`, žlutá `#FFFF00`, zelená `#00FF00`, modrá `#0000FF`, fialová `#800080` |
| 2 | bílá `#FFFFFF`, šedá `#888888`, černá `#000000`, hnědá `#A52A2A`, růžová `#FFC0CB`, azurová `#00FFFF` |

Kolečko 40 px, dvě řady po šesti. Vykresluje se na **20 % krytí — kromě bílé a černé,
které se ukazují plné**. Vybraná barva má silnější obrys. Výchozí barva nového
hráče je **šedá**.

---

## 5. Dialogy

### 5.1 Přidat hráče

Pole pro jméno + paleta. **Přidat** je neaktivní, dokud je jméno prázdné. Nový hráč se
zařadí na konec pořadí. Tlačítko **Zrušit**.

### 5.2 Upravit hráče

Pole pro jméno, paleta, oddělovač, řádek pro skóre: **−**, číselné pole, **+**.

- **+ / −** změní hodnotu o 1; nečitelná hodnota se čte jako 0
- Při uložení se nečitelná hodnota skóre **ignoruje** a zůstane původní
- **Uložit** je neaktivní při prázdném jméně
- **Smazat** (červené) otevře potvrzení `delete_player_confirmation_message` —
  cs „Opravdu si přejete smazat hráče *%1$s*? Tuto akci nelze vrátit."
- Po smazání se `turnOrder` přepočítá; byl-li smazaný hráč vypravěčem, vypravěčem se
  stává ten, kdo byl označen jako další

### 5.3 Bodování — krok 1: Výběr

- Nahoře „Vypravěč: *jméno*", vpravo jeho průběžné `+N`
- Otázka `scoring_dialog_question` — cs „Kteří hráči poznali vypravěčovu kartu?"
- Třístavové zaškrtávátko **„Všichni"**: prázdný výběr → vypnuto, úplný → zapnuto,
  částečný → neurčitý stav. Klepnutí při zapnutém stavu odznačí vše, jinak označí vše.
- Seznam hlasujících se zaškrtávátkem a průběžným `+N`
- **Potvrdit** / **Zrušit**

Uhodli-li všichni, **Potvrdit** vede rovnou na krok 3.

### 5.4 Bodování — krok 2: Bonusové body

- `scoring_bonus_votes_points_to_distribute` — cs „Zbývá rozdělit: *N* b." (odpočítává se)
- Mřížka **3 sloupce** s kandidáty, kteří ještě nebyli vybráni; klepnutím se hráč přesune
  do spodního seznamu
- Spodní seznam se objeví, až je někdo vybraný: ikona koše (odebere hráče i jeho body),
  jméno, **−**, počet, **+**
- **−** neaktivní při nule, **+** neaktivní když nezbývají body
- **Potvrdit je aktivní jen když jsou rozdány všechny body a zároveň každý vybraný hráč
  má aspoň jeden bod**
- **Zpět** vrací na krok 1

### 5.5 Bodování — krok 3: Souhrn

- Vypravěč nahoře tučně, na svém barevném podkladu, s `+N`
- Oddělovač, pod ním hlasující se svými `+N`
- **Potvrdit** zapíše body, zvýší číslo kola o 1, vypravěčem se stane označený další
  a dialog se zavře
- **Zpět** zruší započtení bonusů a vrátí na krok 2 (resp. na krok 1, uhodli-li všichni).
  **Rozdělené bonusové body se přitom nemažou** — po návratu na krok 2 tam zůstávají

**Zrušení** v kterémkoli kroku zahodí rozpracovaný stav a **nezapíše žádné body**.

---

## 6. Okrajové stavy

Chování předlohy k replikaci, i když působí zvláštně:

- **Žádný hráč** — tlačítko Bodování neudělá nic
- **Jediný hráč** — je zároveň vypravěčem i dalším vypravěčem. Bodování projde bez
  hlasujících: krok 1 má prázdný seznam, krok 2 nula bodů k rozdělení a Potvrdit je
  aktivní. Souhrn ukáže jen vypravěče s `+0`.
- **Prázdné jméno** — nelze uložit ani přidat; samotné mezery se považují za prázdné
- **Duplicitní jména** jsou povolena; hráči se rozlišují podle `id`

---

## 7. Persistence

- **Ukládá se stav hry, ne stav UI** — `players` a `roundNumber` ano, otevřené dialogy ne
- **Zápis při každé změně stavu**, načtení jednou při startu
- Uložený JSON nese klíč **`v: 1`**; záznam s neznámou verzí se ignoruje, jako by nebyl
- Není-li nic uloženo, aplikace naběhne s **prázdným seznamem hráčů** — stejně jako APK
- **Selhání se ignoruje** — `localStorage` může vyhodit výjimku (privátní režim, plná
  kvóta); vše je v `try/catch` a aplikace funguje dál, jen si nic nepamatuje

---

## 8. Lokalizace

Texty v jednom slovníku (`js/i18n.js`), převzaté z `values/strings.xml` (en) a
`values-cs/strings.xml` (cs). Jazyk podle `navigator.language`, fallback **en**.
Podpora zástupných hodnot (`%1$s`, `%1$d` → poziční argumenty).

---

## 9. Vzhled

Barevné schéma převzaté z `ui/theme/Theme.kt` — předloha má jen světlý motiv:

| Role | Hodnota |
|------|---------|
| pozadí / povrch | `#F6D58E` |
| text na pozadí | `#1C1B1F` |
| obrys | `#79747E` |
| primární (tlačítka) | `#4A4A4A`, text bílý |
| chyba (smazat) | `#B3261E` |

---

## 10. PWA

| Klíč manifestu | Hodnota |
|------|---------|
| `name` / `short_name` | Dixit Score |
| `display` | `standalone` |
| `orientation` | `portrait` |
| `background_color` / `theme_color` | `#F6D58E` |
| `icons` | 192×192 a 512×512 (+ `maskable`) |
| `start_url` | `.` |

Service worker: cache-first pro app shell (HTML, CSS, JS, ikony), verzovaný název cache,
úklid starých verzí při `activate`.

---

## 11. Akceptační kritéria

### Automatizovaně (`node --test`)

`js/rules.js`:

- [ ] Uhodli všichni → vypravěč 0, každý hlasující +2
- [ ] Neuhodl nikdo → vypravěč 0, každý hlasující +2
- [ ] Uhodl někdo → vypravěč +3, kdo uhodl +3, kdo neuhodl 0
- [ ] Počet bodů k rozdělení = počet hlasujících, kteří neuhodli
- [ ] Rotace vypravěče včetně přetečení na začátek seznamu
- [ ] Rotace u jediného hráče — vypravěč je zároveň další vypravěč
- [ ] Přepočet `turnOrder` po smazání a po přeskupení
- [ ] Smazání vypravěče předá roli označenému dalšímu

`js/storage.js`:

- [ ] `serialize` → `deserialize` vrátí ekvivalentní stav
- [ ] Neznámá verze → `null`
- [ ] Poškozený JSON → `null`

### Ručně na zařízení (Android **i** iPhone)

- [ ] Aplikace jde přidat na plochu a spustí se ve vlastním okně bez adresního řádku
- [ ] Po vypnutí sítě se spustí a je plně funkční
- [ ] Tažením prstem lze přeskupit hráče (≤ 6 hráčů); nad 6 hráčů se zobrazí mřížka
- [ ] Celé kolo bodování dá stejný výsledek jako APK verze
- [ ] Po zavření a znovuotevření je rozehraná hra na místě
