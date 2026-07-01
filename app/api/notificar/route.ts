import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"

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
  try {
    const body = await req.json()
    const { nome, horario, valorTotal, pedidoId } = body

    const firestore = initAdmin().firestore()

    const pedidosSnapshot = await firestore.collection("pedidos").where("concluido", "==", false).get()
    const totalAtivos = pedidosSnapshot.size

    const tokensSnapshot = await firestore.collection("admin_tokens").get()
    if (tokensSnapshot.empty) {
      return NextResponse.json({ ok: true, enviados: 0, motivo: "sem_tokens" })
    }

    const tokens: string[] = []
    tokensSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.token) tokens.push(data.token)
    })

    if (tokens.length === 0) {
      return NextResponse.json({ ok: true, enviados: 0, motivo: "sem_tokens" })
    }

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

    return NextResponse.json({
      ok: true,
      enviados: response.successCount,
      falhas: response.failureCount,
    })
  } catch (erro: any) {
    console.error("Erro ao notificar:", erro)
    return NextResponse.json({ ok: false, erro: erro.message }, { status: 500 })
  }
}
