const API_BASE_URL = process.env.NEXT_PUBLIC_NOTIFICAR_API_URL || "http://localhost:3000"

export async function notificarPedido(dados: {
  nome: string
  horario: string
  valorTotal: number
  pedidoId?: string
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/notificar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    })
    if (!res.ok) console.warn("Notificação falhou:", await res.text())
    return await res.json()
  } catch (erro) {
    console.warn("Erro ao notificar servidor:", erro)
  }
}
