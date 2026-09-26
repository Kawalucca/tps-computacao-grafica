import { criarContexto, carregarPrograma } from './engine/gl.js'
import { iniciarLoop } from './engine/loop.js'
import { LARGURA_MUNDO, ALTURA_MUNDO, criarProjecao, observarTamanho } from './engine/mundo.js'
import { carregarTextura, criarTexturaBranca } from './engine/textura.js'
import { RenderizadorSprites } from './engine/renderizador-sprites.js'
import { criarEntrada } from './engine/entrada.js'
import { criarPool, adicionar, removerMortos, paraCadaAtivo, buscarAtivo } from './engine/pool.js'
import { destravarAudio, carregarSomOpcional, tocarEfeito, iniciarMusicaFundo } from './engine/audio.js'
import { estaViva, afastarDeObstaculo, causarDano, contemPonto } from './game/entidade.js'
import { criarFarol, atualizarFarol, FAROL_LAMPADA } from './game/farol.js'
import { criarBarco, atualizarBarco } from './game/barco.js'
import { ILHA } from './game/ilha.js'
import { criarInimigo, atualizarInimigo, FLASH_DURACAO } from './game/inimigo.js'
import { criarBoss, atualizarBoss, atualizarDisparoBoss, caminhoDoBoss } from './game/boss.js'
import { atualizarProjetil, verificarImpacto, uvProjetil, PROPORCAO_QUADRO_PROJETIL, DURACAO_DISPARO, DURACAO_IMPACTO } from './game/projetil.js'
import { criarAtirador, atualizarAtirador } from './game/ataque.js'
import { ONDAS, criarGerenciadorOndas, atualizarOndas } from './game/ondas.js'

// MVP (Fase 3) + waves de verdade (1-3, só piratas), tipos de inimigo
// diferentes, texturas próprias e som (Fase 4). O Holandês Voador entra na
// Fase 5, no gancho que ondas.js deixa pronto (estado 'concluido').

const canvas = document.querySelector('#tela-webgl')
const hud = document.querySelector('#hud')

// desligar antes da entrega: mostra fps e o tamanho das pools no canto,
// só para facilitar o desenvolvimento — não faz parte do jogo em si
const MOSTRAR_DEBUG = true

const UV_IMAGEM_INTEIRA = new Float32Array([0, 0, 1, 1])
const COR_BRANCA = new Float32Array([1, 1, 1, 1]) // usada só se um projétil não tiver cor própria

// ---- cenário (posições/tamanhos de mundo, não pixels de tela) ----
const TAMANHO_ILHA = { largura: 360, altura: 240 } // posição vem de ILHA (ilha.js)
const POSICAO_FAROL_VISUAL = { x: 0, y: 60 }
const TAMANHO_FAROL = { largura: 120, altura: 220 }
const FAROL_BASE_Y = POSICAO_FAROL_VISUAL.y - TAMANHO_FAROL.altura / 2 // ver comentário em desenhar()
const TAMANHO_FEIXE = { largura: 90, altura: 640 }
const COR_FEIXE = new Float32Array([1, 0.97, 0.82, 0.22]) // sutil de dia
const COR_MAR_NOITE = new Float32Array([0.22, 0.3, 0.55, 1])
// à noite o feixe é desenhado com mistura ADITIVA (soma luz ao que está
// embaixo): num cenário escuro, a luz passa a "brilhar" de verdade em vez de
// só ficar uma faixa transparente — duas passadas, um halo largo e fraco e o
// núcleo mais estreito e forte, dão a sensação de luz se espalhando no ar
const COR_FEIXE_NOITE_HALO = new Float32Array([1, 0.9, 0.6, 0.22])
const COR_FEIXE_NOITE_NUCLEO = new Float32Array([1, 0.95, 0.75, 0.55])
const LARGURA_HALO_FEIXE = 1.9 // multiplica TAMANHO_FEIXE.largura
const TAMANHO_BARCO = { largura: 64, altura: 64 }
// atingido pelo Holandês: aura verde fantasmagórica (a cor do poder dele), pulsando suave
const COR_BARCO_ATORDOADO = new Float32Array([0.6, 1, 0.8, 1])
const COR_AURA_ATORDOADO = new Float32Array([0.25, 1, 0.6, 0.45])
const ESCALA_AURA_ATORDOADO = 1.4

