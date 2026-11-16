// O cilindro do projeto tem altura 1 no eixo Y e raio 0,5.
// As pontas são definidas no espaço local dos modelos para acompanhar as poses.
export function criarCabo(m4, matrizLevi, matrizZeke) {
  const origem = m4.transformPoint(matrizLevi, [0.56, 0.68, -0.08]);
  const destino = m4.transformPoint(matrizZeke, [-0.32, 2.18, 0.40]);
  const diferenca = destino.map((valor, i) => valor - origem[i]);
  const comprimento = Math.hypot(...diferenca);
  if (comprimento < 0.0001) return null;

  const eixoY = diferenca.map((valor) => valor / comprimento);
  // Um vetor auxiliar diferente evita degeneração quando o cabo aponta em Z.
  const referencia = Math.abs(eixoY[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  let eixoX = [
    referencia[1] * eixoY[2] - referencia[2] * eixoY[1],
    referencia[2] * eixoY[0] - referencia[0] * eixoY[2],
    referencia[0] * eixoY[1] - referencia[1] * eixoY[0],
  ];
  const norma = Math.hypot(...eixoX);
  eixoX = eixoX.map((valor) => valor / norma);
  const eixoZ = [
    eixoX[1] * eixoY[2] - eixoX[2] * eixoY[1],
    eixoX[2] * eixoY[0] - eixoX[0] * eixoY[2],
    eixoX[0] * eixoY[1] - eixoX[1] * eixoY[0],
  ];
  const centro = origem.map((valor, i) => (valor + destino[i]) / 2);
  const espessura = 0.025;
  const matriz = new Float32Array([
    ...eixoX.map((valor) => valor * espessura), 0,
    ...eixoY.map((valor) => valor * comprimento), 0,
    ...eixoZ.map((valor) => valor * espessura), 0,
    ...centro, 1,
  ]);
  return { matriz, destino };
}
