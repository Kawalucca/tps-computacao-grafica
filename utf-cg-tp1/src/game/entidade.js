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

/** O ponto (x, y) está dentro do raio da entidade? Usado na "dedada" (clique do jogador). */
export function contemPonto(entidade, x, y) {
  const dx = entidade.x - x
  const dy = entidade.y - y
  return dx * dx + dy * dy <= entidade.raio * entidade.raio
}

/**
 * Empurra `entidade` para fora de `obstaculo` (círculo sólido, ex.: a ilha)
 * se estiverem colidindo, deixando-a "encostada" na borda.
 *
 * Diferente de causarDano/estaoColidindo: aqui a colisão BLOQUEIA o
 * movimento em vez de causar dano. Chamado depois de mover a entidade
 * (ex.: depois de atualizarBarco), então o efeito é o barco "deslizar"
 * ao redor do obstáculo em vez de atravessá-lo.
 */
export function afastarDeObstaculo(entidade, obstaculo) {
  const dx = entidade.x - obstaculo.x
  const dy = entidade.y - obstaculo.y
  const distanciaMinima = entidade.raio + obstaculo.raio
  const distanciaAtual = Math.hypot(dx, dy)

  if (distanciaAtual >= distanciaMinima) return // não está colidindo: nada a fazer

  if (distanciaAtual === 0) {
    // caso raríssimo (exatamente no mesmo ponto): empurra numa direção
    // qualquer, só para não dividir por zero
    entidade.y = obstaculo.y + distanciaMinima
    return
  }

  const fator = distanciaMinima / distanciaAtual
  entidade.x = obstaculo.x + dx * fator
  entidade.y = obstaculo.y + dy * fator
}
