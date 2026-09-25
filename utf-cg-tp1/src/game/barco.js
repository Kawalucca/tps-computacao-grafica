import { criarEntidade } from './entidade.js'

export const BARCO_RAIO = 24

// Quanto MAIOR, mais "colado" no cursor; quanto MENOR, mais inércia/atraso.
const SUAVIZACAO = 10

export function criarBarco() {
  // começa perto do farol, como se estivesse ancorado ali no início
  return {
    ...criarEntidade({ x: 0, y: -140, raio: BARCO_RAIO, vida: 1 }),
    stunRestante: 0
  }
}

/**
 * Move o barco em direção ao mouse. Usa suavização EXPONENCIAL (em vez de,
 * por exemplo, `barco.x += (mouse.x - barco.x) * 0.1` direto) para o
 * movimento não depender do fps: a cada segundo, o barco sempre percorre a
 * mesma FRAÇÃO da distância que falta, não importa se o dt daquele quadro
 * foi grande ou pequeno.
 */
export function atualizarBarco(barco, mouse, dt) {
  barco.stunRestante = Math.max(0, barco.stunRestante - dt)
  if (barco.stunRestante > 0) return
  if (!mouse.dentro) return // mouse fora do jogo: o barco fica parado onde estava

  const fator = 1 - Math.exp(-SUAVIZACAO * dt)
  barco.x += (mouse.x - barco.x) * fator
  barco.y += (mouse.y - barco.y) * fator
}
