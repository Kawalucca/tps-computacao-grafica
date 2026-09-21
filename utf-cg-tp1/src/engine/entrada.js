import { pixelParaMundo } from './mundo.js'

/**
 * Entrada do mouse, já em coordenadas do MUNDO.
 *
 * O jogo NÃO reage dentro do evento: ele lê `mouse` e `cliques` durante o
 * atualizar() do loop. Assim, a lógica roda sempre na mesma ordem, uma vez
 * por quadro, e não no meio de um desenho.
 *
 *   entrada.mouse    -> { x, y, dentro } posição atual do cursor
 *   entrada.cliques  -> lista de { x, y } dos cliques desde o último quadro;
 *                       depois de tratá-los, chame entrada.limparCliques()
 */
export function criarEntrada(canvas) {
  const mouse = { x: 0, y: 0, dentro: false }
  const cliques = []

  canvas.addEventListener('pointermove', (evento) => {
    pixelParaMundo(evento.clientX, evento.clientY, canvas.getBoundingClientRect(), mouse)
    mouse.dentro = true
  })

  canvas.addEventListener('pointerleave', () => {
    mouse.dentro = false
  })

  canvas.addEventListener('pointerdown', (evento) => {
    if (evento.button !== 0) return // só botão esquerdo
    const clique = pixelParaMundo(evento.clientX, evento.clientY, canvas.getBoundingClientRect(), {})
    // em telas de toque não há "move" antes do toque: atualiza a posição também
    mouse.x = clique.x
    mouse.y = clique.y
    mouse.dentro = true
    cliques.push(clique)
  })

  return {
    mouse,
    cliques,
    limparCliques() {
      cliques.length = 0
    }
  }
}