// ---- inimigos e projéteis ----
const CAPACIDADE_INIMIGOS = 60
const CAPACIDADE_PROJETEIS = 80
const TAMANHO_INIMIGO_BASE = 56 // multiplicado pela `escala` de cada tipo (inimigo.js)
// tamanho do projétil EM VOO; a altura sai da largura pra respeitar a
// proporção real de cada quadro do spritesheet (ver projetil.js), sem esticar
const ALTURA_PROJETIL = 30
const LARGURA_PROJETIL = ALTURA_PROJETIL * PROPORCAO_QUADRO_PROJETIL
const ESCALA_IMPACTO = 2.4 // a explosão é desenhada bem maior que o projétil voando
// escala do "flash" de disparo: começa um pouco menor e cresce até o tamanho
// normal — sem isso (escala fixa em 1) a troca disparo->voo parece um corte seco
const ESCALA_INICIAL_DISPARO = 0.6
// cor "de rascunho" para cores calculadas na hora (fade, aura pulsando, barra
// de vida): reaproveitada em vez de alocar uma nova por sprite, e sem alterar
// as cores fixas compartilhadas (COR_BRANCA etc.). Seguro porque cada
// desenharRegiao já envia a cor para a GPU antes do próximo uso.
const COR_TEMP = new Float32Array(4)
const COR_CAMINHO_BOSS = new Float32Array([1, 0.08, 0.08, 0.9])
const COR_BRILHO_BOSS = new Float32Array([0.3, 0.8, 1, 0.42])
const COR_FLASH_INIMIGO = new Float32Array([1, 1, 1, 1]) // "pisca" de branco ao tomar dano

// barra de vida dos inimigos comuns: só aparece depois do primeiro dano (com
// a vida cheia não informa nada e poluiria a tela); o chefe tem a dele no HUD
const ALTURA_BARRA_VIDA = 5
const LARGURA_BARRA_VIDA = 0.7 // fração do tamanho do inimigo
const COR_BARRA_FUNDO = new Float32Array([0, 0, 0, 0.6])
const COR_VIDA_CHEIA = [0.35, 0.9, 0.35]
const COR_VIDA_BAIXA = [0.95, 0.25, 0.2]

// ---- regras de jogo ----
const DANO_DEDADA = 15
const PONTOS_POR_INIMIGO = 10

/** Suavização "ease-out": rápido no início, desacelerando até o fim — usada
 *  pra animar escala/opacidade dos projéteis sem precisar de quadros extras. */
function suavizarSaida(t) {
  const c = 1 - t
  return 1 - c * c * c
}

function mostrarErro(mensagem) {
  hud.classList.add('erro')
  hud.textContent = mensagem
}

function criarPainelDebug() {
  const painel = document.createElement('div')
  painel.className = 'debug'
  hud.append(painel)
  return painel
}

// ícones do HUD: SVGs simples em linha, tingidos por CSS (currentColor/fill),
// pra não depender de mais nenhum arquivo de imagem
const ICONE_CORACAO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.9-4.35-9.4-8.4C1.1 10.2 1.7 6.6 4.8 5.4c2.5-1 4.9.2 7.2 3 2.3-2.8 4.7-4 7.2-3 3.1 1.2 3.7 4.8 2.2 7.2C18.9 16.65 12 21 12 21z"/></svg>'
const ICONE_BUSSOLA = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15.2 8.8l-2.1 4.7-4.7 2.1 2.1-4.7z"/><circle cx="12" cy="12" r="1.3"/></svg>'
const ICONE_PAUSA = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'

/**
 * HUD "de verdade": vida do farol (com barra), pontuação, a wave atual (com
 * marcadores de progresso e, com o chefe em campo, a barra de vida dele) e o
 * botão de pausa.
 */
function criarHud(aoPausar) {
  const vidaEl = document.createElement('div')
  vidaEl.className = 'hud-vida'
  vidaEl.innerHTML = `
    <div class="hud-vida-icone">${ICONE_CORACAO}</div>
    <div class="hud-vida-corpo">
      <div class="hud-vida-texto"></div>
      <div class="hud-vida-barra"><div class="hud-vida-barra-preenchimento"></div></div>
    </div>
  `

  const pontuacaoEl = document.createElement('div')
  pontuacaoEl.className = 'hud-pontuacao'
  pontuacaoEl.innerHTML = `
    <div class="hud-pontuacao-corpo">
      <div class="hud-pontuacao-rotulo">Pontuação</div>
      <div class="hud-pontuacao-texto"></div>
    </div>
    <div class="hud-pontuacao-icone">${ICONE_BUSSOLA}</div>
  `

  const ondaEl = document.createElement('div')
  ondaEl.className = 'hud-onda'
  const ondaTextoEl = document.createElement('div')
  ondaTextoEl.className = 'hud-onda-texto'
  const ondaPipsEl = document.createElement('div')
  ondaPipsEl.className = 'hud-onda-pips'
  // um marcador por wave definida em ONDAS.js + um último, especial, pro chefe
  const pips = ONDAS.map(() => {
    const pip = document.createElement('span')
    pip.className = 'hud-onda-pip'
    ondaPipsEl.append(pip)
    return pip
  })
  const pipBoss = document.createElement('span')
  pipBoss.className = 'hud-onda-pip hud-onda-pip-boss'
  pipBoss.textContent = '☠'
  ondaPipsEl.append(pipBoss)
  const bossBarraEl = document.createElement('div')
  bossBarraEl.className = 'hud-boss-barra'
  const bossBarraPreenchimentoEl = document.createElement('div')
  bossBarraPreenchimentoEl.className = 'hud-boss-barra-preenchimento'
  bossBarraEl.append(bossBarraPreenchimentoEl)
  ondaEl.append(ondaTextoEl, ondaPipsEl, bossBarraEl)

  const botaoPausa = document.createElement('button')
  botaoPausa.className = 'hud-pausa'
  botaoPausa.setAttribute('aria-label', 'Pausar (Esc)')
  botaoPausa.title = 'Pausar (Esc)'
  botaoPausa.innerHTML = ICONE_PAUSA
  botaoPausa.addEventListener('click', aoPausar)

  hud.append(vidaEl, pontuacaoEl, ondaEl, botaoPausa)

  return {
    vidaTextoEl: vidaEl.querySelector('.hud-vida-texto'),
    vidaBarraEl: vidaEl.querySelector('.hud-vida-barra-preenchimento'),
    pontuacaoTextoEl: pontuacaoEl.querySelector('.hud-pontuacao-texto'),
    ondaEl,
    ondaTextoEl,
    pips,
    pipBoss,
    bossBarraEl: bossBarraPreenchimentoEl
  }
}

