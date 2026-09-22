// Estrutura comum a QUALQUER objeto do jogo com vida e posição: farol, barco,
// inimigos (Fase 3) e projéteis (Fase 3). Mantém a lógica de dano e colisão
// em um único lugar, reaproveitada por todos eles.

/**
 * @param {{x?: number, y?: number, raio: number, vida?: number, vidaMax?: number}} opcoes
 *   raio: usado tanto para colisão (círculo x círculo) quanto para
 *         "alcance" (ex.: o farol atira em quem estiver dentro do seu raio, Fase 3).
 */
export function criarEntidade({ x = 0, y = 0, raio, vida = 1, vidaMax = vida }) {
  return { x, y, raio, vida, vidaMax }
}

export function estaViva(entidade) {
  return entidade.vida > 0
}

/** Nunca deixa a vida ficar negativa nem passar do máximo. */
export function causarDano(entidade, quantidade) {
  entidade.vida = Math.max(0, entidade.vida - quantidade)
}

export function curar(entidade, quantidade) {
  entidade.vida = Math.min(entidade.vidaMax, entidade.vida + quantidade)
}

/** Distância ao quadrado entre duas entidades (evita a raiz quadrada quando
 * só precisamos COMPARAR distâncias, como ao achar "o inimigo mais próximo"). */
export function distanciaQuadrado(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

/** Colisão círculo x círculo (o enunciado permite essa simplificação). */
export function estaoColidindo(a, b) {
  const raioSoma = a.raio + b.raio
  return distanciaQuadrado(a, b) <= raioSoma * raioSoma
}
