const NOMES_ITENS: Record<string, string> = {
  tapiocaMolhada: "Tapioca Molhada",
  tapiocaManteiga: "Tapioca c/ Manteiga",
  tapiocaQueijo: "Tapioca c/ Queijo",
  tapiocaOvo: "Tapioca c/ Ovo",
  tapiocaQueijoOvo: "Tapioca c/ Queijo e Ovo",
  cuscuzMilho: "Cuscuz de Milho",
  cuscuzArroz: "Cuscuz de Arroz",
  cuscuzMilhoArroz: "Cuscuz Misto",
  cafe: "Café com Leite",
}

function formatarItens(itens: Record<string, number>): string {
  return Object.entries(itens)
    .filter(([_, qtd]) => qtd > 0)
    .map(([chave, qtd]) => `  ${qtd}x ${NOMES_ITENS[chave] || chave}`)
    .join("\n")
}

export function montarMsgTelegram(dados: {
  nome: string; horario: string; valorTotal: number;
  itens?: Record<string, number>; pagamento?: string; troco?: number;
  endereco?: string; telefone?: string; observacao?: string;
}): string {
  const { nome, horario, valorTotal, itens, pagamento, troco, endereco, telefone, observacao } = dados

  let msg = `🆕 <b>Novo Pedido!</b>\n👤 ${nome || "Cliente"}`
  if (telefone) msg += `\n📱 ${telefone}`
  msg += `\n⏰ ${horario || "---"}`
  if (endereco) msg += `\n📍 ${endereco}`

  if (itens) {
    const itensStr = formatarItens(itens)
    if (itensStr) msg += `\n\n📦 <b>Itens:</b>\n${itensStr}`
  }

  if (observacao) msg += `\n\n📝 <b>Obs:</b> ${observacao}`

  msg += `\n\n💳 <b>Pagamento:</b> ${pagamento || "N/A"}`
  if (pagamento === "Dinheiro" && troco && troco > 0) {
    msg += `\n🔄 <b>Troco:</b> R$ ${troco.toFixed(2).replace(".", ",")}`
  }

  msg += `\n💰 <b>Total:</b> R$ ${(valorTotal || 0).toFixed(2).replace(".", ",")}`

  return msg
}

export async function notificarPedido(dados: {
  nome: string; horario: string; valorTotal: number; pedidoId?: string;
  itens?: Record<string, number>; pagamento?: string; troco?: number;
  endereco?: string; telefone?: string; observacao?: string;
}) {
  const { nome, horario, valorTotal, itens, pagamento, troco, endereco, telefone, observacao } = dados

  fetch("/api/notificar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  })
}
