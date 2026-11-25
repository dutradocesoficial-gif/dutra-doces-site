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
  PAGBANK_PUBLIC_KEY: 'TROCAR_CHAVE_PUBLICA', // chave PÚBLICA de criptografia do cartão
  PAGBANK_ENV: 'sandbox',                     // 'sandbox' | 'production'
  WHATSAPP: '5548991013331',                  // botão "Falar com a Dutra"
  MAX_PARCELAS: 6,
  VENDEDOR: {                                 // rodapé obrigatório
    nome_fantasia: 'Dutra Doces',
    cnpj: '62.741.391/0001-52',
    cidade: 'Camboriú/SC'
  },
  MOCK: false                                 // true = funciona sem n8n, com dados falsos. Em produção: false
};
