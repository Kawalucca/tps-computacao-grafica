import { distanciaQuadrado } from './entidade.js'
import { criarProjetil } from './projetil.js'
import { adicionar, paraCadaAtivo } from '../engine/pool.js'

// Farol e barco atacam do mesmo jeito (acham o inimigo mais próximo dentro
// do alcance e atiram nele), só com números diferentes — por isso é um único
// módulo reaproveitado pelos dois, em vez de duas cópias quase iguais.

/**
 * @param {{alcance: number, cadencia: number, dano: number, velocidadeProjetil?: number}} opcoes
 *   cadencia: segundos de espera entre um tiro e o próximo.
 */
export function criarAtirador({ alcance, cadencia, dano, velocidadeProjetil, cor }) {
  return { alcance, cadencia, dano, velocidadeProjetil, cor, cronometro: 0 }
}

/** Inimigo vivo mais próximo de `origem`, dentro de `alcance` — ou null. */
function inimigoMaisProximo(origem, alcance, inimigos) {
  let maisProximo = null
  let menorDistanciaQuadrado = alcance * alcance // já começa no limite do alcance
  paraCadaAtivo(inimigos, (inimigo) => {
    const d = distanciaQuadrado(origem, inimigo)
    if (d <= menorDistanciaQuadrado) {
      menorDistanciaQuadrado = d
      maisProximo = inimigo
    }
  })
  return maisProximo
}

/**
 * Chame uma vez por quadro para cada atirador (farol, barco). Conta o tempo
 * até o próximo tiro; quando chega a zero E há um inimigo no alcance, cria
 * um projétil (na pool `projeteis`) e reinicia o cronômetro.
 */
export function atualizarAtirador(atirador, origem, inimigos, projeteis, dt) {
  atirador.cronometro -= dt
  if (atirador.cronometro > 0) return

  const alvo = inimigoMaisProximo(origem, atirador.alcance, inimigos)
  if (!alvo) return // esperando um alvo aparecer: não reinicia o cronômetro, atira assim que puder

  adicionar(projeteis, criarProjetil({
    x: origem.x,
    y: origem.y,
    alvo,
    dano: atirador.dano,
    velocidade: atirador.velocidadeProjetil,
    cor: atirador.cor
  }))
  atirador.cronometro = atirador.cadencia
}
