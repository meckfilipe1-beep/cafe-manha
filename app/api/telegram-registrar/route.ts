import { NextResponse } from "next/server"
import { registrarChatId } from "@/lib/telegram"

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ ok: false, erro: "TELEGRAM_BOT_TOKEN não configurado nas variáveis de ambiente do Vercel." }, { status: 400 })
  }

  const resultado = await registrarChatId(token)
  return NextResponse.json(resultado)
}
