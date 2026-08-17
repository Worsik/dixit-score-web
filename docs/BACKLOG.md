# BACKLOG — možnosti dalšího rozvoje

> Nápady, které **nejsou rozhodnuté ani naplánované**. Nic z toho se nedělá, dokud
> to nedostane zelenou. Účel souboru je nezapomenout rozbor, ne zavázat se k práci.
>
> Co je hotové, patří do [`SPEC.md`](SPEC.md); co se zrovna dělá, do
> [`CURRENT.md`](CURRENT.md).

**Poslední aktualizace:** 2026-08-17 *(podklady k nápovědě vytěženy z pravidel ke krabici)*

---

## 1. ~~Naposledy hraní hráči~~ — **hotovo 2026-08-15**

Implementováno jako vylepšení #5 v [`SPEC.md`](SPEC.md), rozhodnutí o úložišti
je v [`DEV.md`](DEV.md), AD-12.

Řazení podle **posledního použití** (ne četnosti), pamatuje se i barva, strop 20 jmen
nahradil UI pro mazání. Kdyby se ukázalo, že mazání jednotlivých jmen je potřeba,
je to nová položka backlogu — ne nedodělek téhle.

---

## 2. Statistika výher a bodování

**Proč:** vědět, kdo v partě vyhrává.

**Není to jen obrazovka navíc.** Aplikace dnes nemá pojem „konec hry" — *Nová hra*
jen vynuluje skóre. Bez konce hry neexistuje vítěz a není co počítat.

**Otevřená rozhodnutí:**

- **Kdy se hra archivuje.** Implicitně při stisku *Nová hra* (nic navíc pro
  uživatele, ale archivuje se i omylem rozehraná partie), nebo explicitně tlačítkem
  *Ukončit hru* (čistší data, krok navíc). Přiklání se k implicitnímu — smazání
  záznamu je stejně součástí zadání.
  **Aktualizace 2026-08-17:** vylepšení #13 rozdělilo dvě věci, které dřív splývaly —
  *Další hra* (stejná parta, vynulované skóre) a *Nová hra* (jiná parta). Archivovat se
  má u **obojího**, ale *Nová hra* je navíc jasný signál „tahle parta skončila". Háček tu
  tedy je; funkce se nedělá.
- **Co se ukládá** — datum, jména, skóre, počet kol. Odvozené statistiky se počítají
  až při zobrazení, neukládají se.
- **Rozsah mazání** — jednotlivý záznam, nebo i vynulování celé historie?

**Vazba na bod 1:** obojí potřebuje identitu hráče podle jména. Dva oddělené seznamy
znamenají dva zdroje pravdy o tom, kdo je Petr. Když se dělá obojí, úložiště se
navrhne jednou.

⚠️ **Past v `js/storage.js`.** `deserialize()` zahodí uložený stav, když nesedí
`VERSION`. Rozšíření uložených dat bez migrace **smaže rozehranou hru** uživatelům,
kteří mají aplikaci na ploše. Ať se to udělá jakkoli, tohle se musí ošetřit.

---

## 3. Hlášení chyb

**Proč:** dostat popis chyby i s kontextem, ne jen „nefunguje to".

**Zakládat GitHub issue přes API nejde** — vyžadovalo by to token, ten do statické
stránky nepatří a znamenal by backend. To by zabilo „bez závislostí, offline first"
(viz [`../CLAUDE.md`](../CLAUDE.md), kap. 2).

**Reálné varianty:**

- **Odkaz na `issues/new` s předvyplněným titulkem a tělem** přes query parametry.
  Žádné tajemství, žádný server. Dá se předvyplnit verze cache, `display-mode`,
  prohlížeč, počet hráčů, číslo kola. Uživatel ale musí mít GitHub účet — u aplikace
  pro partu u stolu je to spíš pro autora než pro hráče.
- **Obrazovka „O aplikaci"** s verzí a stavem, který jde zkopírovat do schránky.
  Pokryje většinu užitku za zlomek práce. Nejspíš to je ta správná odpověď.

---

## 4.–7. a 9. ~~Dávka drobných vylepšení~~ — **hotovo 2026-08-17**

Vylepšení #6–#10 v [`SPEC.md`](SPEC.md). Rozhodnutí jsou v [`DEV.md`](DEV.md):
**AD-13** (snímek pro *Vrátit* se neukládá) a **AD-14** (držení displeje).

| | Co | Kde to je |
|---|---|---|
| 4 | Vzít zpět poslední kolo i *Novou hru* | tlačítko **Vrátit** v horní liště |
| 5 | Změnit vypravěče bez nové hry | **Udělat vypravěčem** v dialogu úpravy |
| 6 | Dotykové plochy na 44 px | `.icon-button`, paleta, textová tlačítka |
| 7 | Držet displej rozsvícený | `js/wake-lock.js` |
| 9 | *Hodnocení* bez hráčů je zakázané | spodní lišta |

---

## 8. Ukázat, kdo vede

**Proč:** seznam je v pořadí u stolu, takže průběžné vedení se musí luštit ze všech
čísel.

**Řazení podle skóre ne** — pořadí v seznamu *je* pořadí hráčů a mění se tažením,
takže by se to rvalo. Levnější a bez konfliktu: označit vedoucího štítkem na kartě,
stejně jako se dnes označuje vypravěč.

*(Zbylo jako jediné neudělané z rozboru z 2026-08-15 — mění vzhled karty, takže
by se to mělo nejdřív vidět.)*

---

## 10. ~~Nápověda „Jak se hraje"~~ — **hotovo 2026-08-17**

Vylepšení #12 v [`SPEC.md`](SPEC.md), rozhodnutí o ilustracích v [`DEV.md`](DEV.md),
AD-17. Dialog pod „?" u loga, příklad pro čtyři hráče, dovětek o hře ve třech
i s upozorněním na AD-16.

---

## 11. Bodování pro tři hráče podle pravidel

**Odloženo rozhodnutím** — viz [`DEV.md`](DEV.md), AD-16. Zapsáno sem, aby se z toho
nestala „chyba k opravě": aplikace počítá bonusy za každý hlas, pravidla u trojice
dávají 1 bod na hráče bez ohledu na počet hlasů. Ve výjimečném případě to umí
zablokovat potvrzení kola.

Řešit až kdyby se trojice začala hrát. Znamenalo by to zavést do aplikace pojem
režimu hry, ne jen upravit vzorec.

---

## Co v backlogu není

**Akceptace na iPhonu** — to není nápad na rozvoj, ale nedokončený úkol. Je
v [`CURRENT.md`](CURRENT.md).
