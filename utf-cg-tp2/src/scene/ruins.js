// Alvenaria irregular nas bordas da clareira. Cada pedra continua sendo um
// cubo transformado e texturizado, como os demais solidos da cena.
export function criarRuinas() {
  const pedras = [];
  const tons = [
    [0.50, 0.47, 0.40, 1], [0.42, 0.40, 0.36, 1],
    [0.55, 0.51, 0.43, 1], [0.45, 0.43, 0.38, 1],
  ];

  function bloco(x, y, z, largura, altura, profundidade, rotacao, tom) {
    pedras.push({
      posicao: [x, y, z], escala: [largura, altura, profundidade],
      rotacao: [0, rotacao, 0], cor: tons[tom % tons.length],
    });
  }

  // Muro parcialmente derrubado ao fundo, com fiadas desencontradas.
  const fiadas = [
    [[-3.15, .15, -2.10, .54], [-2.59, .15, -2.10, .54], [-2.03, .15, -2.10, .54]],
    [[-3.02, .45, -2.10, .54], [-2.46, .45, -2.10, .54], [-1.97, .45, -2.10, .40]],
    [[-3.18, .75, -2.10, .42], [-2.69, .75, -2.10, .54], [-2.19, .75, -2.10, .42]],
    [[-3.08, 1.05, -2.10, .48], [-2.58, 1.05, -2.10, .48]],
    [[-3.12, 1.35, -2.10, .40]],
  ];
  fiadas.forEach((fiada, linha) => fiada.forEach(([x, y, z, largura], coluna) => {
    bloco(x, y, z, largura, .285, .43, (coluna - 1) * .025, linha + coluna);
  }));

  // Pedras caidas quebram o contorno regular da parede.
  bloco(-3.48, .12, -1.67, .55, .24, .35, -.35, 1);
  bloco(-2.62, .14, -1.55, .45, .27, .33, .42, 2);
  bloco(-1.88, .12, -1.73, .36, .22, .32, -.27, 0);
  bloco(1.28, .17, -2.83, .72, .34, .44, -.35, 1);
  bloco(1.83, .13, -2.85, .45, .26, .37, .20, 2);
  bloco(1.46, .42, -2.83, .47, .23, .40, -.23, 3);
  return pedras;
}
