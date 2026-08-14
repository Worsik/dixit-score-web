# CURRENT — živý stav projektu

> Aktualizuje se po každém dokončeném kroku. Krok, po kterém tenhle soubor nesedí,
> není hotový.

**Poslední aktualizace:** 2026-08-14

---

## Kde jsme

Zadání je probrané a schválené, dokumentace projektu založena, plán etapy 1 napsán.
**Kód zatím žádný** — implementace nezačala.

Práce je rozdělená do tří etap. Plán vzniká vždy až pro následující etapu, ne dopředu.

| Etapa | Obsah | Stav |
|-------|-------|------|
| 1 | Jádro (pravidla, persistence, texty, stav) a správa hráčů | plán hotov |
| 2 | Bodovací dialog o třech krocích, nová hra | plán nenapsán |
| 3 | Přeskupení tažením, mřížka nad 6 hráčů, PWA vrstva, nasazení | plán nenapsán |

## Další krok

Odsouhlasit plán `docs/plans/2026-08-14-etapa-1-jadro-a-hraci.md` a spustit implementaci
od Tasku 1.

## Hotovo

- [x] Analýza Android předlohy (`Worsik/dixit-score`, commit `280bed9`) — chování všech
      obrazovek a dialogů vytěženo do specifikace
- [x] Rozhodnutí o přístupu: bez frameworku, bez buildu, nativní ES moduly (viz `DEV.md`)
- [x] `docs/SPEC.md` — co se staví, akceptační kritéria
- [x] `docs/PRD.md` — proč a pro koho
- [x] `docs/DEV.md` — architektura, rozhodnutí, konvence
- [x] `README.md`, projektový `CLAUDE.md`, `.gitignore`
- [x] Repozitář `Worsik/dixit-score-web` založen
- [x] Plán etapy 1 — `docs/plans/2026-08-14-etapa-1-jadro-a-hraci.md`

## Zbývá

### Etapa 1

- [x] `js/rules.js` — rotace vypravěče (8 testů)
- [ ] `js/rules.js` — bodování kola
- [ ] `js/rules.js` — správa hráčů, nová hra, zápis bodů
- [ ] `js/state.js` — stav a akce
- [ ] `js/storage.js` + testy (TDD) — persistence
- [ ] `js/i18n.js` + testy — texty en/cs
- [ ] `js/palette.js`, `js/state.js` — paleta, stav a akce
- [ ] `index.html`, `css/styles.css`, `js/app.js` — kostra a téma
- [ ] `js/ui/html.js`, `player-card.js`, `game-screen.js` — seznam hráčů
- [ ] `js/ui/color-picker.js`, `add-player-dialog.js` — přidání hráče
- [ ] `js/ui/edit-player-dialog.js` — úprava a smazání hráče

### Etapa 2

- [ ] Plán etapy 2
- [ ] `js/ui/scoring-dialog.js` — bodování o třech krocích
- [ ] Nová hra s výběrem vypravěče

### Etapa 3

- [ ] Plán etapy 3
- [ ] `js/ui/reorderable-list.js` — přeskupení tažením (Pointer Events)
- [ ] Mřížka nad 6 hráčů
- [ ] `manifest.webmanifest`, `sw.js`, ikony — PWA vrstva
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
