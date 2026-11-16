// Pequenos objetos de suprimentos e lembranças da história, montados com
// os mesmos cubos, cilindros e esferas usados no restante do diorama.
export function criarEasterEggs() {
  const cubos = [], cilindros = [], esferas = [];
  const madeira = [.38, .25, .14, 1];
  const madeiraClara = [.57, .40, .24, 1];
  const ferragem = [.27, .25, .22, 1];

  function cubo(posicao, escala, cor, rotacao = [0, 0, 0]) {
    cubos.push({ posicao, escala, cor, rotacao });
  }
  function cilindro(posicao, escala, cor, rotacao = [0, 0, 0]) {
    cilindros.push({ posicao, escala, cor, rotacao });
  }

  function caixa(x, z) {
    cubo([x, .25, z], [.82, .50, .68], madeira);
    // Tábuas e duas diagonais no lado voltado para o observador.
    for (const dx of [-.34, 0, .34])
      cubo([x + dx, .25, z + .346], [.045, .49, .028], madeiraClara);
    for (const sinal of [-1, 1])
      cubo([x, .25, z + .365], [.72, .045, .035], madeiraClara,
        [0, 0, sinal * .55]);
    for (const dz of [-.27, .27])
      cubo([x, .505, z + dz], [.80, .022, .038], ferragem);
  }

  caixa(3.55, 2.65);

  // Diário de Grisha inclinado contra a árvore; a chave está no chão à frente.
  const livroX = -4.65;
  const inclinacao = [-.30, 0, 0];
  cubo([livroX, .25, -.51], [.38, .47, .025], [.28, .12, .09, 1], inclinacao);
  cubo([livroX, .258, -.482], [.35, .44, .032], [.80, .76, .62, 1], inclinacao);
  cubo([livroX, .267, -.457], [.38, .47, .013], [.36, .15, .11, 1], inclinacao);
  const ouro = [.82, .66, .24, 1];
  const chaveX = -4.82, chaveZ = -.02;
  const raio = .0525, segmentos = 12;
  for (let i = 0; i < segmentos; i++) {
    const a = i * Math.PI * 2 / segmentos;
    const b = (i + 1) * Math.PI * 2 / segmentos;
    const x1 = chaveX + Math.cos(a) * raio, z1 = chaveZ + Math.sin(a) * raio;
    const x2 = chaveX + Math.cos(b) * raio, z2 = chaveZ + Math.sin(b) * raio;
    cubo([(x1 + x2) / 2, .02, (z1 + z2) / 2],
      [Math.hypot(x2 - x1, z2 - z1) + .007, .013, .013], ouro,
      [0, -Math.atan2(z2 - z1, x2 - x1), 0]);
  }
  cubo([chaveX + .14, .02, chaveZ], [.182, .013, .018], ouro);
  cubo([chaveX + .217, .02, chaveZ + .026], [.018, .013, .063], ouro);
  cubo([chaveX + .175, .02, chaveZ + .021], [.015, .013, .053], ouro);

  // Batata da Sasha e uma garrafa de vinho, referência ao plano de Zeke.
  esferas.push({ posicao: [3.73, .625, 2.65], escala: [.20, .12, .14],
    rotacao: [0, -.3, .15], cor: [.57, .36, .16, 1] });
  cilindro([3.31, .72, 2.65], [.20, .42, .20], [.14, .23, .15, 1]);
  cilindro([3.31, .96, 2.65], [.09, .14, .09], [.14, .23, .15, 1]);
  cilindro([3.31, 1.04, 2.65], [.10, .025, .10], [.51, .34, .18, 1]);
  cubo([3.31, .74, 2.756], [.17, .14, .012], [.68, .57, .42, 1]);

  // Lenço vermelho de Mikasa dobrado sobre um galho da árvore à direita.
  const vermelho = [.61, .10, .10, 1];
  const vermelhoEscuro = [.43, .06, .07, 1];
  cubo([4.38, 2.42, -.70], [.28, .08, .27], vermelho);
  cubo([4.35, 2.06, -.56], [.20, .72, .065], vermelho, [0, 0, -.05]);
  cubo([4.41, 2.01, -.84], [.18, .82, .065], vermelhoEscuro, [0, 0, .06]);
  for (const dx of [-.065, 0, .065]) {
    cubo([4.35 + dx, 1.66, -.56], [.025, .12, .055], vermelho);
  }

  return { cubos, cilindros, esferas };
}
