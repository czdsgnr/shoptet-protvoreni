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
    // U KAŽDÉHO produktu s přímým "Do košíku" (i v caruselech). Karty bez
    // add-to-cart formuláře (varianty / "Zobrazit") se přeskočí níže.
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

  /* === C) Upsell v košíku (řízeno přes upsell.json + admin panel) ======= */
  var UPSELL_CFG = 'https://czdsgnr.github.io/shoptet-protvoreni/upsell.json';

  function initUpsell() {
    if (!/\/kosik/.test(location.pathname)) return;

    fetch(UPSELL_CFG + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) {
        if (cfg && cfg.enabled === false) return; // upsell dočasně vypnutý
        var UPSELLY = (cfg && cfg.products) || [];
        var TITLE = (cfg && cfg.title) || 'Mohlo by se vám ještě hodit';
        if (!UPSELLY.length) return;
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
        // Preferuj data uložená adminem (funguje i u skrytých produktů); jinak dotáhni z URL.
        function nactiData(p) {
          if (p.name && p.price) {
            return Promise.resolve({ code: p.code, url: p.url, img: p.img || '', name: p.name, price: p.price });
          }
          if (!p.url) return Promise.resolve(null);
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
              if (!price) return null;
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
          // umísti POD produkty (za tabulku košíku), fallback před souhrn
          var anchor = document.querySelector('.cart-table');
          var summary = document.querySelector('.cart-content .cart-summary');
          if (!anchor && !summary) return;
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
          if (anchor) {
            var host = anchor.closest('form') || anchor.parentNode;
            host.parentNode.insertBefore(box, host.nextSibling);
          } else {
            summary.parentNode.insertBefore(box, summary);
          }
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
        document.addEventListener('ShoptetCartUpdated', buildUpsell);
        buildUpsell();
      })
      .catch(function () {});
  }

  /* === D) Tabulka velikostí u textilu (modal) ========================== */
  // Obrázek tabulky – sem dát finální URL (např. z GitHubu nebo Shoptet souborů)
  var SIZE_CHART_IMG = 'https://czdsgnr.github.io/shoptet-protvoreni/tabulka-velikosti.jpg';

  function initSizeChart() {
    if (document.getElementById('size-chart-btn')) return;
    // variantový blok (NE popisek) – tam je "zvolte VELIKOST textilu ZDE"
    var params = document.querySelector('.detail-parameters');
    if (!params) return;
    var hasSize = /VELIKOST/i.test(params.textContent) ||
      params.querySelector('[data-parameter-name*="VELIKOST"], [data-parameter-name*="velikost"]');
    if (!hasSize) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'size-chart-btn';
    btn.className = 'size-chart-btn';
    btn.innerHTML = '📏 Tabulka velikostí';
    params.parentNode.insertBefore(btn, params); // nad výběr velikosti
    btn.addEventListener('click', openSizeModal);
  }

  function openSizeModal() {
    if (document.getElementById('size-modal')) return;
    var ov = document.createElement('div');
    ov.id = 'size-modal';
    ov.innerHTML =
      '<div class="sm-inner">' +
        '<button class="sm-close" type="button" aria-label="Zavřít">✕</button>' +
        '<h3>Tabulka velikostí</h3>' +
        '<img src="' + SIZE_CHART_IMG + '" alt="Tabulka velikostí" ' +
        'onerror="this.style.display=\'none\';this.nextSibling.style.display=\'block\'">' +
        '<p class="sm-fallback" style="display:none">Tabulka velikostí se připravuje.</p>' +
      '</div>';
    document.body.appendChild(ov);
    function close() { ov.remove(); document.removeEventListener('keydown', onEsc); }
    function onEsc(e) { if (e.key === 'Escape') close(); }
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.classList.contains('sm-close')) close();
    });
    document.addEventListener('keydown', onEsc);
  }

  /* Admin panel pro výběr upsellů – aktivace přes ?upsell-admin v URL */
  function maybeLoadUpsellAdmin() {
    if (!/[?&]upsell-admin/.test(location.search)) return;
    var s = document.createElement('script');
    s.src = 'https://czdsgnr.github.io/shoptet-protvoreni/admin-upsell.js?t=' + Date.now();
    (document.body || document.documentElement).appendChild(s);
  }

  /* === Init ============================================================ */
  function initAll() {
    buildLoginExtras();
    initQty();
    initSizeChart();
  }

  if (document.readyState !== 'loading') initAll();
  document.addEventListener('DOMContentLoaded', initAll);
  document.addEventListener('ShoptetDOMContentLoaded', initAll);
  document.addEventListener('ShoptetMessage', initQty);
  // Slick klonuje slajdy az po nacteni – dobeh, at widget chyti i klony v caruselu
  window.addEventListener('load', initQty);
  setTimeout(initQty, 800);
  setTimeout(initQty, 2000);
  // tabulka velikostí – varianty se renderují později
  setTimeout(initSizeChart, 800);
  setTimeout(initSizeChart, 2000);
  document.addEventListener('ShoptetMessage', initSizeChart);
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-target="login"]')) {
      setTimeout(buildLoginExtras, 50);
    }
  });

  initUpsell();
  maybeLoadUpsellAdmin();
})();