/** Texto amigável para o estado do gerenciador de ondas, mostrado no HUD. */
function textoDaOnda(ondas) {
  if (ondas.estado === 'concluido') {
    return 'Chefe: Holandês Voador'
  }
  const numeroOnda = Math.min(ondas.indiceOnda + 1, ONDAS.length)
  return `Onda ${numeroOnda} de ${ONDAS.length}`
}

/** Acende os marcadores de progresso do HUD (concluída / atual / chefe). */
function atualizarPipsOnda(painelHud, ondas, bossCriado) {
  painelHud.pips.forEach((pip, indice) => {
    pip.classList.toggle('concluida', indice < ondas.indiceOnda || ondas.estado === 'concluido')
    pip.classList.toggle('ativa', indice === ondas.indiceOnda && ondas.estado !== 'concluido')
  })
  painelHud.pipBoss.classList.toggle('ativa', bossCriado)
}

/** Zona clicável invisível, posicionada (via CSS) em cima de um botão desenhado na arte de fundo. */
function criarZonaClicavel(classe, rotulo, aoClicar) {
  const botao = document.createElement('button')
  botao.className = `zona-clicavel ${classe}`
  botao.setAttribute('aria-label', rotulo)
  botao.addEventListener('click', aoClicar)
  return botao
}

/**
 * Zona "Sair" + o aviso que ela mostra. window.close() só funciona em abas
 * abertas pelo próprio script — a maioria dos navegadores bloqueia fechar uma
 * aba que o jogador abriu normalmente. Tentamos mesmo assim; se não fechar
 * (caso mais comum), o aviso aparece em vez de não acontecer nada.
 */
function criarSair() {
  const aviso = document.createElement('p')
  aviso.className = 'aviso-sair'
  aviso.textContent = 'O navegador não deixou fechar sozinho — pode fechar esta aba. Obrigado por jogar!'

  const zona = criarZonaClicavel('zona-sair', 'Sair', () => {
    window.close()
    aviso.classList.add('visivel')
  })
  return { zona, aviso }
}

/**
 * Tela de "fim de jogo" (HTML sobreposto, nunca `window.alert`). Criada UMA
 * vez; `mostrar`/`esconder` só alternam a visibilidade, sem recriar o DOM.
 */
function criarTelaGameOver(aoReiniciar) {
  const tela = document.createElement('div')
  tela.className = 'tela-game-over'
  tela.style.display = 'none'

  // a arte de fundo (tela-fim-de-jogo.png) já traz "GAME OVER" e o texto de
  // derrota desenhados; na vitória (sem arte própria ainda) esse banner cobre
  // a placa do título e o subtítulo com a mensagem de vitória
  const bannerVitoria = document.createElement('div')
  bannerVitoria.className = 'tela-game-over-banner-vitoria'
  const tituloVitoria = document.createElement('h2')
  tituloVitoria.textContent = 'Vitória!'
  const subtituloVitoria = document.createElement('p')
  subtituloVitoria.textContent = 'O Holandês Voador foi derrotado. O farol resiste, por mais uma noite.'
  bannerVitoria.append(tituloVitoria, subtituloVitoria)

  const pontuacaoFinalEl = document.createElement('p')
  pontuacaoFinalEl.className = 'tela-game-over-pontuacao'

  const zonaJogar = criarZonaClicavel('zona-jogar', 'Jogar novamente', aoReiniciar)
  const sair = criarSair()

  const creditosEl = document.createElement('p')
  creditosEl.className = 'tela-game-over-creditos'
  creditosEl.textContent = 'by Hugo Daniel e Kawã Lucca'

  tela.append(bannerVitoria, pontuacaoFinalEl, zonaJogar, sair.zona, sair.aviso, creditosEl)
  hud.append(tela)

  return {
    mostrar(pontuacao, venceu = false) {
      tela.classList.toggle('venceu', venceu)
      pontuacaoFinalEl.textContent = `Pontuação final: ${pontuacao}`
      tela.style.display = 'block'
    },
    esconder() {
      tela.style.display = 'none'
      tela.classList.remove('venceu')
      sair.aviso.classList.remove('visivel')
    }
  }
}

