"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, doc, onSnapshot, addDoc, query } from "firebase/firestore"
import Image from "next/image"
import { gerarPixCopiaECola } from "@/lib/pix"

// Tipagem das etapas do app
type Etapa = "menu" | "observacao" | "checkout" | "confirmacao" | "sucesso"

/// LISTA DE VERSÍCULOS AMPLIADA
const VERSICULOS_BENCÃO = [
  "Posso todas as coisas naquele que me fortalece. (Filipenses 4:13)",
  "Não temas, pois eu estou com você; não tenha medo, pois eu sou o seu Deus. Eu lhe darei força, eu o ajudarei e o sustentarei com a minha mão direita vitoriosa. (Isaías 41:10)",
  "Mas os que esperam no Senhor renovam as suas forças. Voam alto como águias; correm e não ficam exaustos, caminham e não se cansam. (Isaías 40:31)",
  "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça o Senhor em todos os seus caminhos, e ele endireitará as suas veredas. (Provérbios 3:5-6)",
  "O Senhor é a minha força e a minha defesa; ele é a minha salvação. Ele é o meu Deus, e eu o louvarei; é o Deus do meu pai, e eu o exaltarei. (Êxodo 15:2)",
  "Porque eu bem sei os planos que tenho para vocês, diz o Senhor; planos de fazê-los prosperar e não de lhes causar mal, planos de dar-lhes esperança e um futuro. (Jeremias 29:11)",
  "Se Deus é por nós, quem será contra nós? (Romanos 8:31)",
  "Em tudo isso somos mais do que vencedores, por meio daquele que nos amou. (Romanos 8:37)",
  "O Senhor é o meu pastor, nada me faltará. (Salmo 23:1)",
  "Entregue ao Senhor o seu caminho; confie nele, e ele agirá. (Salmo 37:5)",
  "Deus é o nosso refúgio e a nossa força, uma ajuda sempre presente nas dificuldades. (Salmo 46:1)",
  "Quando você passar por águas profundas, eu estarei com você; quando você passar por rios de dificuldades, eles não o cobrirão. Quando você andar pelo fogo, não se queimará; as chamas não o consumirão. (Isaías 43:2)",
  "Porque onde estiverem dois ou três reunidos em meu nome, eu estou no meio deles. (Mateus 18:20)",
  "Peçam, e lhes será dado; busquem, e encontrarão; batam, e a porta lhes será aberta. (Mateus 7:7)",
  "Não se preocupem com nada; em tudo, porém, apresentem os seus pedidos a Deus, com oração e súplica, e com ação de graças. (Filipenses 4:6)",
  "E a paz de Deus, que excede todo o entendimento, guardará o seu coração e a sua mente em Cristo Jesus. (Filipenses 4:7)",
  "Porque vocês não receberam um espírito de escravidão, para voltarem a ter medo; mas receberam o Espírito de adoção, por meio do qual clamamos: ‘Aba, Pai!’ (Romanos 8:15)",
  "E sabemos que em todas as coisas Deus age para o bem daqueles que o amam, dos que foram chamados segundo o seu propósito. (Romanos 8:28)",
  "Se vocês permanecerem em mim, e as minhas palavras permanecerem em vocês, pedirão o que quiserem, e lhes será concedido. (João 15:7)",
  "Eu lhes disse essas coisas para que em mim vocês tenham paz. Neste mundo vocês terão aflições; mas tenham coragem! Eu venci o mundo. (João 16:33)",
  "O Senhor lutará por vocês; vocês só precisam ficar calmos. (Êxodo 14:14)",
  "Seja forte e corajoso! Não se assuste, nem fique desanimado, pois o Senhor, o seu Deus, estará com você por onde você andar. (Josué 1:9)",
  "Porque Deus não nos deu um espírito de covardia, mas de poder, de amor e de equilíbrio. (2 Timóteo 1:7)",
  "Minha graça basta a você, pois a minha força se aperfeiçoa na fraqueza. (2 Coríntios 12:9)",
  "O Senhor está perto dos que têm o coração quebrantado e salva os que têm o espírito arrependido. (Salmo 34:18)",
  "Entregue a sua preocupação ao Senhor, pois ele se importa com você. (1 Pedro 5:7)",
  "Quem habita no abrigo do Altíssimo descansa à sombra do Todo-poderoso. Diz ao Senhor: ‘Tu és o meu refúgio e a minha fortaleza, o meu Deus, em quem confio’. (Salmo 91:1-2)",
  "Eis que estou à porta e bato. Se alguém ouvir a minha voz e abrir a porta, entrarei e cearei com ele, e ele comigo. (Apocalipse 3:20)",
  "Mas vocês receberão poder, quando o Espírito Santo descer sobre vocês; e serão minhas testemunhas em Jerusalém, em toda a Judéia e Samaria, e até os confins da terra. (Atos 1:8)",
  "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha. Não maltrata, não procura seus interesses, não se ira facilmente, não guarda rancor. (1 Coríntios 13:4-5)",
  "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e te conceda a sua graça. (Números 6:24-25)",
  "Buscai em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas vos serão acrescentadas. (Mateus 6:33)",
  "Porque para Deus nada é impossível. (Lucas 1:37)",
  "O Senhor é bom, uma fortaleza no dia da angústia, e conhece os que confiam nele. (Naum 1:7)",
  "Grande é a sua fidelidade; as suas misericórdias renovam-se cada manhã. (Lamentações 3:22-23)",
  "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos. (Provérbios 16:3)",
  "O Senhor guardará a tua saída e a tua entrada, desde agora e para sempre. (Salmo 121:8)",
  "Este é o dia que o Senhor fez; exultemos e alegremo-nos nele. (Salmo 118:24)",
  "Abençoado é o homem que confia no Senhor, e cuja confiança ele é. (Jeremias 17:7)",
  "Eu farei de você uma nação grande, e o abençoarei; tornarei o seu nome famoso, e você será uma bênção. (Gênesis 12:2)"
];

const PRECOS_PRODUTOS: { [key: string]: number } = {
  tapiocaMolhada: 8.00,
  tapiocaManteiga: 6.00,
  tapiocaQueijo: 8.00,
  tapiocaOvo: 8.00,          
  tapiocaQueijoOvo: 10.00,    
  cuscuzMilho: 5.00,
  cuscuzArroz: 6.00,
  cuscuzMilhoArroz: 6.00,
  cafe: 4.00
}

