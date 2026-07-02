export async function notificarPedido(dados: {
  nome: string
  horario: string
  valorTotal: number
  pedidoId?: string
}) {
  const { nome, horario, valorTotal } = dados

  try {
    await fetch("/api/notificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    })
  } catch {}

  const msg = `🆕 <b>Novo Pedido!</b>\n👤 ${nome || "Cliente"}\n⏰ ${horario || ""}\n💰 R$ ${(valorTotal || 0).toFixed(2).replace(".", ",")}`
  try {
    await fetch("/api/telegram-enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: msg }),
    })
  } catch {}
}
