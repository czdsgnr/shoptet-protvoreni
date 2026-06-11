# Shoptet úpravy – protvoreni.cz

Custom CSS + JS pro Shoptet e-shop, hostované na GitHubu a načítané přes
[jsDelivr CDN](https://www.jsdelivr.com/). Díky tomu se nezahlcuje limit znaků
v Shoptet `<head>` (max 8192 znaků) a úpravy se dělají jen tady, ne v adminu.

## Co to dělá

| Soubor | Modul | Kde se projeví |
|--------|-------|----------------|
| `shoptet.css` + `shoptet.js` | **Registrace Zákazník / B2B** | `/registrace/` – volby vedle sebe jako karty, aktivní karta zvýrazněná |
| | **Login popup s benefity** | popup Přihlášení – pravý sloupec s výhodami registrace + CTA |
| | **Quantity widget** | výpisy produktů – `−/+` výběr počtu kusů, jen u tlačítka „Do košíku" (ne „Zobrazit") |
| | **Upsell v košíku** | `/kosik/` – box „Mohlo by se vám ještě hodit" s doplňky |

## Vložení do Shoptetu

V adminu: **Vzhled a obsah → Editor (HTML kódy v hlavičce)** a vlož tyto dva řádky:

```html
<link rel="stylesheet" href="https://czdsgnr.github.io/shoptet-protvoreni/shoptet.css">
<script src="https://czdsgnr.github.io/shoptet-protvoreni/shoptet.js" defer></script>
```

Pak smaž z hlavičky všechny staré inline `<style>` a `<script>` – jsou teď tady
(včetně původních: Další kategorie menu, akce, ceny, footer, logo, otevírací doba).

## Aktualizace / cache

Hostuje se přes **GitHub Pages** – cache jen ~10 min (`max-age=600`), URL je
permanentní a automaticky servíruje poslední commit na `main`. Po pushi tedy
stačí počkat max ~10 min (nebo hard refresh `Cmd+Shift+R`), žádný purge netřeba.

> Pozn.: jsDelivr (`cdn.jsdelivr.net/gh/...@main`) se nepoužívá – cachoval
> rozlišení branche 12 h a změny se nepropisovaly včas.

## Konfigurace upsellu

V `shoptet.js`, pole `UPSELLY` (modul C):

```js
var UPSELLY = [
  { code: '148589', url: '/odmena-pro-balice/' },           // tahá název/cenu/foto z produktu
  { code: 'X', url: '/y/', name: '...', price: '99 Kč', img: 'https://...' } // ruční (i pro skryté produkty)
];
```

Skryté produkty (404 URL) se automaticky přeskočí – pokud chceš produkt
neviditelný v katalogu, ale v upsellu, vyplň `name` + `price` ručně.
