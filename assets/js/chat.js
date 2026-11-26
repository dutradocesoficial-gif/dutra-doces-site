/*
 * Dutra Doces · atendimento conversacional
 * Roteiro fixo (sem IA): pega nome e WhatsApp logo no começo, descobre se é cliente final
 * ou profissional de eventos, qualifica e sugere a quantidade de doces.
 * O lead vai para DUTRA_SITE.LEAD_WEBHOOK (se houver) e o resumo pode seguir pelo WhatsApp.
 */
(function () {
  'use strict';
  var DD = window.DD, CFG = window.DUTRA_SITE || {};
  if (!DD) return;
  var $ = DD.$, $$ = DD.$$;
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var embutidoEl = $('[data-chat-embutido]');
  var MASCOTE = '/assets/img/marca/dutra-mascote.webp';

  // ---------- estrutura ----------
  var chat = document.createElement('section');
  chat.className = 'chat' + (embutidoEl ? ' embutido' : '');
  chat.setAttribute('aria-label', 'Atendimento Dutra Doces');
  if (!embutidoEl) { chat.setAttribute('role', 'dialog'); chat.setAttribute('aria-modal', 'false'); }
  chat.innerHTML =
    '<div class="chat-topo"><img src="' + MASCOTE + '" alt="" width="44" height="44">' +
      '<div><b>Assistente Dutra</b><small>online agora</small></div>' +
      (embutidoEl ? '' : '<button class="fechar" type="button" aria-label="Fechar atendimento">' + DD.ICON.x + '</button>') +
    '</div>' +
    '<div class="chat-msgs" aria-live="polite"></div>' +
    '<div class="chat-opcoes"></div>' +
    '<form class="chat-entrada" autocomplete="on"><label class="sr-only" for="chat-campo">Sua resposta</label>' +
      '<input id="chat-campo" name="resposta" placeholder="Escreva aqui…" autocomplete="off" disabled>' +
      '<button type="submit" aria-label="Enviar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg></button></form>' +
    '<p class="chat-lgpd">Usamos seus dados só para responder seu pedido. <a href="/privacidade" target="_blank">Privacidade</a></p>';
  if (embutidoEl) embutidoEl.appendChild(chat); else document.body.appendChild(chat);

  var msgs = $('.chat-msgs', chat), opcoes = $('.chat-opcoes', chat), form = $('.chat-entrada', chat), campo = $('#chat-campo', chat);

  if (!embutidoEl) {
    var lanc = document.createElement('button');
    lanc.className = 'lancador'; lanc.type = 'button';
    lanc.innerHTML = '<i class="pulso" aria-hidden="true"></i><img src="' + MASCOTE + '" alt="" width="46" height="46"><span>Vamos montar sua festa?</span>';
    lanc.setAttribute('aria-label', 'Abrir atendimento');
    document.body.appendChild(lanc);
    lanc.addEventListener('click', abrir);
    $('.fechar', chat).addEventListener('click', fechar);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.documentElement.classList.contains('chat-aberto')) fechar(); });
  }

  var iniciado = false;
  function abrir() {
    if (embutidoEl) { chat.scrollIntoView({ behavior: 'smooth', block: 'center' }); campo.focus(); return; }
    document.documentElement.classList.add('chat-aberto');
    if (!iniciado) { iniciado = true; iniciar(); }
    setTimeout(function () { if (!campo.disabled) campo.focus(); }, 400);
  }
  function fechar() {
    document.documentElement.classList.remove('chat-aberto');
    var l = $('.lancador'); if (l) l.focus();
  }
  DD.abrirChat = abrir;

  // ---------- mensagens ----------
  function rolar() { msgs.scrollTop = msgs.scrollHeight; }
  function bolha(html, quem) {
    var m = document.createElement('div');
    m.className = 'msg ' + (quem || 'bot');
    m.innerHTML = html;
    msgs.appendChild(m); rolar();
    return m;
  }
  function digitar(ms) {
    return new Promise(function (ok) {
      var d = document.createElement('div');
      d.className = 'digitando'; d.innerHTML = '<i></i><i></i><i></i>'; d.setAttribute('aria-label', 'digitando');
      msgs.appendChild(d); rolar();
      setTimeout(function () { d.remove(); ok(); }, calmo ? 150 : ms);
    });
  }
  // fala várias mensagens em sequência
  function diz(lista) {
    return lista.reduce(function (p, t) {
      return p.then(function () { return digitar(Math.min(1400, 380 + t.replace(/<[^>]+>/g, '').length * 12)); }).then(function () { bolha(t); });
    }, Promise.resolve());
  }

  // ---------- entrada do usuário ----------
  var esperando = null; // { tipo, validar, ao }
  function pedeTexto(cfg) {
    opcoes.innerHTML = '';
    form.hidden = false;
    campo.disabled = false;
    campo.value = '';
    campo.type = cfg.tipo === 'date' ? 'date' : cfg.tipo === 'number' ? 'number' : cfg.tipo === 'email' ? 'email' : cfg.tipo === 'tel' ? 'tel' : 'text';
    campo.inputMode = cfg.tipo === 'tel' ? 'tel' : cfg.tipo === 'number' ? 'numeric' : cfg.tipo === 'email' ? 'email' : 'text';
    campo.placeholder = cfg.placeholder || 'Escreva aqui…';
    campo.setAttribute('autocomplete', cfg.autocomplete || 'off');
    if (cfg.tipo === 'date') { var hoje = new Date(); campo.min = hoje.toISOString().slice(0, 10); } else campo.removeAttribute('min');
    if (cfg.atalhos) mostraOpcoes(cfg.atalhos, function (o) { responde(o.rotulo, o.v); }, true);
    esperando = cfg;
    if ((document.activeElement && chat.contains(document.activeElement)) || embutidoEl) setTimeout(function () { campo.focus({ preventScroll: true }); }, 60);
  }
  function pedeOpcao(lista, ao) {
    form.hidden = true;
    esperando = null;
    mostraOpcoes(lista, function (o) {
      opcoes.innerHTML = '';
      bolha(DD.esc(o.rotulo), 'eu');
      ao(o);
    });
  }
  function mostraOpcoes(lista, ao, manterCampo) {
    opcoes.innerHTML = '';
    lista.forEach(function (o, k) {
      var b = document.createElement(o.href ? 'a' : 'button');
      b.className = 'chip';
      b.textContent = o.rotulo;
      b.style.animationDelay = (k * 0.06) + 's';
      if (o.href) { b.href = o.href; if (/^https?:/.test(o.href)) { b.target = '_blank'; b.rel = 'noopener'; } }
      else { b.type = 'button'; b.addEventListener('click', function () { ao(o); }); }
      opcoes.appendChild(b);
    });
    if (!manterCampo) form.hidden = true;
    setTimeout(rolar, 50);
    var p = $('button, a', opcoes); if (p && !manterCampo && (chat.contains(document.activeElement) || embutidoEl)) p.focus({ preventScroll: true });
  }
  function responde(texto, valor) {
    if (!esperando) return;
    var cfg = esperando;
    var bruto = valor != null ? valor : texto;
    var erro = cfg.validar ? cfg.validar(bruto) : '';
    if (erro) { diz([erro]); return; }
    esperando = null;
    campo.disabled = true; opcoes.innerHTML = '';
    var mostrar = cfg.mostrar ? cfg.mostrar(bruto) : texto;
    bolha(DD.esc(mostrar), 'eu');
    campo.value = '';
    cfg.ao(bruto);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = campo.value.trim();
    if (!v || !esperando) return;
    responde(v);
  });
  campo.addEventListener('input', function () { if (esperando && esperando.tipo === 'tel') campo.value = DD.mascaraFone(campo.value); });

  // ---------- roteiro ----------
  var L = {}; // lead
  var idConversa = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function primeiro(n) { return String(n).trim().split(/\s+/)[0].replace(/^./, function (c) { return c.toUpperCase(); }); }
  function fmtData(iso) { var p = String(iso).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso; }

  function iniciar() {
    L = { id: idConversa };
    diz([
      'Olá! Eu sou o assistente da <b>Dutra Doces</b>.',
      'Desde 2001 a gente adoça aniversários, casamentos, 15 anos, batizados, formaturas e eventos de empresa.',
      'Vamos montar a sua festa? Antes de tudo, como posso te chamar?'
    ]).then(function () {
      pedeTexto({ placeholder: 'Seu nome', autocomplete: 'name',
        validar: function (v) { return String(v).trim().length < 2 ? 'Pode me dizer seu nome?' : ''; },
        ao: function (v) { L.nome = String(v).trim(); passoFone(); } });
    });
  }

  function passoFone() {
    diz(['Prazer, <b>' + DD.esc(primeiro(L.nome)) + '</b>! Qual é o seu WhatsApp com DDD? Assim nosso time consegue falar com você depois.']).then(function () {
      pedeTexto({ tipo: 'tel', placeholder: '(48) 99999-9999', autocomplete: 'tel-national',
        validar: function (v) { return DD.foneValido(v) ? '' : 'Hmm, esse número não fechou. Pode mandar com DDD? Ex.: (48) 99101-3331'; },
        mostrar: function (v) { return DD.mascaraFone(v); },
        ao: function (v) {
          L.whatsapp = DD.mascaraFone(v);
          DD.enviarLead('atendimento_inicio', { id: L.id, nome: L.nome, whatsapp: L.whatsapp });
          passoPerfil();
        } });
    });
  }

  function passoPerfil() {
    diz(['Anotado.', 'Me tira uma dúvida: você está organizando uma festa ou fala por uma empresa de eventos?']).then(function () {
      pedeOpcao([
        { rotulo: 'Estou organizando minha festa', v: 'cliente' },
        { rotulo: 'Sou cerimonialista ou assessor(a)', v: 'cerimonialista' },
        { rotulo: 'Falo por uma casa de festas ou buffet', v: 'casa_de_festas' },
        { rotulo: 'Quero revender doces', v: 'revenda' },
        { rotulo: 'Outro assunto', v: 'outro' }
      ], function (o) {
        L.perfil = o.v;
        if (o.v === 'cliente') return passoTipoFesta();
        if (o.v === 'revenda') return fluxoRevenda();
        if (o.v === 'outro') return fluxoOutro();
        fluxoProfissional();
      });
    });
  }

  // ----- profissionais de eventos -----
  function fluxoProfissional() {
    var cer = L.perfil === 'cerimonialista';
    diz([cer ? 'Que bom! Cerimonialistas fazem parte da nossa história. Qual é o nome da sua assessoria?' : 'Que bom! Trabalhamos com muitas casas de festa. Qual é o nome do espaço?']).then(function () {
      pedeTexto({ placeholder: cer ? 'Nome da assessoria' : 'Nome da casa de festas', autocomplete: 'organization',
        validar: function (v) { return String(v).trim().length < 2 ? 'Me conta o nome, por favor.' : ''; },
        ao: function (v) {
          L.empresa = String(v).trim();
          diz(['Em qual cidade vocês atendem?']).then(function () {
            pedeTexto({ placeholder: 'Cidade', autocomplete: 'address-level2',
              validar: function (v) { return String(v).trim().length < 2 ? 'Qual cidade?' : ''; },
              ao: function (v) {
                L.cidade = String(v).trim();
                diz(['E quantos eventos com doces vocês fazem por mês, em média?']).then(function () {
                  pedeOpcao([{ rotulo: '1 a 2' }, { rotulo: '3 a 5' }, { rotulo: '6 a 10' }, { rotulo: 'Mais de 10' }], function (o) {
                    L.eventos_mes = o.rotulo;
                    passoEmail(fimProfissional);
                  });
                });
              } });
          });
        } });
    });
  }
  function fimProfissional() {
    enviarFinal();
    diz([
      'Perfeito, ' + DD.esc(primeiro(L.nome)) + '! Já passei tudo para o nosso time.',
      '<b>Alguém da Dutra vai te chamar no WhatsApp</b> para apresentar as condições para parceiros e o cardápio completo.',
      'Se quiser adiantar, é só tocar abaixo.'
    ]).then(function () {
      mostraOpcoes([
        { rotulo: 'Falar agora no WhatsApp', href: DD.whats(resumoTexto()) },
        { rotulo: 'Ver o cardápio', href: '/cardapio' },
        { rotulo: 'Recomeçar', v: 'r' }
      ], recomecar);
    });
  }

  // ----- revenda -----
  function fluxoRevenda() {
    enviarFinal();
    diz([
      'Que ótimo! Na revenda você trabalha com os nossos doces grandes, vendidos de R$ 12 a R$ 20 ao consumidor, e pode ter <b>até 50% de lucro</b> em cada um.',
      'Na página de revenda tem o simulador de ganhos e um cadastro rapidinho. Alguém do nosso time também vai te chamar no WhatsApp.'
    ]).then(function () {
      mostraOpcoes([{ rotulo: 'Ir para a revenda', href: '/revenda#cadastro' }, { rotulo: 'Falar no WhatsApp', href: DD.whats(resumoTexto()) }], function () {});
    });
  }

  // ----- outro assunto -----
  function fluxoOutro() {
    diz(['Claro! Me conta em poucas palavras como podemos ajudar.']).then(function () {
      pedeTexto({ placeholder: 'Sua mensagem',
        validar: function (v) { return String(v).trim().length < 3 ? 'Pode contar um pouco mais?' : ''; },
        ao: function (v) {
          L.mensagem = String(v).trim();
          enviarFinal();
          diz(['Obrigado, ' + DD.esc(primeiro(L.nome)) + '! <b>Alguém do nosso time vai te chamar no WhatsApp</b> em breve.']).then(function () {
            mostraOpcoes([{ rotulo: 'Falar agora no WhatsApp', href: DD.whats(resumoTexto()) }, { rotulo: 'Recomeçar', v: 'r' }], recomecar);
          });
        } });
    });
  }

  // ----- cliente final: festa -----
  function passoTipoFesta() {
    diz(['Que delícia, vamos de festa. Que tipo de comemoração vai ser?']).then(function () {
      pedeOpcao([
        { rotulo: 'Aniversário' }, { rotulo: 'Casamento' }, { rotulo: '15 anos' }, { rotulo: 'Batizado ou chá' },
        { rotulo: 'Formatura' }, { rotulo: 'Evento de empresa' }, { rotulo: 'Outra' }
      ], function (o) { L.tipo_festa = o.rotulo; passoData(); });
    });
  }
  function passoData() {
    diz(['E qual a data da festa?']).then(function () {
      pedeTexto({ tipo: 'date', atalhos: [{ rotulo: 'Ainda não sei', v: 'a definir' }],
        validar: function (v) {
          if (v === 'a definir') return '';
          var d = new Date(v + 'T12:00:00'); if (isNaN(d)) return 'Escolha a data no calendário, por favor.';
          var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
          return d < hoje ? 'Essa data já passou. Qual é a data da festa?' : '';
        },
        mostrar: function (v) { return v === 'a definir' ? 'Ainda não sei' : fmtData(v); },
        ao: function (v) {
          L.data = v === 'a definir' ? 'a definir' : fmtData(v);
          var extra = [];
          if (v !== 'a definir') {
            var dias = Math.round((new Date(v + 'T12:00:00') - new Date()) / 864e5);
            if (dias <= 7) extra.push('Está bem pertinho! Vou marcar como prioridade pro nosso time.');
          }
          passoConvidados(extra);
        } });
    });
  }
  function passoConvidados(extra) {
    diz((extra || []).concat(['Quantas pessoas você espera, mais ou menos?'])).then(function () {
      pedeTexto({ tipo: 'number', placeholder: 'Nº de convidados',
        atalhos: [{ rotulo: '30', v: '30' }, { rotulo: '50', v: '50' }, { rotulo: '100', v: '100' }, { rotulo: '150', v: '150' }, { rotulo: '200+', v: '200' }],
        validar: function (v) { var n = parseInt(v, 10); return !n || n < 1 || n > 5000 ? 'Me passa um número aproximado de convidados.' : ''; },
        mostrar: function (v) { return parseInt(v, 10) + ' pessoas'; },
        ao: function (v) { L.convidados = parseInt(v, 10); passoDuracao(); } });
    });
  }
  function passoDuracao() {
    diz(['E quanto tempo a festa deve durar?']).then(function () {
      pedeOpcao([{ rotulo: 'Até 3 horas', v: 'curta' }, { rotulo: 'De 3 a 5 horas', v: 'media' }, { rotulo: 'Mais de 5 horas', v: 'longa' }], function (o) {
        L.duracao = o.v; L.duracao_txt = o.rotulo; passoMesa();
      });
    });
  }
  function passoMesa() {
    diz(['Vai ter mesa de doces montada, para decorar?']).then(function () {
      pedeOpcao([{ rotulo: 'Sim, vamos montar mesa', v: true }, { rotulo: 'Não, é só para servir', v: false }], function (o) {
        L.mesa = o.v; passoOutros();
      });
    });
  }
  function passoOutros() {
    diz(['Além dos docinhos, vai ter bolo ou outras sobremesas?']).then(function () {
      pedeOpcao([{ rotulo: 'Só os docinhos', v: 'nada' }, { rotulo: 'Vai ter bolo', v: 'bolo' }, { rotulo: 'Bolo e outras sobremesas', v: 'muito' }], function (o) {
        L.outros = o.v; L.outros_txt = o.rotulo; passoEmail(recomendacao);
      });
    });
  }
  function passoEmail(depois) {
    diz(['Quer deixar um e-mail também? Assim mandamos o orçamento por lá. (opcional)']).then(function () {
      pedeTexto({ tipo: 'email', placeholder: 'seu@email.com', autocomplete: 'email', atalhos: [{ rotulo: 'Pular', v: '-' }],
        validar: function (v) { return v === '-' || DD.emailValido(v) ? '' : 'Esse e-mail parece incompleto. Confere pra mim? Ou toque em "Pular".'; },
        mostrar: function (v) { return v === '-' ? 'Pular' : v; },
        ao: function (v) { if (v !== '-') L.email = String(v).trim(); depois(); } });
    });
  }

  function recomendacao() {
    var r = DD.calcularFesta({ convidados: L.convidados, duracao: L.duracao, mesa: L.mesa, outros: L.outros });
    L.sugestao = r;
    var P = CFG.PRECOS_FESTA;
    var expl = L.mesa
      ? 'Como vai ter mesa montada, recomendamos cerca de <b>25% de doces finos</b> (trufas e bombons), que dão o visual da mesa, e o restante em tradicionais e gourmet, que são os mais consumidos.'
      : 'Como é para servir, a maior parte vai em tradicionais e gourmet, os preferidos para consumo geral, com um toque de finos.';
    var resumo = '<div class="resumo">' +
      '<div><span>Finos (trufas e bombons)</span><b>' + r.finos + '</b></div>' +
      '<div><span>Gourmet</span><b>' + r.gourmet + '</b></div>' +
      '<div><span>Tradicionais</span><b>' + r.tradicionais + '</b></div>' +
      '<div><span>Investimento estimado</span><b>' + DD.brl(r.valor) + '</b></div></div>';
    diz([
      'Pronto, ' + DD.esc(primeiro(L.nome)) + '. Fiz as contas.',
      'Em média, as festas pedem de 6 a 8 doces por pessoa, conforme a duração e o que mais vai ter. Para a sua, sugerimos <b>' + r.porPessoa + ' por pessoa</b>: cerca de <b>' + r.total + ' doces</b>.',
      expl,
      'Sugestão para ' + L.convidados + ' convidados:' + resumo,
      'Valores de referência: tradicionais ' + DD.unidade(P.tradicionais) + ', gourmet ' + DD.unidade(P.gourmet) + ' e finos ' + DD.unidade(P.finos) + ' a unidade. Os sabores você escolhe depois, com calma.'
    ]).then(function () {
      enviarFinal();
      return diz(['<b>Alguém do nosso time vai te chamar no WhatsApp</b> para confirmar a data e montar a seleção de sabores com você.', 'Se preferir adiantar, mande o resumo agora:']);
    }).then(function () {
      mostraOpcoes([
        { rotulo: 'Enviar resumo no WhatsApp', href: DD.whats(resumoTexto()) },
        { rotulo: 'Ver os sabores', href: '/cardapio' },
        { rotulo: 'Recomeçar', v: 'r' }
      ], recomecar);
    });
  }

  function resumoTexto() {
    var t = ['Olá! Vim pelo atendimento do site.', 'Nome: ' + (L.nome || '')];
    if (L.perfil === 'cerimonialista' || L.perfil === 'casa_de_festas') {
      t.push((L.perfil === 'cerimonialista' ? 'Assessoria: ' : 'Casa de festas: ') + (L.empresa || ''), 'Cidade: ' + (L.cidade || ''), 'Eventos por mês: ' + (L.eventos_mes || ''));
    } else if (L.perfil === 'revenda') {
      t.push('Quero ser revendedor(a).');
    } else if (L.perfil === 'outro') {
      t.push('Assunto: ' + (L.mensagem || ''));
    } else if (L.sugestao) {
      var r = L.sugestao;
      t.push('Festa: ' + L.tipo_festa, 'Data: ' + L.data, 'Convidados: ' + L.convidados, 'Duração: ' + L.duracao_txt,
        'Mesa montada: ' + (L.mesa ? 'sim' : 'não'), 'Outras sobremesas: ' + L.outros_txt,
        'Sugestão: ' + r.total + ' doces (' + r.finos + ' finos, ' + r.gourmet + ' gourmet, ' + r.tradicionais + ' tradicionais), cerca de ' + DD.brl(r.valor) + '.');
    }
    return t.join('\n');
  }
  var finalEnviado = false;
  function enviarFinal() {
    if (finalEnviado) return; finalEnviado = true;
    var d = Object.assign({}, L);
    if (d.sugestao) { d.sugestao_total = d.sugestao.total; d.sugestao_finos = d.sugestao.finos; d.sugestao_gourmet = d.sugestao.gourmet; d.sugestao_tradicionais = d.sugestao.tradicionais; d.valor_estimado = d.sugestao.valor; delete d.sugestao; }
    d.resumo = resumoTexto();
    d.qualificado_como = d.perfil === 'cliente' ? 'cliente_final' : d.perfil;
    DD.enviarLead('atendimento', d);
  }
  function recomecar(o) {
    if (!o || o.v !== 'r') return;
    msgs.innerHTML = ''; opcoes.innerHTML = ''; finalEnviado = false;
    idConversa = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    iniciar();
  }

  if (embutidoEl) { iniciado = true; iniciar(); }
  if (location.hash === '#chat' && !embutidoEl) setTimeout(abrir, 600);
})();
