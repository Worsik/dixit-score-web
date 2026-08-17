# Plán — přetečné menu v liště, *Nová hra* dostupná vždy

**Větev:** `feat/menu-v-liste`
**Zadání:** *„V aplikaci nám stále chybí ukončení hry, nebo vymazání seznamu, aby bylo možno
použít hromadný formulář znovu. Je to ale další volba menu, které by tedy stálo za to už
seskupit."*
**Stav:** hotovo, ověřeno v prohlížeči (412×915 i 375×667)

---

## Proč to jsou dvě věci najednou

Vymazat seznam dneska **jde** — hráče lze smazat jednoho po druhém — ale u dvanácti hráčů
je to dvanáct otevření karty a dvanáct potvrzení. Není to chybějící funkce, je to chybějící
zkratka. Důsledek ale je, že dialog sestavy (vylepšení #10) člověk uvidí jednou za život,
přestože jsme ho stavěli přesně na tuhle situaci.

Přidat na to tlačítko znamená **čtvrtou** položku v horní liště. A `.top-bar-actions` má
`flex-direction: column` — tlačítka jsou pod sebou, takže lišta nestojí šířku, ale **výšku**.
Dnes tři řádky po 44 px, se čtvrtým 176 px. Proto se obojí řeší jedním zásahem.

## Rozhodnutí (schválená v diskusi)

| Věc | Rozhodnutí |
|---|---|
| Akce | **Nová hra** dostupná i s neprázdným seznamem — otevře rovnou dialog sestavy |
| Nový pojem | **Žádný.** Dvojici *Nová hra* / *Další hra* appka už má, jen je dnes *Nová hra* dosažitelná pouze při prázdném seznamu |
| Co zůstane vidět | **Další hra** (resp. *Nová hra*) a **Vrátit** |
| Co se schová do ⋮ | Přidat hráče, Jak se hraje, Nová hra |
| Potvrzovací dialog | **Ne** — viz níže |

### Význam obou akcí

| | Hráči | Skóre | Kolo | Vypravěč |
|---|---|---|---|---|
| **Další hra** | stejní | vynuluje | na 1 | vybere se v rozbalovátku |
| **Nová hra** | poskládají se znovu v sestavě | vynuluje | na 1 | první v pořadí |

### Proč jeden krok místo dvou

Původní návrh byl *Vyprázdnit seznam* a teprve pak *Nová hra* → sestava. Jedna položka,
která otevře sestavu rovnou, je lepší ze tří důvodů:

1. **Kód to už umí.** `confirmSetup()` staví hráče přes `reduce(…, [])` — od nuly, ne
   přidáním k existujícím — a nastavuje `roundNumber: 1`. Tedy **nahrazuje**. Nad neprázdným
   seznamem udělá přesně to, co chceme, a žádná nová akce ve stavu není potřeba.
2. **Zrušit nic nerozbije.** Ve dvoukrokové verzi vedlo zrušení sestavy po vymazání
   k prázdnému seznamu a člověk si musel vzpomenout na *Vrátit*. Takhle zrušení nechá starou
   partu netknutou — což je zásada, kterou má dialog sestavy napsanou v komentáři od začátku.
3. **Undo kryje ten jeden skutečný krok.** `confirmSetup()` sahá na `players`
   i `roundNumber`, takže `update()` bere snapshot (AD-13) a *Vrátit* obnoví starou partu
   včetně čísla kola.

Proto se **nedělá potvrzovací dialog** ani se položka nebarví `.button-danger`. Červená je
pro nevratné; tohle vratné je a stojí to jedno klepnutí.

### Známé riziko pojmenování

*Nová hra* a *Další hra* se liší jedním přídavným jménem a z popisků nejde poznat, která
z nich rozpustí partu. Bereme to vědomě, protože **špatný odhad nic nestojí**: otevře se
dialog s nadpisem *Nová hra* a prázdným seznamem k poskládání, *Zrušit* nenechá stopu.
Kdyby se v praxi ukázalo, že si lidé pletou právě tyhle dvě, je to jednořádková oprava
popisku — ne přestavba.

### Co s prázdným seznamem

Dvojrežimové tlačítko zůstává beze změny: prázdný seznam → *Nová hra* → sestava, neprázdný →
*Další hra* → výběr vypravěče. Prvopoužívající se do ⋮ dívat nebude, takže tuhle cestu
potřebuje mít vidět.

Položka v menu se u **prázdného seznamu neukáže** — jmenovala by se stejně jako tlačítko
vedle ní a dělala totéž. Sedí pod oddělovačem jako poslední, takže se kvůli tomu zbylé dvě
položky neposouvají.

### Jména staré party se neztratí

`suggest()` filtruje známá jména proti **draftu**, ne proti aktuálním hráčům, takže se stará
parta objeví mezi dlaždicemi *Naposledy hráli* a poskládat skoro stejnou sestavu je pár
klepnutí. (Výjimka: hráč přejmenovaný přes editaci se pod novým jménem nepamatuje —
`remember()` se volá při přidání, ne při přejmenování, aby se nepamatovaly překlepy cestou.
Známé chování.)

## Návrh lišty

```
┌──────────────────────────────────────────┐
│  [ logo ]              [ Další hra    ]  │   ← řádek 1: text
│                        [ ↺ ]   [ ⋮ ]     │   ← řádek 2: dvě ikony vedle sebe
└──────────────────────────────────────────┘
```

Dva řádky místo tří (88 px místo 132), a se čtvrtou funkcí to nenaroste. *Vrátit* se smrskne
na ikonu `↺` — má `title` i `aria-label`, symbol je srozumitelný a šlo o výslovný návrh
z minulé diskuse. Když není co vracet, zbude na řádku jen `⋮`.

**Otazník z lišty mizí** — *Jak se hraje* se stěhuje do menu. Tím osiří `.help-button`
i workaround `.top-bar-brand img { max-width: calc(100% - 48px) }`, který existoval jen kvůli
tomu, aby se otazník vešel vedle loga; obojí se smaže (§3 — osiřelé vlastní změnou).

> Poznámka na později, ne úkol: pokud se ukáže, že nápovědu při prvním spuštění nikdo
> nenajde, nejlevnější oprava je odkaz přímo v dialogu sestavy. Zatím to neřešíme.

## Jeden stav pro obě menu

`state.newGameMenuOpen` je boolean. Se dvěma rozbalovacími nabídkami to nestačí — a hlavně
`app.js:112` zavírá menu při kliknutí mimo takhle:

```js
if (event.target.closest('.menu')) return;
```

Se dvěma `.menu` kontejnery by klepnutí na tlačítko druhého menu **nezavřelo** to první;
zůstala by otevřená obě. Proto:

```js
openMenu: null,   // null | 'new-game' | 'overflow'
```

Vzájemná výlučnost pak plyne ze tvaru stavu, není to pravidlo, na které se musí pamatovat.
Je to přejmenování existujícího pole, ale vynucené zadáním — bez něj má úkol chybu.

---

## Kroky

### 1. Stav: `openMenu` místo `newGameMenuOpen`

- [x] `js/state.js` — pole přejmenovat, `toggleNewGameMenu(isOpen)` → `setOpenMenu(which)`
      (`null` zavírá). **Odchylka od plánu:** `startGameWith()` nabídku nezavírá vůbec —
      zavírání převzala UI vrstva v `app.js` (klik do `.menu-items`), takže ani
      `openHelp()` a `openAddDialog()` nemusí vědět, že je volá menu
- [x] `js/app.js` — přepnout obě obsluhy včetně té na `document`
- [x] `js/ui/game-screen.js` — `renderNewGameMenu` čte `state.openMenu === 'new-game'`
- **Ověření:** `node --test` zelené (68), appka se chová jako dřív — *Další hra* rozbalí
  seznam vypravěčů, klepnutí mimo ho zavře

### 2. Přetečné menu v liště

- [x] i18n `menu_button` (en *More*, cs *Další volby*) pro `aria-label` u ⋮ — **jediný
      nový textový klíč celé etapy**
- [x] `js/ui/game-screen.js` — `renderOverflowMenu(state)`: Přidat hráče · Jak se hraje ·
      ⎯ · Nová hra (poslední jen když `players.length > 0`)
- [x] `?` z lišty pryč; `add-player`, `help` i `setup` se stěhují dovnitř menu — hodnoty
      `data-action` zůstávají stejné, takže obsluhy v `app.js` se nemění
- [x] `Vrátit` jen jako ikona `↺`, `.icon-button`, popisek zůstává v `title` + `aria-label`
- [x] `js/app.js` — obsluha `data-action="overflow"`
- **Ověření:** obě menu se navzájem zavírají; klepnutí mimo zavře to otevřené; *Nová hra*
  v menu otevře sestavu s prázdným draftem a s dlaždicemi současných hráčů; u prázdného
  seznamu položka v menu chybí

### 3. CSS

- [x] `.top-bar-actions` — druhý řádek jako `flex-direction: row`, ikony vedle sebe
- [x] oddělovač v menu (`.menu-separator`)
- [x] smazat `.help-button` a `.top-bar-brand img { max-width: … }`
- [x] **Nález při ověřování:** `.menu-item` měl 41 px — jen `padding: 10px` bez `min-height`.
      Chyba byla v kódu už u seznamu vypravěčů, ale začala vadit, až když se do menu
      přesunula tlačítka, která venku 44 px měla (`.button-text`). Doplněno `min-height: 44px`
      a `display: flex; align-items: center` kvůli svislému vystředění
- **Ověření (Playwright, 412×915 i 375×667):** lišta má nejvýš dva řádky akcí; každá
  klikatelná plocha ≥ 44 px; `scrollWidth <= innerWidth`

### 4. Celý cyklus

- **Ověření (Playwright):** *Nová hra* → sestava → tři hráči → odehrát kolo →
  ⋮ → *Nová hra* → **Zrušit** → stará parta i skóre nedotčené → znovu ⋮ → *Nová hra* →
  dvě jiná jména → *Začít hru* → seznam nahrazen, kolo zpátky na 1, vypravěč první
  v pořadí → *Vrátit* → původní tři hráči i skóre i číslo kola zpátky
- **Ověření:** po nahrazení nezůstávají viset stará id — otevřít kartu hráče, bodování
  proběhne normálně

### 5. Dokumentace a nasazení

- [x] `docs/SPEC.md` — vylepšení #13 (menu v liště, *Nová hra* dostupná vždy)
- [x] `docs/DEV.md` — **AD-18**: *Nová hra* nad neprázdným seznamem místo dvoukrokového
      vyprázdnění; opřeno o to, že `confirmSetup()` nahrazuje, a bez potvrzovacího dialogu,
      protože undo. **AD-19**: jedno pole `openMenu` kvůli výlučnosti dvou nabídek
- [x] `docs/BACKLOG.md` — bod 2 (statistiky) má nově háček: potvrzení *Nové hry* je okamžik,
      kdy appka ví, že předchozí hra skončila. Nedělá se teď, jen se to poznamená
- [x] `docs/CURRENT.md`
- [x] `sw.js` → `CACHE_VERSION = 'v11'`
- **Ověření:** `node --test` zelené, ruční kontrola na Pages po nasazení

---

## Co se nedělá

- **Předvyplnění draftu současnými hráči.** To by z *Nové hry* udělalo „upravit sestavu",
  což je jiná funkce — a v kombinaci s pořadím a barvami by nahradila i *Další hru*.
  Zatím ne; *Nová hra* znamená čistý list, jména jsou v dlaždicích.
- **Závěrečné pořadí / vítěz.** Potvrzení *Nové hry* je k tomu přirozené místo, ale je to
  samostatná funkce a visí na ní backlogový bod 2. Až bude jasné, že chybí.
- **Zmenšení loga.** 150 px je pořád největší položka lišty, ale je to jiná stížnost než
  tahle a nikdo o ni nežádal.
- **Doladění velikostí a odsazení.** Až po testu na iPhonu — tenhle plán vychází z počtu
  položek, ne z pixelů.
