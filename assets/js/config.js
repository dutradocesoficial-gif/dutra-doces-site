/*
 * Dutra Doces · site — configuração
 * Único lugar com contatos, preços e banners. Este arquivo é público:
 * nunca coloque senha, token ou chave secreta aqui.
 */
window.DUTRA_SITE = {
  WHATSAPP: '5548991013331',          // atendimento principal (botões e chat)
  WHATSAPP_2: '5548991012792',
  INSTAGRAM: 'dutradocesoficial',
  CNPJ: '62.741.391/0001-52',

  // Endereço que recebe os cadastros (revenda e atendimento) em JSON, via POST.
  // Ex.: 'https://SEU-N8N/webhook/site-lead'. Vazio = o lead segue só pelo WhatsApp.
  LEAD_WEBHOOK: '',

  // Festas: preço do cento por linha. O site mostra o valor por unidade.
  PRECOS_FESTA: { tradicionais: 190, gourmet: 270, finos: 290 },
  MULTIPLO_FESTA: 10,                 // cada sabor é pedido de 10 em 10

  // Revenda: doce grande, preço final sugerido ao consumidor
  REVENDA: { precoMin: 12, precoMax: 20, lucroMax: 0.5 },

  // Banners do topo da página inicial (passam sozinhos). Para incluir um novo,
  // copie um bloco, troque as imagens (2560 e 1280 px de largura, 21:9) e os textos.
  BANNERS: [
    {
      id: 'natal',
      img: '/assets/img/banners/natal-2560.webp',
      imgMobile: '/assets/img/banners/natal-1280.webp',
      alt: 'Caixa Dutra Doces aberta, base branca cheia de doces sortidos e tampa chocolate com a logo dourada, em mesa de Natal',
      selo: 'Edição de Natal',
      titulo: 'Mixtão de <em>Natal</em>',
      texto: 'A caixa com os sabores mais pedidos do ano, pronta para presentear ou pôr na mesa da ceia.',
      cta: { rotulo: 'Quero o Mixtão', href: '#whats:Olá! Quero saber do Mixtão de Natal.' },
      cta2: { rotulo: 'Ver os sabores', href: '/cardapio' }
    },
    {
      id: 'festas',
      img: '/assets/img/banners/festas-2560.webp',
      imgMobile: '/assets/img/banners/festas-1280.webp',
      alt: 'Mesa de festa com bandeja dourada de doces sortidos em forminhas chocolate, rosas brancas e velas',
      selo: 'Festas e casamentos',
      titulo: 'A mesa que seus convidados <em>vão lembrar</em>',
      texto: 'Docinhos a partir de R$ 1,90 a unidade. A gente calcula a quantidade certa pra sua festa.',
      cta: { rotulo: 'Montar minha festa', href: '#chat' },
      cta2: { rotulo: 'Ver preços', href: '/festas' }
    },
    {
      id: 'revenda',
      img: '/assets/img/banners/revenda-2560.webp',
      imgMobile: '/assets/img/banners/revenda-1280.webp',
      alt: 'Mão colocando um bombom de morango na caixa de revendedor Dutra Doces no balcão de um café',
      selo: 'Seja revendedor',
      titulo: 'Até <em>50% de lucro</em> em cada doce',
      texto: 'Doces finos feitos à mão desde 2001, na caixa de revendedor pronta para o balcão.',
      cta: { rotulo: 'Quero revender', href: '/revenda' },
      cta2: null
    }
  ]
};
