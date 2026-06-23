"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
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
  getDocs
} from "firebase/firestore";
// Configuração das notificações
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
      vibration: true
    });
  } catch (err) {
    console.log("Só funciona no app:", err);
  }
};

// Função que avisa quando chegar pedido
const avisarNovoPedido = async () => {
  tocarSomPedido();

  if (!(window as any).Capacitor) return;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{
        title: "TAPICUZ DA SUL",
        body: "🔔 NOVO PEDIDO CHEGOU!",
        channelId: "pedidos-alta",
        id: Date.now()
      }]
    });
  } catch (erro) {
    console.log("Aviso só no app:", erro);
  }
};

// Som do aviso
function tocarSomPedido() {
  const audio = new Audio('/pedido.mp3');
  audio.play().catch(() => {});
}

// Chama a configuração uma vez ao abrir
useEffect(() => {
  configurarNotificacoes();
}, []);

// ✅ SOM PERSONALIZADO (CORRIGIDO PARA FUNCIONAR NO APP E NA WEB)
function tocarSomPedido() {
  const audio = new Audio('/pedido.mp3');
  audio.volume = 1.0; // Volume máximo
  audio.play().catch(err => {
    console.log('Erro ao tocar áudio:', err);
  });
}

// 🚀 NÃO ESQUEÇA DE CHAMAR A CONFIGURAÇÃO AO ABRIR O APP
useEffect(() => {
  configurarNotificacoes();
}, []);

// 🎨 CORES, LISTAS E O RESTO DO SEU CÓDIGO CONTINUAM IGUAL A ANTES
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
}


// 📅 Lista de dias da semana
const listaDiasSemana = [
  { valor: "domingo", nome: "Domingo" },
  { valor: "segunda", nome: "Segunda-feira" },
  { valor: "terca", nome: "Terça-feira" },
  { valor: "quarta", nome: "Quarta-feira" },
  { valor: "quinta", nome: "Quinta-feira" },
  { valor: "sexta", nome: "Sexta-feira" },
  { valor: "sabado", nome: "Sábado" },
]