const DETALHES_PRODUTOS: { [key: string]: { nome: string; icone: string; imagem: string } } = {
  tapiocaMolhada: { nome: "Tapioca Molhada", icone: "🥥", imagem: "tapioca_molhada.png" },
  tapiocaManteiga: { nome: "Tapioca com Manteiga", icone: "🧈", imagem: "tapioca_manteiga.png" },
  tapiocaQueijo: { nome: "Tapioca com Queijo", icone: "🧀", imagem: "tapioca_queijo.png" },
  tapiocaOvo: { nome: "Tapioca com Ovo", icone: "🥚", imagem: "tapioca_ovo.png" },                  
  tapiocaQueijoOvo: { nome: "Tapioca com Queijo e Ovo", icone: "🧀🥚", imagem: "tapioca_queijo_ovo.png" },
  cuscuzMilho: { nome: "Cuscuz de Milho", icone: "🌽", imagem: "cuscuz_milho.png" },
  cuscuzArroz: { nome: "Cuscuz de Arroz", icone: "🍚", imagem: "cuscuz_arroz.png" },
  cuscuzMilhoArroz: { nome: "Cuscuz Misto (Milho e Arroz)", icone: "🍲", imagem: "cuscuz_milho_arroz.png" },
  cafe: { nome: "Café com Leite", icone: "☕", imagem: "cafe_leite.png" }
}

export default function ClientePainel() {
  const [lojaAberta, setLojaAberta] = useState<boolean>(true)
  const [dadosFuncionamento, setDadosFuncionamento] = useState<any>(null)
  const [carregandoLoja, setCarregandoLoja] = useState(true)
  const [enviandoPedido, setEnviandoPedido] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>("menu")
  const [produtosBanco, setProdutosBanco] = useState<{ 
    [key: string]: { 
      disponivel: boolean; 
      preco: number; 
      nome: string;
      icone: string;
    } 
  }>({})
  const [nome, setNome] = useState("")
  const [endereco, setEndereco] = useState("")
  const [numeroCasa, setNumeroCasa] = useState("")
  const [referencia, setReferencia] = useState("")
  const [observacao, setObservacao] = useState("") 
  const [pagamento, setPagamento] = useState<"Pix" | "Dinheiro">("Pix")
  const [trocoPara, setTrocoPara] = useState("")
  const [horario, setHorario] = useState("")
  const [mostrarListaHorarios, setMostrarListaHorarios] = useState(false)
  const [telefone, setTelefone] = useState("")
const [mostrarAvisoDados, setMostrarAvisoDados] = useState(true)

  // Dias da semana
  const [diaEscolhido, setDiaEscolhido] = useState<any>(null)
  const DIAS_FUNCIONAMENTO = [
    {valor:"segunda", nome:"Segunda"}, {valor:"terca", nome:"Terça"}, {valor:"quarta", nome:"Quarta"},
    {valor:"quinta", nome:"Quinta"}, {valor:"sexta", nome:"Sexta"}, {valor:"sabado", nome:"Sábado"}, {valor:"domingo", nome:"Domingo"}
  ]

  const [statusPix, setStatusPix] = useState<"normal" | "carregando" | "copiado" | "erro">("normal")
  const [mostrarAlertaPix, setMostrarAlertaPix] = useState(false)
  const [codigoPix, setCodigoPix] = useState("")
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [lojaManualAberta, setLojaManualAberta] = useState(true)
  
  const [versiculoEscolhido, setVersiculoEscolhido] = useState("")
  const [mostrarMensagemCopiado, setMostrarMensagemCopiado] = useState(false)

  const [itens, setItens] = useState<{ [key: string]: number }>({
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
  useEffect(() => {
  if (dadosFuncionamento) {
    verificarSeEstaAberto(dadosFuncionamento)
  }
}, [lojaManualAberta, dadosFuncionamento])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setNome(localStorage.getItem("tapicuz_nome") || "")
      setEndereco(localStorage.getItem("tapicuz_endereco") || "")
      setNumeroCasa(localStorage.getItem("tapicuz_numero") || "")
      setReferencia(localStorage.getItem("tapicuz_referencia") || "")
      setTelefone(localStorage.getItem("tapicuz_telefone") || "")
    }
  
    // Busca configurações completas do admin
    const refFuncionamento = doc(db, "config", "funcionamento")
    const refStatusLoja = doc(db, "configuracoes", "funcionamento")//

  const unsubscribeStatus = onSnapshot(refStatusLoja, (snap) => {
  if (snap.exists()) {
    const dados = snap.data()

    const aberto = dados.aberta === true

    setLojaManualAberta(aberto)

    if (!aberto) {
      setLojaAberta(false)
    } else if (dadosFuncionamento) {
      verificarSeEstaAberto(dadosFuncionamento)
    }
  }
})
    
    const unsubscribeFuncionamento = onSnapshot(refFuncionamento, (snap) => {
      if (snap.exists()) {
        const dados = snap.data()
        setDadosFuncionamento(dados)
        verificarSeEstaAberto(dados)
      } else {
        setLojaAberta(false)
      }
      setCarregandoLoja(false)
    }, (error) => {
      console.error("Erro ao carregar funcionamento:", error)
      setLojaAberta(false)
      setCarregandoLoja(false)
    })

    // Busca produtos do banco
    const qProdutos = query(collection(db, "produtos"))
    const unsubscribeProdutos = onSnapshot(qProdutos, (snap) => {
      const dados: { [key: string]: { disponivel: boolean; preco: number; nome: string; icone: string } } = {}
      snap.forEach((doc) => {
        const p = doc.data()
        dados[p.chave] = {
          disponivel: p.disponivel !== false,
          preco: p.preco || 0,
          nome: p.nome || "",
          icone: p.icone || ""
        }
      })
      setProdutosBanco(dados)
    })

    return () => {
      unsubscribeFuncionamento()
      unsubscribeProdutos()
      unsubscribeStatus()
    }
  }, [])

       // ✅ Validação do WhatsApp: obrigatório começar com 919
function validarTelefone(telefone: string): boolean {
  const apenasNumeros = telefone.replace(/\D/g, "") // tira espaços e símbolos
  return apenasNumeros.startsWith("919") && apenasNumeros.length >= 9
}
  // Verifica se loja está aberta
  function verificarSeEstaAberto(dados: any) {
    if (!lojaManualAberta) {
      setLojaAberta(false)
      return
    }

    const { diasFuncionamento, horaAbertura, horaFechamento } = dados
    const diasSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"]
    const diaAtual = diasSemana[new Date().getDay()]

    const diaFunciona = diasFuncionamento[diaAtual] === true
    if (!diaFunciona) {
      setLojaAberta(false)
      return
    }

    const agora = new Date()
    const [hAbre, mAbre] = horaAbertura.split(":").map(Number)
    const [hFecha, mFecha] = horaFechamento.split(":").map(Number)

    const abertura = new Date(); abertura.setHours(hAbre, mAbre, 0)
    const fechamento = new Date(); fechamento.setHours(hFecha, mFecha, 0)

    setLojaAberta(agora >= abertura && agora < fechamento)
  }

  // ✅ FUNÇÃO NOVA: Retorna apenas os dias que o admin LIBEROU PARA ENTREGA
  function diasPermitidosParaEntrega() {
    if (!dadosFuncionamento?.diasFuncionamento) return []

    return DIAS_FUNCIONAMENTO.filter(
      dia => dadosFuncionamento.diasFuncionamento[dia.valor] === true
    )
  }

  // ✅ FUNÇÃO NOVA: Retorna apenas os horários que o admin cadastrou para o dia escolhido
