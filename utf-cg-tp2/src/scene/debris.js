// Pedras e fragmentos espalhados pelo campo de batalha.
export function criarDestrocos() {
  return [
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
    { posicao: [-3.0, .10, .80], escala: [.27, .13, .19], rotacao: [.2, .4, .1], cor: [.40, .38, .34, 1] },
    { posicao: [-2.55, .09, 2.10], escala: [.20, .12, .16], rotacao: [.1, .3, .2], cor: [.47, .44, .39, 1] },
    { posicao: [-.70, .08, 2.85], escala: [.18, .10, .13], rotacao: [.4, .5, .2], cor: [.39, .37, .33, 1] },
    { posicao: [.48, .08, 2.70], escala: [.16, .10, .13], rotacao: [.1, .8, .2], cor: [.44, .41, .36, 1] },
    { posicao: [2.20, .10, 1.25], escala: [.28, .15, .20], rotacao: [.3, .3, .1], cor: [.39, .37, .33, 1] },
    { posicao: [2.95, .09, .65], escala: [.20, .11, .14], rotacao: [.4, .2, .1], cor: [.45, .42, .36, 1] },
    { posicao: [.35, .10, -2.75], escala: [.24, .14, .20], rotacao: [.3, .3, .2], cor: [.40, .38, .34, 1] },
  ];
}

// Posições compartilhadas pelos troncos e pelas copas das árvores.
const arvores = [
  [-4.65, -0.75, 3.20, .30], [-4.05, -2.35, 4.15, .38],
  [-3.65, -3.15, 4.45, .32], [3.65, -3.15, 3.75, .30],
  [4.15, -2.25, 4.25, .37], [4.75, -0.70, 3.50, .31],
];

// Vigas de madeira quebradas, representadas por cilindros alongados.
export function criarVigas() {
  const vigas = [
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
    { posicao: [-2.15, .12, 1.40], escala: [.11, 1.18, .11], rotacao: [.1, -.4, 1.35], cor: [.34, .25, .16, 1] },
    { posicao: [2.35, .10, -.65], escala: [.09, .90, .09], rotacao: [.2, .7, 1.45], cor: [.31, .23, .15, 1] },
  ];

  // Troncos e galhos emolduram a clareira.
  const madeira = [.42, .32, .22, 1];
  for (const [x, z, altura, largura] of arvores) {
    vigas.push({ posicao: [x, altura / 2, z], escala: [largura, altura, largura],
      rotacao: [0, 0, 0], cor: madeira });
    vigas.push({ posicao: [x - .25, altura * .63, z], escala: [largura * .43, 1.05, largura * .43],
      rotacao: [0, 0, .62], cor: madeira });
    vigas.push({ posicao: [x + .24, altura * .78, z], escala: [largura * .38, .95, largura * .38],
      rotacao: [0, 0, -.65], cor: madeira });
  }
  return vigas;
}

// Grupos de folhas sobrepostos criam copas irregulares, sem usar texturas ou
// modelos externos. Cada volume é desenhado com a esfera que já existe na cena.
export function criarCopas() {
  const copas = [];
  const tons = [
    [.20, .38, .16, 1], [.27, .47, .19, 1],
    [.34, .53, .23, 1], [.24, .42, .15, 1],
  ];
  const volumes = [
    [0, 0, 0, .78, .59, .72],
    [-.53, -.22, .04, .57, .48, .56],
    [.52, -.14, -.05, .62, .50, .55],
    [-.12, .27, -.20, .60, .52, .59],
    [.12, -.20, .45, .60, .45, .48],
  ];
  arvores.forEach(([x, z, altura], i) => {
    volumes.forEach(([dx, dy, dz, sx, sy, sz], j) => {
      copas.push({
        posicao: [x + dx, altura + dy, z + dz],
        escala: [sx, sy, sz],
        rotacao: [0, i * .4 + j, 0],
        cor: tons[(i + j) % tons.length],
      });
    });
  });
  return copas;
}

// Folhas de grama triangulares em uma única malha para evitar uma chamada de
// desenho por folha. A distribuição fixa mantém o cenário igual a cada visita.
export function criarGrama() {
  const position = [], normal = [], texcoord = [];
  let semente = 48271;
  function aleatorio() {
    semente = (semente * 16807) % 2147483647;
    return (semente - 1) / 2147483646;
  }
  for (let i = 0; i < 800; i++) {
    const angulo = aleatorio() * Math.PI * 2;
    const raio = 5.25 * Math.sqrt(aleatorio());
    const x = Math.cos(angulo) * raio, z = Math.sin(angulo) * raio;
    const altura = .09 + aleatorio() * .13;
    const largura = .025 + aleatorio() * .025;
    const direcao = aleatorio() * Math.PI;
    // Deixa livre o espaço do bilhete, atrás da muralha.
    if (x > 1.12 && x < 1.98 && z > -5.10 && z < -4.50) continue;
    // Evita grama sobre a chave no chão perto da árvore.
    if (x > -5.04 && x < -4.35 && z > -.18 && z < .16) continue;
    for (let j = 0; j < 3; j++) {
      const a = direcao + j * Math.PI / 3;
      const dx = Math.cos(a) * largura, dz = Math.sin(a) * largura;
      position.push(x - dx, .006, z - dz, x + dx, .006, z + dz,
        x + dx * .45, altura, z + dz * .45);
      for (let k = 0; k < 3; k++) {
        normal.push(0, 1, 0);
        texcoord.push(0, 0);
      }
    }
  }
  return {
    position: { numComponents: 3, data: position },
    normal: { numComponents: 3, data: normal },
    texcoord: { numComponents: 2, data: texcoord },
  };
}
