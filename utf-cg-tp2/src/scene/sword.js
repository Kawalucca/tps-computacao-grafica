// Espada ligada à pose atual de Levi.
// O eixo local +Z aponta para a direção do ataque.

export function criarPartesEspada(m4, poseLevi) {
  let raiz = m4.translation(poseLevi.posicao);
  raiz = m4.multiply(raiz, m4.rotationY(poseLevi.rotacao[1]));
  raiz = m4.multiply(raiz, m4.rotationX(poseLevi.rotacao[0]));
  raiz = m4.multiply(raiz, m4.rotationZ(poseLevi.rotacao[2]));

  const partes = [];

  // Uma espada em cada mão, com as mesmas dimensões e inclinação.
  for (const lado of [-1, 1]) {
    let mao = m4.multiply(raiz, m4.translation([lado * 0.35, 1.04, 0.38]));
    mao = m4.multiply(mao, m4.rotationX(-0.42));
    let lamina = m4.multiply(mao, m4.translation([0, 0, 0.815]));
    lamina = m4.multiply(lamina, m4.scaling([0.07, 0.025, 1.40]));

    // Guarda transversal próxima ao punho.
    let guarda = m4.multiply(mao, m4.translation([0, 0, 0.12]));
    guarda = m4.multiply(guarda, m4.scaling([0.22, 0.055, 0.07]));

    // Empunhadura.
    let cabo = m4.multiply(mao, m4.scaling([0.055, 0.055, 0.24]));

    partes.push(
      { matriz: lamina, cor: [0.72, 0.78, 0.82, 1] },
      { matriz: guarda, cor: [0.22, 0.24, 0.26, 1] },
      { matriz: cabo, cor: [0.25, 0.16, 0.11, 1] }
    );
  }

  return partes;
}
