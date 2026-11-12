// Geometrias básicas do diorama.
// O eixo Y representa a altura; o chão fica no plano XZ.

export function criarDisco(raio, segmentos) {
  const position = [0, 0, 0];
  const normal = [0, 1, 0];
  const texcoord = [0.5, 0.5];
  const indices = [];

  for (let i = 0; i <= segmentos; i++) {
    const angulo = (i / segmentos) * Math.PI * 2;
    const x = Math.cos(angulo);
    const z = Math.sin(angulo);

    position.push(raio * x, 0, raio * z);
    normal.push(0, 1, 0);
    texcoord.push(0.5 + 0.5 * x, 0.5 + 0.5 * z);
  }

  for (let i = 0; i < segmentos; i++) {
    // A ordem dos vértices mantém a face do disco voltada para cima (+Y).
    indices.push(0, i + 2, i + 1);
  }

  return {
    position: { numComponents: 3, data: position },
    normal: { numComponents: 3, data: normal },
    texcoord: { numComponents: 2, data: texcoord },
    indices: { numComponents: 3, data: indices },
  };
}

// Metade inferior de uma esfera; sua borda superior coincide com o plano do chão.
export function criarHemisferio(raio, segmentos, faixas) {
  const position = [];
  const normal = [];
  const texcoord = [];
  const indices = [];
  const colunas = segmentos + 1;

  for (let j = 0; j <= faixas; j++) {
    const phi = (j / faixas) * (Math.PI / 2);
    const y = -raio * Math.cos(phi);
    const anel = raio * Math.sin(phi);

    for (let i = 0; i <= segmentos; i++) {
      const theta = (i / segmentos) * Math.PI * 2;
      const x = anel * Math.cos(theta);
      const z = anel * Math.sin(theta);

      position.push(x, y, z);
      normal.push(x / raio, y / raio, z / raio);
      texcoord.push(i / segmentos, j / faixas);
    }
  }

  for (let j = 0; j < faixas; j++) {
    for (let i = 0; i < segmentos; i++) {
      const a = j * colunas + i;
      const b = a + 1;
      const c = a + colunas;
      const d = c + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  return {
    position: { numComponents: 3, data: position },
    normal: { numComponents: 3, data: normal },
    texcoord: { numComponents: 2, data: texcoord },
    indices: { numComponents: 3, data: indices },
  };
}
