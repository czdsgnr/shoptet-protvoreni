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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/czdsgnr/shoptet-protvoreni@main/shoptet.css">
<script src="https://cdn.jsdelivr.net/gh/czdsgnr/shoptet-protvoreni@main/shoptet.js" defer></script>
```

Pak smaž z hlavičky všechny staré inline `<style>` a `<script>` (registrace,
login, quantity, upsell) – jsou teď tady.

## Aktualizace / cache

jsDelivr cachuje `@main` cca 12 h. Když chceš změnu hned vidět:

- **Verzovaně (doporučeno):** v Shoptetu změň `@main` na konkrétní tag, např.
  `@v1.0.1`, a po commitu vytvoř git tag se stejným číslem.
- **Rychlá invalidace:** přidej `?v=2` na konec URL a inkrementuj při každé změně.
- **Purge:** otevři `https://purge.jsdelivr.net/gh/czdsgnr/shoptet-protvoreni@main/shoptet.css`

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
