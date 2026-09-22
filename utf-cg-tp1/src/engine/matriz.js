// Matrizes 4x4 em Float32Array de 16 posições, no formato COLUMN-MAJOR
// (as 4 primeiras posições são a 1ª coluna, e assim por diante), que é o que
// o WebGL espera em gl.uniformMatrix4fv(loc, false, matriz).

/**
 * Projeção ortogonal (mesma função da aula 4).
 * Mapeia a caixa [esq..dir] x [baixo..topo] x [perto..longe] do MUNDO
 * para o cubo -1..1 do WebGL (coordenadas normalizadas, NDC).
 */
export function ortho(esq, dir, baixo, topo, perto, longe) {
  const tx = -(dir + esq) / (dir - esq)
  const ty = -(topo + baixo) / (topo - baixo)
  const tz = -(longe + perto) / (longe - perto)

  return new Float32Array([
    2 / (dir - esq), 0, 0, 0,
    0, 2 / (topo - baixo), 0, 0,
    0, 0, -2 / (longe - perto), 0,
    tx, ty, tz, 1
  ])
}

/**
 * Matriz de modelo 2D: escala (largura x altura), depois rotação (radianos,
 * anti-horária) e por fim translação para (x, y). Ou seja, M = T · R · S.
 *
 * Escreve o resultado em `saida` (um Float32Array(16) que o chamador reaproveita).
 * Assim, desenhar milhares de sprites por segundo NÃO cria lixo para o
 * coletor de memória do JavaScript.
 */
export function modelo2D(saida, x, y, largura, altura, rotacao) {
  const c = Math.cos(rotacao)
  const s = Math.sin(rotacao)

  // coluna 0: para onde vai o eixo X do quad (escalado por `largura` e girado)
  saida[0] = c * largura
  saida[1] = s * largura
  saida[2] = 0
  saida[3] = 0
  // coluna 1: para onde vai o eixo Y do quad (escalado por `altura` e girado)
  saida[4] = -s * altura
  saida[5] = c * altura
  saida[6] = 0
  saida[7] = 0
  // coluna 2: eixo Z fica como está (o jogo é 2D)
  saida[8] = 0
  saida[9] = 0
  saida[10] = 1
  saida[11] = 0
  // coluna 3: translação (o centro do sprite vai para (x, y))
  saida[12] = x
  saida[13] = y
  saida[14] = 0
  saida[15] = 1
  return saida
}
