import { criarContexto, carregarPrograma } from './engine/gl.js'
import { iniciarLoop } from './engine/loop.js'
import { LARGURA_MUNDO, ALTURA_MUNDO, criarProjecao, observarTamanho } from './engine/mundo.js'
import { carregarTextura } from './engine/textura.js'
import { RenderizadorSprites } from './engine/renderizador-sprites.js'
import { criarEntrada } from './engine/entrada.js'

// FASE 1 — cena de teste do motor.
// Não é o jogo ainda: serve para conferir, a olho, que cada peça funciona.
// O que você deve ver:
//   - 4 quadrados nos cantos, cada um de uma cor (testa o ortho e o tint)
//   - um sprite no centro girando anti-horário (testa dt e a matriz de modelo)
//   - um sprite seguindo o mouse, semitransparente (testa pixel -> mundo e alpha)
//   - um marcador amarelo que aparece onde você clica e some em ~0,6 s
//   - a letra F sempre "em pé" e o ponto vermelho no canto superior esquerdo
//     (se estiver de cabeça para baixo, a textura está invertida)
// Na Fase 3 este arquivo passa a montar o jogo de verdade.

const canvas = document.querySelector('#tela-webgl')
const hud = document.querySelector('#hud')

const VELOCIDADE_GIRO = Math.PI / 2 // radianos por segundo (90°/s)
const DURACAO_MARCADOR = 0.6        // segundos
const TAMANHO_CANTO = 96

// Arrays criados uma única vez; o desenho só lê (ou altera no lugar) e nunca aloca
const UV_IMAGEM_INTEIRA = new Float32Array([0, 0, 1, 1])
const CANTOS = [
  { x: -1, y: 1, cor: new Float32Array([1.0, 0.35, 0.35, 1]) }, // superior esquerdo
  { x: 1, y: 1, cor: new Float32Array([0.35, 1.0, 0.35, 1]) },  // superior direito
  { x: -1, y: -1, cor: new Float32Array([0.4, 0.6, 1.0, 1]) },  // inferior esquerdo
  { x: 1, y: -1, cor: new Float32Array([1.0, 0.9, 0.3, 1]) }    // inferior direito
].map((canto) => ({
  // posição do centro do quadrado, encostado no canto do mundo
  x: canto.x * (LARGURA_MUNDO / 2 - TAMANHO_CANTO / 2),
  y: canto.y * (ALTURA_MUNDO / 2 - TAMANHO_CANTO / 2),
  cor: canto.cor
}))
const COR_SEGUIDOR = new Float32Array([1, 1, 1, 0.8])
const COR_MARCADOR = new Float32Array([1, 0.9, 0.2, 1])

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

  // baixa os shaders (.glsl) e a imagem antes de começar o loop
  const programa = await carregarPrograma(gl, 'shaders/sprite.vert.glsl', 'shaders/sprite.frag.glsl')
  const texturaTeste = await carregarTextura(gl, 'assets/images/teste.png')

  const renderizador = new RenderizadorSprites(gl, programa)
  const entrada = criarEntrada(canvas)
  const projecao = criarProjecao()
  const painel = criarPainelDebug()

  gl.clearColor(0.09, 0.36, 0.52, 1) // azul-mar

  // estado da cena (a função de desenho só LÊ isto)
  const estado = {
    angulo: 0,
    marcador: { x: 0, y: 0, restante: 0 }
  }

  // medição de fps para o painel de debug
  let quadros = 0
  let tempoAcumulado = 0

  function atualizar(dt) {
    estado.angulo += VELOCIDADE_GIRO * dt

    for (const clique of entrada.cliques) {
      estado.marcador.x = clique.x
      estado.marcador.y = clique.y
      estado.marcador.restante = DURACAO_MARCADOR
    }
    entrada.limparCliques()
    estado.marcador.restante = Math.max(0, estado.marcador.restante - dt)

    // atualiza o texto do painel ~4 vezes por segundo (mexer no DOM todo quadro é caro)
    quadros++
    tempoAcumulado += dt
    if (tempoAcumulado >= 0.25) {
      const fps = Math.round(quadros / tempoAcumulado)
      const { x, y } = entrada.mouse
      painel.textContent = `${fps} fps · mouse no mundo: (${Math.round(x)}, ${Math.round(y)})`
      quadros = 0
      tempoAcumulado = 0
    }
  }

  function desenhar() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    renderizador.iniciarQuadro(projecao)

    // ordem de desenho = ordem de profundidade (algoritmo do pintor, aula 5):
    // o que é desenhado por último fica na frente

    // 1) quadrados coloridos nos cantos do mundo
    for (const canto of CANTOS) {
      renderizador.desenharRegiao(
        texturaTeste, canto.x, canto.y, TAMANHO_CANTO, TAMANHO_CANTO, 0, UV_IMAGEM_INTEIRA, canto.cor
      )
    }

    // 2) sprite central girando
    renderizador.desenhar(texturaTeste, 0, 0, 192, 192, estado.angulo)

    // 3) sprite que segue o mouse
    if (entrada.mouse.dentro) {
      renderizador.desenharRegiao(
        texturaTeste, entrada.mouse.x, entrada.mouse.y, 96, 96, 0, UV_IMAGEM_INTEIRA, COR_SEGUIDOR
      )
    }

    // 4) marcador do último clique, sumindo aos poucos
    if (estado.marcador.restante > 0) {
      COR_MARCADOR[3] = estado.marcador.restante / DURACAO_MARCADOR
      renderizador.desenharRegiao(
        texturaTeste, estado.marcador.x, estado.marcador.y, 48, 48, 0, UV_IMAGEM_INTEIRA, COR_MARCADOR
      )
    }
  }

  iniciarLoop(atualizar, desenhar)
}

main().catch((erro) => {
  console.error(erro)
  mostrarErro(`Não foi possível iniciar o jogo:\n${erro.message}`)
})
