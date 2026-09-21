import { ortho } from './matriz.js'

// O MUNDO do jogo tem tamanho fixo, independente do tamanho da janela.
// A origem (0, 0) fica no CENTRO da tela (onde está o farol), com o eixo X
// para a direita e o eixo Y para CIMA:
//
//        (-640, 360) ┌───────────┬───────────┐ (640, 360)
//                    │           │           │
//                    │        (0, 0)         │
//                    │           │           │
//       (-640, -360) └───────────┴───────────┘ (640, -360)
export const LARGURA_MUNDO = 1280
export const ALTURA_MUNDO = 720

// Buffer de desenho nunca passa disso (largura em pixels): telas 4K não
// precisam de 8 milhões de pixels para um jogo 2D, e o preenchimento com
// blending é o que mais pesa quando há muitos sprites.
const LARGURA_MAXIMA_BUFFER = 1920

/** Matriz de projeção: o retângulo do mundo inteiro cabe exatamente na tela. */
export function criarProjecao() {
  return ortho(
    -LARGURA_MUNDO / 2, LARGURA_MUNDO / 2,
    -ALTURA_MUNDO / 2, ALTURA_MUNDO / 2,
    -1, 1
  )
}

/**
 * Faz o buffer de desenho do canvas acompanhar o tamanho em que ele aparece
 * na tela (respeitando telas de alta densidade) e ajusta o viewport.
 * O CSS (#jogo) já garante a proporção 16:9, então o viewport ocupa o canvas todo.
 */
export function ajustarCanvas(gl) {
  const canvas = gl.canvas
  const escala = Math.min(
    window.devicePixelRatio || 1,
    LARGURA_MAXIMA_BUFFER / canvas.clientWidth
  )
  const largura = Math.max(1, Math.round(canvas.clientWidth * escala))
  const altura = Math.max(1, Math.round(canvas.clientHeight * escala))

  // só mexe se mudou: atribuir canvas.width limpa o buffer e é custoso
  if (canvas.width !== largura || canvas.height !== altura) {
    canvas.width = largura
    canvas.height = altura
  }
  gl.viewport(0, 0, canvas.width, canvas.height)
}

/** Ajusta agora e sempre que o canvas mudar de tamanho na tela. */
export function observarTamanho(gl) {
  ajustarCanvas(gl)
  new ResizeObserver(() => ajustarCanvas(gl)).observe(gl.canvas)
}

/**
 * Converte a posição do mouse (pixels da janela, origem no canto superior
 * esquerdo, Y para baixo) para coordenadas do mundo (origem no centro, Y para
 * cima). Escreve em `saida` ({x, y}) para não alocar objetos a cada evento.
 *
 * `retangulo` é o canvas.getBoundingClientRect(): onde o canvas está na janela.
 */
export function pixelParaMundo(clientX, clientY, retangulo, saida) {
  const nx = (clientX - retangulo.left) / retangulo.width   // 0..1 da esquerda p/ direita
  const ny = (clientY - retangulo.top) / retangulo.height   // 0..1 de cima p/ baixo
  saida.x = (nx - 0.5) * LARGURA_MUNDO
  saida.y = (0.5 - ny) * ALTURA_MUNDO                       // inverte o Y
  return saida
}
