# DEV — Dixit Score Web

Technické poznámky: *jak* to stavíme. Architektura, rozhodnutí a jejich důvody, konvence.
Co se staví, je v [`SPEC.md`](SPEC.md).

---

## 1. Architektonická rozhodnutí

Formát: rozhodnutí → důvod → důsledky. **Rozhodnutí se nemění bez zápisu sem.**

### AD-1: Bez frameworku, bez build kroku

**Rozhodnutí:** Nativní ES moduly načítané přímo prohlížečem. Žádný React/Vue, žádný
bundler, žádné `node_modules` pro běh aplikace.

**Důvod:** To, co dělá z webu instalovatelnou aplikaci — manifest, service worker, cache
strategie — je čistě prohlížečové API a je identické s frameworkem i bez něj. Framework
by k odpovědi na otázku „obstojí PWA místo nativní aplikace?" nepřispěl nic a jen
prodloužil cestu k ní. Velikost aplikace (předloha má ~1 400 řádků Kotlinu) je hluboko
pod hranicí, kde se framework vyplácí.

**Důsledky:**
- Žádná minifikace — při této velikosti irelevantní
- ES moduly nelze spustit z `file://` kvůli CORS → pro vývoj je nutný HTTP server
- Stav a překreslování si píšeme sami (AD-2)

**Zvažované alternativy:** Vite + `vite-plugin-pwa` (přidává toolchain a generuje service
worker, kterému pak nikdo nerozumí — jde proti cíli projektu). Compose Multiplatform for
Web / Wasm (zachovalo by Kotlin, ale velký bundle a mizerná podpora na iOS).

### AD-2: Jednosměrný tok stavu, překreslení celé obrazovky

**Rozhodnutí:** Jeden stavový objekt. Akce vytvoří nový stav, `render(state)` překreslí
obrazovku a otevřený dialog.

```
akce → nový state → render(state) → DOM
```

**Důvod:** Zrcadlí model MVVM/Compose z předlohy, takže mapování souborů je přímočaré
(viz kap. 2). Při ≤ 12 hráčích je překreslení pod milisekundu — jemnější aktualizace
by byla předčasná optimalizace.

**Důsledky — dvě výjimky, které musí platit:**

1. **Textová pole jsou nekontrolovaná.** Hodnota jména a skóre žije v DOM elementu a čte
   se až při potvrzení. Bez toho by překreslení při každém stisku klávesy shodilo kurzor
   z rozepsaného textu. Chování navenek je identické s předlohou.
2. **Během tažení se nepřekresluje.** `reorderable-list.js` si po dobu gesta drží DOM sám;
   do stavu zapisuje až na `pointerup`. Jinak by překreslení zabilo probíhající gesto —
   je to tentýž problém, který v Reactu vzniká u „controlled" seznamů.

### AD-3: Drag & drop přes Pointer Events

**Rozhodnutí:** Přeskupení hráčů přes `pointerdown` / `pointermove` / `pointerup`
+ `setPointerCapture`.

**Důvod:** HTML5 Drag and Drop API (`draggable="true"`, `dragstart`/`drop`) na dotykových
zařízeních **nefunguje** — ani v Chrome pro Android, ani v iOS Safari; to API vzniklo pro
myš. Pointer Events sjednocují myš, dotyk i pero a jsou nativní, bez závislosti. Přístup
odpovídá tomu, co dělá `ReorderableList.kt` v předloze.

**Důsledky:** Nutné CSS na položkách seznamu:

```css
touch-action: pan-y;           /* viz AD-9 - none by zabilo scrollování */
user-select: none;
-webkit-touch-callout: none;   /* jinak iOS při podržení vyvolá kontextové menu */
```

> **Revidováno v AD-9.** Původně zde bylo `touch-action: none`; při implementaci se
> ukázalo, že by to znemožnilo scrollování seznamu prstem.

