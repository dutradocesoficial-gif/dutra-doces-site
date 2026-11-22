/*
 * Dutra Doces · Checkout — MODO DE TESTE (MOCK)
 * Só é carregado quando DUTRA_CONFIG.MOCK = true. Simula os endpoints do n8n com dados falsos.
 * As contas abaixo existem SÓ para simular o servidor; a página em si não calcula preço.
 *
 * Links de teste:
 *   ?p=mock-cartao     aguardando pagamento, forma cartão (cartão aprovado)
 *   ?p=mock-recusado   cartão é recusado
 *   ?p=mock-pix        Pix vira "pago" 15 s depois de gerado
 *   ?p=mock-sinal      Pix 50/50, etiqueta "Sinal 50%"
 *   ?p=mock-saldo      saldo do 50/50 (só Pix integral)
 *   ?p=mock-analise    cartão fica "em análise" e aprova 15 s depois
 *   ?p=mock-expirando  reserva acaba em 40 s (para ver a expiração com a página aberta)
 *   ?p=mock-expirado   link expirado
 *   ?p=mock-invalido   link inválido
 *   ?p=mock-offline    simula falha de rede
 */
window.DutraMock = (function () {
  'use strict';
  var pedidos = {};
  var MIN = 60000;

  function iso(ms) {
    // ISO com fuso de Brasília (-03:00), como o n8n deve devolver
    var d = new Date(ms - 3 * 3600000);
    return d.toISOString().replace(/\.\d{3}Z$/, '-03:00');
  }
  function r2(v) { return Math.round(v * 100) / 100; }

  function novo(token) {
    var base = {
      numero: 1042, primeiro_nome: 'Ana',
      itens: [{ nome: 'Mistão Clássico 150', quantidade: 1 }],
      quantidade_total: 150, data_entrega: '23/12', modalidade: 'entrega',
      subtotal: 225.00, frete: 18.00, desconto: 0, valor_total: 243.00, valor_a_pagar: 243.00,
      parcela: 'integral', forma_pagamento: 'cartao', formas_permitidas: ['cartao', 'pix_integral', 'pix_50']
    };
    var reg = { status: 'aguardando_pagamento', expira: Date.now() + 58 * MIN, pedido: base, pixEm: null, pagoEm: null, cartao: 'pago' };
    switch (token) {
      case 'mock-cartao': break;
      case 'mock-recusado': reg.cartao = 'recusado'; break;
      case 'mock-analise': reg.cartao = 'em_analise'; break;
      case 'mock-pix': aplicarForma(base, 'pix_integral'); break;
      case 'mock-sinal':
        base.itens = [{ nome: 'Bombons finos sortidos', quantidade: 2 }, { nome: 'Brigadeiro gourmet', quantidade: 100 }];
        base.quantidade_total = 160; base.modalidade = 'retirada'; base.frete = 0; base.subtotal = 312.00; base.data_entrega = '24/12';
        aplicarForma(base, 'pix_50'); break;
      case 'mock-saldo':
        base.modalidade = 'retirada'; base.frete = 0; base.subtotal = 312.00; base.data_entrega = '24/12';
        aplicarForma(base, 'pix_50');
        base.parcela = 'saldo'; base.forma_pagamento = 'pix_integral'; base.formas_permitidas = ['pix_integral'];
        base.valor_a_pagar = r2(base.valor_total - r2(base.valor_total / 2)); break;
      case 'mock-expirando': reg.expira = Date.now() + 40000; break;
      case 'mock-expirado': reg.status = 'expirado'; reg.expira = Date.now() - MIN; break;
      default: return null;
    }
    return reg;
  }

  // Simula o servidor recalculando (5% de desconto no Pix, metade no 50/50)
  function aplicarForma(p, forma) {
    var pix = forma !== 'cartao';
    p.forma_pagamento = forma;
    p.desconto = pix ? r2(p.subtotal * 0.05) : 0;
    p.valor_total = r2(p.subtotal + p.frete - p.desconto);
    p.parcela = forma === 'pix_50' ? 'sinal' : 'integral';
    p.valor_a_pagar = forma === 'pix_50' ? r2(p.valor_total / 2) : p.valor_total;
  }

  function reg(token) {
    if (!(token in pedidos)) pedidos[token] = novo(token);
    var r = pedidos[token];
    if (r && r.status === 'aguardando_pagamento') {
      if (r.pagoEm && Date.now() >= r.pagoEm) r.status = 'pago';
      else if (Date.now() >= r.expira) r.status = 'expirado';
    }
    return r;
  }

  function qrFalso() {
    // Desenho de QR só para teste (não é um Pix válido)
    var n = 25, c = '', seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function finder(x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>'; }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var emFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!emFinder && rnd() > 0.52) c += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ' + (n + 2) + ' ' + (n + 2) + '" shape-rendering="crispEdges"><rect x="-1" y="-1" width="' + (n + 2) + '" height="' + (n + 2) + '" fill="#fff"/><g fill="#231f20">' + c + finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7) + '</g></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  function resposta(status, json) {
    return new Promise(function (ok, falha) {
      setTimeout(function () {
        if (status >= 400) falha({ status: status, erro: json.erro, mensagem: json.mensagem });
        else ok(JSON.parse(JSON.stringify(json)));
      }, 450 + Math.random() * 400);
    });
  }
  function erro(status, codigo, msg) { return resposta(status, { erro: codigo, mensagem: msg }); }

  function chamar(metodo, rota, corpo) {
    var partes = rota.split('?');
    var nome = partes[0];
    var token = corpo && corpo.token || new URLSearchParams(partes[1] || '').get('p') || '';
    if (token === 'mock-offline') {
      return new Promise(function (ok, falha) { setTimeout(function () { falha({ rede: true }); }, 700); });
    }
    var r = reg(token);
    if (!r) return erro(404, 'link_invalido', 'Não encontramos este pedido.');

    if (nome === 'checkout-dados') {
      return resposta(200, { status: r.status, agora: iso(Date.now()), expira_em: iso(r.expira), pedido: r.pedido });
    }
    if (nome === 'checkout-status') return resposta(200, { status: r.status });

    if (r.status === 'expirado') return erro(410, 'link_expirado', 'Sua reserva expirou.');

    if (nome === 'checkout-forma') {
      if (r.pixEm) return erro(409, 'pagamento_ja_iniciado', 'O Pix já foi gerado para este pedido. Para trocar a forma, fale com a gente.');
      if (r.pedido.formas_permitidas.indexOf(corpo.forma_pagamento) < 0) return erro(400, 'forma_invalida', 'Esta forma de pagamento não está disponível.');
      aplicarForma(r.pedido, corpo.forma_pagamento);
      return resposta(200, r.pedido);
    }
    if (nome === 'checkout-pix') {
      if (!r.pixEm) { r.pixEm = Date.now(); r.pagoEm = Date.now() + 15000; }
      return resposta(200, {
        qr_code_texto: '00020126580014br.gov.bcb.pix0136TESTE-DUTRA-DOCES-NAO-PAGUE52040000530398654' + r.pedido.valor_a_pagar.toFixed(2) + '5802BR5911DUTRA DOCES6008CAMBORIU62070503***6304ABCD',
        qr_code_imagem: qrFalso(),
        valor: r.pedido.valor_a_pagar,
        expira_em: iso(r.expira)
      });
    }
    if (nome === 'checkout-parcelas') {
      var v = r.pedido.valor_a_pagar, opcoes = [];
      for (var n = 1; n <= 10; n++) {
        var total = n <= 3 ? v : r2(v * Math.pow(1.0299, n) * 0.0299 / (Math.pow(1.0299, n) - 1) * n);
        opcoes.push({ parcelas: n, valor_parcela: r2(total / n), total: total });
      }
      return resposta(200, { opcoes: opcoes });
    }
    if (nome === 'checkout-cartao') {
      if (!corpo.cartao_criptografado) return erro(400, 'cartao_invalido', 'Dados do cartão inválidos.');
      if (r.cartao === 'recusado') return resposta(200, { status: 'recusado', mensagem: 'Pagamento não autorizado pelo banco emissor. Tente outro cartão ou pague com Pix.' });
      if (r.cartao === 'em_analise') { r.pagoEm = Date.now() + 15000; return resposta(200, { status: 'em_analise', mensagem: 'Seu pagamento está em análise pela operadora. Avisaremos assim que for aprovado.' }); }
      r.status = 'pago';
      return resposta(200, { status: 'pago', mensagem: 'Pagamento aprovado!' });
    }
    return erro(404, 'rota_desconhecida', 'Rota de teste desconhecida.');
  }

  return { chamar: chamar };
})();
