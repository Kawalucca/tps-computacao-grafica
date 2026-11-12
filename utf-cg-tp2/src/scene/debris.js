// Pedras e fragmentos espalhados pelo campo de batalha.
export function criarDestrocos() {
  return [
    {
      posicao: [-1.65, 0.20, 0.35],
      escala: [0.38, 0.25, 0.31],
      rotacao: [0.2, 0.3, 0],
      cor: [0.31, 0.31, 0.30, 1],
    },
    {
      posicao: [-1.18, 0.16, 0.72],
      escala: [0.26, 0.19, 0.23],
      rotacao: [0.4, 0.1, 0.2],
      cor: [0.40, 0.38, 0.35, 1],
    },
    {
      posicao: [0.20, 0.17, 2.45],
      escala: [0.34, 0.21, 0.28],
      rotacao: [0.1, 0.5, 0.1],
      cor: [0.35, 0.34, 0.32, 1],
    },
    {
      posicao: [1.10, 0.14, 1.82],
      escala: [0.22, 0.16, 0.20],
      rotacao: [0, 0, 0],
      cor: [0.43, 0.40, 0.36, 1],
    },
  ];
}

// Vigas de madeira quebradas, representadas por cilindros alongados.
export function criarVigas() {
  return [
    {
      posicao: [0.20, 0.16, 1.45],
      escala: [0.08, 1.25, 0.08],
      rotacao: [0, 0, Math.PI / 2],
      cor: [0.27, 0.19, 0.12, 1],
    },
    {
      posicao: [0.95, 0.14, 2.30],
      escala: [0.07, 0.92, 0.07],
      rotacao: [0.18, 0.2, Math.PI / 2.8],
      cor: [0.34, 0.24, 0.15, 1],
    },
  ];
}
