# Dixit Score — webová verze (PWA)

Počítadlo skóre pro deskovou hru **Dixit**. Běží v prohlížeči, dá se přidat na plochu
telefonu a funguje offline — **bez Google Play a bez App Store**.

Je to webový přepis [nativní Android aplikace `dixit-score`](https://github.com/Worsik/dixit-score)
(Kotlin + Jetpack Compose) se **shodným chováním**.

### 👉 https://worsik.github.io/dixit-score-web/

Otevři na telefonu a přidej na plochu — návod níže.

## Proč to existuje

Vznikl spor, jestli je pro mobilní aplikaci nutná nativní implementace, nebo jestli stačí
webová stránka uložená v telefonu jako aplikace. Tenhle repozitář je odpověď postavená
z reálného zadání: vzít existující nativní aplikaci a zjistit, co se cestou na web ztratí.

Podrobněji v [`docs/PRD.md`](docs/PRD.md).

## Stav

Funkčně hotová — správa hráčů, bodování podle pravidel Dixitu, přeskupení tažením,
offline běh a instalace na plochu. Zbývá nasadit na veřejnou adresu a vyzkoušet
na skutečných telefonech. Podrobnosti v [`docs/CURRENT.md`](docs/CURRENT.md).

## Spuštění lokálně

Aplikace nemá build krok ani závislosti. Potřebuje jen HTTP server — z `file://`
nepoběží, protože ES moduly a service worker to nedovolí.

```bash
python tools/dev-server.py 8000          # běžný vývoj
python tools/dev-server.py 8000 --sw     # test offline režimu
```

Pak otevřít `http://localhost:8000`. `localhost` je výjimka z požadavku na HTTPS,
takže service worker se zaregistruje i bez certifikátu.

> **Nepoužívej `python -m http.server`.** Neposílá `Cache-Control`, takže prohlížeč
> po úpravě souboru servíruje starou verzi a ladíš přelud.
>
> `tools/dev-server.py` navíc ve výchozím stavu podstrčí místo `sw.js` worker, který se
> sám odregistruje a smaže cache — jinak by starou verzi servíroval zase service worker.
> Offline režim a instalaci na plochu testuj s přepínačem `--sw`.

## Testy

```bash
node --test
```

Bez závislostí — používá se vestavěný test runner z Node 18+.

## Instalace na telefon

**Android (Chrome):** otevřít adresu, prohlížeč sám nabídne *Instalovat aplikaci*.

**iPhone (Safari):** otevřít adresu, *Sdílet* → *Přidat na plochu*. Safari instalaci
sama nenabídne a jiný prohlížeč než Safari na iOS aplikaci nainstalovat neumí.

## Struktura

```
index.html · manifest.webmanifest · sw.js
css/      styly
js/       aplikace (ES moduly, bez buildu)
  rules.js    herní pravidla — čisté funkce
  state.js    stav a akce
  ui/         obrazovka, dialogy, tažení
icons/    ikony a logo (132 kB celkem)
test/     testy pro node --test
docs/     dokumentace projektu
```

> **Při vývoji:** service worker si agresivně cachuje. Zapni v DevTools →
> Application → Service Workers volbu **Update on reload**, jinak budeš ladit starou
> verzi. Při nasazení je potřeba zvýšit `CACHE_VERSION` v `sw.js`.

## Dokumentace

| Soubor | Obsah |
|--------|-------|
| [`docs/PRD.md`](docs/PRD.md) | Proč a pro koho |
| [`docs/SPEC.md`](docs/SPEC.md) | Co se staví — chování a akceptační kritéria |
| [`docs/DEV.md`](docs/DEV.md) | Jak to stavíme — architektura, rozhodnutí, konvence |
| [`docs/CURRENT.md`](docs/CURRENT.md) | Kde jsme — hotovo, zbývá, blokery |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | Kam dál — nápady, o kterých se zatím nerozhodlo |

## Pravidla hry

Kolo Dixitu: vypravěč vybere kartu a řekne k ní nápovědu, ostatní přihodí vlastní kartu
a pak hádají, která je vypravěčova.

- Uhodli **všichni** nebo **nikdo** → vypravěč **0** bodů, každý ostatní **+2**
- Uhodl **někdo, ale ne všichni** → vypravěč **+3**, kdo uhodl **+3**
- Navíc: hráč dostane **+1** za každý hlas, který padl na jeho vlastní kartu

Aplikace tohle jen počítá — karty a nápovědy zůstávají na stole.
