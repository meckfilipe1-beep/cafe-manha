import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"
import { enviarTelegram } from "@/lib/telegram"

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
  const { nome, horario, valorTotal, pedidoId } = body

  let totalAtivos = 0
  let enviadosFcm = 0
  let falhasFcm = 0

  try {
    const firestore = initAdmin().firestore()
    try {
      const pedidosSnapshot = await firestore.collection("pedidos").where("concluido", "==", false).get()
      totalAtivos = pedidosSnapshot.size
    } catch {}

    try {
      const tokensSnapshot = await firestore.collection("admin_tokens").get()
      const tokens: string[] = []
      tokensSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.token) tokens.push(data.token)
      })

      if (tokens.length > 0) {
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: `Novo Pedido - ${nome || "Cliente"}`,
            body: `${horario || ""} | R$ ${(valorTotal || 0).toFixed(2).replace(".", ",")} | ${totalAtivos} pedido(s) ativo(s)`,
          },
          android: {
            notification: {
              channelId: "pedidos-alta",
              priority: "high",
              sound: "default",
            },
          },
          data: {
            pedidoId: pedidoId || "",
            click_action: "FLUTTER_NOTIFICATION_CLICK",
          },
        })
        enviadosFcm = response.successCount
        falhasFcm = response.failureCount
      }
    } catch {}
  } catch {}

  const msgTelegram = `🆕 <b>Novo Pedido!</b>\n👤 ${nome || "Cliente"}\n⏰ ${horario || ""}\n💰 R$ ${(valorTotal || 0).toFixed(2).replace(".", ",")}\n📦 ${totalAtivos} pedido(s) ativo(s)`
  enviarTelegram(msgTelegram)

  return NextResponse.json({ ok: true, enviados: enviadosFcm, falhas: falhasFcm })
}
