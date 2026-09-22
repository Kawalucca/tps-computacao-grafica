import { criarEntidade, causarDano, estaViva, estaoColidindo } from './entidade.js'

export const PROJETIL_RAIO = 6
const VELOCIDADE_PADRAO = 420 // unidades do mundo por segundo
const DURACAO_MAXIMA_PADRAO = 3 // segundos; evita "projétil fantasma" se o alvo morrer no meio do caminho

/**
 * Projétil genérico, usado tanto pelo farol quanto pelo barco: nasce em
 * (x, y), mira no `alvo` NO INSTANTE DO DISPARO e viaja em linha reta —
 * não persegue depois de lançado (isso é o suficiente para o TP1).
 *
 * `dano` e `aoAcertar` ficam guardados no PRÓPRIO projétil, em vez de fixos
 * no código, de propósito: mais para frente (Holandês Voador) vamos ter um
 * míssil teleguiado, que persegue o barco por alguns segundos e, ao acertar,
 * atordoa em vez de causar dano. Esse projétil "especial" vai reaproveitar
 * atualizarProjetil/verificarImpacto passando um `aoAcertar` diferente (e,
 * futuramente, um jeito de recalcular vx/vy a cada quadro em vez de manter
 * fixo) — sem precisar duplicar ou reescrever este módulo.
 */
export function criarProjetil({
  x, y, alvo, dano,
  velocidade = VELOCIDADE_PADRAO,
  duracaoMaxima = DURACAO_MAXIMA_PADRAO,
  aoAcertar = causarDano,
  cor = null // opcional, só para o desenho tingir o sprite (ex.: azul = farol, amarelo = barco)
}) {
  const dx = alvo.x - x
  const dy = alvo.y - y
  const distancia = Math.hypot(dx, dy) || 1 // nasceu em cima do alvo: evita divisão por zero

  return {
    ...criarEntidade({ x, y, raio: PROJETIL_RAIO, vida: 1 }),
    vx: (dx / distancia) * velocidade,
    vy: (dy / distancia) * velocidade,
    dano,
    aoAcertar,
    alvo,
    duracaoMaxima,
    tempoDeVoo: 0,
    cor
  }
}

export function atualizarProjetil(projetil, dt) {
  projetil.x += projetil.vx * dt
  projetil.y += projetil.vy * dt

  projetil.tempoDeVoo += dt
  if (projetil.tempoDeVoo >= projetil.duracaoMaxima) {
    projetil.vida = 0 // expira sem ter acertado nada (ex.: o alvo já tinha morrido)
  }
}

/**
 * Se o projétil colidiu com o alvo, aplica o efeito dele (`aoAcertar`) e
 * "mata" o projétil (para quem gerencia o pool removê-lo). Devolve true se
 * acertou.
 */
export function verificarImpacto(projetil, alvo) {
  if (!estaViva(projetil) || !estaViva(alvo)) return false
  if (!estaoColidindo(projetil, alvo)) return false

  projetil.aoAcertar(alvo, projetil.dano)
  projetil.vida = 0
  return true
}
