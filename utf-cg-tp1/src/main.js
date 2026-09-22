import { criarContexto, carregarPrograma } from './engine/gl.js'
import { iniciarLoop } from './engine/loop.js'
import { LARGURA_MUNDO, ALTURA_MUNDO, criarProjecao, observarTamanho } from './engine/mundo.js'
import { carregarTextura } from './engine/textura.js'
import { RenderizadorSprites } from './engine/renderizador-sprites.js'
import { criarEntrada } from './engine/entrada.js'
import { criarPool, adicionar, removerMortos, paraCadaAtivo, buscarAtivo } from './engine/pool.js'
import { estaViva, afastarDeObstaculo, causarDano, contemPonto } from './game/entidade.js'
import { criarFarol, atualizarFarol, FAROL_LAMPADA } from './game/farol.js'
import { criarBarco, atualizarBarco } from './game/barco.js'
import { ILHA } from './game/ilha.js'
import { criarInimigo, atualizarInimigo } from './game/inimigo.js'
import { atualizarProjetil, verificarImpacto } from './game/projetil.js'
import { criarAtirador, atualizarAtirador } from './game/ataque.js'
import { calcularIntervaloSpawn } from './game/dificuldade.js'

// MVP completo: cenário + inimigos + farol/barco atirando (commits
// anteriores) + dedada, pontuação, HUD, game over/reinício e dificuldade
// crescente (este commit). É o jogo com todos os obrigatórios do enunciado.
// Waves de verdade, tipos de inimigo, sons e telas de menu ficam para as
// próximas fases, construídas em cima do que está aqui.

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
const COR_FEIXE = new Float32Array([1, 0.97, 0.82, 0.22]) // sutil de dia; mais forte à noite (Fase 6)
const TAMANHO_BARCO = { largura: 64, altura: 64 }

// ---- inimigos e projéteis ----
const CAPACIDADE_INIMIGOS = 60
const CAPACIDADE_PROJETEIS = 80
const TAMANHO_INIMIGO = 56
const TAMANHO_PROJETIL = 18
const COR_PROJETIL_FAROL = new Float32Array([0.65, 0.85, 1, 1]) // azul clarinho
const COR_PROJETIL_BARCO = new Float32Array([1, 0.85, 0.3, 1]) // amarelo

// ---- regras de jogo ----
const DANO_DEDADA = 15
const PONTOS_POR_INIMIGO = 10

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

/** HUD "de verdade": vida do farol e pontuação, sempre visíveis. */
function criarHud() {
  const vidaEl = document.createElement('div')
  vidaEl.className = 'hud-vida'

  const pontuacaoEl = document.createElement('div')
  pontuacaoEl.className = 'hud-pontuacao'

  hud.append(vidaEl)
  hud.append(pontuacaoEl)

  return { vidaEl, pontuacaoEl }
}

/**
 * Tela de "fim de jogo" (HTML sobreposto, nunca `window.alert`). Criada UMA
 * vez; `mostrar`/`esconder` só alternam a visibilidade, sem recriar o DOM.
 */
function criarTelaGameOver(aoReiniciar) {
  const tela = document.createElement('div')
  tela.className = 'tela-game-over'
  tela.style.display = 'none'

  const titulo = document.createElement('h2')
  titulo.textContent = 'Fim de jogo'

  const pontuacaoFinalEl = document.createElement('p')

  const botao = document.createElement('button')
  botao.textContent = 'Jogar novamente'
  botao.addEventListener('click', aoReiniciar)

  tela.append(titulo)
  tela.append(pontuacaoFinalEl)
  tela.append(botao)
  hud.append(tela)

  return {
    mostrar(pontuacao) {
      pontuacaoFinalEl.textContent = `Pontuação final: ${pontuacao}`
      tela.style.display = 'flex'
    },
    esconder() {
      tela.style.display = 'none'
    }
  }
}

/**
 * Todo o estado que muda durante uma partida, num único objeto — para
 * reiniciar o jogo ser só "trocar esse objeto por um novo" (função
 * `reiniciar` dentro de `main`), sem esquecer nenhum pedaço de estado solto.
 */
function criarEstadoJogo() {
  return {
    farol: criarFarol(),
    barco: criarBarco(),
    inimigos: criarPool(CAPACIDADE_INIMIGOS),
    projeteis: criarPool(CAPACIDADE_PROJETEIS),
    atiradorFarol: criarAtirador({ alcance: 260, cadencia: 0.8, dano: 12, velocidadeProjetil: 500, cor: COR_PROJETIL_FAROL }),
    atiradorBarco: criarAtirador({ alcance: 140, cadencia: 0.5, dano: 8, velocidadeProjetil: 600, cor: COR_PROJETIL_BARCO }),
    pontuacao: 0,
    tempoDecorrido: 0, // usado pela dificuldade crescente (calcularIntervaloSpawn)
    cronometroSpawn: 0,
    pausado: false // true = fim de jogo: atualizar() para de simular, mas o desenho continua (última cena "congelada")
  }
}

