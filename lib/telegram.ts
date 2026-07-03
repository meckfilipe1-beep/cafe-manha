const API = "https://api.telegram.org"

function botUrl(token: string) {
  return `${API}/bot${token}`
}

export async function enviarTelegram(mensagem: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  try {
    await fetch(`${botUrl(token)}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: mensagem, parse_mode: "HTML" }),
    })
  } catch (err) {
    console.error("Telegram send error:", err)
  }
}

export async function registrarChatId(token: string) {
  if (!token) return { ok: false, erro: "Token não informado" }

  try {
    // Tenta buscar a última atualização sem consumi-la (offset=-1)
    let res = await fetch(`${botUrl(token)}/getUpdates?offset=-1&limit=1`, { cache: "no-store" })
    let data = await res.json()

    // Se não achou, tenta sem offset para pegar atualizações pendentes
    if (!data.ok || !data.result?.length) {
      res = await fetch(`${botUrl(token)}/getUpdates?limit=1`, { cache: "no-store" })
      data = await res.json()
    }

    // Se ainda não achou, pede para o usuário enviar /start
    if (!data.ok || !data.result?.length) {
      return { ok: false, erro: "Nenhuma mensagem encontrada. Envie /start para o bot no Telegram e clique novamente." }
    }

    const chatId = data.result[0].message.chat.id
    const nome = data.result[0].message.chat.first_name || "Admin"

    // Envia uma mensagem de teste para confirmar
    await fetch(`${botUrl(token)}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "✅ Chat ID encontrado! Notificações da Tapicuz ativadas.", parse_mode: "HTML" }),
    })

    return { ok: true, chatId, nome }
  } catch (err: any) {
    return { ok: false, erro: err.message }
  }
}