**Funguje v obou rozvrženích** — ve svislém seznamu i v dvousloupcové mřížce
(vylepšení #4 ve [`SPEC.md`](SPEC.md)). O cílové pozici rozhoduje `insertionTarget()`:
najde první sourozeneckou kartu, která leží **za ukazatelem v pořadí čtení**, a vloží
taženou kartu před ni.

- **Svislý seznam** porovnává jen vodorovnou osu (`y < střed karty`) a taženou kartou
  nehýbe do stran — stejně jako předloha.
- **Mřížka** nejdřív vyřadí celé řádky nad a pod ukazatelem, teprve pak rozhodne podle
  vodorovné poloviny karty.

Po každém přesunu v DOM se dopočítá `startX`/`startY` z rozdílu `offsetLeft`/`offsetTop`,
aby karta zůstala pod prstem a nepoškočila.

**Zvažovaná alternativa:** SortableJS (vanilla, osvědčená, řeší auto-scroll i animace).
Zamítnuto kvůli AD-5 — nemáme jedinou závislost a tahle by byla první. Pokud se ruční
implementace ukáže jako problém, je to první kandidát na výjimku.

### AD-4: Nativní `<dialog>`

**Rozhodnutí:** Všechny dialogy jako `<dialog>` element.

**Důvod:** Modalita, backdrop, zavření Escapem a focus trap zdarma od prohlížeče.

**Důsledky:** Vyžaduje Safari 15.4+ (2022) a Chrome 37+. Pokrývá cílová zařízení.

**Pozor na počáteční zaostření.** `showModal()` sám zaostří první zaostřitelný prvek
v dialogu. Když je jím textové pole, na telefonu vyskočí klávesnice a zakryje půl dialogu.
Compose se takhle nechová, takže je to rozdíl vnesený platformou, ne návrhem. Řeší se
`autofocus` na jiném prvku — v dialogu úpravy hráče ho nese nadpis
(`<h2 tabindex="-1" autofocus>`), který navíc odečtou čtečky.

**Každý nový dialog s textovým polem musí tohle vyřešit vědomě.** Dnes nadpis přebírá
zaostření v **obou** dialozích — u úpravy i u přidání.

U dialogu přidání to původně řešené nebylo a klávesnice vyskakovala. Ukázalo se to až
při doplnění dlaždic s naposledy hranými hráči: dlaždice jsou nad polem jména, takže
`showModal()` začal zaostřovat **první dlaždici** a ta vypadala jako vybraná. Kontrola
předlohy ukázala, že Compose nezaostřuje ani tady (`FocusRequester` se v celém projektu
`dixit-score` nevyskytuje), takže nadpis s `autofocus` je **návrat k paritě**, ne
vylepšení — proto to není v tabulce vylepšení v `SPEC.md`.

### AD-5: Nulové běhové závislosti

**Rozhodnutí:** Aplikace nemá žádnou externí knihovnu. Testy běží na vestavěném
`node:test` (Node 18+).

**Důvod:** Politika závislostí — novou závislost zavádět jen s odůvodněním. Žádná zde
odůvodněná není: drag & drop řeší Pointer Events, dialogy řeší `<dialog>`, testy řeší Node.
Vedlejší efekt: nasazení je `git push`, nic se nebuilduje a nic nezastarává.

### AD-6: Escapování uživatelského textu

*(Rozhodnuto při implementaci etapy 1.)*

**Rozhodnutí:** Jména hráčů procházejí `escapeHtml()` z `js/ui/html.js` všude, kde se
vypisují.

**Důvod:** UI se skládá z řetězců a vkládá přes `innerHTML`. Jméno hráče je uživatelský
vstup, takže bez escapování by jméno `<img src=x onerror=alert(1)>` byl spustitelný kód.
Riziko je tu malé (jeden uživatel, žádný server), ale ošetření stojí deset řádků a jeho
absence by byla chyba, kterou by review právem vytklo.

**Důsledky:** Každý nový modul, který vypisuje jméno hráče, musí `escapeHtml` použít.
Barvy a skóre escapování nepotřebují — pocházejí z pevné palety a z `Number.parseInt`.

### AD-7: Toast místo Snackbaru

*(Rozhodnuto při implementaci etapy 1.)*

**Rozhodnutí:** Hlášky se zobrazují vlastním `#toast` prvkem, ne `alert()`.

**Důvod:** Předloha používá Material Snackbar — nemodální proužek dole, který sám zmizí.
`alert()` blokuje vlákno, vypadá jako systémová chyba a musí se odklikávat; paritu
s předlohou by nesplňoval.

**Důsledky:** ~20 řádků CSS a JS navíc. Hláška zmizí po 3 sekundách a teprve pak se
uklidí ze stavu.

### AD-8: Nekontrolovaná textová pole a jejich obnova

*(Rozhodnuto při implementaci etapy 1.)*

**Rozhodnutí:** `syncDialog()` v `js/app.js` si před překreslením dialogu uloží hodnoty
textových polí a po překreslení je vrátí zpět.

**Důvod:** Přímý důsledek výjimky 1 v AD-2. Bez toho by výběr barvy — což je změna
stavu, tedy překreslení — smazal rozepsané jméno hráče. Alternativa (držet text ve stavu)
by při každém stisku klávesy překreslovala dialog a shazovala kurzor.

**Důsledky:** Každý nový dialog s textovým polem musí předat jeho `id` do `syncDialog`.

**Zachování hodnot platí jen po dobu, kdy dialog zůstává otevřený.** Zavřený `<dialog>`
si v DOM ponechá obsah předchozího otevření, takže při novém otevření jsou závazné
**čerstvě vykreslené** hodnoty ze stavu. Původní implementace tuhle podmínku neměla
a dialog úpravy pak ukazoval jméno i skóre předchozího hráče (a dialog přidání jméno
naposledy přidaného). Opraveno podmínkou `wasOpen`; chování hlídají testy
v `test/dialog.test.js`. Kvůli testovatelnosti žije `syncDialog` v `js/ui/dialog.js`,
ne v `js/app.js`.

### AD-9: Tažení versus scrollování

*(Rozhodnuto při implementaci etapy 3.)*

**Rozhodnutí:** Karty mají `touch-action: pan-y` a `reorderable-list.js` si registruje
`touchmove` s `{ passive: false }`, ve kterém volá `preventDefault()` **jen po dobu tažení**.

**Důvod:** `touch-action: none` (původní znění AD-3) by sice tažení umožnil, ale zabil by
scrollování seznamu prstem — což u šesti karet na malém displeji vadí. Protože prst musí
před zahájením tažení 500 ms stát, prohlížeč do té doby scrollování nezahájí a gesto
se stihne převzít.

**Důsledky:** `preventDefault` v neaktivním `touchmove` posluchači nesmí být volán
bezpodmínečně, jinak se scrollování rozbije. Chování je ověřitelné jen na skutečném
dotykovém zařízení — v prohlížeči na počítači se tenhle konflikt neprojeví.

### AD-10: Ikony jako JPEG

*(Rozhodnuto při implementaci etapy 3.)*

**Rozhodnutí:** Ikony manifestu a logo v hlavičce jsou **JPEG**, nikoli PNG.
Favicon zůstává PNG.

**Důvod:** Předlohy (`dixit_score_ico.png`, `dixit_score_logo.png`) jsou fotografické
ilustrace **bez alfa kanálu**, takže PNG na nich komprimuje mizerně — ikona 512×512 měla
558 kB, jako JPEG 47 kB. Celá sada klesla z více než 2 MB na **132 kB**. U aplikace,
která se má celá vejít do offline cache, je to podstatný rozdíl.

**Důsledky:** Manifest deklaruje `"type": "image/jpeg"`. Kdyby některý zdroj v budoucnu
průhlednost měl, musí zůstat PNG — JPEG alfu neumí. Maskable varianta má 20% bezpečnou
zónu a béžové pozadí, aby ji ořez maskou neukousl.

**Stejná past u třístavového zaškrtávátka** „Všichni" (etapa 2): `indeterminate` je
vlastnost DOM, ne HTML atribut — z markupu ji nastavit nelze. Stav se proto vykreslí
do `data-state` a `refreshTriStateCheckbox()` v `js/app.js` ho po každém překreslení
překlopí do vlastnosti.

### AD-11: Layout jako app shell

*(Rozhodnuto při ladění na telefonu.)*

**Rozhodnutí:** Stránka se nescrolluje (`body { height: 100dvh; overflow: hidden }`),
scrolluje se jen seznam hráčů. Odsazení pro čelo a gesto lištu nese **každá lišta sama**,
ne `body`. Tažení dolů je vypnuté přes `overscroll-behavior-y: contain`.

**Důvod:** Původně mělo `body` odsazení pro safe-area a `#app` k tomu `min-height: 100dvh`.
Ty dvě výšky se **sečetly** — s vsazením 47 + 34 px byl dokument o 80 px vyšší než okno
a spodní lišta s tlačítkem bodování skončila pod viditelnou plochou. Na počítači se to
neprojeví, protože tam jsou vsazení nulová. Zároveň s víc hráči lišta odscrollovala pryč,
zatímco `Scaffold` v předloze ji drží na místě.

**Důsledky:**
- Seznam musí mít `min-height: 0`. Položka flexboxu má implicitní `min-height: auto`,
  takže by se nesmrskla pod výšku obsahu a lištu by zase vytlačila. Bez tohohle řádku
  oprava nefunguje a projeví se to až u většího počtu hráčů.
- Nové odsazení od okrajů obrazovky patří do lišt, ne do `body`.
- Ověřovat je nutné se **simulovaným vsazením** — na počítači je chyba neviditelná:
  ```js
  document.head.insertAdjacentHTML('beforeend',
    '<style>.top-bar{padding-top:47px!important}.bottom-bar{padding-bottom:46px!important}</style>');
  ```

### AD-12: Naposledy hraní hráči mají vlastní klíč v úložišti

**Rozhodnutí:** Zapamatovaná jména se ukládají pod `dixit-known-players`, odděleně od
rozehrané hry (`dixit-score`). Vlastní modul `js/known-players.js` si drží logiku i obsluhu
úložiště.

**Důvod:** `storage.js` zahazuje celý uložený stav, když nesedí `VERSION`
(`deserialize()` vrátí `null`). Kdyby se seznam jmen přidal do stejného záznamu, muselo by
se zvýšit `VERSION` — a **komukoli s aplikací na ploše by to smazalo rozehranou hru**.
Vlastní klíč tuhle past obchází úplně: formát hry se nemění, takže není co migrovat.

**Důsledky:**
- Poškozený seznam jmen se opravuje **po položkách**, ne zahozením celku
  (`parseKnown()` odfiltruje vadné záznamy). U hry dává smysl opak — půlka hry je horší
  než žádná —, u pomůcky pro pohodlí ne.
- Seznam nemá pole verze. Kdyby se formát někdy měnil, filtr vadných položek to zvládne
  bez migrace.
- Strop 20 jmen nahrazuje UI pro mazání: starší jména vypadnou sama, a kdo se objeví
  znovu, vrátí se taky sám. Kdyby mazání jednotlivých jmen bylo potřeba, je to nová
  funkce, ne dořešení téhle.

### AD-13: Univerzální „Vrátit", snímek se bere v `update()` a neukládá se

**Rozhodnutí:** *Vrátit* vrací **poslední změnu, ať byla jakákoli** — přidání, smazání,
úpravu, přetažení, změnu vypravěče, bodování i novou hru. Jedna úroveň. Snímek se bere
na **jednom místě**, v `update()`, a drží se jen v paměti (`state.undo`).

**Důvod:** První verze uměla vrátit jen bodování a novou hru a **každá jiná změna
tlačítko schovala**. Od stolu to vypadalo, že se undo „spotřebovalo" něčím nesouvisejícím.
Tlačítko pojmenované *Vrátit* slibuje vrácení poslední změny, tak ať to dělá.

Univerzální varianta je navíc **méně kódu**: zmizelo pět rozesetých `undo: null`
a s nimi celá třída chyb „u nové akce jsem zapomněl snímek zneplatnit".

**Jak se pozná změna hry:** patch v `update()` sahá na `players` nebo `roundNumber`
(`GAME_KEYS`). Otevření dialogu, menu ani hláška snímek nevytvoří. Patch smí `undo`
nastavit sám — tak `undoLast()` zabrání tomu, aby se zaznamenalo vlastní obnovení
a z tlačítka se stal přepínač.

**Neukládá se do `localStorage`,** takže po obnovení stránky se vrátit nedá. Uložit
by znamenalo změnit formát uloženého záznamu, a `storage.js` při neshodě `VERSION`
zahodí celou rozehranou hru (AD-12). Vracet se chce vteřinu po chybném klepnutí,
ne po restartu telefonu.

**Důsledky:**
- Nová akce nemusí o undo vědět vůbec nic — stačí, že jde přes `update()`.
- **Jedna úroveň, ne zásobník.** Pokrývá „ťukl jsem vedle" a nevyvolává otázku,
  jak hluboko se dá jít.
- Vrácení přidání hráče **nechá jeho jméno mezi naposledy hranými** (jiný klíč
  v úložišti, viz AD-12). Je to spíš žádoucí, ale je to odchylka od „vrátí se všechno".

### AD-14: Držení displeje přes Screen Wake Lock

**Rozhodnutí:** `navigator.wakeLock.request('screen')` v `js/wake-lock.js`, bez přepínače,
vše tiše selhává.

**Důvod:** Nativní API, žádná závislost — v duchu pravidla „ověř, že to neumí prohlížeč".
Bez přepínače proto, že zámek se při schování stránky uvolní sám, takže scénář „mám to
v kapse a svítí to" API řeší za nás. Zbývá jen „leží to na stole", což je přesně ten
důvod, proč se to zapíná.

**Důsledky:**
- ⚠️ **Zámek se automaticky uvolňuje, kdykoli se stránka schová.** Bez opětovného
  vyžádání na `visibilitychange` by fungoval do prvního přepnutí aplikace a pak by se
  tvářil rozbitě.
- Vyžaduje zabezpečený kontext — Pages a `localhost` ano, LAN adresa ne. Stejné omezení
  jako service worker, takže testovat z telefonu přes IP nemá smysl.
- V úsporném režimu iOS požadavek selže. Musí to zůstat bez následku.
- Safari až od iOS 16.4; na starším iPhonu se prostě nic nestane.

### AD-15: Dialog sestavy a dvourežimové tlačítko

**Rozhodnutí:** Tlačítko v horní liště má dva režimy podle toho, jestli jsou hráči.
Bez hráčů je to **Nová hra** a otevře dialog sestavy; s hráči **Další hra** a otevře
dosavadní menu s výběrem vypravěče.

**Důvod:** *Nová hra* je pro nového uživatele nejpřirozenější první krok, ale bez hráčů
otevřela prázdné menu — slepá ulička. Předloha to má stejně (`GameScreen.kt:130`,
`TextButton` bez `enabled`, `DropdownMenu` nad prázdným `players.forEach`), takže to
nebyla regrese, ale zděděná vada.

Zakázat tlačítko by uličku odstranilo, ale nováčkovi by nic neporadilo. Dialog sestavy
řeší obojí — a navíc nahradí šest průchodů modálem *Přidat hráče* jedním místem.

**Jedno tlačítko ve dvou režimech je obecně varovný signál**, tady ale obstojí: obojí je
„připrav další hru", jen se jednou vybírá *kdo hraje* a podruhé *kdo vypráví*. Podmínkou
je, že se mění i popisek — jinak by tlačítko slibovalo něco jiného, než udělá. Řetězec
`next_game` proto v předloze nemá protějšek.

**Důsledky:**
- **Sestava se skládá do konceptu** (`setupDialog.draft`), skuteční hráči vzniknou až
  potvrzením. *Zrušit* tak nenechá stopu — ani hráče, ani zapamatovaná jména.
- **Potvrzení jde přes `update()` s `players`, takže je rovnou vratné** tlačítkem
  *Vrátit* — bez řádku kódu navíc (AD-13).
- **Vznikly dvě cesty, jak založit hráče.** Dialog *Přidat hráče* zůstává, protože někdo
  dorazí uprostřed partie. Sdílí se paleta, dlaždice naposledy hraných i pravidla
  z `rules.js`, takže se nemůže rozejít logika — dvojí zůstává jen markup.
- **Barvy přiděluje `nextFreeColor()`** v `palette.js` (ne v `rules.js` — je to věc
  palety, ne herních pravidel). Klepnutí na kolečko cyklí na další barvu, kterou nikdo
  jiný nemá. Celou dvanáctibarevnou paletu do řádku necpeme; konkrétní odstín se doklikne
  přes kartu hráče, kde paleta už je.
- Prázdný stav má **dvě znění** — s dlaždicemi a bez nich. Při úplně prvním spuštění
  není nad textem co vybírat, takže odkaz „vyberte nahoře" by byl lež.

---

## 2. Struktura projektu

Zrcadlí strukturu předlohy, aby šlo obojí srovnat vedle sebe:

```
index.html                    vstupní bod, <dialog> elementy, odkaz na manifest
manifest.webmanifest
sw.js                         service worker (ručně psaný, komentovaný)
css/styles.css                barevné schéma, layout, safe-area
js/app.js                     bootstrap: načtení stavu, navěšení handlerů, první render
js/state.js                   ≙ GameViewModel.kt   — stav a akce
js/rules.js                   ≙ bodovací logika    — čisté funkce, bez DOM
js/storage.js                 serializace + localStorage (rozehraná hra)
js/known-players.js           naposledy hraní hráči — vlastní klíč v úložišti (AD-12)
js/wake-lock.js               držení displeje rozsvíceného (AD-14)
js/i18n.js                    ≙ values/strings.xml, values-cs/strings.xml
js/ui/game-screen.js          ≙ GameScreen.kt
js/ui/player-card.js          ≙ PlayerRow
js/ui/setup-dialog.js         sestava před první hrou (AD-15) — bez protějšku v předloze
js/ui/add-player-dialog.js    ≙ AddPlayerDialog.kt
js/ui/edit-player-dialog.js   ≙ EditPlayerDialog.kt
js/ui/scoring-dialog.js       ≙ ScoringDialog.kt (3 kroky)
js/ui/reorderable-list.js     ≙ ReorderableList.kt
icons/                        ikony manifestu
test/                         testy pro node --test
```

Grafika se přebírá z předlohy: `dixit_score_logo.png` do hlavičky,
`ds_launcher.png` jako podklad pro ikony manifestu.

---

## 3. Konvence

- **Komentáře anglicky**, stručně. Dokumentace, popisy a commity česky.
- `camelCase` proměnné a funkce, `PascalCase` konstruktory, `UPPER_SNAKE_CASE` konstanty.
- Jeden soubor = jedna odpovědnost. Přes ~200 řádků je signál, že dělá dvě věci.
- Žádné „magic values" — barvy, limity a texty do konstant nebo do `i18n.js`.
- `const` před `let`; early return před zanořováním.
- Funkce v `rules.js` jsou **čisté** — žádný DOM, žádný `localStorage`, žádný čas.
  Je to jediný způsob, jak zůstanou testovatelné.

---

## 4. Testování

```bash
node --test
```

Kořenový `package.json` obsahuje výhradně `{"type":"module"}`. Bez něj Node čte `.js`
jako CommonJS a `import` v testech selže. **Nesmí do něj nikdy přibýt závislost** —
neruší AD-5, protože do prohlížeče se nedostane a aplikace ho k běhu nepotřebuje.

**TDD je povinné** pro `js/rules.js` a pro `serialize`/`deserialize` v `js/storage.js`:
red (test selže) → green (minimální implementace) → refactor.

Obal nad `localStorage` se netestuje — je to pět řádků a v Node `localStorage` není.
UI a dotyková gesta se testují ručně na zařízení; automatizovat je se u aplikace téhle
velikosti nevyplatí. Seznam ručních kritérií je v [`SPEC.md`](SPEC.md), kap. 11.

---

## 5. Lokální vývoj

Aplikace nemá build krok. Potřebuje jen HTTP server — z `file://` nepoběží kvůli CORS
u ES modulů a service worker se odtamtud nezaregistruje vůbec.

```bash
python tools/dev-server.py 8000
```

`localhost` je výjimka z požadavku na HTTPS, takže service worker funguje i bez certifikátu.

### Dvě nezávislé vrstvy zvětralého kódu

Tohle už třikrát stálo hodiny ladění přeludu. Po úpravě souboru může prohlížeč
servírovat starou verzi hned ze **dvou** důvodů:

1. **HTTP cache prohlížeče.** `python -m http.server` neposílá `Cache-Control`, takže
   prohlížeč JS moduly cachuje heuristicky. Proto existuje `tools/dev-server.py`,
   který posílá `no-store`. **Nepoužívej `python -m http.server`.**
2. **Service worker.** Cachuje nezávisle na HTTP cache. V DevTools → Application →
   Service Workers zapni **Update on reload**.

`tools/dev-server.py` proto ve výchozím stavu **podstrčí místo `sw.js` worker, který se
sám odregistruje a smaže cache**. Offline režim se testuje přepínačem `--sw`.

**Jak poznat, že na to jsi narazil:** v konzoli spusť

```js
performance.getEntriesByType('resource').filter(e => e.name.includes('/js/'))
```

a porovnej seznam s tím, co aplikace opravdu importuje. Chybějící modul znamená,
že běží stará verze. Nouzový úklid:

```js
(await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister());
(await caches.keys()).forEach(n => caches.delete(n));
```

Nejrychlejší obchvat obojího při ověřování: **spustit server na jiném portu** —
jiný původ má vlastní HTTP cache i vlastní registraci service workeru.

---

## 6. Nasazení

GitHub Pages z repozitáře `Worsik/dixit-score-web`. Nasazení = push; nic se nebuilduje.

HTTPS je podmínka, aby se service worker zaregistroval. GitHub Pages ho poskytuje.

**Po každém nasazení** je potřeba zvýšit verzi cache v `sw.js` — jinak uživatelé
s nainstalovanou aplikací dostanou starou verzi ze své cache.

---

## 7. iOS specifika

Řeší se od začátku, retrofit je dražší:

- `viewport-fit=cover` v meta tagu + `env(safe-area-inset-*)` v CSS — kvůli čelu a spodní
  liště iPhonu
- `-webkit-touch-callout: none` na položkách seznamu (viz AD-3)
- Safari instalaci sama nenabídne → v aplikaci návod „Sdílet → Přidat na plochu"
- Aplikaci na iOS umí nainstalovat **jen Safari**, žádný jiný prohlížeč

---

## 8. Rizika

| Riziko | Dopad | Ošetření |
|--------|-------|----------|
| iOS Safari zahodí záložku na pozadí | Ztráta rozehrané hry | Persistence (`SPEC.md` kap. 7) |
| Long-press na iOS vyvolá kontextové menu místo tažení | Rozbité přeskupování | CSS dle AD-3, ověřit na skutečném iPhonu |
| Překreslení během tažení shodí gesto | Rozbité přeskupování | Výjimka 2 v AD-2 |
| Service worker si zacachuje starou verzi | Uživatel nedostane opravy | Verzovaný název cache, úklid při `activate`, zvýšit verzi při každém nasazení |
| Ruční drag & drop se ukáže jako nespolehlivý | Klíčová funkce nefunguje | První kandidát na výjimku z AD-5 je SortableJS |
| Ověří se jen Android, iPhone ne | Klíčová otázka projektu zůstane nezodpovězená | Ruční test na iPhonu je akceptační kritérium, ne bonus |
