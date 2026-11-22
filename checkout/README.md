# Checkout · Dutra Doces

Página de pagamento em `https://checkout.dutradoces.com.br/checkout?p=TOKEN`.
É só front-end (HTML, CSS e JavaScript puros, sem framework). Toda regra de preço, pedido e
credencial fica no n8n. A página não calcula nenhum valor: tudo o que aparece vem dos endpoints.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | página de checkout |
| `termos.html` | termos e políticas (preencha os trechos `[PREENCHER]`) |
| `checkout.css` | estilos (mesma identidade da página principal) |
| `checkout.js` | lógica da página |
| `config.js` | **único** lugar com endereços e chaves públicas |
| `mock.js` | modo de teste; só é carregado com `MOCK: true` |

Os arquivos usam caminhos absolutos (`/checkout/...` e `/assets/...`), porque a página abre em
`/checkout` sem barra no final.

## Endpoints que a página chama

`{N8N_BASE}` = `DUTRA_CONFIG.N8N_BASE`. Todos respondem JSON; em erro,
`{ "erro": "codigo", "mensagem": "texto para o cliente" }` com HTTP 4xx/5xx.

| # | Método e rota | Corpo enviado | Quando |
|---|---|---|---|
| 1 | `GET {N8N_BASE}/checkout-dados?p={token}` | — | ao abrir a página e no "Tentar de novo" |
| 2 | `POST {N8N_BASE}/checkout-forma` | `{ token, forma_pagamento }` | ao trocar a forma de pagamento |
| 3 | `POST {N8N_BASE}/checkout-pix` | `{ token }` | botão "Gerar Pix" |
| 4 | `POST {N8N_BASE}/checkout-parcelas` | `{ token, bin }` | depois dos 6 primeiros dígitos do cartão (e quando eles mudam) |
| 5 | `POST {N8N_BASE}/checkout-cartao` | `{ token, cartao_criptografado, titular_nome, titular_cpf, parcelas }` | botão "Pagar R$ X" |
| 6 | `GET {N8N_BASE}/checkout-status?p={token}` | — | a cada 5 s com o Pix na tela ou o cartão em análise, ao voltar do app do banco, quando o tempo acaba e se a resposta do cartão não chegar |

Códigos de erro tratados pela página: `link_invalido` (ou HTTP 404), `link_expirado`, `pagamento_ja_iniciado`.
Qualquer outro código mostra a `mensagem` que vier do servidor.

Detalhes que o n8n precisa respeitar:
- `checkout-dados` deve devolver `agora` e `expira_em` com fuso (ex.: `2026-11-22T16:00:00-03:00`). A página usa `agora` para corrigir o relógio do celular.
- Mesmo com `status: "expirado"` ou `"pago"`, mande o `pedido` se puder: a página usa o `numero` na mensagem do WhatsApp e na confirmação.
- `checkout-forma` pode devolver o `pedido` direto ou dentro de `{ "pedido": ... }`; os dois funcionam.
- `checkout-cartao` com `status: "em_analise"` faz a página consultar o `checkout-status` até virar `pago`.

## Modo de teste (MOCK)

Com `MOCK: true` no `config.js`, a página não chama o n8n e mostra a faixa **"MODO DE TESTE"** no topo.

| Link | O que mostra |
|---|---|
| `/checkout?p=mock-cartao` | aguardando pagamento, forma cartão (o cartão é aprovado) |
| `/checkout?p=mock-pix` | Pix que vira "pago" 15 s depois de gerado |
| `/checkout?p=mock-sinal` | Pix 50/50 com a etiqueta "Sinal 50%" |
| `/checkout?p=mock-saldo` | saldo do 50/50 (só Pix integral) |
| `/checkout?p=mock-recusado` | cartão recusado |
| `/checkout?p=mock-analise` | cartão em análise que aprova depois de 15 s |
| `/checkout?p=mock-expirando` | reserva acaba em 40 s, com a página aberta |
| `/checkout?p=mock-expirado` | link expirado |
| `/checkout?p=mock-invalido` | link inválido |
| `/checkout?p=mock-offline` | erro de rede |

Cartões e CPF de teste (funcionam em qualquer `mock-*`): `4111 1111 1111 1111` (Visa) ou
`5555 5555 5555 4444` (Mastercard), validade futura (ex.: `12/30`), CVV `123`, CPF `529.982.247-25`.

