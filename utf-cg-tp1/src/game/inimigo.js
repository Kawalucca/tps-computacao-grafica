import { criarEntidade, causarDano } from './entidade.js'
import { LARGURA_MUNDO, ALTURA_MUNDO } from '../engine/mundo.js'

export const INIMIGO_RAIO = 22
export const INIMIGO_VIDA = 30 // ajustado para morrer em ~2-3 tiros do farol ou 1-2 cliques
const VELOCIDADE = 60          // unidades do mundo por segundo
const DANO_NO_FAROL = 12       // por SEGUNDO, enquanto o inimigo estiver encostado no farol

// Raio de um círculo maior que a diagonal do mundo inteiro: nascer em um
// ponto aleatório desse círculo garante que o inimigo sempre aparece fora da
// área visível, vindo de qualquer direção — não precisa sortear "qual borda".
const MARGEM_SPAWN = 60
const RAIO_SPAWN = Math.hypot(LARGURA_MUNDO / 2, ALTURA_MUNDO / 2) + MARGEM_SPAWN

export function criarInimigo() {
  const angulo = Math.random() * Math.PI * 2
  return criarEntidade({
    x: Math.cos(angulo) * RAIO_SPAWN,
    y: Math.sin(angulo) * RAIO_SPAWN,
    raio: INIMIGO_RAIO,
    vida: INIMIGO_VIDA
  })
}

/**
 * Anda em direção ao farol; ao encostar, para de andar e passa a atacá-lo
 * (dano contínuo, não um golpe único) enquanto continuar encostado.
 */
export function atualizarInimigo(inimigo, farol, dt) {
  const dx = farol.x - inimigo.x
  const dy = farol.y - inimigo.y
  const distancia = Math.hypot(dx, dy)
  const alcance = farol.raio + inimigo.raio

  if (distancia > alcance) {
    inimigo.x += (dx / distancia) * VELOCIDADE * dt
    inimigo.y += (dy / distancia) * VELOCIDADE * dt
  } else {
    causarDano(farol, DANO_NO_FAROL * dt)
  }
}
