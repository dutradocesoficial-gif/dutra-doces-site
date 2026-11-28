/*
 * Dutra Doces · Checkout — configuração
 * ÚNICO arquivo com endereços e chaves. Veja checkout/README.md.
 *
 * SEGURANÇA: nada de token secreto, senha ou chave privada aqui.
 * Este arquivo é público (qualquer pessoa pode abrir no navegador).
 * A única chave permitida é a chave PÚBLICA de criptografia do PagBank.
 */
window.DUTRA_CONFIG = {
  N8N_BASE: 'https://n8n.mateusbalta.com/webhook', // endereço base dos webhooks do n8n, sem barra no final
  ROTAS: {                                    // endereço completo de um webhook específico (sobrepõe N8N_BASE)
    'checkout-entrega': 'https://n8n.mateusbalta.com/webhook/checkout-entrega' // edita endereço/bairro/CEP e recalcula a taxa
  },
  PAGBANK_PUBLIC_KEY: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr+ZqgD892U9/HXsa7XqBZUayPquAfh9xx4iwUbTSUAvTlmiXFQNTp0Bvt/5vK2FhMj39qSv1zi2OuBjvW38q1E374nzx6NNBL5JosV0+SDINTlCG0cmigHuBOyWzYmjgca+mtQu4WczCaApNaSuVqgb8u7Bd9GCOL4YJotvV5+81frlSwQXralhwRzGhj/A57CGPgGKiuPT+AOGmykIGEZsSD9RKkyoKIoc0OS8CPIzdBOtTQCIwrLn2FxI83Clcg55W8gkFSOS6rWNbG5qFZWMll6yl02HtunalHmUlRUL66YeGXdMDC2PuRcmZbGO5a/2tbVppW6mfSWG3NPRpgwIDAQAB', // chave PÚBLICA (sandbox) — trocar pela de produção
  PAGBANK_ENV: 'sandbox',                     // 'sandbox' | 'production'
  WHATSAPP: '554791873186',                   // botão "Falar com a Dutra" no checkout — número do atendimento (bot). O 3331 fica só na página oficial
  MAX_PARCELAS: 6,
  VENDEDOR: {                                 // rodapé obrigatório
    nome_fantasia: 'Dutra Doces',
    cnpj: '62.741.391/0001-52',
    cidade: 'Camboriú/SC'
  },
  MOCK: false                                 // true = funciona sem n8n, com dados falsos. Em produção: false
};