/**
 * Menu inicial. Começa coberto por um "Clique para começar": como o navegador
 * só libera som depois de um clique/tecla, esse primeiro clique destrava a
 * trilha (ver `liberar`, chamado em main) e revela o menu já com a música.
 */
function criarTelaInicial(aoIniciar) {
  const tela = document.createElement('div')
  tela.className = 'tela-inicial'

  const convite = document.createElement('div')
  convite.className = 'tela-inicial-convite'
  const conviteTexto = document.createElement('p')
  conviteTexto.textContent = 'Clique para começar'
  convite.append(conviteTexto)

  const zonaJogar = criarZonaClicavel('zona-jogar', 'Jogar', () => {
    tela.style.display = 'none'
    aoIniciar()
  })
  const sair = criarSair()

  tela.append(zonaJogar, sair.zona, sair.aviso, convite)
  hud.append(tela)

  return {
    liberar() {
      tela.classList.add('pronta')
    },
    esconder() {
      tela.style.display = 'none'
    },
    mostrar() {
      tela.style.display = 'block'
      sair.aviso.classList.remove('visivel')
    }
  }
}

/** Tela de pausa: painel "Pausado" com botão de continuar (ou Esc/P de novo). */
function criarTelaPausa(aoContinuar) {
  const tela = document.createElement('div')
  tela.className = 'tela-pausa'

  const painel = document.createElement('div')
  painel.className = 'tela-pausa-painel'
  const titulo = document.createElement('h2')
  titulo.textContent = 'Pausado'
  const botao = document.createElement('button')
  botao.textContent = 'Continuar'
  botao.addEventListener('click', aoContinuar)
  const dica = document.createElement('p')
  dica.textContent = 'ou aperte Esc'
  painel.append(titulo, botao, dica)

  tela.append(painel)
  hud.append(tela)

  return {
    mostrar() {
      tela.classList.add('visivel')
    },
    esconder() {
      tela.classList.remove('visivel')
    }
  }
}

/**
 * Todo o estado que muda durante uma partida, num único objeto — para
 * reiniciar o jogo ser só "trocar esse objeto por um novo", sem esquecer
 * nenhum pedaço de estado solto.
 */
function criarEstadoJogo() {
  return {
    farol: criarFarol(),
    barco: criarBarco(),
    inimigos: criarPool(CAPACIDADE_INIMIGOS),
    projeteis: criarPool(CAPACIDADE_PROJETEIS),
    ondas: criarGerenciadorOndas(),
    bossCriado: false,
    atiradorFarol: criarAtirador({ alcance: 260, cadencia: 1.1, dano: 9, velocidadeProjetil: 500, categoria: 'farol' }),
    atiradorBarco: criarAtirador({ alcance: 160, cadencia: 0.5, dano: 8, velocidadeProjetil: 600, categoria: 'barco' }),
    pontuacao: 0,
    pausado: true, // começa no menu; depois também congela no fim de jogo
    pausadoPeloJogador: false // pausa pedida no meio da partida (Esc/P ou botão do HUD)
  }
}

