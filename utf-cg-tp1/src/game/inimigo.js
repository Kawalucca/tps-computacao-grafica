import { criarEntidade, causarDano } from './entidade.js'
import { LARGURA_MUNDO, ALTURA_MUNDO } from '../engine/mundo.js'

// Cada tipo usa uma imagem própria. O tamanho (`escala`) também muda por
// tipo, então a silhueta na tela acompanha a dificuldade do inimigo.
export const TIPOS_INIMIGO = {
  // rápido e frágil: pressiona o jogador a reagir rápido, mas morre fácil
  batedor: {
    vida: 14, velocidade: 100, danoContato: 8,
    raioBase: 16, escala: 0.75,
    cor: new Float32Array([1, 1, 1, 1])
  },
  // o "meio-termo": era o único tipo que existia até a Fase 3
  padrao: {
    vida: 24, velocidade: 60, danoContato: 12,
    raioBase: 22, escala: 1.2,
    cor: new Float32Array([1, 1, 1, 1])
  },
  // lento e resistente: obriga a concentrar fogo, é perigoso se ignorado
  brutamontes: {
    vida: 50, velocidade: 35, danoContato: 20,
    raioBase: 30, escala: 1.5,
    cor: new Float32Array([1, 1, 1, 1])
  }
}

// Raio de um círculo maior que a diagonal do mundo inteiro: nascer em um
// ponto aleatório desse círculo garante que o inimigo sempre aparece fora da
// área visível, vindo de qualquer direção — não precisa sortear "qual borda".
const MARGEM_SPAWN = 60
const RAIO_SPAWN = Math.hypot(LARGURA_MUNDO / 2, ALTURA_MUNDO / 2) + MARGEM_SPAWN

// Quanto tempo o inimigo "pisca" de branco ao tomar dano (tiro ou dedada) —
// sem isso, um dano que não mata na hora fica invisível para o jogador,
// já que não há barra de vida por inimigo.
export const FLASH_DURACAO = 0.12

/** @param {keyof typeof TIPOS_INIMIGO} tipoId */
export function criarInimigo(tipoId) {
  const tipo = TIPOS_INIMIGO[tipoId]
  const angulo = Math.random() * Math.PI * 2

  return {
    ...criarEntidade({
      x: Math.cos(angulo) * RAIO_SPAWN,
      y: Math.sin(angulo) * RAIO_SPAWN,
      raio: tipo.raioBase,
      vida: tipo.vida
    }),
    tipoId,
    velocidade: tipo.velocidade,
    danoContato: tipo.danoContato,
    escala: tipo.escala,
    cor: tipo.cor,
    flashRestante: 0 // > 0 enquanto estiver "piscando de branco" por ter tomado dano
  }
}

/**
 * Anda em direção ao farol; ao encostar, para de andar e passa a atacá-lo
 * (dano contínuo, não um golpe único) enquanto continuar encostado.
 */
export function atualizarInimigo(inimigo, farol, dt) {
  inimigo.flashRestante = Math.max(0, inimigo.flashRestante - dt)

  const dx = farol.x - inimigo.x
  const dy = farol.y - inimigo.y
  const distancia = Math.hypot(dx, dy)
  const alcance = farol.raio + inimigo.raio

  if (distancia > alcance) {
    inimigo.x += (dx / distancia) * inimigo.velocidade * dt
    inimigo.y += (dy / distancia) * inimigo.velocidade * dt
  } else {
    causarDano(farol, inimigo.danoContato * dt)
  }
}
