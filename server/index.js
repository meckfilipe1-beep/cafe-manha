const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString()
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

app.post("/notificar", async (req, res) => {
  try {
    const { nome, horario, valorTotal, pedidoId } = req.body;

    const pedidosAtivos = await db
      .collection("pedidos")
      .where("concluido", "==", false)
      .get();

    const totalAtivos = pedidosAtivos.size;

    const snapshot = await db.collection("admin_tokens").get();

    if (snapshot.empty) {
      return res.json({ ok: true, enviados: 0, motivo: "sem_tokens" });
    }

    const tokens = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.token) tokens.push(data.token);
    });

    if (tokens.length === 0) {
      return res.json({ ok: true, enviados: 0, motivo: "sem_tokens" });
    }

    const mensagem = {
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
          vibration: true,
        },
      },
      data: {
        pedidoId: pedidoId || "",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    };

    const response = await admin.messaging().sendEachForMulticast(mensagem);
    console.log(`${response.successCount} enviadas, ${response.failureCount} falhas`);

    res.json({
      ok: true,
      enviados: response.successCount,
      falhas: response.failureCount,
    });
  } catch (erro) {
    console.error("Erro ao notificar:", erro);
    res.status(500).json({ ok: false, erro: erro.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
