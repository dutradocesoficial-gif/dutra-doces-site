/* Dutra Doces · site — comportamento comum a todas as páginas */
(function () {
  'use strict';
  var CFG = window.DUTRA_SITE || {};
  var DOCES = window.DUTRA_DOCES || [];
  var LINHAS = window.DUTRA_LINHAS || [];
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DD = window.DD = window.DD || {};

  // ---------- utilidades ----------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  DD.$ = $; DD.$$ = $$;
  DD.brl = function (v, casas) {
    return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas == null ? 2 : casas, maximumFractionDigits: casas == null ? 2 : casas });
  };
  DD.unidade = function (cento) { return DD.brl(cento / 100); };
  DD.whats = function (texto, numero) {
    return 'https://wa.me/' + (numero || CFG.WHATSAPP) + (texto ? '?text=' + encodeURIComponent(texto) : '');
  };
  DD.img = function (slug) { return '/assets/img/doces/' + slug + '.webp'; };
  DD.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  // Envia um lead para o webhook (se configurado). Devolve true se o servidor aceitou.
  DD.enviarLead = function (tipo, dados) {
    if (!CFG.LEAD_WEBHOOK) return Promise.resolve(false);
    var corpo = Object.assign({ tipo: tipo, pagina: location.pathname, enviado_em: new Date().toISOString() }, dados);
    return fetch(CFG.LEAD_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
  };

  // Quantidade sugerida para a festa (usada na calculadora e no atendimento)
  // 6 a 8 doces por pessoa conforme a duração; com mesa montada, ~25% de finos.
  DD.calcularFesta = function (o) {
    var mult = CFG.MULTIPLO_FESTA || 10;
    var porPessoa = { curta: 6, media: 7, longa: 8 }[o.duracao] || 7;
    if (o.outros === 'muito') porPessoa -= 1;
    var conv = Math.max(0, Number(o.convidados) || 0);
    var total = Math.ceil((conv * porPessoa) / mult) * mult;
    var pf = o.mesa ? 0.25 : 0.10, pg = o.mesa ? 0.25 : 0.30;
    var arred = function (n) { return Math.round(n / mult) * mult; };
    var finos = arred(total * pf), gourmet = arred(total * pg);
    var trad = Math.max(0, total - finos - gourmet);
    var P = CFG.PRECOS_FESTA || { tradicionais: 190, gourmet: 270, finos: 290 };
    var valor = (finos * P.finos + gourmet * P.gourmet + trad * P.tradicionais) / 100;
    return { porPessoa: porPessoa, total: total, finos: finos, gourmet: gourmet, tradicionais: trad, valor: valor };
  };

  var ICON = {
    whats: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
    insta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM16.1 2H7.9A5.9 5.9 0 0 0 2 7.9v8.2A5.9 5.9 0 0 0 7.9 22h8.2a5.9 5.9 0 0 0 5.9-5.9V7.9A5.9 5.9 0 0 0 16.1 2zm4.1 14.1a4.1 4.1 0 0 1-4.1 4.1H7.9a4.1 4.1 0 0 1-4.1-4.1V7.9a4.1 4.1 0 0 1 4.1-4.1h8.2a4.1 4.1 0 0 1 4.1 4.1z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    esq: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    dir: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
  };
  DD.ICON = ICON;

  // ---------- cabeçalho e rodapé (iguais em todas as páginas) ----------
  var NAV = [
    ['/cardapio', 'Doces'],
    ['/festas', 'Festas'],
    ['/revenda', 'Revenda'],
    ['/nossa-historia', 'Nossa história'],
    ['/atendimento', 'Atendimento']
  ];
  var caminho = location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
  function navLinks() {
    return NAV.map(function (n) {
      return '<a href="' + n[0] + '"' + (caminho === n[0] ? ' aria-current="page"' : '') + '>' + n[1] + '</a>';
    }).join('');
  }
  var topo = $('[data-topo]');
  if (topo) {
    topo.outerHTML =
      '<a class="pular" href="#conteudo">Pular para o conteúdo</a>' +
      '<header class="topo" id="topo"><div class="wrap">' +
        '<a class="marca" href="/" aria-label="Dutra Doces, página inicial"><img src="/assets/img/marca/logo-dutra-doces.svg" width="68" height="54" alt="Dutra Doces"></a>' +
        '<nav class="nav" aria-label="Principal">' + navLinks() + '</nav>' +
        '<div class="topo-acoes">' +
          '<a class="btn btn-ouro" href="#chat">Montar minha festa</a>' +
          '<button class="menu-btn" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="gaveta"><span></span></button>' +
        '</div>' +
      '</div></header>' +
      '<div class="gaveta" id="gaveta" aria-hidden="true"><nav aria-label="Menu">' +
        '<a href="/">Início</a>' + navLinks() +
      '</nav><div class="gaveta-rodape">' +
        '<a class="btn btn-ouro" href="#chat">Montar minha festa</a>' +
        '<a class="btn" href="' + DD.whats('Olá! Vim pelo site da Dutra Doces.') + '" target="_blank" rel="noopener">' + ICON.whats + ' WhatsApp</a>' +
      '</div></div>';
  }
  var rodape = $('[data-rodape]');
  if (rodape) {
    var ano = new Date().getFullYear();
    rodape.outerHTML =
      '<footer class="rodape"><div class="wrap">' +
        '<div class="rodape-grade">' +
          '<div><img class="logo" src="/assets/img/marca/logo-dutra-doces.svg" width="200" height="159" alt="Dutra Doces · doces finos desde 2001" loading="lazy">' +
            '<p class="frase">Porque a vida tem que ser doce.</p></div>' +
          '<div><h4>Doces</h4><ul>' +
            '<li><a href="/cardapio">Cardápio completo</a></li><li><a href="/festas">Festas e casamentos</a></li>' +
            '<li><a href="/revenda">Seja revendedor</a></li><li><a href="/nossa-historia">Nossa história</a></li></ul></div>' +
          '<div><h4>Fale com a gente</h4><ul>' +
            '<li><a href="' + DD.whats('Olá! Vim pelo site da Dutra Doces.') + '" target="_blank" rel="noopener">WhatsApp (48) 99101-3331</a></li>' +
            '<li><a href="' + DD.whats('Olá! Vim pelo site da Dutra Doces.', CFG.WHATSAPP_2) + '" target="_blank" rel="noopener">WhatsApp (48) 99101-2792</a></li>' +
            '<li><a href="https://instagram.com/' + CFG.INSTAGRAM + '" target="_blank" rel="noopener">@' + CFG.INSTAGRAM + '</a></li>' +
            '<li><a href="/atendimento">Atendimento online</a></li></ul></div>' +
          '<div><h4>Transparência</h4><ul>' +
            '<li><a href="/privacidade">Política de privacidade</a></li><li><a href="/termos">Termos de uso</a></li>' +
            '<li><a href="/privacidade#direitos">Seus dados (LGPD)</a></li></ul></div>' +
        '</div>' +
        '<div class="base"><span>© ' + ano + ' Dutra Doces · CNPJ ' + CFG.CNPJ + '</span><span>Doces finos · desde 2001</span></div>' +
      '</div></footer>';
  }

  // ---------- links especiais: #chat abre o atendimento, #whats:texto abre o WhatsApp ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#chat"], a[href^="#whats"]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href.indexOf('#chat') === 0) {
      e.preventDefault();
      fecharMenu();
      if (DD.abrirChat) DD.abrirChat(); else location.href = '/atendimento';
    } else {
      e.preventDefault();
      window.open(DD.whats(decodeURIComponent(href.slice(7))), '_blank', 'noopener');
    }
  });

  // ---------- menu móvel ----------
  var menuBtn = $('.menu-btn');
  function fecharMenu() {
    document.documentElement.classList.remove('menu-aberto');
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Abrir menu'); }
    var g = $('#gaveta'); if (g) g.setAttribute('aria-hidden', 'true');
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var abrir = !document.documentElement.classList.contains('menu-aberto');
      document.documentElement.classList.toggle('menu-aberto', abrir);
      menuBtn.setAttribute('aria-expanded', String(abrir));
      menuBtn.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
      $('#gaveta').setAttribute('aria-hidden', String(!abrir));
    });
    $$('#gaveta a').forEach(function (a) { a.addEventListener('click', fecharMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharMenu(); });
  }

  // ---------- cabeçalho some ao descer, volta ao subir ----------
  var header = $('#topo'), ultimoY = 0;
  function aoRolar() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('solido', y > 40);
      header.classList.toggle('escondido', y > 400 && y > ultimoY && !document.documentElement.classList.contains('menu-aberto'));
    }
    ultimoY = y;
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  // ---------- revelar ao rolar ----------
  DD.observarRevela = function (raiz) {
    var els = $$('.revela, .revela-linhas, .doce:not(.visivel)', raiz);
    if (!('IntersectionObserver' in window) || calmo) { els.forEach(function (el) { el.classList.add('visivel'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('visivel'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  };

  // ---------- contadores ----------
  function contadores() {
    var els = $$('[data-conta]');
    if (!els.length) return;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, fim = Number(el.getAttribute('data-conta')), t0 = null, dur = calmo ? 1 : 1800;
        (function passo(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(fim * e);
          if (p < 1) requestAnimationFrame(passo);
        })(performance.now());
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  // ---------- banners do topo ----------
  function hero() {
    var el = $('[data-hero]');
    if (!el || !CFG.BANNERS) return;
    var bs = CFG.BANNERS, dur = CFG.BANNER_SEGUNDOS ? CFG.BANNER_SEGUNDOS * 1000 : 5000, i = 0, timer;
    el.innerHTML = bs.map(function (b, k) {
      var tag = k === 0 ? 'h1' : 'h2';
      var cta = function (c, cls) { return c ? '<a class="btn ' + cls + '" href="' + DD.esc(c.href) + '">' + c.rotulo + '</a>' : ''; };
      return '<div class="slide' + (k === 0 ? ' ativo' : '') + '" role="group" aria-roledescription="banner" aria-label="' + (k + 1) + ' de ' + bs.length + '"' + (k ? ' aria-hidden="true"' : '') + '>' +
        '<picture><source media="(max-width: 900px)" srcset="' + b.imgMobile + '"><img src="' + b.img + '" alt="' + DD.esc(b.alt) + '" width="2560" height="1086"' + (k ? ' loading="lazy"' : ' fetchpriority="high"') + '></picture>' +
        '<div class="slide-txt">' +
        '<' + tag + ' class="anim">' + b.titulo + '</' + tag + '>' +
        '<p class="anim">' + b.texto + '</p>' +
        '<div class="acoes anim">' + cta(b.cta, 'btn-ouro btn-grande') + cta(b.cta2, 'btn-grande') + '</div></div></div>';
    }).join('') +
      '<div class="hero-ctrl"><div class="dots">' + bs.map(function (b, k) {
        return '<button class="dot' + (k === 0 ? ' ativo' : '') + '" type="button" aria-label="Ver banner ' + (k + 1) + ': ' + DD.esc(b.selo) + '"><span>' + b.selo + '</span><i></i></button>';
      }).join('') + '</div><div class="hero-setas">' +
      '<button class="seta" type="button" data-ant aria-label="Banner anterior">' + ICON.esq + '</button>' +
      '<button class="seta" type="button" data-prox aria-label="Próximo banner">' + ICON.dir + '</button></div></div>' +
      '<div class="onda" aria-hidden="true"></div>';
    el.style.setProperty('--dur', dur + 'ms');
    var slides = $$('.slide', el), dots = $$('.dot', el);
    function ir(n) {
      i = (n + bs.length) % bs.length;
      slides.forEach(function (s, k) { s.classList.toggle('ativo', k === i); s.setAttribute('aria-hidden', String(k !== i)); });
      dots.forEach(function (d, k) { d.classList.remove('ativo'); void d.offsetWidth; d.classList.toggle('ativo', k === i); });
      agendar();
    }
    function agendar() { clearTimeout(timer); if (!el.classList.contains('pausado') && !calmo) timer = setTimeout(function () { ir(i + 1); }, dur); }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { ir(k); }); });
    $('[data-ant]', el).addEventListener('click', function () { ir(i - 1); });
    $('[data-prox]', el).addEventListener('click', function () { ir(i + 1); });
    el.addEventListener('mouseenter', function () { el.classList.add('pausado'); clearTimeout(timer); });
    el.addEventListener('mouseleave', function () { el.classList.remove('pausado'); agendar(); });
    el.addEventListener('focusin', function () { el.classList.add('pausado'); clearTimeout(timer); });
    var x0 = null;
    el.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) ir(i + (dx < 0 ? 1 : -1));
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(timer); else agendar(); });
    agendar();
  }

  // ---------- doces flutuando: seguem o mouse e a rolagem ----------
  function flutuantes() {
    var cenas = $$('[data-flutuam]');
    if (!cenas.length || calmo) return;
    var mx = 0, my = 0, alvoX = 0, alvoY = 0;
    window.addEventListener('pointermove', function (e) {
      alvoX = (e.clientX / window.innerWidth - 0.5) * 2;
      alvoY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    var itens = [];
    cenas.forEach(function (c) { $$('.flut', c).forEach(function (f) { itens.push({ el: f, cena: c, p: Number(f.getAttribute('data-prof') || 1) }); }); });
    (function loop() {
      mx += (alvoX - mx) * 0.06; my += (alvoY - my) * 0.06;
      var vh = window.innerHeight;
      itens.forEach(function (it) {
        var r = it.cena.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var prog = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 em torno do centro da tela
        var tx = mx * 18 * it.p, ty = my * 14 * it.p + prog * -90 * it.p;
        it.el.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
      });
      requestAnimationFrame(loop);
    })();
  }

  // ---------- cardápio interativo ----------
  var P = CFG.PRECOS_FESTA || {};
  function precoLinha(linhaId) {
    var l = LINHAS.filter(function (x) { return x.id === linhaId; })[0];
    return l ? P[l.festa] : null;
  }
  function imgDoce(d, v) { return DD.img(d.variantes ? d.variantes[v || 0].img : d.img); }
  function cardDoce(d, idx) {
    var vars = d.variantes ? '<div class="variantes" role="group" aria-label="Cobertura">' + d.variantes.map(function (v, k) {
      return '<button type="button" data-var="' + k + '" aria-pressed="' + (k === 0) + '">' + v.rotulo + '</button>';
    }).join('') + '</div>' : '';
    return '<article class="doce" tabindex="0" role="button" data-idx="' + idx + '" aria-label="' + DD.esc(d.nome) + ': ver detalhes">' +
      '<div class="doce-img"><img src="' + imgDoce(d) + '" alt="' + DD.esc(d.nome) + '" width="720" height="720" loading="lazy" decoding="async"></div>' +
      '<h3>' + d.nome + '</h3><p>' + d.desc + '</p>' + vars + '</article>';
  }
  function vitrines() {
    $$('[data-vitrine]').forEach(function (box) {
      var comTodos = box.hasAttribute('data-todos');
      var abasEl = $('.abas', box), grade = $('.vitrine', box), sub = $('.linha-sub', box), preco = $('.preco-linha', box);
      var abas = (comTodos ? [{ id: 'todos', nome: 'Todos', sub: '43 sabores feitos à mão, um a um' }] : []).concat(LINHAS);
      var atual = box.getAttribute('data-linha') || abas[0].id;
      abasEl.setAttribute('role', 'tablist');
      abasEl.innerHTML = abas.map(function (l) {
        return '<button class="aba" role="tab" type="button" data-linha="' + l.id + '" aria-selected="' + (l.id === atual) + '">' + l.nome + '</button>';
      }).join('') + '<span class="aba-indicador" aria-hidden="true"></span>';
      var ind = $('.aba-indicador', abasEl);
      function moverIndicador() {
        var b = $('.aba[aria-selected="true"]', abasEl); if (!b) return;
        ind.style.width = b.offsetWidth + 'px';
        ind.style.transform = 'translateX(' + b.offsetLeft + 'px)';
        ind.style.top = b.offsetTop + 'px'; ind.style.bottom = 'auto'; ind.style.height = b.offsetHeight + 'px';
      }
      function mostrar(id) {
        atual = id;
        $$('.aba', abasEl).forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-linha') === id)); });
        moverIndicador();
        var l = abas.filter(function (x) { return x.id === id; })[0];
        if (sub) sub.textContent = l.sub;
        if (preco) {
          var c = precoLinha(id);
          preco.textContent = c ? 'Para festas · ' + DD.unidade(c) + ' a unidade · cento ' + DD.brl(c, 0) : 'Tradicionais ' + DD.unidade(P.tradicionais) + ' · Gourmet ' + DD.unidade(P.gourmet) + ' · Finos ' + DD.unidade(P.finos) + ' a unidade';
        }
        var lista = [];
        DOCES.forEach(function (d, k) { if (id === 'todos' || d.linha === id) lista.push(cardDoce(d, k)); });
        grade.innerHTML = lista.join('');
        $$('.doce', grade).forEach(function (c, k) { c.style.setProperty('--atraso', Math.min(k, 12) * 0.05 + 's'); });
        DD.observarRevela(grade);
      }
      abasEl.addEventListener('click', function (e) { var b = e.target.closest('.aba'); if (b) mostrar(b.getAttribute('data-linha')); });
      abasEl.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var bs = $$('.aba', abasEl), k = bs.indexOf(document.activeElement);
        if (k < 0) return; k = (k + (e.key === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length;
        bs[k].focus(); mostrar(bs[k].getAttribute('data-linha'));
      });
      window.addEventListener('resize', moverIndicador);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverIndicador);
      grade.addEventListener('click', function (e) {
        var vb = e.target.closest('[data-var]');
        var card = e.target.closest('.doce'); if (!card) return;
        var d = DOCES[Number(card.getAttribute('data-idx'))];
        if (vb) {
          e.stopPropagation();
          var k = Number(vb.getAttribute('data-var'));
          $$('[data-var]', card).forEach(function (b) { b.setAttribute('aria-pressed', String(b === vb)); });
          var im = $('.doce-img img', card);
          im.classList.remove('gira'); void im.offsetWidth; im.classList.add('gira');
          setTimeout(function () { im.src = imgDoce(d, k); }, 300);
          card.setAttribute('data-v', k);
          return;
        }
        abrirFicha(Number(card.getAttribute('data-idx')), Number(card.getAttribute('data-v') || 0), function () { return $$('.doce', grade).map(function (c) { return Number(c.getAttribute('data-idx')); }); });
      });
      grade.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('doce')) { e.preventDefault(); e.target.click(); }
      });
      // inclinação 3D sutil
      if (!calmo && window.matchMedia('(hover: hover)').matches) {
        grade.addEventListener('pointermove', function (e) {
          var c = e.target.closest('.doce'); if (!c) return;
          var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          c.style.transform = 'rotateX(' + (-y * 8).toFixed(2) + 'deg) rotateY(' + (x * 10).toFixed(2) + 'deg)';
        });
        grade.addEventListener('pointerout', function (e) {
          var c = e.target.closest('.doce'); if (c && !c.contains(e.relatedTarget)) c.style.transform = '';
        });
      }
      mostrar(atual);
    });
  }

  // ficha (modal) de um doce
  var ficha, fichaUltimoFoco, fichaLista = [], fichaIdx = 0, fichaVar = 0;
  function montarFicha() {
    ficha = document.createElement('div');
    ficha.className = 'ficha';
    ficha.setAttribute('role', 'dialog'); ficha.setAttribute('aria-modal', 'true'); ficha.setAttribute('aria-labelledby', 'ficha-nome');
    ficha.innerHTML = '<div class="ficha-fundo" data-fechar></div><div class="ficha-caixa">' +
      '<button class="fechar" type="button" data-fechar aria-label="Fechar">' + ICON.x + '</button>' +
      '<div class="ficha-palco"><img alt="" width="720" height="720"></div>' +
      '<div class="ficha-info"><h2 id="ficha-nome"></h2><p class="ficha-linha" data-linha></p><p data-desc></p><div data-vars></div>' +
      '<div class="ficha-precos"></div>' +
      '<div class="ficha-acoes"><a class="btn btn-ouro" data-pedir target="_blank" rel="noopener">' + ICON.whats + ' Pedir este sabor</a><a class="btn" href="#chat">Montar minha festa</a></div>' +
      '<div class="ficha-nav"><button type="button" data-nav="-1">‹ Anterior</button><button type="button" data-nav="1">Próximo ›</button></div>' +
      '</div></div>';
    document.body.appendChild(ficha);
    ficha.addEventListener('click', function (e) {
      if (e.target.closest('[data-fechar]') || e.target.closest('a[href="#chat"]')) fecharFicha();
      var n = e.target.closest('[data-nav]');
      if (n) { var k = fichaLista.indexOf(fichaIdx) + Number(n.getAttribute('data-nav')); k = (k + fichaLista.length) % fichaLista.length; preencherFicha(fichaLista[k], 0); }
      var vb = e.target.closest('[data-var]');
      if (vb) preencherFicha(fichaIdx, Number(vb.getAttribute('data-var')));
    });
    document.addEventListener('keydown', function (e) {
      if (!ficha.classList.contains('aberta')) return;
      if (e.key === 'Escape') fecharFicha();
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') $('[data-nav="' + (e.key === 'ArrowRight' ? 1 : -1) + '"]', ficha).click();
      if (e.key === 'Tab') {
        var f = $$('button, a[href]', ficha); var p = f[0], u = f[f.length - 1];
        if (e.shiftKey && document.activeElement === p) { e.preventDefault(); u.focus(); }
        else if (!e.shiftKey && document.activeElement === u) { e.preventDefault(); p.focus(); }
      }
    });
  }
  function preencherFicha(idx, v) {
    var d = DOCES[idx]; fichaIdx = idx; fichaVar = v || 0;
    var l = LINHAS.filter(function (x) { return x.id === d.linha; })[0];
    var im = $('.ficha-palco img', ficha);
    im.src = imgDoce(d, fichaVar); im.alt = d.nome;
    $('[data-linha]', ficha).textContent = l.nome;
    $('#ficha-nome', ficha).textContent = d.nome + (d.variantes ? ' · ' + d.variantes[fichaVar].rotulo : '');
    $('[data-desc]', ficha).textContent = d.desc;
    $('[data-vars]', ficha).innerHTML = d.variantes ? '<div class="variantes" role="group" aria-label="Cobertura">' + d.variantes.map(function (x, k) {
      return '<button type="button" data-var="' + k + '" aria-pressed="' + (k === fichaVar) + '">' + x.rotulo + '</button>';
    }).join('') + '</div>' : '';
    var c = P[l.festa];
    $('.ficha-precos', ficha).innerHTML =
      '<div><span>Para festas (docinho)</span><b>' + DD.unidade(c) + ' a unidade</b></div>' +
      '<div><span>Cento</span><b>' + DD.brl(c, 0) + '</b></div>' +
      '<div><span>Grande, para revenda</span><b><a href="/revenda" style="color:inherit">ver condições</a></b></div>';
    $('[data-pedir]', ficha).href = DD.whats('Olá! Quero encomendar o sabor ' + d.nome + (d.variantes ? ' (' + d.variantes[fichaVar].rotulo + ')' : '') + '.');
  }
  function abrirFicha(idx, v, lista) {
    if (!ficha) montarFicha();
    fichaLista = lista ? lista() : DOCES.map(function (_, k) { return k; });
    fichaUltimoFoco = document.activeElement;
    preencherFicha(idx, v);
    ficha.classList.add('aberta');
    document.documentElement.style.overflow = 'hidden';
    setTimeout(function () { $('.fechar', ficha).focus(); }, 50);
  }
  function fecharFicha() {
    ficha.classList.remove('aberta');
    document.documentElement.style.overflow = '';
    if (fichaUltimoFoco) fichaUltimoFoco.focus();
  }
  DD.abrirFicha = abrirFicha;

  // ---------- calculadora de festa ----------
  function calculadora() {
    var box = $('[data-calc]'); if (!box) return;
    var estado = { convidados: 80, duracao: 'media', mesa: true, outros: 'bolo' };
    var rng = $('[name="convidados"]', box), out = $('[data-conv]', box);
    function pinta() {
      var p = (rng.value - rng.min) / (rng.max - rng.min) * 100;
      rng.style.setProperty('--p', p + '%');
    }
    function atualiza() {
      estado.convidados = Number(rng.value); out.textContent = rng.value; pinta();
      var r = DD.calcularFesta(estado);
      $('[data-total]', box).textContent = r.total;
      $('[data-pp]', box).textContent = r.porPessoa;
      ['finos', 'gourmet', 'tradicionais'].forEach(function (k) {
        $('[data-q="' + k + '"]', box).textContent = r[k];
        $('[data-b="' + k + '"]', box).style.width = (r.total ? r[k] / r.total * 100 : 0) + '%';
      });
      $('[data-valor]', box).textContent = DD.brl(r.valor);
      var resumo = 'Olá! Fiz a simulação no site: ' + estado.convidados + ' convidados, ' + r.total + ' doces (' + r.finos + ' finos, ' + r.gourmet + ' gourmet, ' + r.tradicionais + ' tradicionais), cerca de ' + DD.brl(r.valor) + '. Quero montar minha festa!';
      $('[data-calc-whats]', box).href = DD.whats(resumo);
    }
    rng.addEventListener('input', atualiza);
    $$('[data-grupo]', box).forEach(function (g) {
      var chave = g.getAttribute('data-grupo');
      g.addEventListener('click', function (e) {
        var c = e.target.closest('.chip'); if (!c) return;
        $$('.chip', g).forEach(function (x) { x.setAttribute('aria-checked', String(x === c)); });
        var v = c.getAttribute('data-v'); estado[chave] = v === 'true' ? true : v === 'false' ? false : v;
        atualiza();
      });
    });
    atualiza();
  }

  // ---------- simulador de revenda ----------
  function simulador() {
    var box = $('[data-sim]'); if (!box) return;
    var R = CFG.REVENDA || { precoMin: 12, precoMax: 20, lucroMax: 0.5 };
    var q = $('[name="qtd"]', box), pr = $('[name="preco"]', box);
    pr.min = R.precoMin; pr.max = R.precoMax;
    function pinta(r) { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }
    function atualiza() {
      pinta(q); pinta(pr);
      var semana = Number(q.value), preco = Number(pr.value);
      var lucroUn = preco * R.lucroMax, mes = semana * 4 * lucroUn;
      $('[data-qtd]', box).textContent = semana;
      $('[data-preco]', box).textContent = DD.brl(preco, 0);
      $('[data-lucro-un]', box).textContent = DD.brl(lucroUn);
      $('[data-fat]', box).textContent = DD.brl(semana * 4 * preco, 0);
      $('[data-lucro]', box).textContent = DD.brl(mes, 0);
    }
    q.addEventListener('input', atualiza); pr.addEventListener('input', atualiza);
    atualiza();
  }

  // ---------- história: capítulos acendem e o Dutra comenta ----------
  function historia() {
    var caps = $$('.capitulo'); if (!caps.length) return;
    var balao = $('.balao'), fio = $('.capitulos .fio'), cont = $('.capitulos');
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        caps.forEach(function (c) { c.classList.toggle('ativo', c === en.target); });
        var fala = en.target.getAttribute('data-fala');
        if (balao && fala && balao.textContent !== fala) {
          balao.classList.add('troca');
          setTimeout(function () { balao.textContent = fala; balao.classList.remove('troca'); }, 300);
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    caps.forEach(function (c) { io.observe(c); });
    if (fio && cont) {
      var f = function () {
        var r = cont.getBoundingClientRect(), vh = window.innerHeight;
        var p = Math.min(1, Math.max(0, (vh * 0.5 - r.top) / r.height));
        fio.style.height = (p * (r.height - 16)) + 'px';
      };
      window.addEventListener('scroll', f, { passive: true }); f();
    }
  }

  // ---------- formulário de revenda ----------
  function soNumeros(s) { return String(s || '').replace(/\D/g, ''); }
  DD.mascaraFone = function (v) {
    var n = soNumeros(v).slice(0, 11);
    if (n.length <= 2) return n.length ? '(' + n : '';
    if (n.length <= 6) return '(' + n.slice(0, 2) + ') ' + n.slice(2);
    if (n.length <= 10) return '(' + n.slice(0, 2) + ') ' + n.slice(2, 6) + '-' + n.slice(6);
    return '(' + n.slice(0, 2) + ') ' + n.slice(2, 7) + '-' + n.slice(7);
  };
  DD.foneValido = function (v) { var n = soNumeros(v); return n.length === 10 || n.length === 11; };
  DD.emailValido = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); };

  function formRevenda() {
    var form = $('[data-form-revenda]'); if (!form) return;
    var fone = form.elements.whatsapp;
    fone.addEventListener('input', function () { fone.value = DD.mascaraFone(fone.value); });
    $$('[data-chips]', form).forEach(function (g) {
      g.addEventListener('click', function (e) {
        var c = e.target.closest('.chip'); if (!c) return;
        c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
      });
    });
    function erro(nome, msg) {
      var campo = form.elements[nome], box = campo.closest ? campo.closest('.entrada') : null;
      if (!box) return;
      box.classList.toggle('invalida', !!msg);
      var e = $('.erro', box); if (e) e.textContent = msg || '';
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = form.elements, ok = true;
      var regras = [
        ['nome', f.nome.value.trim().length >= 3, 'Conta pra gente seu nome completo.'],
        ['whatsapp', DD.foneValido(f.whatsapp.value), 'Confira o WhatsApp com DDD.'],
        ['email', !f.email.value.trim() || DD.emailValido(f.email.value), 'Esse e-mail parece incompleto.'],
        ['cidade', f.cidade.value.trim().length >= 2, 'Em qual cidade você vai revender?'],
        ['volume', !!f.volume.value, 'Escolha uma estimativa.']
      ];
      regras.forEach(function (r) { erro(r[0], r[1] ? '' : r[2]); if (!r[1]) ok = false; });
      if (!f.aceite.checked) { ok = false; $('[data-erro-aceite]', form).textContent = 'Precisamos do seu ok para entrar em contato.'; }
      else $('[data-erro-aceite]', form).textContent = '';
      if (!ok) { var p = $('.invalida input, .invalida select', form); if (p) p.focus(); return; }
      var canais = $$('[data-chips="canais"] .chip[aria-pressed="true"]', form).map(function (c) { return c.textContent; });
      var dados = {
        nome: f.nome.value.trim(), whatsapp: f.whatsapp.value, email: f.email.value.trim(), cidade: f.cidade.value.trim(),
        canais: canais, volume_semana: f.volume.value, ja_revende: f.experiencia.value, cnpj: f.cnpj.value.trim(), mensagem: f.mensagem.value.trim(),
        aceite_lgpd: true
      };
      var btn = $('button[type="submit"]', form); btn.disabled = true; btn.textContent = 'Enviando…';
      var texto = 'Olá! Quero ser revendedor(a) Dutra Doces.\nNome: ' + dados.nome + '\nCidade: ' + dados.cidade +
        (canais.length ? '\nOnde vou vender: ' + canais.join(', ') : '') + '\nEstimativa: ' + dados.volume_semana + ' doces por semana' +
        (dados.mensagem ? '\nRecado: ' + dados.mensagem : '');
      DD.enviarLead('revenda', dados).then(function (aceito) {
        var ok = $('[data-form-ok]');
        form.hidden = true; ok.hidden = false;
        $('[data-ok-nome]', ok).textContent = dados.nome.split(' ')[0];
        $('[data-ok-txt]', ok).textContent = aceito
          ? 'Recebemos seu cadastro. Alguém do nosso time vai te chamar no WhatsApp para passar a tabela de revenda e combinar o primeiro pedido.'
          : 'Falta só um toque: envie seu cadastro pelo WhatsApp e alguém do nosso time te responde com a tabela de revenda.';
        var w = $('[data-ok-whats]', ok); w.href = DD.whats(texto);
        w.lastChild.textContent = aceito ? ' Adiantar pelo WhatsApp' : ' Enviar pelo WhatsApp';
        ok.scrollIntoView({ behavior: calmo ? 'auto' : 'smooth', block: 'center' });
      });
    });
  }

  // ---------- aviso de cookies (só armazenamento essencial) ----------
  function cookies() {
    var chave = 'dd_aviso_ok';
    try { if (localStorage.getItem(chave)) return; } catch (e) { return; }
    var c = document.createElement('div');
    c.className = 'cookies'; c.setAttribute('role', 'region'); c.setAttribute('aria-label', 'Aviso de privacidade');
    c.innerHTML = '<p>Este site usa apenas o armazenamento essencial para funcionar. Seus dados só são usados para responder o seu contato. <a href="/privacidade">Saiba mais</a>.</p><button class="btn btn-ouro" type="button">Entendi</button>';
    c.hidden = true; document.body.appendChild(c);
    setTimeout(function () { c.hidden = false; }, 3500);
    $('button', c).addEventListener('click', function () { try { localStorage.setItem(chave, '1'); } catch (e) {} c.remove(); });
  }

  // ---------- divide títulos em linhas animadas ----------
  $$('[data-linhas]').forEach(function (el) {
    el.classList.add('revela-linhas');
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map(function (l, k) {
      return '<span class="ln"><span style="--atraso:' + (k * 0.12) + 's">' + l + '</span></span>';
    }).join('');
  });

  hero();
  vitrines();
  calculadora();
  simulador();
  historia();
  formRevenda();
  flutuantes();
  contadores();
  DD.observarRevela(document);
  cookies();
})();
