/* =========================================================================
   admin-upsell.js – panel pro výběr upsell doplňků (běží na eshopu)
   Aktivace: jakákoliv stránka eshopu s ?upsell-admin v URL
   Produkty se berou z fulltext hledání eshopu, ukládá se do upsell.json na GitHubu.
   ========================================================================= */
(function () {
  'use strict';
  if (window.__upsellAdmin) return; window.__upsellAdmin = true;

  var REPO = 'czdsgnr/shoptet-protvoreni';
  var FILE = 'upsell.json';
  var CFG_URL = 'https://czdsgnr.github.io/' + REPO.split('/')[1] + '/' + FILE;
  var TOKEN_KEY = 'upsell_gh_token';

  var state = { title: 'Mohlo by se vám ještě hodit', products: [] };

  /* ---- styly ---- */
  var css = document.createElement('style');
  css.textContent = [
    '#ua-overlay{position:fixed;inset:0;z-index:2147483600;background:rgba(16,34,59,.55);display:flex;align-items:center;justify-content:center;font-family:"Nunito Sans",system-ui,Arial,sans-serif}',
    '#ua-panel{width:min(860px,96vw);max-height:92vh;display:flex;flex-direction:column;background:#fff;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.4);overflow:hidden;color:#16223b}',
    '#ua-head{display:flex;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid #eef1f6}',
    '#ua-head h2{margin:0;font-size:18px;font-weight:800;flex:1}',
    '.ua-x{border:0;background:#f1f4f9;width:34px;height:34px;border-radius:9px;font-size:18px;cursor:pointer;color:#5a6b7e}',
    '.ua-x:hover{background:#e4e9f0}',
    '#ua-body{display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;min-height:0}',
    '.ua-col{display:flex;flex-direction:column;min-height:0;padding:16px 18px}',
    '.ua-col+.ua-col{border-left:1px solid #eef1f6;background:#fbfcfe}',
    '.ua-col h3{margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#8a97a8}',
    '#ua-search{width:100%;height:42px;padding:0 12px;border:1.5px solid #e4e9f0;border-radius:10px;font-size:14px;outline:0;box-sizing:border-box}',
    '#ua-search:focus{border-color:#1f6fb2;box-shadow:0 0 0 3px rgba(31,111,178,.13)}',
    '.ua-list{overflow:auto;margin-top:10px;flex:1;display:flex;flex-direction:column;gap:8px}',
    '.ua-card{display:flex;align-items:center;gap:10px;padding:8px;border:1px solid #eef1f6;border-radius:10px;background:#fff}',
    '.ua-card img{width:46px;height:46px;object-fit:contain;flex:0 0 46px;border-radius:6px;background:#f7f9fc}',
    '.ua-card .ua-meta{flex:1;min-width:0}',
    '.ua-card .ua-name{font-size:13px;font-weight:700;line-height:1.25;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.ua-card .ua-price{font-size:12px;color:#6b7a8f}',
    '.ua-card .ua-code{font-size:11px;color:#9aa7b8}',
    '.ua-btn{border:0;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;padding:8px 12px;background:#1f6fb2;color:#fff;flex:0 0 auto}',
    '.ua-btn:hover{background:#175a93}',
    '.ua-btn.sec{background:#eef1f6;color:#33415a}',
    '.ua-btn.sec:hover{background:#e0e6ee}',
    '.ua-btn.danger{background:#fce8ec;color:#c43b54;padding:6px 9px}',
    '.ua-mini{border:0;background:#eef1f6;color:#33415a;width:28px;height:28px;border-radius:7px;cursor:pointer;font-size:14px}',
    '.ua-mini:hover{background:#e0e6ee}',
    '.ua-empty{font-size:13px;color:#9aa7b8;padding:14px 4px}',
    '#ua-foot{display:flex;align-items:center;gap:10px;padding:14px 22px;border-top:1px solid #eef1f6;background:#fbfcfe}',
    '#ua-foot .sp{flex:1}',
    '#ua-msg{font-size:12px;color:#6b7a8f}',
    '.ua-row{display:flex;align-items:center;gap:8px}',
    '.ua-link{font-size:12px;color:#1f6fb2;cursor:pointer;text-decoration:underline;background:0;border:0;padding:0}'
  ].join('');
  document.head.appendChild(css);

  /* ---- overlay ---- */
  var ov = document.createElement('div');
  ov.id = 'ua-overlay';
  ov.innerHTML =
    '<div id="ua-panel">' +
      '<div id="ua-head"><h2>🛒 Upsell – výběr doplňků</h2>' +
        '<button class="ua-link" id="ua-token">⚙ GitHub token</button>' +
        '<button class="ua-x" id="ua-close">✕</button></div>' +
      '<div id="ua-body">' +
        '<div class="ua-col">' +
          '<h3>Najdi produkt na eshopu</h3>' +
          '<input id="ua-search" placeholder="Napiš název produktu (např. hrnek)…" autocomplete="off">' +
          '<div class="ua-list" id="ua-results"><div class="ua-empty">Začni psát a vyhledej produkty…</div></div>' +
        '</div>' +
        '<div class="ua-col">' +
          '<h3>Vybrané doplňky (zobrazí se v košíku)</h3>' +
          '<div class="ua-list" id="ua-selected"></div>' +
        '</div>' +
      '</div>' +
      '<div id="ua-foot"><span id="ua-msg">Načítám konfiguraci…</span><span class="sp"></span>' +
        '<button class="ua-btn sec" id="ua-copy">Zkopírovat JSON</button>' +
        '<button class="ua-btn" id="ua-save">💾 Uložit na web</button></div>' +
    '</div>';
  document.body.appendChild(ov);

  var $ = function (id) { return document.getElementById(id); };
  var resultsEl = $('ua-results'), selectedEl = $('ua-selected'), msgEl = $('ua-msg');

  function setMsg(t) { msgEl.textContent = t; }
  function esc(s) { return (s || '').replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  /* ---- render vybraných ---- */
  function renderSelected() {
    if (!state.products.length) { selectedEl.innerHTML = '<div class="ua-empty">Zatím nic nevybráno. Vyhledej vlevo a klikni „+ Přidat".</div>'; return; }
    selectedEl.innerHTML = state.products.map(function (p, i) {
      return '<div class="ua-card">' +
        (p.img ? '<img src="' + esc(p.img) + '">' : '<img>') +
        '<div class="ua-meta"><span class="ua-name">' + esc(p.name || p.url) + '</span>' +
        '<span class="ua-price">' + esc(p.price || '') + '</span> <span class="ua-code">' + esc(p.code || '') + '</span></div>' +
        '<button class="ua-mini" data-up="' + i + '">↑</button>' +
        '<button class="ua-mini" data-down="' + i + '">↓</button>' +
        '<button class="ua-btn danger" data-del="' + i + '">Odebrat</button></div>';
    }).join('');
  }
  selectedEl.addEventListener('click', function (e) {
    var t = e.target;
    if (t.dataset.del != null) { state.products.splice(+t.dataset.del, 1); renderSelected(); }
    else if (t.dataset.up != null) { var i = +t.dataset.up; if (i > 0) { var a = state.products; a.splice(i - 1, 0, a.splice(i, 1)[0]); renderSelected(); } }
    else if (t.dataset.down != null) { var j = +t.dataset.down; var b = state.products; if (j < b.length - 1) { b.splice(j + 1, 0, b.splice(j, 1)[0]); renderSelected(); } }
  });

  /* ---- hledání produktů (fulltext na eshopu) ---- */
  var searchTimer;
  $('ua-search').addEventListener('input', function () {
    clearTimeout(searchTimer);
    var q = this.value.trim();
    if (q.length < 2) { resultsEl.innerHTML = '<div class="ua-empty">Začni psát a vyhledej produkty…</div>'; return; }
    resultsEl.innerHTML = '<div class="ua-empty">Hledám…</div>';
    searchTimer = setTimeout(function () { doSearch(q); }, 350);
  });

  function parseCard(card) {
    var a = card.querySelector('a.name') || card.querySelector('a.image') || card.querySelector('a[href]');
    var url = a ? a.getAttribute('href') : '';
    var nameEl = card.querySelector('[data-micro="name"], [data-testid="productCardName"], .name span, .name');
    var name = nameEl ? nameEl.textContent.trim() : '';
    var priceEl = card.querySelector('.price-final strong, .price-final, [data-testid="productCardPrice"]');
    var price = priceEl ? priceEl.textContent.replace(/\s+/g, ' ').trim() : '';
    var imgEl = card.querySelector('img[data-micro-image], img.swap-image, img');
    var img = imgEl ? (imgEl.getAttribute('data-micro-image') || imgEl.getAttribute('src') || '') : '';
    var skuEl = card.querySelector('[data-micro="sku"], .p-code [data-micro="sku"]');
    var sku = skuEl ? skuEl.textContent.trim() : '';
    var code = sku.split(/\s*[-–]\s*EAN|\sEAN/i)[0].trim();
    return { code: code, url: url, name: name, price: price, img: img };
  }

  function doSearch(q) {
    fetch('/?fulltext=' + encodeURIComponent(q), { credentials: 'same-origin' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var cards = Array.prototype.slice.call(doc.querySelectorAll('.p[data-micro="product"]')).slice(0, 24);
        if (!cards.length) { resultsEl.innerHTML = '<div class="ua-empty">Nic nenalezeno pro „' + esc(q) + '".</div>'; return; }
        resultsEl.innerHTML = cards.map(function (c, i) {
          var p = parseCard(c);
          window.__uaTmp = window.__uaTmp || {}; window.__uaTmp[i] = p;
          return '<div class="ua-card">' +
            (p.img ? '<img src="' + esc(p.img) + '">' : '<img>') +
            '<div class="ua-meta"><span class="ua-name">' + esc(p.name) + '</span>' +
            '<span class="ua-price">' + esc(p.price) + '</span> <span class="ua-code">' + esc(p.code) + '</span></div>' +
            '<button class="ua-btn" data-add="' + i + '">+ Přidat</button></div>';
        }).join('');
      })
      .catch(function () { resultsEl.innerHTML = '<div class="ua-empty">Hledání selhalo.</div>'; });
  }
  resultsEl.addEventListener('click', function (e) {
    if (e.target.dataset.add == null) return;
    var p = window.__uaTmp[+e.target.dataset.add];
    if (!p || !p.code) { setMsg('⚠ Produkt nemá kód – nelze přidat.'); return; }
    if (state.products.some(function (x) { return x.code === p.code; })) { setMsg('Tento produkt už je vybraný.'); return; }
    state.products.push({ code: p.code, url: p.url, name: p.name, price: p.price, img: p.img });
    renderSelected(); setMsg('Přidáno: ' + p.name);
  });

  /* ---- načti aktuální config ---- */
  fetch(CFG_URL + '?t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (cfg) {
      if (cfg) { state.title = cfg.title || state.title; state.products = cfg.products || []; }
      renderSelected(); setMsg(state.products.length + ' doplňků v konfiguraci');
    })
    .catch(function () { renderSelected(); setMsg('Nepodařilo se načíst aktuální konfiguraci.'); });

  /* ---- ukládání ---- */
  function jsonOut() { return JSON.stringify({ title: state.title, products: state.products }, null, 2) + '\n'; }

  $('ua-copy').addEventListener('click', function () {
    navigator.clipboard.writeText(jsonOut()).then(function () { setMsg('✓ JSON zkopírován do schránky'); });
  });

  $('ua-token').addEventListener('click', function () {
    var cur = localStorage.getItem(TOKEN_KEY) || '';
    var t = prompt('GitHub token (fine-grained, write Contents na repo ' + REPO + ').\nUloží se jen u tebe v prohlížeči. Nech prázdné pro smazání.', cur);
    if (t === null) return;
    if (t.trim()) { localStorage.setItem(TOKEN_KEY, t.trim()); setMsg('✓ Token uložen – „Uložit na web" teď ukládá automaticky.'); }
    else { localStorage.removeItem(TOKEN_KEY); setMsg('Token smazán.'); }
  });

  $('ua-save').addEventListener('click', function () {
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      navigator.clipboard.writeText(jsonOut()).then(function () {
        setMsg('JSON zkopírován. Otevírám GitHub – vlož (Cmd+A, Cmd+V) a dej Commit.');
        window.open('https://github.com/' + REPO + '/edit/main/' + FILE, '_blank');
      });
      return;
    }
    setMsg('Ukládám na GitHub…');
    var api = 'https://api.github.com/repos/' + REPO + '/contents/' + FILE;
    var hdr = { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' };
    fetch(api + '?ref=main', { headers: hdr })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (meta) {
        var body = { message: 'Upsell: aktualizace doplňků z admin panelu', content: btoa(unescape(encodeURIComponent(jsonOut()))), branch: 'main' };
        if (meta && meta.sha) body.sha = meta.sha;
        return fetch(api, { method: 'PUT', headers: hdr, body: JSON.stringify(body) });
      })
      .then(function (r) {
        if (r.ok) setMsg('✅ Uloženo! Na webu se projeví do ~1-2 min (GitHub build).');
        else r.text().then(function (t) { setMsg('❌ Chyba ukládání: ' + t.slice(0, 120)); });
      })
      .catch(function (e) { setMsg('❌ Chyba sítě: ' + e.message); });
  });

  /* ---- zavření ---- */
  function close() { ov.remove(); css.remove(); window.__upsellAdmin = false; }
  $('ua-close').addEventListener('click', close);
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.getElementById('ua-overlay')) close(); });
})();