function horariosPermitidosParaDia() {
  if (!dadosFuncionamento || !diaEscolhido) return []

  const horarios =
    dadosFuncionamento.horariosPorDia?.[diaEscolhido.valor]

  if (!horarios) return []

  console.log("Horários do dia:", horarios)

  return horarios.sort()
}
  function alterarQtd(chave: string, valor: number) {
    setItens(prev => ({
      ...prev,
      [chave]: Math.max(0, prev[chave] + valor)
    }))
  }

  const totalItensSelecionados = Object.values(itens).reduce((a, b) => a + b, 0)
  
  // Cálculos de preço e desconto
  let subtotal = 0
  let qtdComidas = 0
  let qtdCafes = itens.cafe

  Object.entries(itens).forEach(([key, qtd]) => {
    const precoCorreto = produtosBanco[key]?.preco ?? PRECOS_PRODUTOS[key]
    subtotal += precoCorreto * qtd
    if (key !== "cafe") qtdComidas += qtd
  })

  let descuentoCombo = 0
  if (qtdComidas > 0 && qtdCafes > 0) {
    const totalCombos = Math.min(qtdComidas, qtdCafes)
    descuentoCombo = totalCombos * 2.00
  }

  const valorTotalFinal = Math.max(0, subtotal - descuentoCombo)
  const trocoParaNum = parseFloat(trocoPara.replace(",", ".")) || 0
  const trocoCalculado = pagamento === "Dinheiro" && trocoParaNum > valorTotalFinal ? trocoParaNum - valorTotalFinal : 0

  function irParaConferencia(e: React.FormEvent) {
    e.preventDefault()
    setErroValidacao(null)

    if (!lojaAberta) return

    if (valorTotalFinal === 0) {
      setErroValidacao("Você não adicionou nenhum item ao carrinho.")
      setEtapa("menu")
      return
    }
    if (!nome.trim()) {
      setErroValidacao("Por favor, preencha o campo: Seu Nome.")
      document.getElementById("campo-nome")?.scrollIntoView({ behavior: "smooth" })
      return
    }
if (!telefone.trim()) {
  setErroValidacao("Por favor, preencha seu WhatsApp.")
  document.getElementById("campo-telefone")?.scrollIntoView({ behavior: "smooth" })
  return
}
// ✅ NOVA VALIDAÇÃO: Obriga começar com 919
if (!validarTelefone(telefone)) {
  setErroValidacao("⚠️ O NÚMERO DEVE COMEÇAR COM 919! Digite o código da região primeiro.")
  document.getElementById("campo-telefone")?.scrollIntoView({ behavior: "smooth" })
  return
}
    if (!endereco.trim()) {
      setErroValidacao("Por favor, preencha o campo: Endereço de Entrega.")
      document.getElementById("campo-endereco")?.scrollIntoView({ behavior: "smooth" })
      return
    }
    if (!numeroCasa.trim() || !/^\d+$/.test(numeroCasa)) {
      setErroValidacao("Por favor, preencha um número válido da casa.")
      document.getElementById("campo-numero")?.scrollIntoView({ behavior: "smooth" })
      return
    }
    if (!diaEscolhido) {
      setErroValidacao("Por favor, escolha o Dia para a sua entrega.")
      document.getElementById("campo-horario")?.scrollIntoView({ behavior: "smooth" })
      return
    }
    if (!horario) {
      setErroValidacao("Por favor, escolha o Horário para a sua entrega.")
      setMostrarListaHorarios(true)
      document.getElementById("campo-horario")?.scrollIntoView({ behavior: "smooth" })
      return
    }
    
    setEtapa("confirmacao")
  }

  async function executarCopiaTexto(texto: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto)
        return true
      }
      return false
    } catch (err) {
      console.error("Erro ao copiar:", err)
      return false
    }
  }

  async function processarEnvioPedido() {
    if (enviandoPedido) return
    setEnviandoPedido(true)
    setStatusPix("normal")
    setCodigoPix("")

    if (pagamento === "Pix") {
      try {
        setStatusPix("carregando")
        const dadosPix = await gerarPixCopiaECola(valorTotalFinal)
        
        if (!dadosPix || !dadosPix.payload) {
          throw new Error("Retorno do PIX inválido ou vazio")
        }

        setCodigoPix(dadosPix.payload)
        setStatusPix("copiado")
        setMostrarAlertaPix(true)
        
      } catch (error) {
        console.error("Erro crítico no fluxo do PIX:", error)
        setStatusPix("erro")
        alert("Não foi possível gerar o código PIX. Verifique a configuração da chave no sistema.")
      } finally {
        setEnviandoPedido(false)
      }
    } else {
      await salvarPedidoNoBanco()
    }
  }

  async function salvarPedidoNoBanco() {
    setEnviandoPedido(true)
    
    if (typeof window !== "undefined") {
      localStorage.setItem("tapicuz_nome", nome.trim())
      localStorage.setItem("tapicuz_endereco", endereco.trim())
      localStorage.setItem("tapicuz_numero", numeroCasa.trim())
      localStorage.setItem("tapicuz_referencia", referencia.trim())
      localStorage.setItem("tapicuz_telefone", telefone.trim())
    }

    const enderecoCompleto = `${endereco.trim()}, Nº ${numeroCasa.trim()} ${referencia.trim() ? `- Ref: ${referencia.trim()}` : ""}`

 const payloadPedido = {
  nome: nome.trim(),
  telefone: telefone.trim(),
  endereco: enderecoCompleto,
  observacao: observacao.trim(),
  pagamento,
  troco: trocoCalculado,
  valorTotal: valorTotalFinal,
  horario,
  dia: diaEscolhido?.nome || "",
  pago: pagamento === "Pix",
  concluido: false,
  dataCriacao: new Date().toISOString(),
  itens
}

    try {
      await addDoc(collection(db, "pedidos"), payloadPedido)
      
      const indiceAleatorio = Math.floor(Math.random() * VERSICULOS_BENCÃO.length)
      setVersiculoEscolhido(VERSICULOS_BENCÃO[indiceAleatorio])
      
      setEtapa("sucesso")
    } catch (error) {
      console.error("Erro ao enviar pedido:", error)
      alert("Houve um erro ao enviar o seu pedido. Por favor, tente novamente.")
    } finally {
      setEnviandoPedido(false)
      setMostrarAlertaPix(false)
    }
  }

  function reiniciarPainel() {
    setItens({ 
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
    setObservacao("") 
    setTrocoPara("")
    setHorario("")
    setDiaEscolhido(null)
    setErroValidacao(null)
    setVersiculoEscolhido("")
    setStatusPix("normal")
    setCodigoPix("")
    setEtapa("menu")
  }

  if (carregandoLoja) {
    return (
      <div className="min-h-screen bg-[#FFFAF5] flex items-center justify-center text-zinc-500 text-xs tracking-widest font-bold animate-pulse">
        CARREGANDO CARDÁPIO...
      </div>
    )
  }

  if (!lojaAberta) {
    return (
      <div className="min-h-screen bg-orange-600 flex flex-col items-center justify-center px-4 text-center text-zinc-900">
        <div className="text-center mb-8 select-none">
          <h1 className="text-5xl font-extrabold tracking-[0.2em] text-white uppercase drop-shadow-lg">TAPICUZ</h1>
          <p className="text-lg font-bold text-amber-100 tracking-[0.4em] uppercase mt-2">DA SUL</p>
        </div>
        <div className="max-w-md w-full bg-[#FFFFFF] border border-[#F3F4F6] p-8 rounded-3xl shadow-2xl space-y-5">
          <div className="text-5xl animate-pulse">🌙</div>
          <h2 className="text-xl font-black uppercase text-orange-500 tracking-wider leading-relaxed">
            {dadosFuncionamento ? 
              "ESTAMOS FECHADOS NO MOMENTO" 
              : "NÃO ESTAMOS ACEITANDO PEDIDOS AGORA!"
            }
          </h2>
          <p className="text-lg font-bold text-[#52525B] leading-relaxed">
            Agradecemos sua visita! 🧡<br/>
            Voltaremos em breve.
          </p>
        </div>
      </div>
    )
  }

  if (etapa === "sucesso") {
    return (
      <div className="min-h-screen bg-[#FFFAF5] flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md w-full bg-[#FFFFFF] border-4 border-orange-500 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner animate-bounce">
            ✓
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-emerald-400 tracking-wider uppercase">
              PEDIDO ENVIADO COM SUCESSO!
            </h2>
          </div>

          {versiculoEscolhido && (
            <div className="border-2 border-amber-500/30 py-5 my-2 space-y-3 bg-[#FFFAF5] rounded-2xl p-5 shadow-inner">
              <span className="text-xs font-black text-amber-800 tracking-widest block uppercase">
                📖 UMA PALAVRA PARA O SEU DIA:
              </span>
              <p className="text-base text-[#03030f] font-bold leading-relaxed px-1">
                "{versiculoEscolhido}

              </p>
            </div>
          )}

          <button 
            type="button"
            onClick={reiniciarPainel}
            className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-black text-sm uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            AMÉM 🙏
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#FFFAF5] text-[#27272A] pb-32 font-sans antialiased selection:bg-orange-500/20">
      
      {mostrarMensagemCopiado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-emerald-500 text-[#27272A] px-8 py-6 rounded-2xl shadow-2xl transform scale-105 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div className="text-left">
                <h3 className="font-black text-lg">CÓDIGO COPIADO!</h3>
                <p className="text-sm text-emerald-100">Agora é só colar no seu app do banco 🚀</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarAlertaPix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#FFFFFF] border-4 border-emerald-500 max-w-md w-full rounded-[32px] p-8 text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 text-4xl flex items-center justify-center mx-auto">
              📲
            </div>
            
            <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-wide">
              PIX GERADO COM SUCESSO!
            </h3>
            
            <div className="space-y-4 text-[#080811] text-xl font-bold leading-snug">
              <p className="text-lg text-[#030314]">Olá,</p>
              <p className="text-4xl font-black text-orange-500 tracking-wide uppercase break-words px-2">
                {nome || "CLIENTE"}
              </p>
              <p className="text-[#27272A] pt-2">
                Copie o código abaixo e cole no seu aplicativo bancário:
              </p>

              <div className="bg-[#FFFAF5] p-3 rounded-xl border border-[#F3F4F6] break-all text-xs text-[#27272A] select-all">
                {codigoPix}
              </div>

              <button
                type="button"
                onClick={async () => {
                  const ok = await executarCopiaTexto(codigoPix)
                  if (ok) {
                    setMostrarMensagemCopiado(true)
                    setTimeout(() => setMostrarMensagemCopiado(false), 2500)
                  } else {
                    alert("❌ Erro ao copiar. Selecione o texto acima e copie manualmente.")
                  }
                }}
                className="w-full py-4 bg-orange-500 text-[#27272A] font-black rounded-xl text-base uppercase tracking-widest transition-all active:scale-95 shadow-lg"
              >
                📋 COPIAR PIX
              </button>

              <p className="bg-red-50 border-2 border-red-500 text-red-700 p-3 rounded-2xl font-black text-sm uppercase shadow-inner text-center">
                NÃO ESQUEÇA DE ENVIAR O COMPROVANTE. OBRIGADO!
              </p>
            </div>

            <button
              type="button"
              disabled={enviandoPedido}
              onClick={salvarPedidoNoBanco}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-base uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg block mt-2 disabled:opacity-40"
            >
              {enviandoPedido ? "GRAVANDO PEDIDO..." : "FINALIZAR ✅"}
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#F3F4F6]/60 px-4 py-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-center relative">
          <div className="text-center select-none">
            <h1 className="text-2xl font-mono tracking-widest italic font-black text-orange-500 uppercase">CARDÁPIO DO DIA</h1>
            <p className="text-xs font-bold text-amber-500/80 tracking-[0.2em] uppercase mt-0.5"></p>
            {dadosFuncionamento && (
              <p className="text-base font-black text-orange-600 mt-2 tracking-wider">
                ⏰ Entrega Hoje de {dadosFuncionamento.horaAbertura} às {dadosFuncionamento.horaFechamento}
              </p>
            )}
          </div>
        </div>
      </header>

      {(etapa === "menu" || etapa === "observacao" || etapa === "checkout") && (
        <div className="max-w-2xl mx-auto w-full px-0 sm:px-4">
          <div className="w-full overflow-hidden rounded-b-3xl shadow-lg border-b border-[#F3F4F6]/50 block">
            <Image
              src="/banner/banner-topo-v2.png"
              alt="Tapicuz Café da Manhã"
              width={800}
              height={220}
              priority
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      )}

      {etapa === "menu" && (
        <div className="max-w-2xl mx-auto px-4 mt-6 space-y-4">
          <div className="bg-orange-100 border-2 border-orange-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md">
            <span className="text-2xl mb-1">🔥</span>
            <div>
              <h4 className="font-black text-orange-900 uppercase tracking-wider text-base mb-1.5">
                COMBO ATIVO!
              </h4>
              <p className="text-orange-950 font-bold text-sm leading-relaxed">
                Monte qualquer par de <strong className="text-emerald-700 font-black">Comida + Café</strong>
                <br />
                por apenas <strong className="text-emerald-800 font-black">R$ 10,00</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {Object.keys(PRECOS_PRODUTOS).map((chave) => {
              const produto = DETALHES_PRODUTOS[chave]
              const preco = produtosBanco[chave]?.preco ?? PRECOS_PRODUTOS[chave]
              const quantidade = itens[chave] || 0
              const ehPrimeiroItem = chave === "tapiocaMolhada"
              const estaDisponivel = produtosBanco[chave]?.disponivel ?? true

              return (
                <div 
                  key={chave} 
                  className={`border rounded-3xl p-6 flex flex-col items-center gap-5 transition-all 
                    ${!estaDisponivel 
                      ? "bg-zinc-200/60 border-red-400/50 opacity-50 grayscale pointer-events-none" 
                      : quantidade > 0 
                        ? "bg-amber-400 border-orange-600 border-4 shadow-[0_0_20px_rgba(249,115,22,0.3)] scale-[1.02]" 
                        : "bg-amber-100/95 border-amber-200 shadow-sm"
                    }`}
                >
                  {!estaDisponivel && (
                    <span className="bg-red-500 text-[#27272A] font-black text-xs uppercase px-3 py-1 rounded-full rotate-[-8deg] shadow-lg absolute">
                      ❌ Indisponível
                    </span>
                  )}
                  <div className="w-full flex justify-center mb-3">
                    <Image
                      src={`/produtos/${produto.imagem}`}
                      alt={produto.nome}
                      width={112}
                      height={112}
                      className="w-28 h-28 object-cover aspect-square rounded-2xl border-2 border-stone-200 shadow-md"
                      loading={ehPrimeiroItem ? "eager" : "lazy"}
                      priority={ehPrimeiroItem}
                    />
                  </div>

                  <div className="text-center">
                    <h3 className={`font-black text-xl tracking-wide uppercase ${estaDisponivel ? "text-orange-600" : "text-zinc-500 line-through"}`}>
                      {produto.nome}
                    </h3>
                    <span className={`font-black text-lg block mt-1 ${estaDisponivel ? "text-emerald-600" : "text-[#71717A]"}`}>
                      R$ {preco.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center bg-stone-200/60 border border-stone-300 rounded-2xl p-1.5 gap-2 w-full max-w-[200px] justify-center">
                    {quantidade > 0 && (
                      <>
                        <button 
                          type="button" 
                          onClick={() => alterarQtd(chave, -1)} 
                          disabled={!estaDisponivel}
                          className="w-12 h-12 rounded-xl bg-stone-50 text-stone-600 border border-stone-300 shadow-sm active:scale-90 font-black text-lg transition-all"
                        >
                          -
                        </button>
                        <span className="font-black text-stone-800 text-xl w-10 text-center">{quantidade}</span>
                      </>
                    )}
                    <button 
                      type="button" 
                      onClick={() => alterarQtd(chave, 1)} 
                      disabled={!estaDisponivel}
                      className={`h-12 rounded-xl font-black transition-all active:scale-95 flex items-center justify-center ${quantidade > 0 ? "w-12 bg-orange-500 text-[#27272A] text-lg" : "w-full px-6 bg-stone-50 text-stone-700 border border-stone-300 text-sm uppercase tracking-widest"}`}
                    >
                      {quantidade > 0 ? "+" : "Adicionar"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {etapa === "observacao" && (
        <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#F3F4F6] pb-3">
            <button type="button" onClick={() => setEtapa("menu")} className="text-zinc-950 hover:text-black font-bold text-xs bg-[#FFFFFF] border border-[#F3F4F6] px-3 py-1.5 rounded-xl shadow-sm">← Voltar</button>
            <h2 className="text-xs font-black uppercase text-orange-500 tracking-wider ml-auto">Preferências</h2>
          </div>

          <div className="bg-[#FFFFFF] border border-[#F3F4F6]/80 p-6 rounded-3xl space-y-5 shadow-md text-center">
            <h2 className="text-xl font-black text-black uppercase tracking-wider block w-full text-center py-2">
              ALGUMA OBSERVAÇÃO NO PEDIDO ?
            </h2>

            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Digite aqui como você deseja o seu pedido..."
              className="w-full bg-[#FFFAF5] border border-[#F3F4F6] focus:border-orange-500 rounded-2xl p-4 text-sm text-center text-black outline-none transition-all resize-none font-medium placeholder:text-zinc-700 focus:placeholder:opacity-0"
              rows={4}
            />

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setEtapa("checkout")}
                className="w-full py-4 bg-orange-500 text-black text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
              >
                Continuar →
              </button>
            </div>
          </div>
        </div>
      )}

      {etapa === "checkout" && (
        <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#F3F4F6] pb-3">
            <button type="button" onClick={() => setEtapa("observacao")} className="text-zinc-950 hover:text-black font-bold text-xs bg-[#FFFFFF] border border-[#F3F4F6] px-3 py-1.5 rounded-xl shadow-sm">← Voltar</button>
            <h2 className="text-xs font-black uppercase text-orange-500 tracking-wider ml-auto">Informações de Entrega</h2>
          </div>
               
               {/* 📌 MENSAGEM AVISO DADOS - FONTE MAIOR */}
{mostrarAvisoDados && (
  <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-800 p-5 rounded-2xl font-bold text-center mb-5 shadow-md">
    <p className="text-lg leading-relaxed">
      ⚠️ Você só vai precisar colocar os dados apenas uma vez! Nas próximas vezes, tudo estará gravado automaticamente.
    </p>
    <button
      type="button"
      onClick={() => setMostrarAvisoDados(false)}
      className="block mx-auto mt-4 bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-black text-base uppercase tracking-wider"
    >
      OK
    </button>
  </div>
)}
          <form onSubmit={irParaConferencia} className="space-y-3 text-[11px] relative" noValidate>
            {erroValidacao && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                <div className="bg-red-50 border-4 border-red-600 text-red-700 p-5 rounded-2xl font-black text-lg uppercase tracking-wider text-center shadow-2xl animate-pulse max-w-xs w-full">
                  ⚠️ {erroValidacao}
                  <button 
                    type="button"
                    onClick={() => setErroValidacao(null)}
                    className="block mx-auto mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    ENTENDI
                  </button>
                </div>
              </div>
            )}
   


            <div className="bg-[#FFFFFF] border border-[#F3F4F6]/80 p-4 rounded-2xl space-y-3 shadow-md">
  {/* NOME */}
  <div id="campo-nome">
    <label className="text-xs font-black text-orange-500 uppercase block mb-1">Seu Nome *</label>
    <input 
      type="text" 
      placeholder="EX: MARIA SOUZA" 
      value={nome} 
      onChange={(e) => { setNome(e.target.value.toUpperCase()); setErroValidacao(null); }} 
      className="w-full bg-[#FFFAF5] border border-[#F3F4F6] focus:border-orange-500 rounded-xl p-3.5 text-sm text-black font-black uppercase outline-none transition-all" 
    />
  </div>

  {/* ENDEREÇO + NÚMERO */}
  <div className="grid grid-cols-3 gap-2">
    <div id="campo-endereco" className="col-span-2">
      <label className="text-xs font-black text-orange-500 uppercase block mb-1">Endereço de Entrega *</label>
      <input 
        type="text" 
        placeholder="EX: RUA DAS FLORES" 
        value={endereco} 
        onChange={(e) => { setEndereco(e.target.value.toUpperCase()); setErroValidacao(null); }} 
        className="w-full bg-[#FFFAF5] border border-[#F3F4F6] focus:border-orange-500 rounded-xl p-3.5 text-sm text-black font-black uppercase outline-none transition-all" 
      />
    </div>
    <div id="campo-numero">
      <label className="text-xs font-black text-orange-500 uppercase block mb-1">Número *</label>
      <input 
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="123" 
        value={numeroCasa} 
        onChange={(e) => { setNumeroCasa(e.target.value.replace(/\D/g, '')); setErroValidacao(null); }} 
        className="w-full bg-[#FFFAF5] border border-[#F3F4F6] focus:border-orange-500 rounded-xl p-3.5 text-sm font-black text-center text-black outline-none transition-all" 
      />
    </div>
  </div>

  {/* PONTO DE REFERÊNCIA */}
  <div>
    <label className="text-xs font-black text-orange-500 uppercase block mb-1">Ponto de Referência (Opcional)</label>
    <input 
      type="text" 
      placeholder="EX: PRÓXIMO AO MERCADO" 
      value={referencia} 
      onChange={(e) => setReferencia(e.target.value.toUpperCase())} 
      className="w-full bg-[#FFFAF5] border border-[#F3F4F6] focus:border-orange-500 rounded-xl p-3.5 text-sm text-black font-black uppercase outline-none transition-all" 
    />
  </div>

{/* CAMPO WHATSAPP - COM VALIDAÇÃO 919 ✅ */}
<div className="space-y-3 flex flex-col items-center pt-2">
  <label 
    className="font-black text-lg uppercase tracking-wider text-orange-600"
    style={{ fontFamily: 'Arial, sans-serif' }}
  >
    WhatsApp
  </label>
  <input
    id="campo-telefone"
    type="tel"
    value={telefone}
    onChange={(e) => {
      setTelefone(e.target.value)
      setErroValidacao(null) // limpa erro ao digitar
    }}
    placeholder="919XXXX-XXXX"
    className={`w-full max-w-md p-4 rounded-xl border-2 bg-[#FFFAF5] text-base text-black font-black placeholder:text-orange-400 focus:outline-none focus:ring-2 transition-all shadow-sm text-center
      ${telefone && !validarTelefone(telefone) 
        ? "border-red-500 focus:ring-red-500 text-red-700" 
        : "border-orange-400 focus:ring-orange-500 focus:border-orange-500"
      }`}
    style={{ fontFamily: 'Arial, sans-serif' }}
  />
  {/* ✅ ALERTA VISÍVEL SE ESTIVER ERRADO */}
  {telefone && !validarTelefone(telefone) && (
    <p className="text-red-600 font-black text-sm uppercase text-center px-2 py-1 bg-red-50 rounded-lg border border-red-300 shadow-sm animate-pulse">
      ⚠️ COMECE COM 919 + O RESTANTE DO NÚMERO
    </p>
  )}
  <p className="text-[10px] text-orange-500 font-bold uppercase">Digite começando com 919 + o restante</p>
</div>

  {/* DIA + HORÁRIO ✅ MENSAGENS SOMEM AO SELECIONAR */}
  <div id="campo-horario" className="text-center pt-3 border-t border-[#F3F4F6]/50 rounded-xl p-2 space-y-4">
    <div>
      {!diaEscolhido && (
        <label className="text-sm font-black text-orange-600 uppercase block mb-2 animate-pulse drop-shadow">
          ⚠️ PRIMEIRO ESCOLHA O DIA DA ENTREGA *
        </label>
      )}
      <div className="grid grid-cols-3 gap-2">
        {diasPermitidosParaEntrega().length === 0 ? (
          <p className="text-red-600 font-black col-span-3">Nenhum dia de entrega cadastrado no momento</p>
        ) : (
          diasPermitidosParaEntrega().map(dia => (
            <button
              key={dia.valor}
              type="button"
              onClick={() => { setDiaEscolhido(dia); setHorario(""); setErroValidacao(null) }}
              className={`py-3 px-2 rounded-lg font-bold text-xs uppercase transition-all
                ${diaEscolhido?.valor === dia.valor ? "bg-orange-500 text-black shadow-md border-2 border-orange-400" : "bg-white text-black border border-[#F3F4F6]"}`}
            >
              {dia.nome}
            </button>
          ))
        )}
      </div>
    </div>

    {diaEscolhido && (
      <div>
        {!horario && (
          <label className="text-sm font-black text-orange-600 uppercase block mb-2 animate-pulse drop-shadow">
            ⚠️ AGORA ESCOLHA O HORÁRIO ABAIXO *
          </label>
        )}
        
        <button
          type="button"
          onClick={() => setMostrarListaHorarios(!mostrarListaHorarios)}
          className={`w-full bg-[#FFFAF5] rounded-2xl py-4 px-4 flex items-center justify-center relative active:scale-95 transition-all border-4 ${!horario ? "border-orange-500 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.4)]" : "border-emerald-500"}`}
        >
          <span className={`${!horario ? "text-orange-600" : "text-emerald-600"} font-black text-2xl tracking-wide`}>
            {!horario ? "TOQUE AQUI PARA ESCOLHER A HORA" : horario}
          </span>
          <span className="text-orange-600 absolute right-4 text-xs font-bold">{mostrarListaHorarios ? "▲" : "▼"}</span>
        </button>

        {mostrarListaHorarios && (
          <div className="mt-2 grid grid-cols-4 gap-3 max-h-44 overflow-y-auto p-4 bg-[#FFFAF5] border-2 border-orange-500 rounded-xl shadow-inner">
            {horariosPermitidosParaDia().length === 0 ? (
              <p className="text-red-600 font-black col-span-4">Nenhum horário cadastrado para este dia</p>
            ) : (
              horariosPermitidosParaDia().map((hora: string) => (
                <button
                  key={hora}
                  type="button"
                  onClick={() => { setHorario(hora); setErroValidacao(null); setMostrarListaHorarios(false) }}
                  className={`py-5 px-2 text-center rounded-lg font-bold text-base transition-all ${horario === hora ? "bg-orange-500 text-black font-black shadow-lg scale-[1.05]" : "bg-white text-black border border-[#F3F4F6]"}`}
                >
                  {hora}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    )}

    {diaEscolhido && horario && (
      <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-2 shadow-inner">
        <p className="text-emerald-700 font-black text-sm uppercase tracking-wider">
          ✅ ENTREGA: {diaEscolhido.nome} às {horario}
        </p>
      </div>
    )}
  </div>

  {/* FORMA DE PAGAMENTO */}
  <div className="bg-[#FFFFFF] border border-[#F3F4F6]/80 p-4 rounded-2xl space-y-3 shadow-md">
    <div>
      <label className="text-sm font-black text-orange-600 uppercase block mb-3 text-center tracking-wider">
        FORMA DE PAGAMENTO
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button 
          type="button" 
          onClick={() => setPagamento("Pix")}
          className={`p-4 rounded-xl border-2 text-base font-black text-center uppercase tracking-wider transition-all transform active:scale-95
            ${pagamento === "Pix" 
              ? "bg-emerald-600 border-emerald-700 text-white shadow-lg scale-[1.03]" 
              : "bg-[#FFFAF5] border-[#F3F4F6] text-black hover:bg-orange-50/30"}`}
        >
          📲 PIX
        </button>
        <button 
          type="button" 
          onClick={() => setPagamento("Dinheiro")}
          className={`p-4 rounded-xl border-2 text-base font-black text-center uppercase tracking-wider transition-all transform active:scale-95
            ${pagamento === "Dinheiro" 
              ? "bg-orange-500 border-orange-700 text-white shadow-lg scale-[1.03]" 
              : "bg-[#FFFAF5] border-[#F3F4F6] text-black hover:bg-orange-50/30"}`}
        >
          💵 DINHEIRO
        </button>
      </div>
    </div>

    {/* PIX */}
    {pagamento === "Pix" && (
      <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 text-center mt-2 shadow-inner">
        <p className="text-emerald-700 font-black text-sm uppercase tracking-wider">Total a pagar no PIX</p>
        <p className="text-3xl font-black text-emerald-600 mt-1 tracking-tight">R$ {valorTotalFinal.toFixed(2)}</p>
        <p className="text-[11px] text-black mt-2 uppercase font-semibold">O código copia-e-cola será gerado ao confirmar o pedido.</p>
      </div>
    )}

  {/* DINHEIRO + TROCO - TAMANHO IGUAL, VAZIO E MENSAGEM */}
{pagamento === "Dinheiro" && (
  <div className="space-y-4 pt-3">
    <label className="text-base font-black text-orange-600 uppercase block mb-3 text-center tracking-wider">
      Precisa de Troco Para Quanto?
    </label>
    <input 
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder="DIGITE O VALOR SE PRECISAR"
      value={trocoPara} 
      onChange={(e) => setTrocoPara(e.target.value.replace(/\D/g, ''))} 
      className="w-full bg-[#FFFAF5] border border-[#F3F4F6] focus:border-orange-500 rounded-xl p-4 text-base text-center text-black font-bold outline-none transition-all" 
    />

    {/* ✅ MENSAGEM SE NÃO PRECISAR DE TROCO */}
    {!trocoPara && (
      <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-3 shadow-inner mt-2">
        <p className="text-base text-center text-orange-700 font-black uppercase tracking-wider">
          ✅ Não precisa de troco
        </p>
      </div>
    )}

    {trocoCalculado > 0 && (
      <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-4 shadow-inner mt-2">
        <p className="text-base text-center text-emerald-700 font-black uppercase tracking-wider">Seu troco será de:</p>
        <p className="text-4xl font-black text-emerald-600 text-center mt-1 tracking-tight animate-pulse">
          R$ {trocoCalculado.toFixed(2)}
        </p>
      </div>
    )}
  </div>
)}
    
  </div>
</div>

{/* BOTÃO FINAL */}
<button 
  type="submit" 
  className="w-full py-4 bg-orange-500 text-black text-base font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 text-center block mt-4"
>
  Conferir Pedido →
</button>

</form>
        </div>
      )}
{etapa === "confirmacao" && (
  <div 
    className="max-w-md mx-auto px-3 mt-4 space-y-4 text-base uppercase"
    ref={(el) => {
      // ✅ JÁ APARECE TUDO CENTRALIZADO E VISÍVEL DE CARA
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    }}
  >
    <div className="flex items-center gap-2 border-b border-[#F3F4F6] pb-2">
      <button type="button" onClick={() => setEtapa("checkout")} className="text-zinc-950 hover:text-black font-black text-xs bg-[#FFFFFF] border border-[#F3F4F6] px-2.5 py-1.5 rounded-xl shadow-sm">← ALTERAR DADOS</button>
      <h2 className="text-xs font-black uppercase text-orange-500 tracking-wider ml-auto">CONFERIR PEDIDO</h2>
    </div>

    <div className="bg-[#FFFFFF] border-2 border-orange-500/60 rounded-[28px] p-4 space-y-4 shadow-2xl text-center">
      <div className="space-y-3 text-black border-b-2 border-zinc-900 pb-4 text-sm leading-relaxed flex flex-col items-center uppercase">
        {/* ✅ CLIENTE: AUMENTADO, NEGRITO E COR NÍTIDA */}
        <p>
          <strong className="text-zinc-800 block text-[13px] uppercase tracking-wider font-black">CLIENTE:</strong> 
          <span className="text-orange-600 font-black text-lg">{nome.toUpperCase()}</span>
        </p>
        
        <div className="w-full text-center">
          {/* ✅ ENDEREÇO: AUMENTADO, NEGRITO E COR NÍTIDA */}
          <strong className="text-zinc-800 block text-[13px] uppercase tracking-wider font-black">ENDEREÇO DE ENTREGA:</strong> 
          <span className="text-orange-600 font-black text-base">
            {`${endereco.toUpperCase().trim()}, Nº ${numeroCasa.toUpperCase().trim()}`}
          </span>
          {referencia.trim() && (
            <span className="text-emerald-600 font-black block text-sm mt-2 lowercase first-letter:uppercase bg-[#FFFAF5] px-3 py-2 rounded-lg border border-orange-400 max-w-xs mx-auto shadow-sm">
              📍 Ref: {referencia.toUpperCase().trim()}
            </span>
          )}
        </div>

        {observacao.trim() && (
          <div className="w-full text-center bg-[#FFFAF5] px-3 py-2 rounded-xl border border-[#F3F4F6] max-w-sm mx-auto mt-2">
            <strong className="text-orange-500 block text-[11px] font-black uppercase tracking-wider mb-1">📝 Observação do Pedido:</strong>
            <span className="text-black font-medium normal-case block text-[11px] px-1 leading-relaxed">
              "{observacao.trim()}"
            </span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-900 w-full">
          <div>
            <strong className="text-zinc-800 block text-[13px] uppercase tracking-wider font-black">HORÁRIO MARCADO:</strong>
            <span className="text-orange-600 font-black font-mono text-lg block mt-1">{diaEscolhido?.nome} — {horario}</span>
          </div>
          <div>
            <strong className="text-zinc-800 block text-[13px] uppercase tracking-wider font-black">FORMA DE PAGAMENTO:</strong>
            <span className="text-orange-600 font-black uppercase text-base block mt-1">{pagamento.toUpperCase()}</span>
          </div>
        </div>
        
        
        {pagamento === "Dinheiro" && (
          <div className="w-full mt-2 bg-[#FFFAF5] border-2 border-amber-500/50 rounded-xl p-3 space-y-1.5 text-center shadow-inner">
            <div>
              <span className="text-black text-[10px] font-black block tracking-widest">VAI PAGAR COM NOTA DE:</span>
              <span className="text-amber-600 font-mono font-black text-xl">
                R$ {trocoParaNum > 0 ? trocoParaNum.toFixed(2) : valorTotalFinal.toFixed(2)}
              </span>
            </div>
            {trocoCalculado > 0 && (
              <div className="border-t border-[#F3F4F6]/80 pt-1.5">
                <span className="text-black text-[10px] font-black block tracking-widest">VALOR DO SEU TROCO:</span>
                <span className="text-emerald-600 font-mono font-black text-2xl block mt-0.5 animate-pulse">
                  R$ {trocoCalculado.toFixed(2)}
                </span>
              </div>
            )}
            {!trocoPara && (
              <div className="border-t border-[#F3F4F6]/80 pt-1.5">
                <span className="text-orange-700 font-black text-sm uppercase tracking-wider">✅ Não precisa de troco</span>
              </div>
            )}
          </div>
        )}

        {pagamento === "Pix" && (
          <div className="w-full mt-2 bg-[#F0F9FF] border-2 border-blue-400/50 rounded-xl p-3 space-y-2 text-center shadow-inner">
            <span className="text-black text-[10px] font-black block tracking-widest">CHAVE PIX / CÓDIGO:</span>
            <span className="text-blue-600 font-mono font-black text-xs break-all leading-tight">
              {codigoPix}
            </span>
            <div className="pt-1">
              <span className="text-black text-[10px] font-black block tracking-widest">VALOR A PAGAR:</span>
              <span className="text-emerald-600 font-mono font-black text-2xl">
                R$ {valorTotalFinal.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

     
      <div className="space-y-1.5 flex flex-col items-center uppercase">
        <span className="text-[12px] uppercase font-black text-orange-900 block tracking-wider mb-2">
          ITENS ESCOLHIDOS:
        </span>
        {Object.entries(itens).map(([chave, qtd]) => {
          if (qtd === 0) return null
          const produto = DETALHES_PRODUTOS[chave]
          const precoUnidade = PRECOS_PRODUTOS[chave]
          return (
            <div 
              key={chave}
              className="flex justify-between items-center text-orange-950 text-[13px] py-2 w-full max-w-sm border-b border-orange-200/60 last:border-0 px-1"
            >
              <div className="flex items-center gap-2 text-left">
                <span className="text-base select-none">{produto.icone}</span>
                <span className="text-orange-600 font-black text-sm">{qtd}X</span>
                <span className="font-black">{produto.nome.toUpperCase()}</span>
              </div>
              
              <div className="text-right font-black text-emerald-800 font-mono min-w-[70px] text-[14px]">
                R$ {(precoUnidade * qtd).toFixed(2)}
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t-2 border-zinc-900 pt-3 space-y-1.5 uppercase">
        {descuentoCombo > 0 && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black text-base uppercase px-4 py-3 rounded-xl shadow-lg border-2 border-green-300 animate-pulse scale-[1.02]">
            🎉 COMBO ATIVO 🎉
            <span className="block text-lg mt-1 font-extrabold">ECONOMIZEU: R$ {descuentoCombo.toFixed(2)}</span>
          </div>
        )}

        <div className="flex flex-col items-center bg-[#FFFAF5]/60 border border-[#F3F4F6] rounded-xl p-3 mt-1.5 text-center">
          <span className="text-[10px] font-black text-black uppercase tracking-widest">VALOR TOTAL DO PEDIDO</span>
          <span className="text-emerald-600 text-2xl font-black font-mono tracking-tight mt-0.5">R$ {valorTotalFinal.toFixed(2)}</span>
        </div>
      </div>

      <p className="bg-red-50 border-2 border-red-500 text-red-700 p-3 rounded-2xl font-black text-sm uppercase shadow-inner text-center">
        NÃO ESQUEÇA DE ENVIAR O COMPROVANTE. OBRIGADO!
      </p>

    </div>

    <button 
      type="button"
      disabled={enviandoPedido}
      onClick={processarEnvioPedido}
      className={`w-full py-3.5 px-4 disabled:opacity-40 text-zinc-950 text-base font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95
        ${statusPix === "carregando" ? "bg-[#FFF7ED] animate-pulse text-black" : "bg-emerald-600 hover:bg-emerald-500"}
      `}
    >
      {statusPix === "carregando" && "⌛ GERANDO SEU PIX..."}
      {statusPix === "copiado" && "📋 MOSTRANDO PIX COPIADO..."}
      {statusPix === "normal" && (enviandoPedido ? "ENVIANDO..." : "🚀 CONFIRMAR")}
      {statusPix === "erro" && "❌ TENTAR NOVAMENTE"}
    </button>
  </div>
)}

{/* BARRA INFERIOR DE NAVEGAÇÃO COMPRAS - TEXTO AUMENTADO */}
{totalItensSelecionados > 0 && (etapa === "menu" || etapa === "checkout") && (
  <div className="fixed bottom-4 left-3 right-3 z-40 max-w-xl mx-auto">
    <div className="bg-[#FFFFFF] border border-[#F3F4F6] shadow-2xl rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
      <div className="flex flex-col items-center justify-center w-full sm:w-auto">
        <span className="bg-orange-500/10 text-orange-600 font-black text-base px-2 py-1 rounded-md uppercase tracking-wider block mx-auto">
          {totalItensSelecionados} {totalItensSelecionados === 1 ? "ITEM SELECIONADO" : "ITENS SELECIONADOS"}
        </span>
        <div className="flex items-baseline justify-center gap-1 mt-1 w-full">
          <span className="text-xl font-black text-emerald-600 tracking-tight text-center block w-full">
            Total: R$ {valorTotalFinal.toFixed(2)}
          </span>
        </div>
      </div>

      {etapa === "menu" && (
        <button 
          type="button" 
          onClick={() => setEtapa("observacao")} 
          className="py-3 px-6 w-full sm:w-auto bg-orange-500 text-black text-base font-black uppercase tracking-widest rounded-lg transition-all shadow-md active:scale-95"
        >
          AVANÇAR →
        </button>
      )}
    </div>
  </div>
)}



{/* AVISO DO COMBO NO MENU */}
{etapa === "menu" && (
  <div className="max-w-2xl mx-auto px-4 mt-6 space-y-4">
    <div className="bg-orange-100 border-2 border-orange-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md">
      <span className="text-2xl mb-1">🔥</span>
      <div>
        <h4 className="font-black text-orange-900 uppercase tracking-wider text-base mb-1.5">
          COMBO ATIVO!
        </h4>
        <p className="text-orange-950 font-bold text-sm leading-relaxed">
          Monte qualquer par de <strong className="text-emerald-700 font-black">Comida + Café</strong>
          <br />
          por apenas <strong className="text-emerald-800 font-black">R$ 10,00</strong>
        </p>
      </div>
    </div>
  </div>
)}

</main>
      )
}