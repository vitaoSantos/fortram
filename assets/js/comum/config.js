/**
 * Configurações usadas pelas três versões da landing page.
 * Os dados de contato ficam aqui para serem trocados em um lugar só.
 */
export const CONFIG = {
  // WhatsApp com DDI + DDD + número, só dígitos (ex.: '5535999999999').
  // Enquanto estiver vazio, os botões de WhatsApp ficam escondidos.
  whatsapp: '',
  mensagemWhatsapp: 'Olá! Vim pelo site da Fortram e quero conversar sobre um projeto.',

  // E-mail exibido na área de contato. Vazio = não aparece.
  email: '',

  // De onde vêm os dados. Primeiro tenta a API em PHP; se ela não responder
  // (por exemplo, com o site aberto num servidor sem PHP), lê o arquivo JSON direto.
  projetos: ['api/projetos.php', 'data/projetos.json'],
  modulos: ['api/modulos.php', 'data/modulos.json'],
  contato: 'api/contato.php',
}
