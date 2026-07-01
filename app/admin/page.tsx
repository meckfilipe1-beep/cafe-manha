"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { useRouter } from 'next/navigation';
import {
  collection,
  onSnapshot,
  query,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  where
} from "firebase/firestore";
import { buscarPedidoAtivoMesmaPessoa, mergeItens } from "@/lib/pedidoUtils";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { notificarPedido } from "@/lib/notificarPedido";

// Funções auxiliares fora do componente
const tocarSomPedido = () => {
  if (typeof window === "undefined") return;
  const audio = new Audio('/pedido.mp3');
  audio.play().catch(() => {});
};

const configurarNotificacoes = async () => {
  if (typeof window === "undefined" || !(window as any).Capacitor) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const permissao = await LocalNotifications.requestPermissions();
    if (permissao.display !== 'granted') return;
    await LocalNotifications.createChannel({
      id: 'pedidos-alta',
      name: 'Avisos de Pedido',
      importance: 5,
      visibility: 1,
      sound: 'default',
      vibration: true,
    });
  } catch (err) {
    console.log("Só funciona no app:", err);
  }
};

const inicializarFirebasePush = async (usuario: any) => {
  if (typeof window === "undefined" || !(window as any).Capacitor) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const permissao = await PushNotifications.requestPermissions();
    if (permissao.receive === 'granted') await PushNotifications.register();
    await PushNotifications.addListener('registration', async (token) => {
      console.log("Token FCM:", token.value);
      if (usuario) {
        await setDoc(doc(db, "admin_tokens", usuario.uid), {
          token: token.value,
          email: usuario.email,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log("Token salvo no Firestore!");
      }
    });
    await PushNotifications.addListener('registrationError', (err) => {
      console.error("Erro no Push:", err);
    });
  } catch (err) {
    console.log("Push não disponível:", err);
  }
};

// 🎨 Configurações fixas
const cores = {
  fundoGeral: "#FFFFFF",
  fundoSecao: "#FFFAF5",
  primaria: "#F97316",
  primariaClara: "#FFEDD5",
  textoPrincipal: "#27272A",
  textoSecundario: "#71717A",
  sucesso: "#10B981",
  alerta: "#F59E0B",
  erro: "#EF4444",
  borda: "#F3F4F6",
};

const OPCOES_HORARIOS = [
  "0:00", "05:30", "06:00", "06:30", "07:00", "07:30", "08:00", 
  "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", 
  "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", 
  "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", 
  "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", 
  "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", 
  "23:30"
];

// 🚀 Componente principal
export default function AdminPainel() {
  // ==============================================
  // 1. TODOS OS HOOKS NO INÍCIO (ORDEM FIXA)
  // ==============================================
  const router = useRouter();

  // Estados de login
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);
  const [carregandoLogin, setCarregandoLogin] = useState(true);

  // Outros estados
  const [produtos, setProdutos] = useState<{
    id: string;
    chave: string;
    nome: string;
    preco: number;
    icone: string;
    disponivel: boolean;
  }[]>([
    { id: "1", chave: "tap_ovo", nome: "Tapioca com Ovo", preco: 8.00, icone: "🧈", disponivel: true },
    { id: "2", chave: "tap_queijo", nome: "Tapioca com Queijo", preco: 8.00, icone: "🧀", disponivel: true },
    { id: "3", chave: "tap_molhada", nome: "Tapioca Molhada", preco: 7.00, icone: "🥣", disponivel: true },
    { id: "4", chave: "tap_queijo_ovo", nome: "Tapioca Queijo e Ovo", preco: 8.00, icone: "🧈🧀", disponivel: true },
  ]);

  const [novoPreco, setNovoPreco] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoDisponivel, setNovoDisponivel] = useState(true);
  const [editandoProduto, setEditandoProduto] = useState<any>(null);
  const [modalConfirmarApagarHistorico, setModalConfirmarApagarHistorico] = useState(false);
  const [mostrarOpcoesZap, setMostrarOpcoesZap] = useState(false);
  const [mostrarOpcoesConcluir, setMostrarOpcoesConcluir] = useState(false);
  const [modalSalvarTurno, setModalSalvarTurno] = useState(false);
  const [horaAbertura, setHoraAbertura] = useState("06:00");
  const [horaFechamento, setHoraFechamento] = useState("18:00");
  const [diasFuncionamento, setDiasFuncionamento] = useState<{[key: string]: boolean}>({
    domingo: true, segunda: true, terca: true, quarta: true, quinta: true, sexta: true, sabado: true,
  });
  const [funcionamentoAberta, setFuncionamentoAberta] = useState(true);
  const [diasEntrega, setDiasEntrega] = useState<{[key: string]: boolean}>({
    domingo: true, segunda: true, terca: true, quarta: true, quinta: true, sexta: true, sabado: true,
  });
  const [horariosPorDia, setHorariosPorDia] = useState<{[key: string]: string[]}>({
    domingo: ["07:00", "08:00", "09:00", "10:00", "11:00"],
    segunda: ["07:00", "08:00", "09:00", "10:00", "11:00"],
    terca: ["07:00", "08:00", "09:00", "10:00", "11:00"],
    quarta: ["07:00", "08:00", "09:00", "10:00", "11:00"],
    quinta: ["07:00", "08:00", "09:00", "10:00", "11:00"],
    sexta: ["07:00", "08:00", "09:00", "10:00", "11:00"],
    sabado: ["07:00", "08:00", "09:00", "10:00", "11:00"],
  });
  const [diaEditando, setDiaEditando] = useState<string | null>(null);
  const [novoHorario, setNovoHorario] = useState("");

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [historicoCaixas, setHistoricoCaixas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("pedidos");
  const [notificacaoCaixa, setNotificacaoCaixa] = useState<string | null>(null);
  const [mostrarModalCopiado, setMostrarModalCopiado] = useState(false);
  const [pedidoSelecionadoParaConcluir, setPedidoSelecionadoParaConcluir] = useState<any | null>(null);
  const [mostrarResumoFinalAvulso, setMostrarResumoFinalAvulso] = useState(false);
  const [statusAvulsoSelecionado, setStatusAvulsoSelecionado] = useState<"pago" | "espera" | "pendente" | null>(null);
  const [pedidoDetalhado, setPedidoDetalhado] = useState<any | null>(null);
  const [submenuAcoes, setSubmenuAcoes] = useState<"principal" | "concluir" | "zap">("principal");
  const [mostrarDropdownHora, setMostrarDropdownHora] = useState(false);
  const [modalConfirmarTurno, setModalConfirmarTurno] = useState(false);
  const [modalConfirmarZerarTudo, setModalConfirmarZerarTudo] = useState(false);
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState<any | null>(null);
  const [fiados, setFiados] = useState<any[]>([]);
  const [modalPagamentoFiado, setModalPagamentoFiado] = useState<{ pessoa: any; } | null>(null);
  const [valorPagamentoFiado, setValorPagamentoFiado] = useState("");
  const [valorDespesaInput, setValorDespesaInput] = useState("");
  const [totalDespesasAcumuladas, setTotalDespesasAcumuladas] = useState(0);

  const [nomeAvulso, setNomeAvulso] = useState("");
  const [ruaAvulso, setRuaAvulso] = useState("");
  const [numeroAvulso, setNumeroAvulso] = useState("");
  const [referenciaAvulso, setReferenciaAvulso] = useState("");
  const [observacaoAvulso, setObservacaoAvulso] = useState("");
  const [pagamentoAvulso, setPagamentoAvulso] = useState<"Pix" | "Dinheiro">("Pix");
  const [trocoParaAvulso, setTrocoParaAvulso] = useState("");
  const [horarioAvulso, setHorarioAvulso] = useState("0:00");
  const [valorTotalAvulso, setValorTotalAvulso] = useState("0.00");
  const [whatsappAvulso, setWhatsappAvulso] = useState("");
  const [itensAvulsos, setItensAvulsos] = useState({
    tapiocaMolhada: 0,
    tapiocaManteiga: 0,
    tapiocaQueijo: 0,
    tapiocaOvo: 0,
    tapiocaQueijoOvo: 0,
    cuscuzMilho: 0,
    cuscuzArroz: 0,
    cuscuzMilhoArroz: 0,
    cafe: 0,
  });

  const ultimoTotalPedidos = useRef(0);

  // ✅ TODOS OS EFEITOS AQUI, ANTES DE QUALQUER RETURN CONDICIONAL
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        setUsuarioLogado(usuario);
      } else {
        router.replace('/login');
      }
      setCarregandoLogin(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!usuarioLogado) return;
    configurarNotificacoes();
    inicializarFirebasePush(usuarioLogado);
  }, [usuarioLogado]);

  useEffect(() => {
    if (!usuarioLogado) return;
    const q = query(collection(db, "pedidos"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPedidos(lista);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, [usuarioLogado]);

  useEffect(() => {
    if (!usuarioLogado) return;
    const qProdutos = query(collection(db, "produtos"));
    const unsubscribeProdutos = onSnapshot(qProdutos, (snap) => {
      const lista: any[] = [];
      snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (a?.nome || "").localeCompare(b?.nome || ""));
      setProdutos(lista);
    });
    return () => unsubscribeProdutos();
  }, [usuarioLogado]);

  useEffect(() => {
    if (!usuarioLogado) return;
    const ref = doc(db, "configuracoes", "funcionamento");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        const dados = snapshot.data();
        setHoraAbertura(dados.horaAbertura || "06:00");
        setHoraFechamento(dados.horaFechamento || "18:00");
        if (dados.diasFuncionamento) setDiasFuncionamento(dados.diasFuncionamento);
        if (dados.diasEntrega) setDiasEntrega(dados.diasEntrega);
        if (dados.horariosPorDia) setHorariosPorDia(dados.horariosPorDia);
        if (dados.aberta !== undefined) setFuncionamentoAberta(dados.aberta);
      }
    }, (erro) => console.error("Erro ao carregar configurações:", erro));
    return () => unsubscribe();
  }, [usuarioLogado]);

  useEffect(() => {
    if (!usuarioLogado) return;
    const refFunc = doc(db, "configuracoes", "funcionamento");
    const unsubscribeStatus = onSnapshot(refFunc, (snap) => {
      if (snap.exists()) {
        const dados = snap.data();
        setFuncionamentoAberta(dados.aberta !== undefined ? dados.aberta : true);
        setTotalDespesasAcumuladas(dados.despesas || 0);
      }
    });
    const qCaixas = query(collection(db, "historico_caixas"));
    const unsubscribeCaixas = onSnapshot(qCaixas, (snap) => {
      const lista: any[] = [];
      snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
      lista.sort((a, b) => b.dataHora.localeCompare(a.dataHora));
      setHistoricoCaixas(lista);
    });
    return () => { unsubscribeStatus(); unsubscribeCaixas(); };
  }, [usuarioLogado]);

  useEffect(() => {
    if (!usuarioLogado) return;
    const qPedidos = query(collection(db, "pedidos"));
    const unsubscribe = onSnapshot(qPedidos, (snap) => {
      const listaPedidos: any[] = [];
      snap.forEach((doc) => listaPedidos.push({ id: doc.id, ...doc.data() }));
      listaPedidos.sort((a, b) => a.horario.localeCompare(b.horario));
      const qtdAtivos = listaPedidos.filter(p => !p.concluido).length;
      if (ultimoTotalPedidos.current > 0 && qtdAtivos > ultimoTotalPedidos.current) tocarSomPedido();
      ultimoTotalPedidos.current = qtdAtivos;
      setPedidos(listaPedidos);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, [usuarioLogado]);

  useEffect(() => {
    if (!usuarioLogado) return;
    const qFiados = query(collection(db, "fiados"));
    const unsubscribe = onSnapshot(qFiados, (snap) => {
      const lista: any[] = [];
      snap.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
      lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      setFiados(lista);
    });
    return () => unsubscribe();
  }, [usuarioLogado]);

  useEffect(() => {
    let subtotal = 0;
    let qtdComidas = 0;
    let qtdCafes = itensAvulsos.cafe;
    Object.entries(itensAvulsos).forEach(([key, qtd]) => {
      const preco = produtos.find(p => p.chave === key)?.preco || 0;
      subtotal += preco * Number(qtd);
      if (key !== "cafe") qtdComidas += Number(qtd);
    });
    if (qtdComidas > 0 && qtdCafes > 0) {
      const qtdCombos = Math.min(qtdComidas, qtdCafes);
      let desconto = 0;
      let cafesUsados = 0;
      Object.entries(itensAvulsos).forEach(([key, qtd]) => {
        if (key !== "cafe" && Number(qtd) > 0 && cafesUsados < qtdCombos) {
          const precoItem = produtos.find(p => p.chave === key)?.preco || 0;
          const precoCafe = produtos.find(p => p.chave === "cafe")?.preco || 0;
          const qtdUsar = Math.min(Number(qtd), qtdCombos - cafesUsados);
          desconto += qtdUsar * ((precoItem + precoCafe) - 10);
          cafesUsados += qtdUsar;
        }
      });
      subtotal -= desconto;
    }
    setValorTotalAvulso(subtotal.toFixed(2));
  }, [itensAvulsos, produtos]);

  // ==============================================
  // 2. RETORNOS CONDICIONAIS SOMENTE DEPOIS DE TODOS OS HOOKS
  // ==============================================
  if (carregandoLogin) {
    return <div className="flex items-center justify-center min-h-screen text-lg text-orange-600">Carregando...</div>;
  }

  if (!usuarioLogado) {
    return null;
  }

  // ==============================================
  // 3. INTERFACES, CÁLCULOS E FUNÇÕES
  // ==============================================
  const valorTotalAvulsoNumerico = parseFloat(valorTotalAvulso) || 0;
  const trocoParaAvulsoNumerico = parseFloat(trocoParaAvulso.replace(",", ".")) || 0;
  const trocoAvulsoCalculado = pagamentoAvulso === "Dinheiro" && trocoParaAvulsoNumerico > valorTotalAvulsoNumerico 
    ? trocoParaAvulsoNumerico - valorTotalAvulsoNumerico 
    : 0;

  const partesEndereco = [];
  if (ruaAvulso.trim()) partesEndereco.push(ruaAvulso.trim());
  if (numeroAvulso.trim()) partesEndereco.push(`Nº ${numeroAvulso.trim()}`);
  if (referenciaAvulso.trim()) partesEndereco.push(`Ref: ${referenciaAvulso.trim()}`);
  const enderecoCompletoConstruido = partesEndereco.length > 0 ? partesEndereco.join(", ") : "Retirada no Balcão";
  const observacaoPedido = observacaoAvulso?.trim() || "";

  const pedidosAtivos = pedidos.filter(p => !p.concluido);
  const pedidosPendentes = pedidos.filter(p => p.concluido && p.statusPagamento === "pendente");
  const pedidosPagos = pedidos.filter(p => p.concluido && p.statusPagamento === "pago");
  const faturamentoTotal = pedidosPagos.reduce((acc, p) => acc + p.valorTotal, 0);
  const totalPix = pedidosPagos.filter(p => p.pagamento === "Pix").reduce((acc, p) => acc + p.valorTotal, 0);
  const totalDinheiro = pedidosPagos.filter(p => p.pagamento === "Dinheiro").reduce((acc, p) => acc + p.valorTotal, 0);
  const saldoLiquidoAtual = faturamentoTotal - totalDespesasAcumuladas;
  const somaHistoricoPix = historicoCaixas.reduce((acc, c) => acc + (c.totalPix || 0), 0);
  const somaHistoricoDinheiro = historicoCaixas.reduce((acc, c) => acc + (c.totalDinheiro || 0), 0);
  const somaHistoricoDespesas = historicoCaixas.reduce((acc, c) => acc + (c.despesas || 0), 0);
  const somaHistoricoLiquido = historicoCaixas.reduce((acc, c) => acc + (c.saldoLiquido || 0), 0);

  const dispararFluxoConclusaoAvulso = (e: React.FormEvent) => {
    e.preventDefault();
  };

  function chamarClienteWhatsapp(pedido: any) {
    if (!pedido.telefone) { alert("Cliente não informou telefone."); return; }
    const numero = pedido.telefone.replace(/\D/g, "");
    const mensagem = `Olá ${pedido.nome}.\nSeu pedido da Tapicuz já está sendo preparado.\nHorário: ${pedido.horario}\nObrigado pela preferência.`;
    const link = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;
    if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
      (async () => {
        try { const { AppLauncher } = await import('@capacitor/app-launcher'); await AppLauncher.openUrl({ url: link }); }
        catch { const { Browser } = await import('@capacitor/browser'); await Browser.open({ url: link }); }
      })();
    } else { window.open(link, "_blank", "noopener,noreferrer"); }
  }

  function pegarPreco(chave: string): number {
    const p = produtos.find(pr => pr.chave === chave);
    return p?.preco || 0;
  }

  function formatarNomeItem(nomeChave: string) {
    const p = produtos.find(pr => pr.chave === nomeChave);
    return p ? `${p.icone} ${p.nome}` : nomeChave;
  }

  function nomeAbreviado(nomeCompleto: string) {
    const partes = nomeCompleto.trim().split(/\s+/);
    if (partes.length <= 2) return nomeCompleto.trim();
    return `${partes[0]} ${partes[1]}`;
  }

  function gerarHorarios(inicio: string, fim: string) {
    const horarios = [];
    let atual = new Date();
    const [hInicio, mInicio] = inicio.split(":").map(Number);
    atual.setHours(hInicio, mInicio, 0, 0);
    const encerramento = new Date();
    const [hFim, mFim] = fim.split(":").map(Number);
    encerramento.setHours(hFim, mFim, 0, 0);
    while (atual <= encerramento) {
      horarios.push(atual.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      atual.setMinutes(atual.getMinutes() + 30);
    }
    return horarios;
  }

  const carregarConfiguracoesFuncionamento = async () => {
    if (!usuarioLogado) return;
    try {
      const docRef = doc(db, "configuracoes", "funcionamento");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const dados = docSnap.data();
        setHoraAbertura(dados.horaAbertura || "06:00");
        setHoraFechamento(dados.horaFechamento || "18:00");
        if (dados.diasFuncionamento) setDiasFuncionamento(dados.diasFuncionamento);
        if (dados.diasEntrega) setDiasEntrega(dados.diasEntrega);
        if (dados.horariosPorDia) setHorariosPorDia(dados.horariosPorDia);
        if (dados.aberta !== undefined) setFuncionamentoAberta(dados.aberta);
      }
    } catch (erro) {
      console.error("Erro ao carregar configurações:", erro);
    }
  };

  const salvarConfiguracoesFuncionamento = async () => {
    if (!usuarioLogado) return;
    try {
      const horariosGerados = gerarHorarios(horaAbertura, horaFechamento);
      const novosHorariosPorDia = {
        domingo: diasFuncionamento.domingo ? horariosGerados : [],
        segunda: diasFuncionamento.segunda ? horariosGerados : [],
        terca: diasFuncionamento.terca ? horariosGerados : [],
        quarta: diasFuncionamento.quarta ? horariosGerados : [],
        quinta: diasFuncionamento.quinta ? horariosGerados : [],
        sexta: diasFuncionamento.sexta ? horariosGerados : [],
        sabado: diasFuncionamento.sabado ? horariosGerados : [],
      };
      await setDoc(doc(db, "configuracoes", "funcionamento"), { 
        horaAbertura, horaFechamento, diasFuncionamento, diasEntrega, horariosPorDia: novosHorariosPorDia, aberta: funcionamentoAberta
      });
      setNotificacaoCaixa("✅ Configurações salvas!");
      setTimeout(() => setNotificacaoCaixa(null), 2000);
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
      setNotificacaoCaixa("❌ Erro ao salvar");
      setTimeout(() => setNotificacaoCaixa(null), 2000);
    }
  };

  const alternarDia = (valorDia: string) => {
    setDiasFuncionamento(prev => {
      const novoEstado = { ...prev, [valorDia]: !prev[valorDia as keyof typeof prev] };
      setDiasEntrega(entrega => ({ ...entrega, [valorDia]: novoEstado[valorDia] }));
      return novoEstado;
    });
  };

  const finalizarPedidoAvulsoComStatusRoteado = async (status: "pago" | "espera" | "pendente") => {
    if (!usuarioLogado) return;
    try {
      setNotificacaoCaixa("⏳ Registrando pedido...");

      const itensNovos = { ...itensAvulsos };

      const pedidoExistente = await buscarPedidoAtivoMesmaPessoa(nomeAvulso, whatsappAvulso || "");

      if (pedidoExistente) {
        const itensCombinados = mergeItens(pedidoExistente.data.itens || {}, itensNovos);

        const itensOnly = Object.fromEntries(
          Object.entries(itensCombinados).filter(([_, qtd]) => (qtd as number) > 0)
        );

        let novoTotal = 0;
        Object.entries(itensOnly).forEach(([chave, qtd]) => {
          const preco = produtos.find(p => p.chave === chave)?.preco || 0;
          novoTotal += preco * Number(qtd);
        });

        let qtdComidas = 0;
        let qtdCafes = itensOnly.cafe || 0;
        Object.entries(itensOnly).forEach(([key, qtd]) => {
          if (key !== "cafe") qtdComidas += Number(qtd);
        });

        if (qtdComidas > 0 && qtdCafes > 0) {
          const qtdCombos = Math.min(qtdComidas, qtdCafes);
          let desconto = 0;
          let cafesUsados = 0;
          Object.entries(itensOnly).forEach(([key, qtd]) => {
            if (key !== "cafe" && Number(qtd) > 0 && cafesUsados < qtdCombos) {
              const precoItem = produtos.find(p => p.chave === key)?.preco || 0;
              const precoCafe = produtos.find(p => p.chave === "cafe")?.preco || 0;
              const qtdUsar = Math.min(Number(qtd), qtdCombos - cafesUsados);
              desconto += qtdUsar * ((precoItem + precoCafe) - 10);
              cafesUsados += qtdUsar;
            }
          });
          novoTotal -= desconto;
        }

        await updateDoc(doc(db, "pedidos", pedidoExistente.id), {
          itens: itensOnly,
          valorTotal: Math.max(0, novoTotal),
          observacao: observacaoAvulso || pedidoExistente.data.observacao || "",
          horario: horarioAvulso || pedidoExistente.data.horario || "",
          pagamento: pagamentoAvulso || pedidoExistente.data.pagamento || "Pix",
          troco: trocoAvulsoCalculado > 0 ? trocoAvulsoCalculado : pedidoExistente.data.troco || 0,
          statusPagamento: status === "pago" ? "pago" : pedidoExistente.data.statusPagamento || "pendente",
          concluido: status === "pago" ? true : pedidoExistente.data.concluido || false,
        });

        notificarPedido({
          nome: nomeAvulso,
          horario: horarioAvulso || pedidoExistente.data.horario || "",
          valorTotal: Math.max(0, novoTotal),
          pedidoId: pedidoExistente.id,
        });

        setNotificacaoCaixa(`✅ Itens agrupados ao pedido existente de ${nomeAvulso}!`);
      } else {
        const novoPedido = {
          nome: nomeAvulso,
          telefone: whatsappAvulso || "",
          endereco: `${ruaAvulso || ""} ${numeroAvulso ? `, Nº ${numeroAvulso}` : ""} ${referenciaAvulso ? `- ${referenciaAvulso}` : ""}`.trim() || "Retirada no Balcão",
          observacao: observacaoAvulso,
          horario: horarioAvulso,
          pagamento: pagamentoAvulso,
          troco: trocoAvulsoCalculado > 0 ? trocoAvulsoCalculado : 0,
          valorTotal: valorTotalAvulsoNumerico,
          itens: itensNovos,
          statusPagamento: status === "pago" ? "pago" : "pendente",
          concluido: status === "pago",
          dataCriacao: new Date(),
          abaOrigem: "avulso"
        };

        const docRef = await addDoc(collection(db, "pedidos"), novoPedido);

        notificarPedido({
          nome: nomeAvulso,
          horario: horarioAvulso,
          valorTotal: valorTotalAvulsoNumerico,
          pedidoId: docRef.id,
        });

        setNotificacaoCaixa(`✅ Pedido salvo como: ${status.toUpperCase()}`);
      }

      setNomeAvulso("");
      setWhatsappAvulso("");
      setRuaAvulso("");
      setNumeroAvulso("");
      setReferenciaAvulso("");
      setObservacaoAvulso("");
      setHorarioAvulso("0:00");
      setPagamentoAvulso("Pix");
      setTrocoParaAvulso("");
      setItensAvulsos({
        tapiocaMolhada: 0,
        tapiocaManteiga: 0,
        tapiocaQueijo: 0,
        tapiocaOvo: 0,
        tapiocaQueijoOvo: 0,
        cuscuzMilho: 0,
        cuscuzArroz: 0,
        cuscuzMilhoArroz: 0,
        cafe: 0,
      });

      setTimeout(() => {
        if (status === "pago") router.push("/admin?aba=historico");
        if (status === "espera") router.push("/admin?aba=pedidos");
        if (status === "pendente") router.push("/admin?aba=pendencias");
        setNotificacaoCaixa(null);
      }, 600);

    } catch (erro) {
      console.error("Erro ao salvar:", erro);
      setNotificacaoCaixa("❌ Falha ao registrar pedido");
      setTimeout(() => setNotificacaoCaixa(null), 3000);
    }
  };

  async function salvarAlteracaoProduto() {
    if (!editandoProduto || !usuarioLogado) return;
    try {
      await updateDoc(doc(db, "produtos", editandoProduto.id), {
        nome: novoNome, preco: parseFloat(novoPreco), disponivel: novoDisponivel
      });
      setEditandoProduto(null);
      setNotificacaoCaixa("✅ Produto atualizado com sucesso!");
      setTimeout(() => setNotificacaoCaixa(null), 2000);
    } catch (err) { console.error(err); }
  }

  async function apagarHistoricoCaixas() {
    const confirmar = window.confirm("Tem certeza que deseja apagar TODO o histórico de fechamentos?");
    if (!confirmar || !usuarioLogado) return;
    try {
      const snap = await getDocs(collection(db, "historico_caixas"));
      await Promise.all(snap.docs.map(item => deleteDoc(doc(db, "historico_caixas", item.id))));
      setHistoricoCaixas([]);
      setNotificacaoCaixa("🗑️ Histórico apagado com sucesso!");
      setTimeout(() => setNotificacaoCaixa(null), 3000);
    } catch (error) { console.error(error); }
  }

  async function processarDecisaoPedidoExistente(foiPago: boolean, pedidoOverride?: any) {
    const pedido = pedidoOverride || pedidoSelecionadoParaConcluir;
    if (!pedido || !usuarioLogado) return;
    try {
      await updateDoc(doc(db, "pedidos", pedido.id), { concluido: true, statusPagamento: foiPago ? "pago" : "pendente" });
      setNotificacaoCaixa(foiPago ? "🟢 PEDIDO CONCLUÍDO E PAGO!" : "🔴 MOVIDO PARA AS PENDÊNCIAS!");
      setTimeout(() => setNotificacaoCaixa(null), 2000);
      setPedidoSelecionadoParaConcluir(null);
    } catch (erro) { console.error(erro); }
  }

  async function marcarComoPago(id: string) {
    if (!usuarioLogado) return;
    try {
      await updateDoc(doc(db, "pedidos", id), { concluido: true, statusPagamento: "pago" });
      setNotificacaoCaixa("🟢 PEDIDO MARCADO COMO PAGO!");
      setTimeout(() => setNotificacaoCaixa(null), 2000);
      if (pedidoDetalhado?.id === id) setPedidoDetalhado(null);
    } catch (erro) { console.error(erro); }
  }

  async function marcarPagoSemConcluir(id: string) {
    if (!usuarioLogado) return;
    try {
      await updateDoc(doc(db, "pedidos", id), { statusPagamento: "pago" });
      setNotificacaoCaixa("🟢 PAGAMENTO MARCADO!");
      setTimeout(() => setNotificacaoCaixa(null), 2000);
    } catch (erro) { console.error(erro); }
  }

  async function reverterPago(id: string) {
    if (!usuarioLogado) return;
    try {
      await updateDoc(doc(db, "pedidos", id), { statusPagamento: "pendente" });
      setNotificacaoCaixa("🟡 MOVIDO PARA PENDENTE!");
      setTimeout(() => setNotificacaoCaixa(null), 2000);
    } catch (erro) { console.error(erro); }
  }

  async function deletarDoHistorico(id: string) {
    if (!usuarioLogado) return;
    try {
      await deleteDoc(doc(db, "pedidos", id));
      if (pedidoDetalhado?.id === id) setPedidoDetalhado(null);
    } catch (error) { console.error(error); }
  }

  async function moverParaFiado(pedido: any) {
    if (!usuarioLogado) return;
    try {
      const chave = `${pedido.telefone || "sem_telefone"}_${pedido.nome}`;
      const ref = doc(db, "fiados", chave);
      const snap = await getDoc(ref);

      const pedidoItem = {
        pedidoId: pedido.id,
        data: pedido.dataCriacao || new Date().toISOString(),
        horario: pedido.horario || "",
        valor: pedido.valorTotal || 0,
        itens: pedido.itens || {},
      };

      if (snap.exists()) {
        const dados = snap.data();
        await updateDoc(ref, {
          pedidos: [...(dados.pedidos || []), pedidoItem],
          totalDevido: (dados.totalDevido || 0) + (pedido.valorTotal || 0),
          ultimaAtualizacao: new Date().toISOString(),
        });
      } else {
        await setDoc(ref, {
          nome: pedido.nome,
          telefone: pedido.telefone || "",
          endereco: pedido.endereco || "",
          totalDevido: pedido.valorTotal || 0,
          pedidos: [pedidoItem],
          pagamentos: [],
          ultimaAtualizacao: new Date().toISOString(),
        });
      }

      await updateDoc(doc(db, "pedidos", pedido.id), { statusPagamento: "fiado" });
      setNotificacaoCaixa("📒 MOVIDO PARA FIADO!");
      setTimeout(() => setNotificacaoCaixa(null), 2000);
      if (pedidoDetalhado?.id === pedido.id) setPedidoDetalhado(null);
    } catch (erro) {
      console.error(erro);
      setNotificacaoCaixa("❌ Erro ao mover para fiado");
      setTimeout(() => setNotificacaoCaixa(null), 2000);
    }
  }

  async function registrarPagamentoFiado(pessoaId: string, valorPago: number) {
    if (!usuarioLogado || !valorPago || valorPago <= 0) return;
    try {
      const ref = doc(db, "fiados", pessoaId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const dados = snap.data();
      const novoTotal = Math.max(0, (dados.totalDevido || 0) - valorPago);

      await updateDoc(ref, {
        totalDevido: novoTotal,
        pagamentos: [
          ...(dados.pagamentos || []),
          { valor: valorPago, data: new Date().toISOString(), observacao: "" }
        ],
        ultimaAtualizacao: new Date().toISOString(),
      });

      if (novoTotal <= 0 && dados.pedidos) {
        for (const p of dados.pedidos) {
          try {
            await updateDoc(doc(db, "pedidos", p.pedidoId), { statusPagamento: "pago" });
          } catch {}
        }
      }

      setModalPagamentoFiado(null);
      setValorPagamentoFiado("");
      setNotificacaoCaixa(`💰 Recebido R$ ${valorPago.toFixed(2)}`);
      setTimeout(() => setNotificacaoCaixa(null), 2000);
    } catch (erro) {
      console.error(erro);
      setNotificacaoCaixa("❌ Erro ao registrar pagamento");
      setTimeout(() => setNotificacaoCaixa(null), 2000);
    }
  }

  async function alternarStatusFuncionamento() {
    if (!usuarioLogado) return;
    try {
      const novoStatus = !funcionamentoAberta;
      await setDoc(doc(db, "configuracoes", "funcionamento"), { aberta: novoStatus }, { merge: true });
      setFuncionamentoAberta(novoStatus);
      setNotificacaoCaixa(`Pedidos: ${novoStatus ? "SISTEMA ON" : "SISTEMA OFF"}`);
      setTimeout(() => setNotificacaoCaixa(null), 2500);
    } catch (error) { console.error(error); }
  }

  async function lancarDespesaSimples(e: any) {
    e.preventDefault();
    const valor = parseFloat(valorDespesaInput.replace(",", "."));
    if (isNaN(valor) || valor <= 0 || !usuarioLogado) return;
    try {
      const novaDespesaTotal = totalDespesasAcumuladas + valor;
      setTotalDespesasAcumuladas(novaDespesaTotal);
      await setDoc(doc(db, "configuracoes", "funcionamento"), { despesas: novaDespesaTotal }, { merge: true });
      setValorDespesaInput("");
      setNotificacaoCaixa(`Despesa de R$ ${valor.toFixed(2)} lançada!`);
      setTimeout(() => setNotificacaoCaixa(null), 3000);
    } catch (error) { console.error(error); }
  }

  function executarCopiaResumo() {
    const itensTxt = Object.entries(itensAvulsos).filter(([_, qtd]) => qtd > 0).map(([key, qtd]) => `• ${qtd}x ${formatarNomeItem(key)}`).join("\n");
    const textoFinal = `━━━━━━━━━━━━━━━━━━\nTAPICUZ\n\nCliente: ${nomeAvulso || "Não informado"}\nHorário: ${horarioAvulso}\n\nEntrega:\n${enderecoCompletoConstruido}\n\nItens:\n${itensTxt || "Nenhum item selecionado"}\n${observacaoPedido ? `Observação:\n${observacaoPedido}\n` : ""}Pagamento:\n${pagamentoAvulso.toUpperCase()}\n\nTotal:\nR$ ${valorTotalAvulso}\n${pagamentoAvulso === "Dinheiro" && trocoAvulsoCalculado > 0 ? `Troco: R$ ${trocoAvulsoCalculado.toFixed(2).replace(".", ",")}\n` : ""}━━━━━━━━━━━━━━━━━━`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textoFinal).then(() => setMostrarModalCopiado(true)).catch(err => console.error("Erro na cópia", err));
    } else {
      const textArea = document.createElement("textarea"); textArea.value = textoFinal; document.body.appendChild(textArea); textArea.select(); document.execCommand("copy"); document.body.removeChild(textArea); setMostrarModalCopiado(true);
    }
  }

  function gerarResumoPedidoWhatsApp() {
    const itens = Object.entries(itensAvulsos).filter(([_, qtd]) => qtd > 0).map(([key, qtd]) => `• ${qtd}x ${formatarNomeItem(key)}`).join("\n");
    return `Olá ${nomeAvulso || "Cliente"},\nSeu pedido da Tapicuz foi recebido e já está sendo preparado!\n\nRESUMO DO PEDIDO\n----------------------------------------\n\n*CLIENTE:* ${nomeAvulso || "Não informado"}\n*ENDEREÇO:* ${enderecoCompletoConstruido}\n${observacaoPedido ? `*OBSERVAÇÃO:* ${observacaoPedido}\n` : ""}*HORÁRIO:* ${horarioAvulso}\n*FORMA DE PAGAMENTO:* ${pagamentoAvulso.toUpperCase()}\n*TROCO:* R$ ${trocoAvulsoCalculado.toFixed(2).replace(".", ",")}\n----------------------------------------\n*ITENS DO PEDIDO*\n${itens || "Nenhum item selecionado"}\n----------------------------------------\n*VALOR TOTAL:* R$ ${valorTotalAvulso}\n\nAgradecemos muito a sua preferência!`;
  }

  const enviarMensagemNotificacaoWhats = (nomeCliente: string, telefone: string = "") => {
    const msg = `Olá, ${nomeCliente}!\nSeu pedido da Tapicuz já foi entregue.\nCaso o pagamento ainda não tenha sido realizado, pedimos a gentileza de efetuá-lo assim que possível.\nSe o pagamento já foi realizado, desconsidere esta mensagem e muito obrigado pela preferência.\nTenha um excelente dia.`;
    const numeroLimpo = telefone.replace(/\D/g, "");
    const url = numeroLimpo.length >= 10 ? `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
      (async () => {
        try { const { AppLauncher } = await import('@capacitor/app-launcher'); await AppLauncher.openUrl({ url }); }
        catch { const { Browser } = await import('@capacitor/browser'); await Browser.open({ url }); }
      })();
    } else { window.open(url, "_blank", "noopener,noreferrer"); }
  };

  function alterarQtdAvulso(campo: string, valor: number) {
    setItensAvulsos(prev => ({ ...prev, [campo]: Math.max(0, (prev as any)[campo] + valor) }));
  }

  async function executarFechamentoTurno() {
    try {
      const faturamento = Number(faturamentoTotal || 0);
      const pix = Number(totalPix || 0);
      const dinheiro = Number(totalDinheiro || 0);
      const despesas = Number(totalDespesasAcumuladas || 0);
      const saldoLiquido = faturamento - despesas;

      const dadosFechamento = {
        tipo: "fechamento_turno",
        data: new Date().toISOString(),
        dataHora: new Date().toLocaleString("pt-BR"),
        faturado: faturamento,
        totalPix: pix,
        totalDinheiro: dinheiro,
        despesas: despesas,
        saldoLiquido: saldoLiquido
      };

      await addDoc(collection(db, "historico_caixas"), dadosFechamento);

      const snapPedidos = await getDocs(collection(db, "pedidos"));
      const promessasDelecao = snapPedidos.docs.map(d => deleteDoc(doc(db, "pedidos", d.id)));
      await Promise.all(promessasDelecao);

      await setDoc(doc(db, "configuracoes", "funcionamento"), { despesas: 0 }, { merge: true });

      setTotalDespesasAcumuladas(0);
      setModalConfirmarTurno(false);
      setModalSalvarTurno(false);

      setNotificacaoCaixa("✅ Turno arquivado e contadores zerados!");
      setTimeout(() => setNotificacaoCaixa(null), 4000);

    } catch (error) {
      console.error("Erro ao arquivar turno:", error);
      setNotificacaoCaixa("❌ Erro ao arquivar turno — verifique o console");
      setTimeout(() => setNotificacaoCaixa(null), 3000);
    }
  }

  async function apagarSistemaGeralEZero() {
    try {
      const snapPedidos = await getDocs(collection(db, "pedidos"));
      const promessasDelecao = snapPedidos.docs.map(d => deleteDoc(doc(db, "pedidos", d.id)));
      await Promise.all(promessasDelecao);

      const snapHistorico = await getDocs(collection(db, "historico_caixas"));
      const promessasHistorico = snapHistorico.docs.map(d => deleteDoc(doc(db, "historico_caixas", d.id)));
      await Promise.all(promessasHistorico);

      await setDoc(doc(db, "configuracoes", "funcionamento"), { despesas: 0 }, { merge: true });

      setTotalDespesasAcumuladas(0);
      setModalConfirmarZerarTudo(false);
      setAbaAtiva("pedidos");

      setNotificacaoCaixa("💥 SISTEMA RESETADO! Pedidos, histórico e contadores foram limpos.");
      setTimeout(() => setNotificacaoCaixa(null), 8000);

    } catch (error) {
      console.error("❌ Erro ao resetar sistema:", error);
      setModalConfirmarZerarTudo(false);
      setNotificacaoCaixa(`❌ Erro ao zerar sistema`);
      setTimeout(() => setNotificacaoCaixa(null), 9000);
    }
  }

  const demandasProducao = {
    tapiocaMolhada: 0,
    tapiocaManteiga: 0,
    tapiocaQueijo: 0,
    tapiocaOvo: 0,
    tapiocaQueijoOvo: 0,
    cuscuzMilho: 0,
    cuscuzArroz: 0,
    cuscuzMilhoArroz: 0,
    cafe: 0,
  };

  pedidosAtivos.forEach((pedido) => {
    Object.keys(demandasProducao).forEach((item) => {
      demandasProducao[item as keyof typeof demandasProducao] += pedido.itens?.[item as keyof typeof pedido.itens] || 0;
    });
  });

  const handleSalvarTurno = () => {
    setNotificacaoCaixa("✅ Turno salvo com sucesso!");
    setTimeout(() => setNotificacaoCaixa(null), 9000);
  };

  // ==============================================
  // 4. INTERFACE PRINCIPAL
  // ==============================================
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFFAF5] via-[#FFFFFF] to-[#FFFAF5] text-[#27272A] py-6 px-3 sm:px-4 relative overflow-x-hidden">
      {/* ✅ Notificação flutuante */}
      {notificacaoCaixa && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/90 border border-orange-500 text-orange-300 px-6 py-3 rounded-2xl font-black uppercase shadow-2xl animate-pulse">
          {notificacaoCaixa}
        </div>
      )}

      {/* ✅ Modal de Copiado */}
      {mostrarModalCopiado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFAF5] border border-emerald-500/30 w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl">
            <span className="text-5xl mb-3 block">📋</span>
            <h3 className="text-lg font-black text-emerald-400 uppercase mb-2">Copiado!</h3>
            <p className="text-[#71717A] text-sm mb-4">Resumo do pedido copiado para área de transferência.</p>
            <button 
              onClick={() => setMostrarModalCopiado(false)} 
              className="w-full py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-black uppercase hover:bg-emerald-500/30 transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ✅ Cabeçalho Principal */}
      <div className="mb-6 text-center">
        <h1 className="text-[clamp(1.8rem,5vw,3rem)] font-black uppercase tracking-wider mb-2 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
          Painel Tapicuz
        </h1>
        <div className="flex items-center justify-center gap-3">
          <div className={`w-3 h-3 rounded-full ${funcionamentoAberta ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></div>
          <button 
            onClick={alternarStatusFuncionamento} 
            className={`text-xs font-black uppercase px-3 py-1.5 rounded-full border transition-all ${funcionamentoAberta ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"}`}
          >
            {funcionamentoAberta ? "SISTEMA ONLINE" : "SISTEMA OFFLINE"}
          </button>
        </div>
      </div>

      {/* ✅ Menu de Navegação */}
      <div className="mb-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3">
          
          {/* 📋 EM ANDAMENTO */}
          <button 
            onClick={() => setAbaAtiva("pedidos")} 
            className={`p-3 rounded-2xl text-[10px] xs:text-xs font-black uppercase border flex flex-col items-center justify-center gap-1.5 transition-all ${abaAtiva === "pedidos" ? "bg-orange-600 text-[#27272A] border-orange-400 scale-[1.02]" : "bg-[#FFFFFF] text-[#71717A] border-[#F3F4F6]"}`}
          >
            <span className="text-lg">📋</span>
            <span>EM ANDAMENTO ({pedidosAtivos.length})</span>
          </button>

          {/* ➕ LANÇAR PEDIDO */}
          <button 
            onClick={() => setAbaAtiva("avulso")} 
            className={`p-3 rounded-2xl text-[10px] xs:text-xs font-black uppercase border flex flex-col items-center justify-center gap-1.5 transition-all ${abaAtiva === "avulso" ? "bg-orange-600 text-[#27272A] border-orange-400 scale-[1.02]" : "bg-[#FFFFFF] text-[#71717A] border-[#F3F4F6]"}`}
          >
            <span className="text-lg">➕</span>
            <span>LANÇAR PEDIDO</span>
          </button>

          {/* ⏳ PENDÊNCIAS */}
          <button 
            onClick={() => setAbaAtiva("pendencias")} 
            className={`p-3 rounded-2xl text-[10px] xs:text-xs font-black uppercase border flex flex-col items-center justify-center gap-1.5 transition-all ${abaAtiva === "pendencias" ? "bg-orange-600 text-[#27272A] border-orange-400 scale-[1.02]" : "bg-[#FFFFFF] text-[#71717A] border-[#F3F4F6]"}`}
          >
            <span className="text-lg">⏳</span>
            <span>PENDÊNCIAS ({pedidosPendentes.length})</span>
          </button>

          {/* ⚙️ PRODUTOS */}
          <button 
            onClick={() => setAbaAtiva("produtos")} 
            className={`p-3 rounded-2xl text-[10px] xs:text-xs font-black uppercase border flex flex-col items-center justify-center gap-1.5 transition-all ${abaAtiva === "produtos" ? "bg-orange-600 text-[#27272A] border-orange-400 scale-[1.02]" : "bg-[#FFFFFF] text-[#71717A] border-[#F3F4F6]"}`}
          >
            <span className="text-lg">⚙️</span>
            <span>CONTROLE</span>
          </button>

          {/* 📜 VENDAS PAGAS */}
<button 
  onClick={() => setAbaAtiva("historico")} 
  className={`p-3 rounded-2xl text-[10px] xs:text-xs font-black uppercase border flex flex-col items-center justify-center gap-1.5 transition-all ${abaAtiva === "historico" ? "bg-orange-600 text-[#27272A] border-orange-400 scale-[1.02]" : "bg-[#FFFFFF] text-[#71717A] border-[#F3F4F6]"}`}
>
  <span className="text-lg">📜</span>
  <span>VENDAS PAGAS ({pedidosPagos.length})</span>
</button>

{/* 💰 CAIXA GERAL */}
<button 
  onClick={() => setAbaAtiva("caixa")} 
  className={`p-3 rounded-2xl text-[10px] xs:text-xs font-black uppercase border flex flex-col items-center justify-center gap-1.5 transition-all ${abaAtiva === "caixa" ? "bg-orange-600 text-[#27272A] border-orange-400 scale-[1.02]" : "bg-[#FFFFFF] text-[#71717A] border-[#F3F4F6]"}`}
>
  <span className="text-lg">💰</span>
  <span>CAIXA GERAL</span>
</button>

{/* 🆕 DEMANDAS - AGORA FUNCIONANDO */}
<button 
  onClick={() => setAbaAtiva("demandas")} 
  className={`p-3 rounded-2xl text-[10px] xs:text-xs font-black uppercase border flex flex-col items-center justify-center gap-1.5 transition-all ${abaAtiva === "demandas" ? "bg-orange-600 text-[#27272A] border-orange-400 scale-[1.02]" : "bg-[#FFFFFF] text-[#71717A] border-[#F3F4F6]"}`}
>
  <span className="text-lg">📋</span>
  <span>DEMANDAS ({pedidos.length})</span>
</button>

{/* 🆕 RANKING - AGORA FUNCIONANDO */}
<button 
  onClick={() => setAbaAtiva("ranking")} 
  className={`p-3 rounded-2xl text-[10px] xs:text-xs font-black uppercase border flex flex-col items-center justify-center gap-1.5 transition-all ${abaAtiva === "ranking" ? "bg-orange-600 text-[#27272A] border-orange-400 scale-[1.02]" : "bg-[#FFFFFF] text-[#71717A] border-[#F3F4F6]"}`}
>
  <span className="text-lg">📈</span>
  <span>RANKING</span>
</button>

{/* 📒 FIADOS */}
<button 
  onClick={() => setAbaAtiva("fiados")} 
  className={`p-3 rounded-2xl text-[10px] xs:text-xs font-black uppercase border flex flex-col items-center justify-center gap-1.5 transition-all ${abaAtiva === "fiados" ? "bg-orange-600 text-[#27272A] border-orange-400 scale-[1.02]" : "bg-[#FFFFFF] text-[#71717A] border-[#F3F4F6]"}`}
>
  <span className="text-lg">📒</span>
  <span>FIADOS ({fiados.filter(f => f.totalDevido > 0).length})</span>
</button>

</div>
</div>
{/* ================= CONTEÚDO DAS ABAS ================= */}
{carregando ? (
  <div className="flex items-center justify-center py-20">
    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
) : (
  <div className="space-y-6">

       {/* ================================================== */}
    {/* ================= ABA: PRODUTOS ================== 
    {/* ================================================== */}
    {abaAtiva === "produtos" && (
      <div className="bg-[#FFFAF5] border border-[#F3F4F6] rounded-3xl p-6 shadow-xl">
        <div className="mb-6">
          <h2 className="text-lg font-black text-orange-400 uppercase tracking-wider flex items-center gap-2">
            <span>⚙️</span> Gerenciar Produtos e Preços
          </h2>
         
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#F3F4F6]">
                <th className="p-3 text-xs font-black text-[#71717A] uppercase">Ícone</th>
                <th className="p-3 text-xs font-black text-[#71717A] uppercase">Nome do Produto</th>
                <th className="p-3 text-xs font-black text-[#71717A] uppercase">Preço (R$)</th>
                <th className="p-3 text-xs font-black text-[#71717A] uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {produtos.map((produto) => (
                <tr 
                  key={produto.id} 
                  className={`transition-colors ${
                    produto.disponivel === false 
                      ? "bg-red-50 text-red-700 line-through opacity-70" 
                      : "hover:bg-[#FFEDD5]/30 text-zinc-800"
                  }`}
                >
                  <td className="p-3 text-xl">{produto.icone}</td>
                  <td className="p-3 font-bold">{produto.nome}</td>
                  <td className={`p-3 font-mono font-bold ${produto.disponivel === false ? "text-red-500" : "text-emerald-400"}`}>
                    R$ {produto.preco.toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setEditandoProduto(produto)
                        setNovoNome(produto.nome)
                        setNovoPreco(produto.preco.toString())
                        setNovoDisponivel(produto.disponivel ?? true)
                      }}
                      className="px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg text-xs font-black uppercase hover:bg-orange-500/20 transition-all"
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🕒 CONFIGURAÇÕES DE FUNCIONAMENTO - TUDO CENTRALIZADO */}
        <div className="mt-8 border-t border-[#F3F4F6] pt-8">
          <h3 className="text-xl font-black text-orange-500 uppercase mb-6 flex items-center justify-center gap-3 tracking-wider text-center">
            🕒 <span className="drop-shadow-sm">Horários e Dias de Funcionamento</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
            {/* HORÁRIO DE ABERTURA - CENTRALIZADO */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col items-center text-center">
              <label className="block text-sm font-black text-orange-700 uppercase mb-3 tracking-widest">
                🌅 Horário de Abertura
              </label>
              <input
                type="time"
                value={horaAbertura}
                onChange={(e) => setHoraAbertura(e.target.value)}
                className="w-full max-w-[180px] bg-white border-2 border-orange-200 rounded-xl p-4 text-center text-lg font-black text-orange-800 tracking-wider shadow-inner focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>

            {/* HORÁRIO DE FECHAMENTO - CENTRALIZADO */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col items-center text-center">
              <label className="block text-sm font-black text-orange-700 uppercase mb-3 tracking-widest">
                🌙 Horário de Fechamento
              </label>
              <input
                type="time"
                value={horaFechamento}
                onChange={(e) => setHoraFechamento(e.target.value)}
                className="w-full max-w-[180px] bg-white border-2 border-orange-200 rounded-xl p-4 text-center text-lg font-black text-orange-800 tracking-wider shadow-inner focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>
          </div>

          {/* DIAS DA SEMANA - CENTRALIZADOS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto justify-center">
            {Object.entries(diasFuncionamento).map(([dia, ativo]) => (
              <button
                key={dia}
                type="button"
                onClick={() =>
                  setDiasFuncionamento(prev => ({
                    ...prev,
                    [dia]: !prev[dia]
                  }))
                }
                className={`p-4 rounded-2xl font-black uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-md flex flex-col items-center justify-center text-center ${
                  ativo
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-2 border-emerald-300"
                    : "bg-gradient-to-r from-red-500 to-rose-500 text-white border-2 border-red-300"
                }`}
              >
                <span className="text-lg">{ativo ? "✅" : "❌"}</span>
                <span className="block text-xs mt-1">{dia}</span>
              </button>
            ))}
          </div>

          {/* BOTÃO SALVAR - CENTRALIZADO */}
          <div className="flex justify-center">
            <button
              onClick={salvarConfiguracoesFuncionamento}
              className="w-full max-w-[320px] py-4 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 text-white font-black rounded-2xl text-lg uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all border-2 border-orange-300"
            >
              💾 Salvar Configurações!
            </button>
          </div>
        </div>
        
        {/* MODAL DE EDIÇÃO DE PRODUTO */}
        {editandoProduto && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#FFFAF5] border border-orange-500/30 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-orange-400 uppercase tracking-wider">
                  Editar Produto
                </h3>
                <button 
                  onClick={() => setEditandoProduto(null)}
                  className="w-8 h-8 bg-[#FFEDD5] hover:bg-[#FFF7ED] rounded-full flex items-center justify-center text-[#71717A]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-[#71717A] uppercase mb-2">Nome do Produto</label>
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-xl p-3 text-[#27272A] font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#71717A] uppercase mb-2">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoPreco}
                    onChange={(e) => setNovoPreco(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-xl p-3 text-[#27272A] font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* ✅ Botões de Disponibilidade */}
                <div>
                  <label className="block text-xs font-black text-[#71717A] uppercase mb-2">Disponibilidade</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setNovoDisponivel(true)}
                      className={`flex-1 py-3 rounded-lg font-black uppercase transition-all ${
                        novoDisponivel ? "bg-emerald-500 text-[#27272A]" : "bg-[#FFEDD5] text-[#71717A]"
                      }`}
                    >
                      ✅ Disponível
                    </button>
                    <button
                      type="button"
                      onClick={() => setNovoDisponivel(false)}
                      className={`flex-1 py-3 rounded-lg font-black uppercase transition-all ${
                        !novoDisponivel ? "bg-red-500 text-[#27272A]" : "bg-[#FFEDD5] text-[#71717A]"
                      }`}
                    >
                      ❌ Indisponível
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={salvarAlteracaoProduto}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-sm uppercase rounded-xl transition-all shadow-lg"
              >
                💾 Salvar Alterações
              </button>
            </div>
          </div>
        )}

        {/* 📢 DIVULGAÇÃO */}
        <div className="mt-8 border-t border-[#F3F4F6] pt-8">
          <h3 className="text-xl font-black text-orange-500 uppercase mb-4 flex items-center justify-center gap-3 tracking-wider text-center">
            📢 Divulgação
          </h3>
          <div className="max-w-xl mx-auto bg-white border-2 border-orange-200 rounded-2xl p-6 text-center space-y-4">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wide">Link do Cardápio</p>
            <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 break-all">
              <a
                href="https://tapicuz-admin-gujb.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 font-black text-sm underline hover:text-orange-800"
              >
                https://tapicuz-admin-gujb.vercel.app/
              </a>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText("https://tapicuz-admin-gujb.vercel.app/").then(() => {
                    const el = document.createElement('div');
                    el.innerText = 'LINK COPIADO!';
                    el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#10b981;color:white;font-weight:900;font-size:16px;padding:16px 32px;border-radius:14px;z-index:99999;box-shadow:0 6px 16px rgba(0,0,0,0.2);border:2px solid #059669;text-transform:uppercase;letter-spacing:0.5px;';
                    document.body.appendChild(el);
                    setTimeout(() => el.remove(), 2800);
                  }).catch(() => alert("Erro ao copiar"));
                }}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-sm rounded-xl transition-all shadow-md"
              >
                Copiar Link
              </button>
              <button
                onClick={() => {
                  const texto = "Confira nosso cardapio! https://tapicuz-admin-gujb.vercel.app/";
                  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
                  if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
                    (async () => {
                      try { const { AppLauncher } = await import('@capacitor/app-launcher'); await AppLauncher.openUrl({ url }); }
                      catch { const { Browser } = await import('@capacitor/browser'); await Browser.open({ url }); }
                    })();
                  } else { window.open(url, "_blank", "noopener,noreferrer"); }
                }}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-sm rounded-xl transition-all shadow-md"
              >
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* 🚨 ZERAR SISTEMA */}
        <div className="mt-8 border-t-2 border-red-500/30 pt-8">
          <div className="max-w-md mx-auto text-center space-y-4">
            <h3 className="text-lg font-black text-red-500 uppercase tracking-wider">
              🚨 Zona de Perigo
            </h3>
            <p className="text-xs text-zinc-500 font-bold">
              Isso apaga todos os pedidos, despesas e zera o sistema. Use apenas quando necessário.
            </p>
            <button
              onClick={() => setModalConfirmarZerarTudo(true)}
              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase rounded-2xl text-sm tracking-wider transition-all shadow-lg hover:shadow-xl"
            >
              🚨 ZERAR SISTEMA
            </button>
          </div>
        </div>

      </div>
    )}

        {/* ================================================== */}
    {/* ================= ABA: PEDIDOS =================== */}
    {/* ================================================== */}
    {abaAtiva === "pedidos" && (
      <div className="space-y-6">
        
        {/* 🗑️ REMOVIDO O BOTÃO VER DEMANDA AQUI */}

        {/* 🟡 LISTA DE PEDIDOS EM ANDAMENTO - HORA DESTACADA 🟡 */}
        <div className="bg-[#FFEDD5]/60 border border-orange-400/40 rounded-3xl p-8 shadow-2xl">
         <h2 className="text-xl font-black text-orange-700 uppercase tracking-wider mb-6 flex items-center justify-center gap-2">
  <span>📋</span> Pedidos
  <span className="text-orange-800">({pedidosAtivos.length})</span>
</h2>
          {pedidosAtivos.length === 0 ? (
            <div className="text-center py-20 text-orange-800 font-bold uppercase text-lg">
              🚀 Nenhum pedido no momento
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pedidosAtivos.map((pedido) => (
                <div 
                  key={pedido.id} 
                  className="bg-[#FFFBEB] border border-orange-400/50 rounded-3xl p-6 hover:border-orange-500 hover:scale-[1.01] transition-all shadow-lg"
                >
                  <h3 className="font-black text-xl uppercase text-orange-900 text-center mb-2">
                    {nomeAbreviado(pedido.nome)}
                  </h3>

                  <p className="text-orange-700 font-black text-base text-center mb-3">⏱ {pedido.horario}</p>

                  <div className="flex justify-center mb-4">
                    <button
                      onClick={() => pedido.statusPagamento === "pago" ? reverterPago(pedido.id) : marcarPagoSemConcluir(pedido.id)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase shadow-sm border transition-all ${
                        pedido.statusPagamento === "pago"
                          ? "bg-emerald-400/30 text-emerald-800 border-emerald-500/40 hover:bg-red-400/30 hover:text-red-800 hover:border-red-500/40"
                          : "bg-red-400/30 text-red-800 border-red-500/40 hover:bg-emerald-400/30 hover:text-emerald-800 hover:border-emerald-500/40"
                      }`}
                      title="Clique para alternar"
                    >
                      {pedido.statusPagamento === "pago" ? "✅ Pago" : "⏳ Pendente"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPedidoDetalhado(pedido)}
                      className="flex-1 py-2.5 bg-sky-500/20 text-sky-700 border border-sky-500/40 rounded-xl font-black text-xs uppercase hover:bg-sky-500/30 transition-all"
                    >
                      DETALHES
                    </button>
                    <button
                      onClick={() => {
                        if (pedidoSelecionadoParaConcluir?.id === pedido.id) {
                          setPedidoSelecionadoParaConcluir(null);
                        } else {
                          setPedidoSelecionadoParaConcluir(pedido);
                          setSubmenuAcoes("principal");
                        }
                      }}
                      className="flex-1 py-2.5 bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 rounded-xl font-black text-xs uppercase hover:bg-emerald-500/30 transition-all"
                    >
                      OPÇÕES
                    </button>
                    <button
                      onClick={() => setPedidoParaExcluir(pedido)}
                      className="w-10 h-10 bg-red-400/20 text-red-600 border border-red-400/40 rounded-xl flex items-center justify-center text-sm hover:bg-red-400/40 transition-all flex-shrink-0"
                      title="Excluir pedido"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}

 
{abaAtiva === "avulso" && (
  <div className="bg-[#FFFAF5] border border-[#F3F4F6] rounded-3xl p-6 shadow-xl">
    <h2 className="text-lg font-black text-orange-400 uppercase tracking-wider mb-6 text-center">
      ➕ Lançar Pedido Avulso
    </h2>

    <form onSubmit={dispararFluxoConclusaoAvulso} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 📋 DADOS DO CLIENTE */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-[#71717A] uppercase mb-2">Nome do Cliente</label>
            <input
              type="text"
              value={nomeAvulso}
              onChange={(e) => setNomeAvulso(e.target.value.toUpperCase())}
              className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-xl p-3 text-[#27272A] font-bold focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          {/* 📱 WHATSAPP - OPCIONAL */}
          <div>
            <label className="block text-xs font-black text-[#71717A] uppercase mb-2">WhatsApp (Opcional)</label>
            <input
              type="tel"
              value={whatsappAvulso || ""}
              onChange={(e) => {
                let apenasNumeros = e.target.value.replace(/\D/g, "");
                setWhatsappAvulso(apenasNumeros);
              }}
              placeholder="91999998888"
              maxLength={11}
              className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-xl p-3 text-[#27272A] font-bold focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#71717A] uppercase mb-2">Rua (Opcional)</label>
              <input
                type="text"
                value={ruaAvulso}
                onChange={(e) => setRuaAvulso(e.target.value.toUpperCase())}
                className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-xl p-3 text-[#27272A] font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#71717A] uppercase mb-2">Número (Opcional)</label>
              <input
                type="text"
                value={numeroAvulso}
                onChange={(e) => setNumeroAvulso(e.target.value.toUpperCase())}
                className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-xl p-3 text-[#27272A] font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[#71717A] uppercase mb-2">Ponto de Referência (Opcional)</label>
            <input
              type="text"
              value={referenciaAvulso}
              onChange={(e) => setReferenciaAvulso(e.target.value.toUpperCase())}
              className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-xl p-3 text-[#27272A] font-bold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#71717A] uppercase mb-2">Observação (Opcional)</label>
            <textarea
              value={observacaoAvulso}
              onChange={(e) => setObservacaoAvulso(e.target.value.toUpperCase())}
              className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-xl p-3 text-[#27272A] font-bold focus:outline-none focus:border-orange-500 resize-none h-20"
            />
          </div>

          {/* 🕒 HORÁRIO */}
          <div className="relative">
            <label className="block text-xs font-black text-[#71717A] uppercase mb-3 text-center">
              Horário de Entrega
            </label>
            <button
              type="button"
              onClick={() => setMostrarDropdownHora(!mostrarDropdownHora)}
              className={`w-full border-2 rounded-xl p-3 text-center font-black text-lg flex justify-center items-center gap-2 shadow-sm transition-all ${
                horarioAvulso && horarioAvulso !== "0:00"
                  ? "bg-orange-500 border-orange-600 text-white"
                  : "bg-[#FFFFFF] border-orange-500 text-orange-600 hover:border-orange-600"
              }`}
            >
              <span className="tracking-wider">{horarioAvulso === "0:00" ? "Selecione o horário" : horarioAvulso}</span> 
              <span>⏱</span>
            </button>
            {mostrarDropdownHora && (
              <div className="absolute z-10 mt-2 w-full bg-[#FFFAF5] border border-[#F3F4F6] rounded-xl shadow-2xl p-3 grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {OPCOES_HORARIOS.map((hora) => (
                  <button
                    key={hora}
                    type="button"
                    onClick={() => {
                      setHorarioAvulso(hora)
                      setMostrarDropdownHora(false)
                    }}
                    className={`p-2 rounded-lg border-2 text-center font-black text-sm transition-all transform hover:scale-105 active:scale-95 ${
                      horarioAvulso === hora 
                        ? "bg-orange-500 border-orange-600 text-white shadow-md" 
                        : "border-orange-200 bg-white hover:bg-orange-100 hover:border-orange-400 text-[#27272A]"
                    }`}
                  >
                    {hora}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 💳 FORMA DE PAGAMENTO */}
          <div>
            <label className="block text-xs font-black text-[#71717A] uppercase mb-2 text-center">Forma de Pagamento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPagamentoAvulso("Pix")}
                className={`p-3 rounded-xl font-black uppercase border-2 transition-all text-base tracking-wider ${
                  pagamentoAvulso === "Pix" 
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-md" 
                    : "bg-[#FFFFFF] text-[#71717A] border-[#F3F4F6] hover:bg-emerald-50/50"
                }`}
              >
                💳 Pix
              </button>
              <button
                type="button"
                onClick={() => setPagamentoAvulso("Dinheiro")}
                className={`p-3 rounded-xl font-black uppercase border-2 transition-all text-base tracking-wider ${
                  pagamentoAvulso === "Dinheiro" 
                    ? "bg-amber-400 text-white border-amber-500 shadow-md" 
                    : "bg-[#FFFFFF] text-[#71717A] border-[#F3F4F6] hover:bg-amber-50/50"
                }`}
              >
                💵 Dinheiro
              </button>
            </div>
          </div>

          {/* 💰 TROCO - SÓ APARECE SE FOR DINHEIRO */}
          {pagamentoAvulso === "Dinheiro" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-[#71717A] uppercase mb-2">Valor Recebido</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={trocoParaAvulso || ""}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, "");
                    if (!valor) {
                      setTrocoParaAvulso("");
                      return;
                    }
                    const valorNumerico = Number(valor) / 100;
                    setTrocoParaAvulso(valorNumerico.toFixed(2).replace(".", ","));
                  }}
                  placeholder="0,00"
                  className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-xl p-3 text-[#27272A] font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <p className="text-xs font-black text-amber-700 uppercase mb-1">Troco</p>
                <p className="font-bold text-lg">
                  {trocoAvulsoCalculado > 0 
                    ? `R$ ${trocoAvulsoCalculado.toFixed(2).replace(".", ",")}` 
                    : trocoAvulsoCalculado === 0 
                      ? "SEM TROCO" 
                      : "Valor insuficiente"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 🛒 PRODUTOS E VALOR TOTAL */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-orange-400 uppercase tracking-wider text-center">Produtos</h3>
          
          {produtos.map((produto) => {
            const quantidade = (itensAvulsos as any)[produto.chave] || 0;
            const selecionado = quantidade > 0;
            return (
              <div 
                key={produto.id} 
                className={`flex items-center justify-between border rounded-xl p-4 transition-all ${
                  produto.disponivel !== false 
                    ? (selecionado ? "bg-amber-100/70 border-amber-400 shadow-md" : "bg-[#FFFFFF] border-[#F3F4F6]") 
                    : "border-red-800/40 opacity-40 grayscale bg-[#FFFFFF]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{produto.icone}</span>
                  <div>
                    <p className={`font-bold ${produto.disponivel !== false ? "text-[#27272A]" : "text-[#71717A] line-through"}`}>
                      {produto.nome}
                      {selecionado && <span className="text-orange-600 font-black text-sm ml-2">✅ SELECIONADO</span>}
                    </p>
                    <p className={`text-lg font-black tracking-wider mt-1 ${produto.disponivel !== false ? "text-emerald-600 drop-shadow-sm" : "text-zinc-500"}`}>
                      R$ {produto.preco.toFixed(2)}
                    </p>
                    {produto.disponivel === false && (
                      <span className="text-[10px] font-black text-red-400 uppercase mt-1 block">❌ Indisponível</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => alterarQtdAvulso(produto.chave, -1)}
                    disabled={produto.disponivel === false}
                    className="w-8 h-8 bg-[#FFEDD5] hover:bg-[#FFF7ED] rounded-lg flex items-center justify-center font-black text-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-black text-lg">
                    {quantidade}
                  </span>
                  <button
                    type="button"
                    onClick={() => alterarQtdAvulso(produto.chave, 1)}
                    disabled={produto.disponivel === false}
                    className="w-8 h-8 bg-[#FFEDD5] hover:bg-[#FFF7ED] rounded-lg flex items-center justify-center font-black text-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}

          {/* ✅ VALOR TOTAL */}
          <div className="mt-6 p-5 bg-[#FFFBEB] border border-emerald-400/40 rounded-xl shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-base font-black text-orange-700 uppercase tracking-wider">Valor Total</span>
            <span className="text-3xl font-black text-emerald-600 drop-shadow-sm">
  R$ {isNaN(valorTotalAvulsoNumerico) ? "0,00" : valorTotalAvulso}
</span>
            </div>
          </div>

          {/* 📋 AÇÕES */}
          <div className="p-4 bg-[#FFFFFF] border border-orange-500/30 rounded-xl mt-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  // ✅ FUNÇÃO COM TEXTO LIMPO, SEM EMOJIS
                  const gerarResumoPedidoWhatsApp = () => {
                    let enderecoCompleto = "";
                    if (ruaAvulso || numeroAvulso || referenciaAvulso) {
                      enderecoCompleto = `${ruaAvulso || ""} ${numeroAvulso ? `, Nº ${numeroAvulso}` : ""} ${referenciaAvulso ? `- ${referenciaAvulso}` : ""}`.trim();
                    }

                    let mensagem = `Olá ${nomeAvulso}.\n`;
                    mensagem += `Seu pedido foi recebido e já está sendo preparado!\n\n`;
                    mensagem += `RESUMO DO PEDIDO\n`;
                    mensagem += `----------------------------------------\n\n`;
                    mensagem += `CLIENTE: ${nomeAvulso}\n`;
                    mensagem += enderecoCompleto ? `ENDEREÇO: ${enderecoCompleto}\n` : "";
                    mensagem += observacaoAvulso ? `OBSERVAÇÃO: ${observacaoAvulso}\n` : "";
                    mensagem += `HORÁRIO: ${horarioAvulso}\n`;
                    mensagem += `FORMA DE PAGAMENTO: ${pagamentoAvulso}\n`;

                    if (pagamentoAvulso === "Dinheiro") {
                      mensagem += `TROCO: ${trocoAvulsoCalculado > 0 ? `R$ ${trocoAvulsoCalculado.toFixed(2).replace(".", ",")}` : "SEM TROCO"}\n`;
                    }

                    mensagem += `----------------------------------------\n`;
                    mensagem += `ITENS DO PEDIDO\n`;

                    let temItens = false;
                    Object.entries(itensAvulsos).forEach(([chave, qtd]: any) => {
                      if (qtd > 0) {
                        const prod = produtos.find(p => p.chave === chave);
                        if (prod) {
                          mensagem += `${qtd}x ${prod.nome} - R$ ${(prod.preco * qtd).toFixed(2).replace(".", ",")}\n`;
                          temItens = true;
                        }
                      }
                    });

                    if (!temItens) {
                      mensagem += `NENHUM ITEM CADASTRADO\n`;
                    }

                    mensagem += `----------------------------------------\n`;
                    mensagem += `VALOR TOTAL: R$ ${valorTotalAvulso.replace(".", ",")}\n\n`;
                    mensagem += `Agradecemos a sua preferência!`;

                    return mensagem;
                  };
const resumo = gerarResumoPedidoWhatsApp();
navigator.clipboard.writeText(resumo).catch(err => console.log("Erro ao copiar:", err));

const numeroLimpo = (whatsappAvulso || "").replace(/\D/g, "");
const textoCodificado = encodeURIComponent(resumo);

// ✅ Definição inteligente das URLs Nativa e Web
let urlNativa = "";
let urlWeb = "";

if (numeroLimpo.length >= 10) {
  urlNativa = `whatsapp://send?phone=55${numeroLimpo}&text=${textoCodificado}`;
  urlWeb = `https://wa.me/55${numeroLimpo}?text=${textoCodificado}`;
} else {
  urlNativa = `whatsapp://send?text=${textoCodificado}`;
  urlWeb = `https://api.whatsapp.com/send?text=${textoCodificado}`;
}

// ✅ Fluxo nativo para Android Studio (Capacitor) sem tela branca
if (typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.()) {
  (async () => {
    try {
      const { AppLauncher } = await import('@capacitor/app-launcher');
      
      // Verifica se o WhatsApp está disponível no sistema do aparelho
      const canOpen = await AppLauncher.canOpenUrl({ url: urlNativa });
      if (canOpen.value) {
        await AppLauncher.openUrl({ url: urlNativa });
      } else {
        // Fallback: joga para o navegador padrão do celular (evita carregar WebView interna)
        window.open(urlWeb, "_system");
      }
    } catch {
      // Garantia final: abre externamente caso o AppLauncher falhe
      window.open(urlWeb, "_system");
    }
  })();
} else {
  // Comportamento para Web / Desktop tradicional
  window.open(urlWeb, "_blank", "noopener,noreferrer");
}

setMostrarModalCopiado(true);
setTimeout(() => setMostrarModalCopiado(false), 2000);
                }}
                className="py-3 bg-green-500/10 text-green-600 border border-green-500/20 rounded-xl font-black text-xs uppercase hover:bg-green-500/20 transition-all w-full"
              >
                📋 Copiar / Abrir WhatsApp
              </button>
            </div>

            {/* ✅ BOTÕES DE STATUS CORRIGIDOS */}
            <div className="text-center mb-3">
              <span className="text-sm font-bold text-[#71717A] uppercase">Escolha o status para finalizar:</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                disabled={!funcionamentoAberta || valorTotalAvulsoNumerico <= 0}
                onClick={() => { setStatusAvulsoSelecionado("pago"); setMostrarResumoFinalAvulso(true); }}
                className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                💲 Pago
              </button>
              <button
                type="button"
                disabled={!funcionamentoAberta || valorTotalAvulsoNumerico <= 0}
                onClick={() => { setStatusAvulsoSelecionado("espera"); setMostrarResumoFinalAvulso(true); }}
                className="py-3 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                📦 Em Espera
              </button>
              <button
                type="button"
                disabled={!funcionamentoAberta || valorTotalAvulsoNumerico <= 0}
                onClick={() => { setStatusAvulsoSelecionado("pendente"); setMostrarResumoFinalAvulso(true); }}
                className="py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                ⏳ Pendente
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
)}

{/* ✅ MODAL RESUMO AVULSO */}
{mostrarResumoFinalAvulso && statusAvulsoSelecionado && (
  <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white border-4 border-orange-500 w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4 border-b-2 border-orange-200 pb-3">
        <h3 className="text-lg font-black text-orange-600 uppercase">Resumo do Pedido</h3>
        <button onClick={() => { setMostrarResumoFinalAvulso(false); setStatusAvulsoSelecionado(null); }} className="w-8 h-8 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center text-orange-700 text-lg font-black">X</button>
      </div>

      <div className="space-y-3">
        <div className="bg-orange-50 rounded-2xl p-4 border-2 border-orange-200 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide">Cliente</p>
              <p className="font-black text-xl text-black uppercase">{nomeAvulso || "NÃO INFORMADO"}</p>
            </div>
            <span className={`px-4 py-2 rounded-xl text-sm font-black uppercase border-2 ${pagamentoAvulso === "Pix" ? "bg-emerald-100 text-emerald-800 border-emerald-400" : "bg-amber-100 text-amber-800 border-amber-400"}`}>
              {pagamentoAvulso}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide">Horario</p>
              <p className="font-black text-xl text-orange-600">{horarioAvulso}</p>
            </div>
            <div>
              <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide">Valor Total</p>
              <p className="font-black text-xl text-emerald-700">R$ {valorTotalAvulso}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-orange-200">
          <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide mb-1">Endereco</p>
          <p className="font-black text-base text-black">{ruaAvulso || "NÃO INFORMADO"}, Nº {numeroAvulso || "-"}{referenciaAvulso ? ` - ${referenciaAvulso}` : ""}</p>
          {observacaoAvulso && <p className="text-sm font-bold text-red-700 bg-red-100 border border-red-300 p-3 rounded-xl mt-2">{observacaoAvulso}</p>}
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-orange-200">
          <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide mb-2">Itens</p>
          {Object.entries(itensAvulsos).filter(([_, qtd]) => (qtd as number) > 0).length === 0 ? (
            <p className="text-zinc-400 font-bold text-center py-3">Nenhum item selecionado</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(itensAvulsos).map(([chave, qtd]) => {
                if ((qtd as number) <= 0) return null;
                const prod = produtos.find(p => p.chave === chave);
                return (
                  <div key={chave} className="flex justify-between items-center bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                    <span className="font-black text-base text-black">{prod?.nome || chave}</span>
                    <span className="font-black text-orange-600 text-base">{(qtd as number)}x</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {pagamentoAvulso === "Dinheiro" && trocoAvulsoCalculado > 0 && (
          <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-300 text-center">
            <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide">Troco</p>
            <p className="text-xl font-black text-amber-700">R$ {trocoAvulsoCalculado.toFixed(2)}</p>
          </div>
        )}

        <div className="bg-zinc-50 rounded-2xl p-4 border-2 border-zinc-300 text-center">
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Status</p>
          <p className="text-xl font-black mt-1 uppercase">
            {statusAvulsoSelecionado === "pago" && <span className="text-emerald-600">PAGO</span>}
            {statusAvulsoSelecionado === "espera" && <span className="text-blue-600">EM ESPERA</span>}
            {statusAvulsoSelecionado === "pendente" && <span className="text-amber-600">PENDENTE</span>}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => { setMostrarResumoFinalAvulso(false); setStatusAvulsoSelecionado(null); }}
            className="flex-1 py-3.5 bg-zinc-300 hover:bg-zinc-400 text-zinc-700 font-black uppercase text-sm rounded-xl transition-all"
          >
            Voltar
          </button>
          <button
            onClick={() => {
              const status = statusAvulsoSelecionado;
              setMostrarResumoFinalAvulso(false);
              setStatusAvulsoSelecionado(null);
              finalizarPedidoAvulsoComStatusRoteado(status);
            }}
            className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-sm rounded-xl transition-all shadow-md"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* ================================================== */}
{/* ================= ABA: PENDÊNCIAS =============== */}
{/* ================================================== */}
{abaAtiva === "pendencias" && (
  <div className="bg-[#FFFAF5] border border-[#F3F4F6] rounded-3xl p-6 shadow-xl">
    <h2 className="text-lg font-black text-red-400 uppercase tracking-wider mb-6">
      ⏳ Pedidos Pendentes de Pagamento ({pedidosPendentes.length})
    </h2>

    {pedidosPendentes.length === 0 ? (
      <div className="text-center py-12 text-zinc-500 font-bold uppercase">
        ✅ Nenhuma pendência no momento
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pedidosPendentes.map((pedido) => (
          <div 
            key={pedido.id} 
            className="bg-[#FFFFFF] border border-red-500/30 rounded-2xl p-5"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                {/* ✅ NOME EM NEGRITO */}
                <h3 className="font-black text-lg uppercase text-[#27272A] font-bold">{pedido.nome}</h3>
                <p className="text-xs text-zinc-500 font-semibold"></p>
                {/* ✅ HORA EM VERMELHO E MAIOR */}
                <p className="text-red-500 text-sm font-black mt-1">⏱ {pedido.horario}</p>
              </div>
              {/* ✅ STATUS EM NEGRITO */}
              <span className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                NÃO PAGO
              </span>
            </div>

            {/* ✅ ENDEREÇO EM NEGRITO */}
            <p className="text-[#71717A] text-sm mb-3 font-bold">{pedido.endereco}</p>

            <div className="flex justify-between items-center mt-4">
              {/* ✅ VALOR EM NEGRITO */}
              <p className="text-lg font-black text-emerald-400 font-bold">R$ {pedido.valorTotal.toFixed(2)}</p>
              <div className="flex gap-2">
                {/* ✅ BOTÃO COBRAR CORRIGIDO: SEM ALERTA, FUNCIONA DOS DOIS JEITOS */}
                <button
                  onClick={() => {
                    if (pedido.telefone) {
                      const numeroLimpo = pedido.telefone.replace(/\D/g, "");
                      const mensagemCobranca = `Olá ${pedido.nome}.
Seu pedido da Tapicuz está pendente de pagamento.
Valor total: R$ ${pedido.valorTotal.toFixed(2).replace('.', ',')}.
Por favor, efetue o pagamento quando puder.
Agradecemos a preferência.`;
                      const url = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagemCobranca)}`;
                      if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
  (async () => {
    try {
      const { AppLauncher } = await import('@capacitor/app-launcher');
      await AppLauncher.openUrl({ url });
    } catch {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
    }
  })();
} else {
  window.open(url, "_blank", "noopener,noreferrer");
};;
                    } else {
                      const mensagemCobranca = `Olá ${pedido.nome}.
Seu pedido da Tapicuz está pendente de pagamento.
Valor total: R$ ${pedido.valorTotal.toFixed(2).replace('.', ',')}.
Por favor, efetue o pagamento quando puder.
Agradecemos a preferência.`;
                      const url = `https://wa.me/?text=${encodeURIComponent(mensagemCobranca)}`;
                      if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
  (async () => {
    try {
      const { AppLauncher } = await import('@capacitor/app-launcher');
      await AppLauncher.openUrl({ url });
    } catch {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
    }
  })();
} else {
  window.open(url, "_blank", "noopener,noreferrer");
};;
                    }
                  }}
                  className="px-3 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-black uppercase hover:bg-green-500/20 transition-all"
                >
                  📲 Cobrar
                </button>
                {/* ✅ BOTÃO MARCAR PAGO COM COR DIFERENCIADA (AZUL) */}
                <button
                  onClick={() => marcarComoPago(pedido.id)}
                  className="px-3 py-2 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-lg text-xs font-black uppercase hover:bg-blue-500/20 transition-all"
                >
                  ✅ Marcar Pago
                </button>
                {/* 📒 MOVER PRA FIADO */}
                <button
                  onClick={() => moverParaFiado(pedido)}
                  className="px-3 py-2 bg-purple-500/10 text-purple-600 border border-purple-500/20 rounded-lg text-xs font-black uppercase hover:bg-purple-500/20 transition-all"
                >
                  📒 Fiado
                </button>
                <button
                  onClick={() => setPedidoDetalhado(pedido)}
                  className="px-3 py-2 bg-[#FFEDD5] hover:bg-[#FFF7ED] rounded-lg text-xs font-black uppercase"
                >
                  👁️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

{/* ================================================== */}
{/* ================= ABA: FIADOS ================== */}
{/* ================================================== */}
{abaAtiva === "fiados" && (
  <div className="bg-[#FFFAF5] border border-[#F3F4F6] rounded-3xl p-6 shadow-xl">
    <h2 className="text-lg font-black text-purple-400 uppercase tracking-wider mb-6">
      📒 Fiados ({fiados.filter(f => f.totalDevido > 0).length})
    </h2>

    {fiados.filter(f => f.totalDevido > 0).length === 0 ? (
      <div className="text-center py-12 text-zinc-500 font-bold uppercase">
        ✅ Nenhum fiado no momento
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fiados.filter(f => f.totalDevido > 0).map((pessoa) => (
          <div
            key={pessoa.id}
            className="bg-[#FFFFFF] border border-purple-500/30 rounded-2xl p-5"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-black text-lg uppercase text-[#27272A]">{pessoa.nome}</h3>
                {pessoa.telefone && (
                  <p className="text-xs text-zinc-500 font-semibold">📞 {pessoa.telefone}</p>
                )}
                {pessoa.endereco && (
                  <p className="text-xs text-zinc-500 font-semibold">📍 {pessoa.endereco}</p>
                )}
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                R$ {(pessoa.totalDevido || 0).toFixed(2)}
              </span>
            </div>

            <div className="space-y-1 mb-4">
              {pessoa.pedidos?.slice(-5).reverse().map((p: any, i: number) => (
                <div key={i} className="flex justify-between text-xs text-zinc-600 font-bold bg-zinc-50 rounded-lg px-3 py-1.5">
                  <span>📄 {new Date(p.data).toLocaleDateString("pt-BR")} {p.horario}</span>
                  <span>R$ {(p.valor || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {pessoa.pagamentos?.length > 0 && (
              <div className="mb-3 text-xs text-emerald-600 font-bold">
                💰 Pagamentos: {pessoa.pagamentos.map((pg: any) => `R$ ${pg.valor.toFixed(2)}`).join(" + ")}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              {pessoa.telefone && (
                <button
                  onClick={() => {
                    const numero = pessoa.telefone.replace(/\D/g, "");
                    const msg = `Olá ${pessoa.nome}, você tem um saldo pendente de R$ ${(pessoa.totalDevido || 0).toFixed(2).replace(".", ",")} na Tapicuz. Quando puder, faça o pagamento. Agradecemos!`;
                    const url = `https://wa.me/55${numero}?text=${encodeURIComponent(msg)}`;
                    if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
                      (async () => {
                        try { const { AppLauncher } = await import('@capacitor/app-launcher'); await AppLauncher.openUrl({ url }); }
                        catch { const { Browser } = await import('@capacitor/browser'); await Browser.open({ url }); }
                      })();
                    } else { window.open(url, "_blank", "noopener,noreferrer"); }
                  }}
                  className="flex-1 px-3 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-black uppercase hover:bg-green-500/20 transition-all"
                >
                  📲 Cobrar
                </button>
              )}
              <button
                onClick={() => {
                  setModalPagamentoFiado({ pessoa });
                  setValorPagamentoFiado("");
                }}
                className="flex-1 px-3 py-2 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-lg text-xs font-black uppercase hover:bg-blue-500/20 transition-all"
              >
                💰 Receber
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

{/* 📝 MODAL RECEBER FIADO */}
{modalPagamentoFiado && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#FFFAF5] border border-blue-500/30 w-full max-w-sm rounded-3xl p-6 space-y-5 shadow-2xl">
      <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider text-center">
        💰 Receber - {modalPagamentoFiado.pessoa.nome}
      </h3>
      <p className="text-center text-zinc-500 font-bold text-sm">
        Total devido: <span className="text-purple-600">R$ {(modalPagamentoFiado.pessoa.totalDevido || 0).toFixed(2)}</span>
      </p>
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="Valor recebido"
        value={valorPagamentoFiado}
        onChange={(e) => setValorPagamentoFiado(e.target.value)}
        className="w-full bg-white border border-blue-500/30 rounded-xl p-4 text-center text-lg font-black text-blue-700 focus:outline-none focus:border-blue-500"
        autoFocus
      />
      <div className="flex gap-3">
        <button
          onClick={() => { setModalPagamentoFiado(null); setValorPagamentoFiado(""); }}
          className="flex-1 py-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-black uppercase text-sm rounded-xl transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            const valor = parseFloat(valorPagamentoFiado);
            if (valor > 0) registrarPagamentoFiado(modalPagamentoFiado.pessoa.id, valor);
          }}
          disabled={!valorPagamentoFiado || parseFloat(valorPagamentoFiado) <= 0}
          className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-black uppercase text-sm rounded-xl transition-all disabled:opacity-50"
        >
          💰 Receber
        </button>
      </div>
    </div>
  </div>
)}

{/* ✅ MODAL DETALHES - ESTILO PRÉVIA AVULSO */}
{pedidoDetalhado && (
  <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div className="bg-white border-4 border-orange-500 w-full max-w-lg rounded-3xl p-4 sm:p-6 shadow-2xl my-4 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4 border-b-2 border-orange-200 pb-3">
        <h3 className="text-base sm:text-lg font-black text-orange-600 uppercase">Detalhes do Pedido</h3>
        <button onClick={() => setPedidoDetalhado(null)} className="w-8 h-8 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center text-orange-700 text-lg font-black">
          X
        </button>
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-2xl p-4 border-2 border-orange-200 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide">Cliente</p>
              <p className="font-black text-xl text-black uppercase">{pedidoDetalhado.nome}</p>
            </div>
            <span className={`px-4 py-2 rounded-xl text-sm font-black uppercase border-2 ${
              pedidoDetalhado.pagamento === "Pix" 
                ? "bg-emerald-100 text-emerald-800 border-emerald-400" 
                : "bg-amber-100 text-amber-800 border-amber-400"
            }`}>
              {pedidoDetalhado.pagamento}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide">Horario</p>
              <p className="font-black text-xl text-orange-600">{pedidoDetalhado.horario}</p>
            </div>
            <div>
              <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide">Valor Total</p>
              <p className="font-black text-xl text-emerald-700">R$ {pedidoDetalhado.valorTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-orange-200">
          <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide mb-1">Endereco</p>
          <p className="font-black text-base text-black">{pedidoDetalhado.endereco}</p>
          {pedidoDetalhado.observacao && (
            <p className="text-sm font-bold text-red-700 bg-red-100 border border-red-300 p-3 rounded-xl mt-2">{pedidoDetalhado.observacao}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-orange-200">
          <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide mb-2">Itens</p>
          {Object.entries(pedidoDetalhado.itens).filter(([_, qtd]) => (qtd as number) > 0).length === 0 ? (
            <p className="text-zinc-400 font-bold text-center py-3">Nenhum item selecionado</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(pedidoDetalhado.itens).map(([chave, qtd]) => {
                if ((qtd as number) <= 0) return null;
                return (
                    <div key={chave} className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-base text-black">{formatarNomeItem(chave)}</span>
                        <span className="font-black text-orange-600 text-base">{(qtd as number)}x</span>
                      </div>
                      {((pedidoDetalhado.observacoesItem as Record<string, string[]>)?.[chave] || []).map((obs: string, idx: number) => obs ? (
                        <p key={idx} className="text-xs text-zinc-500 italic mt-1 pl-1">{(qtd as number) > 1 ? `${idx + 1}x: ` : ""}{obs}</p>
                      ) : null)}
                    </div>
                );
              })}
            </div>
          )}
        </div>

        {pedidoDetalhado.pagamento === "Dinheiro" && (
          <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-300 text-center">
            <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide">Troco</p>
            <p className="text-xl font-black text-amber-700">
              {pedidoDetalhado.troco > 0 ? `R$ ${pedidoDetalhado.troco.toFixed(2)}` : "Sem Troco"}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {pedidoDetalhado.statusPagamento === "pendente" && (
            <button onClick={() => marcarComoPago(pedidoDetalhado.id)} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase rounded-xl transition-all shadow-md">
              Marcar como Pago
            </button>
          )}
          <button onClick={() => setPedidoDetalhado(null)} className="flex-1 py-3 bg-zinc-400 hover:bg-zinc-500 text-white font-black text-xs uppercase rounded-xl transition-all shadow-md">
            Voltar
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* ✅ MODAL OPÇÕES DO PEDIDO */}
{pedidoSelecionadoParaConcluir && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#FFFAF5] border border-orange-500/30 w-full max-w-sm rounded-3xl p-6 space-y-5 shadow-2xl">
      <h3 className="text-lg font-black text-orange-500 uppercase text-center tracking-wider">Opções do Pedido</h3>
      <p className="text-center text-[#71717A] font-bold text-sm">Escolha uma ação abaixo</p>

      {(() => {
        const p = pedidoSelecionadoParaConcluir;

        if (submenuAcoes === "principal") {
          const jaPago = p?.statusPagamento === "pago";
          return (
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  processarDecisaoPedidoExistente(jaPago, p);
                  setPedidoSelecionadoParaConcluir(null);
                  setSubmenuAcoes("principal");
                }}
                className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-base rounded-xl transition-all shadow-md"
              >
                ✅ CONCLUIR
              </button>
              <button
                onClick={() => setSubmenuAcoes("zap")}
                className="w-full py-5 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-base rounded-xl transition-all shadow-md"
              >
                📱 AVISOS
              </button>
            </div>
          );
        }

        if (submenuAcoes === "zap") {
          return (
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  if (!p.telefone) { alert("Cliente não informou telefone."); return; }
                  const numero = p.telefone.replace(/\D/g, "");
                  let msg = `Olá ${p.nome}.\nSeu pedido da Tapicuz foi recebido e já está sendo preparado!\n\n*=== RESUMO DO PEDIDO ===*\n\n*CLIENTE:* ${p.nome.toUpperCase()}\n*ENDEREÇO:* ${String(p.endereco || 'NÃO INFORMADO')}\n${p.observacao ? `*OBSERVAÇÃO:* ${p.observacao}\n` : ""}*HORÁRIO:* ${p.horario}\n*PAGAMENTO:* ${p.pagamento}\n`;
                  if (p.pagamento === 'Dinheiro') {
                    const vt = p.troco;
                    msg += `*TROCO:* ${vt > 0 ? `R$ ${vt.toFixed(2).replace('.', ',')}` : "SEM TROCO"}\n`;
                  }
                  msg += `----------------------------------------\n*ITENS DO PEDIDO*\n`;
                  let temItens = false;
                  if (p.itens && typeof p.itens === 'object' && !Array.isArray(p.itens)) {
                    Object.entries(p.itens).forEach(([chave, qtd]) => {
                      if (typeof qtd === 'number' && qtd > 0) {
                        const prod = produtos.find(pr => pr.chave === chave);
                        if (prod) { msg += `• ${qtd}x ${prod.nome} - R$ ${(prod.preco * (qtd as number)).toFixed(2).replace('.', ',')}\n`; temItens = true; }
                      }
                    });
                  }
                  if (!temItens && p.itens && Array.isArray(p.itens)) {
                    p.itens.forEach((item: any) => {
                      if (item.quantidade > 0) { msg += `• ${item.quantidade}x ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}\n`; temItens = true; }
                    });
                  }
                  if (!temItens) { msg += `• NENHUM ITEM CADASTRADO\n`; }
                   msg += `----------------------------------------\n*VALOR TOTAL:* R$ ${p.valorTotal.toFixed(2).replace('.', ',')}\n\nAgradecemos muito a preferência!`;
                  const url = `https://wa.me/55${numero}?text=${encodeURIComponent(msg)}`;
                  if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
                    (async () => {
                      try { const { AppLauncher } = await import('@capacitor/app-launcher'); await AppLauncher.openUrl({ url }); }
                      catch { const { Browser } = await import('@capacitor/browser'); await Browser.open({ url }); }
                    })();
                  } else { window.open(url, "_blank", "noopener,noreferrer"); }
                  setPedidoSelecionadoParaConcluir(null);
                  setSubmenuAcoes("principal");
                  const el = document.createElement('div');
                  el.innerText = 'RESUMO ENVIADO COM SUCESSO!';
                  el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#10b981;color:white;font-weight:900;font-size:14px;padding:12px 24px;border-radius:12px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);border:2px solid #059669;text-transform:uppercase;letter-spacing:0.5px;';
                  document.body.appendChild(el);
                  setTimeout(() => el.remove(), 2500);
                }}
                className="w-full py-5 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-base rounded-xl transition-all shadow-md"
              >
                📋 ENVIAR RESUMO
              </button>
              <button
                onClick={() => {
                  if (!p.telefone) { alert("Cliente não informou telefone."); return; }
                  const numero = p.telefone.replace(/\D/g, "");
                  const msg = `*SAIU PARA ENTREGA*\n\nOlá ${p.nome}!\n\nSeu pedido da Tapicuz acabou de sair e em instantes chegará até você.\n\nAgradecemos a preferência.`;
                  const url = `https://wa.me/55${numero}?text=${encodeURIComponent(msg)}`;
                  if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
                    (async () => {
                      try { const { AppLauncher } = await import('@capacitor/app-launcher'); await AppLauncher.openUrl({ url }); }
                      catch { const { Browser } = await import('@capacitor/browser'); await Browser.open({ url }); }
                    })();
                  } else { window.open(url, "_blank", "noopener,noreferrer"); }
                  setPedidoSelecionadoParaConcluir(null);
                  setSubmenuAcoes("principal");
                  const el = document.createElement('div');
                  el.innerText = 'AVISO DE SAÍDA ENVIADO!';
                  el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#f59e0b;color:white;font-weight:900;font-size:14px;padding:12px 24px;border-radius:12px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);border:2px solid #d97706;text-transform:uppercase;letter-spacing:0.5px;';
                  document.body.appendChild(el);
                  setTimeout(() => el.remove(), 2500);
                }}
                className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-base rounded-xl transition-all shadow-md"
              >
                🚀 AVISAR SAÍDA
              </button>
              <button
                onClick={() => setSubmenuAcoes("principal")}
                className="w-full py-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold uppercase text-sm rounded-xl transition-all"
              >
                ← Voltar
              </button>
            </div>
          );
        }

        return null;
      })()}

      <button
        onClick={() => {
          setPedidoSelecionadoParaConcluir(null);
          setSubmenuAcoes("principal");
        }}
        className="w-full py-3 bg-[#FFEDD5] hover:bg-[#FFF7ED] rounded-xl font-black uppercase transition-all text-base"
      >
        Cancelar
      </button>
    </div>
  </div>
)}

{/* ================================================== */}
{/* 🆕 ABA: DEMANDAS - FUNCIONANDO 100% 🆕 */}
{/* ================================================== */}
{abaAtiva === "demandas" && (
  <div className="bg-[#FFFAF5] border border-amber-500/30 rounded-3xl p-6 shadow-xl">
    <div className="mb-6 text-center"> {/* ✅ Centralizei todo o cabeçalho aqui */}
      <h2 className="text-lg font-black text-amber-600 uppercase tracking-wider flex items-center justify-center gap-2">
        <span>📋</span> Demanda de Produção - Total Geral
      </h2>
      
    </div>

    {/* 🆕 CORREÇÃO: Agora mostra SOMENTE o que tem quantidade > 0 */}
    {Object.values(demandasProducao).every(q => q === 0) ? (
      <div className="text-center py-16 text-zinc-500 font-bold uppercase">
        ✅ Nenhuma demanda no momento
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {Object.entries(demandasProducao)
          .filter(([_, qtd]) => qtd > 0) // 🆕 SÓ MOSTRA O QUE TEM QUE FAZER!
          .sort((a, b) => b[1] - a[1])
          .map(([chave, qtd]) => (
            <div key={chave} className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#F3F4F6] text-center shadow-md">
              <p className="text-4xl font-black text-orange-500 mb-2">{qtd}</p>
              <p className="text-sm font-bold text-[#71717A] uppercase">{formatarNomeItem(chave)}</p>
            </div>
          ))}
      </div>
    )}
  </div>
)}

{/* ================================================== */}
{/* 🆕 ABA: RANKING 🆕 */}
{/* ================================================== */}
{abaAtiva === "ranking" && (
  <div className="bg-[#FFFAF5] border border-orange-500/30 rounded-3xl p-6 shadow-xl">
    <div className="mb-6">
      <h2 className="text-lg font-black text-orange-400 uppercase tracking-wider flex items-center gap-2">
        <span>📈</span> Ranking de Produtos Mais Vendidos
      </h2>
      <p className="text-zinc-500 text-xs mt-1">Classificação em tempo real por quantidade vendida e faturamento.</p>
    </div>

    {(() => {
      const todosPedidos = [
        ...pedidosPagos,
        ...pedidosPendentes
      ]
      const dadosRanking: { [key: string]: { nome: string; icone: string; qtd: number; valor: number } } = {};

      produtos.forEach(prod => {
        dadosRanking[prod.chave] = { nome: prod.nome, icone: prod.icone, qtd: 0, valor: 0 };
      });

      todosPedidos.forEach(ped => {
        Object.entries(ped.itens).forEach(([chave, qtd]) => {
          if(dadosRanking[chave]) {
            dadosRanking[chave].qtd += Number(qtd);
            const preco = produtos.find(p => p.chave === chave)?.preco || 0;
            dadosRanking[chave].valor += Number(qtd) * preco;
          }
        });
      });

      const rankingArray = Object.values(dadosRanking).sort((a,b) => b.qtd - a.qtd);

      return (
        <>
          {rankingArray.every(item => item.qtd === 0) ? (
            <div className="text-center py-16 text-zinc-500 font-bold uppercase">
              📉 Nenhuma venda registrada ainda
            </div>
          ) : (
            <>
              {/* Cards no móvel, tabela no desktop */}
              <div className="grid grid-cols-1 sm:hidden gap-3">
                {rankingArray.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 bg-white rounded-2xl p-4 border shadow-sm ${
                      index === 0 ? "border-amber-400 ring-2 ring-amber-200" :
                      index === 1 ? "border-zinc-300 ring-2 ring-zinc-200" :
                      index === 2 ? "border-orange-300 ring-2 ring-orange-200" :
                      "border-[#F3F4F6]"
                    }`}
                  >
                    <div className="text-2xl w-10 text-center flex-shrink-0">
                      {index === 0 && "🥇"}
                      {index === 1 && "🥈"}
                      {index === 2 && "🥉"}
                      {index > 2 && <span className="font-black text-base text-[#71717A]">#{index + 1}</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{item.icone}</span>
                      <span className="font-bold text-sm truncate">{item.nome}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-lg text-orange-500">{item.qtd}</div>
                      <div className="text-xs font-bold text-emerald-600">R$ {item.valor.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabela no desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#F3F4F6]">
                      <th className="p-3 text-xs font-black text-[#71717A] uppercase text-center">Posição</th>
                      <th className="p-3 text-xs font-black text-[#71717A] uppercase">Produto</th>
                      <th className="p-3 text-xs font-black text-[#71717A] uppercase text-center">Quantidade</th>
                      <th className="p-3 text-xs font-black text-[#71717A] uppercase text-right">Total Faturado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {rankingArray.map((item, index) => (
                      <tr key={index} className={`hover:bg-[#FFEDD5]/30 transition-colors ${index < 3 ? "font-black" : ""}`}>
                        <td className="p-4 text-center">
                          {index === 0 && "🥇"}
                          {index === 1 && "🥈"}
                          {index === 2 && "🥉"}
                          {index > 2 && <span className="font-bold text-lg text-[#71717A]">#{index+1}</span>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icone}</span>
                            <span className="font-bold text-lg">{item.nome}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-black text-xl text-orange-400">{item.qtd}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-black text-lg text-emerald-400">R$ {item.valor.toFixed(2)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )
    })()}
  </div>
)}

{/* ================================================== */}
{/* ================= ABA: VENDAS PAGAS ============= */}
{/* ================================================== */}
{abaAtiva === "historico" && (
  <div className="bg-[#FFFAF5] border border-[#F3E9DD] rounded-3xl p-6 shadow-lg">
    <h2 className="text-lg font-black text-orange-500 uppercase tracking-wider mb-6 flex items-center gap-2">
      Vendas Pagas <span className="text-orange-400">({pedidosPagos.length})</span>
    </h2>

    {pedidosPagos.length === 0 ? (
      <div className="text-center py-14 text-zinc-500 font-medium uppercase text-sm">
        Nenhuma venda registrada no momento
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pedidosPagos.map((pedido) => (
          <div
            key={pedido.id}
            className="bg-white border border-emerald-300/50 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-black text-base uppercase text-zinc-800">{pedido.nome}</h3>
                <p className="text-amber-700 font-bold text-sm mt-0.5">{pedido.horario}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border ${
                pedido.pagamento === "Pix"
                  ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                  : "bg-blue-100 text-blue-700 border-blue-300"
              }`}>
                {pedido.pagamento}
              </span>
            </div>

            <p className="text-zinc-500 text-sm font-medium truncate mb-3">{pedido.endereco}</p>

            <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
              <div>
                <span className="font-mono font-black text-emerald-600 text-lg">
                  R$ {pedido.valorTotal.toFixed(2)}
                </span>
                <span className="ml-2 text-[10px] font-bold uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Concluido
                </span>
              </div>
              <button
                onClick={() => setPedidoDetalhado(pedido)}
                className="px-4 py-2 bg-orange-100 hover:bg-orange-200 active:bg-orange-300 rounded-lg text-xs font-bold uppercase text-orange-800 transition-colors"
              >
                Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

{/* ================================================== */}
{/* ================= ABA: CAIXA GERAL =============== */}
{/* ================================================== */}
{abaAtiva === "caixa" && (
  <div className="space-y-6">
    {/* Resumo do Turno ATUAL (o que está aberto agora) */}
    <div className="bg-[#FFFAF5] border border-[#F3F4F6] rounded-3xl p-6 shadow-xl">
      {/* ✅ TÍTULO CENTRALIZADO ✅ */}
      <h2 className="text-lg font-black text-orange-400 uppercase tracking-wider mb-6 text-center">
        💰 Resumo do Turno Atual
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#FFFFFF] border border-[#F3F4F6] rounded-2xl p-5 text-center">
          <p className="text-xs font-black text-zinc-500 uppercase mb-1">Total Faturado</p>
          <p className="text-2xl font-black text-emerald-600">R$ {faturamentoTotal.toFixed(2)}</p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#F3F4F6] rounded-2xl p-5 text-center">
          <p className="text-xs font-black text-zinc-500 uppercase mb-1">Despesas</p>
          <p className="text-2xl font-black text-red-500">R$ {totalDespesasAcumuladas.toFixed(2)}</p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#F3F4F6] rounded-2xl p-5 text-center">
          <p className="text-xs font-black text-zinc-500 uppercase mb-1">Saldo Líquido</p>
          <p className="text-2xl font-black text-orange-500">R$ {saldoLiquidoAtual.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#FFFFFF] border border-teal-500/30 rounded-2xl p-4 text-center">
          <p className="text-xs font-black text-teal-600 uppercase mb-1">Recebido via PIX</p>
          <p className="text-xl font-black text-teal-700">R$ {totalPix.toFixed(2)}</p>
        </div>
        <div className="bg-[#FFFFFF] border border-amber-500/30 rounded-2xl p-4 text-center">
          <p className="text-xs font-black text-amber-600 uppercase mb-1">Recebido em Dinheiro</p>
          <p className="text-xl font-black text-amber-700">R$ {totalDinheiro.toFixed(2)}</p>
        </div>
      </div>

      {/* ✅ SÓ ESSA PARTE FOI ALTERADA: CAMPO E BOTÃO DE DESPESA ✅ */}
      <form onSubmit={lancarDespesaSimples} className="mb-6 p-4 bg-[#FFFFFF] border border-[#F3F4F6] rounded-xl">
        <h3 className="text-sm font-black text-red-400 uppercase mb-3 text-center">Lançar Despesa</h3>
        <div className="flex flex-col gap-2 w-full">
          <input
            type="text"
            inputMode="decimal"
            value={valorDespesaInput}
            onChange={(e) => {
              const valor = e.target.value.replace(/\D/g, "");
              if (!valor) {
                setValorDespesaInput("");
                return;
              }
              const valorNumerico = Number(valor) / 100;
              setValorDespesaInput(valorNumerico.toFixed(2).replace(".", ","));
            }}
            placeholder="0,00"
            className="w-full bg-[#FFFAF5] border border-zinc-300 rounded-lg p-2.5 text-sm text-[#27272A] font-bold focus:outline-none focus:border-red-400"
          />
          <button
            type="submit"
            className="w-full py-2 bg-red-500/10 text-red-600 border border-red-500/20 rounded-lg font-black text-xs uppercase hover:bg-red-500/20 transition-all"
          >
            Registrar
          </button>
        </div>
      </form>
      {/* ✅ FIM DA ALTERAÇÃO — O RESTO ESTÁ IGUAL AO SEU ✅ */}

      <button
        type="button"
        onClick={() => setModalConfirmarTurno(true)}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm uppercase rounded-xl transition-all shadow-lg"
      >
        🗂️ Arquivar Turno e Zerar Contadores
      </button>

      <button
        type="button"
        onClick={() => setModalConfirmarApagarHistorico(true)}
        className="w-full mt-3 py-3 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl font-black text-sm uppercase hover:bg-red-500/20 transition-all"
      >
        🗑️ Apagar Histórico de Fechamentos
      </button>
      
    </div>
    {/* ✅ HISTÓRICO: TUDO IGUAL AO SEU, PERFEITO */}
    <div className="bg-[#FFFAF5] border border-[#F3F4F6] rounded-3xl p-5 shadow-xl">
      {/* ✅ TÍTULO CENTRALIZADO ✅ */}
      <h2 className="text-lg font-black text-orange-400 uppercase tracking-wider mb-5 text-center flex justify-center items-center gap-2">
        📚 Histórico de Fechamentos
      </h2>

      {historicoCaixas.length === 0 ? (
        <div className="text-center py-10 text-zinc-500 font-bold uppercase text-xs tracking-wider">
          Nenhum fechamento registrado ainda
        </div>
      ) : (
        <div className="space-y-4">
          {/* ✅ AGORA O SOMATÓRIO FICA AQUI, EM CIMA DE TUDO ✅ */}
          <div className="mb-4 border-2 border-orange-300 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-4 shadow-md">
              <h3 className="text-center text-orange-800 font-black uppercase text-lg mb-3">
                🧾 SOMATÓRIO GERAL
              </h3>
              <div className="grid grid-cols-2 gap-3">
                
                {/* 1. TOTAL FATURADO - NORMAL */}
                <div className="text-center p-2 bg-emerald-100 rounded-lg border border-emerald-200 col-span-2">
                  <p className="text-xs font-black text-emerald-800 uppercase mb-1">Total Faturado</p>
                  <p className="text-lg font-black text-emerald-900">
                    R$ {historicoCaixas.reduce((soma, c) => soma + (c.faturado || 0), 0).toFixed(2)}
                  </p>
                </div>

                {/* 2. TOTAL DINHEIRO - NORMAL */}
                <div className="text-center p-2 bg-amber-100 rounded-lg border border-amber-200">
                  <p className="text-xs font-black text-amber-800 uppercase mb-1">Total Dinheiro</p>
                  <p className="text-lg font-black text-amber-900">
                    R$ {historicoCaixas.reduce((soma, c) => soma + (c.totalDinheiro || 0), 0).toFixed(2)}
                  </p>
                </div>

                {/* 3. TOTAL PIX - NORMAL */}
                <div className="text-center p-2 bg-teal-100 rounded-lg border border-teal-200">
                  <p className="text-xs font-black text-teal-800 uppercase mb-1">Total Pix</p>
                  <p className="text-lg font-black text-teal-900">
                    R$ {historicoCaixas.reduce((soma, c) => soma + (c.totalPix || 0), 0).toFixed(2)}
                  </p>
                </div>

                {/* 4. TOTAL DESPESA - VOLTOU AO NORMAL */}
                <div className="col-span-2 text-center p-2 bg-red-100 rounded-lg border border-red-200">
                  <p className="text-xs font-black text-red-800 uppercase mb-1">Total Despesa</p>
                  <p className="text-lg font-black text-red-900">
                    R$ {historicoCaixas.reduce((soma, c) => soma + (c.despesas || 0), 0).toFixed(2)}
                  </p>
                </div>

                {/* 5. VALOR TOTAL - VERDE FORTE, DESTAQUE E FONTE GRANDE */}
                <div className="col-span-2 text-center p-3 bg-emerald-100 rounded-lg border-2 border-emerald-500 shadow-sm">
                  <p className="text-sm font-black text-emerald-800 uppercase mb-1">Valor Total</p>
                  <p className="text-3xl font-black text-emerald-700">
                    R$ {historicoCaixas.reduce((soma, c) => soma + (c.saldoLiquido || 0), 0).toFixed(2)}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* 🔽 FECHAMENTOS INDIVIDUAIS 🔽 */}
          {historicoCaixas.map((caixa, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all p-4"
            >
              {/* 📅 DATA */}
              <div className="bg-orange-50 rounded-xl p-3 mb-3 border border-orange-200">
                <p className="text-orange-900 font-black text-sm text-center">
                  📅 {caixa.dataHora}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 1. FATURADO - NORMAL */}
                <div className="col-span-2 text-center p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs font-black text-emerald-700 uppercase mb-1">Faturado</p>
                  <p className="text-base font-black text-emerald-800">R$ {(caixa.faturado || 0).toFixed(2)}</p>
                </div>

                {/* 2. DINHEIRO - NORMAL */}
                <div className="text-center p-2 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-xs font-black text-amber-700 uppercase mb-1">Recebido Dinheiro</p>
                  <p className="text-base font-black text-amber-800">R$ {(caixa.totalDinheiro || 0).toFixed(2)}</p>
                </div>

                {/* 3. PIX - NORMAL */}
                <div className="text-center p-2 bg-teal-50 rounded-lg border border-teal-100">
                  <p className="text-xs font-black text-teal-700 uppercase mb-1">Recebido Pix</p>
                  <p className="text-base font-black text-teal-800">R$ {(caixa.totalPix || 0).toFixed(2)}</p>
                </div>

                {/* 4. DESPESAS - VOLTOU AO NORMAL */}
                <div className="col-span-2 text-center p-2 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs font-black text-red-700 uppercase mb-1">Despesas</p>
                  <p className="text-base font-black text-red-800">R$ {(caixa.despesas || 0).toFixed(2)}</p>
                </div>

                {/* 5. VALOR TOTAL - VERDE FORTE, DESTAQUE E FONTE GRANDE */}
                <div className="col-span-2 text-center p-3 bg-emerald-100 rounded-lg border-2 border-emerald-400 shadow-sm">
                  <p className="text-sm font-black text-emerald-800 uppercase mb-1">Valor Total</p>
                  <p className="text-2xl font-black text-emerald-700">R$ {(caixa.saldoLiquido || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  </div>
)}
{/* Modal de confirmação */}
{modalConfirmarTurno && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
      <h3 className="text-lg font-black text-orange-600 mb-2">Arquivar Turno?</h3>
      <p className="text-sm text-zinc-600 mb-6">
        Isso vai arquivar o caixa no histórico, apagar todos os pedidos e zerar as despesas.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setModalConfirmarTurno(false)}
          className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-black uppercase text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={executarFechamentoTurno}
          className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-black rounded-xl font-black uppercase text-sm"
        >
          Arquivar
        </button>
      </div>
    </div>
  </div>
)}

{modalConfirmarZerarTudo && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center">
      <h3 className="text-lg font-bold text-red-700 mb-4">⚠️ Atenção!</h3>
      <p className="mb-6">Essa ação irá apagar todos os pedidos e zerar as despesas. Tem certeza?</p>
      <div className="flex gap-3 justify-center">
        <button 
          onClick={() => setModalConfirmarZerarTudo(false)}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Cancelar
        </button>
        <button 
          onClick={apagarSistemaGeralEZero}
          className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
        >
          Sim, zerar tudo
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal de Confirmação para Apagar Histórico */}
{modalConfirmarApagarHistorico && (
  <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
      <h3 className="text-lg font-bold text-center text-gray-800 mb-2">
        Tem certeza?
      </h3>
      <p className="text-center text-gray-600 mb-6">
        Essa ação apaga todo o histórico e não pode ser desfeita.
      </p>

      <div className="flex gap-3 w-full">
        {/* Botão SIM, APAGAR - Estilo melhorado */}
        <button
          onClick={async () => {
            try {
              // Apaga todos os documentos da coleção no Firebase
              const snapHistorico = await getDocs(collection(db, "historico_caixas"));
              const promessas = snapHistorico.docs.map(d => deleteDoc(doc(db, "historico_caixas", d.id)));
              await Promise.all(promessas);

              // Limpa dados locais
              setHistoricoCaixas([]);
              localStorage.removeItem('historicoCaixas');
              setModalConfirmarApagarHistorico(false);

              // Notificação de sucesso
              const msg = document.createElement('div');
              msg.innerText = '✅ Histórico apagado definitivamente!';
              msg.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: #10b981; color: white; font-weight: 900; font-size: 15px;
                padding: 14px 28px; border-radius: 12px; z-index: 99999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-transform: uppercase;
              `;
              document.body.appendChild(msg);
              setTimeout(() => msg.remove(), 2500);
            } catch (erro) {
              console.error(erro);
              setNotificacaoCaixa("❌ Erro ao apagar histórico");
              setTimeout(() => setNotificacaoCaixa(null), 3000);
            }
          }}
          className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black uppercase transition-all duration-200 shadow-sm hover:shadow"
        >
          SIM, APAGAR
        </button>

        {/* Botão CANCELAR - Funcional e alinhado */}
        <button
          onClick={() => setModalConfirmarApagarHistorico(false)}
          className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-gray-800 rounded-xl font-black uppercase transition-all duration-200"
        >
          CANCELAR
        </button>
      </div>
    </div>
  </div>
)}

{pedidoParaExcluir && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#FFFAF5] border border-red-500/30 w-full max-w-sm rounded-3xl p-6 space-y-5 shadow-2xl text-center">
      <span className="text-5xl block mb-2">🗑️</span>
      <h3 className="text-lg font-black text-red-500 uppercase">Excluir Pedido?</h3>
      <p className="text-[#71717A] font-bold text-sm">
        Tem certeza que deseja excluir o pedido de <span className="text-orange-600">{pedidoParaExcluir.nome}</span>?
      </p>
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => {
            deletarDoHistorico(pedidoParaExcluir.id);
            setPedidoParaExcluir(null);
          }}
          className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black uppercase text-sm rounded-xl transition-all shadow-md"
        >
          SIM, EXCLUIR
        </button>
        <button
          onClick={() => setPedidoParaExcluir(null)}
          className="flex-1 py-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-black uppercase text-sm rounded-xl transition-all"
        >
          CANCELAR
        </button>
      </div>
    </div>
  </div>
)}
       
  </div>
)}

</main>
);
}
