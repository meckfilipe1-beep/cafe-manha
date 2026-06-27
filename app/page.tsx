"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, doc, onSnapshot, addDoc, query } from "firebase/firestore"
import Image from "next/image"
import { gerarPixCopiaECola } from "@/lib/pix"

type Etapa = "menu" | "dados" | "observacao" | "horario" | "pagamento" | "confirmacao" | "aviso" | "sucesso"

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
  "Porque vocês não receberam um espírito de escravidão, para voltarem a ter medo; mas receberam o Espírito de adoção, por meio do qual clamamos: 'Aba, Pai!' (Romanos 8:15)",
  "E sabemos que em todas as coisas Deus age para o bem daqueles que o amam, dos que foram chamados segundo o seu propósito. (Romanos 8:28)",
  "Se vocês permanecerem em mim, e as minhas palavras permanecerem em vocês, pedirão o que quiserem, e lhes será concedido. (João 15:7)",
  "Eu lhes disse essas coisas para que em mim vocês tenham paz. Neste mundo vocês terão aflições; mas tenham coragem! Eu venci o mundo. (João 16:33)",
  "O Senhor lutará por vocês; vocês só precisam ficar calmos. (Êxodo 14:14)",
  "Seja forte e corajoso! Não se assuste, nem fique desanimado, pois o Senhor, o seu Deus, estará com você por onde você andar. (Josué 1:9)",
  "Porque Deus não nos deu um espírito de covardia, mas de poder, de amor e de equilíbrio. (2 Timóteo 1:7)",
  "Minha graça basta a você, pois a minha força se aperfeiçoa na fraqueza. (2 Coríntios 12:9)",
  "O Senhor está perto dos que têm o coração quebrantado e salva os que têm o espírito arrependido. (Salmo 34:18)",
  "Entregue a sua preocupação ao Senhor, pois ele se importa com você. (1 Pedro 5:7)",
  "Quem habita no abrigo do Altíssimo descansa à sombra do Todo-poderoso. Diz ao Senhor: 'Tu és o meu refúgio e a minha fortaleza, o meu Deus, em quem confio'. (Salmo 91:1-2)",
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
  const [lojaAberta, setLojaAberta] = useState(true)
  const [dadosFuncionamento, setDadosFuncionamento] = useState<any>(null)
  const [carregandoLoja, setCarregandoLoja] = useState(true)
  const [enviandoPedido, setEnviandoPedido] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>("menu")
  const [produtosBanco, setProdutosBanco] = useState<{ [key: string]: { disponivel: boolean; preco: number; nome: string; icone: string } }>({})

  const [nome, setNome] = useState("")
  const [endereco, setEndereco] = useState("")
  const [numeroCasa, setNumeroCasa] = useState("")
  const [referencia, setReferencia] = useState("")
  const [observacao, setObservacao] = useState("")
  const [observacoesItem, setObservacoesItem] = useState<{ [key: string]: string[] }>({})
  const [telefone, setTelefone] = useState("")
  const [pagamento, setPagamento] = useState<"Pix" | "Dinheiro">("Pix")
  const [trocoPara, setTrocoPara] = useState("")
  const [horario, setHorario] = useState("")
  const [diaEscolhido, setDiaEscolhido] = useState<any>(null)
  const [mostrarListaHorarios, setMostrarListaHorarios] = useState(false)
  const [mostrarAvisoDados, setMostrarAvisoDados] = useState(false)
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [lojaManualAberta, setLojaManualAberta] = useState(true)

  const [statusPix, setStatusPix] = useState<"normal" | "carregando" | "copiado" | "erro">("normal")
  const [codigoPix, setCodigoPix] = useState("")
  const [pixCopiado, setPixCopiado] = useState(false)
  const [mostrarMensagemCopiado, setMostrarMensagemCopiado] = useState(false)
  const [versiculoEscolhido, setVersiculoEscolhido] = useState("")

  const DIAS_FUNCIONAMENTO = [
    { valor: "segunda", nome: "Segunda" }, { valor: "terca", nome: "Terça" },
    { valor: "quarta", nome: "Quarta" }, { valor: "quinta", nome: "Quinta" },
    { valor: "sexta", nome: "Sexta" }, { valor: "sabado", nome: "Sábado" },
    { valor: "domingo", nome: "Domingo" }
  ]

  const [itens, setItens] = useState<{ [key: string]: number }>({
    tapiocaMolhada: 0, tapiocaManteiga: 0, tapiocaQueijo: 0, tapiocaOvo: 0,
    tapiocaQueijoOvo: 0, cuscuzMilho: 0, cuscuzArroz: 0, cuscuzMilhoArroz: 0, cafe: 0,
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const nomeSalvo = localStorage.getItem("tapicuz_nome")
      const enderecoSalvo = localStorage.getItem("tapicuz_endereco")
      const telefoneSalvo = localStorage.getItem("tapicuz_telefone")
      setNome(nomeSalvo || "")
      setEndereco(enderecoSalvo || "")
      setNumeroCasa(localStorage.getItem("tapicuz_numero") || "")
      setReferencia(localStorage.getItem("tapicuz_referencia") || "")
      setTelefone(telefoneSalvo || "")
      if (!nomeSalvo || !enderecoSalvo || !telefoneSalvo) {
        setMostrarAvisoDados(true)
      }
    }
  }, [])

  useEffect(() => {
    if (dadosFuncionamento) verificarSeEstaAberto(dadosFuncionamento)
  }, [lojaManualAberta, dadosFuncionamento])

  useEffect(() => {
    const refFuncionamento = doc(db, "configuracoes", "funcionamento")

    const unsubscribeStatus = onSnapshot(refFuncionamento, (snap) => {
      if (snap.exists()) {
        const dados = snap.data()
        const aberto = dados.aberta === true
        setLojaManualAberta(aberto)
        if (!aberto) setLojaAberta(false)
        else if (dadosFuncionamento) verificarSeEstaAberto(dadosFuncionamento)
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
    }, () => {
      setLojaAberta(false)
      setCarregandoLoja(false)
    })

    const qProdutos = query(collection(db, "produtos"))
    const unsubscribeProdutos = onSnapshot(qProdutos, (snap) => {
      const dados: any = {}
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

  function validarTelefone(telefone: string): boolean {
    const apenasNumeros = telefone.replace(/\D/g, "")
    return apenasNumeros.startsWith("919") && apenasNumeros.length === 11
  }

  function verificarSeEstaAberto(dados: any) {
    if (!lojaManualAberta) { setLojaAberta(false); return }
    setLojaAberta(true)
  }

  function diasPermitidosParaEntrega() {
    if (!dadosFuncionamento?.diasFuncionamento) return []
    return DIAS_FUNCIONAMENTO.filter(dia => dadosFuncionamento.diasFuncionamento[dia.valor] === true)
  }

  function horariosPermitidosParaDia() {
    if (!dadosFuncionamento || !diaEscolhido) return []
    const horarios = dadosFuncionamento.horariosPorDia?.[diaEscolhido.valor]
    return horarios ? [...horarios].sort() : []
  }

  function alterarQtd(chave: string, valor: number) {
    const novaQtd = Math.max(0, itens[chave] + valor)
    setItens(prev => ({ ...prev, [chave]: novaQtd }))
    setObservacoesItem(prev => {
      const current = prev[chave] || []
      if (novaQtd > current.length) {
        return { ...prev, [chave]: [...current, ...Array(novaQtd - current.length).fill("")] }
      }
      if (novaQtd < current.length) {
        return { ...prev, [chave]: current.slice(0, novaQtd) }
      }
      return prev
    })
  }

  const totalItensSelecionados = Object.values(itens).reduce((a, b) => a + b, 0)

  let subtotal = 0
  let qtdComidas = 0
  const qtdCafes = itens.cafe

  Object.entries(itens).forEach(([chave, qtd]) => {
    const preco = produtosBanco[chave]?.preco ?? PRECOS_PRODUTOS[chave]
    subtotal += preco * qtd
    if (chave !== "cafe") qtdComidas += qtd
  })

  let descuentoCombo = 0
  if (qtdComidas > 0 && qtdCafes > 0) {
    const totalCombos = Math.min(qtdComidas, qtdCafes)
    let cafesUsados = 0
    for (const [chave, qtd] of Object.entries(itens)) {
      if (chave !== "cafe" && qtd > 0 && cafesUsados < totalCombos) {
        const precoItem = produtosBanco[chave]?.preco ?? PRECOS_PRODUTOS[chave]
        const precoCafe = produtosBanco.cafe?.preco ?? PRECOS_PRODUTOS.cafe
        const qtdUsar = Math.min(qtd, totalCombos - cafesUsados)
        descuentoCombo += qtdUsar * ((precoItem + precoCafe) - 10)
        cafesUsados += qtdUsar
      }
    }
  }

  const valorTotalFinal = Math.max(0, subtotal - descuentoCombo)
  const trocoParaNum = parseFloat(trocoPara.replace(",", ".")) || 0
  const trocoCalculado = pagamento === "Dinheiro" && trocoParaNum > valorTotalFinal ? trocoParaNum - valorTotalFinal : 0

  function irParaDados() {
    setErroValidacao(null)
    if (valorTotalFinal === 0) {
      setErroValidacao("Adicione pelo menos um item")
      return
    }
    setEtapa("dados")
  }

  function irParaObservacao() {
    setErroValidacao(null)
    if (!nome.trim()) { setErroValidacao("Informe seu nome"); return }
    if (!endereco.trim()) { setErroValidacao("Informe o endereço"); return }
    if (!numeroCasa.trim() || !/^\d+$/.test(numeroCasa)) { setErroValidacao("Número da casa inválido"); return }
    if (!telefone.trim() || !validarTelefone(telefone)) { setErroValidacao("WhatsApp deve começar com 919 e ter 11 dígitos"); return }
    setEtapa("observacao")
  }

  function irParaHorario() {
    setErroValidacao(null)
    setEtapa("horario")
  }

  function irParaPagamento() {
    setErroValidacao(null)
    if (!diaEscolhido) { setErroValidacao("Escolha o dia da entrega"); return }
    if (!horario) { setErroValidacao("Escolha o horário"); return }
    setEtapa("pagamento")
  }

  function irParaConfirmacao() {
    setErroValidacao(null)
    setEtapa("confirmacao")
  }

  async function executarCopiaTexto(texto: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async function processarEnvioPedido() {
    if (enviandoPedido) return
    setEnviandoPedido(true)
    setStatusPix("normal")
    setCodigoPix("")
    setPixCopiado(false)

    if (pagamento === "Pix") {
      try {
        setStatusPix("carregando")
        const dadosPix = await gerarPixCopiaECola(valorTotalFinal)
        if (!dadosPix?.payload) throw new Error("PIX inválido")
        setCodigoPix(dadosPix.payload)
        setStatusPix("copiado")
        setEnviandoPedido(false)
      } catch {
        setStatusPix("erro")
        alert("Não foi possível gerar o PIX")
        setEnviandoPedido(false)
      }
    } else {
      await salvarPedidoNoBanco()
    }
  }

  async function salvarPedidoNoBanco() {
    setEnviandoPedido(true)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("tapicuz_nome", nome.trim())
        localStorage.setItem("tapicuz_endereco", endereco.trim())
        localStorage.setItem("tapicuz_numero", numeroCasa.trim())
        localStorage.setItem("tapicuz_referencia", referencia.trim())
        localStorage.setItem("tapicuz_telefone", telefone.trim())
      }

      const enderecoCompleto = `${endereco.trim()}, Nº ${numeroCasa.trim()}${referencia.trim() ? ` - Ref: ${referencia.trim()}` : ""}`
      const payloadPedido = {
        nome: nome.trim(),
        telefone: telefone.trim(),
        endereco: enderecoCompleto,
        observacao: observacao.trim(),
        observacoesItem,
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

      await addDoc(collection(db, "pedidos"), payloadPedido)
      setVersiculoEscolhido(VERSICULOS_BENCÃO[Math.floor(Math.random() * VERSICULOS_BENCÃO.length)])
      setCodigoPix("")
      setStatusPix("normal")
      setPixCopiado(false)
      setEtapa(pagamento === "Pix" ? "aviso" : "sucesso")
    } catch {
      alert("Erro ao enviar pedido. Tente novamente.")
    } finally {
      setEnviandoPedido(false)
    }
  }

  function reiniciarPainel() {
    setItens({ tapiocaMolhada: 0, tapiocaManteiga: 0, tapiocaQueijo: 0, tapiocaOvo: 0, tapiocaQueijoOvo: 0, cuscuzMilho: 0, cuscuzArroz: 0, cuscuzMilhoArroz: 0, cafe: 0 })
    setObservacao(""); setObservacoesItem({}); setTrocoPara(""); setHorario(""); setDiaEscolhido(null); setErroValidacao(null)
    setVersiculoEscolhido(""); setStatusPix("normal"); setCodigoPix(""); setPixCopiado(false)
    setEtapa("menu")
  }

  if (carregandoLoja) {
    return <div className="min-h-screen bg-[#FFFAF5] flex items-center justify-center text-zinc-500 text-xs tracking-widest font-bold animate-pulse">CARREGANDO...</div>
  }

  if (!lojaAberta) {
    return (
      <div className="min-h-screen bg-orange-600 flex flex-col items-center justify-center px-4 text-center text-zinc-900">
        <div className="text-center mb-8 select-none">
          <h1 className="text-5xl font-extrabold tracking-[0.2em] text-white uppercase drop-shadow-lg">TAPICUZ</h1>
          <p className="text-lg font-bold text-amber-100 tracking-[0.4em] uppercase mt-2">DA SUL</p>
        </div>
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl space-y-5">
          <div className="text-5xl animate-pulse">🌙</div>
          <h2 className="text-xl font-black uppercase text-orange-500">
            {dadosFuncionamento ? "ESTAMOS FECHADOS" : "NÃO ACEITAMOS PEDIDOS AGORA"}
          </h2>
          <p className="text-lg text-[#52525B]">Agradecemos sua visita! 🧡 Voltaremos em breve.</p>
        </div>
      </div>
    )
  }

  if (etapa === "aviso") {
    return (
      <div className="min-h-screen bg-[#FFFAF5] flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md w-full bg-white border-4 border-amber-400 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center text-2xl mx-auto">⚠️</div>
          <h2 className="text-xl font-black text-amber-600 uppercase">LEMBRETE IMPORTANTE</h2>
          <div className="bg-amber-50 border-2 border-amber-400 p-5 rounded-xl">
            <p className="text-amber-800 font-bold text-lg leading-relaxed">
              Não esqueça de enviar o comprovante de pagamento pelo WhatsApp!
            </p>
          </div>
          <button onClick={() => setEtapa("sucesso")}
            className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl text-lg">
            OK, ENVIAREI ✅
          </button>
        </div>
      </div>
    )
  }

  if (etapa === "sucesso") {
    return (
      <div className="min-h-screen bg-[#FFFAF5] flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md w-full bg-white border-4 border-orange-500 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-2xl mx-auto animate-bounce">✓</div>
          <h2 className="text-xl font-black text-emerald-400 uppercase">PEDIDO ENVIADO!</h2>

          {versiculoEscolhido && (
            <div className="border-2 border-amber-500/30 p-5 bg-[#FFFAF5] rounded-2xl">
              <span className="text-sm font-bold text-amber-800 uppercase">📖 PALAVRA DO DIA</span>
              <p className="text-lg font-black text-black mt-3 leading-relaxed">&ldquo;{versiculoEscolhido}&rdquo;</p>
            </div>
          )}

          <button onClick={reiniciarPainel} className="w-full py-3.5 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl">AMÉM 🙏</button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#FFFAF5] text-[#27272A] pb-28 font-sans antialiased">
      {mostrarMensagemCopiado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-emerald-500 text-black px-6 py-5 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div><h3 className="font-black text-lg">CÓDIGO COPIADO!</h3><p className="text-sm">Cole no app do banco 🚀</p></div>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#F3F4F6] px-4 py-4 shadow-md">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-xl font-black text-orange-500 uppercase">CARDÁPIO DO DIA</h1>
          {diaEscolhido && <p className="text-base font-black text-orange-600 mt-2">📅 Entrega: {diaEscolhido.nome}</p>}
        </div>
      </header>

      {(etapa === "menu" || etapa === "dados" || etapa === "horario" || etapa === "pagamento") && (
        <div className="max-w-2xl mx-auto px-0 sm:px-4">
          <Image src="/banner/banner-topo-v2.png" alt="Café da Manhã" width={800} height={220} priority className="w-full h-auto object-cover rounded-b-3xl shadow-lg" />
        </div>
      )}

      {/* === ETAPA 1: CARDÁPIO === */}
      {etapa === "menu" && (
        <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
          <div className="bg-orange-100 border-2 border-orange-500 rounded-2xl p-4 text-center shadow-md">
            <span className="text-2xl">🔥</span>
            <h4 className="font-black text-orange-900 uppercase mt-2">COMBO ATIVO!</h4>
            <p className="text-orange-950 text-sm mt-1">Qualquer Comida + Café = <strong>R$ 10,00</strong></p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {Object.keys(PRECOS_PRODUTOS).map((chave) => {
              const produto = DETALHES_PRODUTOS[chave]
              const preco = produtosBanco[chave]?.preco ?? PRECOS_PRODUTOS[chave]
              const qtd = itens[chave] || 0
              const disponivel = produtosBanco[chave]?.disponivel ?? true

              return (
                <div key={chave} className={`border rounded-3xl p-6 flex flex-col items-center gap-5 relative transition-all
                  ${!disponivel ? "bg-zinc-200/60 border-red-400/50 opacity-50 grayscale pointer-events-none" :
                    qtd > 0 ? "bg-amber-400 border-orange-600 border-4 shadow-lg scale-[1.02]" : "bg-amber-100 border-amber-200"}`}>
                  {!disponivel && <span className="absolute top-2 right-2 bg-red-500 text-black text-xs px-2 py-1 rounded-full">❌ Indisponível</span>}
                  <Image src={`/produtos/${produto.imagem}`} alt={produto.nome} width={112} height={112} className="w-28 h-28 rounded-2xl border shadow-md" />
                  <h3 className="font-black text-xl text-orange-600 uppercase text-center">{produto.nome}</h3>
                  <span className="font-black text-lg text-emerald-600 text-center w-full">R$ {preco.toFixed(2)}</span>
                  <div className="flex items-center gap-2 bg-stone-200 rounded-2xl p-1.5 w-full max-w-[200px] justify-center">
                    {qtd > 0 && (
                      <>
                        <button onClick={() => alterarQtd(chave, -1)} className="w-12 h-12 bg-white text-stone-700 rounded-xl font-black text-lg">-</button>
                        <span className="font-black text-xl w-10 text-center">{qtd}</span>
                      </>
                    )}
                    <button onClick={() => alterarQtd(chave, 1)} className={`h-12 rounded-xl font-black ${qtd > 0 ? "w-12 bg-orange-500 text-black text-lg" : "w-full bg-white text-sm uppercase px-4"}`}>
                      {qtd > 0 ? "+" : "Adicionar"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* === ETAPA 2: DADOS PESSOAIS === */}
      {etapa === "dados" && (
        <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
          <div className="flex items-center gap-2 border-b pb-3">
            <button onClick={() => setEtapa("menu")} className="text-xs bg-white border px-3 py-1.5 rounded-xl">← Cardápio</button>
            <h2 className="text-xs font-black uppercase text-orange-500 ml-auto">Seus Dados</h2>
          </div>

          {mostrarAvisoDados && (
            <div className="bg-emerald-50 border-2 border-emerald-500 p-5 rounded-2xl text-center">
              <p className="text-lg font-bold">⚠️ Você só preenche uma vez! Os dados ficam salvos.</p>
              <button onClick={() => setMostrarAvisoDados(false)} className="mt-3 bg-emerald-600 text-white px-6 py-2 rounded-lg">OK</button>
            </div>
          )}

          {erroValidacao && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-red-50 border-4 border-red-600 p-5 rounded-2xl text-center max-w-xs w-full">
                <p className="font-black text-lg">⚠️ {erroValidacao}</p>
                <button onClick={() => setErroValidacao(null)} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg">Entendi</button>
              </div>
            </div>
          )}

          <div className="bg-white border p-4 rounded-2xl space-y-4 shadow-md">
            <div>
              <label className="text-xs font-black text-orange-500 uppercase block mb-1">Seu Nome *</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value.toUpperCase())} className="w-full bg-[#FFFAF5] border rounded-xl p-3.5 text-sm font-black uppercase" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs font-black text-orange-500 uppercase block mb-1">Endereço *</label>
                <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value.toUpperCase())} className="w-full bg-[#FFFAF5] border rounded-xl p-3.5 text-sm font-black uppercase" />
              </div>
              <div>
                <label className="text-xs font-black text-orange-500 uppercase block mb-1">Número *</label>
                <input type="text" inputMode="numeric" value={numeroCasa} onChange={(e) => setNumeroCasa(e.target.value.replace(/\D/g, ""))} className="w-full bg-[#FFFAF5] border rounded-xl p-3.5 text-center font-black" />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-orange-500 uppercase block mb-1">Referência</label>
              <input type="text" value={referencia} onChange={(e) => setReferencia(e.target.value.toUpperCase())} className="w-full bg-[#FFFAF5] border rounded-xl p-3.5 text-sm font-black uppercase" />
            </div>

            <div>
              <label className="font-black text-lg uppercase text-orange-600 block text-center mb-2">WhatsApp</label>
              <input type="tel" maxLength={11} value={telefone} onChange={(e) => { setTelefone(e.target.value.replace(/\D/g, "").slice(0, 11)) }} placeholder="919XXXXXXXX" className={`w-full p-4 rounded-xl border-2 text-center font-black ${telefone && !validarTelefone(telefone) ? "border-red-500 text-red-700" : "border-orange-400"}`} />
              {telefone && !validarTelefone(telefone) && <p className="text-red-600 text-sm text-center mt-2">Digite começando com 919</p>}
            </div>

          </div>

        </div>
      )}

      {/* === ETAPA 3: OBSERVAÇÃO POR ITEM === */}
      {etapa === "observacao" && (
        <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
          <div className="flex items-center gap-2 border-b pb-3">
            <button onClick={() => setEtapa("dados")} className="text-xs bg-white border px-3 py-1.5 rounded-xl">← Dados</button>
            <h2 className="text-xs font-black uppercase text-orange-500 ml-auto">Observações</h2>
          </div>

          <p className="text-sm text-zinc-500 text-center">Deixe uma observação para cada item (opcional)</p>

          <div className="space-y-3">
            {Object.entries(itens).map(([chave, qtd]) => {
              if (qtd === 0) return null
              const prod = DETALHES_PRODUTOS[chave]
              const obsArray = observacoesItem[chave] || []
              return Array.from({ length: qtd }).map((_, idx) => (
                <div key={`${chave}-${idx}`} className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{prod.icone}</span>
                    <span className="font-black text-sm">{qtd > 1 ? `${idx + 1}x ` : ""}{prod.nome}</span>
                  </div>
                  <input
                    type="text"
                    value={obsArray[idx] || ""}
                    onChange={(e) => setObservacoesItem(prev => {
                      const current = [...(prev[chave] || [])]
                      current[idx] = e.target.value
                      return { ...prev, [chave]: current }
                    })}
                    placeholder="Ex: sem cebola, bem torrado..."
                    className="w-full bg-[#FFFAF5] border border-amber-300 rounded-xl p-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              ))
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setEtapa("horario")} className="flex-1 py-3.5 bg-zinc-200 text-zinc-600 font-black rounded-xl text-sm">
              Pular
            </button>
            <button onClick={() => setEtapa("horario")} className="flex-1 py-3.5 bg-orange-500 text-black font-black rounded-xl text-sm">
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* === ETAPA 4: DIA E HORÁRIO === */}
      {etapa === "horario" && (
        <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
          <div className="flex items-center gap-2 border-b pb-3">
            <button onClick={() => setEtapa("observacao")} className="text-xs bg-white border px-3 py-1.5 rounded-xl">← Observações</button>
            <h2 className="text-xs font-black uppercase text-orange-500 ml-auto">Dia e Horário</h2>
          </div>

          {erroValidacao && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-red-50 border-4 border-red-600 p-5 rounded-2xl text-center max-w-xs w-full">
                <p className="font-black text-lg">⚠️ {erroValidacao}</p>
                <button onClick={() => setErroValidacao(null)} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg">Entendi</button>
              </div>
            </div>
          )}

          <div className="bg-white border p-4 rounded-2xl space-y-4 shadow-md">
            <div>
              <label className="text-sm font-black text-orange-600 uppercase text-center block mb-3">Dia da Entrega *</label>
              <div className="grid grid-cols-3 gap-2">
                {diasPermitidosParaEntrega().length === 0 ? (
                  <p className="text-red-600 col-span-3 text-center">Nenhum dia disponível</p>
                ) : (
                  diasPermitidosParaEntrega().map(dia => (
                    <button key={dia.valor} onClick={() => { setDiaEscolhido(dia); setHorario("") }}
                      className={`py-3 rounded-lg font-bold ${diaEscolhido?.valor === dia.valor ? "bg-orange-500 text-black" : "bg-white border"}`}>
                      {dia.nome}
                    </button>
                  ))
                )}
              </div>
            </div>

            {diaEscolhido && (
              <div>
                <label className="text-sm font-black text-orange-600 uppercase text-center block mb-3">Horário *</label>
                <button onClick={() => setMostrarListaHorarios(!mostrarListaHorarios)}
                  className={`w-full py-4 border-4 rounded-2xl font-black text-xl ${horario ? "border-emerald-500 text-emerald-600" : "border-orange-500 text-orange-600 animate-pulse"}`}>
                  {horario || "Toque para escolher horário"}
                </button>
                {mostrarListaHorarios && (
                  <div className="mt-2 grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-3 bg-[#FFFAF5] border-2 border-orange-500 rounded-xl">
                    {horariosPermitidosParaDia().length === 0 ? (
                      <p className="text-red-600 col-span-4 text-center">Sem horários</p>
                    ) : (
                      horariosPermitidosParaDia().map((hora: string) => (
                        <button key={hora} onClick={() => { setHorario(hora); setMostrarListaHorarios(false) }}
                          className={`py-3 rounded-lg font-bold ${horario === hora ? "bg-orange-500 text-black" : "bg-white border"}`}>
                          {hora}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {diaEscolhido && horario && (
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-3 text-center">
                <p className="text-emerald-700 font-black">✅ Entrega: {diaEscolhido.nome} às {horario}</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* === ETAPA 4: PAGAMENTO === */}
      {etapa === "pagamento" && (
        <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
          <div className="flex items-center gap-2 border-b pb-3">
            <button onClick={() => setEtapa("horario")} className="text-xs bg-white border px-3 py-1.5 rounded-xl">← Horário</button>
            <h2 className="text-xs font-black uppercase text-orange-500 ml-auto">Pagamento</h2>
          </div>

          <div className="bg-white border p-4 rounded-2xl space-y-4 shadow-md">
          <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPagamento("Pix")}
                className={`p-4 rounded-xl font-black uppercase ${pagamento === "Pix" ? "bg-emerald-600 text-white" : "bg-[#FFFAF5] border"}`}>
                📲 PIX
              </button>
              <button onClick={() => setPagamento("Dinheiro")}
                className={`p-4 rounded-xl font-black uppercase ${pagamento === "Dinheiro" ? "bg-orange-500 text-white" : "bg-[#FFFAF5] border"}`}>
                💵 DINHEIRO
              </button>
            </div>

            {pagamento === "Pix" && (
              <div className="bg-emerald-50 border border-emerald-500 rounded-xl p-4 text-center">
                <p className="font-black text-sm">Total a pagar</p>
                <p className="text-3xl font-black text-emerald-600">R$ {valorTotalFinal.toFixed(2)}</p>
              </div>
            )}

            {pagamento === "Dinheiro" && (
              <div className="space-y-3">
                <label className="text-sm font-black text-orange-600 uppercase block text-center">Precisa de troco?</label>
                <input type="text" inputMode="numeric" value={trocoPara} onChange={(e) => setTrocoPara(e.target.value.replace(/\D/g, ""))} placeholder="Valor da nota" className="w-full p-3 border rounded-xl text-center font-black" />
                {trocoCalculado > 0 && (
                  <div className="bg-emerald-50 border border-emerald-500 rounded-xl p-3 text-center">
                    <p>Troco: <strong>R$ {trocoCalculado.toFixed(2)}</strong></p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* === ETAPA 5: CONFIRMAÇÃO === */}
      {etapa === "confirmacao" && (
        <div className="max-w-md mx-auto px-3 mt-4 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <button onClick={() => setEtapa("pagamento")} className="text-xs bg-white border px-3 py-1.5 rounded-xl">← Pagamento</button>
            <h2 className="text-xs font-black uppercase text-orange-500 ml-auto">Revisão do Pedido</h2>
          </div>

          <div className="bg-white border-2 border-orange-500 rounded-3xl p-5 shadow-xl space-y-5">
            <div className="text-center space-y-3">
              <p><strong>Cliente:</strong> <span className="text-orange-600 font-black">{nome}</span></p>
              <p><strong>Endereço:</strong> <span className="text-orange-600 font-black">{endereco}, Nº {numeroCasa}</span></p>
              {referencia && <p className="text-sm text-emerald-600">Ref: {referencia}</p>}
              <p><strong>Entrega:</strong> {diaEscolhido?.nome} às {horario}</p>
              <p><strong>Pagamento:</strong> {pagamento}</p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-black uppercase text-center mb-3">Itens do Pedido</h4>
              {Object.entries(itens).map(([chave, qtd]) => {
                if (qtd === 0) return null
                const prod = DETALHES_PRODUTOS[chave]
                const preco = produtosBanco[chave]?.preco ?? PRECOS_PRODUTOS[chave]
                const obsArray = observacoesItem[chave] || []
                return (
                  <div key={chave} className="text-center py-2 border-b border-zinc-100 last:border-0">
                    <div className="flex items-center justify-center gap-1">
                      <span>{prod.icone}</span>
                      <span className="font-black">{qtd}x {prod.nome}</span>
                    </div>
                    <span className="block font-black text-emerald-600">R$ {(preco * qtd).toFixed(2)}</span>
                    {obsArray.map((obs, idx) => obs ? (
                      <span key={idx} className="block text-xs text-zinc-500 italic mt-0.5">{qtd > 1 ? `${idx + 1}x: ` : ""}{obs}</span>
                    ) : null)}
                  </div>
                )
              })}
            </div>

            {descuentoCombo > 0 && (
              <div className="bg-green-100 border border-green-500 p-3 rounded-xl text-center">
                🎉 Desconto do Combo: <strong>R$ {descuentoCombo.toFixed(2)}</strong>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-400 p-4 rounded-xl text-center">
              <p className="text-sm">Valor Total</p>
              <p className="text-2xl font-black text-emerald-600">R$ {valorTotalFinal.toFixed(2)}</p>
            </div>

            <button onClick={processarEnvioPedido} disabled={enviandoPedido}
              className="w-full py-4 bg-emerald-600 text-black font-black uppercase rounded-xl mt-4 disabled:opacity-50">
              {enviandoPedido ? "Processando..." : pagamento === "Pix" ? "📲 GERAR PIX" : "✅ CONFIRMAR PEDIDO"}
            </button>
          </div>
        </div>
      )}

      {/* === PIX MODAL: COPIAR → DEPOIS FINALIZAR === */}
      {statusPix === "copiado" && codigoPix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-white border-4 border-emerald-500 max-w-md w-full rounded-3xl p-6 text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 text-3xl flex items-center justify-center mx-auto">📲</div>
            <h3 className="text-xl font-black text-emerald-400 uppercase">PIX GERADO!</h3>
            <p className="text-center">Olá <strong className="text-orange-500">{nome || "CLIENTE"}</strong></p>

            <div className="bg-[#FFFAF5] p-3 rounded-xl break-all text-xs text-center border">{codigoPix}</div>

            {/* PRIMEIRA ETAPA: COPIAR PIX */}
            {!pixCopiado && (
              <button onClick={async () => {
                const ok = await executarCopiaTexto(codigoPix)
                if (ok) {
                  setPixCopiado(true)
                  setMostrarMensagemCopiado(true)
                  setTimeout(() => setMostrarMensagemCopiado(false), 2500)
                } else {
                  alert("Erro ao copiar. Selecione o texto manualmente.")
                }
              }} className="w-full py-3.5 bg-orange-500 text-black font-black rounded-xl uppercase tracking-widest shadow-lg">
                📋 COPIAR PIX
              </button>
            )}

            {/* DEPOIS DE COPIAR: APARECE FINALIZAR */}
            {pixCopiado && (
              <button onClick={salvarPedidoNoBanco} disabled={enviandoPedido}
                className="w-full py-3.5 bg-emerald-500 text-black font-black rounded-xl uppercase tracking-widest shadow-lg disabled:opacity-40">
                {enviandoPedido ? "GRAVANDO..." : "✅ FINALIZAR PEDIDO"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* === BOTTOM BAR === */}
      {totalItensSelecionados > 0 && (etapa === "menu" || etapa === "dados" || etapa === "observacao" || etapa === "horario" || etapa === "pagamento") && (
        <div className="fixed bottom-4 left-3 right-3 z-40 max-w-xl mx-auto">
          <div className="bg-white border p-4 rounded-xl shadow-lg flex justify-between items-center">
            <div>
              <span className="text-sm font-black text-orange-600">{totalItensSelecionados} {totalItensSelecionados === 1 ? "item" : "itens"}</span>
              <p className="text-xl font-black text-emerald-600">R$ {valorTotalFinal.toFixed(2)}</p>
            </div>
            {etapa === "menu" && <button onClick={irParaDados} className="px-5 py-2 bg-orange-500 text-black font-black rounded-lg">Avançar →</button>}
            {etapa === "dados" && <button onClick={irParaObservacao} className="px-5 py-2 bg-orange-500 text-black font-black rounded-lg">Avançar →</button>}
            {etapa === "horario" && <button onClick={irParaPagamento} className="px-5 py-2 bg-orange-500 text-black font-black rounded-lg">Avançar →</button>}
            {etapa === "pagamento" && <button onClick={irParaConfirmacao} className="px-5 py-2 bg-orange-500 text-black font-black rounded-lg">Conferir →</button>}
          </div>
        </div>
      )}
    </main>
  )
}
