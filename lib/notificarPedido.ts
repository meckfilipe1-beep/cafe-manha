export async function notificarPedido(dados: {
  nome: string
  horario: string
  valorTotal: number
  pedidoId?: string
}) {
  try {
    const res = await fetch("/api/notificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    })
    const text = await res.text()
    if (!res.ok) console.warn("Notificação falhou:", text)
    else return JSON.parse(text)
  } catch (erro) {
    console.warn("Erro ao notificar servidor:", erro)
  }
}
