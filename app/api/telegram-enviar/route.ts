import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { mensagem } = body

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return NextResponse.json({ ok: false, erro: "Telegram não configurado" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: mensagem, parse_mode: "HTML" }),
    })
    const data = await res.json()
    return NextResponse.json({ ok: data.ok })
  } catch (erro: any) {
    return NextResponse.json({ ok: false, erro: erro.message }, { status: 500 })
  }
}
