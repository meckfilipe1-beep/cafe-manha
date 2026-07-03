import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"
import { enviarTelegram } from "@/lib/telegram"
import { montarMsgTelegram } from "@/lib/notificarPedido"

function initAdmin() {
  if (admin.apps.length) return admin
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT
  if (encoded) {
    try {
      const serviceAccount = JSON.parse(Buffer.from(encoded, "base64").toString())
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    } catch {
      admin.initializeApp({ projectId: "tapicuz-aa78f" })
    }
  } else {
    admin.initializeApp({ projectId: "tapicuz-aa78f" })
  }
  return admin
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nome, horario, valorTotal, pedidoId, itens, pagamento, troco, endereco, telefone, observacao } = body

  // 🚀 Telegram primeiro - SEM ESPERAR
  const msgTelegram = montarMsgTelegram({ nome, horario, valorTotal, itens, pagamento, troco, endereco, telefone, observacao })
  enviarTelegram(msgTelegram)

  // 🔄 Firebase em segundo plano
  let totalAtivos = 0, enviadosFcm = 0, falhasFcm = 0
  try {
    const firestore = initAdmin().firestore()
    try {
      const pedidosSnapshot = await firestore.collection("pedidos").where("concluido", "==", false).get()
      totalAtivos = pedidosSnapshot.size
    } catch {}
    try {
      const tokensSnapshot = await firestore.collection("admin_tokens").get()
      const tokens: string[] = []
      tokensSnapshot.forEach(doc => { const d = doc.data(); if (d.token) tokens.push(d.token) })
      if (tokens.length > 0) {
        const r = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title: `Novo Pedido - ${nome || "Cliente"}`, body: `${horario || ""} | R$ ${(valorTotal || 0).toFixed(2).replace(".", ",")} | ${totalAtivos} pedido(s) ativo(s)` },
          android: { notification: { channelId: "pedidos-alta", priority: "high", sound: "default" } },
          data: { pedidoId: pedidoId || "", click_action: "FLUTTER_NOTIFICATION_CLICK" },
        })
        enviadosFcm = r.successCount; falhasFcm = r.failureCount
      }
    } catch {}
  } catch {}

  return NextResponse.json({ ok: true, enviados: enviadosFcm, falhas: falhasFcm })
}