async function main() {
  const gl = criarContexto(canvas)
  observarTamanho(gl)

  const programa = await carregarPrograma(gl, 'shaders/sprite.vert.glsl', 'shaders/sprite.frag.glsl')

  const [mar, ilhaTex, farolTex, feixe, barcoTex, inimigoTex, projetilTex] = await Promise.all([
    carregarTextura(gl, 'assets/images/mar.png', { mipmap: true }),
    carregarTextura(gl, 'assets/images/ilha.png'),
    carregarTextura(gl, 'assets/images/farol.png'),
    carregarTextura(gl, 'assets/images/feixe.png'),
    carregarTextura(gl, 'assets/images/barco.png'),
    carregarTextura(gl, 'assets/images/inimigo.png'),
    carregarTextura(gl, 'assets/images/projetil.png')
  ])

  const renderizador = new RenderizadorSprites(gl, programa)
  const entrada = criarEntrada(canvas)
  const projecao = criarProjecao()
  const painelHud = criarHud()
  const painelDebug = MOSTRAR_DEBUG ? criarPainelDebug() : null

  gl.clearColor(0.09, 0.36, 0.52, 1)

  let estado = criarEstadoJogo()

  const telaGameOver = criarTelaGameOver(() => {
    estado = criarEstadoJogo()
    telaGameOver.esconder()
  })

  let quadros = 0
  let tempoAcumuladoDebug = 0

  function atualizar(dt) {
    if (!estado.pausado) {
      atualizarFarol(estado.farol, dt)
      atualizarBarco(estado.barco, entrada.mouse, dt)
      afastarDeObstaculo(estado.barco, ILHA) // impede o barco de entrar na ilha

      // dedada: cada clique causa dano ao primeiro inimigo atingido (se houver)
      for (const clique of entrada.cliques) {
        const alvo = buscarAtivo(estado.inimigos, (inimigo) => contemPonto(inimigo, clique.x, clique.y))
        if (alvo) causarDano(alvo, DANO_DEDADA)
      }

      // dificuldade crescente: o intervalo até o próximo spawn encolhe com o tempo de jogo
      estado.tempoDecorrido += dt
      estado.cronometroSpawn -= dt
      if (estado.cronometroSpawn <= 0) {
        adicionar(estado.inimigos, criarInimigo())
        estado.cronometroSpawn = calcularIntervaloSpawn(estado.tempoDecorrido)
      }

      // inimigos: andam até o farol e, encostados, causam dano contínuo nele
      paraCadaAtivo(estado.inimigos, (inimigo) => atualizarInimigo(inimigo, estado.farol, dt))

      // farol e barco: cada um mira e atira sozinho no inimigo mais próximo
      atualizarAtirador(estado.atiradorFarol, estado.farol, estado.inimigos, estado.projeteis, dt)
      atualizarAtirador(estado.atiradorBarco, estado.barco, estado.inimigos, estado.projeteis, dt)

      // projéteis: voam e, ao colidir com QUALQUER inimigo vivo (não só o que
      // miravam ao nascer — ele pode ter morrido nesse meio-tempo), causam dano
      paraCadaAtivo(estado.projeteis, (projetil) => {
        atualizarProjetil(projetil, dt)
        paraCadaAtivo(estado.inimigos, (inimigo) => {
          if (estaViva(projetil)) verificarImpacto(projetil, inimigo)
        })
      })

      // pontuação: soma ANTES de remover quem morreu nesta rodada (tiro ou dedada)
      paraCadaAtivo(estado.inimigos, (inimigo) => {
        if (!estaViva(inimigo)) estado.pontuacao += PONTOS_POR_INIMIGO
      })

      removerMortos(estado.projeteis, estaViva)
      removerMortos(estado.inimigos, estaViva)

      painelHud.vidaEl.textContent = `Vida do farol: ${Math.max(0, Math.ceil(estado.farol.vida))}/${estado.farol.vidaMax}`
      painelHud.pontuacaoEl.textContent = `Pontuação: ${estado.pontuacao}`

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

      if (!estaViva(estado.farol)) {
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
    renderizador.desenhar(mar, 0, 0, LARGURA_MUNDO, ALTURA_MUNDO)
    renderizador.desenhar(ilhaTex, ILHA.x, ILHA.y, TAMANHO_ILHA.largura, TAMANHO_ILHA.altura)

    paraCadaAtivo(estado.inimigos, (inimigo) => {
      renderizador.desenhar(inimigoTex, inimigo.x, inimigo.y, TAMANHO_INIMIGO, TAMANHO_INIMIGO)
    })

    function desenharFarolEFeixe() {
      renderizador.desenhar(farolTex, POSICAO_FAROL_VISUAL.x, POSICAO_FAROL_VISUAL.y, TAMANHO_FAROL.largura, TAMANHO_FAROL.altura)
      renderizador.desenharRegiao(
        feixe, FAROL_LAMPADA.x, FAROL_LAMPADA.y, TAMANHO_FEIXE.largura, TAMANHO_FEIXE.altura,
        estado.farol.anguloLuz, UV_IMAGEM_INTEIRA, COR_FEIXE
      )
    }
    function desenharBarco() {
      renderizador.desenhar(barcoTex, estado.barco.x, estado.barco.y, TAMANHO_BARCO.largura, TAMANHO_BARCO.altura)
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
      renderizador.desenharRegiao(
        projetilTex, projetil.x, projetil.y, TAMANHO_PROJETIL, TAMANHO_PROJETIL,
        0, UV_IMAGEM_INTEIRA, projetil.cor || COR_BRANCA
      )
    })
  }

  iniciarLoop(atualizar, desenhar)
}

main().catch((erro) => {
  console.error(erro)
  mostrarErro(`Não foi possível iniciar o jogo:\n${erro.message}`)
})
