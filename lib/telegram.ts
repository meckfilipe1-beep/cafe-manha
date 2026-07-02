const API = "https://api.telegram.org"

function botUrl(token: string) {
  return `${API}/bot${token}`
}

export async function enviarTelegram(mensagem: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  try {
    const { admin } = await import("./firebaseAdmin")
    const snap = await admin.firestore().doc("configuracoes/telegram").get()
    const chatId = snap.data()?.chatId
    if (!chatId) return

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
    const res = await fetch(`${botUrl(token)}/getUpdates?limit=1&allowed_updates=["message"]`, { cache: "no-store" })
    const data = await res.json()

    if (!data.ok || !data.result?.length) {
      return { ok: false, erro: "Nenhuma mensagem encontrada. Envie /start para o bot primeiro." }
    }

    const chatId = data.result[0].message.chat.id
    const nome = data.result[0].message.chat.first_name || "Admin"

    const { admin } = await import("./firebaseAdmin")
    await admin.firestore().doc("configuracoes/telegram").set({ chatId, nome, ativo: true }, { merge: true })

    return { ok: true, chatId, nome }
  } catch (err: any) {
    return { ok: false, erro: err.message }
  }
}
