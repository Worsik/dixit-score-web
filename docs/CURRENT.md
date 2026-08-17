# CURRENT — živý stav projektu

> Aktualizuje se po každém dokončeném kroku. Krok, po kterém tenhle soubor nesedí,
> není hotový.

**Poslední aktualizace:** 2026-08-15

---

## Kde jsme

**Aplikace je funkčně hotová.** Umí odehrát celou partii Dixitu, přeskupit hráče tažením,
běží offline a je instalovatelná na plochu. Ověřeno v prohlížeči včetně skutečného
offline testu se zabitým serverem.

**Nasazená na https://worsik.github.io/dixit-score-web/** — ověřeno, že jde spustit,
uložit na plochu a že drží data.

**Zbývá vyzkoušet na iPhonu.** To je zároveň to, kvůli čemu projekt vznikl — dokud
test na iOS neproběhne, otázka „obstojí PWA místo nativní aplikace?" zůstává
nezodpovězená.

| Etapa | Obsah | Stav |
|-------|-------|------|
| 1 | Jádro (pravidla, persistence, texty, stav) a správa hráčů | **hotovo** |
| 2 | Bodovací dialog o třech krocích, nová hra | **hotovo** |
| 3 | Přeskupení tažením, mřížka nad 6 hráčů, PWA vrstva | **hotovo** (kód) |
| 3 | Nasazení na GitHub Pages | **hotovo** |
| — | Akceptace na iPhonu | **zbývá** |

## Další krok

Vyzkoušet aplikaci na iPhonu — instalace přes Safari, offline běh, tažení prstem.

## Hotovo

### Příprava

- [x] Analýza Android předlohy (`Worsik/dixit-score`, commit `280bed9`) — chování všech
      obrazovek a dialogů vytěženo do specifikace
- [x] Rozhodnutí o přístupu: bez frameworku, bez buildu, nativní ES moduly (viz `DEV.md`)
- [x] `docs/SPEC.md`, `docs/PRD.md`, `docs/DEV.md`, `README.md`, projektový `CLAUDE.md`
- [x] Repozitář `Worsik/dixit-score-web` založen
- [x] Plán etapy 1 — `docs/plans/2026-08-14-etapa-1-jadro-a-hraci.md`

### Etapa 1

- [x] `js/rules.js` — 22 testů (rotace vypravěče, bodování kola, správa hráčů)
- [x] `js/storage.js` — 7 testů (serializace, verzování, odolnost proti poškozenému JSONu)
- [x] `js/i18n.js` — 6 testů, 31 klíčů en/cs opsaných z předlohy
- [x] `js/palette.js`, `js/state.js` — paleta, stav a akce
- [x] `index.html`, `css/styles.css`, `js/app.js` — kostra a téma
- [x] `js/ui/html.js`, `player-card.js`, `game-screen.js` — seznam hráčů
- [x] `js/ui/color-picker.js`, `add-player-dialog.js` — přidání hráče
- [x] `js/ui/edit-player-dialog.js` — úprava a smazání hráče
- [x] Ověřeno v prohlížeči (Playwright, 412×915): přidání s výběrem barvy, limit 12 hráčů
      s hláškou, úprava jména/barvy/skóre, blokace prázdného jména, smazání s potvrzením,
      předání role vypravěče, přežití obnovení stránky

### Etapa 2

- [x] Plán etapy 2 — `docs/plans/2026-08-15-etapa-2-bodovani.md`
- [x] `js/rules.js` — `canConfirmBonusVotes()` (4 testy)
- [x] `js/state.js` — akce bodovacího dialogu a nové hry
- [x] `js/ui/scoring-dialog.js` — bodování o třech krocích
- [x] Nová hra s výběrem vypravěče
- [x] Ověřeno v prohlížeči: bodování bez uhodnutí / s částí / se všemi, bonusové hlasy
      včetně blokace potvrzení, návrat ze souhrnu zachová bonusy, zrušení nic nezapíše,
      nová hra vynuluje skóre a nastaví vypravěče, okrajové stavy (0 hráčů, 1 hráč)

**Testy: 68, všechny zelené.**

### Etapa 3

