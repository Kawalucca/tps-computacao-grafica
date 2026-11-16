// Trecho de muralha ao fundo do diorama, construído com cubos texturizados.
// As fiadas desencontradas dão aparência de alvenaria sem uma malha externa.
export function criarMuralha() {
  const pedras = [];
  const madeira = [];
  const tons = [
    [.83, .82, .77, 1], [.77, .77, .73, 1],
    [.87, .85, .80, 1], [.80, .79, .74, 1],
  ];
  const z = -4.25;
  const alturaFiada = .60;

  function bloco(lista, posicao, escala, cor) {
    lista.push({ posicao, escala, rotacao: [0, 0, 0], cor });
  }

  for (let linha = 0; linha < 7; linha++) {
    // As fiadas ímpares começam e terminam com meio bloco.
    const larguras = linha % 2 === 0
      ? Array(8).fill(.75)
      : [.375, ...Array(7).fill(.75), .375];
    let inicio = -3;
    larguras.forEach((largura, coluna) => {
      bloco(pedras, [inicio + largura / 2, alturaFiada * (linha + .5), z],
        [largura - .012, alturaFiada - .012, .38], tons[(linha * 3 + coluna) % tons.length]);
      inicio += largura;
    });
  }

  // Arremate superior e pilares ao redor do portão.
  bloco(pedras, [0, 4.29, z], [6.05, .18, .50], [.83, .82, .77, 1]);
  for (const lado of [-1, 1]) {
    bloco(pedras, [lado * .83, 1.13, -4.01], [.20, 2.26, .18], [.91, .88, .81, 1]);
  }
  bloco(pedras, [0, 2.29, -4.01], [1.86, .20, .18], [.91, .88, .81, 1]);

  // Tábuas escuras sugerem o grande portão de acesso à muralha.
  for (let i = 0; i < 6; i++) {
    bloco(madeira, [-.60 + i * .24, 1.08, -4.01], [.228, 2.12, .10],
      i % 2 ? [.60, .49, .39, 1] : [.68, .55, .42, 1]);
  }
  for (const y of [.55, 1.55]) {
    bloco(madeira, [0, y, -3.94], [1.44, .09, .06], [.40, .37, .31, 1]);
  }
  return { pedras, madeira };
}
