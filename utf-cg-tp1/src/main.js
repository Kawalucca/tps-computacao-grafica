import { criarContexto, carregarPrograma } from './engine/gl.js'
import { iniciarLoop } from './engine/loop.js'
import { LARGURA_MUNDO, ALTURA_MUNDO, criarProjecao, observarTamanho } from './engine/mundo.js'
import { carregarTextura } from './engine/textura.js'
import { RenderizadorSprites } from './engine/renderizador-sprites.js'
import { criarEntrada } from './engine/entrada.js'
import { criarFarol, atualizarFarol, FAROL_LAMPADA } from './game/farol.js'
import { criarBarco, atualizarBarco } from './game/barco.js'

// Cena estática do jogo: mar, ilha, farol (com o feixe de luz girando) e o
// barco de patrulha seguindo o mouse. Ainda não há inimigos, ataque nem HUD
// "de verdade" — isso é a Fase 3, construída em cima do que está aqui.

const canvas = document.querySelector('#tela-webgl')
const hud = document.querySelector('#hud')

const UV_IMAGEM_INTEIRA = new Float32Array([0, 0, 1, 1])

// Todas as posições/tamanhos "de mundo" (unidades do jogo, não pixels de tela)
// ficam juntos aqui, fáceis de ajustar ao trocar os placeholders pela arte final.
const POSICAO_ILHA = { x: 0, y: -20 }
const TAMANHO_ILHA = { largura: 360, altura: 240 }

// O farol LÓGICO fica em (0,0) (ver farol.js), mas visualmente ele fica de pé
// sobre a ilha — por isso o desenho é deslocado para cima do centro do mundo.
const POSICAO_FAROL_VISUAL = { x: 0, y: 60 }
const TAMANHO_FAROL = { largura: 120, altura: 220 }

const TAMANHO_FEIXE = { largura: 90, altura: 640 }
// Sutil de dia (mais decorativo que funcional); a versão noturna, mais forte
// e talvez com mistura aditiva, é da Fase 6 — sem mudar nada além destes números.
const COR_FEIXE = new Float32Array([1, 0.97, 0.82, 0.22])

const TAMANHO_BARCO = { largura: 64, altura: 64 }

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

async function main() {
  const gl = criarContexto(canvas)
  observarTamanho(gl)

  const programa = await carregarPrograma(gl, 'shaders/sprite.vert.glsl', 'shaders/sprite.frag.glsl')

  // baixa as 5 texturas em paralelo, não uma de cada vez
  const [mar, ilha, farolTex, feixe, barcoTex] = await Promise.all([
    carregarTextura(gl, 'assets/images/mar.png', { mipmap: true }), // cobre o mundo todo: reduzir bem, então mipmap ajuda
    carregarTextura(gl, 'assets/images/ilha.png'),
    carregarTextura(gl, 'assets/images/farol.png'),
    carregarTextura(gl, 'assets/images/feixe.png'),
    carregarTextura(gl, 'assets/images/barco.png')
  ])

  const renderizador = new RenderizadorSprites(gl, programa)
  const entrada = criarEntrada(canvas)
  const projecao = criarProjecao()
  const painel = criarPainelDebug()

  gl.clearColor(0.09, 0.36, 0.52, 1) // azul-mar (mesma cor do mar.png, para não "piscar" nas bordas)

  const farol = criarFarol()
  const barco = criarBarco()

  // medição de fps para o painel de debug (útil até a Fase 3 ter HUD de verdade)
  let quadros = 0
  let tempoAcumulado = 0

  function atualizar(dt) {
    atualizarFarol(farol, dt)
    atualizarBarco(barco, entrada.mouse, dt)

    quadros++
    tempoAcumulado += dt
    if (tempoAcumulado >= 0.25) {
      const fps = Math.round(quadros / tempoAcumulado)
      painel.textContent = `${fps} fps · vida do farol: ${farol.vida}/${farol.vidaMax}`
      quadros = 0
      tempoAcumulado = 0
    }
  }

  function desenhar() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    renderizador.iniciarQuadro(projecao)

    // ordem = profundidade (algoritmo do pintor, aula 5): cada um cobre o anterior
    renderizador.desenhar(mar, 0, 0, LARGURA_MUNDO, ALTURA_MUNDO)
    renderizador.desenhar(ilha, POSICAO_ILHA.x, POSICAO_ILHA.y, TAMANHO_ILHA.largura, TAMANHO_ILHA.altura)
    renderizador.desenhar(farolTex, POSICAO_FAROL_VISUAL.x, POSICAO_FAROL_VISUAL.y, TAMANHO_FAROL.largura, TAMANHO_FAROL.altura)

    // o feixe gira em torno da lâmpada do farol: por isso o pivô de rotação
    // (o centro do sprite) fica exatamente sobre FAROL_LAMPADA, e a imagem
    // feixe.png só desenha o cone na metade de CIMA de si mesma
    renderizador.desenharRegiao(
      feixe, FAROL_LAMPADA.x, FAROL_LAMPADA.y, TAMANHO_FEIXE.largura, TAMANHO_FEIXE.altura,
      farol.anguloLuz, UV_IMAGEM_INTEIRA, COR_FEIXE
    )

    renderizador.desenhar(barcoTex, barco.x, barco.y, TAMANHO_BARCO.largura, TAMANHO_BARCO.altura)
  }

  iniciarLoop(atualizar, desenhar)
}

main().catch((erro) => {
  console.error(erro)
  mostrarErro(`Não foi possível iniciar o jogo:\n${erro.message}`)
})