- [x] Plán etapy 3 — `docs/plans/2026-08-15-etapa-3-gesta-a-pwa.md`
- [x] `js/ui/reorderable-list.js` — přeskupení tažením (Pointer Events, dlouhý stisk 500 ms)
- [x] Mřížka nad 6 hráčů, v ní je tažení vypnuté
- [x] Ikony a `manifest.webmanifest` — sada zmenšena z 2 MB na 132 kB (viz AD-10)
- [x] `sw.js` — cache-first app shell, verzovaná cache, úklid při `activate`
- [x] Nápověda „Sdílet → Přidat na plochu" pro iOS
- [x] Ověřeno v prohlížeči: tažení přes více pozic, pořadí se propíše do stavu i úložiště,
      krátké klepnutí pořád otevírá úpravu, mřížka se přepíná na 7. hráči,
      **aplikace naběhne a odehraje celé kolo se zabitým serverem**

### Opravy po nasazení

- [x] **Dialogy ukazovaly údaje předchozího hráče** — `syncDialog` obnovoval hodnoty
      textových polí i při novém otevření, kde je závazný čerstvý render ze stavu.
      Postiženo jméno i skóre v úpravě a jméno v přidání. Vytaženo do `js/ui/dialog.js`
      a pokryto 4 testy v `test/dialog.test.js`.
- [x] `tools/dev-server.py` — statický server s `no-store`; `python -m http.server`
      cachoval JS a dvakrát způsobil ladění staré verze kódu
- [x] **Dialog úpravy nezaostřuje pole jména** — klávesnice zakrývala paletu i skóre.
      Oprava parity: Compose pole také nezaostřuje, na webu to `<dialog>` dělá sám.
- [x] **Layout jako app shell** (AD-11) — lišty jsou pevné a scrolluje jen seznam.
      Safe-area odsazení na `body` se sčítalo s `100dvh` na `#app`, takže spodní lišta
      končila pod okrajem obrazovky. Tažení dolů už stránku neobnoví.
