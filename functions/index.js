const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.notificarNovoPedido = functions.firestore
  .document("pedidos/{pedidoId}")
  .onCreate(async (snap, context) => {
    const pedido = snap.data();
    const nome = pedido.nome || "Cliente";
    const horario = pedido.horario || "";
    const valor = pedido.valorTotal || 0;

    const pedidosAtivos = await admin.firestore()
      .collection("pedidos")
      .where("concluido", "==", false)
      .get();

    const totalAtivos = pedidosAtivos.size;

    const snapshot = await admin.firestore().collection("admin_tokens").get();

    if (snapshot.empty) {
      console.log("Nenhum admin token encontrado.");
      return null;
    }

    const tokens = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.token) tokens.push(data.token);
    });

    if (tokens.length === 0) {
      console.log("Nenhum token válido.");
      return null;
    }

    const mensagem = {
      tokens,
      notification: {
        title: `🆕 Novo Pedido - ${nome}`,
        body: `${horario} | R$ ${valor.toFixed(2).replace(".", ",")} | ${totalAtivos} pedido(s) ativo(s)`,
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
        pedidoId: context.params.pedidoId,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(mensagem);
      console.log(`${response.successCount} notificações enviadas com sucesso`);
      if (response.failureCount > 0) {
        console.log(`${response.failureCount} falhas ao enviar`);
      }
      return response;
    } catch (erro) {
      console.error("Erro ao enviar notificação:", erro);
      return null;
    }
  });
