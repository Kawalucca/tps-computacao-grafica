// Loop principal do jogo (aula 6): a cada quadro, atualiza o ESTADO do jogo
// e depois desenha o estado atual.
//
// Diferenças em relação ao exemplo do slide:
//   - dt em SEGUNDOS (velocidade = unidades do mundo por segundo);
//   - dt limitado: se a aba ficar em segundo plano, o requestAnimationFrame
//     pausa; ao voltar, um dt gigante faria os inimigos "teleportarem".

const DT_MAXIMO = 0.05 // segundos (equivale a não simular abaixo de 20 fps)

/**
 * @param {(dt: number) => void} atualizar  altera o estado do jogo
 * @param {() => void} desenhar             desenha o estado atual
 */
export function iniciarLoop(atualizar, desenhar) {
  let anterior = null

  function quadro(agora) {
    // no primeiro quadro não há "anterior": dt = 0
    const dt = anterior === null ? 0 : Math.min((agora - anterior) / 1000, DT_MAXIMO)
    anterior = agora

    atualizar(dt)
    desenhar()

    requestAnimationFrame(quadro)
  }

  requestAnimationFrame(quadro)
}