Para testar no computador:

```bash
python3 -m http.server 8080
```

Depois abra `http://localhost:8080/checkout/?p=mock-cartao`.

## Publicar no subdomínio `checkout`

A página faz parte do mesmo projeto da Vercel do site principal. Cada push na branch `main` publica.

1. **Vercel:** no projeto `dutra-doces-site`, abra **Settings → Domains**, clique em **Add** e adicione `checkout.dutradoces.com.br`.
2. **Hostinger:** em **DNS / Nameservers → Gerenciar registros DNS**, crie:

   | Tipo | Nome | Valor |
   |---|---|---|
   | CNAME | `checkout` | `cname.vercel-dns.com` |

   Se a Vercel mostrar outro valor, use o dela.
3. Espere a Vercel mostrar ✅ **Valid Configuration** e abra `https://checkout.dutradoces.com.br/checkout?p=mock-cartao`.

O `vercel.json` já cuida do resto:
- quem abrir `checkout.dutradoces.com.br/` sem caminho vai para `dutradoces.com.br`;
- as páginas do checkout não aparecem no Google (`noindex`), não podem ser embutidas em outro site e não vazam o token pelo `Referer`.

A página também abre em `dutradoces.com.br/checkout`, mas o link oficial é o do subdomínio. O CORS do n8n só vai liberar esse.

## Passar para produção (`config.js`)

1. `N8N_BASE`: endereço base dos webhooks de **produção** do n8n, sem barra no final (ex.: `https://SEU-N8N/webhook`). Não use o `/webhook-test`.
2. `PAGBANK_PUBLIC_KEY`: a chave **pública** de criptografia do PagBank do ambiente certo. A chave do sandbox não funciona em produção, e vice-versa.
3. `PAGBANK_ENV`: `'production'`. Hoje é só informativo: quem decide o ambiente é a chave pública e o n8n.
4. `MOCK`: `false`.
5. Faça commit e push. A Vercel publica sozinha.
6. Teste um Pix de valor baixo de ponta a ponta antes de mandar links para clientes.

**Nunca** coloque no `config.js` token do PagBank, senha, chave privada ou segredo do n8n. Esse arquivo é público.

## CORS no n8n (obrigatório)

A página chama o n8n direto do navegador do cliente. Em **cada um dos 6 webhooks**, em
**Options → Allowed Origins (CORS)**, coloque só:

```
https://checkout.dutradoces.com.br
```

Não use `*`. Os navegadores enviam um pedido `OPTIONS` antes dos `POST` com JSON: o webhook precisa
responder a ele (o campo de CORS do Webhook do n8n já faz isso). Para testar no computador com o n8n
de verdade, adicione temporariamente `http://localhost:8080` e remova depois.

## Criptografia do cartão (PagBank)

O número, a validade e o CVV são criptografados no navegador pelo SDK oficial do PagBank,
com a `PAGBANK_PUBLIC_KEY`. Só o resultado (`cartao_criptografado`) vai para o n8n. Os campos são
limpos logo depois, e os dados de cartão nunca vão para `localStorage`, `console` ou anúncios.

> ⚠️ **Conferir antes de ir para produção:** não consegui abrir a documentação do PagBank para
> confirmar. Em `checkout.js`, a constante `PAGBANK_SDK_URL` e a função `criptografarCartao()` usam o
> script `https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js` e a
> função `PagSeguro.encryptCard({ publicKey, holder, number, expMonth, expYear, securityCode })`, que
> devolve `{ encryptedCard, hasErrors, errors }`. Confira esses nomes na página "Criptografia e chave
> pública" da documentação do PagBank e ajuste só esse trecho, se for preciso.

## Pixel de anúncios

`checkout.js` tem um ponto único, `window.dutraTrack(evento, dados)`, que hoje não faz nada.
Eventos: `checkout_aberto`, `pix_gerado`, `pagamento_aprovado`. Os `dados` têm só `numero`, `valor`
e `forma`: nunca o token, CPF ou cartão. Para ligar, defina `window.dutraTrack` num `<script>` antes de
`checkout.js` no `index.html`, ou edite a função no começo do `checkout.js`.
