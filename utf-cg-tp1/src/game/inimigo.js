import { criarEntidade, causarDano } from './entidade.js'
import { ILHA } from './ilha.js'
import { LARGURA_MUNDO, ALTURA_MUNDO } from '../engine/mundo.js'

// Cada tipo usa uma imagem própria. O tamanho (`escala`) também muda por
// tipo, então a silhueta na tela acompanha a dificuldade do inimigo.
export const TIPOS_INIMIGO = {
  // rápido e frágil: pressiona o jogador a reagir rápido, mas morre fácil
  batedor: {
    vida: 18, velocidade: 100, danoContato: 9,
    raioBase: 16, escala: 1,
    cor: new Float32Array([1, 1, 1, 1])
  },
  // o "meio-termo": era o único tipo que existia até a Fase 3
  padrao: {
    vida: 30, velocidade: 60, danoContato: 12,
    raioBase: 22, escala: 1.2,
    cor: new Float32Array([1, 1, 1, 1])
  },
  // lento e resistente: obriga a concentrar fogo, é perigoso se ignorado
  brutamontes: {
    vida: 60, velocidade: 35, danoContato: 20,
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
 * Navega em direção à ilha do farol e para na borda dela (o mesmo círculo que
 * já bloqueia o barco do jogador — um navio não sobe nas rochas). Parado ali,
 * ataca o farol com dano contínuo enquanto continuar na costa.
 */
export function atualizarInimigo(inimigo, farol, dt) {
  inimigo.flashRestante = Math.max(0, inimigo.flashRestante - dt)

  const dx = ILHA.x - inimigo.x
  const dy = ILHA.y - inimigo.y
  const distancia = Math.hypot(dx, dy)
  const distanciaDaCosta = ILHA.raio + inimigo.raio
  const passo = inimigo.velocidade * dt

  if (distancia - passo > distanciaDaCosta) {
    inimigo.x += (dx / distancia) * passo
    inimigo.y += (dy / distancia) * passo
  } else {
    // encosta exatamente na borda (sem ultrapassar nem num quadro com dt grande)
    const fator = distanciaDaCosta / distancia
    inimigo.x = ILHA.x - dx * fator
    inimigo.y = ILHA.y - dy * fator
    causarDano(farol, inimigo.danoContato * dt)
  }
}
