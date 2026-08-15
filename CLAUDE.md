# CLAUDE.md — projektová pravidla (dixit-score-web)

Doplňuje globální `~/.claude/CLAUDE.md`, nepřepisuje ho. Kde si odporují, platí globální
pravidlo — s výjimkou technických konvencí níže, které jsou pro tenhle projekt závazné.

**Než začneš psát kód, přečti si [`docs/SPEC.md`](docs/SPEC.md) a
[`docs/DEV.md`](docs/DEV.md).** Aktuální stav je v [`docs/CURRENT.md`](docs/CURRENT.md).

---

## 1. Co to je

Webový přepis nativní Android aplikace [`dixit-score`](https://github.com/Worsik/dixit-score)
do podoby PWA. Přepis dosáhl **funkční parity** s předlohou; od nasazení se aplikace
vyvíjí dál (viz kap. 5).

---

## 2. Technická pravidla — závazná

Tahle rozhodnutí padla vědomě a jsou zdůvodněná v [`docs/DEV.md`](docs/DEV.md).
**Neměň je bez výslovné domluvy** — ani „jen dočasně", ani „protože je to takhle rychlejší".

- **Žádné běhové závislosti.** Aplikace nemá jedinou externí knihovnu a nemá `package.json`
  pro běh. Než sáhneš po balíčku, ověř, že to neumí prohlížeč nativně — dosud to uměl vždy.
- **Žádný bundler, žádný build krok.** Nativní ES moduly načítané přímo prohlížečem.
  Nasazení = nakopírovat soubory.
- **Drag & drop výhradně přes Pointer Events.** HTML5 Drag and Drop API (`draggable="true"`)
  na dotykových zařízeních nefunguje a je v tomhle projektu zakázané.
- **Dialogy přes nativní `<dialog>`.** Ne vlastní overlay, ne knihovna.
- **Testy přes vestavěný `node:test`** (`node --test`). Žádný Jest, Vitest ani jiný runner.

## 3. Architektura

Jednosměrný tok stavu: `akce → nový state → render(state) → DOM`.

Dvě výjimky, které **musí** platit:

1. **Textová pole jsou nekontrolovaná** — hodnota žije v DOM elementu a čte se až při
   potvrzení. Jinak překreslení shodí kurzor z rozepsaného textu.
2. **Během tažení se nepřekresluje** — `reorderable-list.js` si drží DOM sám, do stavu
   zapisuje až na `pointerup`.

## 4. TDD

Povinné pro:

- `js/rules.js` — herní pravidla (bodování, rotace vypravěče, přepočet pořadí)
- `js/storage.js` — `serialize` / `deserialize`

Postup: red (test selže) → green (minimální implementace) → refactor. Obal nad
`localStorage` se netestuje, je to pět řádků a v Node `localStorage` není.

UI a dotyková gesta se testují ručně na zařízení — automatizovat je se u aplikace téhle
velikosti nevyplatí.

## 5. Vztah k předloze

Přepis dosáhl funkční parity s APK a aplikace se od té doby **vyvíjí dál**. Předloha je
tedy výchozí bod, ne strop.

- **Neměň chování z vlastní iniciativy.** Vylepšení musí být vyžádané nebo odsouhlasené.
- Když narazíš na něco, co vypadá jako chyba předlohy, **ani to tiše nereplikuj, ani tiše
  neopravuj** — pojmenuj to nahlas a nech rozhodnout.
- Každý rozdíl proti předloze patří do tabulky vylepšení v
  [`docs/SPEC.md`](docs/SPEC.md) — jinak neexistuje.

Ta tabulka není byrokracie: projekt má doložit, že web umí **všechno co APK**, a bez
evidence by za rok nešlo rozlišit paritu od nadstavby.

## 6. Styl kódu

- **Kotlin style guide neplatí, platí běžné JS konvence:** `camelCase` pro proměnné
  a funkce, `PascalCase` pro konstruktory, `UPPER_SNAKE_CASE` pro konstanty.
- **Komentáře anglicky**, stručně. Popisy, dokumentace a commity česky.
- Jeden soubor = jedna odpovědnost. Když soubor přeroste ~200 řádků, je to signál, že
  dělá dvě věci.
- Žádné „magic values" — barvy, limity a texty patří do konstant nebo do `i18n.js`.
- `const` před `let`, `let` nikdy tam, kde stačí `const`.
- Early return před zanořováním.

## 7. Dokumentace se udržuje průběžně

Plán je dočasný, dokumentace zůstává. **Aplikace musí mít vše definováno uvnitř sebe,
ne v plánu.** Proto po každém dokončeném kroku:

| Kdy | Co aktualizovat |
|-----|-----------------|
| Po každém dokončeném kroku | `docs/CURRENT.md` — hotovo, další krok, blokery |
| Když padne technické rozhodnutí | `docs/DEV.md` — rozhodnutí + důvod + důsledky |
| Když se změní chování nebo rozsah | `docs/SPEC.md` |
| Když se změní způsob spuštění, testů nebo nasazení | `README.md` |

Dokumentace není úklid na konci. Krok, po kterém nesedí `CURRENT.md`, není hotový.

## 8. Git

- Necommituj a nepushuj bez výslovného pokynu.
- Práce probíhá ve větvi, ne přímo v `master`.
