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
    const res = await fetch(`${botUrl(token)}/getUpdates?limit=1`, { cache: "no-store" })
    const data = await res.json()

    if (!data.ok || !data.result?.length) {
      return { ok: false, erro: "Nenhuma mensagem encontrada. Envie /start para o bot no Telegram e clique novamente." }
    }

    const chatId = data.result[0].message.chat.id
    const nome = data.result[0].message.chat.first_name || "Admin"

    const msgRes = await fetch(`${botUrl(token)}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "✅ Chat ID encontrado! Notificações da Tapicuz ativadas.", parse_mode: "HTML" }),
    })
    const msgData = await msgRes.json()

    return { ok: true, chatId, nome, testeEnviado: msgData.ok }
  } catch (err: any) {
    return { ok: false, erro: err.message }
  }
}
