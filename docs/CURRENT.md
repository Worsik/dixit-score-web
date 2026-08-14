# CURRENT — živý stav projektu

> Aktualizuje se po každém dokončeném kroku. Krok, po kterém tenhle soubor nesedí,
> není hotový.

**Poslední aktualizace:** 2026-08-15

---

## Kde jsme

**Etapy 1 a 2 jsou hotové a ověřené — aplikace umí odehrát celou partii Dixitu.**
Správa hráčů, bodování o třech krocích včetně bonusových hlasů, rotace vypravěče,
nová hra a persistence. Chybí už jen PWA vrstva a přeskupení hráčů tažením.

Práce je rozdělená do tří etap. Plán vzniká vždy až pro následující etapu, ne dopředu.

| Etapa | Obsah | Stav |
|-------|-------|------|
| 1 | Jádro (pravidla, persistence, texty, stav) a správa hráčů | **hotovo** |
| 2 | Bodovací dialog o třech krocích, nová hra | **hotovo** |
| 3 | Přeskupení tažením, mřížka nad 6 hráčů, PWA vrstva, nasazení | plán nenapsán |

## Další krok

Sestavit plán etapy 3 — přeskupení tažením, mřížka nad 6 hráčů, PWA vrstva a nasazení.

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

**Testy: 39, všechny zelené.**

## Zbývá

### Etapa 3

- [ ] Plán etapy 3
- [ ] `js/ui/reorderable-list.js` — přeskupení tažením (Pointer Events)
- [ ] Mřížka nad 6 hráčů (zatím se i nad 6 hráčů vykresluje jednoduchý seznam)
- [ ] `manifest.webmanifest`, `sw.js`, ikony — PWA vrstva
- [ ] Zmenšit `icons/logo.png` (379 kB je na offline cache moc) a doplnit favicon
- [ ] Nasazení na GitHub Pages
- [ ] Ruční ověření na Androidu
- [ ] Ruční ověření na iPhonu

## Blokery

Žádné.

## Otevřené otázky

Žádné. *(GitHub issues se zatím nezakládají — jede se podle plánů v `docs/plans/`.)*

## Log změn

| Datum | Co |
|-------|-----|
| 2026-08-14 | Probráno zadání, schválen návrh, založen repozitář a dokumentace projektu |
| 2026-08-14 | Napsán plán etapy 1; při jeho psaní opraveny parafrázované texty v `SPEC.md` na doslovné znění z předlohy |
| 2026-08-15 | Implementována a ověřena etapa 1 — jádro a správa hráčů |
| 2026-08-15 | Implementována a ověřena etapa 2 — bodování a nová hra |
