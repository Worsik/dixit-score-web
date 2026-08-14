# CURRENT — živý stav projektu

> Aktualizuje se po každém dokončeném kroku. Krok, po kterém tenhle soubor nesedí,
> není hotový.

**Poslední aktualizace:** 2026-08-15

---

## Kde jsme

**Aplikace je funkčně hotová.** Umí odehrát celou partii Dixitu, přeskupit hráče tažením,
běží offline a je instalovatelná na plochu. Ověřeno v prohlížeči včetně skutečného
offline testu se zabitým serverem.

**Zbývá jediné: nasadit ji a vyzkoušet na skutečných telefonech.** To je zároveň to,
kvůli čemu projekt vznikl — dokud neproběhne test na iPhonu, otázka „obstojí PWA místo
nativní aplikace?" zůstává nezodpovězená.

| Etapa | Obsah | Stav |
|-------|-------|------|
| 1 | Jádro (pravidla, persistence, texty, stav) a správa hráčů | **hotovo** |
| 2 | Bodovací dialog o třech krocích, nová hra | **hotovo** |
| 3 | Přeskupení tažením, mřížka nad 6 hráčů, PWA vrstva | **hotovo** (kód) |
| 3 | Nasazení na GitHub Pages a akceptace na zařízeních | **zbývá** |

## Další krok

**Zapnout GitHub Pages** — vyžaduje souhlas člověka, je to zveřejnění na veřejné adrese.
Pak ruční akceptace na Androidu a iPhonu.

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

## Zbývá

- [ ] Zapnout GitHub Pages *(čeká na souhlas — zveřejnění na veřejné adrese)*
- [ ] Doplnit adresu do `README.md`
- [ ] **Ruční akceptace na skutečném Androidu** — instalace na plochu, offline, tažení prstem
- [ ] **Ruční akceptace na skutečném iPhonu** — Safari „Přidat na plochu", offline,
      tažení prstem, safe-area kolem čela

### Co nelze ověřit v prohlížeči na počítači

- Zda tažení prstem nekoliduje se scrollováním (AD-9)
- Zda podržení na iOS nevyvolá kontextové menu
- Zda instalace na plochu proběhne a aplikace se spustí bez adresního řádku
- Zda iOS neodstřelí uložená data

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
| 2026-08-15 | Implementována etapa 3 — tažení, mřížka, PWA vrstva; ikony zmenšeny z 2 MB na 132 kB; ověřen offline běh |
