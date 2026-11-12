// Espada ligada à pose atual de Levi.
// O eixo local +Z aponta para a direção do ataque.

export function criarPartesEspada(m4, poseLevi) {
  let raiz = m4.translation(poseLevi.posicao);
  raiz = m4.multiply(raiz, m4.yRotation(poseLevi.rotacao[1]));
  raiz = m4.multiply(raiz, m4.xRotation(poseLevi.rotacao[0]));
  raiz = m4.multiply(raiz, m4.zRotation(poseLevi.rotacao[2]));

  const partes = [];

  // Lâmina longa, posicionada à frente de Levi.
  let lamina = m4.multiply(raiz, m4.translation([0, 1.90, 1.25]));
  lamina = m4.multiply(lamina, m4.scaling([0.045, 0.045, 1.48]));

  // Guarda transversal próxima ao punho.
  let guarda = m4.multiply(raiz, m4.translation([0, 1.90, 0.10]));
  guarda = m4.multiply(guarda, m4.scaling([0.22, 0.055, 0.07]));

  // Empunhadura.
  let cabo = m4.multiply(raiz, m4.translation([0, 1.90, -0.08]));
  cabo = m4.multiply(cabo, m4.scaling([0.055, 0.055, 0.28]));

  partes.push(
    { matriz: lamina, cor: [0.72, 0.78, 0.82, 1] },
    { matriz: guarda, cor: [0.22, 0.24, 0.26, 1] },
    { matriz: cabo, cor: [0.25, 0.16, 0.11, 1] }
  );

  return partes;
}