- [x] `tools/dev-server.py` neutralizuje service worker, aby dev neladil starou verzi
- [x] **Tažení funguje i v mřížce nad 6 hráčů** (vylepšení #4) — předloha to neuměla,
      takže u 7–12 hráčů bylo pořadí zamčené. `insertionTarget()` rozhoduje ve dvou osách.
- [x] **Kolečko v dialogu sestavy ukazovalo jinou barvu, než jaká se vybírala** —
      malovalo se na plno, zatímco paleta i karta hráče barvu ukazují jako 20% závoj.
      Modrá `#0000FF` tak v sestavě vypadala sytě modře, ale na kartě tyrkysově.
      Pravidlo bylo vepsané v `color-picker.js`; vytaženo do `swatchFill()`
      v `palette.js` a pokryto testy. Ověřeno, že kolečko, karta i vybrané políčko
      palety dávají shodně `rgba(0, 0, 255, 0.2)`.
- [x] **Dialog sestavy pro první hru** (vylepšení #11, AD-15) — *Nová hra* bez hráčů
      otevírala prázdné menu, což byla zděděná vada z předlohy; skutečný uživatel na
      to tlačítko sáhl jako na první věc v aplikaci. Teď se skládá celá sestava na
      jednom místě: dlaždice naposledy hraných, jméno + automatická barva, klepnutí
      na kolečko cyklí na další volnou. S hráči se tlačítko jmenuje *Další hra*.
      `nextFreeColor()` v `palette.js`, 8 testů.
- [x] **Dávka UX vylepšení** (vylepšení #6–#10) — **univerzální *Vrátit*** (AD-13),
      *Udělat vypravěčem* v dialogu úpravy, zakázané *Hodnocení* bez hráčů,
      držení displeje přes Screen Wake Lock (AD-14), dotykové plochy na 44 px.
      Paleta barev je `minmax(0, 44px)` — pevných 44 px by přeteklo na iPhonu SE,
      `1fr` naopak sebralo dialogu šířku a políčka spadla na 29 px.
- [x] **Po tažení se spolklo první klepnutí na tlačítko v liště** — `justDragged` se
      rušil až za early returnem v `pointerdown`, takže se vynuloval jen při klepnutí
      na kartu hráče. Klepnutí na *Vrátit*, *Nová hra* nebo *Přidat hráče* po přetažení
      nefungovalo napoprvé. Chyba byla v kódu od etapy 3, odhalilo ji až undo.
- [x] **Nabídka naposledy hraných hráčů v dialogu přidání** (vylepšení #5) — nový modul
      `js/known-players.js` s vlastním klíčem v úložišti (AD-12), 12 testů. Řadí se od
      naposledy použitého, strop 20 jmen, nabízí se nejvýš 8. Klepnutí předvyplní jméno
      i barvu. Vedlejší nález: `showModal()` začal zaostřovat první dlaždici — nadpis
      teď přebírá zaostření i v dialogu přidání (**parita**, předloha nezaostřuje nikde).
- [x] **Bonusový bod se přiděluje rovnou při výběru hráče** (vylepšení #3) — dlaždice
      kandidátů jsou zablokované, když nezbývají body. Výpočet zbývajících bodů
      vytažen do `remainingBonusPoints()` v `rules.js`, kde byl třikrát zduplikovaný.

## Zbývá

- [x] Nasazení na GitHub Pages — https://worsik.github.io/dixit-score-web/
- [x] Ruční ověření na Androidu — spuštění, instalace na plochu, persistence
- [ ] **Ruční akceptace na skutečném iPhonu** — Safari „Přidat na plochu", offline,
      tažení prstem, safe-area kolem čela

### Co nelze ověřit v prohlížeči na počítači

- Zda tažení prstem nekoliduje se scrollováním (AD-9)
- Zda se dlaždice naposledy hraných vejdou nad klávesnici a dají se trefit prstem
- Zda se do dialogu sestavy dá pohodlně psát a scrollovat sestavou při 12 hráčích
- Zda drží displej rozsvícený (Safari až od iOS 16.4, v úsporném režimu selže)
- Zda podržení na iOS nevyvolá kontextové menu
- Zda instalace na plochu proběhne a aplikace se spustí bez adresního řádku
- Zda iOS neodstřelí uložená data

## Blokery

Žádné.

## Otevřené otázky

Žádné. *(GitHub issues se zatím nezakládají — jede se podle plánů v `docs/plans/`.)*

Nápady na další rozvoj, o kterých zatím nepadlo rozhodnutí, jsou
v [`BACKLOG.md`](BACKLOG.md).

## Log změn

| Datum | Co |
|-------|-----|
| 2026-08-14 | Probráno zadání, schválen návrh, založen repozitář a dokumentace projektu |
| 2026-08-14 | Napsán plán etapy 1; při jeho psaní opraveny parafrázované texty v `SPEC.md` na doslovné znění z předlohy |
| 2026-08-15 | Implementována a ověřena etapa 1 — jádro a správa hráčů |
| 2026-08-15 | Implementována a ověřena etapa 2 — bodování a nová hra |
| 2026-08-15 | Implementována etapa 3 — tažení, mřížka, PWA vrstva; ikony zmenšeny z 2 MB na 132 kB; ověřen offline běh |
| 2026-08-15 | Nasazeno na GitHub Pages; nahlášena a opravena chyba: dialogy ukazovaly údaje předchozího hráče |
| 2026-08-15 | Bonusový bod se přiděluje rovnou při výběru hráče (vylepšení #3 oproti předloze) |
| 2026-08-15 | Ladění na telefonu: zaostření v dialogu úpravy, layout app shell, vypnuté tažení k obnovení |
| 2026-08-15 | Tažení doplněno i do dvousloupcové mřížky (vylepšení #4) |
| 2026-08-15 | Založen `BACKLOG.md` — nápady na rozvoj (statistika, hlášení chyb) bez rozhodnutí |
| 2026-08-15 | Nabídka naposledy hraných hráčů v dialogu přidání (vylepšení #5, AD-12) |
| 2026-08-17 | Rozbor UX a dávka vylepšení #6–#10 (vrátit kolo, vypravěč, wake lock, dotykové plochy) |
| 2026-08-17 | Undo předěláno na univerzální — vrací poslední změnu, ať byla jakákoli |
| 2026-08-17 | Dialog sestavy pro první hru (vylepšení #11, AD-15) — z pozorování uživatele |
| 2026-08-17 | Oprava: kolečko v sestavě ukazovalo jinou barvu než paleta a karta |
