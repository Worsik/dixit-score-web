# CURRENT — živý stav projektu

> Aktualizuje se po každém dokončeném kroku. Krok, po kterém tenhle soubor nesedí,
> není hotový.

**Poslední aktualizace:** 2026-08-14

---

## Kde jsme

Zadání je probrané a schválené, dokumentace projektu založena. **Kód zatím žádný** —
implementace nezačala.

## Další krok

Sestavit implementační plán do `docs/plans/` a nechat ho schválit.

## Hotovo

- [x] Analýza Android předlohy (`Worsik/dixit-score`, commit `280bed9`) — chování všech
      obrazovek a dialogů vytěženo do specifikace
- [x] Rozhodnutí o přístupu: bez frameworku, bez buildu, nativní ES moduly (viz `DEV.md`)
- [x] `docs/SPEC.md` — co se staví, akceptační kritéria
- [x] `docs/PRD.md` — proč a pro koho
- [x] `docs/DEV.md` — architektura, rozhodnutí, konvence
- [x] `README.md`, projektový `CLAUDE.md`, `.gitignore`
- [x] Repozitář `Worsik/dixit-score-web` založen

## Zbývá

- [ ] Implementační plán v `docs/plans/`
- [ ] `js/rules.js` + testy (TDD) — herní pravidla
- [ ] `js/state.js` — stav a akce
- [ ] `js/storage.js` + testy (TDD) — persistence
- [ ] `js/i18n.js` — texty en/cs
- [ ] `index.html`, `css/styles.css` — kostra a téma
- [ ] `js/ui/` — hlavní obrazovka, karta hráče, čtyři dialogy
- [ ] `js/ui/reorderable-list.js` — přeskupení tažením (Pointer Events)
- [ ] `manifest.webmanifest`, `sw.js`, ikony — PWA vrstva
- [ ] Nasazení na GitHub Pages
- [ ] Ruční ověření na Androidu
- [ ] Ruční ověření na iPhonu

## Blokery

Žádné.

## Otevřené otázky

- Jestli vést implementaci proti GitHub issues, nebo jen podle plánu v `docs/plans/`.

## Log změn

| Datum | Co |
|-------|-----|
| 2026-08-14 | Probráno zadání, schválen návrh, založen repozitář a dokumentace projektu |
