/*
 * Dutra Doces · Checkout
 * Front-end apenas: toda regra de preço, pedido e pagamento fica no n8n.
 * Nenhum valor é calculado aqui — tudo o que aparece vem dos endpoints.
 * Dados de cartão NUNCA vão para localStorage, console, analytics ou para o n8n em texto aberto.
 */
(function () {
  'use strict';

  var CFG = window.DUTRA_CONFIG || {};
  var MAX_PARCELAS = CFG.MAX_PARCELAS || 1;

  /* ------------------------------------------------------------------
   * Ponto único para o pixel de anúncios.
   * Eventos: checkout_aberto, pix_gerado, pagamento_aprovado.
   * Para ligar: defina window.dutraTrack ANTES deste script (ou edite aqui).
   * Nunca recebe dados de cartão, CPF ou o token do link.
   * ------------------------------------------------------------------ */
  window.dutraTrack = window.dutraTrack || function (evento, dados) { /* ligar pixel aqui */ };
  function track(evento, dados) { try { window.dutraTrack(evento, dados || {}); } catch (e) { /* nunca quebra a página */ } }

  /* ------------------------------------------------------------------
   * PagBank — criptografia do cartão (SDK oficial)
   * CONFERIR na documentação "Criptografia e chave pública" do PagBank
   * se o endereço do script e o nome da função continuam estes.
   * ------------------------------------------------------------------ */
  var PAGBANK_SDK_URL = 'https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js';

  function carregarScript(src) {
    return new Promise(function (ok, falha) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = ok; s.onerror = function () { falha(new Error('script')); };
      document.head.appendChild(s);
    });
  }
  var sdkPromise = null;
  function carregarSdkPagBank() {
    if (window.PagSeguro && window.PagSeguro.encryptCard) return Promise.resolve();
    if (!sdkPromise) sdkPromise = carregarScript(PAGBANK_SDK_URL).catch(function (e) { sdkPromise = null; throw e; });
    return sdkPromise;
  }

  // Devolve o cartão criptografado (string). Em erro, lança { campo, mensagem }.
  function criptografarCartao(d) {
    if (CFG.MOCK) return Promise.resolve('MOCK-CARTAO-CRIPTOGRAFADO');
    return carregarSdkPagBank().then(function () {
      var r = window.PagSeguro.encryptCard({
        publicKey: CFG.PAGBANK_PUBLIC_KEY,
        holder: d.holder,
        number: d.number,
        expMonth: d.expMonth,   // "MM"
        expYear: d.expYear,     // "AAAA"
        securityCode: d.securityCode
      });
      if (!r || r.hasErrors || !r.encryptedCard) {
        var cod = (r && r.errors && r.errors[0] && r.errors[0].code) || '';
        var mapa = {
          INVALID_NUMBER: ['cc-numero', 'Número do cartão inválido.'],
          INVALID_SECURITY_CODE: ['cc-cvv', 'Código de segurança inválido.'],
          INVALID_EXPIRATION_MONTH: ['cc-validade', 'Mês de validade inválido.'],
          INVALID_EXPIRATION_YEAR: ['cc-validade', 'Ano de validade inválido.'],
          INVALID_HOLDER: ['cc-nome', 'Nome do titular inválido.']
        };
        var m = mapa[cod] || [null, 'Não foi possível validar o cartão. Confira os dados ou fale com a gente.'];
        throw { campo: m[0], mensagem: m[1] };
      }
      return r.encryptedCard;
    }, function () {
      throw { campo: null, mensagem: 'Não conseguimos carregar o pagamento seguro do PagBank. Verifique sua conexão e tente de novo.' };
    });
  }

  /* ------------------------------------------------------------------
   * Utilidades
   * ------------------------------------------------------------------ */
  var $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  var app = $('#app');
  var anuncio = $('#anuncio');

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function brl(v) { return fmtBRL.format(Number(v) || 0).replace(/ /g, ' '); }
  function anunciar(txt) { anuncio.textContent = ''; setTimeout(function () { anuncio.textContent = txt; }, 60); }
  function soDigitos(s) { return String(s || '').replace(/\D/g, ''); }

  function linkWhats(texto) {
    return 'https://wa.me/' + soDigitos(CFG.WHATSAPP) + (texto ? '?text=' + encodeURIComponent(texto) : '');
  }
  var ICONE_WHATS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>';
  var ICONE_CADEADO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-7-2a2 2 0 1 1 4 0v2h-4V7zm3 9.7V18h-2v-1.3a1.5 1.5 0 1 1 2 0z"/></svg>';
  function botaoWhats(texto, rotulo, cheio) {
    return '<a class="botao' + (cheio ? ' cheio' : '') + '" href="' + esc(linkWhats(texto)) + '" target="_blank" rel="noopener">' +
      ICONE_WHATS + esc(rotulo || 'Falar com a Dutra') + '</a>';
  }

  /* ------------------------------------------------------------------
   * Estado
   * ------------------------------------------------------------------ */
  var params = new URLSearchParams(location.search);
  var S = {
    token: (params.get('p') || '').trim(),
    pedido: null,
    expiraMs: 0,
    offsetMs: 0,        // hora do servidor − hora do celular
    painel: null,       // 'pix-inicio' | 'pix' | 'cartao' | 'recusado' | 'analise'
    pix: null,
    pixGerado: false,
    recusaMsg: '',
    analiseMsg: '',
    ocupado: false,     // trava enquanto processa
    encerrado: false,   // pago / expirado / cancelado
    ultimoMinuto: null,
    parcelas: null,     // opções do endpoint 4
    binAtual: '',
    rastreouPago: false
  };
  var timers = { relogio: null, status: null, parcelas: null };

  function agoraServidor() { return Date.now() + S.offsetMs; }
  function restanteMs() { return S.expiraMs - agoraServidor(); }

  /* ------------------------------------------------------------------
   * API (n8n) — contrato em checkout/README.md
   * ------------------------------------------------------------------ */
  function ErroApi(status, erro, mensagem) { this.status = status; this.erro = erro; this.mensagem = mensagem; }
  function ErroRede() { this.rede = true; }

  function api(metodo, rota, corpo) {
    if (CFG.MOCK && window.DutraMock) return window.DutraMock.chamar(metodo, rota, corpo);
    var url = CFG.N8N_BASE.replace(/\/+$/, '') + '/' + rota;
    var ctrl = window.AbortController ? new AbortController() : null;
    var limite = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
    var opcoes = { method: metodo, headers: { 'Accept': 'application/json' }, cache: 'no-store', signal: ctrl && ctrl.signal };
    if (corpo) { opcoes.headers['Content-Type'] = 'application/json'; opcoes.body = JSON.stringify(corpo); }
    return fetch(url, opcoes).then(function (r) {
      clearTimeout(limite);
      return r.text().then(function (txt) {
        var json = null;
        try { json = txt ? JSON.parse(txt) : {}; } catch (e) { json = null; }
        if (!r.ok) throw new ErroApi(r.status, (json && json.erro) || 'erro', (json && json.mensagem) || 'Algo deu errado. Tente de novo em instantes.');
        if (!json) throw new ErroApi(r.status, 'resposta_invalida', 'Algo deu errado. Tente de novo em instantes.');
        return json;
      });
    }, function () { clearTimeout(limite); throw new ErroRede(); });
  }
  var tk = function () { return encodeURIComponent(S.token); };

  /* ------------------------------------------------------------------
   * Rodapé (todas as telas)
   * ------------------------------------------------------------------ */
  function renderRodape() {
    var v = CFG.VENDEDOR || {};
    $('#rodape').innerHTML = esc(v.nome_fantasia || 'Dutra Doces') + ' · CNPJ ' + esc(v.cnpj || '') + ' · ' + esc(v.cidade || '') +
      ' · <a href="/checkout/termos.html" target="_blank" rel="noopener">Termos e políticas</a>';
    if (CFG.MOCK) {
      var b = document.createElement('div');
      b.className = 'aviso info faixa-teste';
      b.textContent = 'MODO DE TESTE — nenhum pagamento real é feito';
      document.body.insertBefore(b, document.body.firstChild);
    }
  }

  /* ------------------------------------------------------------------
   * Telas de mensagem (inválido, expirado, cancelado, pago, erro de rede)
   * ------------------------------------------------------------------ */
  function pararTudo() {
    clearInterval(timers.relogio); timers.relogio = null;
    clearInterval(timers.status); timers.status = null;
    clearTimeout(timers.parcelas);
  }
  function destravar() { S.ocupado = false; $('#travar').hidden = true; document.body.style.overflow = ''; }
  function travar(txt) {
    S.ocupado = true;
    $('#travar-txt').textContent = txt || 'Processando pagamento…';
    $('#travar').hidden = false; document.body.style.overflow = 'hidden';
  }

  function telaMensagem(o) {
    app.setAttribute('aria-busy', 'false');
    app.innerHTML =
      '<section class="tela-msg">' +
        '<div class="icone" aria-hidden="true">' + (o.icone || '') + '</div>' +
        '<h1 class="titulo" tabindex="-1">' + esc(o.titulo) + '</h1>' +
        (o.textos || []).map(function (t) { return '<p>' + t + '</p>'; }).join('') +
        '<div class="botoes">' + (o.botoes || '') + '</div>' +
      '</section>';
    var h = $('h1', app); if (h) h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    if (o.anunciar) anunciar(o.anunciar);
  }

  function telaInvalido() {
    S.encerrado = true; pararTudo(); destravar();
    telaMensagem({
      icone: '🍫', titulo: 'Link não encontrado',
      textos: ['Não encontramos o pedido deste link. Ele pode ter sido digitado incompleto.',
               'Chama a gente no WhatsApp que resolvemos rapidinho!'],
      botoes: botaoWhats('Oi! Recebi um link de pagamento da Dutra Doces, mas ele não abriu.', 'Falar com a Dutra', true)
    });
  }

  function telaExpirado() {
    S.encerrado = true; pararTudo(); destravar();
    var n = S.pedido && S.pedido.numero;
    telaMensagem({
      icone: '⏳', titulo: 'Sua reserva expirou',
      textos: ['O tempo para garantir este pedido acabou e a vaga foi liberada.',
               'Mas não se preocupe: fale com a gente que vemos se ainda dá para encaixar seus doces.'],
      botoes: botaoWhats(n ? 'Oi! Meu link do pedido ' + n + ' expirou, ainda dá para garantir?' : 'Oi! Meu link de pagamento expirou, ainda dá para garantir?', 'Falar com a Dutra', true),
      anunciar: 'Sua reserva expirou.'
    });
  }

  function telaCancelado() {
    S.encerrado = true; pararTudo(); destravar();
    var n = S.pedido && S.pedido.numero;
    telaMensagem({
      icone: '🍬', titulo: 'Pedido cancelado',
      textos: ['Este pedido foi cancelado e não pode mais ser pago por este link.',
               'Se foi engano ou quiser fazer um novo pedido, fale com a gente.'],
      botoes: botaoWhats(n ? 'Oi! Meu pedido ' + n + ' aparece como cancelado. Pode me ajudar?' : 'Oi! Meu pedido aparece como cancelado. Pode me ajudar?', 'Falar com a Dutra', true)
    });
  }

  function telaPago() {
    S.encerrado = true; pararTudo(); destravar();
    var p = S.pedido || {};
    if (!S.rastreouPago) {
      S.rastreouPago = true;
      track('pagamento_aprovado', { numero: p.numero, valor: p.valor_a_pagar, forma: p.forma_pagamento, parcela: p.parcela });
    }
    var linha = p.numero
      ? 'Pedido nº ' + esc(p.numero) + ' garantido' + (p.data_entrega ? ' para ' + esc(p.data_entrega) : '') + '.'
      : 'Seu pedido está garantido.';
    telaMensagem({
      icone: '🎉', titulo: 'Pagamento confirmado!',
      textos: ['<strong>' + linha + '</strong>', 'Você vai receber a confirmação no WhatsApp.', 'Obrigada por adoçar seus momentos com a Dutra Doces ★'],
      botoes: botaoWhats(p.numero ? 'Oi! Acabei de pagar o pedido ' + p.numero + '.' : '', 'Falar com a Dutra'),
      anunciar: 'Pagamento confirmado! ' + linha.replace(/<[^>]+>/g, '')
    });
  }

  function telaErroRede(tentarDeNovo) {
    pararTudo(); destravar();
    telaMensagem({
      icone: '📶', titulo: 'Sem conexão',
      textos: ['Não conseguimos conectar. Confira sua internet e tente de novo.'],
      botoes: '<button type="button" class="botao cheio" id="btn-tentar">Tentar de novo</button>' + botaoWhats('Oi! Estou tentando pagar meu pedido pelo link, mas a página não carrega.', 'Falar com a Dutra'),
      anunciar: 'Não conseguimos conectar.'
    });
    $('#btn-tentar').addEventListener('click', tentarDeNovo);
  }

  /* ------------------------------------------------------------------
   * Carregar pedido (endpoint 1)
   * ------------------------------------------------------------------ */
  function telaCarregando() {
    app.setAttribute('aria-busy', 'true');
    app.innerHTML = '<p class="sr-only">Carregando seu pedido…</p>' +
      '<div class="esq relogio-esq" aria-hidden="true"></div><div class="esq bloco" aria-hidden="true"></div><div class="esq bloco2" aria-hidden="true"></div>';
  }

  var abriuCheckout = false;
  function carregar() {
    if (!S.token) { telaInvalido(); return; }
    telaCarregando();
    var t0 = Date.now();
    api('GET', 'checkout-dados?p=' + tk()).then(function (d) {
      sincronizarRelogio(d, t0);
      if (d.pedido) S.pedido = d.pedido;
      tratarStatus(d.status, true);
    }).catch(function (e) {
      if (e && e.rede) return telaErroRede(carregar);
      if (e && (e.erro === 'link_invalido' || e.status === 404)) return telaInvalido();
      if (e && e.erro === 'link_expirado') return telaExpirado();
      telaMensagem({
        icone: '🍫', titulo: 'Ops!',
        textos: [esc(e && e.mensagem || 'Algo deu errado.')],
        botoes: '<button type="button" class="botao cheio" id="btn-tentar">Tentar de novo</button>' + botaoWhats('', 'Falar com a Dutra')
      });
      $('#btn-tentar').addEventListener('click', carregar);
    });
  }

  function sincronizarRelogio(d, t0) {
    var meio = t0 + (Date.now() - t0) / 2; // compensa o tempo de ida e volta
    var srv = Date.parse(d.agora);
    S.offsetMs = isNaN(srv) ? 0 : srv - meio;
    var exp = Date.parse(d.expira_em);
    if (!isNaN(exp)) S.expiraMs = exp;
  }

  function tratarStatus(status, inicial) {
    if (status === 'pago') return telaPago();
    if (status === 'expirado') return telaExpirado();
    if (status === 'cancelado') return telaCancelado();
    if (status !== 'aguardando_pagamento' || !S.pedido) return telaInvalido();
    if (restanteMs() <= 0) return telaExpirado();
    if (inicial && !abriuCheckout) {
      abriuCheckout = true;
      track('checkout_aberto', { numero: S.pedido.numero, valor: S.pedido.valor_a_pagar, forma: S.pedido.forma_pagamento });
    }
    S.painel = painelPadrao();
    renderPrincipal();
    iniciarRelogio();
  }

  function painelPadrao() {
    return S.pedido.forma_pagamento === 'cartao' ? 'cartao' : (S.pix ? 'pix' : 'pix-inicio');
  }

  /* ------------------------------------------------------------------
   * Contagem regressiva
   * ------------------------------------------------------------------ */
  function mmss(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60);
    return (m < 10 ? '0' : '') + m + ':' + ((s % 60) < 10 ? '0' : '') + (s % 60);
  }
  function iniciarRelogio() {
    clearInterval(timers.relogio);
    atualizarRelogio();
    timers.relogio = setInterval(atualizarRelogio, 1000);
  }
  function atualizarRelogio() {
    var ms = restanteMs();
    var el = $('#tempo'), sr = $('#tempo-sr'), box = $('#relogio');
    if (el) el.textContent = mmss(ms);
    if (box) box.classList.toggle('urgente', ms < 5 * 60000);
    var min = Math.ceil(ms / 60000);
    if (sr && min !== S.ultimoMinuto) {
      S.ultimoMinuto = min;
      sr.textContent = min > 1 ? 'Sua vaga fica guardada por mais ' + min + ' minutos.' : 'Menos de 1 minuto para o fim da reserva.';
    }
    if (ms <= 0) tempoEsgotado();
  }
  function tempoEsgotado() {
    clearInterval(timers.relogio); timers.relogio = null;
    clearInterval(timers.status); timers.status = null;
    if (S.encerrado) return;
    if (S.ocupado) { setTimeout(tempoEsgotado, 1500); return; } // deixa um pagamento em andamento terminar
    desabilitarTudo();
    // Última conferência: o Pix pode ter sido pago no último segundo.
    api('GET', 'checkout-status?p=' + tk()).then(function (r) {
      if (r.status === 'pago') telaPago(); else telaExpirado();
    }, telaExpirado);
  }
  function desabilitarTudo() {
    Array.prototype.forEach.call(app.querySelectorAll('button, input, select'), function (el) { el.disabled = true; });
  }

  /* ------------------------------------------------------------------
   * Tela principal: aguardando pagamento
   * ------------------------------------------------------------------ */
  var FORMAS = {
    cartao: { nome: 'Cartão de crédito', det: function () { return MAX_PARCELAS > 1 ? 'Em até ' + MAX_PARCELAS + 'x' : 'À vista'; } },
    pix_integral: { nome: 'Pix', det: function () { return 'Valor integral, confirmação na hora'; } },
    pix_50: { nome: 'Pix 50% + 50%', det: function () { return 'Metade agora (sinal) e o restante depois'; } }
  };
  var ETIQUETA = { sinal: 'Sinal 50%', saldo: 'Saldo' };

  function htmlResumo(p) {
    var etiqueta = ETIQUETA[p.parcela] ? '<span class="etiqueta">' + ETIQUETA[p.parcela] + '</span>' : '';
    var itens = (p.itens || []).map(function (i) {
      return '<li><span class="qtd">' + esc(i.quantidade) + 'x</span><span>' + esc(i.nome) + '</span></li>';
    }).join('');
    var linhas = '<tr><td>Subtotal</td><td>' + brl(p.subtotal) + '</td></tr>';
    if (p.modalidade === 'entrega' || Number(p.frete) > 0) linhas += '<tr><td>Frete</td><td>' + brl(p.frete) + '</td></tr>';
    if (Number(p.desconto) > 0) linhas += '<tr class="desconto"><td>Desconto</td><td>− ' + brl(p.desconto) + '</td></tr>';
    linhas += '<tr class="total"><td>Total do pedido</td><td>' + brl(p.valor_total) + '</td></tr>';
    var rotuloPagar = p.parcela === 'sinal' ? 'Sinal a pagar agora' : p.parcela === 'saldo' ? 'Saldo a pagar' : 'A pagar agora';
    linhas += '<tr class="pagar"><td>' + rotuloPagar + '</td><td>' + brl(p.valor_a_pagar) + '</td></tr>';
    return '<section class="cartao" aria-labelledby="t-resumo">' +
      '<h2 id="t-resumo"><span>Pedido nº ' + esc(p.numero) + '</span>' + etiqueta + '</h2>' +
      '<ul class="itens">' + itens + '</ul>' +
      (p.quantidade_total ? '<p class="oswald" style="color:var(--suave);font-size:.9rem">' + esc(p.quantidade_total) + ' doces no total</p>' : '') +
      '<dl class="info">' +
        '<div><dt>Data</dt><dd>' + esc(p.data_entrega || '—') + '</dd></div>' +
        '<div><dt>Como recebe</dt><dd>' + (p.modalidade === 'retirada' ? 'Retirada' : p.modalidade === 'entrega' ? 'Entrega' : esc(p.modalidade || '—')) + '</dd></div>' +
      '</dl>' +
      '<table class="valores"><caption class="sr-only">Valores do pedido</caption>' + linhas + '</table>' +
    '</section>';
  }

  function htmlFormas(p) {
    var permitidas = (p.formas_permitidas || []).filter(function (f) { return FORMAS[f]; });
    if (permitidas.length <= 1 && permitidas[0] === p.forma_pagamento) {
      return '<section class="cartao" aria-labelledby="t-forma"><h2 id="t-forma">Forma de pagamento</h2>' +
        '<p class="oswald">' + esc(FORMAS[p.forma_pagamento] ? FORMAS[p.forma_pagamento].nome : p.forma_pagamento) + '</p></section>';
    }
    var travado = S.pixGerado;
    return '<section class="cartao" aria-labelledby="t-forma"><h2 id="t-forma">Forma de pagamento</h2>' +
      '<fieldset class="formas"><legend class="sr-only">Escolha a forma de pagamento</legend>' +
      permitidas.map(function (f) {
        return '<label class="forma"><input type="radio" name="forma" value="' + f + '"' +
          (f === p.forma_pagamento ? ' checked' : '') + (travado ? ' disabled' : '') + '>' +
          '<span><span class="nome">' + FORMAS[f].nome + '</span><span class="det">' + FORMAS[f].det() + '</span></span></label>';
      }).join('') +
      '</fieldset>' +
      (travado ? '<p class="aviso info">O Pix já foi gerado. Para trocar a forma de pagamento, fale com a gente.</p>' : '') +
      '<div id="aviso-forma"></div></section>';
  }

  function renderPrincipal() {
    var p = S.pedido;
    app.setAttribute('aria-busy', 'false');
    app.innerHTML =
      '<h1 class="titulo" tabindex="-1">Finalize seu pedido</h1>' +
      '<p class="sub">' + (p.primeiro_nome ? 'Oi, ' + esc(p.primeiro_nome) + '! ' : '') + 'Falta pouco para garantir seus doces.</p>' +
      '<div class="relogio" id="relogio" role="timer" aria-live="polite" aria-atomic="true">' +
        '<span aria-hidden="true">Sua vaga fica guardada por</span> <strong id="tempo" aria-hidden="true">' + mmss(restanteMs()) + '</strong>' +
        '<span class="sr-only" id="tempo-sr"></span>' +
      '</div>' +
      htmlResumo(p) +
      htmlFormas(p) +
      '<section class="cartao" id="painel" aria-live="polite"></section>';
    S.ultimoMinuto = null;
    Array.prototype.forEach.call(app.querySelectorAll('input[name="forma"]'), function (r) {
      r.addEventListener('change', function () { trocarForma(r.value); });
    });
    renderPainel();
  }

  /* ------------------------------------------------------------------
   * Troca de forma (endpoint 2)
   * ------------------------------------------------------------------ */
  function trocarForma(forma) {
    if (S.ocupado || S.encerrado || forma === S.pedido.forma_pagamento) return;
    S.ocupado = true;
    var radios = app.querySelectorAll('input[name="forma"]');
    Array.prototype.forEach.call(radios, function (r) { r.disabled = true; });
    var painel = $('#painel');
    if (painel) painel.innerHTML = '<p class="aguardando"><span class="ponto"></span>Atualizando valores…</p>';
    api('POST', 'checkout-forma', { token: S.token, forma_pagamento: forma }).then(function (pedido) {
      S.ocupado = false;
      S.pedido = pedido.pedido || pedido; // aceita { pedido } ou o objeto direto
      S.parcelas = null; S.binAtual = '';
      S.painel = painelPadrao();
      renderPrincipal();
      atualizarRelogio();
      anunciar('Forma de pagamento alterada. Valor a pagar: ' + brl(S.pedido.valor_a_pagar) + '.');
    }).catch(function (e) {
      S.ocupado = false;
      if (e && e.erro === 'link_expirado') return telaExpirado();
      if (e && e.erro === 'pagamento_ja_iniciado') { S.pixGerado = true; }
      renderPrincipal();
      atualizarRelogio();
      mostrarAviso($('#aviso-forma'), e && e.rede ? 'Não conseguimos conectar. Tente de novo.' : (e && e.mensagem) || 'Não foi possível trocar a forma agora.',
        e && e.rede ? function () { trocarForma(forma); } : null);
    });
  }

  function mostrarAviso(alvo, msg, tentar) {
    if (!alvo) return;
    alvo.innerHTML = '<div class="aviso erro" role="alert">' + esc(msg) +
      (tentar ? ' <button type="button" class="link-botao">Tentar de novo</button>' : '') + '</div>';
    if (tentar) $('.link-botao', alvo).addEventListener('click', tentar);
  }

  /* ------------------------------------------------------------------
   * Painel de pagamento
   * ------------------------------------------------------------------ */
  function renderPainel() {
    var el = $('#painel'); if (!el) return;
    clearInterval(timers.status); timers.status = null;
    var p = S.pedido;
    if (S.painel === 'pix-inicio') {
      el.innerHTML = '<h2>Pagar com Pix</h2>' +
        '<p style="color:var(--creme)">Geramos um código Pix para você pagar pelo app do seu banco. A confirmação é na hora.</p>' +
        '<div class="botoes"><button type="button" class="botao cheio" id="btn-pix">Gerar Pix de ' + brl(p.valor_a_pagar) + '</button></div>' +
        '<div id="aviso-pix"></div>';
      $('#btn-pix').addEventListener('click', gerarPix);
    } else if (S.painel === 'pix') {
      renderPix(el);
    } else if (S.painel === 'cartao') {
      renderCartao(el);
    } else if (S.painel === 'recusado') {
      var podePix = (p.formas_permitidas || []).some(function (f) { return f === 'pix_integral' || f === 'pix_50'; });
      el.innerHTML = '<h2>Pagamento não aprovado</h2>' +
        '<div class="aviso erro" role="alert">' + esc(S.recusaMsg || 'O pagamento não foi aprovado.') + '</div>' +
        '<div class="botoes">' +
          '<button type="button" class="botao cheio" id="btn-outro">Tentar outro cartão</button>' +
          (podePix ? '<button type="button" class="botao" id="btn-irpix">Pagar com Pix</button>' : '') +
        '</div>';
      $('#btn-outro').addEventListener('click', function () { S.painel = 'cartao'; renderPainel(); focarPrimeiroCampo(); });
      if (podePix) $('#btn-irpix').addEventListener('click', function () {
        var alvo = (p.formas_permitidas || []).indexOf('pix_integral') >= 0 ? 'pix_integral' : 'pix_50';
        trocarForma(alvo);
      });
    } else if (S.painel === 'analise') {
      el.innerHTML = '<h2>Pagamento em análise</h2>' +
        '<p style="color:var(--creme)">' + esc(S.analiseMsg || 'Seu pagamento está em análise pela operadora. Isso costuma levar poucos minutos.') + '</p>' +
        '<p class="aguardando"><span class="ponto" aria-hidden="true"></span>Aguardando a confirmação… pode deixar esta página aberta.</p>';
      iniciarConsultaStatus();
    }
  }

  /* ---------- Pix (endpoints 3 e 6) ---------- */
  function gerarPix() {
    if (S.ocupado || S.encerrado) return;
    var btn = $('#btn-pix');
    if (btn) { btn.disabled = true; btn.textContent = 'Gerando Pix…'; }
    S.ocupado = true;
    api('POST', 'checkout-pix', { token: S.token }).then(function (pix) {
      S.ocupado = false;
      var primeiraVez = !S.pixGerado;
      S.pix = pix; S.pixGerado = true; S.painel = 'pix';
      renderPrincipal(); // trava o seletor de forma
      atualizarRelogio();
      if (primeiraVez) track('pix_gerado', { numero: S.pedido.numero, valor: pix.valor });
      anunciar('Pix gerado. Copie o código ou leia o QR Code no app do seu banco.');
    }).catch(function (e) {
      S.ocupado = false;
      if (e && e.erro === 'link_expirado') return telaExpirado();
      if (btn) { btn.disabled = false; btn.textContent = 'Gerar Pix de ' + brl(S.pedido.valor_a_pagar); }
      mostrarAviso($('#aviso-pix'), e && e.rede ? 'Não conseguimos conectar. Tente de novo.' : (e && e.mensagem) || 'Não foi possível gerar o Pix agora.', gerarPix);
    });
  }

  function renderPix(el) {
    var pix = S.pix;
    el.innerHTML = '<h2>Pague com Pix</h2>' +
      '<p class="pix-valor">' + brl(pix.valor) + '</p>' +
      (pix.qr_code_imagem ? '<div class="qr"><img src="' + esc(pix.qr_code_imagem) + '" alt="QR Code do Pix de ' + esc(brl(pix.valor)) + '"></div>' : '') +
      '<label class="sr-only" for="codigo-pix">Código Pix copia e cola</label>' +
      '<textarea class="codigo-pix" id="codigo-pix" readonly>' + esc(pix.qr_code_texto) + '</textarea>' +
      '<div class="botoes"><button type="button" class="botao cheio" id="btn-copiar">Copiar código Pix</button></div>' +
      '<ol class="passos">' +
        '<li><span>Copie o código acima</span></li>' +
        '<li><span>Abra o app do seu banco e entre em <strong>Pix</strong></span></li>' +
        '<li><span>Escolha <strong>Pix copia e cola</strong>, cole e confirme</span></li>' +
      '</ol>' +
      '<p class="aguardando" id="pix-status"><span class="ponto" aria-hidden="true"></span>Aguardando o pagamento… esta tela atualiza sozinha.</p>';
    $('#btn-copiar').addEventListener('click', copiarPix);
    iniciarConsultaStatus();
  }

  function copiarPix() {
    var txt = S.pix && S.pix.qr_code_texto; if (!txt) return;
    var btn = $('#btn-copiar');
    var ok = function () {
      btn.textContent = 'Código copiado! ✓';
      anunciar('Código Pix copiado.');
      setTimeout(function () { if (btn.isConnected) btn.textContent = 'Copiar código Pix'; }, 3000);
    };
    var fallback = function () {
      var ta = $('#codigo-pix'); ta.focus(); ta.select(); ta.setSelectionRange(0, txt.length);
      try { if (document.execCommand('copy')) return ok(); } catch (e) { /* segue */ }
      btn.textContent = 'Selecione o código e copie';
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, fallback);
    else fallback();
  }

  function iniciarConsultaStatus() {
    clearInterval(timers.status);
    timers.status = setInterval(consultarStatus, 5000);
  }
  var consultando = false;
  function consultarStatus() {
    if (consultando || S.encerrado) return;
    consultando = true;
    api('GET', 'checkout-status?p=' + tk()).then(function (r) {
      consultando = false;
      if (S.encerrado) return;
      if (r.status === 'pago') telaPago();
      else if (r.status === 'expirado') telaExpirado();
      else if (r.status === 'cancelado') telaCancelado();
    }, function () { consultando = false; /* falha momentânea: tenta de novo no próximo ciclo */ });
  }
  // Ao voltar do app do banco, confere na hora.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || S.encerrado || !S.pedido) return;
    atualizarRelogio();
    if (timers.status) consultarStatus();
  });

  /* ---------- Cartão (endpoints 4 e 5) ---------- */
  var BANDEIRAS = [
    { id: 'elo', nome: 'Elo', re: /^(4011(78|79)|43(1274|8935)|45(1416|7393|763[12])|50(4175|6699|67[0-7]\d|9000)|627780|63(6297|6368)|650(0[3-5]|4[0-9]|5[0-3]|9[2-7]|541|700|720|901)|651652|655000|655021)/, cvv: 3, max: 16 },
    { id: 'hipercard', nome: 'Hipercard', re: /^(606282|3841)/, cvv: 3, max: 19 },
    { id: 'amex', nome: 'Amex', re: /^3[47]/, cvv: 4, max: 15 },
    { id: 'diners', nome: 'Diners', re: /^3(0[0-5]|[68])/, cvv: 3, max: 14 },
    { id: 'mastercard', nome: 'Mastercard', re: /^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/, cvv: 3, max: 16 },
    { id: 'visa', nome: 'Visa', re: /^4/, cvv: 3, max: 19 }
  ];
  function bandeira(num) { for (var i = 0; i < BANDEIRAS.length; i++) if (BANDEIRAS[i].re.test(num)) return BANDEIRAS[i]; return null; }
  function luhn(num) {
    var soma = 0, dobra = false;
    for (var i = num.length - 1; i >= 0; i--) {
      var d = +num[i]; if (dobra) { d *= 2; if (d > 9) d -= 9; } soma += d; dobra = !dobra;
    }
    return soma % 10 === 0;
  }
  function mascaraCartao(num, b) {
    var grupos = b && b.id === 'amex' ? [4, 6, 5] : b && b.id === 'diners' ? [4, 6, 4] : [4, 4, 4, 4, 3];
    var out = [], i = 0;
    grupos.forEach(function (g) { if (i < num.length) { out.push(num.substr(i, g)); i += g; } });
    return out.join(' ');
  }
  function cpfValido(c) {
    if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return false;
    for (var t = 9; t < 11; t++) {
      var s = 0; for (var i = 0; i < t; i++) s += +c[i] * (t + 1 - i);
      if (((s * 10) % 11) % 10 !== +c[t]) return false;
    }
    return true;
  }

  function renderCartao(el) {
    var p = S.pedido;
    el.innerHTML = '<h2>Pagar com cartão de crédito</h2>' +
      '<form id="form-cartao" novalidate autocomplete="on">' +
        campo('cc-numero', 'Número do cartão', '<input id="cc-numero" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="23" aria-describedby="cc-numero-msg"><span class="bandeira" id="cc-bandeira" hidden></span>') +
        campo('cc-nome', 'Nome impresso no cartão', '<input id="cc-nome" autocomplete="cc-name" autocapitalize="characters" spellcheck="false" placeholder="COMO ESTÁ NO CARTÃO" maxlength="60" aria-describedby="cc-nome-msg">') +
        '<div class="linha2">' +
          campo('cc-validade', 'Validade', '<input id="cc-validade" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5" aria-describedby="cc-validade-msg">') +
          campo('cc-cvv', 'CVV', '<input id="cc-cvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4" aria-describedby="cc-cvv-msg">') +
        '</div>' +
        campo('cc-cpf', 'CPF do titular', '<input id="cc-cpf" inputmode="numeric" placeholder="000.000.000-00" maxlength="14" aria-describedby="cc-cpf-msg">') +
        campo('cc-parcelas', 'Parcelas', '<select id="cc-parcelas" aria-describedby="cc-parcelas-msg"></select>') +
        '<div class="botoes"><button type="submit" class="botao cheio" id="btn-pagar">Pagar ' + brl(p.valor_a_pagar) + '</button></div>' +
        '<div id="aviso-cartao"></div>' +
        '<p class="seguro">' + ICONE_CADEADO + 'Pagamento seguro processado pelo PagBank. Os dados do cartão são criptografados no seu aparelho.</p>' +
      '</form>';
    preencherParcelas();
    ligarCamposCartao();
    if (!CFG.MOCK) carregarSdkPagBank().catch(function () { /* tenta de novo no envio */ });
  }
  function campo(id, rotulo, controle) {
    return '<div class="campo" id="campo-' + id + '"><label for="' + id + '">' + rotulo + '</label>' +
      '<div class="entrada">' + controle + '</div><span class="msg" id="' + id + '-msg" aria-live="polite"></span></div>';
  }
  function erroCampo(id, msg) {
    var c = $('#campo-' + id); if (!c) return;
    c.classList.toggle('invalido', !!msg);
    $('#' + id + '-msg').textContent = msg || '';
    var inp = $('#' + id); if (inp) inp.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function focarPrimeiroCampo() { var i = $('#cc-numero'); if (i) i.focus(); }

  function preencherParcelas() {
    var sel = $('#cc-parcelas'); if (!sel) return;
    var p = S.pedido;
    var opcoes = (S.parcelas && S.parcelas.length ? S.parcelas : [{ parcelas: 1, valor_parcela: p.valor_a_pagar, total: p.valor_a_pagar }])
      .filter(function (o) { return o.parcelas >= 1 && o.parcelas <= MAX_PARCELAS; });
    if (!opcoes.length) opcoes = [{ parcelas: 1, valor_parcela: p.valor_a_pagar, total: p.valor_a_pagar }];
    var anterior = sel.value;
    sel.innerHTML = opcoes.map(function (o) {
      var semJuros = Math.abs(Number(o.total) - Number(p.valor_a_pagar)) < 0.005;
      var txt = o.parcelas + 'x de ' + brl(o.valor_parcela) + (o.parcelas === 1 ? '' : semJuros ? ' sem juros' : ' (total ' + brl(o.total) + ')');
      return '<option value="' + o.parcelas + '" data-total="' + Number(o.total) + '">' + txt + '</option>';
    }).join('');
    if (anterior && sel.querySelector('option[value="' + anterior + '"]')) sel.value = anterior;
    atualizarBotaoPagar();
  }
  function atualizarBotaoPagar() {
    var sel = $('#cc-parcelas'), btn = $('#btn-pagar'); if (!sel || !btn) return;
    var op = sel.options[sel.selectedIndex];
    var total = op ? Number(op.getAttribute('data-total')) : S.pedido.valor_a_pagar;
    if (!S.ocupado) btn.textContent = 'Pagar ' + brl(total || S.pedido.valor_a_pagar);
  }
  function buscarParcelas(bin) {
    if (bin === S.binAtual) return;
    S.binAtual = bin;
    var sel = $('#cc-parcelas');
    if (sel) sel.innerHTML = '<option>Calculando parcelas…</option>';
    api('POST', 'checkout-parcelas', { token: S.token, bin: bin }).then(function (r) {
      if (S.binAtual !== bin) return;
      S.parcelas = (r && r.opcoes) || null;
      preencherParcelas();
    }, function () {
      if (S.binAtual !== bin) return;
      S.parcelas = null; // falhou: só 1x do valor a pagar
      preencherParcelas();
    });
  }

  function ligarCamposCartao() {
    var num = $('#cc-numero'), nome = $('#cc-nome'), val = $('#cc-validade'), cvv = $('#cc-cvv'), cpf = $('#cc-cpf'), sel = $('#cc-parcelas');

    num.addEventListener('input', function () {
      var d = soDigitos(num.value).slice(0, 19);
      var b = bandeira(d);
      if (b) d = d.slice(0, b.max);
      num.value = mascaraCartao(d, b);
      var tag = $('#cc-bandeira'); tag.hidden = !b; tag.textContent = b ? b.nome : '';
      cvv.maxLength = b && b.cvv === 4 ? 4 : 3;
      erroCampo('cc-numero', '');
      clearTimeout(timers.parcelas);
      if (d.length >= 6) { var bin = d.slice(0, 6); timers.parcelas = setTimeout(function () { buscarParcelas(bin); }, 300); }
      else if (S.binAtual) { S.binAtual = ''; S.parcelas = null; preencherParcelas(); }
    });
    num.addEventListener('blur', function () { if (num.value) erroCampo('cc-numero', validarNumero()); });

    nome.addEventListener('input', function () {
      var pos = nome.selectionStart;
      nome.value = nome.value.toUpperCase().replace(/[^A-ZÀ-Ý' .-]/g, '');
      try { nome.setSelectionRange(pos, pos); } catch (e) { /* ok */ }
      erroCampo('cc-nome', '');
    });
    nome.addEventListener('blur', function () { if (nome.value) erroCampo('cc-nome', validarNome()); });

    val.addEventListener('input', function (ev) {
      var d = soDigitos(val.value).slice(0, 4);
      if (d.length === 1 && +d > 1) d = '0' + d;
      val.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : (d.length === 2 && ev.inputType !== 'deleteContentBackward' ? d + '/' : d);
      erroCampo('cc-validade', '');
    });
    val.addEventListener('blur', function () { if (val.value) erroCampo('cc-validade', validarValidade()); });

    cvv.addEventListener('input', function () { cvv.value = soDigitos(cvv.value).slice(0, cvv.maxLength); erroCampo('cc-cvv', ''); });
    cvv.addEventListener('blur', function () { if (cvv.value) erroCampo('cc-cvv', validarCvv()); });

    cpf.addEventListener('input', function () {
      var d = soDigitos(cpf.value).slice(0, 11);
      cpf.value = d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
      erroCampo('cc-cpf', '');
    });
    cpf.addEventListener('blur', function () { if (cpf.value) erroCampo('cc-cpf', validarCpf()); });

    sel.addEventListener('change', atualizarBotaoPagar);
    $('#form-cartao').addEventListener('submit', function (ev) { ev.preventDefault(); pagarCartao(); });
  }

  function validarNumero() {
    var d = soDigitos($('#cc-numero').value), b = bandeira(d);
    if (!d) return 'Informe o número do cartão.';
    if (d.length < 13 || (b && b.id === 'amex' && d.length !== 15) || !luhn(d)) return 'Número do cartão inválido. Confira os dígitos.';
    return '';
  }
  function validarNome() {
    var v = $('#cc-nome').value.trim();
    if (!v) return 'Informe o nome como está impresso no cartão.';
    if (v.split(/\s+/).length < 2) return 'Informe nome e sobrenome, como no cartão.';
    return '';
  }
  function validarValidade() {
    var m = /^(\d{2})\/(\d{2})$/.exec($('#cc-validade').value);
    if (!m) return 'Informe a validade no formato MM/AA.';
    var mes = +m[1], ano = 2000 + +m[2];
    if (mes < 1 || mes > 12) return 'Mês de validade inválido.';
    var hoje = new Date(agoraServidor());
    if (ano < hoje.getFullYear() || (ano === hoje.getFullYear() && mes < hoje.getMonth() + 1)) return 'Este cartão está vencido.';
    if (ano > hoje.getFullYear() + 20) return 'Ano de validade inválido.';
    return '';
  }
  function validarCvv() {
    var v = $('#cc-cvv').value, b = bandeira(soDigitos($('#cc-numero').value));
    var n = b ? b.cvv : 3;
    if (!v) return 'Informe o código de segurança (verso do cartão).';
    if (v.length !== n) return 'O código de segurança tem ' + n + ' dígitos.';
    return '';
  }
  function validarCpf() {
    var d = soDigitos($('#cc-cpf').value);
    if (!d) return 'Informe o CPF do titular do cartão.';
    if (!cpfValido(d)) return 'CPF inválido. Confira os números.';
    return '';
  }

  function limparCartao() {
    ['cc-numero', 'cc-nome', 'cc-validade', 'cc-cvv', 'cc-cpf'].forEach(function (id) { var i = $('#' + id); if (i) i.value = ''; });
    var tag = $('#cc-bandeira'); if (tag) tag.hidden = true;
  }

  function pagarCartao() {
    if (S.ocupado || S.encerrado) return;
    var checagens = [['cc-numero', validarNumero], ['cc-nome', validarNome], ['cc-validade', validarValidade], ['cc-cvv', validarCvv], ['cc-cpf', validarCpf]];
    var primeiro = null;
    checagens.forEach(function (c) { var m = c[1](); erroCampo(c[0], m); if (m && !primeiro) primeiro = c[0]; });
    if (primeiro) { $('#' + primeiro).focus(); anunciar('Confira os campos destacados.'); return; }

    var numero = soDigitos($('#cc-numero').value);
    var venc = $('#cc-validade').value.split('/');
    var nome = $('#cc-nome').value.trim().replace(/\s+/g, ' ');
    var cpf = soDigitos($('#cc-cpf').value);
    var parcelas = parseInt($('#cc-parcelas').value, 10) || 1;
    var bin = numero.slice(0, 6); // 6 primeiros dígitos: o servidor confere os juros do parcelamento
    var btn = $('#btn-pagar');
    btn.disabled = true; btn.textContent = 'Processando…';
    $('#aviso-cartao').innerHTML = '';
    travar('Processando pagamento…');

    criptografarCartao({ holder: nome, number: numero, expMonth: venc[0], expYear: '20' + venc[1], securityCode: $('#cc-cvv').value })
      .then(function (cripto) {
        numero = null; // não guarda o número em memória além do necessário
        limparCartao();
        return api('POST', 'checkout-cartao', { token: S.token, cartao_criptografado: cripto, bin: bin, titular_nome: nome, titular_cpf: cpf, parcelas: parcelas });
      }, function (erroCripto) {
        destravar(); btn.disabled = false; atualizarBotaoPagar();
        if (erroCripto && erroCripto.campo) { erroCampo(erroCripto.campo, erroCripto.mensagem); $('#' + erroCripto.campo).focus(); }
        else mostrarAviso($('#aviso-cartao'), (erroCripto && erroCripto.mensagem) || 'Não foi possível validar o cartão.');
        throw { tratado: true };
      })
      .then(function (r) {
        destravar();
        if (r.status === 'pago') return telaPago();
        if (r.status === 'em_analise') { S.analiseMsg = r.mensagem; S.painel = 'analise'; renderPainel(); anunciar('Pagamento em análise.'); return; }
        S.recusaMsg = r.mensagem || 'O pagamento não foi aprovado. Tente outro cartão ou pague com Pix.';
        S.painel = 'recusado'; renderPainel(); anunciar('Pagamento não aprovado. ' + S.recusaMsg);
        var b = $('#btn-outro'); if (b) b.focus();
      })
      .catch(function (e) {
        if (e && e.tratado) return;
        limparCartao();
        if (e && e.erro === 'link_expirado') return telaExpirado();
        if (e && e.rede) {
          // A cobrança pode ter passado mesmo sem resposta: confere antes de deixar tentar de novo.
          return api('GET', 'checkout-status?p=' + tk()).then(function (st) {
            destravar();
            if (st.status === 'pago') return telaPago();
            if (st.status === 'expirado') return telaExpirado();
            reabrirCartao('Não conseguimos conectar. Confira sua internet e tente de novo.');
          }, function () {
            destravar();
            reabrirCartao('Não conseguimos conectar. Antes de tentar de novo, confira sua internet. Se o valor aparecer no seu cartão, fale com a gente.');
          });
        }
        destravar();
        if (e && e.erro === 'pagamento_ja_iniciado') { reabrirCartao(e.mensagem || 'Já existe um pagamento em andamento para este pedido.'); return consultarStatus(); }
        reabrirCartao((e && e.mensagem) || 'Não foi possível concluir o pagamento. Tente de novo.');
      });
  }
  function reabrirCartao(msg) {
    S.painel = 'cartao'; renderPainel();
    mostrarAviso($('#aviso-cartao'), msg);
    anunciar(msg);
  }

  /* ------------------------------------------------------------------
   * Início
   * ------------------------------------------------------------------ */
  function iniciar() {
    renderRodape();
    if (!CFG.N8N_BASE && !CFG.MOCK) { telaInvalido(); return; }
    if (CFG.MOCK && !window.DutraMock) {
      carregarScript('/checkout/mock.js').then(carregar, function () { telaErroRede(iniciar); });
    } else {
      carregar();
    }
  }
  iniciar();
})();
