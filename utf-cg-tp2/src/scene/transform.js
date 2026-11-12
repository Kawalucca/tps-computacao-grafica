// Funções simples para montar matrizes de transformação dos objetos.
export function criarMatrizModelo(m4, posicao, escala, rotacao = [0, 0, 0]) {
  let modelo = m4.translation(posicao);
  modelo = m4.multiply(modelo, m4.rotationY(rotacao[1]));
  modelo = m4.multiply(modelo, m4.rotationX(rotacao[0]));
  modelo = m4.multiply(modelo, m4.rotationZ(rotacao[2]));
  return m4.multiply(modelo, m4.scaling(escala));
}

// Aplica uma transformação local dentro da transformação de um objeto pai.
export function criarMatrizFilha(m4, matrizPai, posicao, escala, rotacao = [0, 0, 0]) {
  const matrizLocal = criarMatrizModelo(m4, posicao, escala, rotacao);
  return m4.multiply(matrizPai, matrizLocal);
}