async function main() {
  const gl = criarContexto(canvas)
  observarTamanho(gl)

  const programa = await carregarPrograma(gl, 'shaders/sprite.vert.glsl', 'shaders/sprite.frag.glsl')

  const [mar, ilhaTex, ilhaNoiteTex, farolTex, feixe, barcoTex, inimigoBatedorTex, inimigoPadraoTex, inimigoBrutamontesTex, bossTex, projetilTex, projeteisTex, somTiro, somImpacto, somMorte, musicaFundo] = await Promise.all([
    carregarTextura(gl, 'assets/images/mar.jpg', { mipmap: true }),
    carregarTextura(gl, 'assets/images/ilha.png'),
    carregarTextura(gl, 'assets/images/ilha-noite.png'),
    carregarTextura(gl, 'assets/images/farol.png'),
    carregarTextura(gl, 'assets/images/feixe.png'),
    carregarTextura(gl, 'assets/images/barco.png'),
    carregarTextura(gl, 'assets/images/inimigo-batedor.png'),
    carregarTextura(gl, 'assets/images/inimigo-padrao.png'),
    carregarTextura(gl, 'assets/images/inimigo-brutamontes.png'),
    carregarTextura(gl, 'assets/images/boss.png'),
    // ponto simples, usado só pra desenhar a linha fininha do rastro do boss
    // (não é um projétil de verdade, não precisa do spritesheet completo)
    carregarTextura(gl, 'assets/images/projetil.png'),
    // spritesheet único com as 4 categorias de projétil (linhas) x 3 estados
    // de animação (colunas) — ver mapeamento em projetil.js
    carregarTextura(gl, 'assets/images/projeteis.png'),
    // sons opcionais: se o arquivo ainda não foi colocado em assets/sounds/
    // (ex.: a trilha, gerada por IA à parte), o jogo carrega normalmente e só
    // fica em silêncio naquele som específico até o arquivo aparecer
    carregarSomOpcional('assets/sounds/tiro.mp3'),
    carregarSomOpcional('assets/sounds/impacto.mp3'),
    carregarSomOpcional('assets/sounds/morte.mp3'),
    carregarSomOpcional('assets/sounds/trilha.mp3')
  ])

  const texturasInimigos = {
    batedor: inimigoBatedorTex,
    padrao: inimigoPadraoTex,
    brutamontes: inimigoBrutamontesTex,
    boss: bossTex
  }

  const renderizador = new RenderizadorSprites(gl, programa)
  const brancoTex = criarTexturaBranca(gl)
  const entrada = criarEntrada(canvas)
  const projecao = criarProjecao()
  const painelHud = criarHud(alternarPausa)
  const painelDebug = MOSTRAR_DEBUG ? criarPainelDebug() : null

  gl.clearColor(0.09, 0.36, 0.52, 1)

  let estado = criarEstadoJogo()

  let telaInicial

  const telaGameOver = criarTelaGameOver(() => {
    estado = criarEstadoJogo()
    telaGameOver.esconder()
    telaInicial.mostrar()
  })
  telaInicial = criarTelaInicial(() => {
    estado.pausado = false
  })
  const telaPausa = criarTelaPausa(alternarPausa)

  // som só pode tocar depois da primeira interação do jogador (política de
  // todo navegador, não dá pra contornar). O primeiro clique/tecla em
  // qualquer lugar destrava o áudio, inicia a trilha e tira o "Clique para
  // começar" do menu — assim menu e música aparecem juntos
  function destravarNaPrimeiraInteracao() {
    destravarAudio()
    iniciarMusicaFundo(musicaFundo)
    telaInicial.liberar()
    document.removeEventListener('pointerdown', destravarNaPrimeiraInteracao)
    document.removeEventListener('keydown', destravarNaPrimeiraInteracao)
  }
  document.addEventListener('pointerdown', destravarNaPrimeiraInteracao)
  document.addEventListener('keydown', destravarNaPrimeiraInteracao)

  /** Pausa/retoma a partida. Não faz nada no menu nem no fim de jogo (não há partida rodando). */
  function alternarPausa() {
    if (estado.pausado) return
    estado.pausadoPeloJogador = !estado.pausadoPeloJogador
    if (estado.pausadoPeloJogador) telaPausa.mostrar()
    else telaPausa.esconder()
  }

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' || evento.key === 'p' || evento.key === 'P') alternarPausa()
  })

  // trocou de aba/minimizou no meio da partida: pausa sozinho, em vez de o
  // jogador voltar e encontrar o farol destruído
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !estado.pausado && !estado.pausadoPeloJogador) alternarPausa()
  })

  let quadros = 0
  let tempoAcumuladoDebug = 0

  function atualizar(dt) {
    if (!estado.pausado && !estado.pausadoPeloJogador) {
      atualizarFarol(estado.farol, dt)
      atualizarBarco(estado.barco, entrada.mouse, dt)
      afastarDeObstaculo(estado.barco, ILHA) // impede o barco de entrar na ilha

      // dedada: cada clique causa dano ao primeiro inimigo atingido (se houver)
      for (const clique of entrada.cliques) {
        const alvo = buscarAtivo(estado.inimigos, (inimigo) => contemPonto(inimigo, clique.x, clique.y))
        if (alvo) {
          causarDano(alvo, DANO_DEDADA)
          alvo.flashRestante = FLASH_DURACAO
          tocarEfeito(somImpacto, { volume: 0.35, variacaoPitch: 0.15 })
        }
      }

      // ondas: pergunta ao gerenciador se é hora de nascer alguém
      const tipoParaNascer = atualizarOndas(estado.ondas, estado.inimigos.quantidade, dt)
      if (tipoParaNascer) adicionar(estado.inimigos, criarInimigo(tipoParaNascer))

      if (estado.ondas.estado === 'concluido' && !estado.bossCriado) {
        adicionar(estado.inimigos, criarBoss())
        estado.bossCriado = true
      }

      // inimigos: andam até o farol e, encostados, causam dano contínuo nele
      paraCadaAtivo(estado.inimigos, (inimigo) => {
        if (inimigo.tipoId === 'boss') atualizarBoss(inimigo, estado.farol, dt)
        else atualizarInimigo(inimigo, estado.farol, dt)
      })

      const boss = buscarAtivo(estado.inimigos, (inimigo) => inimigo.tipoId === 'boss')
      if (boss) atualizarDisparoBoss(boss, estado.barco, estado.projeteis, dt)

      // farol e barco: cada um mira e atira sozinho no inimigo mais próximo
      if (atualizarAtirador(estado.atiradorFarol, estado.farol, estado.inimigos, estado.projeteis, dt)) {
        tocarEfeito(somTiro, { volume: 0.25, variacaoPitch: 0.08 })
      }
      if (estado.barco.stunRestante <= 0 && atualizarAtirador(estado.atiradorBarco, estado.barco, estado.inimigos, estado.projeteis, dt)) {
        tocarEfeito(somTiro, { volume: 0.25, variacaoPitch: 0.08 })
      }

      // projéteis: voam e, ao colidir com QUALQUER inimigo vivo (não só o que
      // miravam ao nascer — ele pode ter morrido nesse meio-tempo), causam dano
      paraCadaAtivo(estado.projeteis, (projetil) => {
        atualizarProjetil(projetil, dt)
        if (projetil.alvoTipo === 'heroi') {
          if (estaViva(projetil) && verificarImpacto(projetil, estado.barco)) {
            tocarEfeito(somImpacto, { volume: 0.2, variacaoPitch: 0.15 })
          }
        } else {
          paraCadaAtivo(estado.inimigos, (inimigo) => {
            if (estaViva(projetil) && verificarImpacto(projetil, inimigo)) {
              inimigo.flashRestante = FLASH_DURACAO
              tocarEfeito(somImpacto, { volume: 0.2, variacaoPitch: 0.15 })
            }
          })
        }
      })

      // pontuação e som de morte: verificados ANTES de remover quem morreu nesta rodada
      let bossDerrotado = false
      paraCadaAtivo(estado.inimigos, (inimigo) => {
        if (!estaViva(inimigo)) {
          estado.pontuacao += PONTOS_POR_INIMIGO
          tocarEfeito(somMorte, { volume: 0.25, variacaoPitch: 0.1 })
          if (inimigo.tipoId === 'boss') bossDerrotado = true
        }
      })

      removerMortos(estado.projeteis, estaViva)
      removerMortos(estado.inimigos, estaViva)

      const vidaAtual = Math.max(0, Math.ceil(estado.farol.vida))
      painelHud.vidaTextoEl.textContent = `${vidaAtual}/${estado.farol.vidaMax}`
      painelHud.vidaBarraEl.style.width = `${(vidaAtual / estado.farol.vidaMax) * 100}%`
      painelHud.pontuacaoTextoEl.textContent = estado.pontuacao
      painelHud.ondaTextoEl.textContent = textoDaOnda(estado.ondas)
      atualizarPipsOnda(painelHud, estado.ondas, estado.bossCriado)

      const bossEmCampo = buscarAtivo(estado.inimigos, (inimigo) => inimigo.tipoId === 'boss')
      painelHud.ondaEl.classList.toggle('com-boss', bossEmCampo !== null)
      if (bossEmCampo) {
        painelHud.bossBarraEl.style.width = `${(bossEmCampo.vida / bossEmCampo.vidaMax) * 100}%`
      }

      if (painelDebug) {
        quadros++
        tempoAcumuladoDebug += dt
        if (tempoAcumuladoDebug >= 0.25) {
          const fps = Math.round(quadros / tempoAcumuladoDebug)
          painelDebug.textContent = `${fps} fps · inimigos: ${estado.inimigos.quantidade} · projéteis: ${estado.projeteis.quantidade}`
          quadros = 0
          tempoAcumuladoDebug = 0
        }
      }

      if (bossDerrotado) {
        estado.pausado = true
        telaGameOver.mostrar(estado.pontuacao, true)
      } else if (!estaViva(estado.farol)) {
        estado.pausado = true
        telaGameOver.mostrar(estado.pontuacao)
      }
    }

    // sempre limpa, mesmo pausado — senão a fila de cliques cresceria sem
    // limite se o jogador ficar clicando na tela de fim de jogo
    entrada.limparCliques()
  }

  function desenhar() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    renderizador.iniciarQuadro(projecao)

    // ordem = profundidade (algoritmo do pintor, aula 5). mar e ilha são
    // "chão": sempre no fundo. inimigos ficam numa camada fixa, abaixo do
    // farol/barco — simplificação consciente, suficiente para o TP1.
    const noite = estado.bossCriado
    renderizador.desenharRegiao(
      mar, 0, 0, LARGURA_MUNDO, ALTURA_MUNDO,
      0, UV_IMAGEM_INTEIRA, noite ? COR_MAR_NOITE : COR_BRANCA
    )
    renderizador.desenharRegiao(
      noite ? ilhaNoiteTex : ilhaTex, ILHA.x, ILHA.y, TAMANHO_ILHA.largura, TAMANHO_ILHA.altura,
      0, UV_IMAGEM_INTEIRA, COR_BRANCA
    )

    const boss = buscarAtivo(estado.inimigos, (inimigo) => inimigo.tipoId === 'boss')
    if (boss) {
      const caminho = caminhoDoBoss()
      caminho.slice(0, -1).forEach((ponto, indice) => {
        const proximo = caminho[indice + 1]
        const x = (ponto.x + proximo.x) / 2
        const y = (ponto.y + proximo.y) / 2
        const largura = Math.hypot(proximo.x - ponto.x, proximo.y - ponto.y) * 0.42
        const rotacao = Math.atan2(proximo.y - ponto.y, proximo.x - ponto.x)
        renderizador.desenharRegiao(
          projetilTex, x, y, largura, 5, rotacao,
          UV_IMAGEM_INTEIRA, COR_CAMINHO_BOSS
        )
      })
    }

    paraCadaAtivo(estado.inimigos, (inimigo) => {
      const tamanho = TAMANHO_INIMIGO_BASE * inimigo.escala
      const textura = texturasInimigos[inimigo.tipoId]
      const proporcao = textura.largura / textura.altura
      const larguraBase = proporcao >= 1 ? tamanho : tamanho * proporcao
      const altura = proporcao >= 1 ? tamanho / proporcao : tamanho
      const largura = inimigo.x > estado.farol.x ? -larguraBase : larguraBase
      const cor = inimigo.flashRestante > 0 ? COR_FLASH_INIMIGO : inimigo.cor
      if (inimigo.tipoId === 'boss') {
        renderizador.desenharRegiao(
          textura, inimigo.x, inimigo.y, largura * 1.45, altura * 1.45,
          0, UV_IMAGEM_INTEIRA, COR_BRILHO_BOSS
        )
      }
      renderizador.desenharRegiao(
        textura, inimigo.x, inimigo.y, largura, altura,
        0, UV_IMAGEM_INTEIRA, cor
      )
    })

    function desenharFarolEFeixe() {
      renderizador.desenhar(farolTex, POSICAO_FAROL_VISUAL.x, POSICAO_FAROL_VISUAL.y, TAMANHO_FAROL.largura, TAMANHO_FAROL.altura)
      const angulo = estado.farol.anguloLuz
      if (noite) {
        renderizador.usarMisturaAditiva(true)
        renderizador.desenharRegiao(
          feixe, FAROL_LAMPADA.x, FAROL_LAMPADA.y, TAMANHO_FEIXE.largura * LARGURA_HALO_FEIXE, TAMANHO_FEIXE.altura,
          angulo, UV_IMAGEM_INTEIRA, COR_FEIXE_NOITE_HALO
        )
        renderizador.desenharRegiao(
          feixe, FAROL_LAMPADA.x, FAROL_LAMPADA.y, TAMANHO_FEIXE.largura, TAMANHO_FEIXE.altura,
          angulo, UV_IMAGEM_INTEIRA, COR_FEIXE_NOITE_NUCLEO
        )
        renderizador.usarMisturaAditiva(false)
      } else {
        renderizador.desenharRegiao(
          feixe, FAROL_LAMPADA.x, FAROL_LAMPADA.y, TAMANHO_FEIXE.largura, TAMANHO_FEIXE.altura,
          angulo, UV_IMAGEM_INTEIRA, COR_FEIXE
        )
      }
    }
    function desenharBarco() {
      const { x, y, direcao, stunRestante } = estado.barco
      const largura = TAMANHO_BARCO.largura * direcao
      const atordoado = stunRestante > 0
      if (atordoado) {
        // aura verde do poder do Holandês, pulsando suave (sem piscar seco);
        // aditiva pra "brilhar" por cima do mar em vez de só manchar de verde
        const pulso = 0.7 + 0.3 * Math.sin(stunRestante * 14)
        COR_TEMP[0] = COR_AURA_ATORDOADO[0]
        COR_TEMP[1] = COR_AURA_ATORDOADO[1]
        COR_TEMP[2] = COR_AURA_ATORDOADO[2]
        COR_TEMP[3] = COR_AURA_ATORDOADO[3] * pulso
        renderizador.usarMisturaAditiva(true)
        renderizador.desenharRegiao(
          barcoTex, x, y,
          largura * ESCALA_AURA_ATORDOADO, TAMANHO_BARCO.altura * ESCALA_AURA_ATORDOADO,
          0, UV_IMAGEM_INTEIRA, COR_TEMP
        )
        renderizador.usarMisturaAditiva(false)
      }
      renderizador.desenharRegiao(
        barcoTex, x, y, largura, TAMANHO_BARCO.altura,
        0, UV_IMAGEM_INTEIRA, atordoado ? COR_BARCO_ATORDOADO : COR_BRANCA
      )
    }

    // o barco passa atrás do farol quando está mais ao norte que a base da torre
    if (estado.barco.y > FAROL_BASE_Y) {
      desenharBarco()
      desenharFarolEFeixe()
    } else {
      desenharFarolEFeixe()
      desenharBarco()
    }

    paraCadaAtivo(estado.projeteis, (projetil) => {
      let escala = 1
      let alfaExtra = 1

      if (projetil.estadoAnimacao === 'disparo') {
        // cresce de ESCALA_INICIAL_DISPARO até o tamanho normal (1), suavizado
        const progresso = suavizarSaida(1 - projetil.tempoAnimacao / DURACAO_DISPARO)
        escala = ESCALA_INICIAL_DISPARO + (1 - ESCALA_INICIAL_DISPARO) * progresso
      } else if (projetil.estadoAnimacao === 'impacto') {
        const progresso = 1 - projetil.tempoAnimacao / DURACAO_IMPACTO
        // cresce rápido até ~40% da duração (a "explosão" propriamente dita)...
        const crescimento = suavizarSaida(Math.min(progresso / 0.4, 1))
        escala = 1 + (ESCALA_IMPACTO - 1) * crescimento
        // ...e desvanece nos últimos 40%, em vez de sumir seco de uma vez
        alfaExtra = 1 - Math.max(0, (progresso - 0.6) / 0.4)
      }

      // aponta pra direção do voo (a arte já nasce "olhando" pra +x); parado
      // no estado 'impacto' isso mantém a última direção, o que é o esperado
      const rotacao = Math.atan2(projetil.vy, projetil.vx)
      const corBase = projetil.cor || COR_BRANCA
      COR_TEMP[0] = corBase[0]
      COR_TEMP[1] = corBase[1]
      COR_TEMP[2] = corBase[2]
      COR_TEMP[3] = corBase[3] * alfaExtra
      renderizador.desenharRegiao(
        projeteisTex, projetil.x, projetil.y,
        LARGURA_PROJETIL * escala, ALTURA_PROJETIL * escala,
        rotacao, uvProjetil(projetil.categoria, projetil.estadoAnimacao), COR_TEMP
      )
    })

    // barras de vida por último, pra nada (farol, barco, tiros) ficar por cima delas
    paraCadaAtivo(estado.inimigos, (inimigo) => {
      if (inimigo.tipoId === 'boss' || inimigo.vida >= inimigo.vidaMax) return

      const tamanho = TAMANHO_INIMIGO_BASE * inimigo.escala
      const textura = texturasInimigos[inimigo.tipoId]
      const proporcao = textura.largura / textura.altura
      const alturaSprite = proporcao >= 1 ? tamanho / proporcao : tamanho
      const larguraBarra = tamanho * LARGURA_BARRA_VIDA
      const y = inimigo.y + alturaSprite * 0.45 + ALTURA_BARRA_VIDA
      const fracao = inimigo.vida / inimigo.vidaMax

      renderizador.desenharRegiao(
        brancoTex, inimigo.x, y, larguraBarra + 2, ALTURA_BARRA_VIDA + 2,
        0, UV_IMAGEM_INTEIRA, COR_BARRA_FUNDO
      )
      // a cor vai de verde (cheia) a vermelho (quase morto)
      for (let i = 0; i < 3; i++) {
        COR_TEMP[i] = COR_VIDA_BAIXA[i] + (COR_VIDA_CHEIA[i] - COR_VIDA_BAIXA[i]) * fracao
      }
      COR_TEMP[3] = 1
      const larguraVida = larguraBarra * fracao
      renderizador.desenharRegiao(
        brancoTex, inimigo.x - larguraBarra / 2 + larguraVida / 2, y, larguraVida, ALTURA_BARRA_VIDA,
        0, UV_IMAGEM_INTEIRA, COR_TEMP
      )
    })
  }

  iniciarLoop(atualizar, desenhar)
}

main().catch((erro) => {
  console.error(erro)
  mostrarErro(`Não foi possível iniciar o jogo:\n${erro.message}`)
})
