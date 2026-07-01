import { db } from "./firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

interface ItensPedido {
  [key: string]: number;
}

export async function buscarPedidoAtivoMesmaPessoa(nome: string, telefone: string) {
  if (!nome.trim() || !telefone.trim()) return null;

  const q = query(
    collection(db, "pedidos"),
    where("nome", "==", nome.trim()),
    where("telefone", "==", telefone.trim()),
    where("concluido", "==", false)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return { id: docSnap.id, data: docSnap.data() };
}

export function mergeItens(itensExistentes: ItensPedido, itensNovos: ItensPedido): ItensPedido {
  const merged = { ...itensExistentes };
  for (const [chave, qtd] of Object.entries(itensNovos)) {
    if (typeof qtd === "number" && qtd > 0) {
      merged[chave] = (merged[chave] || 0) + qtd;
    }
  }
  return merged;
}
