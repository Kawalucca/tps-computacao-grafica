// Pool de objetos com capacidade fixa — usada para inimigos e projéteis (e
// reaproveitável em qualquer jogo futuro, TP2/TP3 incluídos).
//
// Por quê: um jogo com dezenas de inimigos/projéteis nascendo e morrendo o
// tempo todo, se fizesse `array.push()` e `array.splice()` a cada evento,
// geraria lixo de memória (e trabalho de realocação) constantemente — o
// mesmo problema de performance que já evitamos no renderizador de sprites
// (matriz de modelo reaproveitada) e no loop (dt sem alocar objetos).
//
// Aqui, o array tem tamanho fixo desde o início; "adicionar" ocupa a
// próxima vaga livre, e "removerMortos" tampa o buraco de quem morreu
// movendo o ÚLTIMO item ativo para o lugar dele — O(1) por remoção, sem
// precisar deslocar o array inteiro (o que `splice` faria).

export function criarPool(capacidade) {
  return {
    itens: new Array(capacidade).fill(null),
    quantidade: 0 // quantas posições, a partir do índice 0, estão em uso
  }
}

/** Ocupa a próxima vaga livre. Se a pool estiver cheia, descarta em silêncio
 *  (melhor perder um spawn do que travar o jogo ou crescer sem limite). */
export function adicionar(pool, item) {
  if (pool.quantidade >= pool.itens.length) return false
  pool.itens[pool.quantidade] = item
  pool.quantidade++
  return true
}

/**
 * Remove todo item para o qual `estaVivo(item)` for falso.
 * `estaVivo` é passado de fora (em vez de fixo aqui) porque cada tipo de
 * objeto pode ter uma regra diferente — mas normalmente é `estaViva`, de
 * entidade.js.
 */
export function removerMortos(pool, estaVivo) {
  for (let i = pool.quantidade - 1; i >= 0; i--) {
    if (!estaVivo(pool.itens[i])) {
      pool.quantidade--
      pool.itens[i] = pool.itens[pool.quantidade]
      pool.itens[pool.quantidade] = null
    }
  }
}

/** Chama `fn(item, indice)` para cada item ATIVO (ignora o "lixo" além de `quantidade`). */
export function paraCadaAtivo(pool, fn) {
  for (let i = 0; i < pool.quantidade; i++) fn(pool.itens[i], i)
}

/** Devolve o primeiro item ATIVO para o qual `predicado(item)` é verdadeiro, ou null. */
export function buscarAtivo(pool, predicado) {
  for (let i = 0; i < pool.quantidade; i++) {
    if (predicado(pool.itens[i])) return pool.itens[i]
  }
  return null
}
