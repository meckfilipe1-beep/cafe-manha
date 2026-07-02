import { NextResponse } from "next/server"

const API = "https://api.telegram.org"

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token) {
    return NextResponse.json({ ok: false, erro: "TELEGRAM_BOT_TOKEN nao configurado" })
  }
  if (!chatId) {
    return NextResponse.json({ ok: false, erro: "TELEGRAM_CHAT_ID nao configurado" })
  }

  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "\u{1F514} Teste - Notificacao Telegram funcionando!",
        parse_mode: "HTML",
      }),
    })
    const data = await res.json()
    return NextResponse.json({ ok: data.ok, resultado: data })
  } catch (erro: any) {
    return NextResponse.json({ ok: false, erro: erro.message })
  }
}
