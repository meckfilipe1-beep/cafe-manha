"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, doc, onSnapshot, addDoc } from "firebase/firestore"
import Image from "next/image"
import { gerarPixCopiaECola } from "@/lib/pix"

// Tipagem das etapas do app
type Etapa = "menu" | "observacao" | "checkout" | "confirmacao" | "sucesso"

// LISTA DE VERSÍCULOS AMPLIADA
const VERSICULOS_BENCÃO = [
  "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti. (Números 6:24-25)",
  "O Senhor é o meu pastor; nada me faltará. (Salmo 23:1)",
  "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos. (Provérbios 16:3)",
  "Abençoado será você ao entrar e abençoado será ao sair. (Deuteronômio 28:6)",
  "Este é o dia que o Senhor fez; exultemos e alegremo-nos nele. (Salmo 118:24)",
  "Deem graças ao Senhor, porque ele é bom; o seu amor dura para sempre. (Salmo 107:1)",
  "O meu Deus suprirá todas as necessidades de vocês, de acordo com as suas gloriosas riquezas. (Filipenses 4:19)",
  "Aquietai-vos e sabei que eu sou Deus. (Salmo 46:10)",
  "Se Deus é por nós, quem será contra nós? (Romanos 8:31)",
  "Tudo posso naquele que me fortalece. (Filipenses 4:13)",
  "O Senhor é a minha luz e a minha salvação; de quem terei temor? (Salmo 27:1)",
  "Mil poderão cair ao teu lado, e dez mil à tua direita, mas tu não serás atingido. (Salmo 91:7)",
  "Guarda-me como à pupila dos olhos, esconde-me à sombra das tuas asas. (Salmo 17:8)",
  "Porque para Deus nada é impossível. (Lucas 1:37)",
  "Lancem sobre ele toda a sua ansiedade, because ele tem cuidado de vocês. (1 Pedro 5:7)",
  "Sejam fortes e corajosos. Não tenham medo (...) pois o Senhor, o seu Deus, vai com vocês. (Deuteronômio 31:6)",
  "Grande é a sua fidelidade; as suas misericórdias renovam-se cada manhã. (Lamentações 3:22-23)",
  "A paz de Deus, que excede todo o entendimento, guardará o coração de vocês. (Filipenses 4:7)",
  "Fui moço e agora sou velho; mas nunca vi desamparado o justo, nem a sua descendência a mendigar o pão. (Salmo 37:25)",
  "O Senhor guiará você continuamente e fartará a sua alma até em lugares áridos. (Isaías 58:11)",
  "Não fui eu que lhe ordenei? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar. (Josué 1:9)",
  "Entrega o teu caminho ao Senhor; confia nele, e ele o fará. (Salmo 37:5)",
  "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão e não se cansarão; caminharão e não se fatigarão. (Isaías 40:31)",
  "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento. (Provérbios 3:5)",
  "O Senhor guardará a tua saída e a tua entrada, desde agora e para sempre. (Salmo 121:8)",
  "Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito. (Romanos 8:28)",
  "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará. (Salmo 91:1)",
  "O Senhor é bom, uma fortaleza no dia da angústia, e conhece os que confiam nele. (Naum 1:7)",
  "Buscai em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas vos serão acrescentadas. (Mateus 6:33)",
  "Provai e vede que o Senhor é bom; bem-aventurado o homem que nele se refugia. (Salmo 34:8)"
]

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

const DETALHES_PRODUTOS: { [key: string]: { nome: string; icone: string } } = {
  tapiocaMolhada: { nome: "Tapioca Molhada", icone: "🥥" },
  tapiocaManteiga: { nome: "Tapioca com Manteiga", icone: "🧈" },
  tapiocaQueijo: { nome: "Tapioca com Queijo", icone: "🧀" },
  tapiocaOvo: { nome: "Tapioca com Ovo", icone: "🥚" },                  
  tapiocaQueijoOvo: { nome: "Tapioca com Queijo e Ovo", icone: "🧀🥚" },
  cuscuzMilho: { nome: "Cuszuz de Milho", icone: "🌽" },
  cuscuzArroz: { nome: "Cuscuz de Arroz", icone: "🍚" },
  cuscuzMilhoArroz: { nome: "Cuscuz de Milho e Arroz", icone: "🍲" },
  cafe: { nome: "Café Quentinho", icone: "☕" }
}