export default function AdminPainel() {
  // 🆕 NOVO: Estados para produtos vindos do banco
  const [produtos, setProdutos] = useState<{id: string, chave: string, nome: string, preco: number, icone: string, disponivel: boolean}[]>([])
  const [editandoProduto, setEditandoProduto] = useState<any>(null)
  const [novoPreco, setNovoPreco] = useState("")
  const [novoNome, setNovoNome] = useState("")
  const [novoDisponivel, setNovoDisponivel] = useState(true)
const [modalConfirmarApagarHistorico, setModalConfirmarApagarHistorico] = useState(false);
const [mostrarOpcoesZap, setMostrarOpcoesZap] = useState(false);
const [mostrarOpcoesConcluir, setMostrarOpcoesConcluir] = useState(false);
const [statusAvulso, setStatusAvulso] = useState("Pendente");

  // ⏰ Estados de funcionamento (CORRIGIDO)
  const [horaAbertura, setHoraAbertura] = useState("06:00")
  const [horaFechamento, setHoraFechamento] = useState("18:00")
  const [diasFuncionamento, setDiasFuncionamento] = useState<{[key: string]: boolean}>({
    domingo: true,
    segunda: true,
    terca: true,
    quarta: true,
    quinta: true,
    sexta: true,
    sabado: true,
  })
const [funcionamentoAberta, setfuncionamentoAberta] = useState(true)
  // ✅ CORRIGIDO: DIAS E HORÁRIOS DE ENTREGA (agora domingo vem ativado e com horários)
  const [diasEntrega, setDiasEntrega] = useState<{[key: string]: boolean}>({
    domingo: true,
    segunda: true,
    terca: true,
    quarta: true,
    quinta: true,
    sexta: true,
    sabado: true,
  })
  const [horariosPorDia, setHorariosPorDia] = useState<{[key: string]: string[]}>({
    domingo: ["07:00", "08:00", "09:00", "10:00", "11:00"], // ✅ Domingo agora tem horários
    segunda: ["07:00", "08:00", "09:00", "10:00", "11:00"],
    terca: ["07:00", "08:00", "09:00", "10:00", "11:00"],
    quarta: ["07:00", "08:00", "09:00", "10:00", "11:00"],
    quinta: ["07:00", "08:00", "09:00", "10:00", "11:00"],
    sexta: ["07:00", "08:00", "09:00", "10:00", "11:00"],
    sabado: ["07:00", "08:00", "09:00", "10:00", "11:00"],
  })
  const [diaEditando, setDiaEditando] = useState<string | null>(null)
  const [novoHorario, setNovoHorario] = useState("")

  // ✅ SEUS HORÁRIOS ORIGINAIS
  const OPCOES_HORARIOS = [
    "0:00", "05:30", "06:00", "06:30", "07:00", "07:30", "08:00", 
    "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", 
    "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", 
    "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", 
    "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", 
    "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", 
    "23:30"
  ]
  function chamarClienteWhatsapp(pedido: any) {
  if (!pedido.telefone) {
    alert("Cliente não informou telefone.")
    return
  }

  const numero = pedido.telefone.replace(/\D/g, "")

  const mensagem =
    `Olá ${pedido.nome} 😊

Seu pedido da Tapicuz já está sendo preparado.

⏰ Horário: ${pedido.horario}

Obrigado pela preferência! 🧡`

  const link = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`

  window.open(link, "_blank")
}

  // ✅ SOM DE NOTIFICAÇÃO
  function tocarSomPedido() {
    const audio = new Audio('/pedido.mp3');
    audio.play().catch(err => {
      console.log('Erro ao tocar áudio:', err);
    });
  }
  
  
  // 🆕 Funções auxiliares
  function pegarPreco(chave: string): number {
    const p = produtos.find(pr => pr.chave === chave)
    return p?.preco || 0
  }

  function formatarNomeItem(nomeChave: string) {
    const p = produtos.find(pr => pr.chave === nomeChave)
    return p ? `${p.icone} ${p.nome}` : nomeChave
  }

  // 🆕 Buscar produtos
  useEffect(() => {
    const qProdutos = query(collection(db, "produtos"))
    const unsubscribeProdutos = onSnapshot(qProdutos, (snap) => {
      const lista: any[] = []
      snap.forEach(d => lista.push({ id: d.id, ...d.data() }))
      lista.sort((a, b) => {
        const nomeA = a?.nome || ""
        const nomeB = b?.nome || ""
        return nomeA.localeCompare(nomeB)
      })
      setProdutos(lista)
    })
    return () => unsubscribeProdutos()
  }, [])

  // 🆕 Salvar alteração de produto
  async function salvarAlteracaoProduto() {
    if (!editandoProduto) return
    try {
      await updateDoc(doc(db, "produtos", editandoProduto.id), {
        nome: novoNome,
        preco: parseFloat(novoPreco),
        disponivel: novoDisponivel
      })
      setEditandoProduto(null)
      setNotificacaoCaixa("✅ Produto atualizado com sucesso!")
      setTimeout(() => setNotificacaoCaixa(null), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  async function apagarHistoricoCaixas() {
    const confirmar = window.confirm(
      "Tem certeza que deseja apagar TODO o histórico de fechamentos?"
    )
    if (!confirmar) return
    try {
      const snap = await getDocs(collection(db, "historico_caixas"))
      await Promise.all(
        snap.docs.map(item => deleteDoc(doc(db, "historico_caixas", item.id)))
      )
      setHistoricoCaixas([])
      setNotificacaoCaixa("🗑️ Histórico apagado com sucesso!")
      setTimeout(() => setNotificacaoCaixa(null), 3000)
    } catch (error) {
      console.error(error)
    }
  }

  // ✅ NOVA FUNÇÃO: GERAR HORÁRIOS DE 30 EM 30 MINUTOS
  function gerarHorarios(inicio: string, fim: string) {
    const horarios = []

    let atual = new Date()
    const [hInicio, mInicio] = inicio.split(":").map(Number)

    atual.setHours(hInicio, mInicio, 0, 0)

    const encerramento = new Date()
    const [hFim, mFim] = fim.split(":").map(Number)

    encerramento.setHours(hFim, mFim, 0, 0)

    while (atual <= encerramento) {
      horarios.push(
        atual.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      )

      atual.setMinutes(atual.getMinutes() + 30)
    }

    return horarios
  }

  // ⏰ CORRIGIDO: caminho único para configuração
  const carregarfuncionamentouracoesFuncionamento = async () => {
    try {
     const docRef = doc(db, "configuracoes", "funcionamento")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const dados = docSnap.data()
        setHoraAbertura(dados.horaAbertura || "06:00")
        setHoraFechamento(dados.horaFechamento || "18:00")
        if (dados.diasFuncionamento) setDiasFuncionamento(dados.diasFuncionamento)
        
        // ✅ CARREGA DIAS E HORÁRIOS DE ENTREGA
        if (dados.diasEntrega) setDiasEntrega(dados.diasEntrega)
        if (dados.horariosPorDia) setHorariosPorDia(dados.horariosPorDia)
        if (dados.aberta !== undefined) setfuncionamentoAberta(dados.aberta)
      }
    } catch (erro) {
      console.error("Erro ao carregar configurações:", erro)
    }
  }

  // ✅ FUNÇÃO SALVAR ATUALIZADA COM GERAÇÃO AUTOMÁTICA
  const salvarfuncionamentouracoesFuncionamento = async () => {
    try {
      // 1. Gera os horários automaticamente com base na abertura e fechamento
      const horariosGerados = gerarHorarios(horaAbertura, horaFechamento)

      // 2. Monta o objeto com os horários gerados para todos os dias
      const novosHorariosPorDia = {
        domingo: diasFuncionamento.domingo ? horariosGerados : [],
        segunda: diasFuncionamento.segunda ? horariosGerados : [],
        terca: diasFuncionamento.terca ? horariosGerados : [],
        quarta: diasFuncionamento.quarta ? horariosGerados : [],
        quinta: diasFuncionamento.quinta ? horariosGerados : [],
        sexta: diasFuncionamento.sexta ? horariosGerados : [],
        sabado: diasFuncionamento.sabado ? horariosGerados : [],
      }

      // 3. Salva tudo no Firebase
      await setDoc(
        doc(db, "configuracoes", "funcionamento"),
        { 
          horaAbertura, 
          horaFechamento, 
          diasFuncionamento,
          diasEntrega,
          horariosPorDia: novosHorariosPorDia, // ✅ Agora salva os horários NOVOS gerados
          aberta: funcionamentoAberta
        }
      )
      setNotificacaoCaixa("✅ Configurações salvas!")
      setTimeout(() => setNotificacaoCaixa(null), 2000)
    } catch (erro) {
      console.error("Erro ao salvar:", erro)
      setNotificacaoCaixa("❌ Erro ao salvar")
      setTimeout(() => setNotificacaoCaixa(null), 2000)
    }
  }

  // ✅ CORRIGIDO: caminho único
  useEffect(() => {
    carregarfuncionamentouracoesFuncionamento()

    const ref = doc(db, "configuracoes", "funcionamento")

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        const dados = snapshot.data();
        setHoraAbertura(dados.horaAbertura || "06:00")
        setHoraFechamento(dados.horaFechamento || "18:00")
        if (dados.diasFuncionamento) setDiasFuncionamento(dados.diasFuncionamento)
        if (dados.diasEntrega) setDiasEntrega(dados.diasEntrega)
        if (dados.horariosPorDia) setHorariosPorDia(dados.horariosPorDia)
        if (dados.aberta !== undefined) setfuncionamentoAberta(dados.aberta)
      }
    })

    return () => unsubscribe()
  }, [])

  // 📝 Função CORRIGIDA: Agora ao marcar/desmarcar no admin, OCULTA/MOSTRA para o cliente
  const alternarDia = (valorDia: string) => {
    setDiasFuncionamento(prev => {
      const novoEstado = { ...prev, [valorDia]: !prev[valorDia as keyof typeof prev] }
      // ✅ Liga as duas funções: se desmarca aqui, desmarca e oculta para o cliente
      setDiasEntrega(entrega => ({ ...entrega, [valorDia]: novoEstado[valorDia] }))
      return novoEstado
    })
  }

  // ✅ NOVAS FUNÇÕES PARA GERENCIAR ENTREGAS
  const alternarDiaEntrega = (valorDia: string) => {
    setDiasEntrega(prev => ({
      ...prev,
      [valorDia]: !prev[valorDia as keyof typeof prev]
    }))
  }

  const adicionarHorario = (dia: string) => {
    if (!novoHorario || !/^\d{2}:\d{2}$/.test(novoHorario)) {
      alert("Digite horário válido: HH:MM")
      return
    }
    if (horariosPorDia[dia].includes(novoHorario)) {
      alert("Horário já existe!")
      return
    }
    setHorariosPorDia(prev => ({
      ...prev,
      [dia]: [...prev[dia], novoHorario].sort()
    }))
    setNovoHorario("")
    setDiaEditando(null)
  }

  const removerHorario = (dia: string, hora: string) => {
    setHorariosPorDia(prev => ({
      ...prev,
      [dia]: prev[dia].filter(h => h !== hora)
    }))
  }

interface Pedido {
  id: string
  nome: string
  endereco: string
  rua: string
  numero: string
  bairro?: string
  cidade?: string
  observacao?: string
  pagamento: string
  troco: number
  trocoPara: number       // ✅ ADICIONADO AQUI (campo que faltava)
  valorTotal: number
  horario: string
  pago: boolean
  concluido: boolean
  statusPagamento?: "pendente" | "pago"
  dataCriacao?: any
  telefone?: string
  itens: {
    tapiocaMolhada: number
    tapiocaManteiga: number
    tapiocaQueijo: number
    tapiocaOvo: number
    tapiocaQueijoOvo: number
    cuscuzMilho: number
    cuscuzArroz: number
    cuscuzMilhoArroz: number
    cafe: number
  }
}

interface HistoricoCaixa {
  id: string
  tipo: "fechamento_turno"
  data: string
  dataHora: string
  faturado: number
  totalPix: number
  totalDinheiro: number
  despesas: number
  saldoLiquido: number
}
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [historicoCaixas, setHistoricoCaixas] = useState<HistoricoCaixa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<"pedidos" | "avulso" | "historico" | "caixa" | "pendencias" | "zerar" | "produtos" | "demandas" | "ranking" | "entregas">("pedidos")
 
  

  const [notificacaoCaixa, setNotificacaoCaixa] = useState<string | null>(null)
  const [mostrarModalCopiado, setMostrarModalCopiado] = useState(false)
  const [pedidoSelecionadoParaConcluir, setPedidoSelecionadoParaConcluir] = useState<Pedido | null>(null)
  const [mostrarResumoFinalAvulso, setMostrarResumoFinalAvulso] = useState(false)
  const [pedidoDetalhado, setPedidoDetalhado] = useState<Pedido | null>(null)
  
  
  const [mostrarDropdownHora, setMostrarDropdownHora] = useState(false)
  
  const [modalConfirmarTurno, setModalConfirmarTurno] = useState(false)
  const [modalConfirmarZerarTudo, setModalConfirmarZerarTudo] = useState(false)

  const [valorDespesaInput, setValorDespesaInput] = useState("")
  const [totalDespesasAcumuladas, setTotalDespesasAcumuladas] = useState(0)

  const [nomeAvulso, setNomeAvulso] = useState("")
  const [ruaAvulso, setRuaAvulso] = useState("")
  const [numeroAvulso, setNumeroAvulso] = useState("")
  const [referenciaAvulso, setReferenciaAvulso] = useState("")
  const [observacaoAvulso, setObservacaoAvulso] = useState("")
  const [pagamentoAvulso, setPagamentoAvulso] = useState<"Pix" | "Dinheiro">("Pix")
  const [trocoParaAvulso, setTrocoParaAvulso] = useState("")
  const [horarioAvulso, setHorarioAvulso] = useState("0:00")
  const [valorTotalAvulso, setValorTotalAvulso] = useState("0.00")
  const [criandoAvulso, setCriandoAvulso] = useState(false)
const [whatsappAvulso, setWhatsappAvulso] = useState("");
const [trocoCalculadoAvulso, setTrocoCalculadoAvulso] = useState(0);
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
  })
  
   // Guardando a quantidade anterior na referência
  const ultimoTotalPedidos = useRef(0)

 useEffect(() => {
  const reffuncionamento = doc(db, "configuracoes", "funcionamento")
    const unsubscribeStatus = onSnapshot(reffuncionamento, (snap) => {
      if (snap.exists()) {
        const dados = snap.data()
        setfuncionamentoAberta(dados.aberta !== undefined ? dados.aberta : true)
        setTotalDespesasAcumuladas(dados.despesas || 0)
      }
    })

    const qCaixas = query(collection(db, "historico_caixas"))
    const unsubscribeCaixas = onSnapshot(qCaixas, (snap) => {
      const lista: HistoricoCaixa[] = []
      snap.forEach(d => lista.push({ id: d.id, ...d.data() } as HistoricoCaixa))
      
      lista.sort((a, b) => {
        if (!a.dataHora) return 1
        if (!b.dataHora) return -1
        return b.dataHora.localeCompare(a.dataHora)
      })

      setHistoricoCaixas(lista)
    })

    return () => {
      unsubscribeStatus()
      unsubscribeCaixas()

    }
  }, [])
    
  useEffect(() => {
  const qPedidos = query(collection(db, "pedidos"));
const unsubscribe = onSnapshot(qPedidos, (snap) => {
  const pedidosNovos = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  } as Pedido));

  setPedidos(pedidosNovos);

  // Só avisa se tiver pedido novo (opcional, evita tocar várias vezes)
  if (pedidosNovos.length > 0) {
    avisarNovoPedido();
  }
});

  return () => unsubscribe();
}, []);

  useEffect(() => {
    const q = query(collection(db, "pedidos"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listaPedidos: Pedido[] = []
      querySnapshot.forEach((doc) => {
        listaPedidos.push({ id: doc.id, ...doc.data() } as Pedido)
      })
      
      listaPedidos.sort((a, b) => {
        if (!a.horario) return 1
        if (!b.horario) return -1
        return a.horario.localeCompare(b.horario)
      })

      const pedidosAtivosAtuais = listaPedidos.filter(p => !p.concluido).length
      
      if (ultimoTotalPedidos.current > 0 && pedidosAtivosAtuais > ultimoTotalPedidos.current) {
        tocarSomPedido(); 
      }

      ultimoTotalPedidos.current = pedidosAtivosAtuais
      setPedidos(listaPedidos)
      setCarregando(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let subtotal = 0
    let qtdComidas = 0
    let qtdCafes = itensAvulsos.cafe

    Object.entries(itensAvulsos).forEach(([key, qtd]) => {
      subtotal += (pegarPreco(key) || 0) * qtd 
      if (key !== "cafe") qtdComidas += qtd
    })

    if (qtdComidas > 0 && qtdCafes > 0) {
      const CabalCombos = Math.min(qtdComidas, qtdCafes)
      let descontoTotal = 0
      let cafesAplicados = 0

      Object.entries(itensAvulsos).forEach(([key, qtd]) => {
        if (key !== "cafe" && qtd > 0) {
          const comidasDesteTipoNoCombo = Math.min(qtd, CabalCombos - cafesAplicados)
          if (comidasDesteTipoNoCombo > 0) {
            const descontoPorPar = (pegarPreco(key) + pegarPreco("cafe")) - 10.00 
            descontoTotal += descontoPorPar * comidasDesteTipoNoCombo
            cafesAplicados += comidasDesteTipoNoCombo
          }
        }
      })
      subtotal -= descontoTotal
    }
    setValorTotalAvulso(subtotal.toFixed(2))
  }, [itensAvulsos, produtos]) 

const valorTotalAvulsoNumerico = parseFloat(valorTotalAvulso) || 0
const trocoParaAvulsoNumerico = parseFloat(trocoParaAvulso.replace(",", ".")) || 0
const trocoAvulsoCalculado = pagamentoAvulso === "Dinheiro" && trocoParaAvulsoNumerico > valorTotalAvulsoNumerico 
  ? trocoParaAvulsoNumerico - valorTotalAvulsoNumerico 
  : 0

// ✅ AQUI ESTAVA O ERRO: Agora endereço SÓ recebe rua, número e referência
const partesEndereco = []
if (ruaAvulso.trim()) partesEndereco.push(ruaAvulso.trim())
if (numeroAvulso.trim()) partesEndereco.push(`Nº ${numeroAvulso.trim()}`)
if (referenciaAvulso.trim()) partesEndereco.push(`Ref: ${referenciaAvulso.trim()}`) // Apenas a referência aqui!
const enderecoCompletoConstruido = partesEndereco.length > 0 ? partesEndereco.join(", ") : "Retirada no Balcão"

// ✅ Observação fica SEPARADA, não entra mais no endereço
const observacaoPedido = observacaoAvulso?.trim() || ""

function executarCopiaResumo() {
  const itensTxt = Object.entries(itensAvulsos)
    .filter(([_, qtd]) => qtd > 0)
    .map(([key, qtd]) => `• ${qtd}x ${formatarNomeItem(key)}`)
    .join("\n")

  const textoFinal = `━━━━━━━━━━━━━━━━━━
☕ TAPICUZ

Cliente: ${nomeAvulso || "Não informado"}
Horário: ${horarioAvulso}

📍 Entrega:
${enderecoCompletoConstruido}

🛒 Itens:
${itensTxt || "Nenhum item selecionado"}

${observacaoPedido ? `📝 Observação:\n${observacaoPedido}\n` : ""}

💳 Pagamento:
${pagamentoAvulso.toUpperCase()}

💰 Total:
R$ ${valorTotalAvulso}

${pagamentoAvulso === "Dinheiro" && trocoAvulsoCalculado > 0 ? `💵 Troco: R$ ${trocoAvulsoCalculado.toFixed(2).replace(".", ",")}\n` : ""}
━━━━━━━━━━━━━━━━━━`

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textoFinal)
      .then(() => {
        setMostrarModalCopiado(true)
      })
      .catch(err => {
        console.error("Erro na API clipboard", err)
      })
  } else {
    const textArea = document.createElement("textarea")
    textArea.value = textoFinal
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand("copy")
    document.body.removeChild(textArea)
    setMostrarModalCopiado(true)
  }
}

// ✅ ESSA FUNÇÃO TAMBÉM CORRIGIDA PARA O WHATSAPP FICAR CERTO
function gerarResumoPedidoWhatsApp() {
  const itens = Object.entries(itensAvulsos)
    .filter(([_, qtd]) => qtd > 0)
    .map(([key, qtd]) => `• ${qtd}x ${formatarNomeItem(key)}`)
    .join("\n")

  return `Olá ${nomeAvulso || "Cliente"},\nSeu pedido da Tapicuz foi recebido e já está sendo preparado!\n\nRESUMO DO PEDIDO\n----------------------------------------\n\n*CLIENTE:* ${nomeAvulso || "Não informado"}\n*ENDEREÇO:* ${enderecoCompletoConstruido}\n${observacaoPedido ? `*OBSERVAÇÃO:* ${observacaoPedido}\n` : ""}*HORÁRIO:* ${horarioAvulso}\n*FORMA DE PAGAMENTO:* ${pagamentoAvulso.toUpperCase()}\n*TROCO:* R$ ${trocoAvulsoCalculado.toFixed(2).replace(".", ",")}\n----------------------------------------\n*ITENS DO PEDIDO*\n${itens || "Nenhum item selecionado"}\n----------------------------------------\n*VALOR TOTAL:* R$ ${valorTotalAvulso}\n\nAgradecemos muito a sua preferência!`
}
  const enviarMensagemNotificacaoWhats = (nomeCliente: string) => {
    const msg = `Olá, ${nomeCliente}! ☕\nSeu pedido da Tapicuz já foi entregue.\nCaso o pagamento ainda não tenha sido realizado, pedimos a gentileza de efetuá-lo assim que possível.\nSe o pagamento já foi realizado, desconsidere esta mensagem e muito obrigado pela preferência! ❤️\nTenha um excelente dia.`
    const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`
    window.open(url, "_blank")

  }

  function alterarQtdAvulso(campo: string, valor: number) {
    setItensAvulsos(prev => ({
      ...prev,
      [campo]: Math.max(0, (prev as any)[campo] + valor)
    }))
  }

  async function processarDecisaoPedidoExistente(foiPago: boolean) {
    if (!pedidoSelecionadoParaConcluir) return
    try {
      await updateDoc(doc(db, "pedidos", pedidoSelecionadoParaConcluir.id), {
        concluido: true,
        statusPagamento: foiPago ? "pago" : "pendente"
      })
      setNotificacaoCaixa(foiPago ? "🟢 PEDIDO CONCLUÍDO E PAGO!" : "🔴 MOVIDO PARA AS PENDÊNCIAS!")
      setTimeout(() => setNotificacaoCaixa(null), 2000)
      setPedidoSelecionadoParaConcluir(null)
    } catch (erro) {
      console.error(erro)
    }
  }

  async function marcarComoPago(id: string) {
    try {
      await updateDoc(doc(db, "pedidos", id), {
        concluido: true,
        statusPagamento: "pago"
      })
      setNotificacaoCaixa("🟢 PEDIDO MARCADO COMO PAGO!")
      setTimeout(() => setNotificacaoCaixa(null), 2000)
      if (pedidoDetalhado?.id === id) setPedidoDetalhado(null)
    } catch (erro) {
      console.error(erro)
    }
  }

  async function deletarDoHistorico(id: string) {
    try {
      await deleteDoc(doc(db, "pedidos", id))
      if (pedidoDetalhado?.id === id) setPedidoDetalhado(null)
    } catch (error) {
      console.error(error)
    }
  }

  async function alternarStatusfuncionamento() {
    try {
      const novoStatus = !funcionamentoAberta
await setDoc(
  doc(db, "configuracoes", "funcionamento"),
  { aberta: novoStatus },
  { merge: true }
)
      setfuncionamentoAberta(novoStatus)
      setNotificacaoCaixa(`Pedidos: ${novoStatus ? "SISTEMA ON" : "SISTEMA OFF"}`)
      setTimeout(() => setNotificacaoCaixa(null), 2500)
    } catch (error) {
      console.error(error)
    }
  }

  async function lancarDespesaSimples(e: any) {
    e.preventDefault()
    const valor = parseFloat(valorDespesaInput.replace(",", "."))
    if (isNaN(valor) || valor <= 0) return

    try {
      const novaDespesaTotal = totalDespesasAcumuladas + valor
     
      setTotalDespesasAcumuladas(novaDespesaTotal)
      setValorDespesaInput("")
      setNotificacaoCaixa(`Despesa de R$ ${valor.toFixed(2)} lançada!`)
      setTimeout(() => setNotificacaoCaixa(null), 3000)
    } catch (error) {
      console.error(error)
    }
  }

  async function executarFechamentoTurno() {
    const saldoLiquidoCalculado = faturamentoTotal - totalDespesasAcumuladas

const dadosFechamento = {
  tipo: "fechamento_turno",
  data: new Date().toISOString(),
  dataHora: new Date().toLocaleString("pt-BR"),

  faturado: faturamentoTotal,

  totalPix,
  totalDinheiro,

  despesas: totalDespesasAcumuladas,

  saldoLiquido: saldoLiquidoCalculado
}

    try {
      await addDoc(collection(db, "historico_caixas"), dadosFechamento)

      const snapPedidos = await getDocs(collection(db, "pedidos"))
      const promessasDelecao = snapPedidos.docs.map(d => deleteDoc(doc(db, "pedidos", d.id)))
      await Promise.all(promessasDelecao)
 
      
      setTotalDespesasAcumuladas(0)
      setModalConfirmarTurno(false)
      setNotificacaoCaixa("Turno arquivado com sucesso!")
      setTimeout(() => setNotificacaoCaixa(null), 4000)
    } catch (error) {
      console.error("Erro ao fechar turno:", error)
    }
  }

  async function apagarSistemaGeralEZero() {
    try {
      const snapPedidos = await getDocs(collection(db, "pedidos"))
      const promessasDelecao = snapPedidos.docs.map(d => deleteDoc(doc(db, "pedidos", d.id)))
      await Promise.all(promessasDelecao)
      
    
      
      setTotalDespesasAcumuladas(0)
      setModalConfirmarZerarTudo(false)
      setAbaAtiva("pedidos")
      setNotificacaoCaixa("💥 SISTEMA RESETADO E APAGADO COMPLETAMENTE!")
      setTimeout(() => setNotificacaoCaixa(null), 4000)
    } catch (error) {
      console.error(error)
    }
  }

  function dispararFluxoConclusaoAvulso(e: any) {
    e.preventDefault()
    if (!nomeAvulso.trim() || valorTotalAvulsoNumerico === 0 || !funcionamentoAberta) return
    setMostrarResumoFinalAvulso(true)
  }

  // ✅ CORRIGIDO: adicionado campo telefone
  async function finalizarPedidoAvulsoComStatusRoteado(destino: "pago" | "espera" | "pendente") {
    if (criandoAvulso || !funcionamentoAberta) return
    setCriandoAvulso(true)

    const novoPedidoAvulso: any = {
      nome: nomeAvulso.trim().toUpperCase(),
      endereco: enderecoCompletoConstruido.toUpperCase(),
      pagamento: pagamentoAvulso,
      troco: destino === "pago" ? trocoAvulsoCalculado : 0,
      trocoPara: trocoParaAvulsoNumerico,
      valorTotal: valorTotalAvulsoNumerico,
      horario: horarioAvulso,
      pago: destino === "pago",
      concluido: destino !== "espera", 
      statusPagamento: destino === "pago" ? "pago" : "pendente", 
      dataCriacao: new Date().toISOString(),
      telefone: whatsappAvulso || "",
      itens: itensAvulsos
    }

    if (observacaoAvulso.trim()) {
      novoPedidoAvulso.observacao = observacaoAvulso.trim().toUpperCase()
    }

    try {
      await addDoc(collection(db, "pedidos"), novoPedidoAvulso)
      setNomeAvulso("")
      setRuaAvulso("")
      setNumeroAvulso("")
      setReferenciaAvulso("")
      setObservacaoAvulso("")
      setPagamentoAvulso("Pix")
      setTrocoParaAvulso("")
      setWhatsappAvulso("")
      setItensAvulsos({ tapiocaMolhada:0, tapiocaManteiga:0, tapiocaQueijo:0, tapiocaOvo:0, tapiocaQueijoOvo:0, cuscuzMilho:0, cuscuzArroz:0, cuscuzMilhoArroz:0, cafe:0 })
      setMostrarResumoFinalAvulso(false)
      
      setNotificacaoCaixa("Pedido processado com sucesso! 🎉")
      setTimeout(() => setNotificacaoCaixa(null), 3500)
      
      if (destino === "pago") setAbaAtiva("historico")
      else if (destino === "espera") setAbaAtiva("pedidos")
      else setAbaAtiva("pendencias")
    } catch (error) {
      console.error(error)
    } finally {
      setCriandoAvulso(false)
    }
  }

  const pedidosAtivos = pedidos.filter(p => !p.concluido)
  const pedidosPendentes = pedidos.filter(p => p.concluido && p.statusPagamento === "pendente")
  const pedidosPagos = pedidos.filter(p => p.concluido && p.statusPagamento === "pago")

  const faturamentoTotal = pedidosPagos.reduce((acc, p) => acc + p.valorTotal, 0)
  const totalPix = pedidosPagos.filter(p => p.pagamento === "Pix").reduce((acc, p) => acc + p.valorTotal, 0)
  const totalDinheiro = pedidosPagos.filter(p => p.pagamento === "Dinheiro").reduce((acc, p) => acc + p.valorTotal, 0)
  
  const saldoLiquidoAtual = faturamentoTotal - totalDespesasAcumuladas

  const somaHistoricoPix = historicoCaixas.reduce((acc, c) => acc + (c.totalPix || 0), 0)
  const somaHistoricoDinheiro = historicoCaixas.reduce((acc, c) => acc + (c.totalDinheiro || 0), 0)
  const somaHistoricoDespesas = historicoCaixas.reduce((acc, c) => acc + (c.despesas || 0), 0)
  const somaHistoricoLiquido = historicoCaixas.reduce((acc, c) => acc + (c.saldoLiquido || 0), 0)

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
  }

  pedidosAtivos.forEach((pedido) => {
    Object.keys(demandasProducao).forEach((item) => {
      demandasProducao[item as keyof typeof demandasProducao] +=
        pedido.itens?.[item as keyof typeof pedido.itens] || 0
    })
  })

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

    {/* ✅ Modal: Detalhes do Pedido */}
{pedidoDetalhado && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-[#FFFFFF] border-2 border-[#F97316]/20 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl my-6">
      
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-[#F97316] uppercase tracking-wider">Detalhes do Pedido</h3>
        <button 
          onClick={() => setPedidoDetalhado(null)}
          className="w-10 h-10 bg-[#FFEDD5] hover:bg-[#F97316]/10 rounded-full flex items-center justify-center text-[#F97316] text-lg transition-all"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 text-sm">
        
        {/* 🟡 CLIENTE + 🕓 HORÁRIO (AGORA FICOU ENORME!) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FFFAF5] p-3 rounded-xl border border-[#FFEDD5]/50">
            <p className="text-xs font-black text-[#71717A] uppercase mb-1 tracking-wide">Cliente</p>
            <p className="font-bold text-[#27272A] text-lg">{pedidoDetalhado.nome}</p>
          </div>
          
          {/* 👇 AQUI É O HORÁRIO - AGORA O MAIOR DE TUDO 👇 */}
          <div className="bg-gradient-to-br from-[#F97316]/10 to-[#FB923C]/15 rounded-xl border-2 border-[#F97316]/30 flex flex-col items-center justify-center py-2">
            <p className="text-[10px] font-black text-[#71717A] uppercase tracking-wider mb-0.5">Horário</p>
            <p className="font-black text-[#F97316] text-[42px] leading-none tracking-widest">
              {pedidoDetalhado.horario}
            </p>
          </div>
        </div>

        {/* ENDEREÇO */}
        <div className="bg-[#FFFAF5] p-3 rounded-xl border border-[#FFEDD5]/50">
          <p className="text-xs font-black text-[#71717A] uppercase mb-1 tracking-wide">Endereço</p>
          <p className="font-medium text-[#27272A]">{pedidoDetalhado.endereco}</p>
          
        </div>

        {/* ✅ OBSERVAÇÃO AGORA SEPARADA, NÃO VAI MAIS NO ENDEREÇO */}
        {pedidoDetalhado.observacao && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-xl">
            <p className="text-xs font-black text-red-600 uppercase mb-1 tracking-wide">Observação</p>
            <p className="font-bold text-red-700">{pedidoDetalhado.observacao}</p>
          </div>
        )}

        {/* ITENS */}
        <div className="border-t border-[#F3F4F6] pt-4">
          <p className="text-xs font-black text-[#71717A] uppercase mb-3 tracking-wide">Itens Pedidos</p>
          <div className="space-y-2 pl-2">
            {Object.entries(pedidoDetalhado.itens).map(([chave, qtd]) => qtd > 0 && (
              <div key={chave} className="flex justify-between items-center bg-[#FFFAF5]/60 py-2 px-3 rounded-lg">
                <span className="text-[#27272A] font-medium">{formatarNomeItem(chave)}</span>
                <span className="text-[#F97316] font-black text-lg">{qtd}x</span>
              </div>
            ))}
          </div>
        </div>
  {/* PAGAMENTO + VALOR */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-[#FFFAF5] p-3 rounded-xl border border-[#FFEDD5]/50">
            <p className="text-xs font-black text-[#71717A] uppercase mb-1 tracking-wide">Pagamento</p>
            <span className={`inline-block mt-1 px-3 py-1.5 rounded-lg text-xs font-black uppercase w-full text-center ${
              pedidoDetalhado.pagamento === "Pix" 
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                : "bg-amber-100 text-amber-700 border border-amber-200"
            }`}>
              {pedidoDetalhado.pagamento}
            </span>
          </div>
          
          <div className="bg-[#F0FDF4] p-3 rounded-xl border border-emerald-100">
            <p className="text-xs font-black text-emerald-700 uppercase mb-1 tracking-wide">Valor Total</p>
            <p className="text-lg font-black text-emerald-600">R$ {pedidoDetalhado.valorTotal.toFixed(2)}</p>
          </div>
        </div>

     {/* TROCO (SE TIVER) */}
        <div className="bg-[#FFFAF5] p-3 rounded-xl border border-[#FFEDD5]/50">
          <p className="text-xs font-black text-[#71717A] uppercase mb-1 tracking-wide">Troco</p>
          <p className="font-bold text-[#27272A]">
            {pedidoDetalhado.troco > 0 
              ? `R$ ${pedidoDetalhado.troco.toFixed(2)}` 
              : "SEM TROCO"}
          </p>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex gap-2 pt-3">
          {pedidoDetalhado.statusPagamento === "pendente" && (
            <button
              onClick={() => marcarComoPago(pedidoDetalhado.id)}
              className="flex-1 py-3 bg-emerald-500/10 text-emerald-700 border-2 border-emerald-500/30 rounded-xl font-black text-sm uppercase hover:bg-emerald-500/20 transition-all active:scale-[0.98]"
            >
              ✅ Marcar como Pago
            </button>
          )}
          <button
            onClick={() => deletarDoHistorico(pedidoDetalhado.id)}
            className="flex-1 py-3 bg-red-500 text-red-700 border-2 border-red-200 rounded-xl font-black text-sm uppercase hover:bg-red-100 transition-all active:scale-[0.98]"
          >
            🗑️ Excluir
          </button>
        </div>
      </div>
    </div>
  </div>
)}
{/* ✅ Modal: VERSÃO FINAL - OPÇÕES INTERNAS MAIORES E BEM SEPARADAS */}
{pedidoSelecionadoParaConcluir && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#FFFAF5] border border-orange-500/30 w-full max-w-md rounded-3xl p-6 space-y-6 shadow-2xl">
      <h3 className="text-lg font-black text-orange-500 uppercase text-center tracking-wider">Opções do Pedido</h3>
      <p className="text-center text-[#71717A] font-bold">Escolha uma ação abaixo</p>
      
      {/* ✅ DOIS BOTÕES PRINCIPAIS - BEM SEPARADOS */}
      <div className="grid grid-cols-2 gap-6 pt-3">
        
        {/* 🟠 BOTÃO CONCLUIR */}
        <div className="relative">
          <button
            onClick={() => setMostrarOpcoesConcluir(!mostrarOpcoesConcluir)}
            className="w-full py-4 bg-orange-500 text-white border-2 border-orange-600 rounded-xl font-black uppercase text-base tracking-wider hover:bg-orange-600 hover:scale-[1.02] transition-all shadow-md"
            style={{ minHeight: '55px' }}
          >
            CONCLUIR
          </button>

          {/* ✅ OPÇÕES: PAGO E PENDENTE - MAIORES, MAIS ALTAS E SEPARADAS */}
          {mostrarOpcoesConcluir && (
            <div className="absolute top-[115%] left-0 right-0 z-10 p-3 bg-white rounded-xl border border-orange-200 shadow-lg">
              <button
                onClick={() => {
                  processarDecisaoPedidoExistente(true);
                  setMostrarOpcoesConcluir(false);
                  const mensagemCentral = document.createElement('div');
                  mensagemCentral.innerText = 'PEDIDO MARCADO COMO PAGO!';
                  mensagemCentral.style.cssText = `
                    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background: #10b981; color: white; font-weight: 900; font-size: 16px;
                    padding: 16px 32px; border-radius: 14px; z-index: 99999;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.2); border: 2px solid #059669;
                    text-transform: uppercase; letter-spacing: 0.5px;
                  `;
                  document.body.appendChild(mensagemCentral);
                  setTimeout(() => mensagemCentral.remove(), 2800);
                }}
                className="w-full py-4 mb-4 bg-emerald-500 text-white rounded-lg font-black uppercase text-base hover:bg-emerald-600 transition-all"
                style={{ minHeight: '48px' }}
              >
                PAGO
              </button>
              <button
                onClick={() => {
                  processarDecisaoPedidoExistente(false);
                  setMostrarOpcoesConcluir(false);
                }}
                className="w-full py-4 bg-amber-400 text-white rounded-lg font-black uppercase text-base hover:bg-amber-500 transition-all"
                style={{ minHeight: '48px' }}
              >
                PENDENTE
              </button>
            </div>
          )}
        </div>

        {/* 🟢 BOTÃO WHATSAPP */}
        <div className="relative">
          <button
            onClick={() => setMostrarOpcoesZap(!mostrarOpcoesZap)}
            className="w-full py-4 bg-green-500 text-white border-2 border-green-600 rounded-xl font-black uppercase text-base tracking-wider hover:bg-green-600 hover:scale-[1.02] transition-all shadow-md"
            style={{ minHeight: '55px' }}
          >
            WHATSAPP
          </button>

          {/* ✅ OPÇÕES: AVISAR SAÍDA E ENVIAR RESUMO - MAIORES, MAIS ALTAS E SEPARADAS */}
          {mostrarOpcoesZap && (
            <div className="absolute top-[115%] left-0 right-0 z-10 p-3 bg-white rounded-xl border border-green-200 shadow-lg">
              <button
                onClick={() => {
                  if (!pedidoSelecionadoParaConcluir?.telefone) {
                    alert("Cliente não informou telefone.")
                    return
                  }
                  const numero = pedidoSelecionadoParaConcluir.telefone.replace(/\D/g, "");
                  
                  const mensagemSaida = `Olá ${pedidoSelecionadoParaConcluir.nome}.
Seu pedido da Tapicuz acabou de sair para entrega.
Em instantes chegará até você!
Agradecemos a preferência.`;

                  const url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagemSaida)}`;
                  window.open(url, "_blank");
                  setMostrarOpcoesZap(false);

                  const aviso = document.createElement('div');
                  aviso.innerText = 'AVISO DE SAÍDA ENVIADO!';
                  aviso.style.cssText = `
                    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                    background: #f59e0b; color: white; font-weight: 900; font-size: 14px;
                    padding: 12px 24px; border-radius: 12px; z-index: 9999;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid #d97706;
                    text-transform: uppercase; letter-spacing: 0.5px;
                  `;
                  document.body.appendChild(aviso);
                  setTimeout(() => aviso.remove(), 2500);
                }}
                className="w-full py-4 mb-4 bg-orange-500 text-white rounded-lg font-black uppercase text-base hover:bg-orange-600 transition-all"
                style={{ minHeight: '48px' }}
              >
                AVISAR SAÍDA
              </button>
              
              <button
                onClick={() => {
                  if (!pedidoSelecionadoParaConcluir?.telefone) {
                    alert("Cliente não informou telefone.")
                    return
                  }
                  const pedido = pedidoSelecionadoParaConcluir;
                  const numero = pedido.telefone?.replace(/\D/g, "") || "";

                  // ✅ AGORA SIM: ENDEREÇO E OBSERVAÇÃO SEPARADOS
                  let mensagemCompleta = `Olá ${pedido.nome}.
Seu pedido da Tapicuz foi recebido e já está sendo preparado!

RESUMO DO PEDIDO
----------------------------------------

*CLIENTE:* ${pedido.nome.toUpperCase()}
*ENDEREÇO:* ${String(pedido.endereco || 'NÃO INFORMADO')}
${pedido.observacao ? `*OBSERVAÇÃO:* ${pedido.observacao}\n` : ""}
*HORÁRIO:* ${pedido.horario}
*FORMA DE PAGAMENTO:* ${pedido.pagamento}
`;

                  if (pedido.pagamento === 'Dinheiro') {
                    const valorTroco = pedido.troco;
mensagemCompleta += `*TROCO:* ${valorTroco > 0 ? `R$ ${valorTroco.toFixed(2).replace('.', ',')}` : "SEM TROCO"}
`;
                  }

                  mensagemCompleta += `----------------------------------------
*ITENS DO PEDIDO*
`;

                  let temItens = false;
                  if (pedido.itens && typeof pedido.itens === 'object' && !Array.isArray(pedido.itens)) {
                    Object.entries(pedido.itens).forEach(([chave, qtd]) => {
                      if (typeof qtd === 'number' && qtd > 0) {
                        const prod = produtos.find(p => p.chave === chave);
                        if (prod) {
                          mensagemCompleta += `• ${qtd}x ${prod.nome} - R$ ${(prod.preco * qtd).toFixed(2).replace('.', ',')}
`;
                          temItens = true;
                        }
                      }
                    });
                  }
                  if (!temItens && pedido.itens && Array.isArray(pedido.itens)) {
                    pedido.itens.forEach(item => {
                      if (item.quantidade > 0) {
                        mensagemCompleta += `• ${item.quantidade}x ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
`;
                        temItens = true;
                      }
                    });
                  }
                  if (!temItens) {
                    mensagemCompleta += `• NENHUM ITEM CADASTRADO
`;
                  }

                  mensagemCompleta += `----------------------------------------
*VALOR TOTAL:* R$ ${pedido.valorTotal.toFixed(2).replace('.', ',')}

Agradecemos muito a sua preferência!`;

                  const url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagemCompleta)}`;
                  window.open(url, "_blank");
                  setMostrarOpcoesZap(false);

                  const aviso = document.createElement('div');
                  aviso.innerText = 'RESUMO ENVIADO COM SUCESSO!';
                  aviso.style.cssText = `
                    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                    background: #10b981; color: white; font-weight: 900; font-size: 14px;
                    padding: 12px 24px; border-radius: 12px; z-index: 9999;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid #059669;
                    text-transform: uppercase; letter-spacing: 0.5px;
                  `;
                  document.body.appendChild(aviso);
                  setTimeout(() => aviso.remove(), 2500);
                }}
                className="w-full py-4 bg-green-500 text-white rounded-lg font-black uppercase text-base hover:bg-green-600 transition-all"
                style={{ minHeight: '48px' }}
              >
                ENVIAR RESUMO
              </button>
            </div>
          )}
        </div>

      </div>

      {/* BOTÃO CANCELAR */}
      <button 
        onClick={() => {
          setPedidoSelecionadoParaConcluir(null);
          setMostrarOpcoesConcluir(false);
          setMostrarOpcoesZap(false);
        }}
        className="w-full py-3 bg-[#FFEDD5] hover:bg-[#FFF7ED] rounded-xl font-black uppercase transition-all mt-5 text-base"
      >
        Cancelar
      </button>
    </div>
  </div>
)}

      {/* ✅ Modal: Confirmar Fechamento de Turno */}
      {modalConfirmarTurno && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFAF5] border border-orange-500/30 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-orange-400 uppercase text-center tracking-wider">Arquivar Turno?</h3>
            <p className="text-center text-[#71717A] font-bold">Isso irá salvar o caixa atual no histórico e limpar todos os pedidos. <span className="text-red-400">Essa ação não pode ser desfeita!</span></p>
            
            <div className="bg-[#FFFFFF] p-3 rounded-xl space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-[#71717A]">Total Faturado:</span><span className="font-black text-emerald-400">R$ {faturamentoTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-[#71717A]">Despesas:</span><span className="font-black text-red-400">- R$ {totalDespesasAcumuladas.toFixed(2)}</span></div>
              <div className="border-t border-[#F3F4F6] my-1"></div>
              <div className="flex justify-between text-lg"><span className="text-[#27272A] font-black">Saldo Líquido:</span><span className="font-black text-orange-400">R$ {saldoLiquidoAtual.toFixed(2)}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={executarFechamentoTurno}
                className="py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black uppercase rounded-xl transition-all"
              >
                SIM, ARQUIVAR
              </button>
              <button 
                onClick={() => setModalConfirmarTurno(true)} 
                className="py-3 bg-[#FFEDD5] hover:bg-[#FFF7ED] rounded-xl font-black uppercase transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal: Confirmar Zerar Sistema */}
      {modalConfirmarZerarTudo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFAF5] border border-red-500/30 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl">
            <span className="text-5xl text-red-500 text-center block">🚨</span>
            <h3 className="text-lg font-black text-red-400 uppercase text-center tracking-wider">Zerar Sistema?</h3>
            <p className="text-center text-[#71717A] font-bold">Você tem CERTEZA? Isso irá APAGAR TODOS os pedidos, zerar despesas e reiniciar o caixa. <span className="text-red-400 font-black">NÃO HÁ COMO RECUPERAR!</span></p>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={apagarSistemaGeralEZero}
                className="py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-black uppercase hover:bg-red-500/30 transition-all"
              >
                SIM, APAGAR TUDO
              </button>
              <button 
                onClick={() => setModalConfirmarZerarTudo(false)} 
                className="py-3 bg-[#FFEDD5] hover:bg-[#FFF7ED] rounded-xl font-black uppercase transition-all"
              >
                Cancelar
              </button>
            </div>
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
      onClick={alternarStatusfuncionamento} 
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

{/* 🚨 ZERAR SISTEMA */}
<button 
  onClick={() => setModalConfirmarZerarTudo(true)} 
  className="p-3 rounded-2xl text-[10px] xs:text-xs font-black uppercase border flex flex-col items-center justify-center gap-1.5 transition-all bg-[#FFFFFF] border-red-800 text-red-500 hover:bg-red-950/20"
>
  <span className="text-lg">🚨</span>
  <span>ZERAR SISTEMA</span>
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
              onClick={salvarfuncionamentouracoesFuncionamento}
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
         <h2 className="text-2xl font-black text-orange-700 uppercase tracking-wider mb-8 flex flex-col items-center gap-2">
  <span className="flex items-center gap-3">
    <span>📋</span> Pedidos em Andamento
  </span>
  <span className="text-3xl font-black text-orange-800">({pedidosAtivos.length})</span>
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
                  className="bg-[#FFFBEB] border border-orange-400/50 rounded-3xl p-7 hover:border-orange-500 hover:scale-[1.01] transition-all shadow-lg"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h3 className="font-black text-xl uppercase text-orange-900">{pedido.nome}</h3>
                      
                      {/* ⏱ HORA DESTACADA AQUI ⏱ */}
                      <p className="text-orange-700 font-black text-base mt-1 bg-orange-200/50 px-3 py-1 rounded-lg inline-block">⏱ {pedido.horario}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-sm font-black uppercase shadow-sm ${pedido.pagamento === "Pix" ? "bg-teal-400/30 text-teal-800 border border-teal-500/40" : "bg-amber-400/30 text-amber-800 border border-amber-500/40"}`}>
                      {pedido.pagamento}
                    </span>
                  </div>

                  <p className="text-orange-900/80 text-base mb-5 font-bold">{pedido.endereco}</p>
                  
                  {pedido.observacao && (
                    <p className="bg-orange-500/20 border border-orange-500/40 text-orange-800 text-sm p-4 rounded-xl mb-5 font-bold">
                      💡 Obs: {pedido.observacao}
                    </p>
                  )}

                      <div className="flex justify-between items-center pt-2">
      <div className="space-y-1.5">
        {/* 💰 VALOR TOTAL (VERDE) */}
        <p className="text-xl font-black text-emerald-600">R$ {pedido.valorTotal.toFixed(2)}</p>
        
        {/* 🔴 TROCO - TAMANHO PEQUENO, DO JEITO QUE FICOU BOM */}
        {pedido.pagamento === "Dinheiro" && (() => {
          const valorTroco = pedido.trocoPara || pedido.troco || 0;
          if (valorTroco > 0) {
            return (
              <p className="text-sm font-black text-red-600 bg-red-100/60 px-2.5 py-0.5 rounded-md border border-red-400/30 inline-block shadow-sm m-0">
                🔴 TROCO R$ {valorTroco.toFixed(2)}
              </p>
            );
          }
          if (valorTroco === 0) {
            return (
              <p className="text-sm font-black text-red-600 bg-red-100/60 px-2.5 py-0.5 rounded-md border border-red-400/30 inline-block shadow-sm m-0">
                🔴 R$ SEM TROCO
              </p>
            );
          }
          return null;
        })()}
      </div>

      {/* ✅ BOTÃO CONCLUIR - AUMENTADO, BONITO E DESTAQUE */}
      <button
        onClick={() => setPedidoSelecionadoParaConcluir(pedido)}
        className="text-base font-black bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 rounded-lg px-5 py-2 shadow-md hover:bg-emerald-500/30 transition-all whitespace-nowrap uppercase leading-none"
      >
        ✅ Concluir
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
                  value={trocoParaAvulso || ""}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, "");
                    if (!valor) {
                      setTrocoParaAvulso("");
                      setTrocoCalculadoAvulso(0);
                      return;
                    }
                    const valorNumerico = Number(valor) / 100;
                    setTrocoParaAvulso(valorNumerico.toFixed(2).replace(".", ","));
                    setTrocoCalculadoAvulso(valorNumerico - valorTotalAvulsoNumerico);
                  }}
                  placeholder="0,00"
                  className="w-full bg-[#FFFFFF] border border-[#F3F4F6] rounded-xl p-3 text-[#27272A] font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <p className="text-xs font-black text-amber-700 uppercase mb-1">Troco</p>
                <p className="font-bold text-lg">
                  {trocoCalculadoAvulso > 0 
                    ? `R$ ${trocoCalculadoAvulso.toFixed(2).replace(".", ",")}` 
                    : trocoCalculadoAvulso === 0 
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
                R$ {valorTotalAvulso}
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
                      mensagem += `TROCO: ${trocoCalculadoAvulso > 0 ? `R$ ${trocoCalculadoAvulso.toFixed(2).replace(".", ",")}` : "SEM TROCO"}\n`;
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
                  navigator.clipboard.writeText(resumo);
                  const numeroLimpo = (whatsappAvulso || "").replace(/\D/g, "");
                  if (numeroLimpo.length >= 10) {
                    const urlZap = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(resumo)}`;
                    window.open(urlZap, "_blank");
                  } else {
                    const urlZap = `https://wa.me/?text=${encodeURIComponent(resumo)}`;
                    window.open(urlZap, "_blank");
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
                onClick={() => finalizarPedidoAvulsoComStatusRoteado("pago")}
                className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                💲 Pago
              </button>
              <button
                type="button"
                disabled={!funcionamentoAberta || valorTotalAvulsoNumerico <= 0}
                onClick={() => finalizarPedidoAvulsoComStatusRoteado("espera")}
                className="py-3 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                📦 Em Espera
              </button>
              <button
                type="button"
                disabled={!funcionamentoAberta || valorTotalAvulsoNumerico <= 0}
                onClick={() => finalizarPedidoAvulsoComStatusRoteado("pendente")}
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
                      window.open(url, "_blank");
                    } else {
                      const mensagemCobranca = `Olá ${pedido.nome}.
Seu pedido da Tapicuz está pendente de pagamento.
Valor total: R$ ${pedido.valorTotal.toFixed(2).replace('.', ',')}.
Por favor, efetue o pagamento quando puder.
Agradecemos a preferência.`;
                      const url = `https://wa.me/?text=${encodeURIComponent(mensagemCobranca)}`;
                      window.open(url, "_blank");
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

{/* ✅ MODAL DETALHES - CORRIGIDO, NÃO CORTA + BOTÃO FECHAR */}
{pedidoDetalhado && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-[#FFFAF5] border border-orange-500/30 w-full max-w-lg rounded-3xl p-6 shadow-2xl my-8">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-black text-orange-500 uppercase tracking-wider">Resumo do Pedido</h3>
        <button
          onClick={() => setPedidoDetalhado(null)}
          className="text-red-500 hover:text-red-700 text-xl font-black w-8 h-8 flex items-center justify-center rounded-full bg-red-100"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <p><strong className="text-orange-600">CLIENTE:</strong> {pedidoDetalhado.nome.toUpperCase()}</p>
        <p><strong className="text-orange-600">ENDEREÇO:</strong> {pedidoDetalhado.endereco} {pedidoDetalhado.observacao ? `- Ref: ${pedidoDetalhado.observacao}` : ''}</p>
        <p><strong className="text-orange-600">HORÁRIO:</strong> {pedidoDetalhado.horario}</p>
        <p><strong className="text-orange-600">PAGAMENTO:</strong> {pedidoDetalhado.pagamento}</p>
        
        {pedidoDetalhado.pagamento === 'Dinheiro' && (
          <p><strong className="text-orange-600">TROCO:</strong> R$ {pedidoDetalhado.troco?.toFixed(2).replace('.', ',')}</p>
        )}

        <div className="border-t border-orange-200 my-3 pt-3">
          <p className="font-black text-orange-500 uppercase mb-2">Itens do Pedido</p>
          {pedidoDetalhado.itens && (typeof pedidoDetalhado.itens === 'object' && !Array.isArray(pedidoDetalhado.itens)) ? (
            Object.entries(pedidoDetalhado.itens).map(([chave, qtd]) => {
              if (typeof qtd === 'number' && qtd > 0) {
                const prod = produtos.find(p => p.chave === chave);
                return prod ? (
                  <p key={chave} className="mb-1">• {qtd}x {prod.nome} - R$ {(prod.preco * qtd).toFixed(2).replace('.', ',')}</p>
                ) : null;
              }
              return null;
            })
          ) : pedidoDetalhado.itens && Array.isArray(pedidoDetalhado.itens) ? (
            pedidoDetalhado.itens.map((item, idx) => (
              item.quantidade > 0 && <p key={idx} className="mb-1">• {item.quantidade}x {item.nome} - R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</p>
            ))
          ) : (
            <p>Nenhum item cadastrado</p>
          )}
        </div>

        <div className="border-t border-orange-200 pt-3">
          <p className="text-lg font-black text-emerald-500">VALOR TOTAL: R$ {pedidoDetalhado.valorTotal.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      <button
        onClick={() => setPedidoDetalhado(null)}
        className="w-full mt-6 py-3 bg-orange-500 text-white rounded-xl font-black uppercase hover:bg-orange-600 transition-all"
      >
        Fechar
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
            <div className="overflow-x-auto">
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
      📜 Histórico de Vendas Pagas <span className="text-orange-400">({pedidosPagos.length})</span>
    </h2>

    {pedidosPagos.length === 0 ? (
      <div className="text-center py-14 text-zinc-500 font-medium uppercase text-sm">
        📭 Nenhuma venda registrada no momento
      </div>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-[#F3E9DD]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#FFF7ED] border-b border-[#F3E9DD]">
              <th className="p-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Cliente</th>
              <th className="p-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Horário</th>
              <th className="p-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Pagamento</th>
              <th className="p-4 text-xs font-bold text-orange-700 uppercase tracking-wider">Valor</th>
              {/* Ajuste aqui: alinhamento e proporção */}
              <th className="p-4 text-xs font-bold text-orange-700 uppercase tracking-wider text-center">Status</th>
              <th className="p-4 text-xs font-bold text-orange-700 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3E9DD]">
            {pedidosPagos.map((pedido) => (
              <tr 
                key={pedido.id} 
                className="hover:bg-[#FFEDD5]/60 transition-all duration-200 ease-in-out"
              >
                {/* Cliente */}
                <td className="p-4 max-w-[200px] group relative">
                  <div 
                    className="font-semibold text-zinc-800 truncate cursor-help"
                    title={pedido.nome}
                  >
                    {pedido.nome}
                  </div>
                  <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block bg-zinc-800 text-white text-xs rounded-md px-3 py-2 shadow-lg max-w-xs break-words">
                    {pedido.nome}
                  </div>
                </td>

                {/* Horário */}
                <td className="p-4">
                  <span className="font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md text-sm">
                    {pedido.horario}
                  </span>
                </td>

                {/* Pagamento */}
                <td className="p-4">
                  <span 
                    className={`px-3 py-1 rounded-md text-xs font-bold uppercase ${
                      pedido.pagamento === "Pix" 
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                        : pedido.pagamento === "Dinheiro"
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {pedido.pagamento}
                  </span>
                </td>

                {/* Valor */}
                <td className="p-4">
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    R$ {pedido.valorTotal.toFixed(2)}
                  </span>
                </td>

                {/* Status: centralizado e proporcional */}
                <td className="p-4 text-center">
                  <span className="inline-block w-max text-xs font-bold uppercase px-3 py-1 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Concluído
                  </span>
                </td>

                {/* Ações: alinhado à direita e proporcional */}
                <td className="p-4 text-right">
                  <button
                    onClick={() => setPedidoDetalhado(pedido)}
                    className="px-3.5 py-1.5 bg-orange-100 hover:bg-orange-200 active:bg-orange-300 rounded-lg text-xs font-bold uppercase text-orange-800 transition-colors"
                  >
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            value={valorDespesaInput}
            onChange={(e) => setValorDespesaInput(e.target.value)}
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

{/* ✅ Modal: Confirmação Apagar Histórico (100% SEM MENSAGEM DO CHROME) */}
{modalConfirmarApagarHistorico && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white border border-orange-200 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl">
      <div className="text-center">
        <span className="text-5xl text-orange-400">🗑️</span>
      </div>
      <h3 className="text-lg font-black text-orange-500 uppercase text-center tracking-wider">
        Confirmar Exclusão
      </h3>
      <p className="text-center text-zinc-600 font-bold text-base">
        Tem certeza que deseja apagar todo o histórico de fechamentos? <br/>
        Essa ação não poderá ser desfeita.
      </p>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => {
            // Limpa tudo diretamente, sem alertas antigos
            setHistoricoCaixas([]);
            localStorage.removeItem('historicoCaixas');
            setModalConfirmarApagarHistorico(false);

            // Mensagem bonita personalizada
            const msg = document.createElement('div');
            msg.innerText = 'Histórico apagado com sucesso!';
            msg.style.cssText = `
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: #f59e0b;
              color: white;
              font-weight: 900;
              font-size: 15px;
              padding: 14px 28px;
              border-radius: 12px;
              z-index: 99999;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            `;
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 2500);
          }}
          className="py-3 bg-orange-500 text-white rounded-xl font-black uppercase hover:bg-orange-600 transition-all"
        >
          SIM, APAGAR
        </button>
        <button 
          onClick={() => setModalConfirmarApagarHistorico(false)} 
          className="py-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl font-black uppercase transition-all"
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
