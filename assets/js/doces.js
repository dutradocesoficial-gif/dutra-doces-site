/*
 * Dutra Doces · cardápio
 * Textos iguais aos do cardápio impresso (folder A4 v2).
 * Para trocar uma foto: salve /assets/img/doces/<img>.webp (fundo transparente, quadrada).
 * linha: trufas | bombons | gourmet | tradicionais
 * festa: finos | gourmet | tradicionais (define o preço do cento)
 */
window.DUTRA_LINHAS = [
  { id: 'trufas', nome: 'Trufas', festa: 'finos',
    sub: 'Ganache de chocolate nobre, casca fina, recheio que derrete' },
  { id: 'bombons', nome: 'Bombons', festa: 'finos',
    sub: 'Fruta ou castanha inteira, creme e chocolate' },
  { id: 'gourmet', nome: 'Gourmet', festa: 'gourmet',
    sub: 'Brigadeiros cremosos com um toque especial' },
  { id: 'tradicionais', nome: 'Tradicionais', festa: 'tradicionais',
    sub: 'Os docinhos de festa que todo mundo ama' }
];

window.DUTRA_DOCES = [
  // ---------- Trufas ----------
  { linha: 'trufas', nome: 'Roche', desc: 'Ganache meio amargo envolta em uma camada crocante.',
    variantes: [{ rotulo: 'Preta', img: 'roche' }, { rotulo: 'Branca', img: 'roche-branco' }] },
  { linha: 'trufas', nome: 'Maracujá', img: 'trufa-de-maracuja', desc: 'Ganache de maracujá de verdade: azedinho e perfumado.' },
  { linha: 'trufas', nome: 'Passionata', img: 'passionata', desc: 'Meio maracujá, meio ganache meio amargo. A combinação perfeita.' },
  { linha: 'trufas', nome: 'Laka', img: 'laka', desc: 'Ganache de chocolate branco nobre que derrete na boca.' },
  { linha: 'trufas', nome: 'Café', img: 'cafe', desc: 'Ganache de chocolate nobre com sabor de café marcante.' },
  { linha: 'trufas', nome: 'Amarula', img: 'amarula', desc: 'Ganache de chocolate nobre com toque de Amarula, em casca branca.' },
  { linha: 'trufas', nome: 'Rum', img: 'rum', desc: 'Ganache de chocolate nobre aquecida por um toque de rum, em casca branca.' },
  { linha: 'trufas', nome: 'Floresta Negra', img: 'floresta-negra', desc: 'Ganache meio amargo com cereja dentro. A sobremesa clássica numa trufa.' },
  { linha: 'trufas', nome: 'Pimenta', img: 'pimenta', desc: 'Ganache meio amargo com o calor da pimenta no final. Para os fortes.' },
  { linha: 'trufas', nome: 'Menta', img: 'menta', desc: 'Chocolate nobre cremoso com o frescor da menta, do início ao fim.' },

  // ---------- Bombons ----------
  { linha: 'bombons', nome: 'Morango', img: 'bombom-de-morango', desc: 'O clássico: morango fresco inteiro envolto por creme branco e casca de chocolate.' },
  { linha: 'bombons', nome: 'Morango Invertido', img: 'morango-invertido', desc: 'Morango fresco envolto em brigadeiro 50% cacau, com casca de chocolate branco.' },
  { linha: 'bombons', nome: 'Uva', img: 'bombom-de-uva', desc: 'Uva verde suculenta envolta por creme branco e casca de chocolate.' },
  { linha: 'bombons', nome: 'Cereja', img: 'bombom-de-cereja', desc: 'Cereja em calda abraçada por brigadeiro branco e casca de chocolate branco.' },
  { linha: 'bombons', nome: 'Damasco', img: 'bombom-de-damasco', desc: 'Damasco inteiro envolto por brigadeiro branco e casca de chocolate.' },
  { linha: 'bombons', nome: 'Castanha', img: 'bombom-de-castanha', desc: 'Castanha-do-pará no creme branco, coberta de chocolate.' },
  { linha: 'bombons', nome: 'Prestígio', img: 'prestigio-bombom', desc: 'Massa cremosa de coco sob uma camada generosa de chocolate.' },
  { linha: 'bombons', nome: 'Cacau 50%', desc: 'Brigadeiro com o dobro de cacau, intenso e cremoso, envolto em chocolate.',
    variantes: [{ rotulo: 'Preta', img: 'cacau-50-preto' }, { rotulo: 'Branca', img: 'cacau-50-branco' }] },
  { linha: 'bombons', nome: 'Nozes · Camafeu', desc: 'Massa cremosa de brigadeiro branco com nozes-pecã, coroada com uma noz inteira.',
    variantes: [{ rotulo: 'Nozes', img: 'nozes' }, { rotulo: 'Camafeu', img: 'camafeu' }] },

  // ---------- Gourmet ----------
  { linha: 'gourmet', nome: 'Brigadeiro com Morango', img: 'brigadeiro-com-morango', desc: 'Morango inteiro fresco envolvido por chocolate 50% e granulado.' },
  { linha: 'gourmet', nome: 'Beijinho com Morango', img: 'beijinho-com-morango', desc: 'Morango inteiro fresco envolvido por brigadeiro branco e coco ralado.' },
  { linha: 'gourmet', nome: 'Torta de Limão', img: 'torta-de-limao', desc: 'Brigadeiro branco de limão, com raspas e uma delicada camada de açúcar.' },
  { linha: 'gourmet', nome: 'Churros', img: 'churros', desc: 'Brigadeiro de doce de leite com canela.' },
  { linha: 'gourmet', nome: 'Paçoca', img: 'pacoca', desc: 'Brigadeiro cremoso de paçoca, envolto em farofa de amendoim.' },
  { linha: 'gourmet', nome: 'Chocoball', img: 'chocoball', desc: 'Brigadeiro 50% cacau coberto de bolinhas crocantes de chocolate.' },
  { linha: 'gourmet', nome: 'Confetes', img: 'confetes', desc: 'Brigadeiro 50% cacau coberto de confetes coloridos.' },
  { linha: 'gourmet', nome: 'Oreo', img: 'oreo', desc: 'Brigadeiro branco cremoso envolto em farelo de biscoito de chocolate.' },
  { linha: 'gourmet', nome: 'Ninho com Nutella', img: 'leite-ninho-com-nutella', desc: 'Brigadeiro de leite Ninho com creme de Nutella.' },
  { linha: 'gourmet', nome: 'Charge', img: 'charge', desc: 'Brigadeiro 50% cacau enrolado em amendoim torrado picadinho.' },
  { linha: 'gourmet', nome: 'Olho de Sogra · Sogro', desc: 'Beijinho de coco coroado com ameixa macia ou damasco dourado.',
    variantes: [{ rotulo: 'Sogra', img: 'olho-de-sogra' }, { rotulo: 'Sogro', img: 'olho-de-sogro' }] },

  // ---------- Tradicionais ----------
  { linha: 'tradicionais', nome: 'Brigadeiro', img: 'brigadeiro', desc: 'Cremoso e caseiro, feito com cacau 50% e coberto de granulado.' },
  { linha: 'tradicionais', nome: 'Beijinho', img: 'beijinho', desc: 'Leve e cremoso, envolto em coco ralado fresco.' },
  { linha: 'tradicionais', nome: 'Casadinho', img: 'casadinho', desc: 'Meio brigadeiro, meio beijinho: o casamento mais doce.' },
  { linha: 'tradicionais', nome: 'Bicho de Pé', img: 'bicho-de-pe', desc: 'Brigadeiro rosa de morango com sabor de infância.' },
  { linha: 'tradicionais', nome: 'Sensação', img: 'sensacao', desc: 'Bicho de pé e brigadeiro juntos, passados no açúcar.' },
  { linha: 'tradicionais', nome: 'Coco Queimado', img: 'coco-queimado', desc: 'Brigadeiro branco com coco queimado, cremoso e crocante.' },
  { linha: 'tradicionais', nome: 'Brigadeiro de Prestígio', img: 'brigadeiro-de-prestigio', desc: 'Brigadeiro tradicional finalizado no coco ralado.' },
  { linha: 'tradicionais', nome: 'Baianinho', img: 'baianinho', desc: 'Brigadeiro branco cremoso com amendoins inteiros torrados.' },
  { linha: 'tradicionais', nome: 'Cajuzinho', img: 'cajuzinho', desc: 'O clássico de amendoim com chocolate.' }
  // "Sem lactose" ficou de fora de propósito: a cozinha é compartilhada (ver LEIA-ME do design).
];