const OPCOES_HORARIOS = [
  "05:30", "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00",
  "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
  "17:30", "18:00"
]

export default function ClientePainel() {
  const [lojaAberta, setLojaAberta] = useState<boolean>(true)
  const [carregandoLoja, setCarregandoLoja] = useState(true)
  const [enviandoPedido, setEnviandoPedido] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>("menu")

  const [nome, setNome] = useState("")
  const [endereco, setEndereco] = useState("")
  const [numeroCasa, setNumeroCasa] = useState("")
  const [referencia, setReferencia] = useState("")
  const [observacao, setObservacao] = useState("") 
  const [pagamento, setPagamento] = useState<"Pix" | "Dinheiro">("Pix")
  const [trocoPara, setTrocoPara] = useState("")
  const [horario, setHorario] = useState("0:00")
  const [mostrarListaHorarios, setMostrarListaHorarios] = useState(false)

  const [statusPix, setStatusPix] = useState<"normal" | "carregando" | "copiado" | "erro">("normal")
  const [mostrarAlertaPix, setMostrarAlertaPix] = useState(false)
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  
  const [versiculoEscolhido, setVersiculoEscolhido] = useState("")

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
    if (typeof window !== "undefined") {
      setNome(localStorage.getItem("tapicuz_nome") || "")
      setEndereco(localStorage.getItem("tapicuz_endereco") || "")
      setNumeroCasa(localStorage.getItem("tapicuz_numero") || "")
      setReferencia(localStorage.getItem("tapicuz_referencia") || "")
    }

    const refLoja = doc(db, "configuracoes", "loja")
    const unsubscribe = onSnapshot(refLoja, (snap) => {
      if (snap.exists()) {
        setLojaAberta(snap.data().aberta)
      }
      setCarregandoLoja(false)
    }, (error) => {
      console.error("Erro ao carregar status da loja:", error)
      setCarregandoLoja(false)
    })
    return () => unsubscribe()
  }, [])

  function alterarQtd(chave: string, valor: number) {
    setItens(prev => ({
      ...prev,
      [chave]: Math.max(0, prev[chave] + valor)
    }))
  }

  const totalItensSelecionados = Object.values(itens).reduce((a, b) => a + b, 0)
  
  let subtotal = 0
  let qtdComidas = 0
  let qtdCafes = itens.cafe

  Object.entries(itens).forEach(([key, qtd]) => {
    subtotal += (PRECOS_PRODUTOS[key] || 0) * qtd
    if (key !== "cafe") qtdComidas += qtd
  })

  let descuentoCombo = 0
  if (qtdComidas > 0 && qtdCafes > 0) {
    const totalCombosPossiveis = Math.min(qtdComidas, qtdCafes)
    let cafesAplicados = 0

    Object.entries(itens).forEach(([key, qtd]) => {
      if (key !== "cafe" && qtd > 0) {
        const comidasNoCombo = Math.min(qtd, totalCombosPossiveis - cafesAplicados)
        if (comidasNoCombo > 0) {
          const valorNormalPar = PRECOS_PRODUTOS[key] + PRECOS_PRODUTOS.cafe
          const descuentoPorPar = valorNormalPar - 10.00
          descuentoCombo += descuentoPorPar * comidasNoCombo
          cafesAplicados += comidasNoCombo
        }
      }
    })
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
    if (!endereco.trim()) {
      setErroValidacao("Por favor, preencha o campo: Endereço de Entrega.")
      document.getElementById("campo-endereco")?.scrollIntoView({ behavior: "smooth" })
      return
    }
    if (!numeroCasa.trim()) {
      setErroValidacao("Por favor, preencha o campo: Número da Casa.")
      document.getElementById("campo-numero")?.scrollIntoView({ behavior: "smooth" })
      return
    }
    if (horario === "0:00") {
      setErroValidacao("Por favor, escolha um Horário para a sua entrega.")
      setMostrarListaHorarios(true)
      document.getElementById("campo-horario")?.scrollIntoView({ behavior: "smooth" })
      return
    }
    
    setEtapa("confirmacao")
  }

  async function executarCopiaTexto(texto: string) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texto)
    } else {
      const inputInvisivel = document.createElement("input")
      inputInvisivel.value = texto
      inputInvisivel.style.position = "absolute"
      inputInvisivel.style.left = "-9999px"
      document.body.appendChild(inputInvisivel)
      inputInvisivel.select()
      inputInvisivel.setSelectionRange(0, 99999)
      document.execCommand("copy")
      document.body.removeChild(inputInvisivel)
    }
  }

  // ETAPA 1: Processa o clique do botão final (Gera o PIX ou vai direto para Dinheiro)
  async function processarEnvioPedido() {
    if (enviandoPedido) return
    setEnviandoPedido(true)
    setStatusPix("normal")

    if (pagamento === "Pix") {
      try {
        setStatusPix("carregando")
        const dadosPix = await gerarPixCopiaECola(valorTotalFinal)
        
        if (!dadosPix || !dadosPix.payload) {
          throw new Error("Retorno do PIX inválido ou vazio")
        }

        console.log(dadosPix.payload)
        setStatusPix("copiado")
        // Trava o fluxo aqui abrindo o modal. O envio pro banco só ocorre quando ele clicar em fechar.
        setMostrarAlertaPix(true)
        setEnviandoPedido(false) 
      } catch (error) {
        console.error("Erro crítico no fluxo do PIX:", error)
        setStatusPix("erro")
        alert("Não foi possível gerar o código PIX automaticamente. Certifique-se de que a chave da Sueli está configurada corretamente no arquivo lib/pix.")
        setEnviandoPedido(false)
      }
    } else {
      // Se for dinheiro, não precisa de modal, salva direto no banco de dados
      await salvarPedidoNoBanco()
    }
  }

  // ETAPA 2: Grava de fato no Firestore (chamado direto em Dinheiro, ou após o OK do PIX)
  async function salvarPedidoNoBanco() {
    setEnviandoPedido(true)
    
    if (typeof window !== "undefined") {
      localStorage.setItem("tapicuz_nome", nome.trim())
      localStorage.setItem("tapicuz_endereco", endereco.trim())
      localStorage.setItem("tapicuz_numero", numeroCasa.trim())
      localStorage.setItem("tapicuz_referencia", referencia.trim())
    }

    const enderecoCompleto = `${endereco.trim()}, Nº ${numeroCasa.trim()} ${referencia.trim() ? `- Ref: ${referencia.trim()}` : ""}`

    const payloadPedido = {
      nome: nome.trim(),
      endereco: enderecoCompleto,
      observacao: observacao.trim(),
      pagamento,
      troco: trocoCalculado,
      valorTotal: valorTotalFinal,
      horario,
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
      setMostrarAlertaPix(false) // Garante o fechamento do modal
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
      cafe: 0 
    })
    setObservacao("") 
    setTrocoPara("")
    setHorario("0:00")
    setErroValidacao(null)
    setVersiculoEscolhido("")
    setStatusPix("normal")
    setEtapa("menu")
  }

  if (carregandoLoja) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-zinc-500 text-xs tracking-widest font-bold animate-pulse">
        CARREGANDO CARDÁPIO...
      </div>
    )
  }

 if (!lojaAberta) {
  return (
    <div className="min-h-screen bg-orange-600 flex flex-col items-center justify-center px-4 text-center text-zinc-900">git add .git add .git add .git add .
        <div className="text-center mb-8 select-none">
          <h1 className="text-3xl font-mono tracking-widest italic font-black text-orange-500 uppercase">TAPICUZ</h1>
          <p className="text-xs font-bold text-amber-500/80 tracking-widest uppercase mt-0.5">DA SUL</p>
        </div>
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 p-8 rounded-3xl shadow-2xl space-y-4">
          <div className="text-4xl animate-pulse">🌙</div>
          <h2 className="text-lg font-black uppercase text-orange-500 tracking-wider">
            NO MOMENTO NÃO ESTAMOS ACEITANDO PEDIDOS!
                      obrigada.
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            
          </p>
        </div>
      </div>
    )
  }

  if (etapa === "sucesso") {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md w-full bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner animate-bounce">
            ✓
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-emerald-400 tracking-wider uppercase">
              PEDIDO ENVIADO COM SUCESSO!
            </h2>
            <p className="text-xs text-zinc-400 px-4">
              Sua encomenda já chegou no nosso sistema e foi direto para a produção!
            </p>
          </div>

          {/* ESPAÇO DO VERSÍCULO - MÁXIMA NITIDEZ */}
          {versiculoEscolhido && (
            <div className="border-2 border-amber-500/30 py-5 my-2 space-y-3 bg-zinc-900 rounded-2xl p-5 shadow-inner">
              <span className="text-xs font-black text-amber-400 tracking-widest block uppercase">
                📖 UMA PALAVRA PARA O SEU DIA:
              </span>
              <p className="text-base text-white font-bold leading-relaxed px-1">
                "{versiculoEscolhido}"
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
    <main className="min-h-screen bg-zinc-900 text-zinc-200 pb-32 font-sans antialiased selection:bg-orange-500/20">
      
      {/* CARD FLUTUANTE DO PIX - FICA FIXADO ATÉ O CLIENTE CLICAR NO BOTÃO */}
      {mostrarAlertaPix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border-4 border-emerald-500 max-w-md w-full rounded-[32px] p-8 text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 text-4xl flex items-center justify-center mx-auto">
              📋
            </div>
            
            <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-wide">
               PIX COPIAR E COLAR COPIADO!
            </h3>
            
           <div className="space-y-4 text-zinc-100 text-xl font-bold leading-snug">
  <p className="text-lg text-zinc-400">
    Olá,
  </p>
  {/* Nome gigante, em negrito pesado e na cor laranja */}
  <p className="text-4xl font-black text-orange-500 tracking-wide uppercase break-words px-2">
    {nome || "CLIENTE"}
  </p>
  <p className="text-white pt-2">
    O código de pagamento foi gerado com sucesso.
  </p>
  <p className="bg-zinc-900 border border-zinc-800 text-emerald-400 p-5 rounded-2xl font-black text-2xl tracking-wide uppercase shadow-inner">
    NÃO ESQUEÇA DE ENVIAR O COMPROVANTE. OBRIGADO
  </p>
</div>

            <button
              type="button"
              disabled={enviandoPedido}
              onClick={salvarPedidoNoBanco} // ← Clicar aqui agora envia pro Firebase e conclui o fluxo
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-base uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg block mt-2 disabled:opacity-40"
            >
              {enviandoPedido ? "GRAVANDO PEDIDO..." : "OK, ENTENDIDO!"}
            </button>
          </div>
        </div>
      )}

      {/* CABEÇALHO */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60 px-4 py-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-center relative">
          <div className="text-center select-none">
            <h1 className="text-2xl font-mono tracking-widest italic font-black text-orange-500 uppercase">CARDÁPIO DO DIA</h1>
            <p className="text-xs font-bold text-amber-500/80 tracking-[0.2em] uppercase mt-0.5"></p>
          </div>
          <div className="absolute right-0 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Aberto
          </div>
        </div>
      </header>

      {(etapa === "menu" || etapa === "observacao" || etapa === "checkout") && (
        <div className="max-w-2xl mx-auto w-full px-0 sm:px-4">
          <div className="w-full overflow-hidden rounded-b-3xl shadow-lg border-b border-zinc-800/50 block">
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
          <div className="bg-orange-950/30 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-lg">🔥</span>
            <div className="text-xs">
              <h4 className="font-black text-orange-400 uppercase tracking-wide">Combo Ativo!</h4>
              <p className="text-zinc-400 font-medium">Monte qualquer par de <strong>Comida + Café</strong> por apenas <strong className="text-emerald-400 font-bold">R$ 10,00</strong>.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {Object.keys(PRECOS_PRODUTOS).map((chave) => {
              const produto = DETALHES_PRODUTOS[chave]
              const preco = PRECOS_PRODUTOS[chave]
              const quantidade = itens[chave] || 0
              const ehPrimeiroItem = chave === "tapiocaMolhada"

              return (
               <div 
  key={chave} 
  className={`border rounded-3xl p-6 flex flex-col items-center gap-5 transition-all 
    ${quantidade > 0 
      ? "bg-amber-400 border-orange-600 border-4 shadow-[0_0_20px_rgba(249,115,22,0.3)] scale-[1.02]" 
      : "bg-amber-100/95 border-amber-200 shadow-sm"
    }`}
>
                  <div className="w-full flex justify-center mb-3">
                    <Image
                      src={`/produtos/${
                        chave === "tapiocaMolhada" ? "tapioca_molhada.png"
                          : chave === "tapiocaManteiga" ? "tapioca_manteiga.png"
                          : chave === "tapiocaQueijo" ? "tapioca_queijo.png"
                          : chave === "tapiocaOvo" ? "tapioca_ovo.png"              
                          : chave === "tapiocaQueijoOvo" ? "tapioca_queijo_ovo.png"  
                          : chave === "cuscuzMilho" ? "cuscuz_milho.png"
                          : chave === "cuscuzArroz" ? "cuscuz_arroz.png"
                          : chave === "cuscuzMilhoArroz" ? "cuscuz_milho_arroz.png"
                          : "cafe_leite.png"
                      }`}
                      alt={produto.nome}
                      width={112}
                      height={112}
                      className="w-28 h-28 object-cover aspect-square rounded-2xl border-2 border-stone-200 shadow-md"
                      loading={ehPrimeiroItem ? "eager" : "lazy"}
                      priority={ehPrimeiroItem}
                    />
                  </div>

                  <div className="text-center">
                    <h3 className="font-black text-orange-600 text-xl tracking-wide uppercase">{produto.nome}</h3>
                    <span className="text-emerald-600 font-black text-lg block mt-1">R$ {preco.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center bg-stone-200/60 border border-stone-300 rounded-2xl p-1.5 gap-2 w-full max-w-[200px] justify-center">
                    {quantidade > 0 && (
                      <>
                        <button 
                          type="button" 
                          onClick={() => alterarQtd(chave, -1)} 
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
                      className={`h-12 rounded-xl font-black transition-all active:scale-95 flex items-center justify-center ${quantidade > 0 ? "w-12 bg-orange-500 text-white text-lg" : "w-full px-6 bg-stone-50 text-stone-700 border border-stone-300 text-sm uppercase tracking-widest"}`}
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

      {/* TELA: OBSERVAÇÃO DO PEDIDO */}
      {etapa === "observacao" && (
        <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <button type="button" onClick={() => setEtapa("menu")} className="text-zinc-400 hover:text-zinc-200 font-bold text-xs bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl shadow-sm">← Voltar</button>
            <h2 className="text-xs font-black uppercase text-orange-500 tracking-wider ml-auto">Preferências</h2>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 p-6 rounded-3xl space-y-5 shadow-md text-center">
            <h2 className="text-xl font-black text-white uppercase tracking-wider block w-full text-center py-2">
              ALGUMA OBSERVAÇÃO NO PEDIDO ?
            </h2>

            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Digite aqui como você deseja o seu pedido..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-2xl p-4 text-sm text-center text-zinc-100 outline-none transition-all resize-none font-medium placeholder:text-zinc-600 focus:placeholder:opacity-0"
              rows={4}
            />

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setEtapa("checkout")}
                className="w-full py-4 bg-orange-500 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
              >
                Continuar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TELA: FORMULÁRIO CHECKOUT */}
      {etapa === "checkout" && (
        <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <button type="button" onClick={() => setEtapa("observacao")} className="text-zinc-400 hover:text-zinc-200 font-bold text-xs bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl shadow-sm">← Voltar</button>
            <h2 className="text-xs font-black uppercase text-orange-500 tracking-wider ml-auto">Informações de Entrega</h2>
          </div>

          {erroValidacao && (
            <div className="bg-red-500/20 border-2 border-red-500 text-red-200 p-4 rounded-2xl font-black text-xs uppercase tracking-wider text-center shadow-lg">
              ⚠️ {erroValidacao}
            </div>
          )}

          <form onSubmit={irParaConferencia} className="space-y-3 text-[11px]" noValidate>
            <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-2xl space-y-3 shadow-md">
              <div id="campo-nome">
                <label className="text-xs font-black text-orange-400 uppercase block mb-1">Seu Nome *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Maria Souza" 
                  value={nome} 
                  onChange={(e) => { setNome(e.target.value); setErroValidacao(null); }} 
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl p-3.5 text-sm text-zinc-100 outline-none transition-all" 
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div id="campo-endereco" className="col-span-2">
                  <label className="text-xs font-black text-orange-400 uppercase block mb-1">Endereço de Entrega *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Rua das Flores" 
                    value={endereco} 
                    onChange={(e) => { setEndereco(e.target.value); setErroValidacao(null); }} 
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl p-3.5 text-sm text-zinc-100 outline-none transition-all" 
                  />
                </div>
                <div id="campo-numero">
                  <label className="text-xs font-black text-orange-400 uppercase block mb-1">Número *</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="123" 
                    value={numeroCasa} 
                    onChange={(e) => { setNumeroCasa(e.target.value); setErroValidacao(null); }} 
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl p-3.5 text-sm font-black text-center text-zinc-100 outline-none transition-all" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-orange-400 uppercase block mb-1">Ponto de Referência (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Próximo ao mercado" 
                  value={referencia} 
                  onChange={(e) => setReferencia(e.target.value)} 
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-400 rounded-xl p-3.5 text-sm text-zinc-100 outline-none transition-all" 
                />
              </div>

              <div id="campo-horario" className="text-center pt-3 border-t border-zinc-800/50 rounded-xl p-2">
                <label className="text-xs font-black text-orange-500 uppercase block mb-2 animate-pulse">
                  ⚠️ ESCOLHA O HORÁRIO DA ENTREGA ABAIXO *
                </label>
                
                <button
                  type="button"
                  onClick={() => setMostrarListaHorarios(!mostrarListaHorarios)}
                  className={`w-full bg-zinc-900 rounded-2xl py-4 px-4 flex items-center justify-center relative active:scale-95 transition-all border-4 ${
                    horario === "0:00" 
                      ? "border-orange-500 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.4)]" 
                      : "border-emerald-500"
                  }`}
                >
                  <span className={`${horario === "0:00" ? "text-orange-400" : "text-emerald-400"} font-black text-2xl tracking-wide`}>
                    {horario === "0:00" ? "TOQUE AQUI PARA ESCOLHER A HORA" : horario}
                  </span>
                  <span className="text-orange-500 absolute right-4 text-xs font-bold">{mostrarListaHorarios ? "▲" : "▼"}</span>
                </button>

                {mostrarListaHorarios && (
                  <div className="mt-2 grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-2 bg-zinc-900 border-2 border-orange-500 rounded-xl shadow-inner">
                    {OPCOES_HORARIOS.map((hora) => (
                      <button
                        key={hora}
                        type="button"
                        onClick={() => {
                          setHorario(hora)
                          setErroValidacao(null)
                          setMostrarListaHorarios(false)
                        }}
                        className={`py-3 text-center rounded-lg font-bold text-xs transition-all ${
                          horario === hora 
                            ? "bg-orange-500 text-white font-black shadow-lg" 
                            : "bg-zinc-950 text-zinc-400 border border-zinc-800"
                        }`}
                      >
                        {hora}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-2xl space-y-3 shadow-md">
              <div>
                <label className="text-xs font-black text-orange-400 uppercase block mb-1">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setPagamento("Pix")}
                    className={`p-3.5 rounded-xl border text-sm font-black text-center uppercase tracking-wider transition-all ${pagamento === "Pix" ? "bg-teal-500/10 border-teal-500 text-teal-400" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}
                  >
                    📲 PIX
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPagamento("Dinheiro")}
                    className={`p-3.5 rounded-xl border text-sm font-black text-center uppercase tracking-wider transition-all ${pagamento === "Dinheiro" ? "bg-orange-500/10 border-orange-500 text-orange-400" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}
                  >
                    💵 DINHEIRO
                  </button>
                </div>
              </div>

              {pagamento === "Pix" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center mt-2">
                  <p className="text-orange-400 font-black text-xs uppercase tracking-wider">
                    Total a pagar no PIX
                  </p>
                  <p className="text-3xl font-black text-emerald-400 mt-1 tracking-tight">
                    R$ {valorTotalFinal.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-2 uppercase font-semibold">
                    O código copia-e-cola será gerado ao confirmar o pedido.
                  </p>
                </div>
              )}

              {pagamento === "Dinheiro" && (
                <div className="space-y-1 pt-0.5">
                  <label className="text-xs font-black text-orange-400 uppercase block mb-1">Precisa de troco para quanto?</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="R$: 0.00"
                    value={trocoPara} 
                    onChange={(e) => setTrocoPara(e.target.value)} 
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-400 rounded-xl p-3.5 text-sm text-center text-zinc-100 font-bold outline-none transition-all" 
                  />
                  {trocoCalculado > 0 && (
                    <p className="text-xs text-center text-emerald-400 font-bold pt-0.5">Seu troco será de: R$ {trocoCalculado.toFixed(2)}</p>
                  )}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-orange-500 text-white text-base font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 text-center block"
            >
              Conferir Pedido →
            </button>
          </form>
        </div>
      )}

      {/* TELA DE CONFIRMAÇÃO */}
      {etapa === "confirmacao" && (
        <div className="max-w-md mx-auto px-4 mt-6 space-y-5 text-base uppercase">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <button type="button" onClick={() => setEtapa("checkout")} className="text-zinc-400 hover:text-zinc-200 font-black text-xs bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl shadow-sm">← ALTERAR DADOS</button>
            <h2 className="text-sm font-black uppercase text-orange-500 tracking-wider ml-auto">CONFERIR PEDIDO</h2>
          </div>

          <div className="bg-zinc-950 border-2 border-orange-500/60 rounded-[32px] p-6 space-y-5 shadow-2xl text-center">
            <div className="space-y-3 text-zinc-200 border-b-2 border-zinc-900 pb-4 text-sm leading-relaxed flex flex-col items-center uppercase">
              <p><strong className="text-zinc-500 block text-xs uppercase tracking-wider">CLIENTE:</strong> <span className="text-zinc-100 font-bold text-base">{nome.toUpperCase()}</span></p>
              
              <div className="w-full text-center">
                <strong className="text-zinc-500 block text-xs uppercase tracking-wider">ENDEREÇO DE ENTREGA:</strong> 
                <span className="text-zinc-100 font-semibold text-sm">
                  {`${endereco.toUpperCase().trim()}, Nº ${numeroCasa.toUpperCase().trim()}`}
                </span>
                {referencia.trim() && (
                  <span className="text-amber-400 font-bold block text-xs mt-1 lowercase first-letter:uppercase bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 max-w-xs mx-auto">
                    📍 Ref: {referencia.toUpperCase().trim()}
                  </span>
                )}
              </div>

              {observacao.trim() && (
                <div className="w-full text-center bg-zinc-900 px-3 py-2.5 rounded-xl border border-zinc-800 max-w-sm mx-auto mt-1">
                  <strong className="text-orange-400 block text-[11px] font-black uppercase tracking-wider mb-0.5">📝 Observação do Pedido:</strong>
                  <span className="text-zinc-300 font-medium normal-case block text-xs px-2 leading-relaxed">
                    "{observacao.trim()}"
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900 w-full">
                <div>
                  <strong className="text-zinc-500 block text-[10px] uppercase tracking-wider">HORÁRIO MARCADO:</strong> 
                  <span className="text-orange-500 font-black font-mono text-xl block mt-0.5">{horario}</span>
                </div>
                <div>
                  <strong className="text-zinc-500 block text-[10px] uppercase tracking-wider">FORMA DE PAGAMENTO:</strong> 
                  <span className="text-zinc-100 font-black uppercase text-sm block mt-1">{pagamento.toUpperCase()}</span>
                </div>
              </div>

              {pagamento === "Dinheiro" && (
                <div className="w-full mt-3 bg-zinc-900 border-2 border-amber-500/50 rounded-2xl p-4 space-y-2 text-center shadow-inner">
                  <div>
                    <span className="text-zinc-400 text-[10px] font-black block tracking-widest">VAI PAGAR COM NOTA DE:</span>
                    <span className="text-amber-400 font-mono font-black text-2xl">
                      R$ {trocoParaNum > 0 ? trocoParaNum.toFixed(2) : valorTotalFinal.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-zinc-800/80 pt-2">
                    <span className="text-zinc-400 text-[10px] font-black block tracking-widest">VALOR DO SEU TROCO:</span>
                    <span className="text-emerald-400 font-mono font-black text-3xl block mt-0.5 animate-pulse">
                      R$ {trocoCalculado.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 flex flex-col items-center uppercase">
              <span className="text-[11px] uppercase font-black text-zinc-500 block tracking-wider mb-2">
                ITENS ESCOLHIDOS:
              </span>
              {Object.entries(itens).map(([chave, qtd]) => {
                if (qtd === 0) return null
                const produto = DETALHES_PRODUTOS[chave]
                const precoUnidade = PRECOS_PRODUTOS[chave]
                return (
                  <div 
                    key={chave} 
                    className="flex justify-between items-center text-zinc-100 text-sm py-1.5 w-full max-w-sm border-b border-zinc-900/40 last:border-0 px-1"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-base select-none">{produto.icone}</span> 
                      <span className="text-orange-400 font-black text-base">{qtd}X</span> 
                      <span className="font-bold">{produto.nome.toUpperCase()}</span>
                    </div>
                    
                    <div className="text-right font-black text-zinc-300 font-mono min-w-[75px]">
                      R$ {(precoUnidade * qtd).toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t-2 border-zinc-900 pt-4 space-y-2 uppercase">
              {descuentoCombo > 0 && (
                <div className="flex justify-between text-emerald-400 font-black text-xs uppercase bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10 justify-center gap-2">
                  <span>DESCONTO COMBO ATIVO:</span>
                  <span>- R$ {descuentoCombo.toFixed(2)}</span>
                </div>
              )}
              <div className="flex flex-col items-center bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 mt-2 text-center">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">VALOR TOTAL DO PEDIDO</span>
                <span className="text-emerald-400 text-3xl font-black font-mono tracking-tight mt-1">R$ {valorTotalFinal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button 
            type="button"
            disabled={enviandoPedido}
            onClick={processarEnvioPedido} // ← Chama a nova lógica controlada
            className={`w-full py-5 px-6 disabled:opacity-40 text-zinc-950 text-lg font-black uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95
              ${statusPix === "carregando" ? "bg-zinc-700 animate-pulse text-white" : "bg-emerald-600 hover:bg-emerald-500"}
            `}
          >
            {statusPix === "carregando" && "⌛ GERANDO SEU PIX..."}
            {statusPix === "copiado" && "📋 MOSTRANDO PIX COPIADO..."}
            {statusPix === "normal" && (enviandoPedido ? "ENVIANDO PARA COZINHA..." : "🚀 CONFIRMAR E ENVIAR")}
            {statusPix === "erro" && "❌ TENTAR NOVAMENTE"}
          </button>
        </div>
      )}

      {/* BARRA INFERIOR DE NAVEGAÇÃO COMPRAS */}
      {totalItensSelecionados > 0 && (etapa === "menu" || etapa === "checkout") && (
        <div className="fixed bottom-6 left-4 right-4 z-40 max-w-xl mx-auto">
          <div className="bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
            <div className="flex flex-col items-center justify-center w-full sm:w-auto">
              <span className="bg-orange-500/10 text-orange-400 font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider block mx-auto">
                {totalItensSelecionados} {totalItensSelecionados === 1 ? "ITEM SELECIONADO" : "ITENS SELECIONADOS"}
              </span>
              <div className="flex items-baseline justify-center gap-1 mt-1 w-full">
                <span className="text-lg font-black text-emerald-400 tracking-tight text-center block w-full">
                  Total: R$ {valorTotalFinal.toFixed(2)}
                </span>
              </div>
            </div>

            {etapa === "menu" && (
              <button 
                type="button" 
                onClick={() => setEtapa("observacao")} 
                className="py-3 px-8 w-full sm:w-auto bg-orange-500 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
              >
                AVANÇAR →
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}