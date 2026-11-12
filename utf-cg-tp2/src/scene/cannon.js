// Canhão danificado: a base fica fixa e o tubo gira em torno do suporte.
export function criarEstadoCanhao() {
  return {
    tempo: 0,
    angulo: 0,
  };
}

export function atualizarCanhao(estado, delta) {
  estado.tempo += delta;
  estado.angulo = Math.sin(estado.tempo * 0.8) * 0.10;
}

export function obterPartesCanhao(estado, m4) {
  const base = m4.translation([2.55, 0.18, -2.25]);
  const matrizBase = m4.multiply(base, m4.scaling([0.95, 0.36, 0.75]));

  const suporte = m4.translation([2.55, 0.48, -2.25]);
  const matrizSuporte = m4.multiply(suporte, m4.scaling([0.27, 0.27, 0.27]));

  // A matriz do tubo é filha do ponto de articulação do canhão.
  let tubo = m4.translation([2.55, 0.68, -2.25]);
  tubo = m4.multiply(tubo, m4.yRotation(estado.angulo));
  tubo = m4.multiply(tubo, m4.xRotation(Math.PI / 2));
  tubo = m4.multiply(tubo, m4.translation([0, 0, 0.43]));
  tubo = m4.multiply(tubo, m4.scaling([0.14, 0.14, 0.78]));

  return [
    {
      geometria: "cubo",
      matriz: matrizBase,
      cor: [0.25, 0.24, 0.22, 1],
    },
    {
      geometria: "esfera",
      matriz: matrizSuporte,
      cor: [0.34, 0.32, 0.29, 1],
    },
    {
      geometria: "cilindro",
      matriz: tubo,
      cor: [0.19, 0.20, 0.21, 1],
    },
  ];
}
