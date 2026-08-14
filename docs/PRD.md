# PRD — Dixit Score Web

Produktový pohled: *proč* to stavíme a *pro koho*.

---

## 1. Východisko

Ve firmě padla otázka, na kterou nikdo neměl podloženou odpověď: **je pro mobilní
aplikaci nutná nativní implementace, nebo stačí webová stránka uložená v telefonu
jako aplikace?**

Diskuse se vedla v obecné rovině a bez důkazu. Tenhle projekt ji má rozhodnout na
konkrétním případu: vzít **existující, hotovou a používanou** nativní Android aplikaci
a přepsat ji na web se stejným chováním. Teprve pak je vidět, co se cestou ztratí —
a jestli na tom záleží.

Předloha je [`dixit-score`](https://github.com/Worsik/dixit-score): počítadlo skóre pro
deskovou hru Dixit, napsané v Kotlinu a Jetpack Compose.

## 2. Pro koho

**Primárně:** hráči Dixitu u stolu. Jeden člověk drží telefon a zapisuje výsledky kol
za celou skupinu. Aplikace se používá **večer, u stolu, často bez připojení** a nesmí
vyžadovat pozornost — je to kalkulačka, ne zážitek.

**Sekundárně:** kolegové ve firmě, kteří potřebují vidět a osahat výsledek, aby se dalo
rozhodnout o přístupu k mobilním aplikacím obecně.

**Autor** projektu se přitom učí, jak PWA doopravdy funguje — proto se service worker
a manifest píší ručně a ne generátorem.

## 3. Co má produkt umět

Totéž co předloha, nic víc:

- Přidat, upravit, smazat hráče; přiřadit mu barvu
- Přeskupit pořadí hráčů tažením
- Odbodovat kolo podle pravidel Dixitu, včetně bonusových hlasů
- Rotovat vypravěče a počítat kola
- Ručně opravit skóre, když se někdo splete
- Začít novou hru s vybraným vypravěčem

Navíc oproti předloze **jediná věc**: rozehraná hra přežije zavření aplikace.

## 4. Kritérium úspěchu

Experiment dopadl dobře, pokud platí **všechno** z tohoto:

1. Aplikaci lze na **Androidu i na iPhonu** přidat na plochu a spustit ve vlastním okně
2. Funguje **bez připojení k internetu**
3. Celé kolo Dixitu dá **stejný výsledek** jako APK verze
4. Přeskupení hráčů tažením funguje **prstem**, ne jen myší
5. Rozehraná hra je po znovuotevření **na místě**
6. Distribuce proběhla **bez Google Play a bez App Store**

Bod 1 a 4 jsou ty, kde se to reálně může zlomit. Zbytek je z principu splnitelný.

## 5. Co záměrně neděláme

| Nebude | Proč |
|--------|------|
| Účty, přihlášení, synchronizace mezi telefony | Skóre se zapisuje na jednom zařízení. Server by přinesl provoz, náklady a otázky kolem dat — bez užitku pro hru u stolu. |
| Tmavý motiv | Předloha ho nemá. Přidat ho by rozbilo srovnání 1:1. |
| Historie kol, undo, statistiky | Předloha je nemá a u stolu je nikdo nežádal. |
| Publikace do obchodů | Přesně to je předmětem experimentu — cílem je ověřit distribuci **mimo** ně. |
| Automatizované testy UI | U aplikace téhle velikosti stojí víc, než vynesou. Herní pravidla testovaná jsou. |

## 6. Jak se pozná, že je hotovo

Aplikace je nasazená na veřejné adrese, autor i aspoň jeden další hráč ji mají na ploše
telefonu, a **odehrála se s ní skutečná hra Dixitu** místo APK verze. Do té doby je to
prototyp, ne odpověď.
