# Dutra Doces · site

Site estático (HTML, CSS e JavaScript puros, sem build), publicado pela Vercel a cada push na `main`.
Identidade visual 2026: Chocolate Ganache `#24120A`, Ouro Folha `#CC9A3C` (degradê `#F2D48C → #8A5F1F`),
Creme `#F5E6CC`, Vinho `#6B1F2A` (destaque, até 10%), Cacau `#4E2A17`, Caramelo `#EAD3AE`.
Fontes: Cormorant Garamond (títulos) e Manrope (textos), via Google Fonts.

## Páginas

| Caminho | Arquivo | O que tem |
|---|---|---|
| `/` | `index.html` | banners que passam sozinhos, doces flutuando, cardápio por abas, festas, presentes, revenda, história, dúvidas |
| `/cardapio` | `cardapio/index.html` | os 43 sabores com filtro, ficha de cada doce e troca de cobertura |
| `/festas` | `festas/index.html` | preços por unidade (e o cento), calculadora de doces, dicas de mesa, profissionais de eventos |
| `/revenda` | `revenda/index.html` | até 50% de lucro, simulador de ganhos, como funciona, **formulário de cadastro** |
| `/nossa-historia` | `nossa-historia/index.html` | história contada pelo Dutra, com capítulos que acendem ao rolar |
| `/atendimento` | `atendimento/index.html` | assistente conversacional em página cheia (o mesmo abre no botão flutuante de todas as páginas) |
| `/privacidade` | `privacidade/index.html` | política de privacidade (LGPD) — **preencher os trechos `[PREENCHER]`** |
| `/termos` | `termos/index.html` | termos de uso — **preencher os trechos `[PREENCHER]`** |
| `/checkout` | `checkout/` | página de pagamento (ver `checkout/README.md`) |

## Pastas

```
assets/
  css/site.css          estilos de todo o site
  js/config.js          ÚNICO lugar com WhatsApp, preços, banners e o endereço que recebe os leads
  js/doces.js           cardápio (textos iguais ao folder impresso)
  js/site.js            cabeçalho, rodapé, banners, cardápio, calculadora, simulador, animações
  js/chat.js            assistente de atendimento
  img/doces/            43 fotos dos doces, fundo transparente (webp 720 px)
  img/banners/          banners 21:9 em 2560 px (computador) e 1280 px (celular)
  img/marca/            logo SVG, mascote Dutra, onda vinho, favicon, caixa de presente e caixa de revendedor
  img/reais/            fotos reais das caixas de festa (pasta "04 Caixas de festa" do Drive)
```

Os banners foram gerados no Nano Banana 2.1 (Magnific) usando como referência as fotos reais do Drive
("04 Caixas de festa" e "01 Grandes 60g") e a arte final da tampa da caixa 35x35x6 v8.
O site segue as skills `sophos-site-copy`, `sophos-site-design` e `sophos-prompt-imagem` do repositório kit-skills.

O cabeçalho e o rodapé são montados pelo `site.js`; para mudar o menu, edite a lista `NAV` nesse arquivo.

## Tarefas comuns

**Trocar preços:** `assets/js/config.js` → `PRECOS_FESTA` (preço do cento) e `REVENDA`. Os textos fixos com preço
estão em `index.html` e `festas/index.html` (procure por `1,90`, `2,70`, `2,90`).

**Novo banner:** gere a imagem em 21:9 (com espaço livre à esquerda para o texto), salve
`assets/img/banners/NOME-2560.webp` e `NOME-1280.webp` e copie um bloco em `BANNERS` no `config.js`.
O `href` do botão aceita `/pagina`, `#chat` (abre o atendimento) ou `#whats:mensagem` (abre o WhatsApp com a mensagem).

**Novo sabor:** salve a foto quadrada com fundo transparente em `assets/img/doces/nome.webp` e acrescente uma linha
em `assets/js/doces.js`.

## Receber os leads (revenda e atendimento)

Sem configuração, o formulário de revenda e o atendimento terminam com um botão que abre o WhatsApp com o resumo pronto.
Para receber os dados automaticamente (n8n, planilha, CRM), crie um webhook que aceite `POST` com JSON e coloque o
endereço em `LEAD_WEBHOOK` no `config.js`. Libere o CORS do webhook para `https://dutradoces.com.br`.

O site envia:

- `tipo: "revenda"` — nome, whatsapp, email, cidade, canais, volume_semana, ja_revende, cnpj, mensagem, aceite_lgpd
- `tipo: "atendimento_inicio"` — id, nome, whatsapp (enviado logo que a pessoa informa o telefone)
- `tipo: "atendimento"` — id, nome, whatsapp, email, perfil (`cliente`, `cerimonialista`, `casa_de_festas`, `revenda`, `outro`),
  qualificado_como, tipo_festa, data, convidados, duracao, mesa, outros, empresa, cidade, eventos_mes,
  sugestao_total, sugestao_finos, sugestao_gourmet, sugestao_tradicionais, valor_estimado, resumo

Todos levam também `pagina` e `enviado_em`. O `id` liga o `atendimento_inicio` ao `atendimento` da mesma conversa.

## Regras do assistente

- Nome e WhatsApp logo no começo.
- Pergunta se é cliente final, cerimonialista, casa de festas, revenda ou outro assunto, e segue um roteiro para cada.
- Doces por pessoa: 6 (até 3 h), 7 (3 a 5 h) ou 8 (mais de 5 h); menos 1 se tiver bolo e outras sobremesas.
- Com mesa montada: 25% finos, 25% gourmet, 50% tradicionais. Sem mesa: 10% / 30% / 60%. Tudo em múltiplos de 10.
- Sempre termina com "alguém do nosso time vai te chamar" e o botão de WhatsApp com o resumo.

As regras ficam em `DD.calcularFesta` (`site.js`) e valem também para a calculadora da página de festas.

## Testar no computador

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080`.
