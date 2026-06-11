/* =========================================================================
   protvoreni.cz – Shoptet custom JS
   Načítáno přes jsDelivr CDN z GitHubu (viz README.md)
   Moduly: A) Login popup benefity  B) Quantity widget  C) Upsell v košíku
   ========================================================================= */
(function () {
  'use strict';

  /* === A) Login popup s benefity ======================================= */
  function buildLoginExtras() {
    var popup = document.getElementById('login');
    if (!popup || popup.classList.contains('has-benefits')) return;
    var inner = popup.querySelector('.popup-widget-inner');
    if (!inner) return;

    var benefits = document.createElement('aside');
    benefits.className = 'login-benefits';
    benefits.innerHTML =
      '<h3 class="lb-title">Ještě účet nemáte?</h3>' +
      '<p class="lb-sub">Zaregistrujte se zdarma a získejte:</p>' +
      '<ul class="lb-list">' +
        '<li>Věrnostní bodový systém</li>' +
        '<li>Historie objednávek na jednom místě</li>' +
        '<li>Rychlejší nákup bez vyplňování údajů</li>' +
        '<li>Speciální slevy pro registrované</li>' +
      '</ul>' +
      '<a href="/registrace/" class="lb-cta">Vytvořit účet zdarma</a>';

    inner.appendChild(benefits);
    popup.classList.add('has-benefits');
  }

  /* === B) Quantity widget na výpisech (jen "Do košíku") ================= */
  function buildQty(card) {
    // Přeskoč carousely / slidery (homepage "akční zboží", související produkty) –
    // tam má karta vlastní pozicování a widget by přetékal / rozbil layout.
    if (card.closest('[class*="homepage-products"], .products-related, .carousel, [data-testid="carousel"], .owl-carousel, .slick-slider, .slick-slide, .swiper, .swiper-slide, .product-slider')) return;

    var pTools = card.querySelector('.p-tools');
    if (!pTools || pTools.querySelector('.qty-wrap')) return;

    var form = pTools.querySelector('form.pr-action');
    var amountInput = form && form.querySelector('input[name="amount"]');
    var addBtn = form && form.querySelector('.add-to-cart-button');
    if (!form || !amountInput || !addBtn) return; // skip "Zobrazit" karty (varianty)

    var wrap = document.createElement('div');
    wrap.className = 'qty-wrap';
    wrap.innerHTML =
      '<button type="button" class="qty-btn qty-minus" aria-label="Méně">−</button>' +
      '<input type="number" class="qty-input" value="1" min="1" aria-label="Množství">' +
      '<button type="button" class="qty-btn qty-plus" aria-label="Více">+</button>';

    var input = wrap.querySelector('.qty-input');

    function update() {
      var v = Math.max(1, parseInt(input.value, 10) || 1);
      input.value = v;
      amountInput.value = v;
    }

    wrap.querySelector('.qty-minus').addEventListener('click', function (e) {
      e.preventDefault();
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
      update();
    });
    wrap.querySelector('.qty-plus').addEventListener('click', function (e) {
      e.preventDefault();
      input.value = (parseInt(input.value, 10) || 1) + 1;
      update();
    });
    input.addEventListener('input', update);
    input.addEventListener('change', update);

    form.parentNode.insertBefore(wrap, form);
    update();
  }

  function initQty() {
    document.querySelectorAll('.p[data-micro="product"]').forEach(buildQty);
  }

  /* === C) Upsell v košíku ============================================== */
  function initUpsell() {
    if (!/\/kosik/.test(location.pathname)) return;

    // Doplňky: kód produktu (Ceník → Kód produktu) + URL produktu.
    // Pro 100% neviditelné produkty doplň ručně name + price (+ img) → nefetchuje se.
    var UPSELLY = [
      { code: '148589', url: '/odmena-pro-balice/' }
      // { code: 'X', url: '/y/', name: '...', price: '99 Kč', img: 'https://...' }
    ];
    var TITLE = 'Mohlo by se vám ještě hodit';
    var CACHE = null;

    function formatPrice(amount, currency) {
      var n = parseFloat(amount);
      if (isNaN(n)) return '';
      var num = (n % 1 === 0) ? String(n) : n.toFixed(2).replace('.', ',');
      var cur = currency === 'CZK' ? 'Kč' : (currency === 'EUR' ? '€' : currency || '');
      return (num + ' ' + cur).trim();
    }
    function jeVKosiku(url) {
      return url ? !!document.querySelector('.cart-table a[href*="' + url + '"]') : false;
    }
    function nactiData(p) {
      if (p.name && p.price) {
        return Promise.resolve({ code: p.code, url: p.url, img: p.img || '', name: p.name, price: p.price });
      }
      return fetch(p.url, { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.text() : null; })
        .then(function (html) {
          if (!html) return null;
          var doc = new DOMParser().parseFromString(html, 'text/html');
          function meta(name) {
            var el = doc.querySelector('meta[property="' + name + '"], meta[name="' + name + '"]');
            return el ? el.getAttribute('content') : '';
          }
          var price = formatPrice(meta('product:price:amount'), meta('product:price:currency'));
          if (!price) return null; // 404 / redirect → není produktová stránka
          return {
            code: p.code, url: p.url,
            img: meta('og:image'),
            name: (meta('og:title') || '').split(' - ')[0].trim(),
            price: price
          };
        })
        .catch(function () { return null; });
    }
    function renderUpsell(data) {
      var stary = document.getElementById('upsell-box');
      if (stary) stary.remove();
      var summary = document.querySelector('.cart-content .cart-summary');
      if (!summary) return;
      var polozky = data.filter(function (p) { return p && !jeVKosiku(p.url); });
      if (!polozky.length) return;
      var box = document.createElement('div');
      box.id = 'upsell-box';
      box.innerHTML =
        '<h3 class="upsell-title">' + TITLE + '</h3>' +
        polozky.map(function (p) {
          return '<div class="upsell-item">' +
            (p.img ? '<img class="upsell-img" src="' + p.img + '" alt="' + p.name + '">' : '') +
            '<span class="upsell-name">' + p.name + '</span>' +
            '<span class="upsell-price">' + p.price + '</span>' +
            '<button type="button" class="upsell-add" data-code="' + p.code + '">Přidat do košíku</button>' +
            '</div>';
        }).join('');
      summary.parentNode.insertBefore(box, summary);
      box.querySelectorAll('.upsell-add').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.disabled = true;
          btn.textContent = 'Přidávám…';
          shoptet.cartShared.addToCart({ productCode: btn.dataset.code, amount: 1 }, true);
        });
      });
    }
    function buildUpsell() {
      if (CACHE) { renderUpsell(CACHE); return; }
      Promise.all(UPSELLY.map(nactiData)).then(function (data) {
        CACHE = data;
        renderUpsell(data);
      });
    }
    document.addEventListener('DOMContentLoaded', buildUpsell);
    document.addEventListener('ShoptetCartUpdated', buildUpsell);
    buildUpsell();
  }

  /* === Init ============================================================ */
  function initAll() {
    buildLoginExtras();
    initQty();
  }

  if (document.readyState !== 'loading') initAll();
  document.addEventListener('DOMContentLoaded', initAll);
  document.addEventListener('ShoptetDOMContentLoaded', initAll);
  document.addEventListener('ShoptetMessage', initQty);
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-target="login"]')) {
      setTimeout(buildLoginExtras, 50);
    }
  });

  initUpsell();
})();
