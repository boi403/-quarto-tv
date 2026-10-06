// Configuração do módulo Quarto — edite aqui número, opções e textos.
// {quarto} e {hospede} nas mensagens são trocados pelos dados do check-in.

// WhatsApp da recepção — só dígitos, com 55 + DDD
export const WHATSAPP_RECEPCAO = '5500000000000';

// Room service: cada opção vira um QR que abre o WhatsApp com a mensagem pronta.
// Pra um restaurante parceiro com número próprio, preencha `whatsapp` nele.
export const ROOM_SERVICE_OPCOES = [
  {
    key: 'refeicao', icon: '🍽️', label: 'Pedir refeição', sub: 'Cozinha do hotel',
    mensagem: 'Olá! Sou do quarto {quarto} ({hospede}) e gostaria de fazer um pedido de refeição.',
  },
  {
    key: 'frigobar', icon: '🧊', label: 'Frigobar', sub: 'Repor ou pedir itens',
    mensagem: 'Olá! Sou do quarto {quarto} ({hospede}) e gostaria de pedir/repor itens do frigobar.',
  },
  {
    key: 'cafe', icon: '☕', label: 'Café da manhã no quarto', sub: 'Agende o horário',
    mensagem: 'Olá! Sou do quarto {quarto} ({hospede}) e gostaria de agendar café da manhã no quarto.',
  },
  // Exemplo de restaurante parceiro (descomente e troque nome/número):
  // {
  //   key: 'pizzaria', icon: '🍕', label: 'Pizzaria Parceira', sub: 'Entrega no hotel',
  //   whatsapp: '5566900000000',
  //   mensagem: 'Olá! Estou no hotel, quarto {quarto}, e gostaria de fazer um pedido.',
  // },
];

// Solicitações rápidas — mesmo esquema: QR → WhatsApp da recepção.
export const SOLICITACOES_OPCOES = [
  { key: 'toalhas', icon: '🧺', label: 'Toalhas', mensagem: 'Olá! Quarto {quarto} ({hospede}): poderiam trazer toalhas, por favor?' },
  { key: 'limpeza', icon: '🧹', label: 'Limpeza do quarto', mensagem: 'Olá! Quarto {quarto} ({hospede}): gostaria de solicitar a limpeza do quarto.' },
  { key: 'manutencao', icon: '🔧', label: 'Manutenção', mensagem: 'Olá! Quarto {quarto} ({hospede}): preciso de manutenção no quarto.' },
  { key: 'arcondicionado', icon: '❄️', label: 'Ar-condicionado', mensagem: 'Olá! Quarto {quarto} ({hospede}): o ar-condicionado precisa de ajuda.' },
  { key: 'wifi', icon: '📶', label: 'Wi-Fi', mensagem: 'Olá! Quarto {quarto} ({hospede}): estou com problema no Wi-Fi.' },
  { key: 'recepcao', icon: '🛎️', label: 'Falar com a recepção', mensagem: 'Olá! Sou do quarto {quarto} ({hospede}).' },
];

export function linkWhatsApp(opcao, room) {
  const texto = opcao.mensagem
    .replace('{quarto}', room?.number || '—')
    .replace(' ({hospede})', room?.guestName ? ` (${room.guestName})` : '')
    .replace('{hospede}', room?.guestName || '');
  return `https://wa.me/${opcao.whatsapp || WHATSAPP_RECEPCAO}?text=${encodeURIComponent(texto)}`;
}

export function formatarTelefone(digitos) {
  const d = digitos.replace(/^55/, '');
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
